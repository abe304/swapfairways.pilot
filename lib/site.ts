import { headers } from "next/headers";

// URL pública del sitio, para armar enlaces de invitación. Usa
// NEXT_PUBLIC_SITE_URL cuando esté configurada (p. ej. https://swapfairways.com
// una vez conectado el dominio) y, si no, la del request actual.
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Correo de contacto que se muestra en el sitio (ej. mexico@swapfairways.com).
// Si no está configurado, no se muestra ninguno.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;
