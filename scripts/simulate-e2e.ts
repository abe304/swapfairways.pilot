/**
 * Simulación end-to-end del piloto sobre TODO el catálogo de clubes.
 *
 * Por cada club genera ofertas de prueba que salen en las próximas 24 horas
 * (combinando: con/sin caddie, con/sin carrito, fecha fija con 1 o 2 horarios,
 * disponibilidad flexible y distintos desgloses de costos), hace solicitudes de
 * juego desde socios invitados, confirma las solicitudes que le llegan a cada
 * anfitrión, marca jugadas las flexibles y verifica el resultado (cupos,
 * estados, costos, créditos). Usa las MISMAS consultas que la app
 * (lib/offers.ts, lib/queries.ts), así que ejercita PostgREST tal como lo ve
 * un socio real.
 *
 * Uso:
 *   npm run simulate                      # backend de demo en memoria
 *   npm run simulate:live                 # Supabase real (lee .env.live)
 *   npm run simulate:live -- --keep       # no borra los datos al terminar
 *   npm run simulate:live -- --cleanup-only
 *   opciones: --per-club N  --limit-clubs N  --hosts N  --guests N  --seed N  --horizon-hours N
 *
 * .env.live (no se sube a git) necesita: NEXT_PUBLIC_SUPABASE_URL,
 * NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.
 *
 * Todo lo que crea usa correos @swf-sim.test y notas "[SIMULACIÓN]"; por
 * defecto lo borra al terminar (los datos de prueba no deben quedar visibles
 * para socios reales en Explorar).
 */
import { writeFileSync } from "fs";
import dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";
import { insertOffers, totalCostos, type Costos, type OfferInsert } from "../lib/offers";
import {
  HOSTED_OFFERS_SELECT,
  MY_REQUESTS_SELECT,
  OFFER_DETAIL_SELECT,
  OFFER_LIST_SELECT,
} from "../lib/queries";

type DB = SupabaseClient<Database>;
type Club = Database["public"]["Tables"]["clubs"]["Row"];

const SIM_DOMAIN = "@swf-sim.test";
const SIM_PASSWORD = "SwfSim-2026-Prueba!";
const NOTA_PREFIX = "[SIMULACIÓN]";

// ---------------------------------------------------------------- argumentos
const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(`--${name}`);
const num = (name: string, def: number) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : def;
};
const LIVE = flag("live");
const KEEP = flag("keep");
const CLEANUP_ONLY = flag("cleanup-only");
const PER_CLUB = num("per-club", 1);
const LIMIT_CLUBS = num("limit-clubs", Infinity);
const N_HOSTS = num("hosts", 8);
const N_GUESTS = num("guests", 12);
const SEED = num("seed", 42);
const HORIZON_HORAS = num("horizon-hours", 24); // ventana en la que salen las rondas de prueba

// ----------------------------------------------------------------- utilidades
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(SEED);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

const chunk = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));

// Hora del centro de México (UTC-6 fijo, sin horario de verano) para fecha/hora.
function aMexico(d: Date) {
  const iso = new Date(d.getTime() - 6 * 3600 * 1000).toISOString();
  return { fecha: iso.slice(0, 10), hora: iso.slice(11, 16) };
}
function desdeMexico(fecha: string, hora: string) {
  return new Date(new Date(`${fecha}T${hora}:00Z`).getTime() + 6 * 3600 * 1000);
}

// ------------------------------------------------------------------ resultados
type StepStats = { ok: number; fail: number };
const steps = new Map<string, StepStats>();
const errores = new Map<string, { count: number; ejemplos: string[] }>();
function registrar(step: string, ok: boolean, detalle?: { error?: string; contexto?: string }) {
  const s = steps.get(step) ?? { ok: 0, fail: 0 };
  if (ok) s.ok++;
  else {
    s.fail++;
    const key = `[${step}] ${detalle?.error ?? "error desconocido"}`;
    const e = errores.get(key) ?? { count: 0, ejemplos: [] };
    e.count++;
    if (detalle?.contexto && e.ejemplos.length < 4) e.ejemplos.push(detalle.contexto);
    errores.set(key, e);
  }
  steps.set(step, s);
}

// -------------------------------------------------------------------- backends
type Socio = { id: string; email: string; nombre: string };
interface Backend {
  label: string;
  admin: DB;
  crearSocio(p: { email: string; nombre: string; club_id: string; handicap: number; creditos: number }): Promise<string>;
  actuarComo(s: Socio): Promise<DB>;
  limpiar(): Promise<number>;
}

async function backendMock(): Promise<Backend> {
  const { store, uid, nowIso, applyCreditTx } = await import("../lib/mock/store");
  const { createMockClientFor } = await import("../lib/mock/actor");
  const asDb = (c: unknown) => c as DB;
  return {
    label: "demo en memoria (backend simulado, NO es PostgREST)",
    admin: asDb(createMockClientFor("admin")),
    async crearSocio({ email, nombre, club_id, handicap, creditos }) {
      const id = uid("user");
      store.authUsers.push({ id, email, password: SIM_PASSWORD });
      store.profiles.push({
        id, nombre, club_id, handicap_manual: handicap, foto_url: null, ghin_id: null, bio: null,
        creditos_balance: 0, is_admin: false, created_at: nowIso(),
      });
      store.profile_clubs.push({ profile_id: id, club_id, created_at: nowIso() });
      applyCreditTx({ id: uid("tx"), user_id: id, tipo: "bienvenida", monto: 3, referencia: null, nota: null, created_at: nowIso() });
      applyCreditTx({ id: uid("tx"), user_id: id, tipo: "ajuste_admin", monto: creditos, referencia: null, nota: NOTA_PREFIX, created_at: nowIso() });
      return id;
    },
    async actuarComo(s) {
      return asDb(createMockClientFor(s.id));
    },
    async limpiar() {
      return 0; // el proceso termina y el store en memoria desaparece
    },
  };
}

async function backendLive(): Promise<Backend> {
  dotenv.config({ path: ".env.live", quiet: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service || url.includes("placeholder")) {
    console.error(
      "Faltan credenciales reales. Crea un archivo .env.live en la raíz del proyecto con:\n" +
        "  NEXT_PUBLIC_SUPABASE_URL=...\n  NEXT_PUBLIC_SUPABASE_ANON_KEY=...\n  SUPABASE_SERVICE_ROLE_KEY=...\n" +
        "(Project Settings > API en Supabase). Ese archivo no se sube a git.",
    );
    process.exit(2);
  }
  const opts = { auth: { autoRefreshToken: false, persistSession: false } };
  const admin = createClient<Database>(url, service, opts);

  return {
    label: `Supabase REAL (${new URL(url).host})`,
    admin,
    async crearSocio({ email, nombre, club_id, handicap, creditos }) {
      const { data, error } = await admin.auth.admin.createUser({
        email, password: SIM_PASSWORD, email_confirm: true, user_metadata: { nombre },
      });
      if (error || !data.user) throw new Error(`createUser(${email}): ${error?.message}`);
      const id = data.user.id;
      const up = await admin.from("profiles").update({ club_id, handicap_manual: handicap }).eq("id", id);
      if (up.error) throw new Error(`profiles.update: ${up.error.message}`);
      const pc = await admin.from("profile_clubs").insert({ profile_id: id, club_id });
      if (pc.error) throw new Error(`profile_clubs.insert: ${pc.error.message} (¿falta la migración 0006?)`);
      const tx = await admin
        .from("credit_transactions")
        .insert({ user_id: id, tipo: "ajuste_admin", monto: creditos, nota: NOTA_PREFIX });
      if (tx.error) throw new Error(`credit_transactions.insert: ${tx.error.message}`);
      return id;
    },
    async actuarComo(s) {
      const c = createClient<Database>(url, anon, opts);
      const { error } = await c.auth.signInWithPassword({ email: s.email, password: SIM_PASSWORD });
      if (error) throw new Error(`login ${s.email}: ${error.message}`);
      return c;
    },
    async limpiar() {
      let borrados = 0;
      for (let page = 1; ; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw new Error(`listUsers: ${error.message}`);
        const sim = data.users.filter((u) => u.email?.endsWith(SIM_DOMAIN));
        for (const u of sim) {
          const del = await admin.auth.admin.deleteUser(u.id);
          if (del.error) throw new Error(`deleteUser ${u.email}: ${del.error.message}`);
          borrados++;
        }
        if (data.users.length < 200) break;
      }
      return borrados;
    },
  };
}

// ------------------------------------------------------------ plan de ofertas
const PERFILES_COSTO: Costos[] = [
  { costo_green_fee: 1200 },
  { costo_green_fee: 900, costo_carrito: 350, costo_caddie: 400 },
  {
    costo_green_fee: 1500, costo_carrito: 400, costo_caddie: 450, costo_desayuno: 180, costo_snacks: 90,
    costo_bebidas: 120, costo_renta_equipo: 600, consumo_minimo: 300, propina_recomendada: 200,
  },
  { costo_carrito: 300, costo_otros: 250, concepto_otros: "Cuota de práctica" },
  {},
];

type Plan = {
  club: Club;
  host: Socio;
  flexible: boolean;
  caddie: boolean;
  carrito: boolean;
  pases: number;
  horarios: Array<{ fecha: string; hora: string }>;
  costos: Costos;
  etiqueta: string;
};

function construirPlan(clubs: Club[], hosts: Socio[]): Plan[] {
  const ahora = Date.now();
  const plan: Plan[] = [];
  let i = 0;
  for (const club of clubs) {
    for (let k = 0; k < PER_CLUB; k++, i++) {
      const flexible = i % 7 === 0;
      const caddie = i % 2 === 0;
      const carrito = i % 3 !== 0;
      const nFechas = !flexible && i % 5 === 0 ? 2 : 1;
      const horarios = flexible
        ? []
        : Array.from({ length: nFechas }, () => {
            const minutos = 90 + Math.floor(rand() * (HORIZON_HORAS * 60 - 120)); // entre ~1.5h y el horizonte (24h por defecto)
            const { fecha, hora } = aMexico(new Date(ahora + minutos * 60 * 1000));
            return { fecha, hora: `${hora.slice(0, 3)}${pick(["00", "10", "20", "30", "40", "50"])}` };
          });
      plan.push({
        club,
        host: hosts[i % hosts.length],
        flexible,
        caddie,
        carrito,
        pases: 1 + (i % 3),
        horarios,
        costos: PERFILES_COSTO[i % PERFILES_COSTO.length],
        etiqueta: [
          flexible ? "flexible" : `${nFechas} fecha${nFechas > 1 ? "s" : ""}`,
          caddie ? "con caddie" : "sin caddie",
          carrito ? "con carrito" : "sin carrito",
          `costos#${i % PERFILES_COSTO.length}`,
        ].join(", "),
      });
    }
  }
  return plan;
}

function filasDeOferta(p: Plan): OfferInsert[] {
  const base = {
    host_id: p.host.id,
    club_id: p.club.id,
    pases_disponibles: p.pases,
    caddie_compartido: p.caddie,
    carrito_compartido: p.carrito,
    ...p.costos,
    costo_estimado: totalCostos(p.costos, { carrito: p.carrito, caddie: p.caddie }),
    nota: `${NOTA_PREFIX} Ronda de prueba en ${p.club.nombre}`,
  } as Omit<OfferInsert, "fecha" | "hora" | "fecha_flexible">;
  return p.flexible
    ? [{ ...base, fecha_flexible: true }]
    : p.horarios.map((h) => ({ ...base, fecha: h.fecha, hora: h.hora, fecha_flexible: false }));
}

// ------------------------------------------------------------------- ejecución
type Creada = { id: string; plan: Plan; aprobadas: number; jugadas: number; fecha: string | null };

async function main() {
  const backend = LIVE ? await backendLive() : await backendMock();
  console.log(`\n=== Simulación E2E — backend: ${backend.label} ===`);

  if (LIVE) {
    const borrados = await backend.limpiar();
    if (borrados) console.log(`(limpieza previa: ${borrados} usuarios de simulación anteriores borrados)`);
    if (CLEANUP_ONLY) return console.log("Listo: solo limpieza.");
    // Verifica que las migraciones necesarias estén aplicadas antes de gastar tiempo.
    const sondeos: Array<[string, PromiseLike<{ error: { message: string } | null }>]> = [
      ["0003 (fecha_flexible)", backend.admin.from("tee_time_offers").select("fecha_flexible").limit(1)],
      ["0005/0008 (costos)", backend.admin.from("tee_time_offers").select("costo_caddie, costo_green_fee, concepto_otros").limit(1)],
      ["0006 (profile_clubs)", backend.admin.from("profile_clubs").select("club_id").limit(1)],
    ];
    const faltan: string[] = [];
    for (const [nombre, q] of sondeos) {
      const { error } = await q;
      if (error) faltan.push(`${nombre}: ${error.message}`);
    }
    if (faltan.length) {
      console.error("\nFaltan migraciones en esa base de datos:\n  - " + faltan.join("\n  - "));
      process.exit(3);
    }
  }

  const { data: clubsData, error: clubsError } = await backend.admin.from("clubs").select("*").order("nombre");
  if (clubsError || !clubsData?.length) {
    console.error("No pude leer el catálogo de clubes:", clubsError?.message ?? "vacío");
    process.exit(3);
  }
  const clubs = (clubsData as unknown as Club[]).slice(0, LIMIT_CLUBS);
  const nombresRepetidos = clubs.length - new Set(clubs.map((c) => c.nombre)).size;

  // Socios de simulación
  const mk = async (prefix: string, n: number, h0: number) =>
    mapLimit(Array.from({ length: n }, (_, i) => i), 4, async (i): Promise<Socio> => {
      const email = `${prefix}-${i + 1}${SIM_DOMAIN}`;
      const nombre = `Sim ${prefix === "host" ? "Anfitrión" : "Invitado"} ${i + 1}`;
      const id = await backend.crearSocio({
        email, nombre, club_id: clubs[(i * 7) % clubs.length].id, handicap: h0 + i, creditos: 60,
      });
      return { id, email, nombre };
    });
  const hosts = await mk("host", N_HOSTS, 6);
  const guests = await mk("guest", N_GUESTS, 14);
  const clientes = new Map<string, DB>();
  for (const s of [...hosts, ...guests]) clientes.set(s.id, await backend.actuarComo(s));

  const saldoInicial = new Map<string, number>();
  const leerSaldos = async () => {
    const out = new Map<string, number>();
    const ids = [...hosts, ...guests].map((s) => s.id);
    const { data } = await backend.admin.from("profiles").select("id, creditos_balance").in("id", ids);
    for (const r of (data ?? []) as unknown as Array<{ id: string; creditos_balance: number }>) out.set(r.id, r.creditos_balance);
    return out;
  };
  (await leerSaldos()).forEach((v, k) => saldoInicial.set(k, v));

  const plan = construirPlan(clubs, hosts);
  console.log(
    `Clubes: ${clubs.length}${nombresRepetidos ? ` (¡${nombresRepetidos} nombres repetidos!)` : ""} | ` +
      `ofertas planeadas: ${plan.length} (${plan.filter((p) => p.flexible).length} flexibles, ` +
      `${plan.filter((p) => p.horarios.length === 2).length} con 2 horarios) | ` +
      `${hosts.length} anfitriones, ${guests.length} invitados\n`,
  );

  // 1) Publicar ofertas — misma consulta que "Anfitrionar una ronda".
  const creadas: Creada[] = [];
  await mapLimit(plan, LIVE ? 6 : 1, async (p) => {
    const { data, error } = await insertOffers(clientes.get(p.host.id)!, filasDeOferta(p));
    const esperadas = p.flexible ? 1 : p.horarios.length;
    if (error || !data || data.length !== esperadas) {
      registrar("1. Publicar ofertas", false, {
        error: error?.message ?? `insertó ${data?.length ?? 0} de ${esperadas}`,
        contexto: `${p.club.nombre} (${p.etiqueta})`,
      });
      return;
    }
    registrar("1. Publicar ofertas", true);
    for (const row of data) creadas.push({ id: row.id, plan: p, aprobadas: 0, jugadas: 0, fecha: null });
  });

  // Fecha real de cada oferta publicada (el INSERT solo devuelve el id).
  for (const grupo of chunk(creadas, 40)) {
    const { data } = await backend.admin
      .from("tee_time_offers")
      .select("id, fecha")
      .in("id", grupo.map((o) => o.id));
    for (const r of (data ?? []) as unknown as Array<{ id: string; fecha: string | null }>) {
      const o = creadas.find((x) => x.id === r.id);
      if (o) o.fecha = r.fecha;
    }
  }

  // 2) Solicitudes de juego desde invitados (2 solicitudes en ofertas de 2+ pases, cada 2ª).
  const solicitudes: Array<{ offer: Creada; guest: Socio; requestId: string }> = [];
  await mapLimit(creadas, LIVE ? 6 : 1, async (o, i) => {
    const solicitantes = [guests[i % guests.length]];
    if (o.plan.pases >= 2 && i % 2 === 0) solicitantes.push(guests[(i + 1) % guests.length]);
    for (const guest of solicitantes) {
      const { data, error } = await clientes.get(guest.id)!.rpc("create_join_request", { p_offer_id: o.id });
      const requestId = (data as unknown as { id?: string } | null)?.id;
      if (error || !requestId) {
        registrar("2. Solicitudes de juego", false, {
          error: error?.message ?? "sin id de solicitud",
          contexto: `${o.plan.club.nombre} (${o.plan.etiqueta})`,
        });
      } else {
        registrar("2. Solicitudes de juego", true);
        solicitudes.push({ offer: o, guest, requestId });
      }
    }
  });

  // 3) Cada anfitrión revisa "Mis rondas" y confirma lo que le llegó.
  type Hosted = {
    id: string;
    requests: Array<{ id: string; estado: string }>;
  };
  const porOferta = new Map(creadas.map((o) => [o.id, o]));
  const aprobadas: Array<{ offer: Creada; requestId: string }> = [];
  await mapLimit(hosts, 4, async (h) => {
    const c = clientes.get(h.id)!;
    const { data, error } = await c.from("tee_time_offers").select(HOSTED_OFFERS_SELECT).eq("host_id", h.id);
    if (error) {
      registrar("3. Confirmar solicitudes", false, { error: `Mis rondas: ${error.message}`, contexto: h.nombre });
      return;
    }
    const mias = (data as unknown as Hosted[]).filter((o) => porOferta.has(o.id));
    for (const oferta of mias) {
      for (const req of oferta.requests.filter((r) => r.estado === "pendiente")) {
        const { error: e } = await c.rpc("approve_request", { p_request_id: req.id });
        const o = porOferta.get(oferta.id)!;
        if (e) {
          registrar("3. Confirmar solicitudes", false, { error: e.message, contexto: `${o.plan.club.nombre} (${o.plan.etiqueta})` });
        } else {
          registrar("3. Confirmar solicitudes", true);
          o.aprobadas++;
          aprobadas.push({ offer: o, requestId: req.id });
        }
      }
    }
  });
  const sinConfirmar = solicitudes.length - aprobadas.length;
  if (sinConfirmar > 0 && !steps.get("3. Confirmar solicitudes")?.fail) {
    registrar("3. Confirmar solicitudes", false, { error: `${sinConfirmar} solicitudes no aparecieron en "Mis rondas" del anfitrión` });
  }

  // 4) Marcar jugadas. La regla real compara por DÍA (fecha > current_date, en UTC):
  //    - flexibles: siempre se pueden marcar (no hay fecha que esperar);
  //    - fecha fija con día estrictamente futuro: debe rechazarse con "Aún no es la fecha".
  const hoyUtc = new Date().toISOString().slice(0, 10);
  const jugadas: Array<{ offer: Creada; requestId: string }> = [];
  let negativas = 0;
  for (const a of aprobadas) {
    const c = clientes.get(a.offer.plan.host.id)!;
    if (a.offer.plan.flexible) {
      const { error } = await c.rpc("mark_request_played", { p_request_id: a.requestId });
      if (error) registrar("4. Marcar jugada (flexibles)", false, { error: error.message, contexto: a.offer.plan.club.nombre });
      else {
        registrar("4. Marcar jugada (flexibles)", true);
        a.offer.jugadas++;
        jugadas.push(a);
      }
    } else if (negativas < 5 && a.offer.fecha && a.offer.fecha > hoyUtc) {
      negativas++;
      const { error } = await c.rpc("mark_request_played", { p_request_id: a.requestId });
      const okEsperado = !!error && /fecha/i.test(error.message);
      registrar("4b. Rechaza jugada con día futuro (esperado)", okEsperado, {
        error: error ? `mensaje inesperado: ${error.message}` : "se permitió marcar jugada antes de su día",
        contexto: a.offer.plan.club.nombre,
      });
      if (!error) jugadas.push(a); // para que el cálculo de créditos siga cuadrando
    }
  }
  if (negativas === 0) {
    console.log("(nota: ninguna oferta de fecha fija cae en un día posterior a hoy (UTC); se omitió la prueba negativa de jugada anticipada)");
  }

  // 5) Verificaciones de resultado y de las consultas que usa la UI.
  const hoyMx = aMexico(new Date()).fecha;
  const ahora = Date.now();
  for (const grupo of chunk(creadas, 40)) {
    const ids = grupo.map((o) => o.id);
    const { data, error } = await backend.admin
      .from("tee_time_offers")
      .select("id, estado, pases_disponibles, pases_confirmados, costo_estimado, fecha, hora, fecha_flexible, nota")
      .in("id", ids);
    if (error) {
      registrar("5. Verificación de datos", false, { error: error.message });
      continue;
    }
    for (const row of (data ?? []) as unknown as Array<{
      id: string; estado: string; pases_disponibles: number; pases_confirmados: number;
      costo_estimado: number | null; fecha: string | null; hora: string | null; fecha_flexible: boolean; nota: string | null;
    }>) {
      const o = porOferta.get(row.id)!;
      const problemas: string[] = [];
      if (row.pases_confirmados !== o.aprobadas) problemas.push(`pases_confirmados=${row.pases_confirmados}, esperado ${o.aprobadas}`);
      const cerrada = row.pases_confirmados >= row.pases_disponibles;
      if ((row.estado === "cerrada") !== cerrada) problemas.push(`estado=${row.estado} con ${row.pases_confirmados}/${row.pases_disponibles} pases`);
      if (Number(row.costo_estimado ?? 0) !== totalCostos(o.plan.costos, { carrito: o.plan.carrito, caddie: o.plan.caddie })) problemas.push(`costo_estimado=${row.costo_estimado}, esperado ${totalCostos(o.plan.costos, { carrito: o.plan.carrito, caddie: o.plan.caddie })}`);
      if (row.fecha_flexible !== o.plan.flexible) problemas.push("fecha_flexible no coincide");
      if (!row.fecha_flexible) {
        const t = row.fecha && row.hora ? desdeMexico(row.fecha, row.hora.slice(0, 5)).getTime() : NaN;
        if (!(t > ahora && t <= ahora + (HORIZON_HORAS + 1) * 3600 * 1000)) problemas.push(`salida fuera del horizonte de ${HORIZON_HORAS}h (${row.fecha} ${row.hora})`);
      }
      registrar("5. Verificación de datos", problemas.length === 0, {
        error: problemas.join("; "),
        contexto: `${o.plan.club.nombre} (${o.plan.etiqueta})`,
      });
    }
  }

  // Consultas de las pantallas, ejecutadas como un invitado real.
  const g0 = clientes.get(guests[0].id)!;
  {
    const fijas = await g0.from("tee_time_offers").select(OFFER_LIST_SELECT).eq("estado", "activa").eq("fecha_flexible", false).gte("fecha", hoyMx).order("fecha", { ascending: true });
    const flex = await g0.from("tee_time_offers").select(OFFER_LIST_SELECT).eq("estado", "activa").eq("fecha_flexible", true).order("created_at", { ascending: false });
    registrar("6. Pantalla Explorar (consultas)", !fijas.error && !flex.error, { error: fijas.error?.message ?? flex.error?.message });
    if (!fijas.error && !flex.error) {
      const visibles = new Set([...(fijas.data ?? []), ...(flex.data ?? [])].map((r) => (r as unknown as { id: string }).id));
      const esperadas = creadas.filter((o) => o.aprobadas < o.plan.pases).map((o) => o.id);
      const faltan = esperadas.filter((id) => !visibles.has(id));
      registrar("6. Explorar muestra las ofertas con cupo", faltan.length === 0, {
        error: `${faltan.length} ofertas con cupo no aparecen en Explorar`,
      });
    }
    for (const o of creadas.slice(0, 5)) {
      const r = await g0.from("tee_time_offers").select(OFFER_DETAIL_SELECT).eq("id", o.id).single();
      registrar("6. Pantalla Detalle de oferta (consulta)", !r.error, { error: r.error?.message, contexto: o.plan.club.nombre });
    }
    for (const g of guests) {
      const r = await clientes.get(g.id)!.from("requests").select(MY_REQUESTS_SELECT).eq("guest_id", g.id);
      const esperadas = solicitudes.filter((s) => s.guest.id === g.id).length;
      const n = (r.data ?? []).length;
      registrar("6. Mis rondas del invitado (consulta)", !r.error && n === esperadas, {
        error: r.error?.message ?? `${n} solicitudes visibles, esperadas ${esperadas}`,
        contexto: g.nombre,
      });
    }
  }

  // Créditos: por cada jugada, el invitado paga el costo del club y el anfitrión lo recibe.
  const saldoFinal = await leerSaldos();
  const delta = new Map<string, number>();
  for (const a of jugadas) {
    const costo = a.offer.plan.club.costo_creditos ?? 1;
    const g = solicitudes.find((s) => s.requestId === a.requestId)!.guest.id;
    delta.set(g, (delta.get(g) ?? 0) - costo);
    delta.set(a.offer.plan.host.id, (delta.get(a.offer.plan.host.id) ?? 0) + costo);
  }
  for (const s of [...hosts, ...guests]) {
    const esperado = (saldoInicial.get(s.id) ?? 0) + (delta.get(s.id) ?? 0);
    const real = saldoFinal.get(s.id);
    registrar("7. Créditos", real === esperado, { error: `saldo ${real}, esperado ${esperado}`, contexto: s.nombre });
  }

  // ---------------------------------------------------------------- reporte
  console.log("Paso".padEnd(52) + "OK".padStart(6) + "Fallos".padStart(8));
  console.log("-".repeat(66));
  for (const [nombre, s] of [...steps.entries()].sort()) {
    console.log(nombre.padEnd(52) + String(s.ok).padStart(6) + String(s.fail).padStart(8));
  }
  const totalFallos = [...steps.values()].reduce((n, s) => n + s.fail, 0);
  if (errores.size) {
    console.log("\nErrores agrupados:");
    for (const [msg, e] of [...errores.entries()].sort((a, b) => b[1].count - a[1].count)) {
      console.log(`  (${e.count}×) ${msg}`);
      for (const ej of e.ejemplos) console.log(`        ej.: ${ej}`);
    }
  }
  writeFileSync(
    "sim-report.json",
    JSON.stringify(
      { backend: backend.label, fecha: new Date().toISOString(), clubes: clubs.length, ofertas: creadas.length, solicitudes: solicitudes.length, aprobadas: aprobadas.length, pasos: Object.fromEntries(steps), errores: Object.fromEntries(errores) },
      null,
      2,
    ),
  );
  console.log(
    `\nResumen: ${creadas.length} ofertas publicadas · ${solicitudes.length} solicitudes · ${aprobadas.length} confirmadas · ` +
      `${totalFallos === 0 ? "SIN FALLOS ✔" : `${totalFallos} FALLOS ✘`}  (detalle en sim-report.json)`,
  );

  if (LIVE && !KEEP) {
    const n = await backend.limpiar();
    console.log(`Limpieza: ${n} usuarios de simulación borrados (y con ellos sus ofertas/solicitudes). Usa --keep para conservarlos.`);
  } else if (LIVE) {
    console.log(`Datos conservados (--keep). Para borrarlos: npm run simulate:live -- --cleanup-only`);
  }
  process.exit(totalFallos === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("\nLa simulación se detuvo por un error inesperado:", e instanceof Error ? e.message : e);
  process.exit(4);
});
