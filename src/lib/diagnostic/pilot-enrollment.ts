import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import {
  DIAGNOSTIC_ITEM_BANK_RELEASE_KEY,
  DIAGNOSTIC_TAXONOMY_RELEASE_KEY,
} from "@/lib/diagnostic/protocol";

export const FEEDBACK_AGREEMENT_VERSION = "feedback-pilot-v1";
export type FeedbackAgreementSource = "student" | "guardian";
export type DiagnosticPilotCohortKind = "internal_test" | "feedback_participant";

export async function createDiagnosticPilotEnrollment(input: {
  studentId: string;
  enrolledBy: string;
  durationDays: number;
  note?: string | null;
  cohortKind: DiagnosticPilotCohortKind;
  feedbackAgreementSource?: FeedbackAgreementSource | null;
  feedbackAgreedAt?: string | null;
}) {
  const db = createServiceClient();
  const [{ data: taxonomy, error: taxonomyError }, { data: bank, error: bankError }] = await Promise.all([
    db.from("taxonomy_releases").select("id").eq("release_key", DIAGNOSTIC_TAXONOMY_RELEASE_KEY).in("status", ["validating", "published"]).maybeSingle(),
    db.from("diagnostic_item_bank_releases").select("id,taxonomy_release_id").eq("bank_key", DIAGNOSTIC_ITEM_BANK_RELEASE_KEY).in("status", ["draft", "validating"]).maybeSingle(),
  ]);
  if (taxonomyError || bankError) throw new Error(taxonomyError?.message ?? bankError?.message);
  if (!taxonomy || !bank || bank.taxonomy_release_id !== taxonomy.id) {
    throw new Error("La taxonomie et la banque pilote ne sont pas disponibles.");
  }
  const expiresAt = new Date(Date.now() + input.durationDays * 86_400_000).toISOString();
  const isFeedbackParticipant = input.cohortKind === "feedback_participant";
  const { data: enrollment, error } = await db.from("diagnostic_pilot_enrollments").insert({
    student_id: input.studentId,
    taxonomy_release_id: taxonomy.id,
    bank_release_id: bank.id,
    expires_at: expiresAt,
    enrolled_by: input.enrolledBy,
    note: input.note || null,
    cohort_kind: input.cohortKind,
    feedback_agreement_source: isFeedbackParticipant ? input.feedbackAgreementSource : null,
    feedback_agreement_version: isFeedbackParticipant ? FEEDBACK_AGREEMENT_VERSION : null,
    feedback_agreed_at: isFeedbackParticipant ? input.feedbackAgreedAt : null,
  }).select("id").single();
  if (error || !enrollment) {
    if (error?.code === "23505") throw new Error("Cet élève possède déjà un accès pilote actif.");
    if (error?.message.includes("feedback_agreement_source_ineligible")) {
      throw new Error("Un élève de moins de 15 ans doit avoir l’accord de son responsable pour participer au pilote de feedback.");
    }
    throw new Error(error?.message ?? "Inscription pilote impossible.");
  }
  return { enrollmentId: enrollment.id as string, expiresAt };
}
