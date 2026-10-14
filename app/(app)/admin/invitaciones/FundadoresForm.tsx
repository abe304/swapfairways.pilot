"use client";

import { useActionState } from "react";
import { crearCodigosFundadores, type CodigoCreado } from "./actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, Textarea } from "@/components/ui/Field";
import { CopyButton } from "@/components/CopyButton";
import { mensajeWhatsApp } from "@/lib/invites";

const ESTADO_CORREO: Record<CodigoCreado["correo"], string> = {
  enviado: "Correo enviado",
  omitido: "Correo no enviado",
  sin_email: "Sin correo",
};

export function FundadoresForm({ correoDisponible }: { correoDisponible: boolean }) {
  const [state, action, pending] = useActionState(crearCodigosFundadores, undefined);
  const creados = state && "creados" in state ? (state.creados ?? []) : [];

  return (
    <Card>
      <h2 className="font-semibold text-swf-verde">Dar de alta a los primeros socios</h2>
      <p className="mb-4 mt-1 text-sm text-swf-verde/70">
        Escribe una persona por línea: <code className="rounded bg-swf-verde/5 px-1">Nombre, correo</code>{" "}
        (el correo es opcional). Se crea un código de un solo uso para cada una.
      </p>
      <form action={action} className="space-y-3">
        <FormField label="Personas" htmlFor="lista">
          <Textarea
            id="lista"
            name="lista"
            rows={6}
            placeholder={"Ana Torres, ana@correo.com\nLuis Pérez, luis@correo.com\nMaría Gómez"}
          />
        </FormField>
        <label className="flex items-center gap-2 text-sm text-swf-verde">
          <input type="checkbox" name="enviar" className="h-4 w-4" defaultChecked={correoDisponible} />
          Enviarles la invitación por correo
          {!correoDisponible ? (
            <span className="text-xs text-swf-verde/50">
              (el envío de correos no está configurado: se crean los códigos y tú los compartes)
            </span>
          ) : null}
        </label>
        {state && "error" in state && state.error ? (
          <p className="text-sm text-red-700">{state.error}</p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creando..." : "Crear códigos"}
        </Button>
      </form>

      {creados.length > 0 ? (
        <div className="mt-6 border-t border-swf-verde/10 pt-4">
          <p className="mb-2 text-sm font-medium text-swf-verde">
            {creados.length} código{creados.length === 1 ? "" : "s"} creado{creados.length === 1 ? "" : "s"}
          </p>
          <ul className="space-y-2">
            {creados.map((c) => (
              <li
                key={c.codigo}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-swf-crema px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-swf-verde">{c.etiqueta}</span>
                  <span className="ml-2 font-mono tracking-wider text-swf-verde">{c.codigo}</span>
                  <span className="ml-2 text-xs text-swf-verde/50">{ESTADO_CORREO[c.correo]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton texto={c.enlace} etiqueta="Copiar enlace" />
                  <a
                    href={mensajeWhatsApp(c.enlace, c.etiqueta)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md border border-swf-verde/30 px-3 py-1.5 text-sm text-swf-verde hover:bg-swf-verde/5"
                  >
                    WhatsApp
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
