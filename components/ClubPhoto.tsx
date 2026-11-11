import { cn } from "@/lib/utils";

// Paletas de la marca para los campos que todavía no tienen foto, para que
// el directorio y la home no queden con huecos vacíos.
const FONDOS = [
  "from-[#2c5b43] via-[#4a8463] to-[#8cb89a]",
  "from-[#24503a] via-[#4f876a] to-[#d8c08a]",
  "from-[#3d7a57] via-[#5f9878] to-[#a9cbb2]",
  "from-[#2c5b43] via-[#5a8f6c] to-[#e2c27f]",
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
        {/* Resplandor de la tarde */}
        <circle cx="300" cy="70" r="70" fill="#f3dca6" fillOpacity="0.18" />
        <circle cx="300" cy="70" r="26" fill="#f3dca6" fillOpacity="0.55" />
        {/* Árboles detrás de la casa club */}
        <g fill="#24503a" fillOpacity="0.9">
          <circle cx="92" cy="150" r="20" /><circle cx="110" cy="138" r="24" /><circle cx="128" cy="152" r="18" />
          <circle cx="282" cy="146" r="22" /><circle cx="302" cy="134" r="26" /><circle cx="322" cy="150" r="18" />
        </g>
        {/* Casa club: ala lateral */}
        <rect x="118" y="146" width="56" height="34" fill="#efe7d8" />
        <path d="M112 148 L146 128 L180 148Z" fill="#a8843f" />
        <rect x="128" y="156" width="10" height="12" rx="1" fill="#c5a059" fillOpacity="0.85" />
        <rect x="152" y="156" width="10" height="12" rx="1" fill="#c5a059" fillOpacity="0.85" />
        {/* Cuerpo principal */}
        <rect x="166" y="126" width="104" height="54" fill="#faf8f5" />
        <rect x="236" y="96" width="10" height="20" fill="#d9cdb6" />
        <path d="M156 128 L218 90 L280 128Z" fill="#c5a059" />
        <path d="M156 128 L280 128 L278 132 L158 132Z" fill="#8a6b2f" fillOpacity="0.5" />
        {/* Pórtico con columnas */}
        <path d="M198 136 L218 122 L238 136Z" fill="#e8dcc0" />
        <rect x="198" y="136" width="40" height="3" fill="#d9cdb6" />
        <rect x="201" y="139" width="3" height="41" fill="#e8dcc0" />
        <rect x="232" y="139" width="3" height="41" fill="#e8dcc0" />
        <rect x="211" y="152" width="14" height="28" rx="1" fill="#0e2b20" fillOpacity="0.75" />
        {/* Ventanas iluminadas */}
        <g fill="#c5a059">
          <rect x="174" y="144" width="12" height="14" rx="1" /><rect x="174" y="162" width="12" height="10" rx="1" />
          <rect x="250" y="144" width="12" height="14" rx="1" /><rect x="250" y="162" width="12" height="10" rx="1" />
        </g>
        <circle cx="218" cy="112" r="5" fill="#0e2b20" fillOpacity="0.55" />
        {/* Asta con banderín en el techo */}
        <line x1="218" y1="90" x2="218" y2="70" stroke="#faf8f5" strokeWidth="1.5" />
        <path d="M218 70 L232 74 L218 78Z" fill="#c5a059" />
        {/* Prados al frente */}
        <path d="M0 182 Q100 168 200 180 T400 172 V240 H0Z" fill="#3d7a57" />
        <path d="M0 205 Q120 186 240 200 T400 192 V240 H0Z" fill="#4f8c69" />
        <path d="M150 240 Q200 205 218 184 L226 184 Q232 210 290 240Z" fill="#e8dcc0" fillOpacity="0.55" />
        <path d="M0 226 Q140 210 280 222 T400 216 V240 H0Z" fill="#2e6748" />
      </svg>
    </div>
  );
}
