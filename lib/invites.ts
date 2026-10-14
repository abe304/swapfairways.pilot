// Código de invitación: mismo formato y alfabeto que generar_codigo_invitacion()
// en supabase/migrations/0012 (sin 0/O/1/I/L para poder dictarlo por teléfono).
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generarCodigo(): string {
  let codigo = "SWF-";
  for (let i = 0; i < 6; i++) codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return codigo;
}

export function normalizarCodigo(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase();
}

export function enlaceInvitacion(siteUrl: string, codigo: string) {
  return `${siteUrl}/registro?codigo=${encodeURIComponent(codigo)}`;
}

export function mensajeWhatsApp(enlace: string, nombre?: string) {
  const texto =
    `${nombre ? `Hola ${nombre}, ` : "Hola, "}te invito a SwapFairways, la red para intercambiar rondas ` +
    `de golf entre socios de clubes de México. Regístrate con mi enlace: ${enlace}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
