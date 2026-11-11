"use client";

import { useActionState } from "react";
import { solicitarRecuperacion } from "../actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export function RecuperarForm() {
  const [state, action, pending] = useActionState(solicitarRecuperacion, undefined);

  if (state && "enviado" in state) {
    return (
      <Card>
        <p className="text-sm text-swf-verde">
          Si hay una cuenta con ese correo, te llegará un enlace en unos minutos. Ábrelo para crear tu
          nueva contraseña. Revisa también la carpeta de spam.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form action={action} className="space-y-4">
        <FormField label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </FormField>
        {state && "error" in state ? <p className="text-sm text-red-700">{state.error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Enviando..." : "Enviar enlace"}
        </Button>
      </form>
    </Card>
  );
}
