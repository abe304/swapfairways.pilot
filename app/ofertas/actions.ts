"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatFecha, formatHora } from "@/lib/utils";
import { sendEmail, nuevaSolicitudEmailHtml } from "@/lib/email";
import { insertOffers, parseCostos, totalCostos } from "@/lib/offers";

// Fecha de hoy en hora del centro de México (UTC-6, sin horario de verano):
// el servidor corre en UTC y "hoy" para el socio no es el "hoy" del servidor
// después de las 6pm.
function hoyEnMexico() {
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const MAX_PASES = 3;

export async function createOffer(_prevState: unknown, formData: FormData) {
  const profile = await requireProfile();

  const club_id = String(formData.get("club_id") ?? "");
  const flexible = formData.get("fecha_flexible") === "on";
  const caddie_compartido = formData.get("caddie_compartido") === "on";
  const carrito_compartido = formData.get("carrito_compartido") === "on";
  const nota = String(formData.get("nota") ?? "").trim();

  if (!club_id) {
    return { error: "Selecciona un club de la lista." };
  }
  if (!profile.club_id) {
    return {
      error: "Completa tu club en tu perfil antes de publicar una oferta.",
    };
  }

  // Con disponibilidad flexible no se pide ninguna fecha y los pases son los
  // de esa única oferta. Con fecha fija cada fecha trae sus propios pases
  // ("fecha|hora|pases"), más el par que haya quedado capturado en los campos
  // sin presionar "+ Agregar".
  const pasesValidos = (n: number) => Number.isInteger(n) && n >= 1 && n <= MAX_PASES;
  const errorPases = `Los pases deben ser un número entre 1 y ${MAX_PASES}.`;

  const pares: Array<{ fecha: string; hora: string; pases: number }> = [];
  let pasesFlexible = 1;
  if (flexible) {
    pasesFlexible = Number(formData.get("pases_disponibles") ?? 1);
    if (!pasesValidos(pasesFlexible)) return { error: errorPases };
  } else {
    for (const pair of formData.getAll("fecha_hora_pairs").map(String)) {
      const [fecha, hora, pasesRaw] = pair.split("|");
      if (!fecha || !hora) continue;
      const pases = Number(pasesRaw ?? 1);
      if (!pasesValidos(pases)) return { error: errorPases };
      pares.push({ fecha, hora, pases });
    }
    const fechaPendiente = String(formData.get("fecha_pendiente") ?? "").trim();
    const horaPendiente = String(formData.get("hora_pendiente") ?? "").trim();
    if (fechaPendiente && horaPendiente) {
      const pases = Number(formData.get("pases_pendiente") ?? 1);
      if (!pasesValidos(pases)) return { error: errorPases };
      pares.push({ fecha: fechaPendiente, hora: horaPendiente, pases });
    } else if (fechaPendiente) {
      return { error: "Falta la hora de la fecha que elegiste." };
    } else if (horaPendiente && pares.length === 0) {
      return { error: "Elige también la fecha para la hora que indicaste." };
    }

    if (pares.length === 0) {
      return {
        error:
          "Agrega al menos una fecha con su hora, o marca \"Disponibilidad flexible\" para publicar sin fecha fija.",
      };
    }
    const hoy = hoyEnMexico();
    if (pares.some((p) => p.fecha < hoy)) {
      return { error: "Una de las fechas ya pasó. Elige fechas de hoy en adelante." };
    }
  }

  const parsed = parseCostos(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { costos } = parsed;

  const base = {
    host_id: profile.id,
    club_id,
    caddie_compartido,
    carrito_compartido,
    ...costos,
    // costo_estimado guarda lo que paga el invitado en total: carrito y caddie
    // compartidos ya divididos entre 2 (los costos guardan el monto completo).
    costo_estimado: totalCostos(costos, { carrito: carrito_compartido, caddie: caddie_compartido }),
    nota: nota || null,
  };

  const supabase = await createClient();

  // Fecha flexible: una sola oferta sin fecha/hora fija, a coordinar con
  // quien solicite unirse. Fecha fija: una oferta por cada par fecha+hora
  // (cada fecha puede tener su propia hora; se descartan pares repetidos).
  const unicos = Array.from(new Map(pares.map((p) => [`${p.fecha}|${p.hora}`, p])).values());
  const rows = flexible
    ? [{ ...base, pases_disponibles: pasesFlexible, fecha_flexible: true }]
    : unicos.map(({ fecha, hora, pases }) => ({
        ...base,
        fecha,
        hora,
        pases_disponibles: pases,
        fecha_flexible: false,
      }));

  const { data, error } = await insertOffers(supabase, rows);

  if (error || !data || data.length === 0) {
    console.error("[createOffer] Error publicando oferta:", error);
    return {
      error: error
        ? `No pudimos publicar tu oferta (${error.message}).`
        : "No pudimos publicar tu oferta. Intenta de nuevo.",
    };
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
