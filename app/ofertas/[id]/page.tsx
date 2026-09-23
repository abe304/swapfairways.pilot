import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, Badge } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { formatFecha, formatHora, formatMoneda, mapsUrl } from "@/lib/utils";
import { RequestButton } from "./RequestButton";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Solicitud enviada — esperando al anfitrión",
  aprobado: "¡Confirmado! Revisa los detalles de encuentro abajo",
  rechazado: "El anfitrión no aprobó esta solicitud",
  jugado: "Ronda jugada",
  cancelado: "Solicitud cancelada",
};

type OfferClub = {
  nombre: string;
  ciudad: string | null;
  direccion: string | null;
  tipo: string;
  latitud: number | null;
  longitud: number | null;
  reglamento: string | null;
  requiere_caddie_invitado: boolean;
  carrito_obligatorio: boolean;
  requiere_ghin: boolean;
  recomendacion_llegada: string | null;
  costo_creditos: number;
};

export default async function OfertaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("tee_time_offers")
    .select(
      "*, clubs(nombre, ciudad, direccion, tipo, latitud, longitud, reglamento, requiere_caddie_invitado, carrito_obligatorio, requiere_ghin, recomendacion_llegada, costo_creditos), profiles!tee_time_offers_host_id_fkey(id, nombre, handicap_manual, ghin_id)",
    )
    .eq("id", id)
    .single();

  if (!offer) notFound();

  const club = (offer as unknown as { clubs: OfferClub | null }).clubs;
  const host = (
    offer as unknown as {
      profiles: {
        id: string;
        nombre: string;
        handicap_manual: number | null;
        ghin_id: string | null;
      } | null;
    }
  ).profiles;

  const isHost = offer.host_id === profile.id;
  const cuposLibres = offer.pases_disponibles - offer.pases_confirmados;
  const costoCreditos = club?.costo_creditos ?? 1;
  const tieneReglas =
    club?.reglamento ||
    club?.requiere_caddie_invitado ||
    club?.carrito_obligatorio ||
    club?.requiere_ghin ||
    club?.recomendacion_llegada;

  const { data: myRequest } = await supabase
    .from("requests")
    .select("*")
    .eq("offer_id", id)
    .eq("guest_id", profile.id)
    .maybeSingle();

  const detallesLiberados = isHost || ["aprobado", "jugado"].includes(myRequest?.estado ?? "");

  let hostContact: string | null = null;
  if (detallesLiberados && !isHost) {
    const { data: contact } = await supabase
      .from("profile_contacts")
      .select("telefono")
      .eq("user_id", offer.host_id)
      .maybeSingle();
    hostContact = contact?.telefono ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-swf-verde">{club?.nombre}</h1>
            {club?.ciudad ? <p className="text-sm text-swf-verde/70">{club.ciudad}</p> : null}
            {club?.direccion ? (
              <a
                href={mapsUrl(club.direccion, club)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-swf-dorado underline"
              >
                Ver ubicación en Google Maps
              </a>
            ) : null}
          </div>
          <Badge tone={offer.estado === "activa" ? "success" : "default"}>
            {offer.estado}
          </Badge>
        </div>
        <p className="text-lg text-swf-verde">
          {offer.fecha_flexible || !offer.fecha || !offer.hora
            ? "Fecha a coordinar con el anfitrión"
            : `${formatFecha(offer.fecha)} · ${formatHora(offer.hora)}`}
        </p>
        <p className="mt-1 text-sm text-swf-verde/70">
          {cuposLibres} de {offer.pases_disponibles} pases disponibles
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {offer.caddie_incluido ? (
            <Badge>
              Caddie incluido
              {offer.costo_caddie ? ` (${formatMoneda(offer.costo_caddie)})` : ""}
            </Badge>
          ) : null}
          {offer.carrito_compartido ? (
            <Badge>
              Carrito compartido
              {offer.costo_carrito ? ` (${formatMoneda(offer.costo_carrito)})` : ""}
            </Badge>
          ) : null}
          {offer.costo_estimado ? (
            <Badge tone="gold">Costo de visita: {formatMoneda(offer.costo_estimado)}</Badge>
          ) : null}
          {costoCreditos !== 1 ? (
            <Badge tone="gold">Vale {costoCreditos} créditos</Badge>
          ) : null}
        </div>

        <div className="mt-4 border-t border-swf-verde/10 pt-4">
          <p className="text-sm text-swf-verde/70">
            Anfitrión:{" "}
            <Link href={`/perfil/${host?.id}`} className="font-medium text-swf-verde underline">
              {host?.nombre}
            </Link>
            {host?.handicap_manual !== null && host?.handicap_manual !== undefined
              ? ` — Handicap ${host.handicap_manual}`
              : ""}
          </p>
        </div>
      </Card>

      {tieneReglas ? (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-swf-verde">Reglas del club</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {club?.requiere_caddie_invitado ? (
              <Badge tone="warning">Caddie obligatorio para invitados</Badge>
            ) : null}
            {club?.carrito_obligatorio ? (
              <Badge tone="warning">Renta de carrito obligatoria</Badge>
            ) : null}
            {club?.requiere_ghin ? <Badge tone="warning">Debes mostrar tu GHIN</Badge> : null}
          </div>
          {club?.reglamento ? (
            <p className="whitespace-pre-line text-sm text-swf-verde/80">{club.reglamento}</p>
          ) : null}
          {club?.recomendacion_llegada ? (
            <p className="mt-2 text-sm text-swf-verde/70">
              <span className="font-medium">Recomendación de llegada:</span>{" "}
              {club.recomendacion_llegada}
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-swf-verde">
          Detalles de encuentro y contacto
        </h2>
        {detallesLiberados ? (
          <div className="space-y-2 text-sm text-swf-verde/80">
            <p>{offer.nota || "El anfitrión no dejó una nota adicional."}</p>
            {club?.direccion ? (
              <p>
                <span className="font-medium">Punto de encuentro:</span> {club.direccion}{" "}
                <a
                  href={mapsUrl(club.direccion, club)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-swf-dorado underline"
                >
                  Abrir en Google Maps
                </a>
              </p>
            ) : null}
            {!isHost ? (
              <p>
                <span className="font-medium">Contacto del anfitrión:</span>{" "}
                {hostContact || "No registrado — coordina a través de la app."}
              </p>
            ) : null}
            {isHost && host?.ghin_id ? (
              <p>
                <span className="font-medium">Tu GHIN:</span> {host.ghin_id}
              </p>
            ) : null}
            {offer.costo_estimado || offer.costo_caddie || offer.costo_carrito ? (
              <div className="rounded-md bg-swf-dorado/10 p-3 text-swf-verde">
                <p>Costos aproximados a pagar directo en el club (no a través de SWF):</p>
                <ul className="mt-1 list-disc pl-5">
                  {offer.costo_estimado ? (
                    <li>Visita: {formatMoneda(offer.costo_estimado)}</li>
                  ) : null}
                  {offer.costo_caddie ? <li>Caddie: {formatMoneda(offer.costo_caddie)}</li> : null}
                  {offer.costo_carrito ? (
                    <li>Carrito: {formatMoneda(offer.costo_carrito)}</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-swf-verde/60">
            El punto de encuentro, código de vestimenta y contacto del anfitrión se
            comparten automáticamente cuando tu solicitud sea aprobada.
          </p>
        )}
      </Card>

      <Card>
        {isHost ? (
          <div className="text-sm text-swf-verde/70">
            <p className="mb-3">Esta es tu oferta. Administra las solicitudes recibidas en:</p>
            <LinkButton href="/mis-rondas" variant="secondary">
              Ir a Mis rondas
            </LinkButton>
          </div>
        ) : myRequest ? (
          <p className="text-sm font-medium text-swf-verde">
            {ESTADO_LABEL[myRequest.estado]}
          </p>
        ) : cuposLibres > 0 && offer.estado === "activa" ? (
          <RequestButton offerId={offer.id} costoCreditos={costoCreditos} />
        ) : (
          <p className="text-sm text-swf-verde/60">Ya no quedan pases disponibles.</p>
        )}
      </Card>
    </div>
  );
}
