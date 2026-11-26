// Corre los agentes: arma su contexto (directrices, memoria, pendientes),
// ejecuta el loop con herramientas y guarda la corrida con su reporte.
import { ToolLoopAgent, isStepCount } from "ai";
import { MOCK_MODE } from "@/lib/mock/is-mock";
import type { RolEquipo } from "@/lib/supabase/types";
import { dbServicio } from "@/lib/equipo/datos";
import { ROL_POR_CLAVE, diaSemanaMexico, hoyMexico, lunesDe, sumarDias } from "@/lib/equipo/roles";
import { AGENTES, AGENTE_POR_ROL, CONTEXTO_NEGOCIO, MODELO_AGENTES, type AgenteConfig } from "./config";
import { crearHerramientas } from "./herramientas";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** ¿Hay credenciales para llamar a la IA? En Vercel basta el OIDC del proyecto. */
export function iaDisponible() {
  return !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL);
}

async function contexto(agente: AgenteConfig) {
  const db = await dbServicio();
  const rol = agente.rol;
  const hoy = hoyMexico();
  const [directrices, ultima, compromisos, acciones, propias, meta] = await Promise.all([
    db.from("equipo_directrices").select("rol, texto, created_at").eq("activa", true).order("created_at"),
    db
      .from("agente_corridas")
      .select("reporte, inicio")
      .eq("rol", rol)
      .eq("estado", "ok")
      .order("inicio", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("equipo_compromisos").select("id, texto, fecha_limite").eq("agente", rol).eq("hecho", false),
    db
      .from("agente_acciones")
      .select("tipo, destinatario, asunto, estado, comentario, created_at")
      .eq("rol", rol)
      .gte("created_at", `${sumarDias(hoy, -14)}T00:00:00Z`)
      .order("created_at", { ascending: false })
      .limit(20),
    db.from("equipo_actividades").select("fecha, tipo, titulo").eq("agente", rol).gte("fecha", lunesDe(hoy)),
    db.from("equipo_metas").select("actividades_semana").eq("rol", rol).maybeSingle(),
  ]);

  const dirs = (directrices.data ?? []).filter((d) => !d.rol || d.rol === rol);
  const lista = (xs: string[], vacio: string) => (xs.length ? xs.map((x) => `- ${x}`).join("\n") : vacio);

  return `Hoy es ${DIAS[diaSemanaMexico()]} ${hoy} (hora del centro de México).

## Directrices de Abraham (tienen prioridad sobre todo lo demás)
${lista(dirs.map((d) => (d.rol ? `[Para ti] ${d.texto}` : `[Para todos] ${d.texto}`)), "- (Sin directrices activas: trabaja según tu misión y los KPIs.)")}

## Tu semana
Meta: ${meta.data?.actividades_semana ?? 0} actividades registradas por semana. Llevas ${(propias.data ?? []).length}:
${lista((propias.data ?? []).map((a) => `${a.fecha} · ${a.tipo}: ${a.titulo}`), "- (ninguna todavía)")}

## Tus compromisos abiertos
${lista((compromisos.data ?? []).map((c) => `[id ${c.id}] ${c.texto} (vence ${c.fecha_limite})`), "- (ninguno)")}

## Tus propuestas recientes y lo que decidió Abraham
${lista(
  (acciones.data ?? []).map(
    (a) =>
      `${(a.created_at as string).slice(0, 10)} · ${a.tipo} a ${a.destinatario ?? "socio"}${a.asunto ? ` («${a.asunto}»)` : ""}: ${a.estado}${a.comentario ? ` — comentario: ${a.comentario}` : ""}`,
  ),
  "- (ninguna)",
)}

## Tu reporte anterior
${ultima.data?.reporte ? ultima.data.reporte.slice(0, 2500) : "(Es tu primera corrida.)"}

Haz el trabajo de hoy.`;
}

function instrucciones(agente: AgenteConfig) {
  const config = ROL_POR_CLAVE[agente.rol];
  return `${agente.mision}

## Contexto del negocio
${CONTEXTO_NEGOCIO}

## Tus KPIs
${config.kpis.join(" · ")}

## Cómo trabajas
- Eres un agente autónomo: trabajas solo, sin preguntar, siguiendo las directrices de Abraham. Si una directriz choca con tu misión, gana la directriz.
- Usa las herramientas para leer los datos reales antes de concluir. Nunca inventes números, nombres, contactos ni resultados. Si buscas en la web, cita la fuente en el resultado.
- Lo interno lo haces tú: analizar, investigar, actualizar el pipeline, registrar actividades y compromisos.
- Todo lo que sale hacia afuera (correos, mensajes, publicaciones, gasto) lo propones con proponer_accion_externa con el texto final listo; Abraham lo aprueba. No repitas propuestas que siguen pendientes y aprende de los comentarios de las rechazadas.
- Registra cada trabajo concreto con registrar_actividad (cuenta para tu meta). Calidad sobre cantidad: nada de actividades de relleno.
- Escribe en español de México, claro y breve.

## Al terminar
Responde con tu reporte para Abraham, en este formato:
**Plan de hoy:** 1-3 líneas.
**Hecho:** viñetas con lo que hiciste y su resultado.
**Hallazgos:** lo importante que viste en los datos (con números).
**Necesito de Abraham:** decisiones o aprobaciones pendientes; "Nada" si no hay.`;
}

export type ResultadoCorrida = { rol: RolEquipo; estado: "ok" | "error" | "omitido"; detalle?: string };

export async function correrAgente(rol: RolEquipo, origen: "cron" | "manual"): Promise<ResultadoCorrida> {
  const agente = AGENTE_POR_ROL[rol];
  if (!agente) return { rol, estado: "omitido", detalle: "Este rol no tiene agente." };
  if (MOCK_MODE || !iaDisponible()) {
    return { rol, estado: "omitido", detalle: "Falta configurar la IA (AI Gateway) en este entorno." };
  }

  const db = await dbServicio();
  const { data: corrida, error } = await db
    .from("agente_corridas")
    .insert({ rol, origen, modelo: MODELO_AGENTES })
    .select("id")
    .single();
  if (error || !corrida) return { rol, estado: "error", detalle: error?.message ?? "No se pudo crear la corrida" };

  try {
    const ia = new ToolLoopAgent({
      model: MODELO_AGENTES,
      instructions: instrucciones(agente),
      tools: crearHerramientas(db, agente, corrida.id as string),
      stopWhen: isStepCount(25),
    });
    const res = await ia.generate({ prompt: await contexto(agente), timeout: { totalMs: 240_000 } });
    await db
      .from("agente_corridas")
      .update({
        estado: "ok",
        reporte: res.text || "(Sin reporte.)",
        pasos: res.steps.length,
        tokens_entrada: res.usage?.inputTokens ?? null,
        tokens_salida: res.usage?.outputTokens ?? null,
        fin: new Date().toISOString(),
      })
      .eq("id", corrida.id);
    return { rol, estado: "ok" };
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    console.error(`[agentes] Falló ${rol}:`, err);
    await db
      .from("agente_corridas")
      .update({ estado: "error", error: detalle.slice(0, 2000), fin: new Date().toISOString() })
      .eq("id", corrida.id);
    return { rol, estado: "error", detalle };
  }
}

// Corre en paralelo los agentes a los que hoy les toca.
export async function correrAgentesDelDia() {
  const dia = diaSemanaMexico();
  const deHoy = AGENTES.filter((a) => a.dias.includes(dia));
  const resultados = await Promise.all(deHoy.map((a) => correrAgente(a.rol, "cron")));
  return { dia, resultados };
}
