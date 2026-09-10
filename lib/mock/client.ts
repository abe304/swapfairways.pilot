import { cookies } from "next/headers";
import { store, uid, nowIso, applyCreditTx } from "./store";
import { mockFrom, type MockQueryBuilder } from "./query";
import { RPC_FUNCTIONS } from "./rpc";
import { MOCK_SESSION_COOKIE } from "./is-mock";
import type { MockTable } from "./store";

type SignUpArgs = {
  email: string;
  password: string;
  options?: { data?: { nombre?: string } };
};

// Expone la misma forma (auth/from/rpc) que el SupabaseClient real, pero
// respaldado por el store en memoria de lib/mock/store.ts. Solo se usa
// cuando MOCK_MODE está activo (ver lib/mock/is-mock.ts).
export async function createMockClient() {
  const cookieStore = await cookies();

  function currentUserId(): string | null {
    return cookieStore.get(MOCK_SESSION_COOKIE)?.value ?? null;
  }

  return {
    auth: {
      async getUser() {
        const id = currentUserId();
        const authUser = id ? store.authUsers.find((u) => u.id === id) : null;
        if (!authUser) return { data: { user: null }, error: null };
        return { data: { user: { id: authUser.id, email: authUser.email } }, error: null };
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const user = store.authUsers.find((u) => u.email === email && u.password === password);
        if (!user) return { error: { message: "Invalid login credentials" } };
        cookieStore.set(MOCK_SESSION_COOKIE, user.id, { path: "/" });
        return { error: null };
      },
      async signUp({ email, password, options }: SignUpArgs) {
        if (store.authUsers.some((u) => u.email === email)) {
          return { error: { message: "User already registered" } };
        }
        const id = uid("user");
        store.authUsers.push({ id, email, password });
        const nombre = options?.data?.nombre || email.split("@")[0];
        store.profiles.push({
          id,
          nombre,
          club_id: null,
          handicap_manual: null,
          foto_url: null,
          bio: null,
          creditos_balance: 0,
          is_admin: false,
          created_at: nowIso(),
        });
        applyCreditTx({
          id: uid("tx"),
          user_id: id,
          tipo: "bienvenida",
          monto: 3,
          referencia: null,
          nota: "Crédito de bienvenida al registrarte en SWF",
          created_at: nowIso(),
        });
        cookieStore.set(MOCK_SESSION_COOKIE, id, { path: "/" });
        return { error: null };
      },
      async signOut() {
        cookieStore.delete(MOCK_SESSION_COOKIE);
        return { error: null };
      },
    },
    from(table: MockTable): MockQueryBuilder {
      return mockFrom(table);
    },
    async rpc(name: string, args: Record<string, string>) {
      const id = currentUserId();
      if (!id) return { data: null, error: { message: "No autenticado" } };
      const fn = RPC_FUNCTIONS[name];
      if (!fn) return { data: null, error: { message: `RPC ${name} no implementada en modo demo` } };
      const result = fn(id, args);
      if (result.error) return { data: null, error: { message: result.error } };
      return { data: result.data, error: null };
    },
  };
}
