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

// Teléfono en formato internacional, solo dígitos (lo que pide wa.me).
// Pensado para México: "55 1234 5678" → "525512345678". También acepta
// "+52…", el formato viejo de celular "+52 1 …" y números de otros países
// si vienen con "+" (o "00") y lada internacional. Devuelve null si no
// parece válido.
export function normalizarTelefono(raw: string): string | null {
  const texto = raw.trim();
  const d = texto.replace(/\D/g, "");
  if (texto.startsWith("+") || texto.startsWith("00")) {
    const intl = texto.startsWith("00") ? d.slice(2) : d;
    if (/^521\d{10}$/.test(intl)) return `52${intl.slice(3)}`;
    return /^\d{8,15}$/.test(intl) ? intl : null;
  }
  if (/^\d{10}$/.test(d)) return `52${d}`;
  if (/^52\d{10}$/.test(d)) return d;
  if (/^521\d{10}$/.test(d)) return `52${d.slice(3)}`;
  return null;
}

// "525512345678" → "+52 55 1234 5678" (solo para mostrar).
export function formatoTelefono(tel: string): string {
  const m = /^52(\d{2})(\d{4})(\d{4})$/.exec(tel);
  return m ? `+52 ${m[1]} ${m[2]} ${m[3]}` : `+${tel}`;
}

// Enlace de WhatsApp con el mensaje ya escrito. Con teléfono abre el chat de
// esa persona; sin teléfono, WhatsApp pide elegir a quién mandarlo. El
// mensaje sale de la cuenta de WhatsApp abierta en ese dispositivo (la app
// del celular o WhatsApp Web).
export function mensajeWhatsApp(
  enlace: string,
  nombre?: string | null,
  opciones?: { telefono?: string | null; codigo?: string | null },
) {
  const saludo = nombre ? `Hola ${nombre}, ` : "Hola, ";
  const texto = opciones?.codigo
    ? `${saludo}te invito a SwapFairways, la red para intercambiar rondas de golf entre socios ` +
      `de clubes de México. Eres de los primeros socios fundadores: tu código es ` +
      `${opciones.codigo} y puedes crear tu cuenta aquí: ${enlace}`
    : `${saludo}te invito a SwapFairways, la red para intercambiar rondas ` +
      `de golf entre socios de clubes de México. Regístrate con mi enlace: ${enlace}`;
  return `https://wa.me/${opciones?.telefono ?? ""}?text=${encodeURIComponent(texto)}`;
}
