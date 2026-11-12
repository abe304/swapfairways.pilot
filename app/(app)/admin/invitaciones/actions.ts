"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { enlaceInvitacion, normalizarTelefono } from "@/lib/invites";
import { crearCodigoFundador, type CodigoCreado } from "@/lib/fundadores";
import { getSiteUrl, CONTACT_EMAIL } from "@/lib/site";
import { invitacionEmailHtml, sendEmail } from "@/lib/email";


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

// Una persona por línea: "Nombre, correo o teléfono". Se pueden poner los dos
// ("Nombre, correo, teléfono") en cualquier orden, o ninguno.
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

  const personas: { etiqueta: string; email: string | null; telefono: string | null }[] = [];
  for (const linea of lineas) {
    const [nombre, ...contactos] = linea.split(/[,;\t]/).map((p) => p.trim());
    if (!nombre) return { error: `La línea "${linea}" no tiene nombre.` };
    let email: string | null = null;
    let telefono: string | null = null;
    for (const dato of contactos.filter(Boolean)) {
      if (dato.includes("@")) {
        if (!EMAIL_RE.test(dato)) {
          return { error: `El correo "${dato}" no parece válido (línea: "${linea}").` };
        }
        email = dato;
      } else {
        const tel = normalizarTelefono(dato);
        if (!tel) {
          return {
            error: `"${dato}" no parece un correo ni un teléfono de 10 dígitos (línea: "${linea}").`,
          };
        }
        telefono = tel;
      }
    }
    personas.push({ etiqueta: nombre, email, telefono });
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const creados: CodigoCreado[] = [];

  for (const persona of personas) {
    const res = await crearCodigoFundador(supabase, { adminId: admin.id, siteUrl, persona, enviar });
    if ("error" in res) return { error: res.error, creados };
    creados.push(res.creado);
  }

  revalidatePath("/admin/invitaciones");
  return { creados };
}

export type ReenvioState = { ok: true } | { error: string } | undefined;

export async function reenviarInvitacion(_prev: ReenvioState, formData: FormData): Promise<ReenvioState> {
  await requireAdmin();
  const codigo = String(formData.get("codigo") ?? "");
  const supabase = await createClient();
  const { data } = await supabase
    .from("codigos_invitacion")
    .select("codigo, etiqueta, email, activo")
    .eq("codigo", codigo)
    .maybeSingle();
  if (!data) return { error: "No se encontró el código." };
  if (!data.activo) return { error: "El código está desactivado." };
  if (!data.email) return { error: "Este código no tiene correo." };
  const enlace = enlaceInvitacion(await getSiteUrl(), data.codigo);
  const res = await sendEmail({
    to: data.email,
    subject: "Tu invitación a SwapFairways",
    html: invitacionEmailHtml({ nombre: data.etiqueta, codigo: data.codigo, enlace, remitente: CONTACT_EMAIL }),
  });
  return res.ok ? { ok: true } : { error: res.error };
}

export async function desactivarCodigo(formData: FormData) {
  await requireAdmin();
  const codigo = String(formData.get("codigo") ?? "");
  const supabase = await createClient();
  await supabase.from("codigos_invitacion").update({ activo: false }).eq("codigo", codigo);
  revalidatePath("/admin/invitaciones");
}
