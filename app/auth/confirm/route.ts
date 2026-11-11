import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Destino de los enlaces que manda Supabase por correo (recuperar contraseña).
// Acepta los dos formatos: ?token_hash=&type= (plantilla personalizada, sirve
// aunque abran el correo en otro dispositivo) y ?code= (plantilla por defecto).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/restablecer";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/restablecer";

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
    if (error) console.error("[auth/confirm] verifyOtp:", error.message);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    if (error) console.error("[auth/confirm] exchangeCodeForSession:", error.message);
  }

  return NextResponse.redirect(new URL(ok ? next : "/recuperar?error=enlace", origin));
}
