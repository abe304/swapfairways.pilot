import { NivelBadge } from "@/components/NivelBadge";
import { accesoLabel, creditosOferta, seEligeGreenFee, type ClubAcceso, type ClubNivel } from "@/lib/niveles";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, Badge } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { formatFecha, formatHora, formatMoneda, mapsUrl } from "@/lib/utils";
import { RequestButton } from "./RequestButton";
import { docTipoLabel } from "@/lib/clubes";
import { OFFER_DETAIL_SELECT } from "@/lib/queries";
import { COSTO_CONCEPTOS, parteInvitado, totalCostos, type Costos, type CostoKey } from "@/lib/offers";

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
  nivel: ClubNivel;
  acceso: ClubAcceso;
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
    .select(OFFER_DETAIL_SELECT)
    .eq("id", id)
    .single();

  if (!offer) notFound();

  // Regla 0020: para usar créditos primero hay que publicar una ronda propia.
  const { data: propias } = await supabase
    .from("tee_time_offers")
    .select("id")
    .eq("host_id", profile.id)
    .in("estado", ["activa", "cerrada"]);
  const yaPublico = (propias?.length ?? 0) > 0;

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

  const compartidos = { carrito: offer.carrito_compartido, caddie: offer.caddie_compartido };
  const desglose = [
    ...COSTO_CONCEPTOS.map((c) => {
      const completo = (offer as unknown as Record<string, number | null>)[c.key];
      const parte = parteInvitado(c.key, completo, compartidos);
      return {
        label: c.label,
        monto: parte,
        nota: completo && parte !== completo ? `mitad de ${formatMoneda(completo)}, compartido` : "",
      };
    }),
    {
      label: "Otros cargos",
      monto: parteInvitado("costo_otros" as CostoKey, offer.costo_otros),
      nota: offer.concepto_otros ?? "",
    },
  ].filter((d) => d.monto > 0);

  // Si el green fee no tiene costo para el invitado, se dice por qué, para
  // que se entienda que no falta en la cuenta.
  const greenFeeCapturado = (offer.costo_green_fee ?? 0) > 0;
  const notaGreenFee = greenFeeCapturado
    ? null
    : club?.acceso === "pase"
      ? "Sin costo: entras con el pase de invitado del anfitrión"
      : seEligeGreenFee(club?.acceso) && offer.green_fee_paga === "anfitrion"
        ? "Lo cubre el anfitrión"
        : null;
  const totalInvitado = offer.costo_estimado ?? totalCostos(offer as Costos, compartidos);

  const isHost = offer.host_id === profile.id;
  const cuposLibres = offer.pases_disponibles - offer.pases_confirmados;
  const costoCreditos = creditosOferta(club, offer.green_fee_paga);
  const { data: documentosClub } = await supabase
    .from("club_documentos")
    .select("id, tipo, titulo, url")
    .eq("club_id", offer.club_id)
    .order("created_at");
  const documentos = (documentosClub ?? []) as { id: string; tipo: string; titulo: string; url: string }[];

  const tieneReglas =
    documentos.length > 0 ||
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
            {club ? (
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-swf-verde/70">
                <NivelBadge nivel={club.nivel} />
                <span>{accesoLabel(club.acceso)}</span>
              </p>
            ) : null}
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
          {offer.caddie_compartido ? (
            <Badge>
              Caddie compartido
            </Badge>
          ) : null}
          {offer.carrito_compartido ? (
            <Badge>
              Carrito compartido
            </Badge>
          ) : null}
          {totalInvitado > 0 ? (
            <a href="#costos" className="rounded-full focus:outline-none focus:ring-2 focus:ring-swf-dorado">
              <Badge tone="gold">Costo aprox.: {formatMoneda(totalInvitado)} · ver qué incluye</Badge>
            </a>
          ) : null}
          <Badge tone="gold">
            Vale {costoCreditos} {costoCreditos === 1 ? "crédito" : "créditos"}
          </Badge>
          {seEligeGreenFee(club?.acceso) ? (
            <Badge>
              {offer.green_fee_paga === "anfitrion"
                ? "El anfitrión cubre el green fee"
                : "El green fee lo paga el invitado"}
            </Badge>
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

      <Card id="costos" className="scroll-mt-24">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-swf-verde">¿Qué incluye el costo?</h2>
          {totalInvitado > 0 ? (
            <p className="text-lg font-semibold text-swf-verde">{formatMoneda(totalInvitado)}</p>
          ) : null}
        </div>
        {desglose.length > 0 ? (
          <ul className="divide-y divide-swf-verde/10 text-sm">
            {notaGreenFee ? (
              <li className="flex items-start justify-between gap-3 py-2">
                <span className="text-swf-verde">
                  Green fee
                  <span className="block text-xs text-swf-verde/60">{notaGreenFee}</span>
                </span>
                <span className="shrink-0 text-swf-verde/70">$0</span>
              </li>
            ) : null}
            {desglose.map((d) => (
              <li key={d.label} className="flex items-start justify-between gap-3 py-2">
                <span className="text-swf-verde">
                  {d.label}
                  {d.nota ? <span className="block text-xs text-swf-verde/60">{d.nota}</span> : null}
                </span>
                <span className="shrink-0 font-medium text-swf-verde">{formatMoneda(d.monto)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {desglose.length === 0 ? (
          <p className="text-sm text-swf-verde/70">
            {notaGreenFee
              ? club?.acceso === "pase"
                ? "El green fee no tiene costo porque entras con el pase de invitado del anfitrión. "
                : "El green fee lo cubre el anfitrión. "
              : ""}
            {totalInvitado > 0
              ? `El anfitrión no desglosó ${notaGreenFee ? "el resto del" : "este"} monto. Pregúntale qué incluye cuando coordinen la ronda.`
              : `El anfitrión no indicó ${notaGreenFee ? "otros costos" : "costos"} para esta salida. Confírmalos al coordinar la ronda.`}
          </p>
        ) : null}
        <p className="mt-3 rounded-md bg-swf-dorado/10 px-3 py-2 text-xs text-swf-verde/80">
          {totalInvitado > 0
            ? "Son montos aproximados que pagas directo en el club el día de la ronda, no a través de SwapFairways. "
            : ""}
          {costoCreditos === 1
            ? "El crédito de la salida es aparte."
            : `Los ${costoCreditos} créditos de la salida son aparte.`}
        </p>
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
          {documentos.length > 0 ? (
            <div className="mt-3 border-t border-swf-verde/10 pt-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-swf-verde/60">
                Estatutos y reglamentos
              </p>
              <ul className="space-y-1 text-sm">
                {documentos.map((d) => (
                  <li key={d.id}>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-swf-verde underline decoration-swf-dorado underline-offset-2 hover:text-swf-dorado"
                    >
                      {d.titulo}
                    </a>{" "}
                    <span className="text-xs text-swf-verde/50">({docTipoLabel(d.tipo)})</span>
                  </li>
                ))}
              </ul>
            </div>
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
        ) : cuposLibres > 0 && offer.estado === "activa" && !yaPublico ? (
          <div className="rounded-md bg-swf-dorado/15 px-4 py-3 text-sm text-swf-verde">
            <p className="font-medium">Primero publica una ronda en tu club</p>
            <p className="mt-1 text-swf-verde/70">
              Para usar tus créditos en otros campos necesitas haber anfitrionado: publica una salida en
              tu club y después podrás solicitar esta.
            </p>
            <div className="mt-3">
              <LinkButton href="/ofertas/nueva" variant="secondary">
                Publicar una ronda
              </LinkButton>
            </div>
          </div>
        ) : cuposLibres > 0 && offer.estado === "activa" ? (
          <RequestButton offerId={offer.id} costoCreditos={costoCreditos} />
        ) : (
          <p className="text-sm text-swf-verde/60">Ya no quedan pases disponibles.</p>
        )}
      </Card>
    </div>
  );
}
