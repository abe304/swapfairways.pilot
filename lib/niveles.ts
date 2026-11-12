// Niveles de club y modalidad de acceso (ver migración 0016).
//
// - Nivel: cuánto vale una salida en el club. Fija los créditos por ronda.
// - Acceso: cómo entra un invitado. En clubes con green fee o abiertos, cada
//   oferta dice quién paga el green fee: si lo paga el invitado la ronda
//   cuesta 1 crédito; si lo cubre el anfitrión, cuesta lo del nivel.

export type ClubNivel = "premium" | "gold" | "silver";
export type ClubAcceso = "pase" | "green_fee" | "abierto";
export type GreenFeePaga = "anfitrion" | "invitado";

export const NIVELES: { value: ClubNivel; label: string; creditos: number; descripcion: string }[] = [
  { value: "premium", label: "Premium", creditos: 3, descripcion: "Campo de alto valor, muy difícil conseguir quien te invite" },
  { value: "gold", label: "Gold", creditos: 2, descripcion: "Campo de valor medio" },
  { value: "silver", label: "Silver", creditos: 1, descripcion: "Campo accesible o público" },
];

export const ACCESOS: { value: ClubAcceso; label: string; descripcion: string }[] = [
  { value: "pase", label: "Pase de invitado", descripcion: "El socio invita con un pase del club." },
  { value: "green_fee", label: "Green fee", descripcion: "Acepta invitados, pero se paga por jugar." },
  { value: "abierto", label: "Abierto", descripcion: "Cualquiera puede reservar un tee time." },
];

/** Créditos que cuesta una ronda si el invitado paga el green fee (clubes green_fee/abierto). */
export const CREDITOS_GREEN_FEE_INVITADO = 1;

export function creditosPorNivel(nivel: ClubNivel | null | undefined): number {
  return NIVELES.find((n) => n.value === nivel)?.creditos ?? 2;
}

export function nivelLabel(nivel: ClubNivel | null | undefined): string {
  return NIVELES.find((n) => n.value === nivel)?.label ?? "Gold";
}

export function accesoLabel(acceso: ClubAcceso | null | undefined): string {
  return ACCESOS.find((a) => a.value === acceso)?.label ?? "Pase de invitado";
}

/** ¿En este club el anfitrión elige quién paga el green fee? */
export function seEligeGreenFee(acceso: ClubAcceso | null | undefined): boolean {
  return acceso === "green_fee" || acceso === "abierto";
}

/**
 * Créditos que cuesta unirse a una oferta. Misma regla que
 * create_join_request en la base: en clubes green_fee/abierto, si el invitado
 * paga el green fee (o la oferta no lo dice) cuesta 1; si no, lo del club.
 */
export function creditosOferta(
  club: { costo_creditos?: number | null; acceso?: ClubAcceso | null } | null | undefined,
  greenFeePaga: GreenFeePaga | null | undefined,
): number {
  const costo = club?.costo_creditos ?? 1;
  if (seEligeGreenFee(club?.acceso) && (greenFeePaga ?? "invitado") === "invitado") {
    return CREDITOS_GREEN_FEE_INVITADO;
  }
  return costo;
}

export const NIVEL_ESTILOS: Record<ClubNivel, string> = {
  premium: "bg-swf-dorado text-swf-verde",
  gold: "bg-swf-dorado/25 text-swf-verde",
  silver: "bg-swf-verde/10 text-swf-verde/80",
};
