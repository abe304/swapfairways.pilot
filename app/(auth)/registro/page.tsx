import Link from "next/link";
import { RegistroForm } from "./RegistroForm";
import { createClient } from "@/lib/supabase/server";
import { normalizarCodigo } from "@/lib/invites";
import { CONTACT_EMAIL } from "@/lib/site";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo: codigoParam } = await searchParams;
  const codigo = normalizarCodigo(codigoParam);
  const supabase = await createClient();

  const { data: ajuste } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "invite_required")
    .maybeSingle();
  const requerido = ajuste?.value === "true";

  // Si llegan con un enlace de invitación, se confirma de quién es.
  let invitador: string | null = null;
  let codigoInvalido = false;
  if (codigo) {
    const { data } = await supabase.rpc("validar_codigo_invitacion", { p_codigo: codigo });
    const fila = data?.[0];
    if (fila?.valido) invitador = fila.invitador;
    else codigoInvalido = true;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <h1 className="mb-1 text-2xl font-semibold text-swf-verde">Únete a SwapFairways</h1>
      <p className="mb-6 text-sm text-swf-verde/70">
        {requerido
          ? "El acceso es por invitación. Ingresa el código que te compartió un socio."
          : "Crea tu cuenta y recibe créditos de bienvenida para empezar a intercambiar rondas."}
      </p>
      {codigo && invitador ? (
        <p className="mb-4 rounded-md bg-swf-dorado/15 px-3 py-2 text-sm text-swf-verde">
          Te invitó <strong>{invitador}</strong>. ¡Bienvenido!
        </p>
      ) : codigo && !codigoInvalido ? (
        <p className="mb-4 rounded-md bg-swf-dorado/15 px-3 py-2 text-sm text-swf-verde">
          Tienes una invitación a SwapFairways. ¡Bienvenido!
        </p>
      ) : null}
      {codigoInvalido ? (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          Ese código de invitación no es válido o ya se usó.
        </p>
      ) : null}
      <RegistroForm codigoInicial={codigo} codigoRequerido={requerido} />
      <p className="mt-6 text-center text-sm text-swf-verde/70">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-swf-dorado">
          Ingresa
        </Link>
      </p>
      {requerido && CONTACT_EMAIL ? (
        <p className="mt-3 text-center text-xs text-swf-verde/60">
          ¿Aún no tienes código? Escríbenos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
