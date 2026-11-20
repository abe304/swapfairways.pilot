import { NextResponse, type NextRequest } from "next/server";
import { cambiarSeguimiento, firmaValida } from "@/lib/correos/baja";

// Baja con un clic desde el botón "Cancelar suscripción" de Gmail/Apple Mail
// (encabezados List-Unsubscribe y List-Unsubscribe-Post, RFC 8058). Solo
// acepta POST; el enlace visible del correo lleva a /correos/baja.
export async function POST(request: NextRequest) {
  const u = request.nextUrl.searchParams.get("u") ?? undefined;
  const t = request.nextUrl.searchParams.get("t") ?? undefined;
  if (!firmaValida(u, t)) return NextResponse.json({ error: "Enlace no válido" }, { status: 400 });
  const ok = await cambiarSeguimiento(u!, false);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
}
