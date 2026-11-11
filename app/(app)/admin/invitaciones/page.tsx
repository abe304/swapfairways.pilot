import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { CopyButton } from "@/components/CopyButton";
import { enlaceInvitacion, formatoTelefono, mensajeWhatsApp } from "@/lib/invites";
import { getSiteUrl } from "@/lib/site";
import { FundadoresForm } from "./FundadoresForm";
import { desactivarCodigo, setInviteRequired, setRecompensa } from "./actions";
import { ReenviarButton } from "./ReenviarButton";
import type { CodigoInvitacion } from "@/lib/supabase/types";

export default async function AdminInvitacionesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: codigosRaw }, { data: ajustes }, { data: perfiles }] = await Promise.all([
    supabase.from("codigos_invitacion").select("*").eq("tipo", "fundador").order("created_at", { ascending: false }),
    supabase.from("app_settings").select("key, value"),
    supabase.from("profiles").select("id, invitado_por, referido_pagado"),
  ]);
  const codigos = (codigosRaw as CodigoInvitacion[] | null) ?? [];
  const valor = (k: string) => ajustes?.find((a) => a.key === k)?.value;
  const requerido = valor("invite_required") === "true";
  const recompensa = Number(valor("recompensa_referido") ?? 1);
  const siteUrl = await getSiteUrl();
  const correoDisponible = !!process.env.RESEND_API_KEY;

  const invitados = (perfiles ?? []).filter((p) => p.invitado_por).length;
  const pagados = (perfiles ?? []).filter((p) => p.referido_pagado).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-swf-verde/60 hover:text-swf-verde">
          ← Administración
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-swf-verde">Invitaciones</h1>
      </div>

      <Card>
        <h2 className="font-semibold text-swf-verde">Acceso al registro</h2>
        <p className="mt-1 text-sm text-swf-verde/70">
          {requerido
            ? "Hoy el registro es SOLO por invitación: nadie entra sin un código válido."
            : "Hoy el registro está abierto: el código de invitación es opcional. Actívalo cuando ya hayas repartido los códigos de los primeros socios."}
        </p>
        <form action={setInviteRequired} className="mt-3">
          <input type="hidden" name="valor" value={requerido ? "false" : "true"} />
          <Button type="submit" variant={requerido ? "ghost" : "primary"}>
            {requerido ? "Abrir el registro" : "Exigir código de invitación"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold text-swf-verde">Recompensa por recomendar</h2>
        <p className="mt-1 text-sm text-swf-verde/70">
          Créditos que gana un socio cuando alguien que invitó juega su primera ronda. Hasta ahora:{" "}
          {invitados} invitados por socios, {pagados} ya jugaron.
        </p>
        <form action={setRecompensa} className="mt-3 flex items-center gap-3">
          <Input
            name="recompensa"
            type="number"
            min={0}
            max={10}
            defaultValue={recompensa}
            className="w-24"
            aria-label="Créditos por referido"
          />
          <Button type="submit" variant="ghost">
            Guardar
          </Button>
        </form>
      </Card>

      <FundadoresForm correoDisponible={correoDisponible} />

      <Card>
        <h2 className="mb-3 font-semibold text-swf-verde">Códigos de fundador ({codigos.length})</h2>
        {codigos.length === 0 ? (
          <p className="text-sm text-swf-verde/60">Aún no has creado códigos de fundador.</p>
        ) : (
          <ul className="space-y-2">
            {codigos.map((c) => {
              const usado = c.usos_maximos != null && c.usos >= c.usos_maximos;
              return (
                <li
                  key={c.codigo}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-swf-crema px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-swf-verde">{c.etiqueta ?? "Sin nombre"}</span>
                    <span className="ml-2 font-mono tracking-wider text-swf-verde">{c.codigo}</span>
                    {c.email ? <span className="ml-2 text-xs text-swf-verde/50">{c.email}</span> : null}
                    {c.telefono ? (
                      <span className="ml-2 text-xs text-swf-verde/50">{formatoTelefono(c.telefono)}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!c.activo ? (
                      <Badge tone="danger">Desactivado</Badge>
                    ) : usado ? (
                      <Badge tone="success">Ya se registró</Badge>
                    ) : (
                      <Badge tone="gold">Pendiente</Badge>
                    )}
                    {!usado && c.activo ? (
                      <>
                        <CopyButton texto={enlaceInvitacion(siteUrl, c.codigo)} etiqueta="Copiar enlace" />
                        <a
                          href={mensajeWhatsApp(enlaceInvitacion(siteUrl, c.codigo), c.etiqueta, {
                            telefono: c.telefono,
                            codigo: c.codigo,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-swf-verde underline"
                        >
                          WhatsApp
                        </a>
                        {c.email && correoDisponible ? (
                          <ReenviarButton codigo={c.codigo} />
                        ) : null}
                        <form action={desactivarCodigo}>
                          <input type="hidden" name="codigo" value={c.codigo} />
                          <button type="submit" className="text-xs text-red-700 underline">
                            Desactivar
                          </button>
                        </form>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
