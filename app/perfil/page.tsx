import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";
import { Card } from "@/components/ui/Card";

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
      <ProfileForm profile={profile} clubs={clubs ?? []} telefono={contact?.telefono ?? ""} />
    </div>
  );
}
