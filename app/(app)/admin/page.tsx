import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: clubs }, { data: docs }, { data: perfiles }, { data: codigos }, { data: ajuste }] =
    await Promise.all([
      supabase.from("clubs").select("id, foto_url"),
      supabase.from("club_documentos").select("club_id"),
      supabase.from("profiles").select("id, invitado_por, referido_pagado"),
      supabase.from("codigos_invitacion").select("codigo, usos, usos_maximos, activo").eq("tipo", "fundador"),
      supabase.from("app_settings").select("value").eq("key", "invite_required").maybeSingle(),
    ]);

  const clubsConDocs = new Set((docs ?? []).map((d) => d.club_id)).size;
  const clubsConFoto = (clubs ?? []).filter((c) => c.foto_url).length;
  const fundadoresUsados = (codigos ?? []).filter((c) => (c.usos as number) > 0).length;
  const referidosPagados = (perfiles ?? []).filter((p) => p.referido_pagado).length;
  const invitados = (perfiles ?? []).filter((p) => p.invitado_por).length;
  const requerido = ajuste?.value === "true";

  const tarjetas = [
    {
      href: "/admin/clubes",
      titulo: "Clubes, fotos y estatutos",
      detalle: `${clubsConDocs} de ${clubs?.length ?? 0} clubes con documentos · ${clubsConFoto} con foto`,
    },
    {
      href: "/admin/usuarios",
      titulo: "Usuarios registrados",
      detalle: `${perfiles?.length ?? 0} usuarios · nombre, correo, club, créditos y actividad · descargable a Excel`,
    },
    {
      href: "/admin/invitaciones",
      titulo: "Invitaciones y fundadores",
      detalle: `${perfiles?.length ?? 0} usuarios · ${fundadoresUsados}/${codigos?.length ?? 0} códigos de fundador usados · ${invitados} invitados por socios (${referidosPagados} ya jugaron) · registro ${requerido ? "solo por invitación" : "abierto"}`,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-swf-verde">Administración</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {tarjetas.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <h2 className="font-semibold text-swf-verde">{t.titulo}</h2>
              <p className="mt-2 text-sm text-swf-verde/70">{t.detalle}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
