// Envío de emails transaccionales via Resend (https://resend.com).
// Completamente opcional: si RESEND_API_KEY no está configurada, se
// omite el envío sin romper el flujo que lo dispara — un email de
// notificación que no llega no debe bloquear una acción real del piloto
// (aprobar/solicitar/etc).
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "SwapFairways <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    console.log(`[email] RESEND_API_KEY no configurada, se omite: "${subject}" a ${to}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      console.error("[email] Resend devolvió un error:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[email] No se pudo enviar el correo:", err);
  }
}

export function nuevaSolicitudEmailHtml(params: {
  hostNombre: string;
  guestNombre: string;
  clubNombre: string;
  fechaLabel: string;
}) {
  return `
    <div style="font-family: sans-serif; color: #0E2B20;">
      <h2>¡Nueva solicitud en SwapFairways!</h2>
      <p>Hola ${params.hostNombre},</p>
      <p><strong>${params.guestNombre}</strong> solicitó unirse a tu ronda en <strong>${params.clubNombre}</strong> (${params.fechaLabel}).</p>
      <p>Entra a la app para aprobar o rechazar la solicitud.</p>
    </div>
  `;
}
