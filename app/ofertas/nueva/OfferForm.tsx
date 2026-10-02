"use client";

import { useActionState, useState } from "react";
import { createOffer } from "../actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { ClubCombobox } from "@/components/ClubCombobox";
import { formatFecha, formatHora, formatMoneda } from "@/lib/utils";
import { COSTO_CONCEPTOS, totalCostos, type Costos, type CostoKey } from "@/lib/offers";
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
  const [fechas, setFechas] = useState<Array<{ fecha: string; hora: string }>>([]);
  const [fechaInput, setFechaInput] = useState("");
  const [horaInput, setHoraInput] = useState("");
  const [costos, setCostos] = useState<Partial<Record<CostoKey, string>>>({});
  const [presetClub, setPresetClub] = useState<Club | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const totalEstimado = totalCostos(
    Object.fromEntries(
      Object.entries(costos).map(([k, v]) => [k, v ? Number(v) || 0 : 0]),
    ) as Costos,
  );

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
        [...fechas, { fecha: fechaInput, hora: horaInput }].sort(
          (a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora),
        ),
      );
      setFechaInput("");
      setHoraInput("");
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
                    {formatFecha(fh.fecha)} · {formatHora(fh.hora)}
                    <input type="hidden" name="fecha_hora_pairs" value={`${fh.fecha}|${fh.hora}`} />
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
                Elige fecha y hora y presiona &quot;+ Agregar&quot; para sumar más de una (pueden tener horas distintas). Si solo es una, basta con llenarla y publicar.
              </p>
            )}
          </FormField>
        ) : null}

        <FormField label="Pases disponibles" htmlFor="pases_disponibles">
          <Input
            id="pases_disponibles"
            name="pases_disponibles"
            type="number"
            min={1}
            max={3}
            defaultValue={1}
            required
          />
        </FormField>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-swf-verde">
            <input type="checkbox" name="caddie_incluido" className="h-4 w-4" />
            Caddie incluido
          </label>
          <label className="flex items-center gap-2 text-sm text-swf-verde">
            <input type="checkbox" name="carrito_compartido" className="h-4 w-4" />
            Carrito compartido
          </label>
        </div>

        <fieldset className="rounded-md border border-swf-verde/15 p-3">
          <legend className="px-1 text-sm font-medium text-swf-verde">
            Costos aproximados para el invitado (MXN)
          </legend>
          <p className="mb-3 text-xs text-swf-verde/60">
            Deja en blanco lo que no aplique o ya esté incluido. Se pagan directo en el club,
            no a través de SWF.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {COSTO_CONCEPTOS.map((c) => (
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
                {c.hint ? <p className="mt-0.5 text-[11px] text-swf-verde/50">{c.hint}</p> : null}
              </div>
            ))}
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
            Total aproximado: {formatMoneda(totalEstimado) === "Sin costo estimado" ? "$0" : formatMoneda(totalEstimado)}
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
