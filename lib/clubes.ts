import type { ClubDocumentoTipo } from "@/lib/supabase/types";

export const DOC_TIPOS: { value: ClubDocumentoTipo; label: string }[] = [
  { value: "estatutos", label: "Estatutos" },
  { value: "reglamento", label: "Reglamento" },
  { value: "vestimenta", label: "Código de vestimenta" },
  { value: "otro", label: "Otro documento" },
];

export function docTipoLabel(tipo: string) {
  return DOC_TIPOS.find((t) => t.value === tipo)?.label ?? "Documento";
}
