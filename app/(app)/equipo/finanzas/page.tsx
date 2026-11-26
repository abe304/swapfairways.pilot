import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/Field";
import { registrosPorMes, requireEquipo, resumenFinanzas } from "@/lib/equipo/datos";
import {
  CATEGORIAS_GASTO,
  CATEGORIAS_INGRESO,
  ETIQUETA_CATEGORIA_FIN,
  fechaCorta,
  hoyMexico,
  pesos,
} from "@/lib/equipo/roles";
import { AvisoMigracion, EquipoNav } from "../EquipoNav";
import { Formulario } from "../Formulario";
import { eliminarMovimiento, registrarMovimiento } from "../actions";

export const metadata = { title: "Finanzas · Equipo SwapFairways" };

const nombreMes = (mes: string) =>
  new Date(`${mes}-01T12:00:00Z`).toLocaleDateString("es-MX", { month: "short", year: "numeric", timeZone: "UTC" });

export default async function FinanzasPage() {
  const acceso = await requireEquipo();
  if (!acceso.esAdmin && acceso.rol !== "finanzas") redirect("/equipo");
  const fin = await resumenFinanzas(await registrosPorMes());
  const actual = fin.meses[0];
  const cpr = actual.registros ? actual.publicidad / actual.registros : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-swf-verde">Equipo</h1>
      <p className="mb-4 text-sm text-swf-verde/70">
        Ingresos y gastos. El P&amp;L y el costo por registro se calculan solos con los registros reales de la app.
      </p>
      <EquipoNav actual="finanzas" finanzas admin={acceso.esAdmin} />
      {fin.error ? <AvisoMigracion /> : null}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Ingresos del mes", valor: pesos(actual.ingresos) },
          { label: "Gastos del mes", valor: pesos(actual.gastos) },
          { label: "Resultado del mes", valor: pesos(actual.ingresos - actual.gastos) },
          { label: "Costo por registro", valor: cpr === null ? "—" : pesos(cpr), nota: `${actual.registros} registros` },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-xs text-swf-verde/60">{k.label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-swf-verde">{k.valor}</div>
            {k.nota ? <div className="text-xs text-swf-verde/50">{k.nota}</div> : null}
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="overflow-x-auto">
            <h2 className="mb-3 font-semibold text-swf-verde">P&amp;L de los últimos 6 meses</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-swf-verde/60">
                  <th className="py-1 pr-3 font-medium">Mes</th>
                  <th className="py-1 pr-3 text-right font-medium">Ingresos</th>
                  <th className="py-1 pr-3 text-right font-medium">Gastos</th>
                  <th className="py-1 pr-3 text-right font-medium">Resultado</th>
                  <th className="py-1 pr-3 text-right font-medium">Publicidad</th>
                  <th className="py-1 text-right font-medium">Costo/registro</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {fin.meses.map((m) => {
                  const res = m.ingresos - m.gastos;
                  return (
                    <tr key={m.mes} className="border-t border-swf-verde/10">
                      <td className="py-1.5 pr-3 capitalize">{nombreMes(m.mes)}</td>
                      <td className="py-1.5 pr-3 text-right">{pesos(m.ingresos)}</td>
                      <td className="py-1.5 pr-3 text-right">{pesos(m.gastos)}</td>
                      <td className={`py-1.5 pr-3 text-right ${res < 0 ? "text-red-700" : ""}`}>{pesos(res)}</td>
                      <td className="py-1.5 pr-3 text-right">{pesos(m.publicidad)}</td>
                      <td className="py-1.5 text-right">
                        {m.registros ? pesos(m.publicidad / m.registros) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-swf-verde">Movimientos</h2>
            {fin.movimientos.length === 0 ? (
              <p className="text-sm text-swf-verde/60">Sin movimientos registrados.</p>
            ) : (
              <ul className="divide-y divide-swf-verde/10">
                {fin.movimientos.slice(0, 50).map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="text-swf-verde">{m.concepto}</div>
                      <div className="text-xs text-swf-verde/50">
                        {fechaCorta(m.fecha)} · {ETIQUETA_CATEGORIA_FIN[m.categoria] ?? m.categoria}
                        {m.canal ? ` · ${m.canal}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`tabular-nums ${m.tipo === "ingreso" ? "text-green-800" : "text-swf-verde"}`}>
                        {m.tipo === "ingreso" ? "+" : "−"}
                        {pesos(m.monto)}
                      </span>
                      <form action={eliminarMovimiento}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="text-xs text-swf-verde/50 hover:text-red-700" type="submit">
                          Borrar
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card>
          <h2 className="mb-3 font-semibold text-swf-verde">Registrar movimiento</h2>
          <Formulario action={registrarMovimiento} boton="Registrar">
            <FormField label="Tipo" htmlFor="tipo">
              <Select id="tipo" name="tipo" defaultValue="gasto">
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </Select>
            </FormField>
            <FormField label="Categoría" htmlFor="categoria">
              <Select id="categoria" name="categoria" required defaultValue="">
                <option value="" disabled>
                  Elige…
                </option>
                <optgroup label="Gastos">
                  {CATEGORIAS_GASTO.map((c) => (
                    <option key={`g-${c}`} value={c}>
                      {ETIQUETA_CATEGORIA_FIN[c]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Ingresos">
                  {CATEGORIAS_INGRESO.filter((c) => c !== "otros").map((c) => (
                    <option key={`i-${c}`} value={c}>
                      {ETIQUETA_CATEGORIA_FIN[c]}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </FormField>
            <FormField label="Concepto" htmlFor="concepto">
              <Input id="concepto" name="concepto" required placeholder="Ej. Anuncios Instagram noviembre" />
            </FormField>
            <FormField label="Canal (opcional)" htmlFor="canal">
              <Input id="canal" name="canal" placeholder="Meta, Google, Instagram…" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Monto (MXN)" htmlFor="monto">
                <Input id="monto" name="monto" required inputMode="decimal" />
              </FormField>
              <FormField label="Fecha" htmlFor="fecha">
                <Input id="fecha" name="fecha" type="date" defaultValue={hoyMexico()} />
              </FormField>
            </div>
          </Formulario>
        </Card>
      </div>
    </div>
  );
}
