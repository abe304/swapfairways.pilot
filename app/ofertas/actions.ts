"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatFecha, formatHora } from "@/lib/utils";
import { sendEmail, nuevaSolicitudEmailHtml } from "@/lib/email";

export async function createOffer(_prevState: unknown, formData: FormData) {
  const profile = await requireProfile();

  const club_id = String(formData.get("club_id") ?? "");
  const flexible = formData.get("fecha_flexible") === "on";
  const fechas = formData.getAll("fechas").map(String).filter(Boolean);
  const hora = String(formData.get("hora") ?? "");
  const pases_disponibles = Number(formData.get("pases_disponibles") ?? 1);
  const caddie_incluido = formData.get("caddie_incluido") === "on";
  const carrito_compartido = formData.get("carrito_compartido") === "on";
  const costoRaw = String(formData.get("costo_estimado") ?? "").trim();
  const nota = String(formData.get("nota") ?? "").trim();

  if (!club_id) {
    return { error: "Selecciona un club." };
  }
  if (!flexible && fechas.length === 0) {
    return { error: "Agrega al menos una fecha, o marca disponibilidad flexible." };
  }
  if (!flexible && !hora) {
    return { error: "La hora es obligatoria si no es disponibilidad flexible." };
  }
  if (!pases_disponibles || pases_disponibles < 1) {
    return { error: "Debes ofrecer al menos 1 pase." };
  }
  if (!profile.club_id) {
    return {
      error: "Completa tu club en tu perfil antes de publicar una oferta.",
    };
  }

  const costo_estimado = costoRaw ? Number(costoRaw) : 0;
  if (costoRaw && Number.isNaN(costo_estimado)) {
    return { error: "El costo estimado debe ser un número." };
  }

  const base = {
    host_id: profile.id,
    club_id,
    pases_disponibles,
    caddie_incluido,
    carrito_compartido,
    costo_estimado,
    nota: nota || null,
  };

  const supabase = await createClient();

  // Fecha flexible: una sola oferta sin fecha/hora fija, a coordinar con
  // quien solicite unirse. Fecha fija: una oferta POR cada fecha elegida
  // (multi-select), mismos parámetros y misma hora para todas.
  const rows = flexible
    ? [{ ...base, fecha_flexible: true }]
    : fechas.map((fecha) => ({ ...base, fecha, hora, fecha_flexible: false }));

  const { data, error } = await supabase
    .from("tee_time_offers")
    .insert(rows)
    .select("id")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return { error: "No pudimos publicar tu oferta. Intenta de nuevo." };
  }

  revalidatePath("/ofertas");
  if (data.length === 1) {
    redirect(`/ofertas/${data[0].id}`);
  }
  redirect("/mis-rondas");
}

export async function solicitarUnion(offerId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_join_request", {
    p_offer_id: offerId,
  });

  revalidatePath(`/ofertas/${offerId}`);
  revalidatePath("/mis-rondas");

  if (error) {
    return { error: error.message };
  }

  try {
    await notificarAnfitrion(offerId, profile.nombre);
  } catch (err) {
    console.error("[solicitarUnion] No se pudo notificar al anfitrión:", err);
  }

  return { success: true };
}

// Best-effort: si falla (Resend/service role no configurados, modo demo,
// etc.) no debe afectar la solicitud que ya se guardó exitosamente.
async function notificarAnfitrion(offerId: string, guestNombre: string) {
  const supabase = await createClient();
  const { data: offer } = await supabase
    .from("tee_time_offers")
    .select("host_id, fecha, hora, fecha_flexible, clubs(nombre)")
    .eq("id", offerId)
    .single();
  if (!offer) return;

  const club = (offer as unknown as { clubs: { nombre: string } | null }).clubs;
  const { data: hostProfile } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", offer.host_id)
    .single();
  if (!hostProfile) return;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(offer.host_id);
  const hostEmail = authUser?.user?.email;
  if (!hostEmail) return;

  const fechaLabel =
    offer.fecha_flexible || !offer.fecha || !offer.hora
      ? "fecha a coordinar"
      : `${formatFecha(offer.fecha)} · ${formatHora(offer.hora)}`;

  await sendEmail({
    to: hostEmail,
    subject: `Nueva solicitud para tu ronda en ${club?.nombre ?? "tu club"}`,
    html: nuevaSolicitudEmailHtml({
      hostNombre: hostProfile.nombre,
      guestNombre,
      clubNombre: club?.nombre ?? "tu club",
      fechaLabel,
    }),
  });
}
