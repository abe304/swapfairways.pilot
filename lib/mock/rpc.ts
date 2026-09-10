// Réplica en JS de las funciones SECURITY DEFINER de
// supabase/migrations/0001_init.sql, para que el modo demo (sin backend
// real) tenga exactamente las mismas reglas de negocio.
import { store, uid, nowIso, applyCreditTx, type MockRow } from "./store";

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

  const profile = store.profiles.find((p) => p.id === currentUserId);
  if (!profile || (profile.creditos_balance as number) < 1) {
    return { error: "No tienes créditos suficientes para solicitar esta ronda" };
  }

  const request: MockRow = {
    id: uid("req"),
    offer_id: args.p_offer_id,
    guest_id: currentUserId,
    estado: "pendiente",
    creditos_cobrados: 1,
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
  if ((offer.fecha as string) > today) {
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

  return { data: request };
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
