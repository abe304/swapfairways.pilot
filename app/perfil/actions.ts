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

  revalidatePath("/perfil");
  redirect("/ofertas");
}
