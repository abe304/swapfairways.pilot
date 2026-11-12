import { NIVEL_ESTILOS, nivelLabel, type ClubNivel } from "@/lib/niveles";

export function NivelBadge({ nivel, className = "" }: { nivel: ClubNivel | null | undefined; className?: string }) {
  const n = nivel ?? "gold";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${NIVEL_ESTILOS[n]} ${className}`}
    >
      {nivelLabel(n)}
    </span>
  );
}
