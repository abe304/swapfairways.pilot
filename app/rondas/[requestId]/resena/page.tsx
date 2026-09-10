import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ReviewForm } from "./ReviewForm";
import { Card } from "@/components/ui/Card";

export default async function ResenaPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select("*, tee_time_offers(host_id, fecha, clubs(nombre))")
    .eq("id", requestId)
    .single();

  if (!request) notFound();

  const offer = (
    request as unknown as {
      tee_time_offers: { host_id: string; fecha: string; clubs: { nombre: string } | null };
    }
  ).tee_time_offers;

  const isGuest = request.guest_id === profile.id;
  const isHost = offer.host_id === profile.id;
  if (!isGuest && !isHost) notFound();
  if (request.estado !== "jugado") {
    redirect("/mis-rondas");
  }

  const receptorId = isGuest ? offer.host_id : request.guest_id;

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("request_id", requestId)
    .eq("autor_id", profile.id)
    .maybeSingle();

  const { data: receptor } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", receptorId)
    .single();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-semibold text-swf-verde">
        Reseña de ronda en {offer.clubs?.nombre}
      </h1>
      <p className="mb-6 text-sm text-swf-verde/70">
        Sobre {receptor?.nombre ?? "tu compañero de ronda"} — ayuda a mantener la
        confianza en la comunidad SWF.
      </p>
      {existingReview ? (
        <Card>
          <p className="text-sm text-swf-verde/70">Ya dejaste una reseña para esta ronda. ¡Gracias!</p>
        </Card>
      ) : (
        <ReviewForm requestId={requestId} receptorId={receptorId} />
      )}
    </div>
  );
}
