"use client";

import { useActionState } from "react";
import type { FormState } from "./actions";

// Formulario con mensaje de éxito/error para las acciones del equipo.
// React limpia los campos al terminar la acción.
export function Formulario({
  action,
  boton,
  className,
  children,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  boton: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className ?? "space-y-3"}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-swf-verde px-4 py-2 text-sm font-medium text-swf-crema hover:bg-swf-verde-claro disabled:opacity-50"
        >
          {pending ? "Guardando…" : boton}
        </button>
        {state && "ok" in state ? <span className="text-sm text-green-800">{state.ok}</span> : null}
        {state && "error" in state ? <span className="text-sm text-red-700">{state.error}</span> : null}
      </div>
    </form>
  );
}
