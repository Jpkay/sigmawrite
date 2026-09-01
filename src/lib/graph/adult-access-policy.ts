import type { SessionProfile } from "@/lib/auth";
import type { StudentRow } from "@/lib/reports";
import type { Role } from "@/lib/types";
import type { AdultGraphAudience } from "./adult-presentation";

type AdultGraphAccessDependencies<Frontier> = {
  guard: (roles: Role[]) => Promise<SessionProfile>;
  findViewableStudent: (studentId: string) => Promise<StudentRow | null>;
  loadGraph: (studentId: string) => Promise<Frontier>;
};

export async function loadAdultStudentGraphWith<Frontier>(
  studentId: string,
  audience: AdultGraphAudience,
  dependencies: AdultGraphAccessDependencies<Frontier>,
) {
  const roles: Role[] = audience === "parent" ? ["parent"] : ["teacher", "supervisor", "school_admin"];
  await dependencies.guard(roles);
  const student = await dependencies.findViewableStudent(studentId);
  if (!student) return null;
  const frontier = await dependencies.loadGraph(student.id);
  return { student, frontier };
}
