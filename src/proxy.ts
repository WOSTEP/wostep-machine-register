import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// Refreshes the Supabase session cookie on every navigation and guards the
// staff-only /app/* routes, per the README's "sign-in → 04 → 05 → everything
// else" staff flow. Renamed from `middleware.ts` — Next.js 16 deprecated
// that file name in favour of `proxy.ts`.
export async function proxy(request: NextRequest) {
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
