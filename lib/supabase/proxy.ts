import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { MOCK_MODE, MOCK_SESSION_COOKIE } from "@/lib/mock/is-mock";

// Rutas de acceso: si ya hay sesión, mandan a la app.
const AUTH_PATHS = ["/login", "/registro"];
// Rutas abiertas a todos (con o sin sesión): la home y el directorio de clubes.
const OPEN_PATHS = ["/clubes"];

function isOpenPath(pathname: string) {
  return pathname === "/" || OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  let user: { id: string } | null = null;

  if (MOCK_MODE) {
    // Sin Supabase real: la sesión demo vive en una cookie simple leída
    // directamente aquí (ver lib/mock/client.ts).
    const mockUid = request.cookies.get(MOCK_SESSION_COOKIE)?.value;
    user = mockUid ? { id: mockUid } : null;
  } else {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user: realUser },
    } = await supabase.auth.getUser();
    user = realUser;
  }

  const { pathname } = request.nextUrl;
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (!user && !isAuthPath && !isOpenPath(pathname)) {
    const url = request.nextUrl.clone();
    // Conserva los filtros (p. ej. la búsqueda de la home) para después del login.
    const destino = pathname + request.nextUrl.search;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirectTo", destino);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/ofertas";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
