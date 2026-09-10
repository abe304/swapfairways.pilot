import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { MOCK_MODE, MOCK_SESSION_COOKIE } from "@/lib/mock/is-mock";

const PUBLIC_PATHS = ["/login", "/registro"];

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
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/ofertas";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
