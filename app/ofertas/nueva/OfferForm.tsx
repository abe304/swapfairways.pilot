"use client";

import { useActionState } from "react";
import { createOffer } from "../actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import type { Club } from "@/lib/supabase/types";

export function OfferForm({
  clubs,
  defaultClubId,
}: {
  clubs: Club[];
  defaultClubId: string | null;
}) {
  const [state, action, pending] = useActionState(createOffer, undefined);

  return (
    <Card>
      <form action={action} className="space-y-4">
        <FormField label="Club" htmlFor="club_id">
          <Select id="club_id" name="club_id" defaultValue={defaultClubId ?? ""} required>
            <option value="" disabled>
              Selecciona un club
            </option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.nombre}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha" htmlFor="fecha">
            <Input
              id="fecha"
              name="fecha"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              required
            />
          </FormField>
          <FormField label="Hora" htmlFor="hora">
            <Input id="hora" name="hora" type="time" required />
          </FormField>
        </div>
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
