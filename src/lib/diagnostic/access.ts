import type { SupabaseClient } from "@supabase/supabase-js";

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
