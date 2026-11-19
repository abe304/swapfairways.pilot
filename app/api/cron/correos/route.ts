import { NextResponse, type NextRequest } from "next/server";
import { MOCK_MODE } from "@/lib/mock/is-mock";
import { getSiteUrl } from "@/lib/site";
import { revisionDiaria } from "@/lib/correos/enviar";

// Revisión diaria de correos (T4, T7 y T8). La llama Vercel Cron todos los
// días a las 8:00 am de CDMX (ver vercel.json) con el encabezado
// "Authorization: Bearer <CRON_SECRET>". Sin ese secreto no hace nada.
// En modo demo se puede abrir directo en el navegador para probar.
export async function GET(request: NextRequest) {
  if (!MOCK_MODE) {
    const secreto = process.env.CRON_SECRET;
    if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const resultado = await revisionDiaria(await getSiteUrl());
    console.log("[cron/correos]", JSON.stringify(resultado));
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[cron/correos] Falló la revisión diaria:", err);
    return NextResponse.json({ error: "Falló la revisión diaria" }, { status: 500 });
  }
}
