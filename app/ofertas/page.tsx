import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ClubCombobox } from "@/components/ClubCombobox";
import { formatFecha, formatHora, mapsUrl, nombreConHc } from "@/lib/utils";

type OfferClub = {
  nombre: string;
  ciudad: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
};
type OfferHost = { nombre: string; handicap_manual: number | null };
type OfferRow = {
  id: string;
  fecha: string | null;
  hora: string | null;
  fecha_flexible: boolean;
  pases_disponibles: number;
  pases_confirmados: number;
  caddie_incluido: boolean;
  carrito_compartido: boolean;
  clubs: OfferClub | null;
  profiles: OfferHost | null;
};

function OfferCard({ offer }: { offer: OfferRow }) {
  const club = offer.clubs;
  const host = offer.profiles;
  const cuposLibres = offer.pases_disponibles - offer.pases_confirmados;
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <Link href={`/ofertas/${offer.id}`}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-swf-verde">{club?.nombre}</h2>
          <Badge tone={cuposLibres > 0 ? "success" : "warning"}>
            {cuposLibres} pase{cuposLibres === 1 ? "" : "s"} libre
            {cuposLibres === 1 ? "" : "s"}
          </Badge>
        </div>
        <p className="text-sm text-swf-verde/70">
          {offer.fecha_flexible || !offer.fecha || !offer.hora
            ? "Fecha a coordinar con el anfitrión"
            : `${formatFecha(offer.fecha)} · ${formatHora(offer.hora)}`}
        </p>
        <p className="mt-2 text-sm text-swf-verde/60">
          Anfitrión: {nombreConHc(host?.nombre, host?.handicap_manual)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {offer.caddie_incluido ? <Badge>Caddie incluido</Badge> : null}
          {offer.carrito_compartido ? <Badge>Carrito compartido</Badge> : null}
        </div>
      </Link>
      {club?.direccion ? (
        <a
          href={mapsUrl(club.direccion, club)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-xs text-swf-dorado underline"
        >
          Ver ubicación en Google Maps
        </a>
      ) : null}
    </Card>
  );
}

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<{ club_id?: string; fecha?: string }>;
}) {
  const { club_id, fecha } = await searchParams;
  const supabase = await createClient();

  const { data: clubsData } = await supabase.from("clubs").select("*").order("nombre");
  const clubs = clubsData ?? [];

  const offerSelect =
    "id, fecha, hora, fecha_flexible, pases_disponibles, pases_confirmados, caddie_incluido, carrito_compartido, clubs(nombre, ciudad, direccion, latitud, longitud), profiles!tee_time_offers_host_id_fkey(nombre, handicap_manual)";

  let fixedQuery = supabase
    .from("tee_time_offers")
    .select(offerSelect)
    .eq("estado", "activa")
    .eq("fecha_flexible", false)
    .gte("fecha", new Date().toISOString().slice(0, 10))
    .order("fecha", { ascending: true });
  if (club_id) fixedQuery = fixedQuery.eq("club_id", club_id);
  if (fecha) fixedQuery = fixedQuery.eq("fecha", fecha);

  let flexQuery = supabase
    .from("tee_time_offers")
    .select(offerSelect)
    .eq("estado", "activa")
    .eq("fecha_flexible", true)
    .order("created_at", { ascending: false });
  if (club_id) flexQuery = flexQuery.eq("club_id", club_id);

  const [
    { data: offers, error: offersError },
    { data: flexOffers, error: flexError },
  ] = await Promise.all([fixedQuery, flexQuery]);
  if (offersError) console.error("[ofertas] Error cargando ofertas:", offersError);
  if (flexError) console.error("[ofertas] Error cargando ofertas flexibles:", flexError);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-swf-verde">Explorar rondas</h1>
        <LinkButton href="/ofertas/nueva" variant="secondary">
          + Anfitrionar ronda
        </LinkButton>
      </div>

      <form className="mb-6 flex flex-wrap items-start gap-3" method="get">
        <div className="w-64">
          <ClubCombobox clubs={clubs} defaultValue={club_id ?? ""} emptyOptionLabel="Todos los clubes" />
        </div>
        <input
          type="date"
          name="fecha"
          defaultValue={fecha ?? ""}
          className="rounded-md border border-swf-verde/20 bg-white px-3 py-2 text-sm text-swf-verde"
        />
        <button
          type="submit"
          className="rounded-md border border-swf-verde/30 px-4 py-2 text-sm text-swf-verde hover:bg-swf-verde/5"
        >
          Filtrar
        </button>
        {(club_id || fecha) && (
          <Link
            href="/ofertas"
            className="flex items-center text-sm text-swf-verde/60 hover:text-swf-verde"
          >
            Limpiar filtros
          </Link>
        )}
      </form>

      {offersError || flexError ? (
        <Card className="mb-6 border-red-300 bg-red-50">
          <p className="text-sm text-red-800">
            No pudimos cargar las ofertas ({offersError?.message ?? flexError?.message}). Si
            esto sigue pasando, probablemente falte correr las migraciones más recientes en
            Supabase.
          </p>
        </Card>
      ) : null}

      {!offers?.length && !flexOffers?.length ? (
        <Card>
          <p className="text-sm text-swf-verde/70">
            No hay rondas disponibles con esos filtros por ahora.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {offers?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {(offers as unknown as OfferRow[]).map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : null}

          {flexOffers?.length ? (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-swf-verde">
                Disponibilidad flexible
              </h2>
              <p className="mb-3 text-sm text-swf-verde/60">
                Estos anfitriones no fijaron una fecha — coordinan directo contigo una vez que
                aprueben tu solicitud.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {(flexOffers as unknown as OfferRow[]).map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
