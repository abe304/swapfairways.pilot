// Niveles de club y modalidad de acceso (ver migración 0016).
//
// - Nivel: cuánto vale una salida en el club. Fija los créditos por ronda.
// - Acceso: cómo entra un invitado. En clubes con pase, la ronda vale lo del
//   nivel. En clubes con green fee o públicos, el invitado SIEMPRE paga el
//   green fee directo en el club y la ronda le cuesta 1 crédito; el anfitrión
//   nunca lo cubre (migración 0025).
// - Lo que recibe el anfitrión es lo mismo que paga el invitado, salvo en
//   Premium con green fee: recibe 2 (0024). Premium público: recibe 1 (0025).
// - El acceso "abierto" se muestra como "Público" (el valor en la base sigue
//   siendo 'abierto').

export type ClubNivel = "premium" | "gold" | "silver";
export type ClubAcceso = "pase" | "green_fee" | "abierto";
/** Quién paga el green fee: siempre el invitado (0025). */
export type GreenFeePaga = "invitado";

export const NIVELES: { value: ClubNivel; label: string; creditos: number; descripcion: string }[] = [
  { value: "premium", label: "Premium", creditos: 3, descripcion: "Campo de alto valor, muy difícil conseguir quien te invite" },
  { value: "gold", label: "Gold", creditos: 2, descripcion: "Campo de valor medio" },
  { value: "silver", label: "Silver", creditos: 1, descripcion: "Campo accesible o público" },
];

export const ACCESOS: { value: ClubAcceso; label: string; descripcion: string }[] = [
  { value: "pase", label: "Pase de invitado", descripcion: "El socio invita con un pase del club." },
  { value: "green_fee", label: "Green fee", descripcion: "Acepta invitados, pero se paga por jugar." },
  { value: "abierto", label: "Público", descripcion: "Cualquiera puede reservar un tee time." },
];

/** Créditos que cuesta una ronda en clubes con green fee o públicos. */
export const CREDITOS_GREEN_FEE_INVITADO = 1;

/** Lo que recibe el anfitrión de un Premium con green fee (0024). No aplica a Premium público. */
export const CREDITOS_ANFITRION_PREMIUM_GREEN_FEE = 2;

export function creditosPorNivel(nivel: ClubNivel | null | undefined): number {
  return NIVELES.find((n) => n.value === nivel)?.creditos ?? 2;
}

export function nivelLabel(nivel: ClubNivel | null | undefined): string {
  return NIVELES.find((n) => n.value === nivel)?.label ?? "Gold";
}

export function accesoLabel(acceso: ClubAcceso | null | undefined): string {
  return ACCESOS.find((a) => a.value === acceso)?.label ?? "Pase de invitado";
}

/** ¿En este club el invitado paga green fee? (clubes con green fee o públicos) */
export function invitadoPagaGreenFee(acceso: ClubAcceso | null | undefined): boolean {
  return acceso === "green_fee" || acceso === "abierto";
}

type ClubReglas = {
  costo_creditos?: number | null;
  acceso?: ClubAcceso | null;
  nivel?: ClubNivel | null;
} | null | undefined;

/**
 * Créditos que cuesta unirse a una oferta. Misma regla que
 * create_join_request en la base: en clubes de pase, lo del nivel; en clubes
 * con green fee o públicos, 1 (el invitado paga el green fee).
 */
export function creditosOferta(club: ClubReglas): number {
  if (invitadoPagaGreenFee(club?.acceso)) return CREDITOS_GREEN_FEE_INVITADO;
  return club?.costo_creditos ?? 1;
}

/**
 * Créditos que recibe el anfitrión cuando se juega la ronda. Igual a lo que
 * paga el invitado, salvo en Premium con green fee, donde recibe 2 (0024).
 * Un Premium público da solo 1 (0025).
 */
export function creditosAnfitrion(club: ClubReglas): number {
  if (club?.acceso === "green_fee" && club?.nivel === "premium") {
    return CREDITOS_ANFITRION_PREMIUM_GREEN_FEE;
  }
  return creditosOferta(club);
}

export const NIVEL_ESTILOS: Record<ClubNivel, string> = {
  premium: "bg-swf-dorado text-swf-verde",
  gold: "bg-swf-dorado/25 text-swf-verde",
  silver: "bg-swf-verde/10 text-swf-verde/80",
};
