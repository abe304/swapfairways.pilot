"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function CopyButton({
  texto,
  etiqueta = "Copiar",
  className,
}: {
  texto: string;
  etiqueta?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles (p. ej. http): el texto queda visible para copiarlo a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-swf-verde/30 px-3 py-1.5 text-sm text-swf-verde transition-colors hover:bg-swf-verde/5",
        className,
      )}
    >
      {copiado ? "¡Copiado!" : etiqueta}
    </button>
  );
}
