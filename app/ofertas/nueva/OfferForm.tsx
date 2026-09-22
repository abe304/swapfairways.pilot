"use client";

import { useActionState, useState } from "react";
import { createOffer } from "../actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { ClubCombobox } from "@/components/ClubCombobox";
import { formatFecha } from "@/lib/utils";
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
  const [fechas, setFechas] = useState<string[]>([]);
  const [fechaInput, setFechaInput] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  function addFecha() {
    if (fechaInput && !fechas.includes(fechaInput)) {
      setFechas([...fechas, fechaInput].sort());
      setFechaInput("");
    }
  }

  return (
    <Card>
      <form action={action} className="space-y-4">
        <FormField label="Club" htmlFor="club_id">
          <ClubCombobox clubs={clubs} defaultValue={defaultClubId} required />
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
          <>
            <FormField label="Fechas disponibles" htmlFor="fecha_input">
              <div className="flex gap-2">
                <Input
                  id="fecha_input"
                  type="date"
                  min={today}
                  value={fechaInput}
                  onChange={(e) => setFechaInput(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={addFecha}>
                  + Agregar
                </Button>
              </div>
              {fechas.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {fechas.map((f) => (
                    <span
                      key={f}
                      className="flex items-center gap-1 rounded-full bg-swf-verde/10 px-3 py-1 text-xs text-swf-verde"
                    >
                      {formatFecha(f)}
                      <input type="hidden" name="fechas" value={f} />
                      <button
                        type="button"
                        onClick={() => setFechas(fechas.filter((x) => x !== f))}
                        className="ml-1 text-swf-verde/60 hover:text-swf-verde"
                        aria-label={`Quitar ${f}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-swf-verde/50">
                  Agrega una o varias fechas en las que puedes anfitrionar (misma hora para todas).
                </p>
              )}
            </FormField>
            <FormField label="Hora" htmlFor="hora">
              <Input id="hora" name="hora" type="time" required={!flexible} />
            </FormField>
          </>
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
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-swf-verde">
            <input type="checkbox" name="caddie_incluido" className="h-4 w-4" />
            Caddie incluido
          </label>
          <label className="flex items-center gap-2 text-sm text-swf-verde">
            <input type="checkbox" name="carrito_compartido" className="h-4 w-4" />
            Carrito compartido
          </label>
        </div>
        <FormField label="Costo estimado en campo (MXN, opcional)" htmlFor="costo_estimado">
          <Input
            id="costo_estimado"
            name="costo_estimado"
            type="number"
            min={0}
            step="1"
            placeholder="Ej. 500"
          />
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
