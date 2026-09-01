import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireStudentAccessAuthorized(
  db: SupabaseClient,
  studentId: string,
) {
  const { data, error } = await db.rpc("student_access_is_authorized", {
    p_student_id: studentId,
  });
  if (error) throw new Error("La vérification de ton invitation a échoué. Réessaie.");
  if (data !== true) {
    throw new Error("Ton invitation n’est pas active. Demande à ton enseignant ou à ton responsable de vérifier ton inscription.");
  }
}

export async function requireStudentLearningUnlocked(
  db: SupabaseClient,
  studentId: string,
) {
  const { data, error } = await db.rpc("student_learning_is_unlocked", {
    p_student_id: studentId,
  });
  if (error) throw new Error("La vérification du diagnostic a échoué. Réessaie.");
  if (data !== true) {
    throw new Error("Termine d’abord le diagnostic adaptatif pour débloquer ton parcours.");
  }
}
