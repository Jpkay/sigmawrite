import { createClient } from "@/lib/supabase/server";

/**
 * Append-only audit log for sensitive actions (PRD §10). Inserted through the
 * authenticated client (RLS: any signed-in user may insert; only platform
 * admins may read). Best-effort: logging must never break the action.
 */
export async function logAudit(
  action: string,
  opts: { targetType?: string; targetId?: string; metadata?: Record<string, unknown> } = {}
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    await supabase.from("audit_logs").insert({
      actor_profile_id: profile?.id ?? null,
      action,
      target_type: opts.targetType ?? null,
      target_id: opts.targetId ?? null,
      metadata: opts.metadata ?? null,
    });
  } catch {
    /* never throw from the audit path */
  }
}
