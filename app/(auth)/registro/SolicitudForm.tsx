"use client";

import Link from "next/link";
import { useActionState } from "react";
import { solicitarInvitacion } from "../actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export function SolicitudForm({ clubes }: { clubes: string[] }) {
  const [state, action, pending] = useActionState(solicitarInvitacion, undefined);

  if (state && "ok" in state) {
    return (
      <Card>
        {state.ok === "ya_registrado" ? (
          <p className="text-sm text-swf-verde">
            Ya hay una cuenta con ese correo.{" "}
            <Link href="/login" className="font-medium text-swf-dorado underline">
              Ingresa aquí
            </Link>{" "}
            o usa «¿Olvidaste tu contraseña?» si no la recuerdas.
          </p>
        ) : (
          <p className="text-sm text-swf-verde">
            ¡Gracias! Recibimos tus datos. Te avisaremos por correo o WhatsApp cuando tengas tu código de
            invitación.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <form action={action} className="space-y-4">
        <FormField label="Nombre completo" htmlFor="sol-nombre">
          <Input id="sol-nombre" name="nombre" autoComplete="name" required />
        </FormField>
        <FormField label="Email" htmlFor="sol-email">
          <Input id="sol-email" name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField label="Celular (opcional)" htmlFor="sol-telefono">
          <Input id="sol-telefono" name="telefono" type="tel" autoComplete="tel" placeholder="55 1234 5678" />
        </FormField>
        <FormField label="¿De qué club eres socio?" htmlFor="sol-club">
          <Input id="sol-club" name="club" list="sol-clubes" autoComplete="off" placeholder="Escribe tu club" />
          <datalist id="sol-clubes">
            {clubes.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </FormField>
        <FormField label="Mensaje (opcional)" htmlFor="sol-mensaje">
          <Textarea id="sol-mensaje" name="mensaje" rows={3} placeholder="¿Quién te recomendó o qué te interesa?" />
        </FormField>
        {state && "error" in state ? <p className="text-sm text-red-700">{state.error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Enviando..." : "Quiero que me inviten"}
        </Button>
      </form>
    </Card>
  );
}
