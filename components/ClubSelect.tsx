import { Select } from "@/components/ui/Field";
import type { Club } from "@/lib/supabase/types";

export function ClubSelect({
  clubs,
  defaultValue,
  required,
}: {
  clubs: Club[];
  defaultValue?: string | null;
  required?: boolean;
}) {
  const estados = Array.from(new Set(clubs.map((c) => c.estado ?? "Otro"))).sort((a, b) =>
    a.localeCompare(b, "es"),
  );

  return (
    <Select id="club_id" name="club_id" defaultValue={defaultValue ?? ""} required={required}>
      <option value="" disabled={required}>
        Selecciona un club
      </option>
      {estados.map((estado) => (
        <optgroup key={estado} label={estado}>
          {clubs
            .filter((c) => (c.estado ?? "Otro") === estado)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
            .map((club) => (
              <option key={club.id} value={club.id}>
                {club.nombre}
                {club.tipo === "publico" ? " (acceso público)" : ""}
              </option>
            ))}
        </optgroup>
      ))}
    </Select>
  );
}
