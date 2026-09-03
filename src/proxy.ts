import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { expectedGuestToken, GUEST_COOKIE_NAME } from "@/lib/guestAuth";

// Refreshes the Supabase session cookie on every navigation and guards two
// tiers of routes:
//   - /app/*        staff only — redirects to /signin without a session
//   - /scan, /m/*   visitor pages — redirects to /visitor-signin unless
//                    either the shared guest cookie or a staff session is
//                    present, per the director's request that the Welcome
//                    screen stay public but nothing past it does
// Renamed from `middleware.ts` — Next.js 16 deprecated that file name in
// favour of `proxy.ts`.
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

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/app") && !user) {
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signinUrl);
  }

  const isVisitorRoute = pathname === "/scan" || pathname.startsWith("/m/");
  if (isVisitorRoute && !user) {
    const guestCookie = request.cookies.get(GUEST_COOKIE_NAME)?.value;
    const validGuest = guestCookie && guestCookie === (await expectedGuestToken());
    if (!validGuest) {
      const visitorSigninUrl = new URL("/visitor-signin", request.url);
      visitorSigninUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(visitorSigninUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-wostep.png|icons/).*)"],
};
