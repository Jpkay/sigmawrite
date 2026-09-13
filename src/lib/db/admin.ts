import "server-only";

import { requireRole } from "@/lib/auth";
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
  await requireRole(["platform_admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, schools(id, name, city, classes(id, name, grade_level))");
  if (error) throw new Error(`Impossible de charger les établissements : ${error.message}`);
  return (data as OrgTree | null) ?? [];
}

export type SchoolInquiry = {
  id: string;
  organization_name: string;
  organization_type: string;
  country: string;
  contact_name: string;
  contact_role: string;
  contact_email: string;
  student_count: number;
  teacher_count: number | null;
  desired_start: string;
  primary_need: string;
  message: string | null;
  preferred_language: "fr" | "en";
  status: "new" | "contacted" | "qualified" | "proposal_sent" | "won" | "closed";
  created_at: string;
};

export async function getSchoolInquiries(limit = 50): Promise<SchoolInquiry[]> {
  await requireRole(["platform_admin"]);
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.trunc(limit), 1), 100)
    : 50;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("school_inquiries")
    .select("id, organization_name, organization_type, country, contact_name, contact_role, contact_email, student_count, teacher_count, desired_start, primary_need, message, preferred_language, status, created_at")
    .order("created_at", { ascending: false })
    .limit(safeLimit);
  if (error) throw new Error(`Impossible de charger les demandes d’établissement : ${error.message}`);
  return (data as SchoolInquiry[] | null) ?? [];
}

export type AuditEntry = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

export async function getAuditLogs(limit = 100): Promise<AuditEntry[]> {
  await requireRole(["platform_admin"]);
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.trunc(limit), 1), 200)
    : 100;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, target_type, target_id, created_at")
    .order("created_at", { ascending: false })
    .limit(safeLimit);
  if (error) throw new Error(`Impossible de charger le journal d’audit : ${error.message}`);
  return (data as AuditEntry[] | null) ?? [];
}
