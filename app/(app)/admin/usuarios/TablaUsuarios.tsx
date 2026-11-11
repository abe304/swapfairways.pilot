"use client";

import { useMemo, useState } from "react";
import type { UsuarioAdmin } from "@/lib/supabase/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—";

function aCsv(usuarios: UsuarioAdmin[]) {
  const columnas: [string, (u: UsuarioAdmin) => unknown][] = [
    ["Nombre", (u) => u.nombre],
    ["Correo", (u) => u.email],
    ["Teléfono", (u) => u.telefono],
    ["Club", (u) => u.club],
    ["Créditos", (u) => u.creditos],
    ["Admin", (u) => (u.is_admin ? "Sí" : "")],
    ["Código usado", (u) => u.codigo_usado],
    ["Invitado por", (u) => u.invitado_por],
    ["Rondas publicadas", (u) => u.rondas_publicadas],
    ["Solicitudes", (u) => u.solicitudes],
    ["Registro", (u) => u.registrado?.slice(0, 10)],
    ["Último acceso", (u) => u.ultimo_acceso?.slice(0, 10)],
  ];
  const celda = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const filas = [columnas.map(([t]) => celda(t)).join(",")];
  for (const u of usuarios) filas.push(columnas.map(([, f]) => celda(f(u))).join(","));
  // BOM para que Excel reconozca los acentos.
  return "﻿" + filas.join("\r\n");
}

export function TablaUsuarios({ usuarios }: { usuarios: UsuarioAdmin[] }) {
  const [q, setQ] = useState("");
  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return usuarios;
    return usuarios.filter((u) =>
      [u.nombre, u.email, u.club, u.telefono, u.codigo_usado].some((v) => v?.toLowerCase().includes(t)),
    );
  }, [q, usuarios]);

  function descargar() {
    const blob = new Blob([aCsv(filtrados)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios-swapfairways-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Buscar por nombre, correo, club o código"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-0 flex-1"
          aria-label="Buscar usuarios"
        />
        <button
          type="button"
          onClick={descargar}
          className="rounded-md border border-swf-verde/20 px-3 py-2 text-sm text-swf-verde hover:bg-swf-verde/5"
        >
          Descargar Excel (CSV)
        </button>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-sm text-swf-verde/60">No hay usuarios que coincidan.</p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-swf-verde/50">
              <tr>
                <th className="py-2 pr-3 font-medium">Socio</th>
                <th className="py-2 pr-3 font-medium">Club</th>
                <th className="py-2 pr-3 text-right font-medium">Créditos</th>
                <th className="py-2 pr-3 text-right font-medium">Rondas / Solicitudes</th>
                <th className="py-2 pr-3 font-medium">Invitación</th>
                <th className="py-2 pr-3 font-medium">Registro</th>
                <th className="py-2 font-medium">Último acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-swf-verde/10">
              {filtrados.map((u) => (
                <tr key={u.id} className="align-top">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-swf-verde">
                      {u.nombre}
                      {u.is_admin ? (
                        <span className="ml-2 rounded bg-swf-dorado/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-swf-verde">
                          Admin
                        </span>
                      ) : null}
                    </div>
                    <a href={`mailto:${u.email}`} className="text-xs text-swf-verde/60 hover:underline">
                      {u.email}
                    </a>
                    {u.telefono ? <div className="text-xs text-swf-verde/60">{u.telefono}</div> : null}
                  </td>
                  <td className="py-2 pr-3 text-swf-verde/80">{u.club ?? "—"}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{u.creditos}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {u.rondas_publicadas} / {u.solicitudes}
                  </td>
                  <td className="py-2 pr-3 text-xs text-swf-verde/70">
                    {u.codigo_usado ? <span className="font-mono">{u.codigo_usado}</span> : "—"}
                    {u.invitado_por ? <div>por {u.invitado_por}</div> : null}
                  </td>
                  <td className="py-2 pr-3 text-xs text-swf-verde/70">{fecha(u.registrado)}</td>
                  <td className="py-2 text-xs text-swf-verde/70">{fecha(u.ultimo_acceso)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
