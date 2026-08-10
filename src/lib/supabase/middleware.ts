import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, type Role } from "@/lib/types";

const PUBLIC_PREFIXES = ["/about", "/schools", "/parents", "/privacy", "/terms"];
const AUTH_PREFIXES = ["/login", "/signup", "/join", "/reset-password"];
const PROTECTED_PREFIXES = ["/student", "/parent", "/teacher", "/admin", "/review"];

const isConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Refreshes the Supabase session cookie on every request and enforces
 * coarse role-based routing. Fine-grained authorization still lives in
 * RLS + per-action checks (PRD §12, §14).
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // Without Supabase configured we let everything through so the
  // skeleton renders during local bring-up.
  if (!isConfigured) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = pathname !== "/review/manifest.webmanifest"
    && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // Unauthenticated user hitting a protected route → login.
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user → send to their role home if they're on an auth page,
  // and keep them out of dashboards that aren't theirs.
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("auth_user_id", user.id).maybeSingle();
    const role = profile?.role as Role | undefined;
    const home = role ? ROLE_HOME[role] : "/login";

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = home;
      url.search = "";
      if (!role) url.searchParams.set("error", "profile_missing");
      return NextResponse.redirect(url);
    }

    if (role && isProtected) {
      const allowed = home.split("/")[1];
      const target = pathname.split("/")[1];
      const platformReviewerAccess = role === "platform_admin" && target === "review";
      if (allowed !== target && !platformReviewerAccess) {
        const url = request.nextUrl.clone();
        url.pathname = home;
        return NextResponse.redirect(url);
      }
    }
  }

  void PUBLIC_PREFIXES;
  return response;
}
