import { NivelBadge } from "@/components/NivelBadge";
import type { ClubNivel } from "@/lib/niveles";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { ClubPhoto } from "@/components/ClubPhoto";
import { Badge, Card } from "@/components/ui/Card";
import { normalizarTexto, ubicacion } from "@/lib/utils";

type ClubRow = {
  id: string;
  nombre: string;
  ciudad: string | null;
  estado: string | null;
  tipo: string;
  nivel: ClubNivel | null;
  foto_url: string | null;
  club_documentos: { id: string }[] | null;
};

export default async function ClubesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const busqueda = (q ?? "").trim();
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data } = await supabase
    .from("clubs")
    .select("id, nombre, ciudad, estado, tipo, nivel, foto_url, club_documentos(id)")
    .order("nombre");
  const todos = (data as unknown as ClubRow[] | null) ?? [];

  const estados = [...new Set(todos.map((c) => c.estado).filter((e): e is string => !!e))].sort(
    (a, b) => a.localeCompare(b, "es"),
  );

  const clubs = todos.filter((c) => {
    if (estado && c.estado !== estado) return false;
    if (!busqueda) return true;
    return [c.nombre, c.ciudad, c.estado].some((campo) =>
      normalizarTexto(campo).includes(normalizarTexto(busqueda)),
    );
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-swf-verde">Clubes de la red</h1>
          <p className="mt-1 text-sm text-swf-verde/70">
            Directorio de campos de golf de México con sus reglas, estatutos y costos.
          </p>
        </div>
        {profile?.is_admin ? (
          <Link href="/admin/clubes" className="text-sm text-swf-dorado underline">
            Administrar clubes
          </Link>
        ) : null}
      </div>

      <form method="get" className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          placeholder="Busca por club, ciudad o estado"
          className="w-64 rounded-md border border-swf-verde/20 bg-white px-3 py-2 text-sm text-swf-verde placeholder:text-swf-verde/40"
        />
        <select
          name="estado"
          defaultValue={estado ?? ""}
          aria-label="Estado"
          className="rounded-md border border-swf-verde/20 bg-white px-3 py-2 text-sm text-swf-verde"
        >
          <option value="">Todos los estados</option>
          {estados.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-swf-verde/30 px-4 py-2 text-sm text-swf-verde hover:bg-swf-verde/5"
        >
          Buscar
        </button>
        {busqueda || estado ? (
          <Link href="/clubes" className="text-sm text-swf-verde/60 hover:text-swf-verde">
            Limpiar
          </Link>
        ) : null}
        <span className="ml-auto text-sm text-swf-verde/60">
          {clubs.length} {clubs.length === 1 ? "club" : "clubes"}
        </span>
      </form>

      {clubs.length === 0 ? (
        <Card>
          <p className="text-sm text-swf-verde/70">No encontramos clubes con esa búsqueda.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const docs = club.club_documentos?.length ?? 0;
            return (
              <Link
                key={club.id}
                href={`/clubes/${club.id}`}
                className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-swf-verde/10 transition-shadow hover:shadow-lg"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
                    <ClubPhoto nombre={club.nombre} fotoUrl={club.foto_url} />
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="font-semibold leading-snug text-swf-verde">{club.nombre}</h2>
                  <p className="mt-0.5 text-sm text-swf-verde/60">
                    {ubicacion(club.ciudad, club.estado)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <NivelBadge nivel={club.nivel} />
                    <Badge>{club.tipo === "privado" ? "Privado" : "Público"}</Badge>
                    {docs > 0 ? (
                      <Badge tone="gold">
                        {docs} documento{docs === 1 ? "" : "s"}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
