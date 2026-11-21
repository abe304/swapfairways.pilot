// Envío de los correos de ciclo de vida. Ver docs/correos-ciclo-de-vida.md.
//
// * T1 y T2 se mandan en el momento (registro y primera oferta).
// * T4, T7 y T8, y los de seguimiento S1–S3, los manda revisionDiaria(),
//   que corre una vez al día desde /api/cron/correos (Vercel Cron).
// * S1–S3 respetan profiles.correos_seguimiento (migración 0023) y llevan
//   enlace de baja (lib/correos/baja.ts). T1–T8 siempre se mandan.
//
// Cada correo se registra en correos_enviados (migración 0022) ANTES de
// mandarlo: si ya estaba registrado no se repite. Si el envío falla, se
// borra el registro para que se intente de nuevo en la siguiente revisión.
// Todo es best-effort: un error aquí nunca debe romper la acción del socio.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { MOCK_MODE } from "@/lib/mock/is-mock";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { formatFecha, formatHora } from "@/lib/utils";
import { creditosPorNivel, nivelLabel, type ClubNivel } from "@/lib/niveles";
import { enlaceBaja } from "./baja";
import {
  t1Bienvenida,
  t2CreditosActivados,
  t4SolicitudSinRespuesta,
  t7RondaManana,
  t8MarcarJugada,
  t8Resena,
  s1SinOfertas,
  s2PrimerHosteo,
  s3PrimeraSalida,
  type Correo,
} from "./plantillas";

const REMITENTE = "Abraham de SwapFairways";
const DIA_MS = 24 * 60 * 60 * 1000;

type Db = SupabaseClient<Database>;
export type TipoCorreo = "T1" | "T2" | "T4" | "T7" | "T8" | "S1" | "S2" | "S3";

// Cliente que puede leer todo (service role). En modo demo, el simulado.
async function db(): Promise<Db> {
  if (MOCK_MODE) return (await createClient()) as unknown as Db;
  const { createAdminClient } = await import("@/lib/supabase/admin");
  return createAdminClient();
}

async function emailDe(userId: string): Promise<string | null> {
  if (MOCK_MODE) {
    const { store } = await import("@/lib/mock/store");
    return store.authUsers.find((u) => u.id === userId)?.email ?? null;
  }
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data } = await createAdminClient().auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

// En modo demo el registro vive en memoria (no hay tabla).
const registroDemo: Set<string> =
  ((globalThis as Record<string, unknown>).__swfCorreosDemo as Set<string>) ??
  ((globalThis as Record<string, unknown>).__swfCorreosDemo = new Set<string>());

async function apartar(cliente: Db, userId: string, tipo: TipoCorreo, referencia: string) {
  if (MOCK_MODE) {
    const llave = `${userId}|${tipo}|${referencia}`;
    if (registroDemo.has(llave)) return false;
    registroDemo.add(llave);
    return true;
  }
  const { error } = await cliente
    .from("correos_enviados")
    .insert({ user_id: userId, tipo, referencia });
  if (!error) return true;
  // 23505 = ya existía: ese correo ya se mandó. Cualquier otro error (p. ej.
  // la tabla no existe todavía) también detiene el envío: mejor no mandar
  // que mandar el mismo correo todos los días.
  if (error.code !== "23505") console.error("[correos] No se pudo registrar el envío:", error);
  return false;
}

async function liberar(cliente: Db, userId: string, tipo: TipoCorreo, referencia: string) {
  if (MOCK_MODE) {
    registroDemo.delete(`${userId}|${tipo}|${referencia}`);
    return;
  }
  await cliente
    .from("correos_enviados")
    .delete()
    .eq("user_id", userId)
    .eq("tipo", tipo)
    .eq("referencia", referencia);
}

export type ResultadoEnvio = "enviado" | "ya_enviado" | "sin_correo" | "fallo";

async function enviarUnaVez(
  cliente: Db,
  args: {
    userId: string;
    tipo: TipoCorreo;
    referencia?: string;
    correo: Correo;
    to?: string;
    headers?: Record<string, string>;
  },
): Promise<ResultadoEnvio> {
  const referencia = args.referencia ?? "";
  if (!(await apartar(cliente, args.userId, args.tipo, referencia))) return "ya_enviado";

  const to = args.to ?? (await emailDe(args.userId));
  if (!to) {
    await liberar(cliente, args.userId, args.tipo, referencia);
    return "sin_correo";
  }

  const res = await sendEmail({ to, ...args.correo, fromName: REMITENTE, headers: args.headers });
  if (!res.ok) {
    await liberar(cliente, args.userId, args.tipo, referencia);
    return "fallo";
  }
  return "enviado";
}

// "Hoy" en el centro de México (UTC-6 todo el año), como en ofertas/actions.
function fechaMexico(desplazamientoDias = 0) {
  return new Date(Date.now() - 6 * 60 * 60 * 1000 + desplazamientoDias * DIA_MS)
    .toISOString()
    .slice(0, 10);
}

function fechaLabel(o: { fecha: string | null; hora: string | null; fecha_flexible: boolean }) {
  if (o.fecha_flexible || !o.fecha) return "fecha a coordinar";
  return o.hora ? `${formatFecha(o.fecha)} · ${formatHora(o.hora)}` : formatFecha(o.fecha);
}

// ============================================================
// T1 · Bienvenida (al registrarse)
// ============================================================
export async function enviarBienvenida(params: {
  userId: string;
  nombre: string;
  email: string;
  sitio: string;
}) {
  const cliente = await db();
  return enviarUnaVez(cliente, {
    userId: params.userId,
    tipo: "T1",
    to: params.email,
    // Al registrarse todavía no hay club en el perfil.
    correo: t1Bienvenida({ nombre: params.nombre, sitio: params.sitio, clubNombre: null }),
  });
}

// ============================================================
// T2 · Créditos activados (al publicar la primera oferta)
// ============================================================
// Solo se manda si el trigger de la 0021 acaba de dar el bono: así no le
// llega a quien ya tenía sus créditos desde antes.
export async function enviarCreditosActivados(params: {
  userId: string;
  nombre: string;
  sitio: string;
  clubId: string;
  ofertas: Array<{ fecha: string | null; hora: string | null; fecha_flexible: boolean }>;
}) {
  const cliente = await db();

  const { data: bonos } = await cliente
    .from("credit_transactions")
    .select("created_at")
    .eq("user_id", params.userId)
    .eq("tipo", "bienvenida");
  const recien = (bonos ?? []).some(
    (b) => Date.now() - new Date(b.created_at as string).getTime() < 10 * 60 * 1000,
  );
  if (!recien) return "ya_enviado" as const;

  const { data: club } = await cliente
    .from("clubs")
    .select("nombre")
    .eq("id", params.clubId)
    .maybeSingle();

  const hoy = fechaMexico();
  const { data: activas } = await cliente
    .from("tee_time_offers")
    .select("host_id, fecha, fecha_flexible")
    .eq("estado", "activa");
  const ofertasAbiertas = (activas ?? []).filter(
    (o) => o.host_id !== params.userId && (o.fecha_flexible || (o.fecha ?? "") >= hoy),
  ).length;

  const [primera, ...resto] = params.ofertas;
  const label =
    fechaLabel(primera) +
    (resto.length ? ` (y ${resto.length} ${resto.length === 1 ? "fecha más" : "fechas más"})` : "");

  return enviarUnaVez(cliente, {
    userId: params.userId,
    tipo: "T2",
    correo: t2CreditosActivados({
      nombre: params.nombre,
      sitio: params.sitio,
      clubNombre: club?.nombre ?? "tu club",
      fechaLabel: label,
      ofertasAbiertas,
    }),
  });
}

// ============================================================
// Revisión diaria: T4, T7, T8 y S1–S3
// ============================================================
type Fila = Record<string, unknown>;
type Contar = (tipo: string, r: ResultadoEnvio) => void;

export async function revisionDiaria(sitio: string) {
  const cliente = await db();
  const hoy = fechaMexico();
  const manana = fechaMexico(1);
  const ayer = fechaMexico(-1);
  const haceTres = fechaMexico(-3);
  const ahora = Date.now();

  const { data: solicitudesRaw, error } = await cliente
    .from("requests")
    // "*" para no fallar si todavía no se corre la 0024 (creditos_anfitrion).
    .select("*")
    .in("estado", ["pendiente", "aprobado", "jugado"]);
  if (error) throw new Error(`No se pudieron leer las solicitudes: ${error.message}`);
  const solicitudes = (solicitudesRaw ?? []) as Fila[];

  const resumen: Record<string, Record<ResultadoEnvio, number>> = {};
  const contar = (tipo: string, r: ResultadoEnvio) => {
    resumen[tipo] ??= { enviado: 0, ya_enviado: 0, sin_correo: 0, fallo: 0 };
    resumen[tipo][r] += 1;
  };

  // Si falla el seguimiento (p. ej. falta la migración 0023), T4–T8 siguen.
  try {
    await revisarSeguimiento(cliente, sitio, solicitudes, contar);
  } catch (err) {
    console.error("[correos] Falló la revisión de seguimiento (S1–S3):", err);
  }

  if (solicitudes.length === 0) return { hoy, resumen };

  const offerIds = [...new Set(solicitudes.map((s) => s.offer_id as string))];
  const { data: ofertasRaw } = await cliente
    .from("tee_time_offers")
    .select("id, host_id, club_id, fecha, hora, fecha_flexible, estado, costo_estimado")
    .in("id", offerIds);
  const ofertas = new Map(((ofertasRaw ?? []) as Fila[]).map((o) => [o.id as string, o]));

  const clubIds = [...new Set([...ofertas.values()].map((o) => o.club_id as string))];
  const { data: clubsRaw } = await cliente.from("clubs").select("id, nombre, ciudad").in("id", clubIds);
  const clubs = new Map(((clubsRaw ?? []) as Fila[]).map((c) => [c.id as string, c]));

  const userIds = [
    ...new Set([
      ...solicitudes.map((s) => s.guest_id as string),
      ...[...ofertas.values()].map((o) => o.host_id as string),
    ]),
  ];
  const { data: perfilesRaw } = await cliente.from("profiles").select("id, nombre").in("id", userIds);
  const nombres = new Map(((perfilesRaw ?? []) as Fila[]).map((p) => [p.id as string, p.nombre as string]));
  const nombre = (id: string) => nombres.get(id) ?? "un socio";

  // Agrupa por oferta lo que le toca al anfitrión (un solo correo aunque
  // tenga varios invitados).
  const t7PorOferta = new Map<string, Fila[]>();
  const t8PorOferta = new Map<string, Fila[]>();

  for (const s of solicitudes) {
    const o = ofertas.get(s.offer_id as string);
    if (!o) continue;
    const club = clubs.get(o.club_id as string);
    const clubNombre = (club?.nombre as string) ?? "tu club";
    const fecha = o.fecha as string | null;
    const fija = !o.fecha_flexible && !!fecha;

    // T4 · pendiente hace 48 h o más, y la ronda sigue vigente.
    if (
      s.estado === "pendiente" &&
      ahora - new Date(s.created_at as string).getTime() >= 2 * DIA_MS &&
      o.estado === "activa" &&
      (!fija || (fecha as string) >= hoy)
    ) {
      const hostId = o.host_id as string;
      contar(
        "T4",
        await enviarUnaVez(cliente, {
          userId: hostId,
          tipo: "T4",
          referencia: s.id as string,
          correo: t4SolicitudSinRespuesta({
            nombre: nombre(hostId),
            sitio,
            invitado: nombre(s.guest_id as string),
            clubNombre,
            fechaLabel: fechaLabel(o as never),
          }),
        }),
      );
    }

    // T7 · ronda aprobada mañana (solo fecha fija).
    if (s.estado === "aprobado" && fija && fecha === manana) {
      const lista = t7PorOferta.get(o.id as string) ?? [];
      lista.push(s);
      t7PorOferta.set(o.id as string, lista);
    }

    // T8 anfitrión · la ronda ya pasó (hasta 3 días) y sigue sin marcarse.
    if (s.estado === "aprobado" && fija && (fecha as string) >= haceTres && (fecha as string) <= ayer) {
      const lista = t8PorOferta.get(o.id as string) ?? [];
      lista.push(s);
      t8PorOferta.set(o.id as string, lista);
    }

    // T8 invitado · la ronda se marcó como jugada en los últimos 3 días.
    if (
      s.estado === "jugado" &&
      s.jugado_at &&
      ahora - new Date(s.jugado_at as string).getTime() <= 3 * DIA_MS
    ) {
      const guestId = s.guest_id as string;
      contar(
        "T8",
        await enviarUnaVez(cliente, {
          userId: guestId,
          tipo: "T8",
          referencia: s.id as string,
          correo: t8Resena({
            nombre: nombre(guestId),
            sitio,
            anfitrion: nombre(o.host_id as string),
            clubNombre,
            requestId: s.id as string,
          }),
        }),
      );
    }
  }

  for (const [offerId, lista] of t7PorOferta) {
    const o = ofertas.get(offerId)!;
    const club = clubs.get(o.club_id as string);
    const hostId = o.host_id as string;
    const base = {
      sitio,
      clubNombre: (club?.nombre as string) ?? "el club",
      ciudad: (club?.ciudad as string | null) ?? null,
      hora: o.hora ? formatHora(o.hora as string) : "la hora acordada",
      costoInvitado: (o.costo_estimado as number | null) ?? null,
      offerId,
    };
    contar(
      "T7",
      await enviarUnaVez(cliente, {
        userId: hostId,
        tipo: "T7",
        referencia: offerId,
        correo: t7RondaManana({
          ...base,
          nombre: nombre(hostId),
          rol: "anfitrion",
          otros: lista.map((s) => nombre(s.guest_id as string)),
        }),
      }),
    );
    for (const s of lista) {
      const guestId = s.guest_id as string;
      contar(
        "T7",
        await enviarUnaVez(cliente, {
          userId: guestId,
          tipo: "T7",
          referencia: s.id as string,
          correo: t7RondaManana({ ...base, nombre: nombre(guestId), rol: "invitado", otros: [nombre(hostId)] }),
        }),
      );
    }
  }

  for (const [offerId, lista] of t8PorOferta) {
    const o = ofertas.get(offerId)!;
    const club = clubs.get(o.club_id as string);
    const hostId = o.host_id as string;
    contar(
      "T8",
      await enviarUnaVez(cliente, {
        userId: hostId,
        tipo: "T8",
        referencia: offerId,
        correo: t8MarcarJugada({
          nombre: nombre(hostId),
          sitio,
          invitados: lista.map((s) => nombre(s.guest_id as string)),
          clubNombre: (club?.nombre as string) ?? "tu club",
          creditos: lista.reduce(
            (t, s) => t + ((s.creditos_anfitrion as number | null) ?? (s.creditos_cobrados as number) ?? 1),
            0,
          ),
        }),
      }),
    );
  }

  return { hoy, resumen };
}

// ============================================================
// Seguimiento: S1, S2 y S3 (una sola vez por persona)
// ============================================================
// * S1: entre 7 y 13 días después de registrarse, con club en el perfil y
//   sin haber publicado nunca una oferta.
// * S2: su primera ronda como anfitrión se marcó jugada en los últimos 3 días.
// * S3: su primera ronda como invitado se marcó jugada hace 1 a 4 días (un
//   día después del T8 de reseña, para no mandarle dos correos juntos).
async function revisarSeguimiento(cliente: Db, sitio: string, solicitudes: Fila[], contar: Contar) {
  const ahora = Date.now();
  const hoy = fechaMexico();

  const { data: perfilesRaw, error } = await cliente
    .from("profiles")
    .select("id, nombre, club_id, creditos_balance, correos_seguimiento, created_at");
  if (error) throw new Error(`No se pudieron leer los perfiles: ${error.message}`);
  const perfiles = new Map(((perfilesRaw ?? []) as Fila[]).map((p) => [p.id as string, p]));
  const recibe = (id: string) => {
    const perfil = perfiles.get(id);
    return !!perfil && perfil.correos_seguimiento !== false;
  };

  const { data: ofertasRaw } = await cliente
    .from("tee_time_offers")
    .select("id, host_id, club_id, estado, fecha, fecha_flexible");
  const ofertas = (ofertasRaw ?? []) as Fila[];
  const ofertaPorId = new Map(ofertas.map((o) => [o.id as string, o]));

  const { data: clubsRaw } = await cliente.from("clubs").select("id, nombre, nivel");
  const clubs = new Map(((clubsRaw ?? []) as Fila[]).map((c) => [c.id as string, c]));
  const clubNombre = (id: unknown) => (clubs.get(id as string)?.nombre as string) ?? "tu club";

  const conBaja = (userId: string) => {
    const href = enlaceBaja(sitio, userId);
    return {
      bajaHref: href,
      headers: href
        ? {
            "List-Unsubscribe": `<${href.replace("/correos/baja", "/api/correos/baja")}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
    };
  };

  // ---------- S1 ----------
  const anfitriones = new Set(ofertas.map((o) => o.host_id as string));
  const abiertas = ofertas.filter(
    (o) => o.estado === "activa" && (o.fecha_flexible || ((o.fecha as string | null) ?? "") >= hoy),
  );
  for (const perfil of perfiles.values()) {
    const id = perfil.id as string;
    const dias = (ahora - new Date(perfil.created_at as string).getTime()) / DIA_MS;
    if (dias < 7 || dias >= 14 || !perfil.club_id || anfitriones.has(id) || !recibe(id)) continue;
    const clubId = perfil.club_id as string;
    const nivel = (clubs.get(clubId)?.nivel as ClubNivel | undefined) ?? null;
    const otrosClubes = new Set(abiertas.map((o) => o.club_id as string));
    const clubTieneOfertas = otrosClubes.has(clubId);
    otrosClubes.delete(clubId);
    const { bajaHref, headers } = conBaja(id);
    contar(
      "S1",
      await enviarUnaVez(cliente, {
        userId: id,
        tipo: "S1",
        headers,
        correo: s1SinOfertas({
          nombre: (perfil.nombre as string) ?? "",
          sitio,
          clubNombre: clubNombre(clubId),
          nivelLabel: nivelLabel(nivel),
          creditosNivel: creditosPorNivel(nivel),
          clubesConOfertas: otrosClubes.size + (clubTieneOfertas ? 1 : 0),
          clubTieneOfertas,
          bajaHref,
        }),
      }),
    );
  }

  // ---------- S2 y S3: primera ronda jugada de cada quien ----------
  const jugadas = solicitudes
    .filter((s) => s.estado === "jugado" && s.jugado_at && ofertaPorId.has(s.offer_id as string))
    .sort((a, b) => new Date(a.jugado_at as string).getTime() - new Date(b.jugado_at as string).getTime());
  const primeraComoAnfitrion = new Map<string, Fila>();
  const primeraComoInvitado = new Map<string, Fila>();
  for (const s of jugadas) {
    const hostId = ofertaPorId.get(s.offer_id as string)!.host_id as string;
    if (!primeraComoAnfitrion.has(hostId)) primeraComoAnfitrion.set(hostId, s);
    const guestId = s.guest_id as string;
    if (!primeraComoInvitado.has(guestId)) primeraComoInvitado.set(guestId, s);
  }
  const haceDias = (s: Fila) => (ahora - new Date(s.jugado_at as string).getTime()) / DIA_MS;
  const nombre = (id: string) => (perfiles.get(id)?.nombre as string) ?? "un socio";

  for (const [hostId, s] of primeraComoAnfitrion) {
    if (haceDias(s) > 3 || !recibe(hostId)) continue;
    const o = ofertaPorId.get(s.offer_id as string)!;
    const { bajaHref, headers } = conBaja(hostId);
    contar(
      "S2",
      await enviarUnaVez(cliente, {
        userId: hostId,
        tipo: "S2",
        headers,
        correo: s2PrimerHosteo({
          nombre: nombre(hostId),
          sitio,
          invitado: nombre(s.guest_id as string),
          clubNombre: clubNombre(o.club_id),
          saldo: (perfiles.get(hostId)?.creditos_balance as number) ?? 0,
          bajaHref,
        }),
      }),
    );
  }

  for (const [guestId, s] of primeraComoInvitado) {
    const d = haceDias(s);
    if (d < 1 || d > 4 || !recibe(guestId)) continue;
    const o = ofertaPorId.get(s.offer_id as string)!;
    const propio = perfiles.get(guestId)?.club_id as string | null;
    const { bajaHref, headers } = conBaja(guestId);
    contar(
      "S3",
      await enviarUnaVez(cliente, {
        userId: guestId,
        tipo: "S3",
        headers,
        correo: s3PrimeraSalida({
          nombre: nombre(guestId),
          sitio,
          clubNombre: clubNombre(o.club_id),
          clubPropio: propio ? clubNombre(propio) : null,
          bajaHref,
        }),
      }),
    );
  }
}
