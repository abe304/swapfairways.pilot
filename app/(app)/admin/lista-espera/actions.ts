"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { crearCodigoFundador, type CodigoCreado } from "@/lib/fundadores";

export type InvitarState = { creado: CodigoCreado } | { error: string } | undefined;

// Crea el código de fundador de una persona de la lista de espera, le manda
// la invitación por correo (si se pidió) y la marca como invitada.
export async function invitarDesdeLista(_prev: InvitarState, formData: FormData): Promise<InvitarState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const enviar = formData.get("enviar") === "on";
  const supabase = await createClient();

  const { data: fila } = await supabase.from("lista_espera").select("*").eq("id", id).maybeSingle();
  if (!fila) return { error: "No encontramos esa solicitud." };
  if (fila.estado === "invitado") return { error: "Esta persona ya tiene código." };

  const res = await crearCodigoFundador(supabase, {
    adminId: admin.id,
    siteUrl: await getSiteUrl(),
    persona: { etiqueta: fila.nombre, email: fila.email, telefono: fila.telefono },
    enviar,
  });
  if ("error" in res) return res;

  await supabase
    .from("lista_espera")
    .update({ estado: "invitado", codigo: res.creado.codigo, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/lista-espera");
  revalidatePath("/admin/invitaciones");
  revalidatePath("/admin");
  return res;
}

export async function cambiarEstadoLista(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const estado = formData.get("estado") === "descartado" ? "descartado" : "pendiente";
  const supabase = await createClient();
  const { data: fila } = await supabase.from("lista_espera").select("estado").eq("id", id).maybeSingle();
  if (!fila || fila.estado === "invitado") return;
  await supabase
    .from("lista_espera")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/lista-espera");
  revalidatePath("/admin");
}
