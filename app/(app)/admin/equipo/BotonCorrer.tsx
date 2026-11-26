"use client";

import { useActionState } from "react";
import { correrAgenteAhora } from "./actions";

export function BotonCorrer({ rol, disponible }: { rol: string; disponible: boolean }) {
  const [state, action, pending] = useActionState(correrAgenteAhora, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="rol" value={rol} />
      <button
        type="submit"
        disabled={pending || !disponible}
        className="rounded-md border border-swf-verde/30 px-3 py-1.5 text-xs font-medium text-swf-verde hover:bg-swf-verde/5 disabled:opacity-50"
        title={disponible ? undefined : "Falta configurar AI Gateway"}
      >
        {pending ? "Trabajando… (hasta 4 min)" : "Correr ahora"}
      </button>
      {state ? <span className="text-xs text-swf-verde/70">{state.mensaje}</span> : null}
    </form>
  );
}
