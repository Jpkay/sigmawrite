"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();
const optionalBoundedText = (maximum: number) => z.union([
  z.string().trim().min(2).max(maximum),
  z.literal(""),
  z.null(),
]).optional().transform((value) => value || null);

const createSchoolInput = z.object({
  schoolName: z.string().trim().min(2).max(120),
  organizationId: z.union([uuid, z.literal(""), z.null()]).optional().transform((value) => value || null),
  organizationName: optionalBoundedText(160),
  city: optionalBoundedText(120),
  country: optionalBoundedText(120),
  curriculumType: z.enum(["national", "french", "ib", "cambridge", "other"]),
}).superRefine((value, context) => {
  if (Boolean(value.organizationId) === Boolean(value.organizationName)) {
    context.addIssue({
      code: "custom",
      message: "Choisissez une organisation existante ou indiquez le nom d’une nouvelle organisation.",
    });
  }
});

const classFields = {
  name: z.string().trim().min(2).max(100),
  gradeLevel: z.number().int().min(5).max(12),
  academicYear: z.string().trim().min(4).max(20),
};
const createClassInput = z.object({ schoolId: uuid, ...classFields });
const updateClassInput = z.object({ classId: uuid, ...classFields });
const updateSchoolInput = z.object({
  schoolId: uuid,
  name: z.string().trim().min(2).max(120),
  city: optionalBoundedText(120),
  country: optionalBoundedText(120),
});

function mutationError(message: string | undefined, fallback: string) {
  if (message?.includes("forbidden") || message?.includes("required")) {
    return new Error("Vous n’êtes pas autorisé à modifier cet établissement.");
  }
  if (message?.includes("not_found")) return new Error("L’établissement ou la classe est introuvable.");
  if (message?.includes("invalid_")) return new Error("Les informations saisies sont invalides.");
  return new Error(message || fallback);
}

export async function createSchool(input: unknown) {
  const session = await requireRole(["platform_admin"]);
  const parsed = createSchoolInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Informations d’établissement invalides.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_school_with_organization", {
    p_school_name: parsed.data.schoolName,
    p_organization_id: parsed.data.organizationId,
    p_organization_name: parsed.data.organizationName,
    p_city: parsed.data.city,
    p_country: parsed.data.country,
    p_curriculum_type: parsed.data.curriculumType,
  });
  if (error || !data) throw mutationError(error?.message, "L’établissement n’a pas pu être créé.");

  const schoolId = data as string;
  await logAudit("school.created", {
    targetType: "school",
    targetId: schoolId,
    metadata: { organizationId: parsed.data.organizationId, createdBy: session.id },
  });
  revalidatePath("/admin/schools");
  revalidatePath("/admin/users");
  return { schoolId };
}

export async function createSchoolClass(input: unknown) {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const parsed = createClassInput.safeParse(input);
  if (!parsed.success) throw new Error("Paramètres de classe invalides.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_school_class", {
    p_school_id: parsed.data.schoolId,
    p_name: parsed.data.name,
    p_grade_level: parsed.data.gradeLevel,
    p_academic_year: parsed.data.academicYear,
  });
  if (error || !data) throw mutationError(error?.message, "La classe n’a pas pu être créée.");

  const classId = data as string;
  await logAudit("class.created_by_school_admin", {
    targetType: "class",
    targetId: classId,
    metadata: { schoolId: parsed.data.schoolId, createdBy: session.id },
  });
  revalidatePath("/admin/schools");
  revalidatePath("/admin/users");
  revalidatePath("/teacher/classes");
  return { classId };
}

export async function updateSchool(input: unknown) {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const parsed = updateSchoolInput.safeParse(input);
  if (!parsed.success) throw new Error("Informations d’établissement invalides.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_school", {
    p_school_id: parsed.data.schoolId,
    p_name: parsed.data.name,
    p_city: parsed.data.city,
    p_country: parsed.data.country,
  });
  if (error || !data) throw mutationError(error?.message, "L’établissement n’a pas pu être mis à jour.");

  await logAudit("school.details_updated", {
    targetType: "school",
    targetId: data as string,
    metadata: { updatedBy: session.id },
  });
  revalidatePath("/admin/schools");
  revalidatePath("/admin/users");
  revalidatePath("/teacher/classes");
  return { schoolId: data as string };
}

export async function updateSchoolClass(input: unknown) {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const parsed = updateClassInput.safeParse(input);
  if (!parsed.success) throw new Error("Paramètres de classe invalides.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_school_class", {
    p_class_id: parsed.data.classId,
    p_name: parsed.data.name,
    p_grade_level: parsed.data.gradeLevel,
    p_academic_year: parsed.data.academicYear,
  });
  if (error || !data) throw mutationError(error?.message, "La classe n’a pas pu être mise à jour.");

  await logAudit("class.school_fields_updated", {
    targetType: "class",
    targetId: data as string,
    metadata: { updatedBy: session.id },
  });
  revalidatePath("/admin/schools");
  revalidatePath("/admin/users");
  revalidatePath("/teacher/classes");
  revalidatePath(`/teacher/classes/${data as string}`);
  return { classId: data as string };
}
