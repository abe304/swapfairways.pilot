import { cookies } from "next/headers";
import { store, uid, nowIso, applyCreditTx, generarCodigo } from "./store";
import { mockFrom, type MockQueryBuilder } from "./query";
import { mockRpc } from "./rpc";
import { MOCK_SESSION_COOKIE } from "./is-mock";
import type { MockTable } from "./store";

type SignUpArgs = {
  email: string;
  password: string;
  options?: { data?: { nombre?: string; codigo_invitacion?: string } };
};

// Enlaces de recuperación de contraseña del modo demo: token -> id de usuario.
// En globalThis porque el route handler /auth/confirm carga su propia copia
// de este módulo y debe ver los tokens creados desde la server action.
const g = globalThis as typeof globalThis & { __swfRecoveryTokens?: Map<string, string> };
const recoveryTokens = (g.__swfRecoveryTokens ??= new Map<string, string>());

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
        // Réplica de handle_new_user (0012): redime el código de invitación
        // y, si es obligatorio, bloquea el registro sin uno válido.
        const codigo = String(options?.data?.codigo_invitacion ?? "").trim().toUpperCase();
        const fila = codigo ? store.codigos_invitacion.find((c) => c.codigo === codigo) : undefined;
        const valido =
          !!fila &&
          !!fila.activo &&
          (fila.usos_maximos == null || (fila.usos as number) < (fila.usos_maximos as number));
        const requerido = store.app_settings.find((a) => a.key === "invite_required")?.value === "true";
        if (requerido && !valido) {
          return { error: { message: "Se requiere un código de invitación válido para registrarte" } };
        }
        if (valido && fila) fila.usos = (fila.usos as number) + 1;

        const id = uid("user");
        store.authUsers.push({ id, email, password });
        const nombre = options?.data?.nombre || email.split("@")[0];
        store.profiles.push({
          id,
          nombre,
          club_id: null,
          handicap_manual: null,
          foto_url: null,
          ghin_id: null,
          bio: null,
          creditos_balance: 0,
          is_admin: false,
          invitado_por: valido ? (fila!.owner_id ?? null) : null,
          codigo_usado: valido ? codigo : null,
          referido_pagado: false,
          created_at: nowIso(),
        });
        store.codigos_invitacion.push({
          codigo: generarCodigo(),
          tipo: "usuario",
          owner_id: id,
          etiqueta: null,
          email: null,
          usos: 0,
          usos_maximos: null,
          activo: true,
          creado_por: null,
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
      async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
        const user = store.authUsers.find((u) => u.email === email);
        if (user) {
          const token = uid("rec");
          recoveryTokens.set(token, user.id);
          const base = options?.redirectTo ?? "/auth/confirm?next=/restablecer";
          const sep = base.includes("?") ? "&" : "?";
          // En demo no se envían correos: el enlace se imprime en la consola del servidor.
          console.log(`[mock] Enlace para recuperar contraseña de ${email}: ${base}${sep}token_hash=${token}&type=recovery`);
        }
        return { data: {}, error: null };
      },
      async verifyOtp({ token_hash }: { type: string; token_hash: string }) {
        const userId = recoveryTokens.get(token_hash);
        if (!userId) return { data: {}, error: { message: "Token has expired or is invalid" } };
        recoveryTokens.delete(token_hash);
        cookieStore.set(MOCK_SESSION_COOKIE, userId, { path: "/" });
        return { data: {}, error: null };
      },
      async exchangeCodeForSession() {
        return { data: {}, error: { message: "No disponible en modo demo" } };
      },
      async updateUser({ password }: { password?: string }) {
        const user = store.authUsers.find((u) => u.id === currentUserId());
        if (!user) return { data: {}, error: { message: "Auth session missing", code: "session_not_found" } };
        if (password) {
          if (password === user.password) {
            return { data: {}, error: { message: "Same password", code: "same_password" } };
          }
          user.password = password;
        }
        return { data: {}, error: null };
      },
    },
    from(table: MockTable): MockQueryBuilder {
      return mockFrom(table);
    },
    async rpc(name: string, args: Record<string, string>) {
      return mockRpc(currentUserId(), name, args);
    },
  };
}
