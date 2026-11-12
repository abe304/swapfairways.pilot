import { NivelBadge } from "@/components/NivelBadge";
import { CREDITOS_GREEN_FEE_INVITADO, accesoLabel, seEligeGreenFee } from "@/lib/niveles";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { ClubPhoto } from "@/components/ClubPhoto";
import { Badge, Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { docTipoLabel } from "@/lib/clubes";
import { formatFecha, formatHora, mapsUrl, ubicacion } from "@/lib/utils";
import type { Club, ClubDocumento } from "@/lib/supabase/types";

type OfertaClub = {
  id: string;
  fecha: string | null;
  hora: string | null;
  fecha_flexible: boolean;
  pases_disponibles: number;
  pases_confirmados: number;
  profiles: { nombre: string } | null;
};

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data } = await supabase
    .from("clubs")
    .select("*, club_documentos(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const club = data as unknown as Club & { club_documentos: ClubDocumento[] | null };
  const documentos = (club.club_documentos ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));

  const { data: ofertasData } = await supabase
    .from("tee_time_offers")
    .select("id, fecha, hora, fecha_flexible, pases_disponibles, pases_confirmados, profiles(nombre)")
    .eq("club_id", id)
    .eq("estado", "activa")
    .order("fecha", { ascending: true });
  const hoy = new Date().toISOString().slice(0, 10);
  const ofertas = ((ofertasData as unknown as OfertaClub[] | null) ?? []).filter(
    (o) => o.fecha_flexible || (o.fecha ?? "") >= hoy,
  );

  const reglas = [
    club.requiere_caddie_invitado ? "Caddie obligatorio para invitados" : null,
    club.carrito_obligatorio ? "Carrito obligatorio" : null,
    club.requiere_ghin ? "Requiere GHIN" : null,
  ].filter((r): r is string => !!r);

  return (
    <div className="space-y-8">
      <Link href="/clubes" className="text-sm text-swf-verde/60 hover:text-swf-verde">
        ← Todos los clubes
      </Link>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-swf-verde/10">
        <div className="aspect-[21/8] w-full">
          <ClubPhoto nombre={club.nombre} fotoUrl={club.foto_url} />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <h1 className="text-2xl font-semibold text-swf-verde">{club.nombre}</h1>
            <p className="mt-1 text-swf-verde/70">
              {ubicacion(club.ciudad, club.estado)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <NivelBadge nivel={club.nivel} className="px-3 py-1 text-xs" />
              <Badge>{club.tipo === "privado" ? "Club privado" : "Campo público"}</Badge>
              <Badge>{accesoLabel(club.acceso)}</Badge>
              <Badge tone="gold">
                {seEligeGreenFee(club.acceso)
                  ? `${club.costo_creditos} crédito${club.costo_creditos === 1 ? "" : "s"} si el anfitrión cubre el green fee · ${CREDITOS_GREEN_FEE_INVITADO} si lo paga el invitado`
                  : `${club.costo_creditos} crédito${club.costo_creditos === 1 ? "" : "s"} por ronda`}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {club.direccion ? (
              <a
                href={mapsUrl(club.direccion, club)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-swf-verde/30 px-4 py-2 text-sm text-swf-verde hover:bg-swf-verde/5"
              >
                Ver en Google Maps
              </a>
            ) : null}
            {profile?.is_admin ? (
              <LinkButton href={`/admin/clubes/${club.id}`} variant="secondary">
                Editar club
              </LinkButton>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-swf-verde">Estatutos y reglamentos</h2>
          {documentos.length === 0 ? (
            <p className="text-sm text-swf-verde/60">
              Este club aún no tiene documentos cargados.
              {profile?.is_admin ? " Puedes subirlos desde “Editar club”." : ""}
            </p>
          ) : (
            <ul className="space-y-2">
              {documentos.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-swf-verde underline decoration-swf-dorado underline-offset-2 hover:text-swf-dorado"
                  >
                    {d.titulo}
                  </a>
                  <Badge>{docTipoLabel(d.tipo)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-swf-verde">Reglas para invitados</h2>
          {reglas.length === 0 && !club.reglamento && !club.recomendacion_llegada ? (
            <p className="text-sm text-swf-verde/60">Sin reglas específicas registradas todavía.</p>
          ) : (
            <div className="space-y-3 text-sm text-swf-verde">
              {reglas.length ? (
                <div className="flex flex-wrap gap-2">
                  {reglas.map((r) => (
                    <Badge key={r} tone="warning">
                      {r}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {club.recomendacion_llegada ? <p>{club.recomendacion_llegada}</p> : null}
              {club.reglamento ? (
                <p className="whitespace-pre-line text-swf-verde/80">{club.reglamento}</p>
              ) : null}
            </div>
          )}
        </Card>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-swf-verde">Rondas disponibles en este club</h2>
        {ofertas.length === 0 ? (
          <Card>
            <p className="text-sm text-swf-verde/70">
              No hay rondas publicadas en este club por ahora.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ofertas.map((o) => {
              const libres = o.pases_disponibles - o.pases_confirmados;
              return (
                <Link key={o.id} href={`/ofertas/${o.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <p className="text-sm font-medium text-swf-verde">
                      {o.fecha_flexible || !o.fecha || !o.hora
                        ? "Fecha a coordinar con el anfitrión"
                        : `${formatFecha(o.fecha)} · ${formatHora(o.hora)}`}
                    </p>
                    <p className="mt-1 text-xs text-swf-verde/60">
                      Anfitrión: {o.profiles?.nombre ?? "Socio"} · {libres} pase
                      {libres === 1 ? "" : "s"} libre{libres === 1 ? "" : "s"}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
