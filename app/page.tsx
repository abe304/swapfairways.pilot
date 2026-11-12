import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { ClubPhoto } from "@/components/ClubPhoto";
import { HeroIllustration } from "@/components/HeroIllustration";
import { LinkButton } from "@/components/ui/Button";
import { CONTACT_EMAIL, INSTAGRAM_URL } from "@/lib/site";
import { ubicacion } from "@/lib/utils";

type ClubCard = { id: string; nombre: string; estado: string | null; ciudad: string | null; foto_url: string | null };

// Campos que se muestran primero en la home mientras no tengan foto propia;
// en cuanto el administrador sube fotos, esas pasan al frente.
const DESTACADOS = [
  "Club de Golf México",
  "Club de Golf Chapultepec",
  "Club Campestre de la Ciudad de México",
  "Guadalajara Country Club",
  "Atlas Country Club",
  "Club Campestre de Monterrey",
  "Vidanta Vallarta Course",
  "Punta Mita Club de Golf Pacifico",
  "Cabo Real Golf Club",
  "El Cielo Country Club",
  "Golf Country Club Tapalpa",
  "Club Campestre Cocoyoc",
];

const PASOS = [
  {
    n: "1",
    titulo: "Anfitriona una ronda",
    texto:
      "Publica tu tee time en tu club con fecha, pases y costos aproximados. Tú decides con quién compartes la salida.",
  },
  {
    n: "2",
    titulo: "Solicita jugar en otro club",
    texto:
      "Explora los campos de la red, mira reglamentos y costos, y pide unirte a la ronda de un socio.",
  },
  {
    n: "3",
    titulo: "Juega y gana créditos",
    texto:
      "Los créditos se mueven solo cuando la ronda se juega. Lo que ganas anfitrionando lo usas en otros campos.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: clubsData } = await supabase
    .from("clubs")
    .select("id, nombre, estado, ciudad, foto_url")
    .order("nombre");
  const clubs = (clubsData as ClubCard[] | null) ?? [];

  const conFoto = clubs.filter((c) => c.foto_url);
  const curados = DESTACADOS.map((n) => clubs.find((c) => c.nombre === n)).filter(
    (c): c is ClubCard => !!c && !c.foto_url,
  );
  const destacados = [...conFoto, ...curados].slice(0, 8);

  const porEstado = new Map<string, number>();
  for (const c of clubs) if (c.estado) porEstado.set(c.estado, (porEstado.get(c.estado) ?? 0) + 1);
  const estados = [...porEstado.entries()].sort((a, b) => b[1] - a[1]);
  const estadosChips = estados.slice(0, 10);

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* ---------- Hero con buscador ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-swf-verde-claro to-[#24503a] text-swf-crema">
        <HeroIllustration />

        <div className="relative mx-auto max-w-6xl px-4 pb-44 pt-14 sm:pb-52 sm:pt-20">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-swf-dorado">
            Red de socios · México
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Juega los mejores campos de México como socio invitado
          </h1>
          <p className="mt-4 max-w-xl text-base text-swf-crema/80">
            Intercambia rondas con socios de otros clubes usando créditos: anfitriona en tu club,
            juega en el suyo.
          </p>

          {/* Buscador estilo Airbnb: dónde · cuándo · jugadores */}
          <form
            action="/ofertas"
            method="get"
            className="mt-10 grid max-w-4xl gap-px overflow-hidden rounded-2xl bg-swf-verde/10 shadow-xl sm:grid-cols-[1.6fr_1fr_0.8fr_auto] sm:rounded-full"
          >
            <label className="block bg-white px-6 py-3 text-swf-verde sm:rounded-l-full">
              <span className="block text-xs font-semibold uppercase tracking-wide">Dónde</span>
              <input
                name="q"
                list="lugares"
                placeholder="Club, ciudad o estado"
                autoComplete="off"
                className="mt-0.5 w-full bg-transparent text-sm text-swf-verde placeholder:text-swf-verde/40 focus:outline-none"
              />
              <datalist id="lugares">
                {estados.map(([estado]) => (
                  <option key={estado} value={estado} />
                ))}
                {destacados.map((c) => (
                  <option key={c.id} value={c.nombre} />
                ))}
              </datalist>
            </label>
            <label className="block bg-white px-6 py-3 text-swf-verde">
              <span className="block text-xs font-semibold uppercase tracking-wide">Cuándo</span>
              <input
                type="date"
                name="fecha"
                min={hoy}
                className="mt-0.5 w-full bg-transparent text-sm text-swf-verde focus:outline-none"
              />
            </label>
            <label className="block bg-white px-6 py-3 text-swf-verde">
              <span className="block text-xs font-semibold uppercase tracking-wide">Jugadores</span>
              <select
                name="pases"
                defaultValue=""
                className="mt-0.5 w-full bg-transparent text-sm text-swf-verde focus:outline-none"
              >
                <option value="">Cualquiera</option>
                <option value="1">1 pase</option>
                <option value="2">2 pases</option>
                <option value="3">3 pases</option>
              </select>
            </label>
            <button
              type="submit"
              className="bg-swf-dorado px-8 py-4 text-sm font-semibold text-swf-verde transition-colors hover:bg-swf-dorado/90 sm:rounded-r-full"
            >
              Buscar
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            {profile ? (
              <>
                <span className="text-swf-crema/80">
                  Hola, {profile.nombre.split(" ")[0]} · {profile.creditos_balance} créditos
                </span>
                <LinkButton href="/ofertas/nueva" variant="secondary">
                  Anfitrionar una ronda
                </LinkButton>
              </>
            ) : (
              <>
                <LinkButton href="/registro" variant="secondary">
                  Únete con tu código de invitación
                </LinkButton>
                <Link href="/login" className="text-swf-crema/80 underline hover:text-swf-dorado">
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14">
        {/* ---------- Explora por estado ---------- */}
        {estadosChips.length > 0 ? (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-swf-verde">Explora por estado</h2>
            <div className="flex flex-wrap gap-2">
              {estadosChips.map(([estado, total]) => (
                <Link
                  key={estado}
                  href={`/clubes?estado=${encodeURIComponent(estado)}`}
                  className="rounded-full border border-swf-verde/20 bg-white px-4 py-2 text-sm text-swf-verde transition-colors hover:border-swf-dorado hover:bg-swf-dorado/10"
                >
                  {estado} <span className="text-swf-verde/50">· {total}</span>
                </Link>
              ))}
              <Link
                href="/clubes"
                className="rounded-full bg-swf-verde px-4 py-2 text-sm text-swf-crema hover:bg-swf-verde-claro"
              >
                Ver los {clubs.length} campos →
              </Link>
            </div>
          </section>
        ) : null}

        {/* ---------- Campos destacados ---------- */}
        {destacados.length > 0 ? (
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-xl font-semibold text-swf-verde">Campos de la red</h2>
              <Link href="/clubes" className="text-sm text-swf-dorado underline">
                Ver todos
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {destacados.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubes/${club.id}`}
                  className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-swf-verde/10 transition-shadow hover:shadow-lg"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
                      <ClubPhoto nombre={club.nombre} fotoUrl={club.foto_url} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold leading-snug text-swf-verde">{club.nombre}</h3>
                    <p className="mt-0.5 text-sm text-swf-verde/60">
                      {ubicacion(club.ciudad, club.estado)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* ---------- Cómo funciona ---------- */}
        <section>
          <h2 className="mb-6 text-xl font-semibold text-swf-verde">Cómo funciona</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PASOS.map((paso) => (
              <div key={paso.n} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-swf-verde/10">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-swf-dorado/20 text-sm font-semibold text-swf-verde">
                  {paso.n}
                </span>
                <h3 className="mt-4 font-semibold text-swf-verde">{paso.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-swf-verde/70">{paso.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Invita y gana ---------- */}
        <section className="overflow-hidden rounded-3xl bg-swf-verde p-8 text-swf-crema sm:p-12">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-swf-dorado">
              Invita y gana salidas
            </p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Cada socio tiene su código de invitación único
            </h2>
            <p className="mt-3 text-swf-crema/80">
              SwapFairways crece por recomendación. Comparte tu código con otro socio: cuando juegue
              su primera ronda, ganas créditos para tu próxima salida.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {profile ? (
                <LinkButton href="/perfil" variant="secondary">
                  Ver mi código de invitación
                </LinkButton>
              ) : (
                <LinkButton href="/registro" variant="secondary">
                  Tengo un código de invitación
                </LinkButton>
              )}
              {!profile && CONTACT_EMAIL ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-swf-crema/80 underline">
                  ¿Aún no tienes código? Escríbenos
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-swf-verde/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-swf-verde/60">
          <span>© {new Date().getFullYear()} SwapFairways · México</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/clubes" className="hover:text-swf-verde">
              Clubes
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-swf-verde"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
              </svg>
              Instagram
            </a>
            {CONTACT_EMAIL ? (
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-swf-verde">
                {CONTACT_EMAIL}
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
