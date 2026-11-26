import { NextResponse, type NextRequest } from "next/server";
import { correrAgentesDelDia } from "@/lib/agentes/correr";

// Corre los agentes de IA a los que hoy les toca (ver lib/agentes/config.ts).
// La llama Vercel Cron a las 9:00 am de CDMX (vercel.json) con
// "Authorization: Bearer <CRON_SECRET>", igual que /api/cron/correos.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const resultado = await correrAgentesDelDia();
  console.log("[cron/agentes]", JSON.stringify(resultado));
  return NextResponse.json(resultado);
}
