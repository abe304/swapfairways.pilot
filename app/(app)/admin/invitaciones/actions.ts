"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generarCodigo, enlaceInvitacion } from "@/lib/invites";
import { getSiteUrl, CONTACT_EMAIL } from "@/lib/site";
import { invitacionEmailHtml, sendEmail } from "@/lib/email";

export type CodigoCreado = {
  codigo: string;
  etiqueta: string;
  email: string | null;
  enlace: string;
  correo: "enviado" | "omitido" | "sin_email";
};

const MAX_POR_LOTE = 50;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function setInviteRequired(formData: FormData) {
  await requireAdmin();
  const activar = formData.get("valor") === "true";
  const supabase = await createClient();
  await supabase
    .from("app_settings")
    .update({ value: activar ? "true" : "false", updated_at: new Date().toISOString() })
    .eq("key", "invite_required");
  revalidatePath("/admin/invitaciones");
  revalidatePath("/registro");
}

export async function setRecompensa(formData: FormData) {
  await requireAdmin();
  const n = Math.max(0, Math.min(10, Math.floor(Number(formData.get("recompensa") ?? 1))));
  const supabase = await createClient();
  await supabase
    .from("app_settings")
    .update({ value: String(Number.isNaN(n) ? 1 : n), updated_at: new Date().toISOString() })
    .eq("key", "recompensa_referido");
  revalidatePath("/admin/invitaciones");
}

// Una persona por línea: "Nombre, correo@ejemplo.com" (el correo es opcional).
export async function crearCodigosFundadores(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin();
  const lista = String(formData.get("lista") ?? "");
  const enviar = formData.get("enviar") === "on";

  const lineas = lista
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lineas.length === 0) return { error: "Escribe al menos una persona (una por línea)." };
  if (lineas.length > MAX_POR_LOTE) return { error: `Máximo ${MAX_POR_LOTE} personas por lote.` };

  const personas: { etiqueta: string; email: string | null }[] = [];
  for (const linea of lineas) {
    const [nombre, correo] = linea.split(/[,;\t]/).map((p) => p.trim());
    if (!nombre) return { error: `La línea "${linea}" no tiene nombre.` };
    if (correo && !EMAIL_RE.test(correo)) {
      return { error: `El correo "${correo}" no parece válido (línea: "${linea}").` };
    }
    personas.push({ etiqueta: nombre, email: correo || null });
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const creados: CodigoCreado[] = [];

  for (const persona of personas) {
    let codigo = "";
    let insertado = false;
    for (let intento = 0; intento < 5 && !insertado; intento++) {
      codigo = generarCodigo();
      const { error } = await supabase.from("codigos_invitacion").insert({
        codigo,
        tipo: "fundador",
        etiqueta: persona.etiqueta,
        email: persona.email,
        usos_maximos: 1,
        creado_por: admin.id,
      });
      if (!error) insertado = true;
      else if (!/duplicate|unique/i.test(error.message)) {
        return {
          error: `No pudimos crear el código para ${persona.etiqueta} (${error.message}).`,
          creados,
        };
      }
    }
    if (!insertado) return { error: "No pudimos generar un código único. Intenta de nuevo.", creados };

    const enlace = enlaceInvitacion(siteUrl, codigo);
    let correo: CodigoCreado["correo"] = persona.email ? "omitido" : "sin_email";
    if (enviar && persona.email) {
      await sendEmail({
        to: persona.email,
        subject: "Tu invitación a SwapFairways",
        html: invitacionEmailHtml({
          nombre: persona.etiqueta,
          codigo,
          enlace,
          remitente: CONTACT_EMAIL,
        }),
      });
      correo = "enviado";
    }
    creados.push({ codigo, etiqueta: persona.etiqueta, email: persona.email, enlace, correo });
  }

  revalidatePath("/admin/invitaciones");
  return { creados };
}

export async function reenviarInvitacion(formData: FormData) {
  await requireAdmin();
  const codigo = String(formData.get("codigo") ?? "");
  const supabase = await createClient();
  const { data } = await supabase
    .from("codigos_invitacion")
    .select("codigo, etiqueta, email, activo")
    .eq("codigo", codigo)
    .maybeSingle();
  if (!data?.email || !data.activo) return;
  const enlace = enlaceInvitacion(await getSiteUrl(), data.codigo);
  await sendEmail({
    to: data.email,
    subject: "Tu invitación a SwapFairways",
    html: invitacionEmailHtml({ nombre: data.etiqueta, codigo: data.codigo, enlace, remitente: CONTACT_EMAIL }),
  });
}

export async function desactivarCodigo(formData: FormData) {
  await requireAdmin();
  const codigo = String(formData.get("codigo") ?? "");
  const supabase = await createClient();
  await supabase.from("codigos_invitacion").update({ activo: false }).eq("codigo", codigo);
  revalidatePath("/admin/invitaciones");
}
