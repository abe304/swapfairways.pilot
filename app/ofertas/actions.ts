"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function createOffer(_prevState: unknown, formData: FormData) {
  const profile = await requireProfile();

  const club_id = String(formData.get("club_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const pases_disponibles = Number(formData.get("pases_disponibles") ?? 1);
  const caddie_incluido = formData.get("caddie_incluido") === "on";
  const carrito_compartido = formData.get("carrito_compartido") === "on";
  const costoRaw = String(formData.get("costo_estimado") ?? "").trim();
  const nota = String(formData.get("nota") ?? "").trim();

  if (!club_id || !fecha || !hora) {
    return { error: "Club, fecha y hora son obligatorios." };
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tee_time_offers")
    .insert({
      host_id: profile.id,
      club_id,
      fecha,
      hora,
      pases_disponibles,
      caddie_incluido,
      carrito_compartido,
      costo_estimado,
      nota: nota || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "No pudimos publicar tu oferta. Intenta de nuevo." };
  }

  revalidatePath("/ofertas");
  redirect(`/ofertas/${data.id}`);
}

export async function solicitarUnion(offerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_join_request", {
    p_offer_id: offerId,
  });

  revalidatePath(`/ofertas/${offerId}`);
  revalidatePath("/mis-rondas");

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
