"use client";

import { useActionState } from "react";
import { signUp } from "../actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export function RegistroForm() {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <Card>
      <form action={action} className="space-y-4">
        <FormField label="Nombre completo" htmlFor="nombre">
          <Input id="nombre" name="nombre" autoComplete="name" required />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField label="Contraseña" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </FormField>
        {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>
    </Card>
  );
}
