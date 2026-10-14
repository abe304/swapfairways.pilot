"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function updateProfile(_prevState: unknown, formData: FormData) {
  const profile = await requireProfile();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const clubId = String(formData.get("club_id") ?? "").trim();
  const handicapRaw = String(formData.get("handicap_manual") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const ghinId = String(formData.get("ghin_id") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const otrosClubIds = formData.getAll("otros_club_ids").map(String).filter(Boolean);

  if (!nombre) {
    return { error: "El nombre es obligatorio." };
  }

  const handicap_manual = handicapRaw ? Number(handicapRaw) : null;
  if (handicapRaw && Number.isNaN(handicap_manual)) {
    return { error: "El handicap debe ser un número." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      nombre,
      club_id: clubId || null,
      handicap_manual,
      bio: bio || null,
      ghin_id: ghinId || null,
    })
    .eq("id", profile.id);

  if (error) {
    console.error("[updateProfile] Error guardando perfil:", error);
    return { error: `No pudimos guardar tu perfil (${error.message}).` };
  }

  const { error: contactError } = await supabase
    .from("profile_contacts")
    .upsert({ user_id: profile.id, telefono: telefono || null });

  if (contactError) {
    console.error("[updateProfile] Error guardando teléfono:", contactError);
    return { error: `No pudimos guardar tu teléfono de contacto (${contactError.message}).` };
  }

  // Sincroniza la lista completa de clubes del socio (principal + otros):
  // se borra lo anterior y se vuelve a insertar el set actual — más simple
  // y seguro que calcular un diff.
  const todosLosClubIds = Array.from(new Set([clubId, ...otrosClubIds].filter(Boolean)));

  const { error: deleteClubsError } = await supabase
    .from("profile_clubs")
    .delete()
    .eq("profile_id", profile.id);

  if (deleteClubsError) {
    console.error("[updateProfile] Error limpiando clubes del socio:", deleteClubsError);
    return { error: `No pudimos guardar tus clubes (${deleteClubsError.message}).` };
  }

  if (todosLosClubIds.length > 0) {
    const { error: insertClubsError } = await supabase
      .from("profile_clubs")
      .insert(todosLosClubIds.map((club_id) => ({ profile_id: profile.id, club_id })));

    if (insertClubsError) {
      console.error("[updateProfile] Error guardando clubes del socio:", insertClubsError);
      return { error: `No pudimos guardar tus clubes (${insertClubsError.message}).` };
    }
  }

  revalidatePath("/perfil");
  redirect("/ofertas");
}
