import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}

export function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatHora(hora: string) {
  const [h, m] = hora.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
}

export function formatMoneda(monto: number | null) {
  if (!monto) return "Sin costo estimado";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(monto);
}

export function nombreConHc(nombre: string | undefined | null, hc: number | null | undefined) {
  if (!nombre) return "Socio";
  return hc !== null && hc !== undefined ? `${nombre} (HC ${hc})` : nombre;
}

export function mapsUrl(
  direccion: string,
  coords?: { latitud: number | null; longitud: number | null } | null,
) {
  const query =
    coords?.latitud != null && coords?.longitud != null
      ? `${coords.latitud},${coords.longitud}`
      : direccion;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const BEHAVIOR_TAGS = [
  "Buen ritmo de juego",
  "Puntual",
  "Buena etiqueta",
  "Gran camaradería",
  "Ritmo lento",
  "Faltó a la etiqueta",
] as const;
