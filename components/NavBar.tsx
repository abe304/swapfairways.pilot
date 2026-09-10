import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

const links = [
  { href: "/ofertas", label: "Explorar" },
  { href: "/ofertas/nueva", label: "Anfitrionar" },
  { href: "/mis-rondas", label: "Mis rondas" },
  { href: "/creditos", label: "Créditos" },
];

export async function NavBar() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <header className="border-b border-swf-verde/10 bg-swf-verde text-swf-crema">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/ofertas" className="text-lg font-semibold tracking-wide text-swf-dorado">
          SwapFairways
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-swf-dorado">
              {link.label}
            </Link>
          ))}
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
