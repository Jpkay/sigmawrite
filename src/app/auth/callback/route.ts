import { NextResponse, type NextRequest } from "next/server";
import { needsInvitedPasswordSetup } from "@/lib/auth-invite";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type Role } from "@/lib/types";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;
  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`);

  const db = await createClient();
  const { data, error } = await db.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=auth_callback`);

  const { data: profile } = await db.from("profiles").select("role").eq("auth_user_id", data.user.id).maybeSingle();
  const role = profile?.role as Role | undefined;
  if (!role || !["parent", "teacher", "school_admin", "platform_admin", "content_reviewer"].includes(role)) {
    await db.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=adult_only`);
  }

  if (needsInvitedPasswordSetup(data.user)) {
    return NextResponse.redirect(`${origin}/set-password`);
  }
  return NextResponse.redirect(`${origin}${ROLE_HOME[role]}`);
}
