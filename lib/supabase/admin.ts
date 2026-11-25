import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Cliente con la service role key: bypassa RLS. Uso exclusivo en scripts
// server-side de confianza (ej. scripts/seed.ts). Nunca importar desde
// código que corra en el navegador ni exponer SUPABASE_SERVICE_ROLE_KEY
// con el prefijo NEXT_PUBLIC_.
export function createAdminClient() {
  // trim(): si al pegar la clave en Vercel se cuela un salto de línea o un
  // espacio, fetch rechaza el encabezado ("invalid header value") y ningún
  // correo sale. Pasó en nov-2026.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
