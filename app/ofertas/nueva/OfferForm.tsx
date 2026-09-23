"use client";

import { useActionState, useState } from "react";
import { createOffer } from "../actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { ClubCombobox } from "@/components/ClubCombobox";
import { formatFecha, formatHora } from "@/lib/utils";
import type { Club } from "@/lib/supabase/types";

export function OfferForm({
  clubs,
  defaultClubId,
}: {
  clubs: Club[];
  defaultClubId: string | null;
}) {
  const [state, action, pending] = useActionState(createOffer, undefined);
  const [flexible, setFlexible] = useState(false);
  const [fechas, setFechas] = useState<Array<{ fecha: string; hora: string }>>([]);
  const [fechaInput, setFechaInput] = useState("");
  const [horaInput, setHoraInput] = useState("");
  const [caddieIncluido, setCaddieIncluido] = useState(false);
  const [carritoCompartido, setCarritoCompartido] = useState(false);
  const [costoEstimado, setCostoEstimado] = useState("");
  const today = new Date().toISOString().slice(0, 10);

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
          <ClubCombobox
            clubs={clubs}
            defaultValue={defaultClubId}
            required
            onSelect={(club) => {
              if (club.costo_visita_sugerido != null) {
                setCostoEstimado(String(club.costo_visita_sugerido));
              }
            }}
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
                type="date"
                min={today}
                value={fechaInput}
                onChange={(e) => setFechaInput(e.target.value)}
                className="flex-1"
              />
              <Input
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
                Agrega cada fecha con su hora (pueden ser distintas) y luego &quot;+ Agregar&quot;.
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

        <div className="space-y-3">
          <div>
            <label className="flex items-center gap-2 text-sm text-swf-verde">
              <input
                type="checkbox"
                name="caddie_incluido"
                className="h-4 w-4"
                checked={caddieIncluido}
                onChange={(e) => setCaddieIncluido(e.target.checked)}
              />
              Caddie incluido
            </label>
            {caddieIncluido ? (
              <Input
                name="costo_caddie"
                type="number"
                min={0}
                step="1"
                placeholder="Costo del caddie (MXN, opcional)"
                className="mt-2"
              />
            ) : null}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-swf-verde">
              <input
                type="checkbox"
                name="carrito_compartido"
                className="h-4 w-4"
                checked={carritoCompartido}
                onChange={(e) => setCarritoCompartido(e.target.checked)}
              />
              Carrito compartido
            </label>
            {carritoCompartido ? (
              <Input
                name="costo_carrito"
                type="number"
                min={0}
                step="1"
                placeholder="Costo del carrito (MXN, opcional)"
                className="mt-2"
              />
            ) : null}
          </div>
        </div>

        <FormField label="Costo estimado de la visita (MXN, opcional)" htmlFor="costo_estimado">
          <Input
            id="costo_estimado"
            name="costo_estimado"
            type="number"
            min={0}
            step="1"
            placeholder="Ej. 500"
            value={costoEstimado}
            onChange={(e) => setCostoEstimado(e.target.value)}
          />
          <p className="mt-1 text-xs text-swf-verde/50">
            Se prellena con el costo sugerido del club si está configurado — puedes cambiarlo.
          </p>
        </FormField>

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
