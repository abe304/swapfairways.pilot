// Modo demo: se activa automáticamente cuando no hay un proyecto Supabase
// real configurado (variable ausente o con el valor placeholder que deja
// el proyecto recién escafoldado). Nunca se activa contra un backend real.
export const MOCK_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export const MOCK_LOGIN_EMAIL = "test@test.com";
export const MOCK_LOGIN_PASSWORD = "testtest";
export const MOCK_SESSION_COOKIE = "swf_mock_uid";
