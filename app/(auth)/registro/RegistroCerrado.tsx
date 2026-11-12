"use client";

import { useState } from "react";
import { RegistroForm } from "./RegistroForm";
import { SolicitudForm } from "./SolicitudForm";

// Registro solo por invitación y sin código en el enlace: por defecto se pide
// unirse a la lista de espera; quien sí tiene código puede abrir el registro.
export function RegistroCerrado({ clubes }: { clubes: string[] }) {
  const [tengoCodigo, setTengoCodigo] = useState(false);

  return (
    <div className="space-y-4">
      {tengoCodigo ? <RegistroForm codigoInicial="" codigoRequerido /> : <SolicitudForm clubes={clubes} />}
      <button
        type="button"
        onClick={() => setTengoCodigo((v) => !v)}
        className="w-full text-center text-sm font-medium text-swf-dorado underline"
      >
        {tengoCodigo ? "No tengo código: quiero que me inviten" : "Ya tengo un código de invitación"}
      </button>
    </div>
  );
}
