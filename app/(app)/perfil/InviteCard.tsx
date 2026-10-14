import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/CopyButton";
import { enlaceInvitacion, mensajeWhatsApp } from "@/lib/invites";
import { getSiteUrl } from "@/lib/site";

type Invitado = { id: string; nombre: string; referido_pagado: boolean; created_at: string };

// Código de invitación personal del usuario + a quién ha invitado y cuántos
// créditos ha ganado por recomendar a otros socios.
export async function InviteCard({ profileId }: { profileId: string }) {
  const supabase = await createClient();

  const [{ data: codigoRow }, { data: invitadosRaw }, { data: referidos }, { data: ajuste }] =
    await Promise.all([
      supabase
        .from("codigos_invitacion")
        .select("codigo")
        .eq("owner_id", profileId)
        .eq("tipo", "usuario")
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, nombre, referido_pagado, created_at")
        .eq("invitado_por", profileId)
        .order("created_at", { ascending: false }),
      supabase
        .from("credit_transactions")
        .select("monto")
        .eq("user_id", profileId)
        .eq("tipo", "referido"),
      supabase.from("app_settings").select("value").eq("key", "recompensa_referido").maybeSingle(),
    ]);

  const codigo = codigoRow?.codigo;
  if (!codigo) return null;

  const invitados = (invitadosRaw as Invitado[] | null) ?? [];
  const ganados = (referidos ?? []).reduce((sum, r) => sum + (r.monto as number), 0);
  const recompensa = Number(ajuste?.value ?? 1);
  const enlace = enlaceInvitacion(await getSiteUrl(), codigo);

  return (
    <Card className="mb-6 border-swf-dorado/50 bg-swf-dorado/5">
      <h2 className="font-semibold text-swf-verde">Tu código de invitación</h2>
      <p className="mt-1 text-sm text-swf-verde/70">
        Compártelo con otros socios. Cuando alguien que invitaste juegue su primera ronda, ganas{" "}
        <strong>
          {recompensa} crédito{recompensa === 1 ? "" : "s"}
        </strong>{" "}
        para tu próxima salida.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          data-testid="codigo-invitacion"
          className="rounded-md bg-white px-4 py-2 font-mono text-lg font-semibold tracking-widest text-swf-verde ring-1 ring-swf-verde/15"
        >
          {codigo}
        </span>
        <CopyButton texto={codigo} etiqueta="Copiar código" />
        <CopyButton texto={enlace} etiqueta="Copiar enlace" />
        <a
          href={mensajeWhatsApp(enlace)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md bg-swf-verde px-3 py-1.5 text-sm text-swf-crema hover:bg-swf-verde-claro"
        >
          Enviar por WhatsApp
        </a>
      </div>
      <p className="mt-2 break-all text-xs text-swf-verde/50">{enlace}</p>

      <div className="mt-5 border-t border-swf-verde/10 pt-4">
        <p className="text-sm font-medium text-swf-verde">
          Has invitado a {invitados.length} {invitados.length === 1 ? "socio" : "socios"} · ganaste{" "}
          {ganados} crédito{ganados === 1 ? "" : "s"}
        </p>
        {invitados.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {invitados.map((i) => (
              <li key={i.id} className="flex items-center justify-between text-sm text-swf-verde/80">
                <span>{i.nombre}</span>
                {i.referido_pagado ? (
                  <Badge tone="success">Ya jugó · +{recompensa}</Badge>
                ) : (
                  <Badge>Aún no juega su primera ronda</Badge>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}
