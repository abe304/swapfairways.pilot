"use client";

import { useActionState } from "react";
import { reenviarInvitacion } from "./actions";

export function ReenviarButton({ codigo }: { codigo: string }) {
  const [state, action, pending] = useActionState(reenviarInvitacion, undefined);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="codigo" value={codigo} />
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer text-xs text-swf-verde underline disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Reenviar correo"}
      </button>
      {!pending && state && "ok" in state ? (
        <span className="text-xs text-green-700">Correo enviado</span>
      ) : null}
      {!pending && state && "error" in state ? (
        <span className="text-xs text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}
