import { createClient } from "@/lib/supabase/server";

/** Admin reads (PRD §O). Staff-scoped by RLS via is_staff()/is_platform_admin(). */

export type OrgTree = {
  id: string;
  name: string;
  schools: {
    id: string;
    name: string;
    city: string | null;
    classes: { id: string; name: string; grade_level: number | null }[];
  }[];
}[];

export async function getSchoolTree(): Promise<OrgTree> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name, schools(id, name, city, classes(id, name, grade_level))");
  return (data as OrgTree | null) ?? [];
}

export type AuditEntry = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

export async function getAuditLogs(limit = 100): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, target_type, target_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AuditEntry[] | null) ?? [];
}
