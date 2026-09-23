import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { OfferForm } from "./OfferForm";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default async function NuevaOfertaPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: clubs, error: clubsError } = await supabase
    .from("clubs")
    .select("*")
    .order("nombre");
  if (clubsError) {
    console.error("[ofertas/nueva] Error cargando clubes:", clubsError);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-semibold text-swf-verde">Anfitrionar una ronda</h1>
      <p className="mb-6 text-sm text-swf-verde/70">
        Publica un tee time para que otros socios del club soliciten unirse.
      </p>
      {clubsError ? (
        <Card className="mb-6 border-red-300 bg-red-50">
          <p className="text-sm text-red-800">
            No pudimos cargar el catálogo de clubes ({clubsError.message}). Si esto sigue
            pasando, probablemente falte correr las migraciones más recientes en Supabase.
          </p>
        </Card>
      ) : null}
      {!profile.club_id ? (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <p className="text-sm text-amber-800">
            Antes de anfitrionar, completa tu club en{" "}
            <Link href="/perfil" className="font-medium underline">
              tu perfil
            </Link>
            .
          </p>
        </Card>
      ) : null}
      <OfferForm clubs={clubs ?? []} defaultClubId={profile.club_id} />
    </div>
  );
}
