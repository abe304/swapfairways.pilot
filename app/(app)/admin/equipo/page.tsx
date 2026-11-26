import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import {
  cargarEquipo,
  estadoDelEquipo,
  metricasProducto,
  quien,
  registrosPorMes,
  resumenFinanzas,
  type EstadoMiembro,
} from "@/lib/equipo/datos";
import { CATEGORIAS_PIPELINE, ETAPAS, ROLES, fechaCorta, hoyMexico, lunesDe, pesos } from "@/lib/equipo/roles";
import { AvisoMigracion, EquipoNav } from "../../equipo/EquipoNav";
import { agregarMiembro, guardarMetas, quitarMiembro } from "./actions";
import { Agentes } from "./Agentes";
import { AGENTE_POR_ROL } from "@/lib/agentes/config";

export const metadata = { title: "Tablero del equipo · SwapFairways" };
// "Correr ahora" ejecuta un agente dentro de la acción del servidor.
export const maxDuration = 300;

const TONO = { verde: "success", amarillo: "warning", rojo: "danger" } as const;
const ICONO = { verde: "●", amarillo: "▲", rojo: "■" } as const;
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

function Kpi({ label, valor, nota }: { label: string; valor: string | number; nota?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-swf-verde/60">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-swf-verde">{valor}</div>
      {nota ? <div className="text-xs text-swf-verde/50">{nota}</div> : null}
    </Card>
  );
}

// Barra horizontal de magnitud (un solo tono). El número va en texto, no en color.
function Barra({ valor, max, titulo }: { valor: number; max: number; titulo: string }) {
  const w = max ? Math.max(valor ? 4 : 0, (valor / max) * 100) : 0;
  return (
    <div className="h-3 w-full rounded-sm bg-swf-verde/5" title={titulo}>
      <div className="h-3 rounded-r-[4px] bg-swf-dorado" style={{ width: `${w}%` }} />
    </div>
  );
}

export default async function TableroEquipoPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const [datos, m, regMes, perfiles] = await Promise.all([
    cargarEquipo(),
    metricasProducto(),
    registrosPorMes(),
    supabase.from("profiles").select("id, nombre").order("nombre"),
  ]);
  const fin = await resumenFinanzas(regMes);
  const estados = estadoDelEquipo(datos);
  const hoy = hoyMexico();
  const lunes = lunesDe(hoy);

  const vencidos = datos.compromisos.filter((c) => !c.hecho && c.fecha_limite < hoy);
  const pipelineAbierto = datos.pipeline.filter((p) => p.etapa !== "cerrado" && p.etapa !== "perdido");
  const pasosAtrasados = pipelineAbierto.filter((p) => p.proxima_fecha && p.proxima_fecha < hoy);
  const checkinsSemana = datos.checkins.filter((c) => c.semana === lunes);
  const bloqueos = checkinsSemana.filter((c) => c.bloqueos);
  const finMes = fin.meses[0];
  const embudo = [
    { label: "Registrados", valor: m.socios },
    { label: "Con club en su perfil", valor: m.conClub },
    { label: "Publicaron una oferta", valor: m.activados },
    { label: "Solicitaron una ronda", valor: m.solicitaron },
    { label: "Jugaron una ronda", valor: m.jugaron },
  ];
  const maxSerie = Math.max(1, ...m.serie.flatMap((s) => [s.registros, s.ofertas, s.solicitudes, s.jugadas]));

  // Estado por rol: cada puesto del organigrama, aunque esté vacante.
  const porRol = ROLES.map((r) => ({
    config: r,
    personas: estados.filter((e) => e.miembro.rol === r.rol),
  }));

  return (
    <div>
      <Link href="/admin" className="text-sm text-swf-verde/60 hover:text-swf-verde">
        ← Administración
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold text-swf-verde">Tablero del equipo</h1>
      <p className="mb-4 text-sm text-swf-verde/70">
        Producto en vivo desde la base y lo que cada rol registra en /equipo. Semana del {fechaCorta(lunes)}.
      </p>
      <EquipoNav actual="tablero" finanzas admin />
      {datos.error ? <AvisoMigracion /> : null}
      {m.error ? <p className="mb-4 text-sm text-red-700">No se pudieron leer los datos de uso ({m.error}).</p> : null}

      <Agentes actividades={datos.actividades} metas={datos.metas} />

      {/* ---------- Producto ---------- */}
      <h2 className="mb-2 font-semibold text-swf-verde">Cómo va la app</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Rondas jugadas (7 días)" valor={m.jugadas7} nota={`${m.jugadas30} en 30 días`} />
        <Kpi label="Socios registrados" valor={m.socios} nota={`+${m.nuevos7} esta semana · +${m.nuevos30} en 30 días`} />
        <Kpi label="Socios activos (30 días)" valor={m.activos30} nota={`${pct(m.activos30, m.socios)} del total`} />
        <Kpi label="Activación" valor={pct(m.activados, m.socios)} nota={`${m.activados} publicaron una oferta`} />
        <Kpi label="Ofertas publicadas (7 días)" valor={m.ofertas7} nota={`${m.ofertasAbiertas} abiertas hoy`} />
        <Kpi
          label="Solicitudes (7 días)"
          valor={m.solicitudes7}
          nota={`Aprobación ${m.tasaAprobacion === null ? "—" : `${Math.round(m.tasaAprobacion * 100)}%`}`}
        />
        <Kpi
          label="Solicitudes sin respuesta +72 h"
          valor={m.pendientesSinRespuesta}
          nota={m.pendientesSinRespuesta ? "Revisar con Operaciones" : "Al día"}
        />
        <Kpi label="Clubes con ofertas" valor={m.clubesConOfertas} nota={`${m.clubesConOfertas30} en 30 días`} />
        <Kpi label="Créditos en circulación" valor={m.creditosCirculacion} nota={`${m.creditosMovidos30} gastados en 30 días`} />
        <Kpi label="Lista de espera" valor={m.listaEsperaPendiente} nota="pendientes de invitar" />
        <Kpi label="Correos automáticos (7 días)" valor={m.correos7} />
        <Kpi
          label="Costo por registro (mes)"
          valor={finMes.registros && finMes.publicidad ? pesos(finMes.publicidad / finMes.registros) : "—"}
          nota={`${pesos(finMes.publicidad)} en publicidad · ${finMes.registros} registros`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-swf-verde">Embudo de socios</h3>
          <ul className="space-y-2">
            {embudo.map((e) => (
              <li key={e.label} className="grid grid-cols-[150px_1fr_70px] items-center gap-3 text-sm">
                <span className="text-swf-verde/80">{e.label}</span>
                <Barra valor={e.valor} max={m.socios} titulo={`${e.label}: ${e.valor}`} />
                <span className="text-right tabular-nums text-swf-verde">
                  {e.valor} <span className="text-xs text-swf-verde/50">{pct(e.valor, m.socios)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="overflow-x-auto">
          <h3 className="mb-3 font-semibold text-swf-verde">Últimas 8 semanas</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-swf-verde/60">
                <th className="py-1 pr-2 font-medium">Semana</th>
                <th className="py-1 pr-2 font-medium">Registros</th>
                <th className="py-1 pr-2 font-medium">Ofertas</th>
                <th className="py-1 pr-2 font-medium">Solicitudes</th>
                <th className="py-1 font-medium">Jugadas</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {m.serie.map((s) => (
                <tr key={s.lunes} className="border-t border-swf-verde/10">
                  <td className="py-1.5 pr-2 text-xs text-swf-verde/70">{fechaCorta(s.lunes)}</td>
                  {(["registros", "ofertas", "solicitudes", "jugadas"] as const).map((k) => (
                    <td key={k} className="py-1.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-right">{s[k]}</span>
                        <div className="w-14">
                          <Barra valor={s[k]} max={maxSerie} titulo={`${k} semana del ${fechaCorta(s.lunes)}: ${s[k]}`} />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* ---------- Equipo ---------- */}
      <h2 className="mb-2 mt-8 font-semibold text-swf-verde">Equipo: ¿quién va en meta?</h2>
      <p className="mb-3 text-xs text-swf-verde/60">
        ● en meta · ▲ atrasado o falta check-in · ■ sin actividad en 7 días o con varios pendientes. Check-ins de esta
        semana: {checkinsSemana.length} de {estados.length}.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {porRol.map(({ config, personas }) => (
          <Card key={config.rol} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-swf-verde">{config.titulo}</div>
                <div className="text-xs text-swf-verde/50">
                  Meta: {datos.metas[config.rol] ?? 0} actividades/semana · {config.cadencia}
                </div>
              </div>
            </div>
            {personas.length === 0 ? (
              (() => {
                const n = datos.actividades.filter((a) => a.agente === config.rol && a.fecha >= lunes).length;
                const meta = datos.metas[config.rol] ?? 0;
                return AGENTE_POR_ROL[config.rol] ? (
                  <div className="mt-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-swf-verde">Agente de IA</span>
                      <Badge tone={n >= meta ? "success" : n > 0 ? "warning" : "danger"}>
                        {n >= meta ? ICONO.verde : n > 0 ? ICONO.amarillo : ICONO.rojo} {n}/{meta} esta semana
                      </Badge>
                    </div>
                    <div className="mt-1">
                      <Barra valor={n} max={Math.max(meta, n, 1)} titulo={`${n} de ${meta}`} />
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-swf-verde/60">Tú das las directrices.</p>
                );
              })()
            ) : (
              <ul className="mt-2 space-y-2">
                {personas.map((e: EstadoMiembro) => (
                  <li key={e.miembro.profile_id} className="text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-swf-verde">{e.miembro.nombre}</span>
                      <Badge tone={TONO[e.semaforo]}>
                        {ICONO[e.semaforo]} {e.motivo}
                      </Badge>
                    </div>
                    <div className="mt-1 grid grid-cols-[1fr_auto] items-center gap-2">
                      <Barra valor={e.semana} max={Math.max(e.meta, e.semana, 1)} titulo={`${e.semana} de ${e.meta}`} />
                      <span className="text-xs tabular-nums text-swf-verde/60">
                        {e.semana}/{e.meta} · última {e.ultimaActividad ? fechaCorta(e.ultimaActividad) : "nunca"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="mb-2 font-semibold text-swf-verde">Compromisos vencidos ({vencidos.length})</h3>
          {vencidos.length === 0 ? (
            <p className="text-sm text-swf-verde/60">Ninguno.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {vencidos.slice(0, 12).map((c) => (
                <li key={c.id}>
                  <span className="text-red-700">{c.texto}</span>
                  <div className="text-xs text-swf-verde/50">
                    {quien(c, datos.nombres)} · venció {fechaCorta(c.fecha_limite)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="mb-2 font-semibold text-swf-verde">Bloqueos de esta semana ({bloqueos.length})</h3>
          {bloqueos.length === 0 ? (
            <p className="text-sm text-swf-verde/60">Nadie reportó bloqueos.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {bloqueos.map((c) => (
                <li key={c.id}>
                  <div className="text-xs font-medium text-swf-verde/70">{quien(c, datos.nombres)}</div>
                  <div className="whitespace-pre-line text-swf-verde">{c.bloqueos}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="mb-2 font-semibold text-swf-verde">Pipeline</h3>
          <ul className="space-y-1 text-sm">
            {ETAPAS.map((e) => (
              <li key={e.clave} className="flex justify-between">
                <span className="text-swf-verde/80">{e.label}</span>
                <span className="tabular-nums text-swf-verde">
                  {datos.pipeline.filter((p) => p.etapa === e.clave).length}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 text-xs text-swf-verde/60">
            Patrocinios cerrados:{" "}
            {pesos(
              datos.pipeline
                .filter((p) => p.etapa === "cerrado" && p.categoria === "patrocinio")
                .reduce((t, p) => t + Number(p.monto_estimado ?? 0), 0),
            )}
          </div>
          {pasosAtrasados.length ? (
            <div className="mt-3">
              <div className="text-xs font-medium text-red-700">Próximos pasos atrasados</div>
              <ul className="mt-1 space-y-1 text-xs">
                {pasosAtrasados.slice(0, 6).map((p) => (
                  <li key={p.id} className="text-swf-verde">
                    {p.nombre} ({CATEGORIAS_PIPELINE[p.categoria] ?? p.categoria}) · {quien(p, datos.nombres)} ·{" "}
                    {fechaCorta(p.proxima_fecha!)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="mt-4">
        <h3 className="mb-2 font-semibold text-swf-verde">Actividad reciente del equipo</h3>
        {datos.actividades.length === 0 ? (
          <p className="text-sm text-swf-verde/60">Todavía nadie registra actividades.</p>
        ) : (
          <ul className="divide-y divide-swf-verde/10">
            {datos.actividades.slice(0, 20).map((a) => (
              <li key={a.id} className="py-2 text-sm">
                <span className="text-swf-verde">{a.titulo}</span>
                {a.resultado ? <span className="text-swf-verde/70"> — {a.resultado}</span> : null}
                <div className="text-xs text-swf-verde/50">
                  {quien(a, datos.nombres)} · {fechaCorta(a.fecha)} · {a.tipo}
                  {a.enlace ? (
                    <>
                      {" · "}
                      <a href={a.enlace} target="_blank" rel="noopener noreferrer" className="underline">
                        enlace
                      </a>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ---------- Gestión ---------- */}
      <h2 className="mb-2 mt-8 font-semibold text-swf-verde">Gestión del equipo</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-2 font-semibold text-swf-verde">Miembros</h3>
          <p className="mb-3 text-xs text-swf-verde/60">
            Cada miembro necesita una cuenta en la app. Al agregarlo ve la liga <strong>Equipo</strong> en el menú.
          </p>
          <ul className="mb-4 divide-y divide-swf-verde/10">
            {datos.miembros
              .filter((mm) => mm.activo)
              .map((mm) => (
                <li key={mm.profile_id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-swf-verde">
                    {mm.nombre}{" "}
                    <span className="text-xs text-swf-verde/50">
                      · {mm.titulo || ROLES.find((r) => r.rol === mm.rol)?.titulo}
                    </span>
                  </span>
                  {mm.profile_id !== profile.id ? (
                    <form action={quitarMiembro}>
                      <input type="hidden" name="profile_id" value={mm.profile_id} />
                      <button type="submit" className="text-xs text-red-700 underline">
                        Quitar
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
          </ul>
          <form action={agregarMiembro} className="grid gap-2 sm:grid-cols-2">
            <Select name="profile_id" required defaultValue="" aria-label="Usuario">
              <option value="" disabled>
                Usuario…
              </option>
              {(perfiles.data ?? []).map((p) => (
                <option key={p.id as string} value={p.id as string}>
                  {p.nombre as string}
                </option>
              ))}
            </Select>
            <Select name="rol" required defaultValue="" aria-label="Rol">
              <option value="" disabled>
                Rol…
              </option>
              {ROLES.map((r) => (
                <option key={r.rol} value={r.rol}>
                  {r.titulo}
                </option>
              ))}
            </Select>
            <Input name="titulo" placeholder="Título (opcional)" aria-label="Título" />
            <button
              type="submit"
              className="rounded-md bg-swf-verde px-4 py-2 text-sm font-medium text-swf-crema hover:bg-swf-verde-claro"
            >
              Agregar o cambiar rol
            </button>
          </form>
        </Card>
        <Card>
          <h3 className="mb-2 font-semibold text-swf-verde">Metas semanales por rol</h3>
          <form action={guardarMetas} className="space-y-2">
            {ROLES.map((r) => (
              <label key={r.rol} className="flex items-center justify-between gap-3 text-sm text-swf-verde">
                <span>{r.titulo}</span>
                <Input
                  name={`meta_${r.rol}`}
                  type="number"
                  min={0}
                  max={200}
                  defaultValue={datos.metas[r.rol] ?? 0}
                  className="w-20 py-1 text-right"
                />
              </label>
            ))}
            <button
              type="submit"
              className="mt-2 rounded-md bg-swf-verde px-4 py-2 text-sm font-medium text-swf-crema hover:bg-swf-verde-claro"
            >
              Guardar metas
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
