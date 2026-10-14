import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

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
          <Link href="/" className="text-lg font-semibold tracking-wide text-swf-dorado">
            SwapFairways
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

  return (
    <header className="border-b border-swf-verde/10 bg-swf-verde text-swf-crema">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-wide text-swf-dorado">
          SwapFairways
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-swf-dorado">
              {link.label}
            </Link>
          ))}
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
