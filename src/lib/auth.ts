import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ROLE_HOME, type Role } from "@/lib/types";
import { getReviewerAccess } from "@/lib/db/reviews";

export type SessionProfile = {
  id: string;
  authUserId: string;
  role: Role;
  displayName: string | null;
};

/** Returns the current user + profile, or null if unauthenticated. */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  // Skeleton mode: no Supabase yet → no session. Dashboards still render
  // their shells with placeholder identity (PRD Phase 0).
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, auth_user_id, role, display_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const role = (profile?.role ??
    user.app_metadata?.role ??
    user.user_metadata?.role) as Role | undefined;
  if (!role) return null;

  return {
    id: profile?.id ?? user.id,
    authUserId: user.id,
    role,
    displayName: profile?.display_name ?? null,
  };
}

/**
 * Guard for Server Components / Server Actions. Redirects to /login if
 * unauthenticated, or to the caller's own role home if their role is not
 * in `allowed`. Every server action handling data MUST call a guard like
 * this — Server Actions are reachable as direct requests (PRD §12).
 */
export async function requireRole(allowed: Role[]): Promise<SessionProfile> {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (!allowed.includes(session.role)) redirect(ROLE_HOME[session.role]);
  return session;
}

export async function requireActiveReviewer(): Promise<SessionProfile> {
  const session = await requireRole(["platform_admin", "content_reviewer"]);
  const access = await getReviewerAccess(session.id);
  if (!access?.active) redirect("/login?error=reviewer_inactive");
  return session;
}
