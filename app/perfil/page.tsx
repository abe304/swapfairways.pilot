import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";
import { Card } from "@/components/ui/Card";
import type { Club } from "@/lib/supabase/types";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  const { bienvenida } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: clubs } = await supabase.from("clubs").select("*").order("nombre");
  const { data: contact } = await supabase
    .from("profile_contacts")
    .select("telefono")
    .eq("user_id", profile.id)
    .maybeSingle();
  const { data: profileClubsRaw } = await supabase
    .from("profile_clubs")
    .select("clubs(*)")
    .eq("profile_id", profile.id);
  const otrosClubesIniciales = (
    (profileClubsRaw as unknown as { clubs: Club | null }[] | null) ?? []
  )
    .map((pc) => pc.clubs)
    .filter((c): c is Club => c !== null && c.id !== profile.club_id);

  return (
    <div className="mx-auto max-w-lg">
      {bienvenida ? (
        <Card className="mb-6 border-swf-dorado bg-swf-dorado/10">
          <p className="text-sm text-swf-verde">
            ¡Bienvenido a SwapFairways! Ya recibiste tus créditos de bienvenida. Completa
            tu perfil para empezar a explorar y anfitrionar rondas.
          </p>
        </Card>
      ) : null}
      <h1 className="mb-6 text-2xl font-semibold text-swf-verde">Tu perfil</h1>
      <ProfileForm
        profile={profile}
        clubs={clubs ?? []}
        telefono={contact?.telefono ?? ""}
        otrosClubesIniciales={otrosClubesIniciales}
      />
    </div>
  );
}
