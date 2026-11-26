"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireEquipo } from "@/lib/equipo/datos";
import {
  CATEGORIAS_GASTO,
  CATEGORIAS_INGRESO,
  CATEGORIAS_PIPELINE,
  ETAPAS,
  ROL_POR_CLAVE,
  hoyMexico,
  lunesDe,
} from "@/lib/equipo/roles";

export type FormState = { ok: string } | { error: string } | undefined;

const texto = (fd: FormData, campo: string, max = 500) => {
  const v = String(fd.get(campo) ?? "").trim().slice(0, max);
  return v || null;
};
const fechaValida = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function refrescar() {
  revalidatePath("/equipo");
  revalidatePath("/equipo/pipeline");
  revalidatePath("/equipo/finanzas");
  revalidatePath("/admin/equipo");
}

// ---------- Actividades ----------
export async function registrarActividad(_prev: FormState, fd: FormData): Promise<FormState> {
  const acceso = await requireEquipo();
  const rol = acceso.rol ?? "direccion";
  const tipo = texto(fd, "tipo", 80);
  const titulo = texto(fd, "titulo", 200);
  if (!tipo || !ROL_POR_CLAVE[rol].tiposActividad.includes(tipo)) return { error: "Elige el tipo de actividad." };
  if (!titulo) return { error: "Describe brevemente la actividad." };
  const enlace = texto(fd, "enlace", 500);
  if (enlace && !/^https?:\/\//i.test(enlace)) return { error: "El enlace debe empezar con http:// o https://" };

  const supabase = await createClient();
  const { error } = await supabase.from("equipo_actividades").insert({
    autor_id: acceso.profile.id,
    rol,
    tipo,
    titulo,
    contraparte: texto(fd, "contraparte", 160),
    resultado: texto(fd, "resultado", 1000),
    enlace,
    fecha: fechaValida(texto(fd, "fecha", 10)) ?? hoyMexico(),
    pipeline_id: texto(fd, "pipeline_id", 64),
  });
  if (error) return { error: `No se pudo guardar (${error.message}).` };
  refrescar();
  return { ok: "Actividad registrada." };
}

export async function eliminarActividad(fd: FormData) {
  const acceso = await requireEquipo();
  const id = String(fd.get("id") ?? "");
  const supabase = await createClient();
  let q = supabase.from("equipo_actividades").delete().eq("id", id);
  if (!acceso.esAdmin) q = q.eq("autor_id", acceso.profile.id);
  await q;
  refrescar();
}

// ---------- Check-in semanal ----------
export async function guardarCheckin(_prev: FormState, fd: FormData): Promise<FormState> {
  const acceso = await requireEquipo();
  const semana = lunesDe();
  const logros = texto(fd, "logros", 2000);
  const bloqueos = texto(fd, "bloqueos", 2000);
  const plan = texto(fd, "plan", 2000);
  if (!logros && !plan) return { error: "Escribe al menos tus logros o tu plan de la semana." };

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("equipo_checkins")
    .select("id")
    .eq("autor_id", acceso.profile.id)
    .eq("semana", semana)
    .maybeSingle();

  let checkinId = existente?.id as string | undefined;
  if (checkinId) {
    const { error } = await supabase
      .from("equipo_checkins")
      .update({ logros, bloqueos, plan, updated_at: new Date().toISOString() })
      .eq("id", checkinId);
    if (error) return { error: `No se pudo guardar (${error.message}).` };
  } else {
    const { data, error } = await supabase
      .from("equipo_checkins")
      .insert({ autor_id: acceso.profile.id, semana, logros, bloqueos, plan })
      .select("id")
      .single();
    if (error) return { error: `No se pudo guardar (${error.message}).` };
    checkinId = data.id as string;
  }

  const compromisos = [0, 1, 2]
    .map((i) => ({ texto: texto(fd, `compromiso_${i}`, 300), fecha: fechaValida(texto(fd, `fecha_${i}`, 10)) }))
    .filter((c) => c.texto);
  if (compromisos.some((c) => !c.fecha)) return { error: "Cada compromiso necesita fecha límite." };
  if (compromisos.length) {
    const { error } = await supabase.from("equipo_compromisos").insert(
      compromisos.map((c) => ({
        autor_id: acceso.profile.id,
        checkin_id: checkinId,
        texto: c.texto!,
        fecha_limite: c.fecha!,
      })),
    );
    if (error) return { error: `El check-in se guardó, pero no los compromisos (${error.message}).` };
  }
  refrescar();
  return { ok: "Check-in guardado. ¡Gracias!" };
}

export async function marcarCompromiso(fd: FormData) {
  const acceso = await requireEquipo();
  const id = String(fd.get("id") ?? "");
  const hecho = fd.get("hecho") === "true";
  const supabase = await createClient();
  let q = supabase
    .from("equipo_compromisos")
    .update({ hecho, hecho_at: hecho ? new Date().toISOString() : null })
    .eq("id", id);
  if (!acceso.esAdmin) q = q.eq("autor_id", acceso.profile.id);
  await q;
  refrescar();
}

// ---------- Pipeline ----------
export async function crearPipeline(_prev: FormState, fd: FormData): Promise<FormState> {
  const acceso = await requireEquipo();
  const categoria = String(fd.get("categoria") ?? "");
  const nombre = texto(fd, "nombre", 160);
  const etapa = String(fd.get("etapa") ?? "identificado");
  if (!(categoria in CATEGORIAS_PIPELINE)) return { error: "Elige la categoría." };
  if (!nombre) return { error: "Escribe el nombre." };
  if (!ETAPAS.some((e) => e.clave === etapa)) return { error: "Etapa no válida." };
  const montoTxt = texto(fd, "monto_estimado", 20);
  const monto = montoTxt ? Number(montoTxt.replace(/[,$\s]/g, "")) : null;
  if (monto !== null && (!Number.isFinite(monto) || monto < 0)) return { error: "Monto no válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("equipo_pipeline").insert({
    responsable_id: acceso.profile.id,
    categoria,
    nombre,
    contacto: texto(fd, "contacto", 200),
    etapa: etapa as never,
    monto_estimado: monto,
    proximo_paso: texto(fd, "proximo_paso", 300),
    proxima_fecha: fechaValida(texto(fd, "proxima_fecha", 10)),
    notas: texto(fd, "notas", 1000),
  });
  if (error) return { error: `No se pudo guardar (${error.message}).` };
  refrescar();
  return { ok: `${nombre} agregado al pipeline.` };
}

// Mover de etapa / actualizar próximo paso. Si cambia la etapa, deja una
// actividad en la bitácora para que cuente en la semana de quien lo movió.
export async function actualizarPipeline(fd: FormData) {
  const acceso = await requireEquipo();
  const id = String(fd.get("id") ?? "");
  const etapa = String(fd.get("etapa") ?? "");
  if (!ETAPAS.some((e) => e.clave === etapa)) return;
  const supabase = await createClient();
  const { data: actual } = await supabase.from("equipo_pipeline").select("*").eq("id", id).maybeSingle();
  if (!actual) return;

  await supabase
    .from("equipo_pipeline")
    .update({
      etapa: etapa as never,
      proximo_paso: texto(fd, "proximo_paso", 300),
      proxima_fecha: fechaValida(texto(fd, "proxima_fecha", 10)),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (actual.etapa !== etapa) {
    const rol = acceso.rol ?? "direccion";
    const label = ETAPAS.find((e) => e.clave === etapa)?.label ?? etapa;
    const tipos = ROL_POR_CLAVE[rol].tiposActividad;
    await supabase.from("equipo_actividades").insert({
      autor_id: acceso.profile.id,
      rol,
      tipo: tipos[0],
      titulo: `${actual.nombre}: pasó a ${label}`,
      contraparte: actual.nombre as string,
      fecha: hoyMexico(),
      pipeline_id: id,
    });
  }
  refrescar();
}

// ---------- Finanzas ----------
export async function registrarMovimiento(_prev: FormState, fd: FormData): Promise<FormState> {
  const acceso = await requireEquipo();
  if (!acceso.esAdmin && acceso.rol !== "finanzas") return { error: "Solo Finanzas puede registrar movimientos." };
  const tipo = fd.get("tipo") === "ingreso" ? "ingreso" : "gasto";
  const categoria = String(fd.get("categoria") ?? "");
  const validas = tipo === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;
  if (!validas.includes(categoria)) return { error: "Elige una categoría." };
  const concepto = texto(fd, "concepto", 200);
  if (!concepto) return { error: "Escribe el concepto." };
  const monto = Number(String(fd.get("monto") ?? "").replace(/[,$\s]/g, ""));
  if (!Number.isFinite(monto) || monto <= 0) return { error: "Monto no válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("finanzas_movimientos").insert({
    fecha: fechaValida(texto(fd, "fecha", 10)) ?? hoyMexico(),
    tipo,
    categoria,
    canal: texto(fd, "canal", 80),
    concepto,
    monto,
    registrado_por: acceso.profile.id,
  });
  if (error) return { error: `No se pudo guardar (${error.message}).` };
  refrescar();
  return { ok: "Movimiento registrado." };
}

export async function eliminarMovimiento(fd: FormData) {
  const acceso = await requireEquipo();
  if (!acceso.esAdmin && acceso.rol !== "finanzas") return;
  const supabase = await createClient();
  await supabase.from("finanzas_movimientos").delete().eq("id", String(fd.get("id") ?? ""));
  refrescar();
}
