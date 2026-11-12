"use client";

import { useActionState } from "react";
import { invitarDesdeLista } from "./actions";
import { CopyButton } from "@/components/CopyButton";
import { mensajeWhatsApp } from "@/lib/invites";

const BOTON =
  "inline-flex items-center rounded-md border border-swf-verde/30 px-3 py-1.5 text-sm text-swf-verde hover:bg-swf-verde/5";

export function InvitarButton({
  id,
  tieneEmail,
  correoDisponible,
}: {
  id: string;
  tieneEmail: boolean;
  correoDisponible: boolean;
}) {
  const [state, action, pending] = useActionState(invitarDesdeLista, undefined);

  if (state && "creado" in state) {
    const c = state.creado;
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-mono tracking-wider text-swf-verde">{c.codigo}</span>
        <span className="text-xs text-swf-verde/60">
          {c.correo === "enviado" ? "Correo enviado" : "Código creado"}
        </span>
        <CopyButton texto={c.enlace} etiqueta="Copiar enlace" />
        <a
          href={mensajeWhatsApp(c.enlace, c.etiqueta, { telefono: c.telefono, codigo: c.codigo })}
          target="_blank"
          rel="noopener noreferrer"
          className={BOTON}
        >
          WhatsApp
        </a>
      </div>
    );
  }

  const enviar = tieneEmail && correoDisponible;
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {enviar ? <input type="hidden" name="enviar" value="on" /> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-swf-verde px-3 py-1.5 text-sm font-medium text-swf-crema hover:bg-swf-verde/90 disabled:opacity-50"
      >
        {pending ? "Creando..." : enviar ? "Crear código y enviar correo" : "Crear código"}
      </button>
      {state && "error" in state ? <span className="text-xs text-red-700">{state.error}</span> : null}
    </form>
  );
}
