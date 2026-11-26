import { Badge, Card } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { cargarEquipo, quien, requireEquipo } from "@/lib/equipo/datos";
import { CATEGORIAS_PIPELINE, ETAPAS, fechaCorta, hoyMexico, pesos } from "@/lib/equipo/roles";
import { AvisoMigracion, EquipoNav } from "../EquipoNav";
import { Formulario } from "../Formulario";
import { actualizarPipeline, crearPipeline } from "../actions";

export const metadata = { title: "Pipeline · Equipo SwapFairways" };

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; todos?: string }>;
}) {
  const acceso = await requireEquipo();
  const { categoria, todos } = await searchParams;
  const datos = await cargarEquipo();
  const hoy = hoyMexico();
  const verCerrados = todos === "1";

  const filas = datos.pipeline.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (verCerrados || (p.etapa !== "cerrado" && p.etapa !== "perdido")),
  );
  const conteo = Object.fromEntries(ETAPAS.map((e) => [e.clave, 0]));
  for (const p of datos.pipeline.filter((p) => !categoria || p.categoria === categoria)) conteo[p.etapa] += 1;

  const filtro = (c?: string, t?: boolean) => {
    const q = new URLSearchParams();
    if (c) q.set("categoria", c);
    if (t) q.set("todos", "1");
    const s = q.toString();
    return s ? `/equipo/pipeline?${s}` : "/equipo/pipeline";
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-swf-verde">Equipo</h1>
      <p className="mb-4 text-sm text-swf-verde/70">
        Clubes, Federación, grupos regionales, medios, patrocinios, alianzas y leads. Mover la etapa cuenta como
        actividad.
      </p>
      <EquipoNav
        actual="pipeline"
        finanzas={acceso.esAdmin || acceso.rol === "finanzas"}
        admin={acceso.esAdmin}
      />
      {acceso.sinTablas || datos.error ? <AvisoMigracion /> : null}

      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ETAPAS.map((e) => (
          <div key={e.clave} className="rounded-md border border-swf-verde/10 bg-white p-3 text-center">
            <div className="text-xl font-semibold tabular-nums text-swf-verde">{conteo[e.clave]}</div>
            <div className="text-xs text-swf-verde/60">{e.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <a href={filtro(undefined, verCerrados)} className={!categoria ? "font-semibold underline" : "underline"}>
          Todas
        </a>
        {Object.entries(CATEGORIAS_PIPELINE).map(([clave, label]) => (
          <a
            key={clave}
            href={filtro(clave, verCerrados)}
            className={categoria === clave ? "font-semibold text-swf-verde underline" : "text-swf-verde/70 underline"}
          >
            {label}
          </a>
        ))}
        <span className="text-swf-verde/30">|</span>
        <a href={filtro(categoria, !verCerrados)} className="text-swf-verde/70 underline">
          {verCerrados ? "Ocultar cerrados y perdidos" : "Ver cerrados y perdidos"}
        </a>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-x-auto">
          {filas.length === 0 ? (
            <p className="text-sm text-swf-verde/60">No hay registros con este filtro.</p>
          ) : (
            <ul className="divide-y divide-swf-verde/10">
              {filas.map((p) => {
                const atrasado = p.proxima_fecha && p.proxima_fecha < hoy && p.etapa !== "cerrado" && p.etapa !== "perdido";
                return (
                  <li key={p.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-swf-verde">{p.nombre}</span>
                      <Badge>{CATEGORIAS_PIPELINE[p.categoria] ?? p.categoria}</Badge>
                      {p.monto_estimado ? <Badge tone="gold">{pesos(Number(p.monto_estimado))}</Badge> : null}
                      {atrasado ? <Badge tone="danger">Próximo paso atrasado</Badge> : null}
                    </div>
                    <div className="mt-0.5 text-xs text-swf-verde/50">
                      {quien(p, datos.nombres)}
                      {p.contacto ? ` · ${p.contacto}` : ""}
                      {p.notas ? ` · ${p.notas}` : ""}
                    </div>
                    <form action={actualizarPipeline} className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <Select name="etapa" defaultValue={p.etapa} className="w-auto py-1" aria-label="Etapa">
                        {ETAPAS.map((e) => (
                          <option key={e.clave} value={e.clave}>
                            {e.label}
                          </option>
                        ))}
                      </Select>
                      <Input
                        name="proximo_paso"
                        defaultValue={p.proximo_paso ?? ""}
                        placeholder="Próximo paso"
                        className="w-48 flex-1 py-1"
                        aria-label="Próximo paso"
                      />
                      <Input
                        name="proxima_fecha"
                        type="date"
                        defaultValue={p.proxima_fecha ?? ""}
                        className="w-auto py-1"
                        aria-label="Fecha del próximo paso"
                      />
                      <button type="submit" className="text-xs text-swf-verde underline">
                        Guardar
                      </button>
                    </form>
                    {p.proxima_fecha ? (
                      <div className="mt-1 text-xs text-swf-verde/50">Próximo paso: {fechaCorta(p.proxima_fecha)}</div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-swf-verde">Agregar al pipeline</h2>
          <Formulario action={crearPipeline} boton="Agregar">
            <FormField label="Categoría" htmlFor="categoria">
              <Select id="categoria" name="categoria" required defaultValue={categoria ?? ""}>
                <option value="" disabled>
                  Elige…
                </option>
                {Object.entries(CATEGORIAS_PIPELINE).map(([clave, label]) => (
                  <option key={clave} value={clave}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Nombre" htmlFor="nombre">
              <Input id="nombre" name="nombre" required placeholder="Ej. Club de Golf Chapultepec" />
            </FormField>
            <FormField label="Contacto" htmlFor="contacto">
              <Input id="contacto" name="contacto" placeholder="Persona, cargo, @cuenta" />
            </FormField>
            <FormField label="Etapa" htmlFor="etapa">
              <Select id="etapa" name="etapa" defaultValue="identificado">
                {ETAPAS.map((e) => (
                  <option key={e.clave} value={e.clave}>
                    {e.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Monto estimado (MXN, opcional)" htmlFor="monto_estimado">
              <Input id="monto_estimado" name="monto_estimado" inputMode="decimal" />
            </FormField>
            <FormField label="Próximo paso" htmlFor="proximo_paso">
              <Input id="proximo_paso" name="proximo_paso" />
            </FormField>
            <FormField label="Fecha del próximo paso" htmlFor="proxima_fecha">
              <Input id="proxima_fecha" name="proxima_fecha" type="date" min={hoy} />
            </FormField>
            <FormField label="Notas" htmlFor="notas">
              <Textarea id="notas" name="notas" rows={2} />
            </FormField>
          </Formulario>
        </Card>
      </div>
    </div>
  );
}
