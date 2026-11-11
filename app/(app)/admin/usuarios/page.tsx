import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import type { UsuarioAdmin } from "@/lib/supabase/types";
import { TablaUsuarios } from "./TablaUsuarios";

export default async function AdminUsuariosPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_listar_usuarios");
  const usuarios = (data ?? []) as UsuarioAdmin[];

  return (
    <div>
      <Link href="/admin" className="text-sm text-swf-verde/60 hover:text-swf-verde">
        ← Administración
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold text-swf-verde">Usuarios registrados</h1>
      <p className="mb-6 text-sm text-swf-verde/70">
        {usuarios.length} usuario{usuarios.length === 1 ? "" : "s"}. Los más recientes primero.
      </p>
      {error ? (
        <Card>
          <p className="text-sm text-red-700">
            No se pudo cargar la lista ({error.message}). Revisa que la migración{" "}
            <code>0014_admin_usuarios.sql</code> esté corrida en Supabase.
          </p>
        </Card>
      ) : (
        <TablaUsuarios usuarios={usuarios} />
      )}
    </div>
  );
}
