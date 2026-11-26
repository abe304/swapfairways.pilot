"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLES, esRol } from "@/lib/equipo/roles";

function refrescar() {
  revalidatePath("/admin/equipo");
  revalidatePath("/equipo");
}

export async function agregarMiembro(fd: FormData) {
  await requireAdmin();
  const profileId = String(fd.get("profile_id") ?? "");
  const rol = fd.get("rol");
  if (!profileId || !esRol(rol)) return;
  const titulo = String(fd.get("titulo") ?? "").trim().slice(0, 120) || null;
  const supabase = await createClient();
  await supabase
    .from("equipo_miembros")
    .upsert({ profile_id: profileId, rol, titulo, activo: true }, { onConflict: "profile_id" });
  refrescar();
}

export async function quitarMiembro(fd: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("equipo_miembros")
    .update({ activo: false })
    .eq("profile_id", String(fd.get("profile_id") ?? ""));
  refrescar();
}

export async function guardarMetas(fd: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const filas = ROLES.map((r) => ({
    rol: r.rol,
    actividades_semana: Math.max(0, Math.min(200, Math.round(Number(fd.get(`meta_${r.rol}`) ?? 0)) || 0)),
    updated_at: new Date().toISOString(),
  }));
  await supabase.from("equipo_metas").upsert(filas, { onConflict: "rol" });
  refrescar();
}

// ============================================================
// Agentes de IA (migración 0027)
// ============================================================
export async function guardarDirectriz(fd: FormData) {
  await requireAdmin();
  const texto = String(fd.get("texto") ?? "").trim().slice(0, 2000);
  const rolTxt = String(fd.get("rol") ?? "");
  if (!texto) return;
  const supabase = await createClient();
  await supabase.from("equipo_directrices").insert({ texto, rol: esRol(rolTxt) ? rolTxt : null });
  refrescar();
}

export async function archivarDirectriz(fd: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("equipo_directrices").update({ activa: false }).eq("id", String(fd.get("id") ?? ""));
  refrescar();
}

// Aprobar (con el texto que Abraham haya editado) o rechazar con comentario.
// Los correos aprobados se mandan en el momento.
export async function decidirAccion(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const decision = String(fd.get("decision") ?? "");
  const comentario = String(fd.get("comentario") ?? "").trim().slice(0, 1000) || null;
  const supabase = await createClient();
  const { data: accion } = await supabase.from("agente_acciones").select("*").eq("id", id).maybeSingle();
  if (!accion || accion.estado !== "pendiente") return;
  const ahora = new Date().toISOString();

  if (decision === "rechazar") {
    await supabase
      .from("agente_acciones")
      .update({ estado: "rechazada", comentario, decidida_at: ahora })
      .eq("id", id);
    refrescar();
    return;
  }

  const asunto = String(fd.get("asunto") ?? accion.asunto ?? "").trim().slice(0, 200) || null;
  const cuerpo = String(fd.get("cuerpo") ?? accion.cuerpo).trim().slice(0, 4000) || accion.cuerpo;
  const destinatario = String(fd.get("destinatario") ?? accion.destinatario ?? "").trim().slice(0, 200) || null;
  const { ejecutarAccion } = await import("@/lib/agentes/acciones");
  const res = await ejecutarAccion({ tipo: accion.tipo, destinatario, user_id: accion.user_id, asunto, cuerpo });
  await supabase
    .from("agente_acciones")
    .update({ estado: res.estado, resultado: res.resultado, comentario, asunto, cuerpo, destinatario, decidida_at: ahora })
    .eq("id", id);
  refrescar();
}

export async function marcarAccionHecha(fd: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("agente_acciones")
    .update({ estado: "ejecutada", resultado: "Hecha por Abraham." })
    .eq("id", String(fd.get("id") ?? ""))
    .eq("estado", "aprobada");
  refrescar();
}

export type CorrerState = { mensaje: string } | undefined;

export async function correrAgenteAhora(_prev: CorrerState, fd: FormData): Promise<CorrerState> {
  await requireAdmin();
  const rol = fd.get("rol");
  if (!esRol(rol)) return { mensaje: "Rol no válido." };
  const { correrAgente } = await import("@/lib/agentes/correr");
  const r = await correrAgente(rol, "manual");
  refrescar();
  if (r.estado === "ok") return { mensaje: "Listo: revisa su reporte y la cola." };
  return { mensaje: r.detalle ?? "No se pudo correr." };
}
