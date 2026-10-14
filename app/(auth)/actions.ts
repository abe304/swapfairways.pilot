"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizarCodigo } from "@/lib/invites";

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
