"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function submitReview(_prevState: unknown, formData: FormData) {
  const profile = await requireProfile();

  const requestId = String(formData.get("request_id") ?? "");
  const receptorId = String(formData.get("receptor_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const tags = formData.getAll("tags").map(String);
  const comentario = String(formData.get("comentario") ?? "").trim();

  if (!requestId || !receptorId || !rating || rating < 1 || rating > 5) {
    return { error: "Selecciona una calificación de 1 a 5." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reviews").insert({
    request_id: requestId,
    autor_id: profile.id,
    receptor_id: receptorId,
    rating,
    tags,
    comentario: comentario || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya dejaste una reseña para esta ronda." };
    }
    return { error: "No pudimos guardar tu reseña. Intenta de nuevo." };
  }

  revalidatePath("/mis-rondas");
  redirect("/mis-rondas?resena=enviada");
}
