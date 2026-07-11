import { createClient } from "@/lib/supabase/server";
import { canSelfConsent } from "@/lib/consent";

export type JoinCodeInfo = {
  id: string;
  code: string;
  classId: string;
  expiresAt: string;
  maxUses: number;
  uses: number;
  schoolConsentEnabled: boolean;
};

export async function getActiveJoinCode(classId: string): Promise<JoinCodeInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("class_join_codes")
    .select("id,code,class_id,expires_at,max_uses,uses,school_consent_enabled")
    .eq("class_id", classId).is("revoked_at", null).gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? {
    id: data.id as string, code: data.code as string, classId: data.class_id as string,
    expiresAt: data.expires_at as string, maxUses: data.max_uses as number,
    uses: data.uses as number, schoolConsentEnabled: data.school_consent_enabled as boolean,
  } : null;
}

export type ConsentGate = {
  studentId: string;
  dateOfBirth: string | null;
  active: boolean;
  consentType: "guardian" | "school" | "student_over_15" | null;
  canSelfConsent: boolean;
};

export async function getStudentConsentGate(): Promise<ConsentGate | null> {
  const supabase = await createClient();
  const { data: student, error } = await supabase.from("students").select("id,date_of_birth").limit(1).maybeSingle();
  if (error || !student) return null;
  const { data: consent } = await supabase.from("consent_records")
    .select("consent_type").eq("student_id", student.id).is("revoked_at", null)
    .order("accepted_at", { ascending: false }).limit(1).maybeSingle();
  const dateOfBirth = student.date_of_birth as string | null;
  return {
    studentId: student.id as string,
    dateOfBirth,
    active: !!consent,
    consentType: (consent?.consent_type as ConsentGate["consentType"]) ?? null,
    canSelfConsent: canSelfConsent(dateOfBirth),
  };
}

export async function getPendingConsentChildren(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();
  const { data: links, error } = await supabase.from("student_guardians")
    .select("student_id,students(display_name)");
  if (error) return [];
  const ids = (links ?? []).map((row) => row.student_id as string);
  if (!ids.length) return [];
  const { data: active } = await supabase.from("consent_records")
    .select("student_id").in("student_id", ids).is("revoked_at", null);
  const activeIds = new Set((active ?? []).map((row) => row.student_id as string));
  return (links ?? []).flatMap((row) => {
    if (activeIds.has(row.student_id as string)) return [];
    const student = row.students as unknown as { display_name: string | null } | null;
    return [{ id: row.student_id as string, name: student?.display_name ?? "Votre enfant" }];
  });
}
