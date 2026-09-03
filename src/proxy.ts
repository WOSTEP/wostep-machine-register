import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// Gates the entire site behind one shared guest username/password (HTTP
// Basic Auth) — per the director's request, visitors no longer get in
// automatically; they're told this one shared credential. Staff still sign
// in with their own @wostep.ch account on top of this, inside the app.
function checkGuestAuth(request: NextRequest): boolean {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  const decoded = atob(header.slice(6));
  const separatorIndex = decoded.indexOf(":");
  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  return user === process.env.GUEST_USERNAME && pass === process.env.GUEST_PASSWORD;
}

function requireGuestAuth() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="WOSTEP Machine Register"' },
  });
}

// Refreshes the Supabase session cookie on every navigation and guards the
// staff-only /app/* routes, per the README's "sign-in → 04 → 05 → everything
// else" staff flow. Renamed from `middleware.ts` — Next.js 16 deprecated
// that file name in favour of `proxy.ts`.
export async function proxy(request: NextRequest) {
  if (!checkGuestAuth(request)) {
    return requireGuestAuth();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/app") && !user) {
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signinUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-wostep.png|icons/).*)"],
};
