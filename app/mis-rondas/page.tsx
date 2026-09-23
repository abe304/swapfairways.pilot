import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, Badge } from "@/components/ui/Card";
import { formatFecha, formatHora, nombreConHc } from "@/lib/utils";
import { approveRequest, rejectRequest, markPlayed } from "./actions";
import { ActionButton } from "./ActionButton";

type HostedOffer = {
  id: string;
  fecha: string | null;
  hora: string | null;
  fecha_flexible: boolean;
  pases_disponibles: number;
  pases_confirmados: number;
  clubs: { nombre: string } | null;
  requests: Array<{
    id: string;
    estado: string;
    guest_id: string;
    profiles: { nombre: string; handicap_manual: number | null } | null;
  }>;
};

type GuestRequest = {
  id: string;
  estado: string;
  offer_id: string;
  tee_time_offers: {
    fecha: string | null;
    hora: string | null;
    fecha_flexible: boolean;
    host_id: string;
    clubs: { nombre: string } | null;
    profiles: { nombre: string; handicap_manual: number | null } | null;
  } | null;
};

function offerFechaLabel(offer: { fecha: string | null; hora: string | null; fecha_flexible: boolean }) {
  if (offer.fecha_flexible || !offer.fecha || !offer.hora) return "Fecha a coordinar";
  return `${formatFecha(offer.fecha)} · ${formatHora(offer.hora)}`;
}

const ESTADO_TONE: Record<string, "default" | "gold" | "success" | "warning" | "danger"> = {
  pendiente: "warning",
  aprobado: "success",
  rechazado: "danger",
  jugado: "gold",
  cancelado: "default",
};

export default async function MisRondasPage({
  searchParams,
}: {
  searchParams: Promise<{ resena?: string }>;
}) {
  const { resena } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: hostedOffersRaw } = await supabase
    .from("tee_time_offers")
    .select(
      "id, fecha, hora, fecha_flexible, pases_disponibles, pases_confirmados, clubs(nombre), requests(id, estado, guest_id, profiles!requests_guest_id_fkey(nombre, handicap_manual))",
    )
    .eq("host_id", profile.id)
    .order("fecha", { ascending: true });
  const hostedOffers = (hostedOffersRaw ?? []) as unknown as HostedOffer[];

  const { data: myRequestsRaw } = await supabase
    .from("requests")
    .select(
      "id, estado, offer_id, tee_time_offers(fecha, hora, fecha_flexible, host_id, clubs(nombre), profiles!tee_time_offers_host_id_fkey(nombre, handicap_manual))",
    )
    .eq("guest_id", profile.id)
    .order("created_at", { ascending: false });
  const myRequests = (myRequestsRaw ?? []) as unknown as GuestRequest[];

  const jugadoRequestIds = [
    ...hostedOffers.flatMap((o) => o.requests.filter((r) => r.estado === "jugado").map((r) => r.id)),
    ...myRequests.filter((r) => r.estado === "jugado").map((r) => r.id),
  ];

  const { data: myReviews } = jugadoRequestIds.length
    ? await supabase
        .from("reviews")
        .select("request_id")
        .eq("autor_id", profile.id)
        .in("request_id", jugadoRequestIds)
    : { data: [] };

  const reviewedIds = new Set((myReviews ?? []).map((r) => r.request_id));
  const pendingReviewIds = jugadoRequestIds.filter((id) => !reviewedIds.has(id));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-swf-verde">Mis rondas</h1>

      {resena === "enviada" ? (
        <Card className="border-green-300 bg-green-50">
          <p className="text-sm text-green-800">¡Gracias! Tu reseña fue enviada.</p>
        </Card>
      ) : null}

      {pendingReviewIds.length > 0 ? (
        <Card className="border-swf-dorado bg-swf-dorado/10">
          <p className="mb-2 text-sm font-medium text-swf-verde">
            Tienes {pendingReviewIds.length} reseña
            {pendingReviewIds.length === 1 ? "" : "s"} pendiente
            {pendingReviewIds.length === 1 ? "" : "s"} de rondas ya jugadas.
          </p>
          <div className="flex flex-wrap gap-2">
            {pendingReviewIds.map((id) => (
              <Link
                key={id}
                href={`/rondas/${id}/resena`}
                className="text-sm font-medium text-swf-dorado underline"
              >
                Dejar reseña
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-swf-verde">
          Ofertas donde eres anfitrión
        </h2>
        {hostedOffers.length === 0 ? (
          <Card>
            <p className="text-sm text-swf-verde/60">
              Aún no has publicado ninguna ronda.{" "}
              <Link href="/ofertas/nueva" className="text-swf-dorado underline">
                Publica una
              </Link>
              .
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {hostedOffers.map((offer) => {
              const puedeMarcarJugada =
                offer.fecha_flexible || (!!offer.fecha && new Date(offer.fecha) <= new Date());
              return (
                <Card key={offer.id}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <Link href={`/ofertas/${offer.id}`} className="font-semibold text-swf-verde hover:underline">
                        {offer.clubs?.nombre}
                      </Link>
                      <p className="text-sm text-swf-verde/70">
                        {offerFechaLabel(offer)} · {offer.pases_confirmados}/
                        {offer.pases_disponibles} confirmados
                      </p>
                    </div>
                  </div>

                  {offer.requests.length === 0 ? (
                    <p className="text-sm text-swf-verde/50">Sin solicitudes todavía.</p>
                  ) : (
                    <ul className="space-y-3">
                      {offer.requests.map((req) => (
                        <li
                          key={req.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-t border-swf-verde/10 pt-3"
                        >
                          <div>
                            <Link
                              href={`/perfil/${req.guest_id}`}
                              className="text-sm font-medium text-swf-verde hover:underline"
                            >
                              {nombreConHc(req.profiles?.nombre, req.profiles?.handicap_manual)}
                            </Link>{" "}
                            <Badge tone={ESTADO_TONE[req.estado]}>{req.estado}</Badge>
                          </div>
                          <div className="flex gap-2">
                            {req.estado === "pendiente" ? (
                              <>
                                <ActionButton
                                  label="Aprobar"
                                  pendingLabel="Aprobando..."
                                  requestId={req.id}
                                  action={approveRequest}
                                />
                                <ActionButton
                                  label="Rechazar"
                                  pendingLabel="Rechazando..."
                                  variant="ghost"
                                  requestId={req.id}
                                  action={rejectRequest}
                                />
                              </>
                            ) : null}
                            {req.estado === "aprobado" ? (
                              <ActionButton
                                label={puedeMarcarJugada ? "Marcar ronda jugada" : "Disponible el día de la ronda"}
                                pendingLabel="Guardando..."
                                variant="secondary"
                                requestId={req.id}
                                action={markPlayed}
                              />
                            ) : null}
                            {req.estado === "jugado" ? (
                              <Link
                                href={`/rondas/${req.id}/resena`}
                                className="text-sm text-swf-dorado underline"
                              >
                                Ver / dejar reseña
                              </Link>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-swf-verde">
          Rondas donde solicitaste unirte
        </h2>
        {myRequests.length === 0 ? (
          <Card>
            <p className="text-sm text-swf-verde/60">
              Aún no has solicitado unirte a ninguna ronda.{" "}
              <Link href="/ofertas" className="text-swf-dorado underline">
                Explora ofertas
              </Link>
              .
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {myRequests.map((req) => (
              <Card key={req.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link href={`/ofertas/${req.offer_id}`} className="font-medium text-swf-verde hover:underline">
                      {req.tee_time_offers?.clubs?.nombre}
                    </Link>
                    <p className="text-sm text-swf-verde/70">
                      {req.tee_time_offers ? offerFechaLabel(req.tee_time_offers) : ""} · Anfitrión:{" "}
                      {nombreConHc(
                        req.tee_time_offers?.profiles?.nombre,
                        req.tee_time_offers?.profiles?.handicap_manual,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={ESTADO_TONE[req.estado]}>{req.estado}</Badge>
                    {req.estado === "jugado" ? (
                      <Link href={`/rondas/${req.id}/resena`} className="text-sm text-swf-dorado underline">
                        Ver / dejar reseña
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
