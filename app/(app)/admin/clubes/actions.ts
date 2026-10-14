"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ClubDocumentoTipo } from "@/lib/supabase/types";

function urlValida(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function refrescar(clubId: string) {
  revalidatePath("/");
  revalidatePath("/clubes");
  revalidatePath(`/clubes/${clubId}`);
  revalidatePath("/admin/clubes");
  revalidatePath(`/admin/clubes/${clubId}`);
}

export async function updateClub(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el club." };

  const texto = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const costoCreditos = Number(formData.get("costo_creditos") ?? 1);
  if (!Number.isInteger(costoCreditos) || costoCreditos < 1) {
    return { error: "El costo en créditos debe ser un entero de 1 o más." };
  }
  const visitaRaw = String(formData.get("costo_visita_sugerido") ?? "").trim();
  const visita = visitaRaw === "" ? null : Number(visitaRaw);
  if (visita !== null && (Number.isNaN(visita) || visita < 0)) {
    return { error: "El costo de visita sugerido debe ser un monto válido (0 o mayor)." };
  }
  const foto = texto("foto_url");
  if (foto && !urlValida(foto)) {
    return { error: "El enlace de la foto debe empezar con https://" };
  }
  const tipo = formData.get("tipo") === "publico" ? "publico" : "privado";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .update({
      ciudad: texto("ciudad"),
      estado: texto("estado"),
      direccion: texto("direccion"),
      tipo,
      costo_creditos: costoCreditos,
      costo_visita_sugerido: visita,
      requiere_caddie_invitado: formData.get("requiere_caddie_invitado") === "on",
      carrito_obligatorio: formData.get("carrito_obligatorio") === "on",
      requiere_ghin: formData.get("requiere_ghin") === "on",
      reglamento: texto("reglamento"),
      recomendacion_llegada: texto("recomendacion_llegada"),
      foto_url: foto,
    })
    .eq("id", id)
    .select("id");

  if (error) return { error: `No pudimos guardar el club (${error.message}).` };
  if (!data?.length) {
    return { error: "No se guardó ningún cambio: tu cuenta no tiene permisos de administrador en la base de datos." };
  }
  refrescar(id);
  return { ok: "Cambios guardados." };
}

export async function guardarFoto(clubId: string, url: string) {
  await requireAdmin();
  if (!urlValida(url)) return { error: "El enlace de la foto no es válido." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .update({ foto_url: url })
    .eq("id", clubId)
    .select("id");
  if (error) return { error: `No pudimos guardar la foto (${error.message}).` };
  if (!data?.length) return { error: "No se guardó: falta permiso de administrador." };
  refrescar(clubId);
  return { ok: "Foto actualizada." };
}

export async function addDocumento(input: {
  clubId: string;
  tipo: ClubDocumentoTipo;
  titulo: string;
  url: string;
  storagePath: string | null;
}) {
  const admin = await requireAdmin();
  const titulo = input.titulo.trim();
  if (!titulo) return { error: "Escribe un título para el documento." };
  if (!urlValida(input.url)) return { error: "El enlace del documento no es válido (debe empezar con https://)." };

  const supabase = await createClient();
  const { error } = await supabase.from("club_documentos").insert({
    club_id: input.clubId,
    tipo: input.tipo,
    titulo,
    url: input.url,
    storage_path: input.storagePath,
    created_by: admin.id,
  });
  if (error) return { error: `No pudimos guardar el documento (${error.message}).` };
  refrescar(input.clubId);
  return { ok: "Documento agregado." };
}

export async function deleteDocumento(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("club_documentos")
    .select("club_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!doc) return;

  await supabase.from("club_documentos").delete().eq("id", id);
  if (doc.storage_path) {
    await supabase.storage.from("clubes").remove([doc.storage_path]);
  }
  refrescar(doc.club_id);
}
