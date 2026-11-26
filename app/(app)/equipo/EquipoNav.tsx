import Link from "next/link";
import { cn } from "@/lib/utils";

export function EquipoNav({
  actual,
  finanzas,
  admin,
}: {
  actual: "semana" | "pipeline" | "finanzas" | "tablero";
  finanzas: boolean;
  admin: boolean;
}) {
  const items = [
    { clave: "semana", href: "/equipo", label: "Mi semana" },
    { clave: "pipeline", href: "/equipo/pipeline", label: "Pipeline" },
    ...(finanzas ? [{ clave: "finanzas", href: "/equipo/finanzas", label: "Finanzas" }] : []),
    ...(admin ? [{ clave: "tablero", href: "/admin/equipo", label: "Tablero del equipo" }] : []),
  ];
  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-swf-verde/10 pb-3 text-sm">
      {items.map((i) => (
        <Link
          key={i.clave}
          href={i.href}
          className={cn(
            "rounded-md px-3 py-1.5",
            actual === i.clave ? "bg-swf-verde text-swf-crema" : "text-swf-verde hover:bg-swf-verde/5",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function AvisoMigracion() {
  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      Las tablas del equipo todavía no existen. Corre la migración <code>0026_equipo.sql</code> en el SQL Editor de
      Supabase y recarga la página.
    </div>
  );
}
