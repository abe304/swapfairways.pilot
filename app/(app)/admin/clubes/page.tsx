import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/Card";
import { normalizarTexto } from "@/lib/utils";
import { NivelBadge } from "@/components/NivelBadge";
import type { ClubNivel } from "@/lib/niveles";

type Fila = {
  id: string;
  nombre: string;
  ciudad: string | null;
  estado: string | null;
  foto_url: string | null;
  nivel: ClubNivel | null;
  club_documentos: { id: string }[] | null;
};

export default async function AdminClubesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; faltan?: string }>;
}) {
  await requireAdmin();
  const { q, faltan } = await searchParams;
  const busqueda = (q ?? "").trim();
  const supabase = await createClient();

  const { data } = await supabase
    .from("clubs")
    .select("id, nombre, ciudad, estado, foto_url, nivel, club_documentos(id)")
    .order("nombre");
  const todos = (data as unknown as Fila[] | null) ?? [];

  const clubs = todos.filter((c) => {
    if (faltan === "docs" && (c.club_documentos?.length ?? 0) > 0) return false;
    if (faltan === "foto" && c.foto_url) return false;
    if (!busqueda) return true;
    return [c.nombre, c.ciudad, c.estado].some((campo) =>
      normalizarTexto(campo).includes(normalizarTexto(busqueda)),
    );
  });

  const sinDocs = todos.filter((c) => (c.club_documentos?.length ?? 0) === 0).length;
  const sinFoto = todos.filter((c) => !c.foto_url).length;

  return (
    <div>
      <Link href="/admin" className="text-sm text-swf-verde/60 hover:text-swf-verde">
        ← Administración
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold text-swf-verde">Clubes</h1>
      <p className="mb-5 text-sm text-swf-verde/70">
        Carga la foto, los estatutos y el reglamento de cada club. Faltan documentos en {sinDocs} de{" "}
        {todos.length} clubes y foto en {sinFoto}.
      </p>

      <form method="get" className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          placeholder="Busca por club, ciudad o estado"
          className="w-64 rounded-md border border-swf-verde/20 bg-white px-3 py-2 text-sm text-swf-verde placeholder:text-swf-verde/40"
        />
        <select
          name="faltan"
          defaultValue={faltan ?? ""}
          aria-label="Filtrar por pendientes"
          className="rounded-md border border-swf-verde/20 bg-white px-3 py-2 text-sm text-swf-verde"
        >
          <option value="">Todos</option>
          <option value="docs">Sin estatutos/documentos</option>
          <option value="foto">Sin foto</option>
        </select>
        <button
          type="submit"
          className="rounded-md border border-swf-verde/30 px-4 py-2 text-sm text-swf-verde hover:bg-swf-verde/5"
        >
          Filtrar
        </button>
        <span className="ml-auto text-sm text-swf-verde/60">{clubs.length} clubes</span>
      </form>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-swf-verde/10 bg-swf-verde/5 text-xs uppercase tracking-wide text-swf-verde/70">
            <tr>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3">Documentos</th>
              <th className="px-4 py-3">Foto</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {clubs.map((c) => {
              const docs = c.club_documentos?.length ?? 0;
              return (
                <tr key={c.id} className="border-b border-swf-verde/5 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-swf-verde">{c.nombre}</td>
                  <td className="px-4 py-2.5 text-swf-verde/70">{c.estado ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <NivelBadge nivel={c.nivel} />
                  </td>
                  <td className="px-4 py-2.5">
                    {docs > 0 ? <Badge tone="success">{docs}</Badge> : <Badge tone="warning">Faltan</Badge>}
                  </td>
                  <td className="px-4 py-2.5">
                    {c.foto_url ? <Badge tone="success">Sí</Badge> : <Badge>No</Badge>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/clubes/${c.id}`} className="text-swf-dorado underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
