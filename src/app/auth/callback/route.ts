import { NextResponse, type NextRequest } from "next/server";
import { needsInvitedPasswordSetup } from "@/lib/auth-invite";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type Role } from "@/lib/types";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;
  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`);

  const db = await createClient();
  const { data, error } = await db.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=auth_callback`);

  const { data: profile } = await db.from("profiles").select("role,must_change_password").eq("auth_user_id", data.user.id).maybeSingle();
  const role = profile?.role as Role | undefined;
  if (!role || !(role in ROLE_HOME)) {
    await db.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=profile_missing`);
  }

  const next = safeAuthRedirect(request.nextUrl.searchParams.get("next"), ROLE_HOME[role]);
  if (needsInvitedPasswordSetup(data.user) || profile?.must_change_password || next.startsWith("/set-password")) {
    return NextResponse.redirect(`${origin}${next.startsWith("/set-password") ? next : "/set-password"}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
