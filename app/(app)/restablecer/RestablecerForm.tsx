"use client";

import { useActionState } from "react";
import { actualizarContrasena } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export function RestablecerForm() {
  const [state, action, pending] = useActionState(actualizarContrasena, undefined);

  return (
    <Card>
      <form action={action} className="space-y-4">
        <FormField label="Nueva contraseña" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </FormField>
        <FormField label="Confírmala" htmlFor="confirmacion">
          <Input
            id="confirmacion"
            name="confirmacion"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </FormField>
        {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Guardando..." : "Guardar contraseña"}
        </Button>
      </form>
    </Card>
  );
}
