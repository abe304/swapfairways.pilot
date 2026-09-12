"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { ClubSelect } from "@/components/ClubSelect";
import type { Club, Profile } from "@/lib/supabase/types";

export function ProfileForm({
  profile,
  clubs,
  telefono,
}: {
  profile: Profile;
  clubs: Club[];
  telefono: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <Card>
      <form action={action} className="space-y-4">
        <FormField label="Nombre" htmlFor="nombre">
          <Input id="nombre" name="nombre" defaultValue={profile.nombre} required />
        </FormField>
        <FormField label="Club" htmlFor="club_id">
          <ClubSelect clubs={clubs} defaultValue={profile.club_id} />
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
        <FormField label="Foto (URL, opcional)" htmlFor="foto_url">
          <Input
            id="foto_url"
            name="foto_url"
            type="url"
            defaultValue={profile.foto_url ?? ""}
            placeholder="https://..."
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
        {state?.success ? (
          <p className="text-sm text-green-700">Perfil actualizado.</p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </Card>
  );
}
