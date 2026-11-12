import { createClient } from "@/lib/supabase/server";
import { generarCodigo, enlaceInvitacion } from "@/lib/invites";
import { CONTACT_EMAIL } from "@/lib/site";
import { invitacionEmailHtml, sendEmail } from "@/lib/email";

export type CodigoCreado = {
  codigo: string;
  etiqueta: string;
  email: string | null;
  telefono: string | null;
  enlace: string;
  correo: "enviado" | "omitido" | "sin_email";
};

type Cliente = Awaited<ReturnType<typeof createClient>>;

// Solo para el servidor (server actions de admin). Crea un código de fundador (un solo uso) y, si se pide y hay correo, manda
// la invitación. Quien llama ya verificó que es administrador.
export async function crearCodigoFundador(
  supabase: Cliente,
  params: {
    adminId: string;
    siteUrl: string;
    persona: { etiqueta: string; email: string | null; telefono: string | null };
    enviar: boolean;
  },
): Promise<{ creado: CodigoCreado } | { error: string }> {
  const { persona } = params;
  let codigo = "";
  let insertado = false;
  for (let intento = 0; intento < 5 && !insertado; intento++) {
    codigo = generarCodigo();
    const { error } = await supabase.from("codigos_invitacion").insert({
      codigo,
      tipo: "fundador",
      etiqueta: persona.etiqueta,
      email: persona.email,
      telefono: persona.telefono,
      usos_maximos: 1,
      creado_por: params.adminId,
    });
    if (!error) insertado = true;
    else if (!/duplicate|unique/i.test(error.message)) {
      return { error: `No pudimos crear el código para ${persona.etiqueta} (${error.message}).` };
    }
  }
  if (!insertado) return { error: "No pudimos generar un código único. Intenta de nuevo." };

  const enlace = enlaceInvitacion(params.siteUrl, codigo);
  let correo: CodigoCreado["correo"] = persona.email ? "omitido" : "sin_email";
  if (params.enviar && persona.email) {
    const envio = await sendEmail({
      to: persona.email,
      subject: "Tu invitación a SwapFairways",
      html: invitacionEmailHtml({ nombre: persona.etiqueta, codigo, enlace, remitente: CONTACT_EMAIL }),
    });
    correo = envio.ok ? "enviado" : "omitido";
  }
  return {
    creado: { codigo, etiqueta: persona.etiqueta, email: persona.email, telefono: persona.telefono, enlace, correo },
  };
}
