// Ejecuta una acción que el fundador aprobó en la cola. Solo los correos se
// mandan solos (Resend); WhatsApp, Instagram, publicaciones y gasto los hace
// Abraham con el texto aprobado y luego los marca como hechos.
import { escapeHtml, sendEmail } from "@/lib/email";
import { MOCK_MODE } from "@/lib/mock/is-mock";
import type { AgenteAccion } from "@/lib/supabase/types";

const VERDE = "#0E2B20";
const CREMA = "#FAF8F5";

function htmlCorreo(cuerpo: string) {
  const parrafos = cuerpo
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return `<div style="background:${CREMA};padding:24px 12px;"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px 24px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:${VERDE};">${parrafos}</div></div>`;
}

async function correoDeSocio(userId: string) {
  if (MOCK_MODE) {
    const { store } = await import("@/lib/mock/store");
    return store.authUsers.find((u) => u.id === userId)?.email ?? null;
  }
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data } = await createAdminClient().auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

export async function ejecutarAccion(
  a: Pick<AgenteAccion, "tipo" | "destinatario" | "user_id" | "asunto" | "cuerpo">,
): Promise<{ estado: "ejecutada" | "aprobada" | "fallida"; resultado: string }> {
  if (a.tipo !== "correo") {
    return { estado: "aprobada", resultado: "Aprobada: mándala tú con el texto aprobado y márcala como hecha." };
  }
  const to = a.user_id ? await correoDeSocio(a.user_id) : a.destinatario?.trim();
  if (!to || !to.includes("@")) return { estado: "fallida", resultado: "No hay un correo válido para el destinatario." };
  const res = await sendEmail({
    to,
    subject: a.asunto?.trim() || "SwapFairways",
    html: htmlCorreo(a.cuerpo),
    fromName: "Abraham de SwapFairways",
  });
  return res.ok
    ? { estado: "ejecutada", resultado: `Correo enviado a ${to}.` }
    : { estado: "fallida", resultado: `No se envió: ${res.error}` };
}
