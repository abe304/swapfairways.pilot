import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MOCK_MODE } from "@/lib/mock/is-mock";
import { ClubAdminForm } from "./ClubAdminForm";
import { ArchivosClub } from "./ArchivosClub";
import type { Club, ClubDocumento } from "@/lib/supabase/types";

export default async function AdminClubPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("clubs")
    .select("*, club_documentos(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const club = data as unknown as Club & { club_documentos: ClubDocumento[] | null };
  const documentos = (club.club_documentos ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/clubes" className="text-sm text-swf-verde/60 hover:text-swf-verde">
          ← Clubes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-swf-verde">{club.nombre}</h1>
        <Link href={`/clubes/${club.id}`} className="text-sm text-swf-dorado underline">
          Ver cómo lo ven los socios
        </Link>
      </div>

      <ArchivosClub
        clubId={club.id}
        nombre={club.nombre}
        fotoUrl={club.foto_url}
        documentos={documentos}
        storageDisponible={!MOCK_MODE}
      />
      <ClubAdminForm key={club.foto_url ?? "sin-foto"} club={club} />
    </div>
  );
}
