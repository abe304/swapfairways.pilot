import { cn } from "@/lib/utils";

// Paletas de la marca para los campos que todavía no tienen foto, para que
// el directorio y la home no queden con huecos vacíos.
const FONDOS = [
  "from-[#0e2b20] via-[#163d2d] to-[#2c5b43]",
  "from-[#163d2d] via-[#0e2b20] to-[#5c4a1f]",
  "from-[#2c5b43] via-[#163d2d] to-[#0e2b20]",
  "from-[#0e2b20] via-[#24503a] to-[#c5a059]/60",
];

function indiceDeNombre(nombre: string) {
  let h = 0;
  for (const ch of nombre) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % FONDOS.length;
}

export function ClubPhoto({
  nombre,
  fotoUrl,
  className,
}: {
  nombre: string;
  fotoUrl: string | null | undefined;
  className?: string;
}) {
  if (fotoUrl) {
    return (
      // Las fotos vienen de Storage o de enlaces externos que el administrador
      // pega: no se conoce el dominio de antemano, así que no usamos next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoUrl}
        alt={`Campo de golf ${nombre}`}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`Campo de golf ${nombre}`}
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-br",
        FONDOS[indiceDeNombre(nombre)],
        className,
      )}
    >
      <svg viewBox="0 0 400 240" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
        <path d="M0 190 Q100 150 200 178 T400 160 V240 H0Z" fill="#faf8f5" fillOpacity="0.08" />
        <path d="M0 215 Q120 180 240 205 T400 195 V240 H0Z" fill="#faf8f5" fillOpacity="0.10" />
        <line x1="292" y1="104" x2="292" y2="172" stroke="#faf8f5" strokeOpacity="0.85" strokeWidth="2" />
        <path d="M292 104 L322 114 L292 124Z" fill="#c5a059" />
        <ellipse cx="292" cy="173" rx="20" ry="4" fill="#0e2b20" fillOpacity="0.35" />
      </svg>
    </div>
  );
}
