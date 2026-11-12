import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/CopyButton";
import { enlaceInvitacion, formatoTelefono, mensajeWhatsApp, normalizarTelefono } from "@/lib/invites";
import { getSiteUrl } from "@/lib/site";
import type { ListaEspera } from "@/lib/supabase/types";
import { InvitarButton } from "./InvitarButton";
import { cambiarEstadoLista } from "./actions";

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

function Contacto({ p }: { p: ListaEspera }) {
  const tel = p.telefono ? (normalizarTelefono(p.telefono) ?? p.telefono) : null;
  return (
    <div className="min-w-0">
      <div className="font-medium text-swf-verde">{p.nombre}</div>
      <div className="text-xs text-swf-verde/60">
        <a href={`mailto:${p.email}`} className="hover:underline">
          {p.email}
        </a>
        {tel ? <> · {formatoTelefono(tel)}</> : null}
        {p.club ? <> · {p.club}</> : null}
      </div>
      {p.mensaje ? <p className="mt-1 text-sm text-swf-verde/80">“{p.mensaje}”</p> : null}
      <div className="mt-1 text-xs text-swf-verde/40">Pidió el {fecha(p.created_at)}</div>
    </div>
  );
}

export default async function ListaEsperaPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data, error }, siteUrl] = await Promise.all([
    supabase.from("lista_espera").select("*").order("created_at", { ascending: false }),
    getSiteUrl(),
  ]);
  const filas = (data ?? []) as ListaEspera[];
  const pendientes = filas.filter((f) => f.estado === "pendiente");
  const invitados = filas.filter((f) => f.estado === "invitado");
  const descartados = filas.filter((f) => f.estado === "descartado");
  const correoDisponible = !!process.env.RESEND_API_KEY;

  return (
    <div>
      <Link href="/admin" className="text-sm text-swf-verde/60 hover:text-swf-verde">
        ← Administración
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold text-swf-verde">Lista de espera</h1>
      <p className="mb-6 text-sm text-swf-verde/70">
        Personas que pidieron entrar cuando el registro es solo por invitación. Crea su código con un clic: si
        dejaron correo se les manda la invitación, y con celular tienes el botón de WhatsApp.
      </p>

      {error ? (
        <Card>
          <p className="text-sm text-red-700">
            No se pudo cargar la lista ({error.message}). Revisa que la migración{" "}
            <code>0017_lista_espera.sql</code> esté corrida en Supabase.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-swf-verde">Pendientes ({pendientes.length})</h2>
            {pendientes.length === 0 ? (
              <p className="text-sm text-swf-verde/60">No hay solicitudes pendientes.</p>
            ) : (
              <ul className="divide-y divide-swf-verde/10">
                {pendientes.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <Contacto p={p} />
                    <div className="flex flex-wrap items-center gap-3">
                      <InvitarButton id={p.id} tieneEmail={!!p.email} correoDisponible={correoDisponible} />
                      <form action={cambiarEstadoLista}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="estado" value="descartado" />
                        <button type="submit" className="text-xs text-red-700 underline">
                          Descartar
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {invitados.length > 0 ? (
            <Card>
              <h2 className="mb-3 font-semibold text-swf-verde">Ya invitados ({invitados.length})</h2>
              <ul className="divide-y divide-swf-verde/10">
                {invitados.map((p) => {
                  const enlace = p.codigo ? enlaceInvitacion(siteUrl, p.codigo) : null;
                  const tel = p.telefono ? normalizarTelefono(p.telefono) : null;
                  return (
                    <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                      <Contacto p={p} />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="success">Invitado</Badge>
                        {p.codigo ? (
                          <span className="font-mono text-sm tracking-wider text-swf-verde">{p.codigo}</span>
                        ) : null}
                        {enlace && p.codigo ? (
                          <>
                            <CopyButton texto={enlace} etiqueta="Copiar enlace" />
                            <a
                              href={mensajeWhatsApp(enlace, p.nombre, { telefono: tel, codigo: p.codigo })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md border border-swf-verde/30 px-3 py-1.5 text-sm text-swf-verde hover:bg-swf-verde/5"
                            >
                              WhatsApp
                            </a>
                          </>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}

          {descartados.length > 0 ? (
            <Card>
              <details>
                <summary className="cursor-pointer font-semibold text-swf-verde">
                  Descartados ({descartados.length})
                </summary>
                <ul className="mt-3 divide-y divide-swf-verde/10">
                  {descartados.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                      <Contacto p={p} />
                      <form action={cambiarEstadoLista}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="estado" value="pendiente" />
                        <button type="submit" className="text-xs text-swf-verde underline">
                          Volver a pendientes
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </details>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
