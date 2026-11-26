import { Badge, Card } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { cargarEquipo, estadoDelEquipo, quien, requireEquipo } from "@/lib/equipo/datos";
import { ROL_POR_CLAVE, fechaCorta, hoyMexico, lunesDe, sumarDias } from "@/lib/equipo/roles";
import { AvisoMigracion, EquipoNav } from "./EquipoNav";
import { Formulario } from "./Formulario";
import { eliminarActividad, guardarCheckin, marcarCompromiso, registrarActividad } from "./actions";

export const metadata = { title: "Mi semana · Equipo SwapFairways" };

const TONO = { verde: "success", amarillo: "warning", rojo: "danger" } as const;

export default async function EquipoPage() {
  const acceso = await requireEquipo();
  const rol = acceso.rol ?? "direccion";
  const config = ROL_POR_CLAVE[rol];
  const datos = await cargarEquipo();
  const yo = acceso.profile.id;
  const hoy = hoyMexico();
  const lunes = lunesDe(hoy);

  const estado = estadoDelEquipo(datos).find((e) => e.miembro.profile_id === yo);
  const meta = datos.metas[rol] ?? 0;
  const semana = datos.actividades.filter((a) => a.autor_id === yo && a.fecha >= lunes).length;
  const misActividades = datos.actividades.filter((a) => a.autor_id === yo).slice(0, 15);
  const checkin = datos.checkins.find((c) => c.autor_id === yo && c.semana === lunes);
  const misCompromisos = datos.compromisos.filter((c) => c.autor_id === yo && !c.hecho);
  const delEquipo = datos.actividades.filter((a) => a.autor_id !== yo).slice(0, 12);
  const misPipeline = datos.pipeline.filter(
    (p) => p.responsable_id === yo && p.etapa !== "cerrado" && p.etapa !== "perdido",
  );
  const pct = meta ? Math.min(100, Math.round((semana / meta) * 100)) : 100;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-swf-verde">Equipo</h1>
      <p className="mb-4 text-sm text-swf-verde/70">
        {acceso.profile.nombre} · {acceso.miembro?.titulo || config.titulo}
      </p>
      <EquipoNav actual="semana" finanzas={acceso.esAdmin || rol === "finanzas"} admin={acceso.esAdmin} />
      {acceso.sinTablas || datos.error ? <AvisoMigracion /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-swf-verde">Tu semana (desde el lunes {fechaCorta(lunes)})</h2>
            {estado ? <Badge tone={TONO[estado.semaforo]}>{estado.motivo}</Badge> : null}
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-swf-verde">
            {semana} <span className="text-base font-normal text-swf-verde/60">de {meta} actividades</span>
          </p>
          <div className="mt-2 h-2 rounded-full bg-swf-verde/10">
            <div className="h-2 rounded-full bg-swf-dorado" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 text-sm text-swf-verde/70">{config.responsabilidad}</p>
          <p className="mt-1 text-xs text-swf-verde/50">
            KPIs: {config.kpis.join(" · ")} · Cadencia: {config.cadencia}
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold text-swf-verde">Check-in semanal</h2>
          {checkin ? (
            <p className="mt-2 text-sm text-green-800">Listo para esta semana. Puedes actualizarlo abajo.</p>
          ) : (
            <p className="mt-2 text-sm text-amber-800">
              Pendiente. Hazlo cada lunes: logros, bloqueos y compromisos. Si no, te llega un recordatorio.
            </p>
          )}
          <h3 className="mt-4 text-sm font-semibold text-swf-verde">Compromisos abiertos</h3>
          {misCompromisos.length === 0 ? (
            <p className="mt-1 text-sm text-swf-verde/60">Ninguno.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {misCompromisos.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2 text-sm">
                  <span className={c.fecha_limite < hoy ? "text-red-700" : "text-swf-verde"}>
                    {c.texto}{" "}
                    <span className="text-xs text-swf-verde/50">· {fechaCorta(c.fecha_limite)}</span>
                  </span>
                  <form action={marcarCompromiso}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="hecho" value="true" />
                    <button className="text-xs text-swf-verde underline" type="submit">
                      Hecho
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-swf-verde">Registrar actividad</h2>
          <Formulario action={registrarActividad} boton="Registrar">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Tipo" htmlFor="tipo">
                <Select id="tipo" name="tipo" required defaultValue="">
                  <option value="" disabled>
                    Elige…
                  </option>
                  {config.tiposActividad.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Fecha" htmlFor="fecha">
                <Input id="fecha" name="fecha" type="date" defaultValue={hoy} max={hoy} min={sumarDias(hoy, -30)} />
              </FormField>
            </div>
            <FormField label="Qué hiciste" htmlFor="titulo">
              <Input id="titulo" name="titulo" required placeholder="Ej. Reunión con el gerente del Club Campestre" />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Con quién (opcional)" htmlFor="contraparte">
                <Input id="contraparte" name="contraparte" placeholder="Persona, club, cuenta…" />
              </FormField>
              <FormField label="Enlace (opcional)" htmlFor="enlace">
                <Input id="enlace" name="enlace" type="url" placeholder="https://" />
              </FormField>
            </div>
            {misPipeline.length ? (
              <FormField label="Del pipeline (opcional)" htmlFor="pipeline_id">
                <Select id="pipeline_id" name="pipeline_id" defaultValue="">
                  <option value="">—</option>
                  {misPipeline.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
            <FormField label="Resultado (opcional)" htmlFor="resultado">
              <Textarea id="resultado" name="resultado" rows={2} placeholder="Qué se logró o qué sigue" />
            </FormField>
          </Formulario>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-swf-verde">
            {checkin ? "Actualizar check-in" : "Check-in de la semana"}
          </h2>
          <Formulario action={guardarCheckin} boton="Guardar check-in">
            <FormField label="Logros de la semana pasada" htmlFor="logros">
              <Textarea id="logros" name="logros" defaultValue={checkin?.logros ?? ""} />
            </FormField>
            <FormField label="Bloqueos (qué necesitas del equipo o de Abraham)" htmlFor="bloqueos">
              <Textarea id="bloqueos" name="bloqueos" rows={2} defaultValue={checkin?.bloqueos ?? ""} />
            </FormField>
            <FormField label="Plan de esta semana" htmlFor="plan">
              <Textarea id="plan" name="plan" rows={2} defaultValue={checkin?.plan ?? ""} />
            </FormField>
            <div>
              <p className="mb-1 text-sm font-medium text-swf-verde">Compromisos nuevos (con fecha)</p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="mb-2 grid grid-cols-[1fr_auto] gap-2">
                  <Input name={`compromiso_${i}`} placeholder={`Compromiso ${i + 1}`} aria-label={`Compromiso ${i + 1}`} />
                  <Input
                    name={`fecha_${i}`}
                    type="date"
                    min={hoy}
                    defaultValue={sumarDias(lunes, 4)}
                    aria-label={`Fecha límite del compromiso ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          </Formulario>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-swf-verde">Tus actividades recientes</h2>
          {misActividades.length === 0 ? (
            <p className="text-sm text-swf-verde/60">Todavía no registras actividades.</p>
          ) : (
            <ul className="divide-y divide-swf-verde/10">
              {misActividades.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="text-swf-verde">{a.titulo}</div>
                    <div className="text-xs text-swf-verde/50">
                      {fechaCorta(a.fecha)} · {a.tipo}
                      {a.contraparte ? ` · ${a.contraparte}` : ""}
                    </div>
                  </div>
                  <form action={eliminarActividad}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-swf-verde/50 hover:text-red-700" type="submit">
                      Borrar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-swf-verde">Lo que está haciendo el equipo</h2>
          {delEquipo.length === 0 ? (
            <p className="text-sm text-swf-verde/60">Sin actividad reciente de otros miembros.</p>
          ) : (
            <ul className="divide-y divide-swf-verde/10">
              {delEquipo.map((a) => (
                <li key={a.id} className="py-2 text-sm">
                  <div className="text-swf-verde">{a.titulo}</div>
                  <div className="text-xs text-swf-verde/50">
                    {quien(a, datos.nombres)} · {fechaCorta(a.fecha)} · {a.tipo}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
