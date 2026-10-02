import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Conceptos de costo que el anfitrión captura al publicar una ronda. Se
// definen una sola vez para que el formulario, el detalle de la oferta y la
// simulación automática hablen de lo mismo.
export const COSTO_CONCEPTOS = [
  { key: "costo_green_fee", label: "Green fee", hint: "Si el club no da pase gratuito a invitados" },
  { key: "costo_carrito", label: "Carrito", hint: "" },
  { key: "costo_caddie", label: "Caddie", hint: "" },
  { key: "costo_desayuno", label: "Desayuno", hint: "" },
  { key: "costo_snacks", label: "Snacks", hint: "" },
  { key: "costo_bebidas", label: "Bebidas", hint: "" },
  { key: "costo_renta_equipo", label: "Renta de equipo", hint: "" },
  { key: "consumo_minimo", label: "Consumo mínimo", hint: "Si el club lo exige" },
  { key: "propina_recomendada", label: "Propina recomendada", hint: "" },
] as const;

export type CostoKey = (typeof COSTO_CONCEPTOS)[number]["key"] | "costo_otros";

export type Costos = Partial<Record<CostoKey, number | null>> & {
  concepto_otros?: string | null;
};

const TODAS_LAS_CLAVES: CostoKey[] = [...COSTO_CONCEPTOS.map((c) => c.key), "costo_otros"];

// Carrito y caddie pueden ser compartidos entre el anfitrión y el invitado.
// Se captura el costo completo y el invitado paga la mitad.
export type Compartidos = { carrito?: boolean; caddie?: boolean };

export function parteInvitado(key: CostoKey, monto: number | null | undefined, c: Compartidos = {}): number {
  const m = monto ?? 0;
  const dividido = (key === "costo_carrito" && c.carrito) || (key === "costo_caddie" && c.caddie);
  return dividido ? m / 2 : m;
}

// Total que paga el invitado (con carrito/caddie compartidos ya divididos).
export function totalCostos(costos: Costos, compartidos: Compartidos = {}): number {
  return TODAS_LAS_CLAVES.reduce((sum, key) => sum + parteInvitado(key, costos[key], compartidos), 0);
}

// Lee los campos de costo de un FormData. Un campo vacío = no aplica (null);
// un valor no numérico o negativo es un error de captura, no se ignora.
export function parseCostos(formData: FormData): { costos: Costos } | { error: string } {
  const costos: Costos = {};
  for (const key of TODAS_LAS_CLAVES) {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) {
      costos[key] = null;
      continue;
    }
    const n = Number(raw);
    if (Number.isNaN(n) || n < 0) {
      const label =
        key === "costo_otros" ? "Otros cargos" : COSTO_CONCEPTOS.find((c) => c.key === key)!.label;
      return { error: `"${label}" debe ser un monto válido (0 o mayor).` };
    }
    costos[key] = n;
  }
  const concepto = String(formData.get("concepto_otros") ?? "").trim();
  costos.concepto_otros = concepto || null;
  if (costos.costo_otros && !costos.concepto_otros) {
    return { error: 'Indica el concepto de "Otros cargos" (por ejemplo: cuota de práctica).' };
  }
  return { costos };
}

export type OfferInsert = Database["public"]["Tables"]["tee_time_offers"]["Insert"];

// Inserta una o varias ofertas y devuelve sus ids.
//
// OJO: no encadenar `.order(...)` después de `.insert().select()`. PostgREST
// aplica el ORDER BY sobre el resultado del INSERT (que solo trae las
// columnas del select) y falla con 'column tee_time_offers.created_at does
// not exist'. Para este uso el orden no importa.
export async function insertOffers(supabase: SupabaseClient<Database>, rows: OfferInsert[]) {
  return supabase.from("tee_time_offers").insert(rows).select("id");
}
