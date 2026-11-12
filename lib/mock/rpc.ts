// Réplica en JS de las funciones SECURITY DEFINER de
// supabase/migrations/0001_init.sql, para que el modo demo (sin backend
// real) tenga exactamente las mismas reglas de negocio.
import { store, uid, nowIso, applyCreditTx, type MockRow } from "./store";
import { creditosOferta, type ClubAcceso, type GreenFeePaga } from "@/lib/niveles";

type RpcResult = { data?: MockRow; error?: string };

function findRequest(id: string) {
  return store.requests.find((r) => r.id === id);
}

function findOffer(id: string) {
  return store.tee_time_offers.find((o) => o.id === id);
}

export function create_join_request(currentUserId: string, args: { p_offer_id: string }): RpcResult {
  const offer = findOffer(args.p_offer_id);
  if (!offer) return { error: "Oferta no encontrada" };
  if (offer.host_id === currentUserId) {
    return { error: "No puedes solicitar unirte a tu propia oferta" };
  }
  if (offer.estado !== "activa") return { error: "Esta oferta ya no está activa" };
  if ((offer.pases_confirmados as number) >= (offer.pases_disponibles as number)) {
    return { error: "No quedan pases disponibles en esta oferta" };
  }
  const activeExisting = store.requests.find(
    (r) =>
      r.offer_id === args.p_offer_id &&
      r.guest_id === currentUserId &&
      ["pendiente", "aprobado", "jugado"].includes(r.estado as string),
  );
  if (activeExisting) return { error: "Ya tienes una solicitud activa para esta oferta" };

  const club = store.clubs.find((c) => c.id === offer.club_id);
  const costo = creditosOferta(
    club as { costo_creditos?: number; acceso?: ClubAcceso } | undefined,
    offer.green_fee_paga as GreenFeePaga | null,
  );

  const profile = store.profiles.find((p) => p.id === currentUserId);
  if (!profile || (profile.creditos_balance as number) < costo) {
    return { error: `No tienes créditos suficientes para solicitar esta ronda (cuesta ${costo} créditos)` };
  }

  const request: MockRow = {
    id: uid("req"),
    offer_id: args.p_offer_id,
    guest_id: currentUserId,
    estado: "pendiente",
    creditos_cobrados: costo,
    created_at: nowIso(),
    aprobado_at: null,
    jugado_at: null,
  };
  store.requests.push(request);
  return { data: request };
}

export function approve_request(currentUserId: string, args: { p_request_id: string }): RpcResult {
  const request = findRequest(args.p_request_id);
  if (!request) return { error: "Solicitud no encontrada" };
  const offer = findOffer(request.offer_id as string)!;
  if (offer.host_id !== currentUserId) {
    return { error: "Solo el anfitrión puede aprobar esta solicitud" };
  }
  if (request.estado !== "pendiente") return { error: "Esta solicitud ya fue procesada" };
  if ((offer.pases_confirmados as number) >= (offer.pases_disponibles as number)) {
    return { error: "No quedan pases disponibles en esta oferta" };
  }

  request.estado = "aprobado";
  request.aprobado_at = nowIso();
  offer.pases_confirmados = (offer.pases_confirmados as number) + 1;
  if ((offer.pases_confirmados as number) >= (offer.pases_disponibles as number)) {
    offer.estado = "cerrada";
  }
  return { data: request };
}

export function reject_request(currentUserId: string, args: { p_request_id: string }): RpcResult {
  const request = findRequest(args.p_request_id);
  if (!request) return { error: "Solicitud no encontrada" };
  const offer = findOffer(request.offer_id as string)!;
  if (offer.host_id !== currentUserId) {
    return { error: "Solo el anfitrión puede rechazar esta solicitud" };
  }
  if (request.estado !== "pendiente") return { error: "Esta solicitud ya fue procesada" };

  request.estado = "rechazado";
  return { data: request };
}

export function mark_request_played(currentUserId: string, args: { p_request_id: string }): RpcResult {
  const request = findRequest(args.p_request_id);
  if (!request) return { error: "Solicitud no encontrada" };
  const offer = findOffer(request.offer_id as string)!;
  if (offer.host_id !== currentUserId) {
    return { error: "Solo el anfitrión puede marcar la ronda como jugada" };
  }
  if (request.estado !== "aprobado") {
    return { error: "Solo se puede marcar como jugada una solicitud aprobada" };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (!offer.fecha_flexible && (offer.fecha as string) > today) {
    return { error: "Aún no es la fecha de la ronda" };
  }

  request.estado = "jugado";
  request.jugado_at = nowIso();

  const creditos = request.creditos_cobrados as number;
  applyCreditTx({
    id: uid("tx"),
    user_id: request.guest_id as string,
    tipo: "gastado",
    monto: -creditos,
    referencia: request.id as string,
    nota: "Ronda jugada",
    created_at: nowIso(),
  });
  applyCreditTx({
    id: uid("tx"),
    user_id: offer.host_id as string,
    tipo: "ganado",
    monto: creditos,
    referencia: request.id as string,
    nota: "Ronda jugada como anfitrión",
    created_at: nowIso(),
  });

  // Quien invitó a alguno de los dos gana créditos la primera vez que esa
  // persona juega una ronda (réplica de la regla de 0012_invitaciones_referidos).
  const recompensa = Number(
    store.app_settings.find((a) => a.key === "recompensa_referido")?.value ?? 1,
  );
  if (recompensa > 0) {
    for (const userId of [request.guest_id as string, offer.host_id as string]) {
      const perfil = store.profiles.find((p) => p.id === userId);
      if (perfil?.invitado_por && !perfil.referido_pagado) {
        applyCreditTx({
          id: uid("tx"),
          user_id: perfil.invitado_por as string,
          tipo: "referido",
          monto: recompensa,
          referencia: request.id as string,
          nota: `Recomendaste a ${perfil.nombre} y ya jugó su primera ronda`,
          created_at: nowIso(),
        });
        perfil.referido_pagado = true;
      }
    }
  }

  return { data: request };
}

// Réplica de validar_codigo_invitacion (0012): también se llama sin sesión.
export function validarCodigo(codigoRaw: string) {
  const codigo = String(codigoRaw ?? "").trim().toUpperCase();
  const row = store.codigos_invitacion.find((c) => c.codigo === codigo);
  const agotado =
    row && row.usos_maximos != null && (row.usos as number) >= (row.usos_maximos as number);
  if (!row || !row.activo || agotado) return [{ valido: false, invitador: null }];
  const dueno = store.profiles.find((p) => p.id === row.owner_id);
  return [{ valido: true, invitador: (dueno?.nombre as string) ?? null }];
}

export const RPC_FUNCTIONS: Record<
  string,
  (currentUserId: string, args: Record<string, string>) => RpcResult
> = {
  create_join_request: create_join_request as (
    currentUserId: string,
    args: Record<string, string>,
  ) => RpcResult,
  approve_request: approve_request as (currentUserId: string, args: Record<string, string>) => RpcResult,
  reject_request: reject_request as (currentUserId: string, args: Record<string, string>) => RpcResult,
  mark_request_played: mark_request_played as (
    currentUserId: string,
    args: Record<string, string>,
  ) => RpcResult,
};

// Despacho común para cualquier cliente mock (con cookies en la app, o fijo
// a un usuario en la simulación automática).
export async function mockRpc(
  currentUserId: string | null,
  name: string,
  args: Record<string, string>,
) {
  if (name === "validar_codigo_invitacion") {
    return { data: validarCodigo(args.p_codigo), error: null };
  }
  if (name === "solicitar_invitacion") {
    const nombre = String(args.p_nombre ?? "").trim();
    const email = String(args.p_email ?? "").trim().toLowerCase();
    if (!nombre) return { data: null, error: { message: "Escribe tu nombre." } };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { data: null, error: { message: "Escribe un correo válido." } };
    }
    if (store.authUsers.some((u) => u.email.toLowerCase() === email)) return { data: "ya_registrado", error: null };
    const datos = {
      nombre,
      telefono: args.p_telefono || null,
      club: args.p_club || null,
      mensaje: args.p_mensaje || null,
      updated_at: nowIso(),
    };
    const existente = store.lista_espera.find(
      (r) => String(r.email).toLowerCase() === email && r.estado === "pendiente",
    );
    if (existente) {
      Object.assign(existente, datos);
      return { data: "actualizado", error: null };
    }
    store.lista_espera.push({
      id: uid("espera"),
      email,
      estado: "pendiente",
      codigo: null,
      created_at: nowIso(),
      ...datos,
    });
    return { data: "nuevo", error: null };
  }
  if (!currentUserId) return { data: null, error: { message: "No autenticado" } };
  if (name === "admin_listar_usuarios") {
    const yo = store.profiles.find((p) => p.id === currentUserId);
    if (!yo?.is_admin) return { data: null, error: { message: "Solo administradores" } };
    const data = store.profiles.map((p) => {
      const auth = store.authUsers.find((u) => u.id === p.id);
      return {
        id: p.id,
        nombre: p.nombre,
        email: auth?.email ?? "",
        telefono: store.profile_contacts.find((c) => c.user_id === p.id)?.telefono ?? null,
        club: store.clubs.find((c) => c.id === p.club_id)?.nombre ?? null,
        creditos: p.creditos_balance,
        is_admin: p.is_admin,
        codigo_usado: p.codigo_usado ?? null,
        invitado_por: store.profiles.find((x) => x.id === p.invitado_por)?.nombre ?? null,
        rondas_publicadas: store.tee_time_offers.filter((o) => o.host_id === p.id).length,
        solicitudes: store.requests.filter((r) => r.guest_id === p.id).length,
        registrado: p.created_at,
        ultimo_acceso: null,
      };
    });
    return { data, error: null };
  }
  const fn = RPC_FUNCTIONS[name];
  if (!fn) return { data: null, error: { message: `RPC ${name} no implementada en modo demo` } };
  const result = fn(currentUserId, args);
  if (result.error) return { data: null, error: { message: result.error } };
  return { data: result.data, error: null };
}
