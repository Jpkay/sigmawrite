import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fulfillDeletionRequests } from "@/lib/jobs";

loadEnv({ path: process.env.DEMO_ENV_FILE ?? ".env.staging", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const expectedRef = process.env.SUPABASE_PROJECT_REF;
if (!url || !key || !expectedRef) throw new Error("Staging environment is required");
if (new URL(url).hostname.split(".")[0] !== expectedRef) throw new Error("Refusing to run outside the named staging project");

const db = createClient(url, key, { auth: { persistSession: false } });
const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const email = `deletion-check-${suffix}@reading-to-learn.test`;
const { data: created, error: createError } = await db.auth.admin.createUser({
  email,
  password: crypto.randomUUID(),
  email_confirm: true,
  user_metadata: { role: "student", display_name: "Deletion Check" },
});
if (createError || !created.user) throw new Error(createError?.message ?? "Throwaway account not created");

const userId = created.user.id;
let requestId: string | null = null;
try {
  const { data: profile, error: profileError } = await db.from("profiles").select("id").eq("auth_user_id", userId).single();
  if (profileError || !profile) throw new Error(profileError?.message ?? "Profile trigger failed");
  const { data: student, error: studentError } = await db.from("students").select("id").eq("profile_id", profile.id).single();
  if (studentError || !student) throw new Error(studentError?.message ?? "Student trigger failed");
  const { data: request, error: requestError } = await db.from("deletion_requests").insert({
    student_id: student.id,
    student_auth_user_id: userId,
    scheduled_for: new Date(Date.now() - 1_000).toISOString(),
  }).select("id").single();
  if (requestError || !request) throw new Error(requestError?.message ?? "Deletion request not queued");
  requestId = request.id as string;

  const processed = await fulfillDeletionRequests(db);
  const [{ data: requestAfter }, { data: studentAfter }, authAfter] = await Promise.all([
    db.from("deletion_requests").select("status,student_id,completed_at").eq("id", requestId).single(),
    db.from("students").select("id").eq("id", student.id).maybeSingle(),
    db.auth.admin.getUserById(userId),
  ]);
  const verified = processed >= 1
    && requestAfter?.status === "completed"
    && requestAfter.student_id === null
    && !!requestAfter.completed_at
    && !studentAfter
    && !authAfter.data.user;
  if (!verified) throw new Error("Deletion job did not remove the complete account graph");
  console.log(JSON.stringify({ ok: true, processed, requestStatus: requestAfter.status, studentRemoved: true, authUserRemoved: true }));
} finally {
  const { data } = await db.auth.admin.getUserById(userId);
  if (data.user) await db.auth.admin.deleteUser(userId);
  if (requestId) await db.from("deletion_requests").delete().eq("id", requestId);
}
