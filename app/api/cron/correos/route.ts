import { NextResponse, type NextRequest } from "next/server";
import { MOCK_MODE } from "@/lib/mock/is-mock";
import { getSiteUrl } from "@/lib/site";
import { revisionDiaria } from "@/lib/correos/enviar";
import { revisionEquipo } from "@/lib/equipo/correos";

// Revisión diaria de correos (T4, T7, T8, S0–S3 y los del equipo E1–E3). La llama Vercel Cron todos los
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
    const sitio = await getSiteUrl();
    const resultado = await revisionDiaria(sitio);
    // Correos internos del equipo (E1–E3). Si fallan no afectan a los de socios.
    let equipo: unknown;
    try {
      equipo = await revisionEquipo(sitio);
    } catch (err) {
      console.error("[cron/correos] Falló la revisión del equipo:", err);
      equipo = { error: "Falló la revisión del equipo" };
    }
    console.log("[cron/correos]", JSON.stringify({ ...resultado, equipo }));
    return NextResponse.json({ ...resultado, equipo });
  } catch (err) {
    console.error("[cron/correos] Falló la revisión diaria:", err);
    return NextResponse.json({ error: "Falló la revisión diaria" }, { status: 500 });
  }
}
