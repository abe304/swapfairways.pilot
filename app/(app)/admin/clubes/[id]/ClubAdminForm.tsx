"use client";

import { useActionState } from "react";
import { updateClub } from "../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import type { Club } from "@/lib/supabase/types";

export function ClubAdminForm({ club }: { club: Club }) {
  const [state, action, pending] = useActionState(updateClub, undefined);

  return (
    <Card>
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={club.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Ciudad / municipio" htmlFor="ciudad">
            <Input id="ciudad" name="ciudad" defaultValue={club.ciudad ?? ""} />
          </FormField>
          <FormField label="Estado" htmlFor="estado">
            <Input id="estado" name="estado" defaultValue={club.estado ?? ""} />
          </FormField>
        </div>
        <FormField label="Dirección (se usa para el enlace de Google Maps)" htmlFor="direccion">
          <Input id="direccion" name="direccion" defaultValue={club.direccion ?? ""} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Tipo" htmlFor="tipo">
            <Select id="tipo" name="tipo" defaultValue={club.tipo}>
              <option value="privado">Privado</option>
              <option value="publico">Público</option>
            </Select>
          </FormField>
          <FormField label="Costo en créditos por ronda" htmlFor="costo_creditos">
            <Input
              id="costo_creditos"
              name="costo_creditos"
              type="number"
              min={1}
              step={1}
              defaultValue={club.costo_creditos}
              required
            />
          </FormField>
          <FormField label="Green fee sugerido (MXN)" htmlFor="costo_visita_sugerido">
            <Input
              id="costo_visita_sugerido"
              name="costo_visita_sugerido"
              type="number"
              min={0}
              defaultValue={club.costo_visita_sugerido ?? ""}
            />
          </FormField>
        </div>

        <fieldset className="rounded-md border border-swf-verde/15 p-3">
          <legend className="px-1 text-sm font-medium text-swf-verde">Obligaciones para invitados</legend>
          <div className="flex flex-wrap gap-6 text-sm text-swf-verde">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requiere_caddie_invitado"
                defaultChecked={club.requiere_caddie_invitado}
                className="h-4 w-4"
              />
              Caddie obligatorio
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="carrito_obligatorio"
                defaultChecked={club.carrito_obligatorio}
                className="h-4 w-4"
              />
              Carrito obligatorio
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requiere_ghin"
                defaultChecked={club.requiere_ghin}
                className="h-4 w-4"
              />
              Requiere GHIN
            </label>
          </div>
        </fieldset>

        <FormField label="Recomendación de llegada" htmlFor="recomendacion_llegada">
          <Input
            id="recomendacion_llegada"
            name="recomendacion_llegada"
            defaultValue={club.recomendacion_llegada ?? ""}
            placeholder="Ej. Llega 45 minutos antes de tu hora de salida"
          />
        </FormField>
        <FormField label="Reglamento (resumen visible para los socios)" htmlFor="reglamento">
          <Textarea id="reglamento" name="reglamento" rows={5} defaultValue={club.reglamento ?? ""} />
        </FormField>
        <FormField label="Foto: enlace de una imagen (opcional si la subes arriba)" htmlFor="foto_url">
          <Input
            id="foto_url"
            name="foto_url"
            type="url"
            defaultValue={club.foto_url ?? ""}
            placeholder="https://…"
          />
        </FormField>

        {state && "error" in state && state.error ? (
          <p className="text-sm text-red-700">{state.error}</p>
        ) : null}
        {state && "ok" in state && state.ok ? <p className="text-sm text-green-800">{state.ok}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </Card>
  );
}
