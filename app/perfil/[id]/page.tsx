import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/Card";

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, clubs(nombre, ciudad)")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("receptor_id", id)
    .order("created_at", { ascending: false });

  const club = (profile as unknown as { clubs: { nombre: string; ciudad: string | null } | null })
    .clubs;

  const totalReviews = reviews?.length ?? 0;
  const avgRating = totalReviews
    ? (reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : null;

  const tagCounts = new Map<string, number>();
  reviews?.forEach((r) => {
    r.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {profile.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.foto_url}
                alt={profile.nombre}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-swf-verde/10 text-lg font-semibold text-swf-verde">
                {profile.nombre.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-swf-verde">{profile.nombre}</h1>
              {club ? (
                <p className="text-sm text-swf-verde/70">
                  {club.nombre}
                  {club.ciudad ? ` — ${club.ciudad}` : ""}
                </p>
              ) : null}
              {profile.handicap_manual !== null ? (
                <p className="mt-1 text-sm text-swf-verde/70">
                  Handicap: {profile.handicap_manual}
                </p>
              ) : null}
              {profile.ghin_id ? (
                <p className="text-sm text-swf-verde/70">GHIN: {profile.ghin_id}</p>
              ) : null}
            </div>
          </div>
          {avgRating ? (
            <Badge tone="gold">
              ★ {avgRating} ({totalReviews})
            </Badge>
          ) : (
            <Badge>Sin reseñas aún</Badge>
          )}
        </div>
        {profile.bio ? <p className="mt-4 text-sm text-swf-verde/80">{profile.bio}</p> : null}
      </Card>

      {tagCounts.size > 0 ? (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-swf-verde">
            Lo que dicen otros socios
          </h2>
          <div className="flex flex-wrap gap-2">
            {Array.from(tagCounts.entries()).map(([tag, count]) => (
              <Badge key={tag}>
                {tag} ({count})
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
