"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { ClubCombobox } from "@/components/ClubCombobox";
import type { Club, Profile } from "@/lib/supabase/types";

export function ProfileForm({
  profile,
  clubs,
  telefono,
  otrosClubesIniciales,
}: {
  profile: Profile;
  clubs: Club[];
  telefono: string;
  otrosClubesIniciales: Club[];
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [otrosClubes, setOtrosClubes] = useState<Club[]>(otrosClubesIniciales);
  const [comboKey, setComboKey] = useState(0);

  function addOtroClub(club: Club) {
    setOtrosClubes((prev) => (prev.some((c) => c.id === club.id) ? prev : [...prev, club]));
    setComboKey((k) => k + 1);
  }

  return (
    <Card>
      <form action={action} className="space-y-4">
        <FormField label="Nombre" htmlFor="nombre">
          <Input id="nombre" name="nombre" defaultValue={profile.nombre} required />
        </FormField>
        <FormField label="Club principal" htmlFor="club_id">
          <ClubCombobox clubs={clubs} defaultValue={profile.club_id} />
        </FormField>

        <FormField label="Otros clubes donde eres socio (opcional)" htmlFor="otro_club_input">
          <ClubCombobox
            key={comboKey}
            name="otro_club_input"
            clubs={clubs}
            onSelect={addOtroClub}
          />
          {otrosClubes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {otrosClubes.map((c) => (
                <span
                  key={c.id}
                  className="flex items-center gap-1 rounded-full bg-swf-verde/10 px-3 py-1 text-xs text-swf-verde"
                >
                  {c.nombre}
                  <input type="hidden" name="otros_club_ids" value={c.id} />
                  <button
                    type="button"
                    onClick={() => setOtrosClubes((prev) => prev.filter((x) => x.id !== c.id))}
                    className="ml-1 text-swf-verde/60 hover:text-swf-verde"
                    aria-label={`Quitar ${c.nombre}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-1 text-xs text-swf-verde/50">
            Se te mostrarán como accesos rápidos al anfitrionar una ronda.
          </p>
        </FormField>

        <FormField label="Handicap" htmlFor="handicap_manual">
          <Input
            id="handicap_manual"
            name="handicap_manual"
            type="number"
            step="0.1"
            defaultValue={profile.handicap_manual ?? ""}
            placeholder="Ej. 12.4"
          />
        </FormField>
        <FormField label="Teléfono / WhatsApp de contacto" htmlFor="telefono">
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            defaultValue={telefono}
            placeholder="Solo se comparte cuando confirmes una ronda"
          />
        </FormField>
        <FormField label="GHIN ID (opcional)" htmlFor="ghin_id">
          <Input
            id="ghin_id"
            name="ghin_id"
            defaultValue={profile.ghin_id ?? ""}
            placeholder="Ej. 4123456"
          />
        </FormField>
        <FormField label="Bio corta" htmlFor="bio">
          <Textarea
            id="bio"
            name="bio"
            defaultValue={profile.bio ?? ""}
            placeholder="Cuéntale al club algo sobre ti como jugador"
          />
        </FormField>
        {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </Card>
  );
}
