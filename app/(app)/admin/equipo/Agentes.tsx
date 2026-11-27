import { Badge, Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { CopyButton } from "@/components/CopyButton";
import { createClient } from "@/lib/supabase/server";
import type { AgenteAccion, AgenteCorrida, EquipoActividad, EquipoDirectriz } from "@/lib/supabase/types";
import { AGENTES, ETIQUETA_ACCION, MODELO_AGENTES } from "@/lib/agentes/config";
import { iaDisponible } from "@/lib/agentes/correr";
import { ROL_POR_CLAVE, fechaCorta, lunesDe, pesos } from "@/lib/equipo/roles";
import { archivarDirectriz, decidirAccion, guardarDirectriz, marcarAccionHecha } from "./actions";
import { BotonCorrer } from "./BotonCorrer";

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const nombreAgente = (rol: string) => AGENTES.find((a) => a.rol === rol)?.nombre ?? rol;
const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  });

function enlaceWhatsApp(destinatario: string | null, texto: string) {
  const digitos = (destinatario ?? "").replace(/\D/g, "");
  const tel = digitos.length === 10 ? `52${digitos}` : digitos.length >= 11 ? digitos : "";
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
}

export async function Agentes({
  actividades,
  metas,
}: {
  actividades: EquipoActividad[];
  metas: Record<string, number>;
}) {
  const supabase = await createClient();
  const [dirs, corridas, acciones] = await Promise.all([
    supabase.from("equipo_directrices").select("*").eq("activa", true).order("created_at", { ascending: false }),
    supabase.from("agente_corridas").select("*").order("inicio", { ascending: false }).limit(60),
    supabase.from("agente_acciones").select("*").order("created_at", { ascending: false }).limit(80),
  ]);

  if (dirs.error) {
    return (
      <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Para activar los agentes de IA corre la migración <code>0027_agentes.sql</code> en el SQL Editor de Supabase.
      </div>
    );
  }

  const directrices = (dirs.data ?? []) as EquipoDirectriz[];
  const listaCorridas = (corridas.data ?? []) as AgenteCorrida[];
  const listaAcciones = (acciones.data ?? []) as AgenteAccion[];
  const pendientes = listaAcciones.filter((a) => a.estado === "pendiente");
  const porMandar = listaAcciones.filter((a) => a.estado === "aprobada");
  const decididas = listaAcciones.filter((a) => !["pendiente", "aprobada"].includes(a.estado)).slice(0, 10);
  const disponible = iaDisponible();
  const lunes = lunesDe();
  // Agentes cuya última corrida falló, para avisar arriba y no solo en su tarjeta.
  const fallidos = AGENTES.map((a) => listaCorridas.find((c) => c.rol === a.rol)).filter(
    (c): c is AgenteCorrida => !!c && c.estado === "error",
  );
  const sinCredito = fallidos.some((c) => /free tier|credits|top-up/i.test(c.error ?? ""));

  return (
    <section className="mb-8">
      <h2 className="mb-1 font-semibold text-swf-verde">Agentes de IA</h2>
      <p className="mb-3 text-sm text-swf-verde/70">
        Cada rol lo ejecuta un agente ({MODELO_AGENTES}) en su cadencia. Trabajan solos con los datos reales y tus
        directrices; lo que sale hacia afuera espera tu aprobación aquí.
      </p>
      {!disponible ? (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          En este entorno no hay acceso a la IA. En Vercel activa <strong>AI Gateway</strong> en el proyecto (usa la
          autenticación OIDC automática) o agrega la variable <code>AI_GATEWAY_API_KEY</code>.
        </div>
      ) : null}

      {fallidos.length ? (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <strong>
            {fallidos.length === 1 ? "La última corrida de un agente falló" : `Las últimas corridas de ${fallidos.length} agentes fallaron`}
            .
          </strong>{" "}
          {sinCredito
            ? `El plan gratis de AI Gateway no incluye el modelo ${MODELO_AGENTES}. Agrega crédito de pago en Vercel → AI Gateway, o cambia el modelo de los agentes.`
            : `Motivo: ${(fallidos[0].error ?? "").slice(0, 300)}`}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* ---------- Directrices ---------- */}
        <Card>
          <h3 className="mb-2 font-semibold text-swf-verde">Tus directrices</h3>
          <p className="mb-3 text-xs text-swf-verde/60">
            Lo que escribas aquí lo leen los agentes en cada corrida y tiene prioridad sobre su misión.
          </p>
          <form action={guardarDirectriz} className="mb-4 space-y-2">
            <Select name="rol" defaultValue="" aria-label="Para quién">
              <option value="">Para todos los agentes</option>
              {AGENTES.map((a) => (
                <option key={a.rol} value={a.rol}>
                  Solo {a.nombre}
                </option>
              ))}
            </Select>
            <Textarea
              name="texto"
              required
              rows={3}
              placeholder="Ej. Este mes la prioridad es Guadalajara: clubes con socios y la asociación de golf de Jalisco."
              aria-label="Directriz"
            />
            <button
              type="submit"
              className="rounded-md bg-swf-verde px-4 py-2 text-sm font-medium text-swf-crema hover:bg-swf-verde-claro"
            >
              Agregar directriz
            </button>
          </form>
          {directrices.length === 0 ? (
            <p className="text-sm text-swf-verde/60">Sin directrices: trabajan según su misión.</p>
          ) : (
            <ul className="divide-y divide-swf-verde/10">
              {directrices.map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <div>
                    <Badge tone={d.rol ? "default" : "gold"}>{d.rol ? nombreAgente(d.rol) : "Todos"}</Badge>
                    <p className="mt-1 whitespace-pre-line text-swf-verde">{d.texto}</p>
                  </div>
                  <form action={archivarDirectriz}>
                    <input type="hidden" name="id" value={d.id} />
                    <button type="submit" className="text-xs text-swf-verde/50 hover:text-red-700">
                      Archivar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ---------- Cola de aprobación ---------- */}
        <Card>
          <h3 className="mb-2 font-semibold text-swf-verde">Por aprobar ({pendientes.length})</h3>
          {pendientes.length === 0 ? (
            <p className="text-sm text-swf-verde/60">Nada pendiente.</p>
          ) : (
            <ul className="space-y-4">
              {pendientes.map((a) => (
                <li key={a.id} className="rounded-md border border-swf-verde/10 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <Badge tone="gold">{ETIQUETA_ACCION[a.tipo]}</Badge>
                    <span className="text-swf-verde/60">
                      {nombreAgente(a.rol)} · {fechaHora(a.created_at)}
                    </span>
                    {a.monto ? <Badge>{pesos(Number(a.monto))}</Badge> : null}
                  </div>
                  {a.justificacion ? <p className="mb-2 text-xs text-swf-verde/70">Por qué: {a.justificacion}</p> : null}
                  <form action={decidirAccion} className="space-y-2">
                    <input type="hidden" name="id" value={a.id} />
                    {a.user_id ? (
                      <p className="text-xs text-swf-verde/60">Para un socio de la app (su correo se busca al enviar).</p>
                    ) : (
                      <Input name="destinatario" defaultValue={a.destinatario ?? ""} placeholder="Destinatario" aria-label="Destinatario" />
                    )}
                    {a.tipo === "correo" ? (
                      <Input name="asunto" defaultValue={a.asunto ?? ""} placeholder="Asunto" aria-label="Asunto" />
                    ) : null}
                    <Textarea name="cuerpo" defaultValue={a.cuerpo} rows={6} aria-label="Texto" />
                    <Input name="comentario" placeholder="Comentario para el agente (opcional)" aria-label="Comentario" />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        name="decision"
                        value="aprobar"
                        className="rounded-md bg-swf-verde px-3 py-1.5 text-sm font-medium text-swf-crema hover:bg-swf-verde-claro"
                      >
                        {a.tipo === "correo" ? "Aprobar y enviar" : "Aprobar"}
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="rechazar"
                        className="rounded-md border border-red-700/40 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {porMandar.length ? (
            <div className="mt-5">
              <h4 className="mb-2 text-sm font-semibold text-swf-verde">Aprobadas: mándalas tú ({porMandar.length})</h4>
              <ul className="space-y-3">
                {porMandar.map((a) => (
                  <li key={a.id} className="rounded-md bg-swf-crema p-3 text-sm">
                    <div className="text-xs text-swf-verde/60">
                      {ETIQUETA_ACCION[a.tipo]} · {a.destinatario ?? "—"} · {nombreAgente(a.rol)}
                    </div>
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-swf-verde">{a.cuerpo}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CopyButton texto={a.cuerpo} etiqueta="Copiar texto" />
                      {a.tipo === "whatsapp" ? (
                        <a
                          href={enlaceWhatsApp(a.destinatario, a.cuerpo)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md border border-swf-verde/30 px-3 py-1.5 text-sm text-swf-verde hover:bg-swf-verde/5"
                        >
                          Abrir WhatsApp
                        </a>
                      ) : null}
                      <form action={marcarAccionHecha}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="text-xs text-swf-verde underline">
                          Marcar como hecha
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {decididas.length ? (
            <details className="mt-5">
              <summary className="cursor-pointer text-sm font-semibold text-swf-verde">Historial</summary>
              <ul className="mt-2 space-y-1 text-xs">
                {decididas.map((a) => (
                  <li key={a.id} className="text-swf-verde/70">
                    {fechaCorta(a.created_at)} · {ETIQUETA_ACCION[a.tipo]} · {a.destinatario ?? "socio"} ·{" "}
                    <span className={a.estado === "fallida" || a.estado === "rechazada" ? "text-red-700" : "text-green-800"}>
                      {a.estado}
                    </span>
                    {a.resultado ? ` — ${a.resultado}` : ""}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </Card>
      </div>

      {/* ---------- Un tablero por agente ---------- */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {AGENTES.map((ag) => {
          const ultima = listaCorridas.find((c) => c.rol === ag.rol);
          const ultimaOk = listaCorridas.find((c) => c.rol === ag.rol && c.estado === "ok");
          const semana = actividades.filter((a) => a.agente === ag.rol && a.fecha >= lunes).length;
          const meta = metas[ag.rol] ?? 0;
          const enCola = pendientes.filter((a) => a.rol === ag.rol).length;
          const tono = !ultima ? "default" : ultima.estado === "error" ? "danger" : semana >= meta ? "success" : "warning";
          return (
            <Card key={ag.rol} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-swf-verde">{ag.nombre}</div>
                  <div className="text-xs text-swf-verde/50">
                    {ROL_POR_CLAVE[ag.rol].titulo} · corre {ag.dias.map((d) => DIAS_CORTOS[d]).join(", ")} 9:00
                  </div>
                </div>
                <Badge tone={tono}>
                  {semana}/{meta} esta semana{enCola ? ` · ${enCola} por aprobar` : ""}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-swf-verde/60">
                {ultima ? (
                  <>
                    Última corrida: {fechaHora(ultima.inicio)} ·{" "}
                    <span className={ultima.estado === "error" ? "text-red-700" : ""}>{ultima.estado}</span>
                    {ultima.tokens_entrada ? ` · ${ultima.tokens_entrada + (ultima.tokens_salida ?? 0)} tokens` : ""}
                    {ultima.error ? <div className="mt-1 text-red-700">{ultima.error.slice(0, 200)}</div> : null}
                  </>
                ) : (
                  "Todavía no ha corrido."
                )}
              </div>
              {ultimaOk?.reporte ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-swf-verde">Último reporte</summary>
                  <div className="mt-2 max-h-80 overflow-y-auto whitespace-pre-line rounded-md bg-swf-crema p-3 text-sm text-swf-verde">
                    {ultimaOk.reporte.replace(/\*\*/g, "")}
                  </div>
                </details>
              ) : null}
              <div className="mt-3">
                <BotonCorrer rol={ag.rol} disponible={disponible} />
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
