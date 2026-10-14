"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatFecha, formatHora } from "@/lib/utils";
import { sendEmail, solicitudAprobadaEmailHtml, googleCalendarLink } from "@/lib/email";

async function callRpc(fn: "approve_request" | "reject_request" | "mark_request_played", requestId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, { p_request_id: requestId });
  revalidatePath("/mis-rondas");
  revalidatePath("/ofertas");
  revalidatePath("/creditos");
  if (error) return { error: error.message };
  return { success: true };
}

export async function approveRequest(requestId: string) {
  const result = await callRpc("approve_request", requestId);
  if (result.error) return result;

  try {
    await notificarSolicitudAprobada(requestId);
  } catch (err) {
    console.error("[approveRequest] No se pudo notificar al invitado:", err);
  }

  return result;
}

export async function rejectRequest(requestId: string) {
  return callRpc("reject_request", requestId);
}

export async function markPlayed(requestId: string) {
  return callRpc("mark_request_played", requestId);
}

// Best-effort: si falla (Resend/service role no configurados, modo demo,
// etc.) no debe afectar la aprobación que ya se guardó exitosamente.
async function notificarSolicitudAprobada(requestId: string) {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("requests")
    .select(
      "guest_id, tee_time_offers(host_id, fecha, hora, fecha_flexible, nota, clubs(nombre, direccion))",
    )
    .eq("id", requestId)
    .single();
  if (!request) return;

  const offer = (
    request as unknown as {
      tee_time_offers: {
        host_id: string;
        fecha: string | null;
        hora: string | null;
        fecha_flexible: boolean;
        nota: string | null;
        clubs: { nombre: string; direccion: string | null } | null;
      } | null;
    }
  ).tee_time_offers;
  if (!offer) return;

  const club = offer.clubs;

  const [{ data: hostProfile }, { data: guestProfile }] = await Promise.all([
    supabase.from("profiles").select("nombre").eq("id", offer.host_id).single(),
    supabase.from("profiles").select("nombre").eq("id", request.guest_id).single(),
  ]);
  if (!hostProfile || !guestProfile) return;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(request.guest_id);
  const guestEmail = authUser?.user?.email;
  if (!guestEmail) return;

  const tieneFechaFija = !offer.fecha_flexible && offer.fecha && offer.hora;
  const fechaLabel = tieneFechaFija
    ? `${formatFecha(offer.fecha!)} · ${formatHora(offer.hora!)}`
    : "fecha a coordinar con el anfitrión";

  const calendarLink = tieneFechaFija
    ? googleCalendarLink({
        title: `Ronda de golf en ${club?.nombre ?? "SwapFairways"}`,
        location: club?.direccion ?? club?.nombre ?? "",
        description: offer.nota || "Ronda coordinada a través de SwapFairways.",
        fecha: offer.fecha!,
        hora: offer.hora!,
      })
    : null;

  await sendEmail({
    to: guestEmail,
    subject: `¡Confirmado! Tu ronda en ${club?.nombre ?? "el club"}`,
    html: solicitudAprobadaEmailHtml({
      guestNombre: guestProfile.nombre,
      hostNombre: hostProfile.nombre,
      clubNombre: club?.nombre ?? "el club",
      fechaLabel,
      calendarLink,
    }),
  });
}
