import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getCurrentProfile } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/ofertas", label: "Explorar" },
  { href: "/clubes", label: "Clubes" },
  { href: "/ofertas/nueva", label: "Anfitrionar" },
  { href: "/mis-rondas", label: "Mis rondas" },
  { href: "/creditos", label: "Créditos" },
];

export async function NavBar() {
  const profile = await getCurrentProfile();

  if (!profile) {
    // Visitante: solo logo, directorio de clubes y acceso.
    return (
      <header className="border-b border-swf-verde/10 bg-swf-verde text-swf-crema">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" aria-label="SwapFairways, inicio">
            <Logo />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/clubes" className="hover:text-swf-dorado">
              Clubes
            </Link>
            <Link href="/login" className="hover:text-swf-dorado">
              Ingresar
            </Link>
            <Link
              href="/registro"
              className="rounded-md bg-swf-dorado px-3 py-1.5 font-medium text-swf-verde hover:bg-swf-dorado/90"
            >
              Únete
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  // Liga "Equipo" para miembros del equipo (migración 0026) y admins.
  let esEquipo = profile.is_admin;
  if (!esEquipo) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("equipo_miembros")
      .select("activo")
      .eq("profile_id", profile.id)
      .maybeSingle();
    esEquipo = !!data?.activo;
  }

  return (
    <header className="border-b border-swf-verde/10 bg-swf-verde text-swf-crema">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label="SwapFairways, inicio">
          <Logo />
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-swf-dorado">
              {link.label}
            </Link>
          ))}
          {esEquipo ? (
            <Link href={profile.is_admin ? "/admin/equipo" : "/equipo"} className="text-swf-dorado hover:underline">
              Equipo
            </Link>
          ) : null}
          {profile.is_admin ? (
            <Link href="/admin" className="text-swf-dorado hover:underline">
              Admin
            </Link>
          ) : null}
          <Link href="/perfil" className="hover:text-swf-dorado">
            {profile.nombre}
          </Link>
          <span className="rounded-full bg-swf-dorado/20 px-2.5 py-0.5 text-xs font-medium text-swf-dorado">
            {profile.creditos_balance} créditos
          </span>
          <form action={signOut}>
            <button className="text-xs text-swf-crema/70 hover:text-swf-crema" type="submit">
              Salir
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
