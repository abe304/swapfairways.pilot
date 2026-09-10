import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { formatFecha, formatHora } from "@/lib/utils";

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<{ club_id?: string; fecha?: string }>;
}) {
  const { club_id, fecha } = await searchParams;
  const supabase = await createClient();

  const { data: clubs } = await supabase.from("clubs").select("*").order("nombre");

  let query = supabase
    .from("tee_time_offers")
    .select("*, clubs(nombre, ciudad), profiles!tee_time_offers_host_id_fkey(nombre)")
    .eq("estado", "activa")
    .gte("fecha", new Date().toISOString().slice(0, 10))
    .order("fecha", { ascending: true });

  if (club_id) query = query.eq("club_id", club_id);
  if (fecha) query = query.eq("fecha", fecha);

  const { data: offers } = await query;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-swf-verde">Explorar rondas</h1>
        <LinkButton href="/ofertas/nueva" variant="secondary">
          + Anfitrionar ronda
        </LinkButton>
      </div>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <Select name="club_id" defaultValue={club_id ?? ""} className="max-w-xs">
          <option value="">Todos los clubes</option>
          {clubs?.map((club) => (
            <option key={club.id} value={club.id}>
              {club.nombre}
            </option>
          ))}
        </Select>
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

      {!offers?.length ? (
        <Card>
          <p className="text-sm text-swf-verde/70">
            No hay rondas disponibles con esos filtros por ahora.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => {
            const club = (offer as unknown as { clubs: { nombre: string; ciudad: string | null } | null })
              .clubs;
            const host = (
              offer as unknown as { profiles: { nombre: string } | null }
            ).profiles;
            const cuposLibres = offer.pases_disponibles - offer.pases_confirmados;
            return (
              <Link key={offer.id} href={`/ofertas/${offer.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-semibold text-swf-verde">{club?.nombre}</h2>
                    <Badge tone={cuposLibres > 0 ? "success" : "warning"}>
                      {cuposLibres} pase{cuposLibres === 1 ? "" : "s"} libre
                      {cuposLibres === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <p className="text-sm text-swf-verde/70">
                    {formatFecha(offer.fecha)} · {formatHora(offer.hora)}
                  </p>
                  <p className="mt-2 text-sm text-swf-verde/60">
                    Anfitrión: {host?.nombre ?? "Socio SWF"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {offer.caddie_incluido ? <Badge>Caddie incluido</Badge> : null}
                    {offer.carrito_compartido ? <Badge>Carrito compartido</Badge> : null}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
