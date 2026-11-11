import { cn } from "@/lib/utils";

// Golfista a línea fina (estilo doodle) caminando con su bolsa: la idea de
// "ir a jugar a otro campo". Todo es trazo; los rellenos solo tapan las líneas
// que quedan detrás y usan el color del fondo.
export function Golfista({ trazo = "#faf8f5", fondo = "#0e2b20" }: { trazo?: string; fondo?: string }) {
  return (
    <g fill={fondo} stroke={trazo} strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round">
      {/* Pierna trasera y zapato */}
      <path d="M30.8 35.8 L24 48.4 L27.6 49.6 L34.4 37" />
      <path d="M23.6 48.2 L28 49.6 Q28.2 52 25.6 52 L22 51.2 Q21.6 49.2 23.6 48.2Z" />
      {/* Pierna delantera y zapato */}
      <path d="M34.2 36.6 L41.8 49.6 L45.4 48.4 L38.2 35.8" />
      <path d="M41.6 49.6 L45.8 48.2 Q47.8 50 46.2 51.8 L42.6 52.4 Q41 51.4 41.6 49.6Z" />
      {/* Torso */}
      <path d="M32.2 18.2 C29.8 23 29.6 29.4 30.4 36 L38.6 36 C39.6 29.4 39.6 23.4 38 18.2 Q35 17 32.2 18.2Z" />
      {/* Cabeza, oreja y gorra */}
      <circle cx="35" cy="12.4" r="4.8" />
      <path d="M33.4 13.2 q-1.2 0.6 -0.2 1.6" fill="none" />
      <path d="M30.4 11.2 C30.6 7 39 6.6 39.6 10.8 Z" stroke="#c5a059" />
      <path d="M39.4 10.8 L44 11.6" stroke="#c5a059" fill="none" />
      {/* Palos asomando al frente */}
      <path d="M48.2 27.8 L52 24.6 M48.4 30 L52.8 29 M48 32.2 L51.8 33.4" fill="none" />
      {/* Bolsa de palos bajo el brazo */}
      <rect x="20.8" y="26.6" width="27.8" height="7" rx="3.5" stroke="#c5a059" />
      <path d="M26.2 33.6 L26.2 30.4 L31 30.4 L31 33.6" stroke="#c5a059" fill="none" />
      {/* Brazo y mano */}
      <path d="M36.6 19.8 C37.4 23.6 38.6 26.4 41.4 28.2" fill="none" />
      <circle cx="42.2" cy="28.6" r="1.2" />
      {/* Sombra */}
      <path d="M22 55 L46 55" strokeOpacity="0.35" fill="none" />
    </g>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="16 4 40 54" className={cn("h-11 w-auto", className)} aria-hidden>
      <Golfista />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-lg font-light tracking-wide text-swf-crema">
        Swap<span className="font-medium text-swf-dorado">Fairways</span>
      </span>
    </span>
  );
}
