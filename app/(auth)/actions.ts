"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizarCodigo, normalizarTelefono } from "@/lib/invites";
import { getSiteUrl, CONTACT_EMAIL } from "@/lib/site";
import { sendEmail } from "@/lib/email";

// Solo rutas internas: evita que ?redirectTo= mande a un sitio externo.
function destinoSeguro(destino: string) {
  return destino.startsWith("/") && !destino.startsWith("//") ? destino : "/ofertas";
}

export async function signIn(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/ofertas");

  if (!email || !password) {
    return { error: "Ingresa tu email y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  redirect(destinoSeguro(redirectTo));
}

export async function signUp(_prevState: unknown, formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const codigo = normalizarCodigo(formData.get("codigo"));

  if (!nombre || !email || !password) {
    return { error: "Completa nombre, email y contraseña." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();

  // Código de invitación: obligatorio solo si el administrador lo activó
  // (app_settings.invite_required). Si lo escriben, siempre se valida.
  const { data: ajuste } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "invite_required")
    .maybeSingle();
  const requerido = ajuste?.value === "true";

  if (requerido && !codigo) {
    return { error: "El registro es solo por invitación. Pídele un código a un socio de SwapFairways." };
  }
  if (codigo) {
    const { data: validacion } = await supabase.rpc("validar_codigo_invitacion", {
      p_codigo: codigo,
    });
    if (!validacion?.[0]?.valido) {
      return { error: "Ese código de invitación no es válido o ya se usó. Revísalo e inténtalo de nuevo." };
    }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, ...(codigo ? { codigo_invitacion: codigo } : {}) } },
  });

  if (error) {
    console.error("[signUp] Supabase error:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Ya existe una cuenta con ese email." };
    }
    if (error.message.toLowerCase().includes("invitación")) {
      return { error: "Se requiere un código de invitación válido para registrarte." };
    }
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  }

  redirect("/perfil?bienvenida=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Recuperar contraseña: Supabase manda un correo con un enlace de un solo uso
// que lleva a /auth/confirm y de ahí a /restablecer. La respuesta es la misma
// exista o no la cuenta, para no revelar qué correos están registrados.
export async function solicitarRecuperacion(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Escribe el correo con el que te registraste." };

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/restablecer`,
  });

  if (error) {
    console.error("[recuperar] Supabase error:", { message: error.message, status: error.status });
    if (error.status === 429) {
      return { error: "Pediste demasiados enlaces seguidos. Espera unos minutos e inténtalo de nuevo." };
    }
  }
  return { enviado: true };
}

export async function actualizarContrasena(_prevState: unknown, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmacion = String(formData.get("confirmacion") ?? "");

  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== confirmacion) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "El enlace ya expiró. Pide uno nuevo en «¿Olvidaste tu contraseña?»." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[restablecer] Supabase error:", { message: error.message, code: error.code });
    if (error.code === "same_password") {
      return { error: "La nueva contraseña debe ser distinta a la anterior." };
    }
    return { error: "No pudimos cambiar tu contraseña. Intenta de nuevo." };
  }

  redirect("/perfil?contrasena=1");
}

export type SolicitudState =
  | { ok: "nuevo" | "actualizado" | "ya_registrado" }
  | { error: string }
  | undefined;

// Lista de espera: quien no tiene código deja sus datos (registro solo por
// invitación). Se guardan con la función solicitar_invitacion() (0017) y se
// avisa por correo al administrador si hay correo de contacto configurado.
export async function solicitarInvitacion(_prev: SolicitudState, formData: FormData): Promise<SolicitudState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefonoRaw = String(formData.get("telefono") ?? "").trim();
  const club = String(formData.get("club") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();

  if (!nombre || !email) return { error: "Escribe tu nombre y tu correo." };
  let telefono: string | null = null;
  if (telefonoRaw) {
    telefono = normalizarTelefono(telefonoRaw);
    if (!telefono) return { error: "El celular debe tener 10 dígitos (por ejemplo 55 1234 5678)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("solicitar_invitacion", {
    p_nombre: nombre,
    p_email: email,
    p_telefono: telefono,
    p_club: club || null,
    p_mensaje: mensaje || null,
  });
  if (error) {
    console.error("[lista-espera] Supabase error:", error.message);
    if (/correo|nombre/i.test(error.message)) return { error: error.message };
    return { error: "No pudimos guardar tus datos. Intenta de nuevo en unos minutos." };
  }

  const resultado = (data ?? "nuevo") as "nuevo" | "actualizado" | "ya_registrado";
  if (resultado === "nuevo" && CONTACT_EMAIL) {
    const siteUrl = await getSiteUrl();
    const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await sendEmail({
      to: CONTACT_EMAIL,
      subject: `Nueva solicitud de invitación: ${nombre}`,
      html: `<p><strong>${esc(nombre)}</strong> pidió una invitación a SwapFairways.</p>
        <p>Correo: ${esc(email)}<br>Celular: ${esc(telefonoRaw || "—")}<br>Club: ${esc(club || "—")}</p>
        ${mensaje ? `<p>Mensaje: ${esc(mensaje)}</p>` : ""}
        <p><a href="${siteUrl}/admin/lista-espera">Ver la lista de espera</a></p>`,
    });
  }
  return { ok: resultado };
}
