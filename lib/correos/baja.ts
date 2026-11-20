// Baja de los correos de seguimiento (S1–S4) con un enlace firmado.
//
// El enlace lleva el id del socio y una firma HMAC, así funciona sin iniciar
// sesión y nadie puede dar de baja a otro cambiando el id. La firma usa
// CORREOS_SECRET o, si no existe, CRON_SECRET (ya configurada en Vercel).
// La columna profiles.correos_seguimiento (migración 0023) solo la cambia el
// servidor con la service role: no está entre las que el usuario puede editar.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { MOCK_MODE } from "@/lib/mock/is-mock";

function secreto() {
  const s = process.env.CORREOS_SECRET || process.env.CRON_SECRET;
  if (s) return s;
  if (MOCK_MODE) return "swf-demo";
  return null;
}

function firma(userId: string) {
  const s = secreto();
  if (!s) return null;
  return createHmac("sha256", s).update(`baja:${userId}`).digest("base64url").slice(0, 32);
}

/** Enlace para dejar de recibir los correos de seguimiento, o null sin secreto. */
export function enlaceBaja(sitio: string, userId: string) {
  const t = firma(userId);
  if (!t) return null;
  return `${sitio}/correos/baja?u=${encodeURIComponent(userId)}&t=${t}`;
}

export function firmaValida(userId: string | undefined, token: string | undefined) {
  if (!userId || !token) return false;
  const esperada = firma(userId);
  if (!esperada || esperada.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(esperada), Buffer.from(token));
}

/** Cambia la preferencia. Solo llamar después de validar la firma. */
export async function cambiarSeguimiento(userId: string, recibir: boolean) {
  let cliente: SupabaseClient<Database>;
  if (MOCK_MODE) {
    const { createClient } = await import("@/lib/supabase/server");
    cliente = (await createClient()) as unknown as SupabaseClient<Database>;
  } else {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    cliente = createAdminClient();
  }
  const { error } = await cliente
    .from("profiles")
    .update({ correos_seguimiento: recibir })
    .eq("id", userId);
  if (error) {
    console.error("[correos] No se pudo cambiar la preferencia de seguimiento:", error);
    return false;
  }
  return true;
}
