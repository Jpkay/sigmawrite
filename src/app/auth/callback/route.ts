import { NextResponse, type NextRequest } from "next/server";
import { needsInvitedPasswordSetup } from "@/lib/auth-invite";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type Role } from "@/lib/types";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const origin = request.nextUrl.origin;
  if (!code && !tokenHash) return NextResponse.redirect(`${origin}/login?error=missing_code`);

  // PKCE (?code=) and token-hash (?token_hash=&type=) mail templates both land here (audit 2026-09-06).
  const db = await createClient();
  const { data, error } = code
    ? await db.auth.exchangeCodeForSession(code)
    : await db.auth.verifyOtp({ token_hash: tokenHash as string, type: (["magiclink", "recovery", "signup", "invite", "email", "email_change"].includes(type ?? "") ? type : "magiclink") as "magiclink" | "recovery" | "signup" | "invite" | "email" | "email_change" });
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
