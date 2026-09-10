import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { MOCK_MODE } from "@/lib/mock/is-mock";
import { createMockClient } from "@/lib/mock/client";

async function createRealClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // set() puede fallar si se llama desde un Server Component sin
            // response mutable (ej. durante el render). El proxy ya se
            // encarga de refrescar la sesión en ese caso.
          }
        },
      },
    },
  );
}

type RealClient = Awaited<ReturnType<typeof createRealClient>>;

export async function createClient(): Promise<RealClient> {
  if (MOCK_MODE) {
    // Modo demo sin Supabase real: ver lib/mock/*. El objeto expone el
    // mismo `.auth` / `.from` / `.rpc` que usa el resto de la app, así que
    // el cast es seguro en tiempo de ejecución aunque no comparta el tipo
    // generado exacto del cliente real.
    return (await createMockClient()) as unknown as RealClient;
  }
  return createRealClient();
}
