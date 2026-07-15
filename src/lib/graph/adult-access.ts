import { requireRole } from "@/lib/auth";
import { getStudentRow } from "@/lib/db/dashboard";
import { frontierForStudent } from "@/lib/diagnostic/live";
import { createClient } from "@/lib/supabase/server";
import type { AdultGraphAudience } from "./adult-presentation";
import { loadAdultStudentGraphWith } from "./adult-access-policy";

export async function loadAdultStudentGraph(studentId: string, audience: AdultGraphAudience) {
  return loadAdultStudentGraphWith(studentId, audience, {
    guard: requireRole,
    findViewableStudent: getStudentRow,
    loadGraph: async (viewableStudentId) => frontierForStudent(viewableStudentId, await createClient()),
  });
}
