"use client";

import { useActionState, useState } from "react";
import { createOffer } from "../actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { ClubCombobox } from "@/components/ClubCombobox";
import { formatFecha, formatHora, formatMoneda } from "@/lib/utils";
import { COSTO_CONCEPTOS, parteInvitado, totalCostos, type Costos, type CostoKey } from "@/lib/offers";
import type { Club } from "@/lib/supabase/types";

export function OfferForm({
  clubs,
  defaultClubId,
  misClubes,
}: {
  clubs: Club[];
  defaultClubId: string | null;
  misClubes: Club[];
}) {
  const [state, action, pending] = useActionState(createOffer, undefined);
  const [flexible, setFlexible] = useState(false);
  const [fechas, setFechas] = useState<Array<{ fecha: string; hora: string; pases: number }>>([]);
  const [fechaInput, setFechaInput] = useState("");
  const [horaInput, setHoraInput] = useState("");
  const [pasesInput, setPasesInput] = useState(1);
  const [costos, setCostos] = useState<Partial<Record<CostoKey, string>>>({});
  const [presetClub, setPresetClub] = useState<Club | null>(null);
  // Se guarda como texto para poder vaciar el campo mientras se escribe; se
  // ajusta a 1–3 al salir del campo.
  const [pasesTexto, setPasesTexto] = useState("1");
  const pases = Math.min(3, Math.max(1, Number(pasesTexto) || 1));
  const [carritoCompartido, setCarritoCompartido] = useState(true);
  const [caddieCompartido, setCaddieCompartido] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const compartidos = { carrito: carritoCompartido, caddie: caddieCompartido };
  const totalEstimado = totalCostos(
    Object.fromEntries(
      Object.entries(costos).map(([k, v]) => [k, v ? Number(v) || 0 : 0]),
    ) as Costos,
    compartidos,
  );
  // Cada fecha se publica como una ronda aparte con sus propios pases. Cuenta
  // también la fecha+hora escrita que aún no se agregó con "+ Agregar".
  const hayPendiente = !!(fechaInput && horaInput);
  const numFechas = fechas.length + (hayPendiente ? 1 : 0);
  const totalPases = fechas.reduce((n, f) => n + f.pases, 0) + (hayPendiente ? pasesInput : 0);

  function handleClubSelect(club: Club) {
    // El costo sugerido del club es el green fee: solo prellena si el
    // anfitrión no ha capturado uno.
    if (club.costo_visita_sugerido != null) {
      setCostos((prev) =>
        prev.costo_green_fee ? prev : { ...prev, costo_green_fee: String(club.costo_visita_sugerido) },
      );
    }
  }

  function addFecha() {
    if (fechaInput && horaInput) {
      setFechas(
        [...fechas, { fecha: fechaInput, hora: horaInput, pases: pasesInput }].sort(
          (a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora),
        ),
      );
      setFechaInput("");
      setHoraInput("");
      setPasesInput(1);
    }
  }

  return (
    <Card>
      <form action={action} className="space-y-4">
        <FormField label="Club" htmlFor="club_id">
          {misClubes.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {misClubes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPresetClub({ ...c })}
                  className="rounded-full border border-swf-verde/20 px-3 py-1 text-xs text-swf-verde hover:bg-swf-verde/5"
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          ) : null}
          <ClubCombobox
            clubs={clubs}
            defaultValue={defaultClubId}
            required
            onSelect={handleClubSelect}
            presetClub={presetClub}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-swf-verde">
          <input
            type="checkbox"
            name="fecha_flexible"
            className="h-4 w-4"
            checked={flexible}
            onChange={(e) => setFlexible(e.target.checked)}
          />
          Disponibilidad flexible — sin fecha fija, coordino directo con quien solicite
        </label>

        {!flexible ? (
          <FormField label="Fechas y horarios disponibles" htmlFor="fecha_input">
            <div className="flex flex-wrap gap-2">
              <Input
                id="fecha_input"
                name="fecha_pendiente"
                type="date"
                min={today}
                value={fechaInput}
                onChange={(e) => setFechaInput(e.target.value)}
                className="flex-1"
              />
              <Input
                name="hora_pendiente"
                type="time"
                value={horaInput}
                onChange={(e) => setHoraInput(e.target.value)}
                className="flex-1"
                aria-label="Hora para esta fecha"
              />
              <Select
                name="pases_pendiente"
                value={pasesInput}
                onChange={(e) => setPasesInput(Number(e.target.value))}
                className="w-auto"
                aria-label="Pases para esta fecha"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "pase" : "pases"}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={addFecha}>
                + Agregar
              </Button>
            </div>
            {fechas.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {fechas.map((fh, i) => (
                  <span
                    key={`${fh.fecha}-${fh.hora}-${i}`}
                    className="flex items-center gap-1 rounded-full bg-swf-verde/10 px-3 py-1 text-xs text-swf-verde"
                  >
                    {formatFecha(fh.fecha)} · {formatHora(fh.hora)} ·
                    <select
                      value={fh.pases}
                      onChange={(e) =>
                        setFechas(
                          fechas.map((f, idx) => (idx === i ? { ...f, pases: Number(e.target.value) } : f)),
                        )
                      }
                      className="rounded bg-white/70 px-1 py-0.5 text-xs"
                      aria-label={`Pases para ${fh.fecha} ${fh.hora}`}
                    >
                      {[1, 2, 3].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "pase" : "pases"}
                        </option>
                      ))}
                    </select>
                    <input type="hidden" name="fecha_hora_pairs" value={`${fh.fecha}|${fh.hora}|${fh.pases}`} />
                    <button
                      type="button"
                      onClick={() => setFechas(fechas.filter((_, idx) => idx !== i))}
                      className="ml-1 text-swf-verde/60 hover:text-swf-verde"
                      aria-label={`Quitar ${fh.fecha} ${fh.hora}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-swf-verde/50">
                Elige fecha, hora y cuántos pases ofreces ese día, y presiona &quot;+ Agregar&quot; para sumar más fechas (cada una con su hora y sus pases). Si solo es una, basta con llenarla y publicar.
              </p>
            )}
          </FormField>
        ) : null}

        {flexible ? (
          <FormField label="Pases disponibles" htmlFor="pases_disponibles">
            <Input
              id="pases_disponibles"
              name="pases_disponibles"
              type="number"
              min={1}
              max={3}
              value={pasesTexto}
              onChange={(e) => setPasesTexto(e.target.value)}
              onBlur={() => setPasesTexto(String(pases))}
              required
            />
            <p className="mt-1 text-xs text-swf-verde/50">Máximo 3.</p>
          </FormField>
        ) : numFechas > 0 ? (
          <p className="rounded-md bg-swf-verde/5 px-3 py-2 text-xs text-swf-verde/80">
            Se publicarán {numFechas} {numFechas === 1 ? "ronda" : "rondas"} ({totalPases}{" "}
            {totalPases === 1 ? "pase" : "pases"} en total). Los pases se cuentan por fecha: cada
            fecha se llena por separado.
          </p>
        ) : null}

        <fieldset className="rounded-md border border-swf-verde/15 p-3">
          <legend className="px-1 text-sm font-medium text-swf-verde">
            Costos aproximados para el invitado (MXN)
          </legend>
          <p className="mb-3 text-xs text-swf-verde/60">
            Deja en blanco lo que no aplique o ya esté incluido. Se pagan directo en el club,
            no a través de SWF.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {COSTO_CONCEPTOS.map((c) => {
              const compartible = c.key === "costo_carrito" || c.key === "costo_caddie";
              const compartido = c.key === "costo_carrito" ? carritoCompartido : caddieCompartido;
              const monto = Number(costos[c.key]) || 0;
              return (
                <div key={c.key}>
                  <label htmlFor={c.key} className="mb-1 block text-xs font-medium text-swf-verde">
                    {c.label}
                  </label>
                  <Input
                    id={c.key}
                    name={c.key}
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    placeholder="0"
                    value={costos[c.key] ?? ""}
                    onChange={(e) => setCostos((prev) => ({ ...prev, [c.key]: e.target.value }))}
                  />
                  {compartible ? (
                    <>
                      <label className="mt-1 flex items-center gap-2 text-xs text-swf-verde">
                        <input
                          type="checkbox"
                          name={c.key === "costo_carrito" ? "carrito_compartido" : "caddie_compartido"}
                          className="h-4 w-4"
                          checked={compartido}
                          onChange={(e) =>
                            c.key === "costo_carrito"
                              ? setCarritoCompartido(e.target.checked)
                              : setCaddieCompartido(e.target.checked)
                          }
                        />
                        {c.key === "costo_carrito" ? "Carrito compartido" : "Caddie compartido"}
                      </label>
                      <p className="mt-0.5 text-[11px] text-swf-verde/50">
                        {compartido
                          ? monto > 0
                            ? `Captura el costo completo; el invitado paga la mitad: ${formatMoneda(parteInvitado(c.key, monto, compartidos))}`
                            : "Captura el costo completo; el invitado paga la mitad."
                          : "El invitado paga el monto completo."}
                      </p>
                    </>
                  ) : c.hint ? (
                    <p className="mt-0.5 text-[11px] text-swf-verde/50">{c.hint}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="costo_otros" className="mb-1 block text-xs font-medium text-swf-verde">
                Otros cargos
              </label>
              <Input
                id="costo_otros"
                name="costo_otros"
                type="number"
                min={0}
                step="1"
                inputMode="numeric"
                placeholder="0"
                value={costos.costo_otros ?? ""}
                onChange={(e) => setCostos((prev) => ({ ...prev, costo_otros: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="concepto_otros" className="mb-1 block text-xs font-medium text-swf-verde">
                Concepto de otros cargos
              </label>
              <Input
                id="concepto_otros"
                name="concepto_otros"
                placeholder="Ej. cuota de práctica"
              />
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-swf-verde">
            Total que paga el invitado: {formatMoneda(totalEstimado) === "Sin costo estimado" ? "$0" : formatMoneda(totalEstimado)}
          </p>
        </fieldset>

        <FormField label="Nota para invitados" htmlFor="nota">
          <Textarea
            id="nota"
            name="nota"
            placeholder="Punto de encuentro, código de vestimenta, etc. Se muestra completo solo cuando apruebes una solicitud."
          />
        </FormField>
        {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Publicando..." : "Publicar oferta"}
        </Button>
      </form>
    </Card>
  );
}
