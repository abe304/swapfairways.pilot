// Herramientas que usan los agentes. Leen y escriben con la service role,
// así que cada una limita qué expone: nunca correos ni teléfonos de socios
// (los correos a socios se resuelven al enviar, por user_id).
import { gateway, tool, type ToolSet } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TipoAccionAgente } from "@/lib/supabase/types";
import { metricasProducto, registrosPorMes } from "@/lib/equipo/datos";
import { CATEGORIAS_PIPELINE, ETAPAS, ROL_POR_CLAVE, hoyMexico, sumarDias } from "@/lib/equipo/roles";
import type { AgenteConfig } from "./config";

type Db = SupabaseClient<Database>;

// Límite de propuestas externas por corrida, para que no inunden la cola.
const MAX_PROPUESTAS = 6;

export function crearHerramientas(db: Db, agente: AgenteConfig, corridaId: string): ToolSet {
  const rol = agente.rol;
  const hoy = hoyMexico();
  let propuestas = 0;
  const h = new Set(agente.herramientas);
  const tools: ToolSet = {};

  // ---------- Lectura ----------
  if (h.has("metricas")) {
    tools.leer_metricas = tool({
      description:
        "KPIs reales de la app: socios, activación, ofertas, solicitudes, rondas jugadas, embudo y últimas 8 semanas.",
      inputSchema: z.object({}),
      execute: async () => {
        const m: Partial<Awaited<ReturnType<typeof metricasProducto>>> = await metricasProducto();
        delete m.error;
        return m;
      },
    });
  }

  if (h.has("actividad_equipo")) {
    tools.leer_actividad_equipo = tool({
      description: "Lo que registró todo el equipo (personas y agentes) en los últimos N días.",
      inputSchema: z.object({ dias: z.number().int().min(1).max(30).default(7) }),
      execute: async ({ dias }) => {
        const { data } = await db
          .from("equipo_actividades")
          .select("fecha, rol, agente, tipo, titulo, contraparte, resultado")
          .gte("fecha", sumarDias(hoy, -dias))
          .order("fecha", { ascending: false })
          .limit(80);
        return data ?? [];
      },
    });
  }

  if (h.has("pipeline")) {
    tools.leer_pipeline = tool({
      description: "Pipeline de relaciones y oportunidades (clubes, FMG, grupos regionales, medios, patrocinios, alianzas, leads).",
      inputSchema: z.object({
        categoria: z.enum(Object.keys(CATEGORIAS_PIPELINE) as [string, ...string[]]).optional(),
        incluir_cerrados: z.boolean().default(false),
      }),
      execute: async ({ categoria, incluir_cerrados }) => {
        let q = db
          .from("equipo_pipeline")
          .select("id, categoria, nombre, contacto, etapa, monto_estimado, proximo_paso, proxima_fecha, notas, agente, updated_at")
          .order("updated_at", { ascending: false })
          .limit(100);
        if (categoria) q = q.eq("categoria", categoria);
        if (!incluir_cerrados) q = q.not("etapa", "in", "(cerrado,perdido)");
        const { data } = await q;
        return data ?? [];
      },
    });
  }

  if (h.has("socios")) {
    tools.leer_socios = tool({
      description:
        "Socios de la app con su actividad (sin datos de contacto): id, nombre, club, fecha de registro, créditos, ofertas publicadas, solicitudes hechas y rondas jugadas.",
      inputSchema: z.object({
        filtro: z
          .enum(["todos", "sin_club", "sin_oferta", "inactivos_30_dias", "con_creditos_sin_usar"])
          .default("todos"),
      }),
      execute: async ({ filtro }) => {
        const [{ data: perfiles }, { data: ofertas }, { data: sols }, { data: clubs }] = await Promise.all([
          db.from("profiles").select("id, nombre, club_id, creditos_balance, created_at"),
          db.from("tee_time_offers").select("host_id, created_at"),
          db.from("requests").select("guest_id, estado, created_at"),
          db.from("clubs").select("id, nombre"),
        ]);
        const club = new Map((clubs ?? []).map((c) => [c.id as string, c.nombre as string]));
        const hace30 = Date.now() - 30 * 86400000;
        const filas = (perfiles ?? []).map((p) => {
          const o = (ofertas ?? []).filter((x) => x.host_id === p.id);
          const s = (sols ?? []).filter((x) => x.guest_id === p.id);
          const ultima = [...o, ...s].map((x) => Date.parse(x.created_at as string)).sort((a, b) => b - a)[0];
          return {
            id: p.id,
            nombre: p.nombre,
            club: p.club_id ? (club.get(p.club_id as string) ?? null) : null,
            registrado: (p.created_at as string).slice(0, 10),
            creditos: p.creditos_balance,
            ofertas: o.length,
            solicitudes: s.length,
            jugadas: s.filter((x) => x.estado === "jugado").length,
            activo_30_dias: !!ultima && ultima > hace30,
          };
        });
        const f = {
          todos: () => true,
          sin_club: (x: (typeof filas)[number]) => !x.club,
          sin_oferta: (x: (typeof filas)[number]) => x.ofertas === 0,
          inactivos_30_dias: (x: (typeof filas)[number]) => !x.activo_30_dias,
          con_creditos_sin_usar: (x: (typeof filas)[number]) => x.creditos > 0 && x.solicitudes === 0,
        }[filtro];
        return filas.filter(f).slice(0, 150);
      },
    });
  }

  if (h.has("solicitudes")) {
    tools.leer_solicitudes_atoradas = tool({
      description:
        "Solicitudes de ronda pendientes de más de 72 h y ofertas abiertas con fecha ya pasada, con nombres de anfitrión, invitado y club.",
      inputSchema: z.object({}),
      execute: async () => {
        const [{ data: sols }, { data: ofertas }, { data: perfiles }, { data: clubs }] = await Promise.all([
          db.from("requests").select("id, offer_id, guest_id, estado, created_at").eq("estado", "pendiente"),
          db.from("tee_time_offers").select("id, host_id, club_id, fecha, fecha_flexible, estado"),
          db.from("profiles").select("id, nombre"),
          db.from("clubs").select("id, nombre"),
        ]);
        const nombre = new Map((perfiles ?? []).map((p) => [p.id as string, p.nombre as string]));
        const club = new Map((clubs ?? []).map((c) => [c.id as string, c.nombre as string]));
        const oferta = new Map((ofertas ?? []).map((o) => [o.id as string, o]));
        const sinRespuesta = (sols ?? [])
          .filter((s) => Date.now() - Date.parse(s.created_at as string) > 72 * 3600000)
          .map((s) => {
            const o = oferta.get(s.offer_id as string);
            return {
              solicitud_id: s.id,
              creada: (s.created_at as string).slice(0, 10),
              invitado: nombre.get(s.guest_id as string),
              invitado_id: s.guest_id,
              anfitrion: o ? nombre.get(o.host_id as string) : null,
              anfitrion_id: o?.host_id ?? null,
              club: o ? club.get(o.club_id as string) : null,
            };
          });
        const vencidas = (ofertas ?? [])
          .filter((o) => o.estado === "activa" && !o.fecha_flexible && o.fecha && (o.fecha as string) < hoy)
          .map((o) => ({ oferta_id: o.id, fecha: o.fecha, anfitrion: nombre.get(o.host_id as string), club: club.get(o.club_id as string) }));
        return { solicitudes_sin_respuesta: sinRespuesta, ofertas_abiertas_vencidas: vencidas };
      },
    });
  }

  if (h.has("clubes")) {
    tools.leer_clubes = tool({
      description:
        "Directorio de clubes de golf de México con nivel, acceso, ubicación y cuántas ofertas y socios tiene cada uno en la app.",
      inputSchema: z.object({
        estado: z.string().optional().describe("Estado de la República, p. ej. Jalisco"),
        nivel: z.enum(["premium", "gold", "silver"]).optional(),
        solo_con_actividad: z.boolean().default(false),
      }),
      execute: async ({ estado, nivel, solo_con_actividad }) => {
        let q = db.from("clubs").select("id, nombre, ciudad, estado, nivel, acceso, tipo");
        if (estado) q = q.ilike("estado", `%${estado}%`);
        if (nivel) q = q.eq("nivel", nivel);
        const [{ data: clubs }, { data: ofertas }, { data: perfiles }] = await Promise.all([
          q,
          db.from("tee_time_offers").select("club_id"),
          db.from("profiles").select("club_id"),
        ]);
        const filas = (clubs ?? []).map((c) => ({
          nombre: c.nombre,
          ciudad: c.ciudad,
          estado: c.estado,
          nivel: c.nivel,
          acceso: c.acceso,
          ofertas: (ofertas ?? []).filter((o) => o.club_id === c.id).length,
          socios: (perfiles ?? []).filter((p) => p.club_id === c.id).length,
        }));
        return filas
          .filter((c) => !solo_con_actividad || c.ofertas > 0 || c.socios > 0)
          .sort((a, b) => b.socios + b.ofertas - (a.socios + a.ofertas))
          .slice(0, 120);
      },
    });
  }

  if (h.has("lista_espera")) {
    tools.leer_lista_espera = tool({
      description: "Personas en lista de espera (nombre, club, mensaje y estado; sin contacto).",
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await db.from("lista_espera").select("nombre, club, mensaje, estado, created_at").limit(100);
        return data ?? [];
      },
    });
  }

  if (h.has("finanzas")) {
    tools.leer_finanzas = tool({
      description: "Movimientos de ingresos y gastos de los últimos 6 meses y registros nuevos por mes.",
      inputSchema: z.object({}),
      execute: async () => {
        const [{ data }, registros] = await Promise.all([
          db.from("finanzas_movimientos").select("fecha, tipo, categoria, canal, concepto, monto").gte("fecha", sumarDias(hoy, -186)),
          registrosPorMes(),
        ]);
        return { movimientos: data ?? [], registros_por_mes: registros };
      },
    });
  }

  if (h.has("buscar_web")) {
    tools.buscar_web = gateway.tools.perplexitySearch({ maxResults: 8, country: "MX" });
  }

  // ---------- Escritura interna (autónoma) ----------
  tools.registrar_actividad = tool({
    description:
      "Registra en la bitácora del equipo un trabajo que hiciste en esta corrida (análisis, hallazgo, investigación, borrador). Úsala una vez por cada trabajo concreto.",
    inputSchema: z.object({
      tipo: z.enum(ROL_POR_CLAVE[rol].tiposActividad as [string, ...string[]]),
      titulo: z.string().min(3).max(200),
      contraparte: z.string().max(160).optional(),
      resultado: z.string().max(1500).optional().describe("Qué encontraste o qué sigue, con números si aplica"),
      pipeline_id: z.string().optional(),
    }),
    execute: async (a) => {
      const { error } = await db.from("equipo_actividades").insert({
        autor_id: null,
        agente: rol,
        rol,
        tipo: a.tipo,
        titulo: a.titulo,
        contraparte: a.contraparte ?? null,
        resultado: a.resultado ?? null,
        pipeline_id: a.pipeline_id ?? null,
        fecha: hoy,
      });
      return error ? { error: error.message } : { ok: true };
    },
  });

  if (h.has("pipeline")) {
    tools.guardar_pipeline = tool({
      description: "Crea un contacto u oportunidad en el pipeline, o actualiza uno existente (pasa su id).",
      inputSchema: z.object({
        id: z.string().optional(),
        categoria: z.enum(Object.keys(CATEGORIAS_PIPELINE) as [string, ...string[]]),
        nombre: z.string().min(2).max(160),
        contacto: z.string().max(200).optional().describe("Persona y cargo, @cuenta o sitio web; correo solo si es público"),
        etapa: z.enum(ETAPAS.map((e) => e.clave) as [string, ...string[]]).default("identificado"),
        monto_estimado: z.number().nonnegative().optional(),
        proximo_paso: z.string().max(300).optional(),
        proxima_fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        notas: z.string().max(1000).optional(),
      }),
      execute: async ({ id, ...p }) => {
        const fila = {
          categoria: p.categoria,
          nombre: p.nombre,
          contacto: p.contacto ?? null,
          etapa: p.etapa as never,
          monto_estimado: p.monto_estimado ?? null,
          proximo_paso: p.proximo_paso ?? null,
          proxima_fecha: p.proxima_fecha ?? null,
          notas: p.notas ?? null,
          updated_at: new Date().toISOString(),
        };
        if (id) {
          const { error } = await db.from("equipo_pipeline").update(fila).eq("id", id);
          return error ? { error: error.message } : { ok: true, id };
        }
        const { data: dup } = await db.from("equipo_pipeline").select("id").ilike("nombre", p.nombre).maybeSingle();
        if (dup) return { error: `Ya existe en el pipeline (id ${dup.id}); actualízalo con ese id.` };
        const { data, error } = await db
          .from("equipo_pipeline")
          .insert({ ...fila, responsable_id: null, agente: rol })
          .select("id")
          .single();
        return error ? { error: error.message } : { ok: true, id: data.id };
      },
    });
  }

  tools.crear_compromiso = tool({
    description: "Anota un compromiso tuyo con fecha límite (aparece en el tablero y se marca si vence).",
    inputSchema: z.object({
      texto: z.string().min(3).max(300),
      fecha_limite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    execute: async ({ texto, fecha_limite }) => {
      const { error } = await db
        .from("equipo_compromisos")
        .insert({ autor_id: null, agente: rol, texto, fecha_limite });
      return error ? { error: error.message } : { ok: true };
    },
  });

  tools.completar_compromiso = tool({
    description: "Marca como hecho uno de tus compromisos abiertos (por id).",
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => {
      const { error } = await db
        .from("equipo_compromisos")
        .update({ hecho: true, hecho_at: new Date().toISOString() })
        .eq("id", id)
        .eq("agente", rol);
      return error ? { error: error.message } : { ok: true };
    },
  });

  // ---------- Externo: siempre a la cola de aprobación ----------
  tools.proponer_accion_externa = tool({
    description: `Propone algo que sale hacia afuera (${agente.acciones.join(", ")}). NO se ejecuta: queda en la cola para que Abraham lo apruebe, edite o rechace. Escribe el texto final, listo para mandar.`,
    inputSchema: z.object({
      tipo: z.enum(agente.acciones as [TipoAccionAgente, ...TipoAccionAgente[]]),
      destinatario: z
        .string()
        .max(200)
        .optional()
        .describe("Correo público, @cuenta, teléfono o nombre del destinatario externo"),
      user_id: z.string().optional().describe("Si es para un socio de la app, su id (de leer_socios); no pongas su correo"),
      asunto: z.string().max(200).optional(),
      cuerpo: z.string().min(10).max(4000),
      justificacion: z.string().max(800).describe("Por qué conviene y qué resultado esperas"),
      monto: z.number().nonnegative().optional().describe("Solo para gasto, en MXN"),
    }),
    execute: async (a) => {
      if (propuestas >= MAX_PROPUESTAS) return { error: `Límite de ${MAX_PROPUESTAS} propuestas por corrida alcanzado.` };
      if (a.tipo === "correo" && !a.user_id && !(a.destinatario ?? "").includes("@")) {
        return { error: "Un correo necesita destinatario con @ o el user_id de un socio." };
      }
      const { error } = await db.from("agente_acciones").insert({
        corrida_id: corridaId,
        rol,
        tipo: a.tipo,
        destinatario: a.destinatario ?? null,
        user_id: a.user_id ?? null,
        asunto: a.asunto ?? null,
        cuerpo: a.cuerpo,
        justificacion: a.justificacion,
        monto: a.monto ?? null,
      });
      if (error) return { error: error.message };
      propuestas += 1;
      return { ok: true, nota: "En la cola de aprobación." };
    },
  });

  return tools;
}

