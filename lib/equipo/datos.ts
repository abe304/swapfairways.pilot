// Datos del equipo y KPIs de producto para /equipo y /admin/equipo.
//
// * Lo del equipo (actividades, pipeline, check-ins…) se lee con el cliente
//   del usuario: RLS (migración 0026) decide qué ve cada quien.
// * Los KPIs de producto se calculan en el servidor con la service role
//   (lee profiles, ofertas, solicitudes y créditos de todos), y solo se
//   llaman después de comprobar que quien entra es del equipo o admin.
// * Para el piloto se leen las filas y se cuenta en JS. Si algún día una
//   tabla pasa de ~1000 filas (límite por defecto de PostgREST), conviene
//   mover estos conteos a una función SQL.
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  EquipoActividad,
  EquipoCheckin,
  EquipoCompromiso,
  EquipoMeta,
  EquipoMiembro,
  EquipoPipeline,
  FinanzasMovimiento,
  Profile,
  RolEquipo,
} from "@/lib/supabase/types";
import { MOCK_MODE } from "@/lib/mock/is-mock";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { hoyMexico, lunesDe, sumarDias, ROLES, ROL_POR_CLAVE } from "./roles";

type Db = SupabaseClient<Database>;

// Cliente con lectura total (service role). En modo demo, el simulado.
export async function dbServicio(): Promise<Db> {
  if (MOCK_MODE) return (await createClient()) as unknown as Db;
  const { createAdminClient } = await import("@/lib/supabase/admin");
  return createAdminClient();
}

export type Acceso = {
  profile: Profile;
  miembro: EquipoMiembro | null;
  rol: RolEquipo | null;
  esAdmin: boolean;
  /** true si la migración 0026 todavía no está corrida. */
  sinTablas: boolean;
};

// Para páginas del equipo: miembro activo o admin. Los demás vuelven a la app.
export async function requireEquipo(): Promise<Acceso> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipo_miembros")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const miembro = data && (data as EquipoMiembro).activo ? (data as EquipoMiembro) : null;
  if (!miembro && !profile.is_admin) redirect("/ofertas");
  return { profile, miembro, rol: miembro?.rol ?? null, esAdmin: profile.is_admin, sinTablas: !!error };
}

export type MiembroConNombre = EquipoMiembro & { nombre: string };

export type DatosEquipo = {
  miembros: MiembroConNombre[];
  metas: Record<string, number>;
  actividades: EquipoActividad[];
  checkins: EquipoCheckin[];
  compromisos: EquipoCompromiso[];
  pipeline: EquipoPipeline[];
  nombres: Record<string, string>;
  error: string | null;
};

// Todo lo del equipo de las últimas 8 semanas (actividades y check-ins) y el
// pipeline y compromisos abiertos completos.
export async function cargarEquipo(cliente?: Db): Promise<DatosEquipo> {
  const supabase = cliente ?? (await createClient());
  const desde = sumarDias(lunesDe(), -7 * 7);
  const [miembros, metas, actividades, checkins, compromisos, pipeline] = await Promise.all([
    supabase.from("equipo_miembros").select("*"),
    supabase.from("equipo_metas").select("*"),
    supabase
      .from("equipo_actividades")
      .select("*")
      .gte("fecha", desde)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("equipo_checkins").select("*").gte("semana", desde).order("semana", { ascending: false }),
    supabase.from("equipo_compromisos").select("*").order("fecha_limite", { ascending: true }),
    supabase.from("equipo_pipeline").select("*").order("updated_at", { ascending: false }),
  ]);

  const error = miembros.error?.message ?? actividades.error?.message ?? null;
  const filasMiembros = (miembros.data ?? []) as EquipoMiembro[];
  const ids = new Set<string>(filasMiembros.map((m) => m.profile_id));
  for (const p of (pipeline.data ?? []) as EquipoPipeline[]) if (p.responsable_id) ids.add(p.responsable_id);
  for (const a of (actividades.data ?? []) as EquipoActividad[]) if (a.autor_id) ids.add(a.autor_id);

  const nombres: Record<string, string> = {};
  if (ids.size) {
    const { data: perfiles } = await supabase.from("profiles").select("id, nombre").in("id", [...ids]);
    for (const p of perfiles ?? []) nombres[p.id as string] = p.nombre as string;
  }

  const metasMap: Record<string, number> = Object.fromEntries(ROLES.map((r) => [r.rol, 0]));
  for (const m of (metas.data ?? []) as EquipoMeta[]) metasMap[m.rol] = m.actividades_semana;

  return {
    miembros: filasMiembros.map((m) => ({ ...m, nombre: nombres[m.profile_id] ?? "Sin nombre" })),
    metas: metasMap,
    actividades: (actividades.data ?? []) as EquipoActividad[],
    checkins: (checkins.data ?? []) as EquipoCheckin[],
    compromisos: (compromisos.data ?? []) as EquipoCompromiso[],
    pipeline: (pipeline.data ?? []) as EquipoPipeline[],
    nombres,
    error,
  };
}

// Nombre de quien hizo algo: una persona o un agente de IA.
export function quien(
  fila: { agente?: string | null; autor_id?: string | null; responsable_id?: string | null },
  nombres: Record<string, string>,
) {
  if (fila.agente) return `Agente ${ROL_POR_CLAVE[fila.agente as RolEquipo]?.titulo ?? fila.agente}`;
  const id = fila.autor_id ?? fila.responsable_id;
  return (id && nombres[id]) || "—";
}

// ---------- Semáforo por persona ----------
export type Semaforo = "verde" | "amarillo" | "rojo";

export type EstadoMiembro = {
  miembro: MiembroConNombre;
  meta: number;
  semana: number; // actividades de lunes a hoy
  ultimos7: number;
  ultimaActividad: string | null;
  checkinSemana: boolean;
  vencidos: number;
  semaforo: Semaforo;
  motivo: string;
};

export function estadoDelEquipo(d: DatosEquipo): EstadoMiembro[] {
  const hoy = hoyMexico();
  const lunes = lunesDe(hoy);
  const hace7 = sumarDias(hoy, -6);
  // Días transcurridos de la semana (lunes = 1 … domingo = 7), para no
  // marcar en rojo a nadie el lunes temprano.
  const diasSemana = Math.round((Date.parse(hoy) - Date.parse(lunes)) / 86400000) + 1;

  return d.miembros
    .filter((m) => m.activo)
    .map((m) => {
      const propias = d.actividades.filter((a) => a.autor_id === m.profile_id);
      const semana = propias.filter((a) => a.fecha >= lunes).length;
      const ultimos7 = propias.filter((a) => a.fecha >= hace7).length;
      const ultimaActividad = propias[0]?.fecha ?? null;
      const checkinSemana = d.checkins.some((c) => c.autor_id === m.profile_id && c.semana === lunes);
      const vencidos = d.compromisos.filter(
        (c) => c.autor_id === m.profile_id && !c.hecho && c.fecha_limite < hoy,
      ).length;
      const meta = d.metas[m.rol] ?? 0;
      const esperado = Math.ceil((meta * Math.min(diasSemana, 5)) / 5);

      let semaforo: Semaforo = "verde";
      const motivos: string[] = [];
      if (ultimos7 === 0) {
        semaforo = "rojo";
        motivos.push("sin actividad en 7 días");
      } else if (semana < esperado) {
        semaforo = "amarillo";
        motivos.push(`${semana} de ${esperado} esperadas a hoy`);
      }
      if (!checkinSemana && diasSemana >= 2) {
        semaforo = semaforo === "verde" ? "amarillo" : "rojo";
        motivos.push("falta check-in");
      }
      if (vencidos > 0) {
        semaforo = semaforo === "verde" ? "amarillo" : "rojo";
        motivos.push(`${vencidos} compromiso${vencidos === 1 ? "" : "s"} vencido${vencidos === 1 ? "" : "s"}`);
      }
      return {
        miembro: m,
        meta,
        semana,
        ultimos7,
        ultimaActividad,
        checkinSemana,
        vencidos,
        semaforo,
        motivo: motivos.length ? motivos.join(" · ") : "en meta",
      };
    });
}

// ---------- KPIs de producto (datos reales de la app) ----------
export type SemanaSerie = { lunes: string; registros: number; ofertas: number; solicitudes: number; jugadas: number };

export type MetricasProducto = {
  socios: number;
  nuevos7: number;
  nuevos30: number;
  conClub: number;
  activados: number; // publicaron al menos una oferta
  solicitaron: number;
  jugaron: number; // jugaron al menos una ronda (como anfitrión o invitado)
  activos30: number;
  ofertas7: number;
  ofertas30: number;
  ofertasAbiertas: number;
  solicitudes7: number;
  solicitudes30: number;
  tasaAprobacion: number | null; // de las solicitudes ya respondidas
  pendientesSinRespuesta: number; // pendientes de más de 72 h
  jugadas7: number;
  jugadas30: number;
  clubesConOfertas: number;
  clubesConOfertas30: number;
  creditosCirculacion: number;
  creditosMovidos30: number;
  listaEsperaPendiente: number;
  correos7: number;
  serie: SemanaSerie[];
  error: string | null;
};

export async function metricasProducto(): Promise<MetricasProducto> {
  const db = await dbServicio();
  const hoy = hoyMexico();
  const hace7 = sumarDias(hoy, -6);
  const hace30 = sumarDias(hoy, -29);
  const ahora = Date.now();

  const [perfiles, ofertas, solicitudes, transacciones, espera, correos] = await Promise.all([
    db.from("profiles").select("id, club_id, creditos_balance, created_at"),
    db.from("tee_time_offers").select("id, host_id, club_id, fecha, fecha_flexible, estado, created_at"),
    db.from("requests").select("id, offer_id, guest_id, estado, created_at, aprobado_at, jugado_at"),
    db.from("credit_transactions").select("monto, tipo, created_at"),
    db.from("lista_espera").select("estado"),
    MOCK_MODE
      ? Promise.resolve({ data: [] as { enviado_at: string }[], error: null })
      : db.from("correos_enviados").select("enviado_at"),
  ]);

  const P = (perfiles.data ?? []) as { id: string; club_id: string | null; creditos_balance: number; created_at: string }[];
  const O = (ofertas.data ?? []) as {
    id: string;
    host_id: string;
    club_id: string;
    fecha: string | null;
    fecha_flexible: boolean;
    estado: string;
    created_at: string;
  }[];
  const R = (solicitudes.data ?? []) as {
    id: string;
    offer_id: string;
    guest_id: string;
    estado: string;
    created_at: string;
    aprobado_at: string | null;
    jugado_at: string | null;
  }[];
  const T = (transacciones.data ?? []) as { monto: number; tipo: string; created_at: string }[];

  const dia = (iso: string | null | undefined) => (iso ? new Date(Date.parse(iso) - 6 * 3600000).toISOString().slice(0, 10) : "");
  const hostDeOferta = new Map(O.map((o) => [o.id, o]));
  const jugadas = R.filter((r) => r.estado === "jugado");

  const activados = new Set(O.map((o) => o.host_id));
  const solicitaron = new Set(R.map((r) => r.guest_id));
  const jugaron = new Set<string>();
  for (const r of jugadas) {
    jugaron.add(r.guest_id);
    const o = hostDeOferta.get(r.offer_id);
    if (o) jugaron.add(o.host_id);
  }
  const activos30 = new Set<string>([
    ...O.filter((o) => dia(o.created_at) >= hace30).map((o) => o.host_id),
    ...R.filter((r) => dia(r.created_at) >= hace30).map((r) => r.guest_id),
  ]);

  const respondidas = R.filter((r) => ["aprobado", "rechazado", "jugado"].includes(r.estado));
  const aprobadas = respondidas.filter((r) => r.estado !== "rechazado").length;

  const serie: SemanaSerie[] = [];
  const lunesActual = lunesDe(hoy);
  for (let i = 7; i >= 0; i--) {
    const ini = sumarDias(lunesActual, -7 * i);
    const fin = sumarDias(ini, 7);
    const enSemana = (iso: string | null) => {
      const d = dia(iso);
      return d >= ini && d < fin;
    };
    serie.push({
      lunes: ini,
      registros: P.filter((p) => enSemana(p.created_at)).length,
      ofertas: O.filter((o) => enSemana(o.created_at)).length,
      solicitudes: R.filter((r) => enSemana(r.created_at)).length,
      jugadas: jugadas.filter((r) => enSemana(r.jugado_at)).length,
    });
  }

  return {
    socios: P.length,
    nuevos7: P.filter((p) => dia(p.created_at) >= hace7).length,
    nuevos30: P.filter((p) => dia(p.created_at) >= hace30).length,
    conClub: P.filter((p) => p.club_id).length,
    activados: activados.size,
    solicitaron: solicitaron.size,
    jugaron: jugaron.size,
    activos30: activos30.size,
    ofertas7: O.filter((o) => dia(o.created_at) >= hace7).length,
    ofertas30: O.filter((o) => dia(o.created_at) >= hace30).length,
    ofertasAbiertas: O.filter((o) => o.estado === "activa" && (o.fecha_flexible || (o.fecha ?? "") >= hoy)).length,
    solicitudes7: R.filter((r) => dia(r.created_at) >= hace7).length,
    solicitudes30: R.filter((r) => dia(r.created_at) >= hace30).length,
    tasaAprobacion: respondidas.length ? aprobadas / respondidas.length : null,
    pendientesSinRespuesta: R.filter(
      (r) => r.estado === "pendiente" && ahora - Date.parse(r.created_at) > 72 * 3600000,
    ).length,
    jugadas7: jugadas.filter((r) => dia(r.jugado_at) >= hace7).length,
    jugadas30: jugadas.filter((r) => dia(r.jugado_at) >= hace30).length,
    clubesConOfertas: new Set(O.map((o) => o.club_id)).size,
    clubesConOfertas30: new Set(O.filter((o) => dia(o.created_at) >= hace30).map((o) => o.club_id)).size,
    creditosCirculacion: P.reduce((t, p) => t + (p.creditos_balance ?? 0), 0),
    creditosMovidos30: T.filter((t) => t.tipo === "gastado" && dia(t.created_at) >= hace30).reduce(
      (s, t) => s + Math.abs(t.monto),
      0,
    ),
    listaEsperaPendiente: ((espera.data ?? []) as { estado: string }[]).filter((e) => e.estado === "pendiente").length,
    correos7: ((correos.data ?? []) as { enviado_at: string }[]).filter((c) => dia(c.enviado_at) >= hace7).length,
    serie,
    error: perfiles.error?.message ?? ofertas.error?.message ?? solicitudes.error?.message ?? null,
  };
}

// ---------- Finanzas ----------
export type MesPyL = { mes: string; ingresos: number; gastos: number; publicidad: number; registros: number };

export type ResumenFinanzas = {
  movimientos: FinanzasMovimiento[];
  meses: MesPyL[]; // últimos 6 meses, del más reciente al más viejo
  porCategoria: Record<string, number>; // gasto del mes actual
  error: string | null;
};

// Lee con el cliente del usuario: RLS solo deja ver finanzas al admin y al
// rol de Finanzas. `registrosPorMes` sale de los KPIs de producto.
export async function resumenFinanzas(registrosPorMes: Record<string, number>): Promise<ResumenFinanzas> {
  const supabase = await createClient();
  const hoy = hoyMexico();
  const meses: string[] = [];
  const d = new Date(`${hoy.slice(0, 7)}-01T12:00:00Z`);
  for (let i = 0; i < 6; i++) {
    meses.push(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  const { data, error } = await supabase
    .from("finanzas_movimientos")
    .select("*")
    .gte("fecha", `${meses[meses.length - 1]}-01`)
    .order("fecha", { ascending: false });
  const movimientos = ((data ?? []) as FinanzasMovimiento[]).map((m) => ({ ...m, monto: Number(m.monto) }));

  const porCategoria: Record<string, number> = {};
  for (const m of movimientos) {
    if (m.tipo === "gasto" && m.fecha.startsWith(meses[0])) {
      porCategoria[m.categoria] = (porCategoria[m.categoria] ?? 0) + m.monto;
    }
  }

  return {
    movimientos,
    meses: meses.map((mes) => {
      const delMes = movimientos.filter((m) => m.fecha.startsWith(mes));
      const suma = (f: (m: FinanzasMovimiento) => boolean) => delMes.filter(f).reduce((t, m) => t + m.monto, 0);
      return {
        mes,
        ingresos: suma((m) => m.tipo === "ingreso"),
        gastos: suma((m) => m.tipo === "gasto"),
        publicidad: suma((m) => m.tipo === "gasto" && m.categoria === "publicidad"),
        registros: registrosPorMes[mes] ?? 0,
      };
    }),
    porCategoria,
    error: error?.message ?? null,
  };
}

// Registros nuevos por mes (YYYY-MM) para el costo por registro.
export async function registrosPorMes(): Promise<Record<string, number>> {
  const db = await dbServicio();
  const { data } = await db.from("profiles").select("created_at");
  const out: Record<string, number> = {};
  for (const p of (data ?? []) as { created_at: string }[]) {
    const mes = new Date(Date.parse(p.created_at) - 6 * 3600000).toISOString().slice(0, 7);
    out[mes] = (out[mes] ?? 0) + 1;
  }
  return out;
}
