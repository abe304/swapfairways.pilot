import { NivelBadge } from "@/components/NivelBadge";
import { creditosOferta, type ClubAcceso, type ClubNivel, type GreenFeePaga } from "@/lib/niveles";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ClubCombobox } from "@/components/ClubCombobox";
import {
  formatFecha,
  formatHora,
  formatMoneda,
  mapsUrl,
  nombreConHc,
  normalizarTexto,
} from "@/lib/utils";
import { OFFER_LIST_SELECT } from "@/lib/queries";

type OfferClub = {
  nombre: string;
  ciudad: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  nivel: ClubNivel;
  acceso: ClubAcceso;
  costo_creditos: number;
};
type OfferHost = { nombre: string; handicap_manual: number | null };
type OfferRow = {
  id: string;
  fecha: string | null;
  hora: string | null;
  fecha_flexible: boolean;
  pases_disponibles: number;
  pases_confirmados: number;
  caddie_compartido: boolean;
  carrito_compartido: boolean;
  costo_estimado: number | null;
  green_fee_paga: GreenFeePaga | null;
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
          {club ? <NivelBadge nivel={club.nivel} className="self-center" /> : null}
          <Badge tone="gold">
            {creditosOferta(club, offer.green_fee_paga)}{" "}
            {creditosOferta(club, offer.green_fee_paga) === 1 ? "crédito" : "créditos"}
          </Badge>
          {offer.caddie_compartido ? <Badge>Caddie compartido</Badge> : null}
          {offer.carrito_compartido ? <Badge>Carrito compartido</Badge> : null}
          {offer.costo_estimado ? (
            <Badge tone="gold">Aprox. {formatMoneda(offer.costo_estimado)}</Badge>
          ) : null}
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
  searchParams: Promise<{ club_id?: string; fecha?: string; q?: string; pases?: string }>;
}) {
  const { club_id, fecha, q, pases } = await searchParams;
  const busqueda = (q ?? "").trim();
  const pasesMin = Math.min(3, Math.max(0, Number(pases) || 0));
  const supabase = await createClient();

  const { data: clubsData } = await supabase.from("clubs").select("*").order("nombre");
  const clubs = clubsData ?? [];

  // La búsqueda de texto (la que llega desde la home) coincide con el nombre,
  // la ciudad o el estado del club, sin importar acentos.
  const clubIdsPorTexto = busqueda
    ? clubs
        .filter((c) =>
          [c.nombre, c.ciudad, c.estado].some((campo) =>
            normalizarTexto(campo).includes(normalizarTexto(busqueda)),
          ),
        )
        .map((c) => c.id)
    : null;

  let fixedQuery = supabase
    .from("tee_time_offers")
    .select(OFFER_LIST_SELECT)
    .eq("estado", "activa")
    .eq("fecha_flexible", false)
    .gte("fecha", new Date().toISOString().slice(0, 10))
    .order("fecha", { ascending: true });
  if (club_id) fixedQuery = fixedQuery.eq("club_id", club_id);
  if (clubIdsPorTexto) fixedQuery = fixedQuery.in("club_id", clubIdsPorTexto);
  if (fecha) fixedQuery = fixedQuery.eq("fecha", fecha);

  let flexQuery = supabase
    .from("tee_time_offers")
    .select(OFFER_LIST_SELECT)
    .eq("estado", "activa")
    .eq("fecha_flexible", true)
    .order("created_at", { ascending: false });
  if (club_id) flexQuery = flexQuery.eq("club_id", club_id);
  if (clubIdsPorTexto) flexQuery = flexQuery.in("club_id", clubIdsPorTexto);

  const [
    { data: offersRaw, error: offersError },
    { data: flexRaw, error: flexError },
  ] = await Promise.all([fixedQuery, flexQuery]);

  // "Jugadores": solo rondas con al menos ese número de pases libres.
  const conCupo = (rows: unknown) =>
    ((rows as OfferRow[] | null) ?? []).filter(
      (o) => o.pases_disponibles - o.pases_confirmados >= pasesMin,
    );
  const offers = conCupo(offersRaw);
  const flexOffers = conCupo(flexRaw);
  const hayFiltros = !!(club_id || fecha || busqueda || pasesMin);
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
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          placeholder="Club, ciudad o estado"
          className="w-56 rounded-md border border-swf-verde/20 bg-white px-3 py-2 text-sm text-swf-verde placeholder:text-swf-verde/40"
        />
        <div className="w-64">
          <ClubCombobox clubs={clubs} defaultValue={club_id ?? ""} emptyOptionLabel="Todos los clubes" />
        </div>
        <input
          type="date"
          name="fecha"
          defaultValue={fecha ?? ""}
          className="rounded-md border border-swf-verde/20 bg-white px-3 py-2 text-sm text-swf-verde"
        />
        <select
          name="pases"
          defaultValue={pasesMin ? String(pasesMin) : ""}
          aria-label="Pases libres"
          className="rounded-md border border-swf-verde/20 bg-white px-3 py-2 text-sm text-swf-verde"
        >
          <option value="">Cualquier número de pases</option>
          <option value="1">Al menos 1 pase libre</option>
          <option value="2">Al menos 2 pases libres</option>
          <option value="3">3 pases libres</option>
        </select>
        <button
          type="submit"
          className="rounded-md border border-swf-verde/30 px-4 py-2 text-sm text-swf-verde hover:bg-swf-verde/5"
        >
          Filtrar
        </button>
        {hayFiltros && (
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

      {!offers.length && !flexOffers.length ? (
        <Card>
          <p className="text-sm text-swf-verde/70">
            No hay rondas disponibles con esos filtros por ahora.{" "}
            <Link href="/ofertas/nueva" className="text-swf-dorado underline">
              Anfitriona una ronda
            </Link>{" "}
            o intenta con otro lugar o fecha.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {offers.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : null}

          {flexOffers.length ? (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-swf-verde">
                Disponibilidad flexible
              </h2>
              <p className="mb-3 text-sm text-swf-verde/60">
                Estos anfitriones no fijaron una fecha — coordinan directo contigo una vez que
                aprueben tu solicitud.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {flexOffers.map((offer) => (
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
