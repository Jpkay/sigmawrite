import { createClient } from "@/lib/supabase/server";

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

export type StudentAccessGate = {
  studentId: string;
  authorized: boolean;
  basis: "school_invitation" | "guardian" | "legacy_student_consent" | null;
};

export async function getStudentAccessGate(): Promise<StudentAccessGate> {
  const supabase = await createClient();
  const { data: student, error: studentError } = await supabase.from("students").select("id").limit(1).maybeSingle();
  if (studentError) throw new Error(studentError.message);
  if (!student) throw new Error("Profil élève introuvable.");
  const [authorization, enrollment, consent] = await Promise.all([
    supabase.rpc("student_access_is_authorized", { p_student_id: student.id }),
    supabase.from("enrollments").select("student_id").eq("student_id", student.id).eq("status", "active").limit(1).maybeSingle(),
    supabase.from("consent_records").select("consent_type").eq("student_id", student.id).is("revoked_at", null)
      .order("accepted_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (authorization.error || enrollment.error || consent.error) {
    throw new Error(authorization.error?.message ?? enrollment.error?.message ?? consent.error?.message);
  }
  const consentType = consent.data?.consent_type as "guardian" | "school" | "student_over_15" | undefined;
  return {
    studentId: student.id as string,
    authorized: authorization.data === true,
    basis: enrollment.data
      ? "school_invitation"
      : consentType === "guardian"
        ? "guardian"
        : consentType === "student_over_15"
          ? "legacy_student_consent"
          : consentType === "school"
            ? "school_invitation"
            : null,
  };
}

export async function getPendingConsentChildren(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();
  const { data: links, error } = await supabase.from("student_guardians")
    .select("student_id,students(display_name)");
  if (error) return [];
  const ids = (links ?? []).map((row) => row.student_id as string);
  if (!ids.length) return [];
  const [{ data: active, error: consentError }, { data: enrollments, error: enrollmentError }] = await Promise.all([
    supabase.from("consent_records").select("student_id").in("student_id", ids).is("revoked_at", null),
    supabase.from("enrollments").select("student_id").in("student_id", ids).eq("status", "active"),
  ]);
  if (consentError || enrollmentError) throw new Error(consentError?.message ?? enrollmentError?.message);
  const activeIds = new Set([
    ...(active ?? []).map((row) => row.student_id as string),
    ...(enrollments ?? []).map((row) => row.student_id as string),
  ]);
  return (links ?? []).flatMap((row) => {
    if (activeIds.has(row.student_id as string)) return [];
    const student = row.students as unknown as { display_name: string | null } | null;
    return [{ id: row.student_id as string, name: student?.display_name ?? "Votre enfant" }];
  });
}
