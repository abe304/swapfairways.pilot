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

// México eliminó el horario de verano en 2022 — casi todo el país (incluida
// la zona centro, donde está la mayoría del catálogo) queda en UTC-6 todo
// el año. Es una aproximación: Baja California (UTC-8) y Quintana Roo
// (UTC-5) quedarán con la hora ligeramente corrida en el evento de
// calendario — aceptable para el piloto, se puede afinar por club después.
const MEXICO_UTC_OFFSET_HOURS = 6;

function fechaHoraToUtc(fecha: string, hora: string) {
  const naive = new Date(`${fecha}T${hora}:00Z`);
  return new Date(naive.getTime() + MEXICO_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

function formatIcsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function googleCalendarLink(params: {
  title: string;
  location: string;
  description: string;
  fecha: string;
  hora: string;
  duracionHoras?: number;
}) {
  const start = fechaHoraToUtc(params.fecha, params.hora);
  const end = new Date(start.getTime() + (params.duracionHoras ?? 4.5) * 60 * 60 * 1000);
  const qs = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${formatIcsDate(start)}/${formatIcsDate(end)}`,
    details: params.description,
    location: params.location,
  });
  return `https://calendar.google.com/calendar/render?${qs.toString()}`;
}

export function solicitudAprobadaEmailHtml(params: {
  guestNombre: string;
  hostNombre: string;
  clubNombre: string;
  fechaLabel: string;
  calendarLink: string | null;
}) {
  return `
    <div style="font-family: sans-serif; color: #0E2B20;">
      <h2>¡Tu ronda quedó confirmada!</h2>
      <p>Hola ${params.guestNombre},</p>
      <p><strong>${params.hostNombre}</strong> aprobó tu solicitud para jugar en <strong>${params.clubNombre}</strong> (${params.fechaLabel}).</p>
      <p>Entra a la app para ver el punto de encuentro y el contacto del anfitrión.</p>
      ${
        params.calendarLink
          ? `<p><a href="${params.calendarLink}" style="display:inline-block;background:#C5A059;color:#0E2B20;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold;">Agregar a Google Calendar</a></p>`
          : ""
      }
    </div>
  `;
}
