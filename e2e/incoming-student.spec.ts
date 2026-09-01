import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.E2E_INCOMING_STUDENT === "true";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("incoming invited student", () => {
  test.skip(!enabled || !supabaseUrl || !anonKey || !serviceRoleKey, "requires an isolated Supabase project and E2E_INCOMING_STUDENT=true");
  test.describe.configure({ mode: "serial" });

  let service: SupabaseClient;
  const runKey = randomUUID().replaceAll("-", "").slice(0, 10);
  const organizationId = randomUUID();
  const schoolId = randomUUID();
  const firstClassId = randomUUID();
  const secondClassId = randomUUID();
  const firstCode = `SW-${runKey.slice(0, 6).toUpperCase()}`;
  const secondCode = `SW-${runKey.slice(4, 10).toUpperCase()}`;
  const firstEmail = `incoming-${runKey}@test.local`;
  const firstUsername = `incoming.${runKey}`;
  const secondEmail = `switch-${runKey}@test.local`;
  const secondUsername = `switch.${runKey}`;
  const password = "Incoming-Student-2026!";
  const createdAuthUserIds: string[] = [];

  test.beforeAll(async () => {
    service = createClient(supabaseUrl!, serviceRoleKey!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: organizationError } = await service.from("organizations").insert({ id: organizationId, name: `E2E ${runKey}`, type: "school" });
    if (organizationError) throw organizationError;
    const { error: schoolError } = await service.from("schools").insert({ id: schoolId, organization_id: organizationId, name: `École E2E ${runKey}` });
    if (schoolError) throw schoolError;
    const { error: classError } = await service.from("classes").insert([
      { id: firstClassId, school_id: schoolId, name: "Classe invitée 8", grade_level: 8, academic_year: "2026-2027" },
      { id: secondClassId, school_id: schoolId, name: "Classe invitée 6", grade_level: 6, academic_year: "2026-2027" },
    ]);
    if (classError) throw classError;
    const { error: codeError } = await service.from("class_join_codes").insert([
      { code: firstCode, class_id: firstClassId, expires_at: new Date(Date.now() + 3_600_000).toISOString(), max_uses: 3 },
      { code: secondCode, class_id: secondClassId, expires_at: new Date(Date.now() + 3_600_000).toISOString(), max_uses: 3 },
    ]);
    if (codeError) throw codeError;
    const anonymous = createClient(supabaseUrl!, anonKey!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: invitation, error: invitationError } = await anonymous.rpc("validate_class_join_code", { p_code: firstCode });
    if (invitationError) throw invitationError;
    expect(invitation?.[0]).toMatchObject({ class_name: "Classe invitée 8", school_name: `École E2E ${runKey}` });

    const { data: second, error: secondError } = await service.auth.admin.createUser({
      email: secondEmail,
      password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        display_name: "Deuxième élève",
        username: secondUsername,
        date_of_birth: "2014-02-03",
        join_code: secondCode,
      },
    });
    if (secondError || !second.user) throw secondError ?? new Error("Second student was not created");
    createdAuthUserIds.push(second.user.id);
  });

  test.afterAll(async () => {
    const { data: users } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const user of users.users) {
      if ([firstEmail, secondEmail].includes(user.email ?? "")) createdAuthUserIds.push(user.id);
    }
    for (const authUserId of new Set(createdAuthUserIds)) await service.auth.admin.deleteUser(authUserId);
    await service.from("class_join_codes").delete().in("code", [firstCode, secondCode]);
    await service.from("classes").delete().in("id", [firstClassId, secondClassId]);
    await service.from("schools").delete().eq("id", schoolId);
    await service.from("organizations").delete().eq("id", organizationId);
  });

  test("a younger invitee proceeds immediately, keeps the class grade, and cannot leak state to the next account", async ({ page }) => {
    await page.goto("/join");
    await page.getByLabel("Code de classe").fill(firstCode);
    await page.getByRole("button", { name: "Vérifier le code" }).click();
    await expect(page.getByText("Invitation validée : ton accès sera actif dès la création du compte.")).toBeVisible();

    await page.getByLabel("Ton nom").fill("Élève invité");
    await page.getByLabel("Date de naissance").fill("2013-01-02");
    await page.getByLabel("Nom d’utilisateur").fill(firstUsername);
    await page.getByLabel("Ton e-mail").fill(firstEmail);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page).toHaveURL(/\/student\/onboarding/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Bienvenue 👋" })).toBeVisible();
    await expect(page.getByText("Accès en attente")).toHaveCount(0);
    await expect(page.getByText("Invitation inactive")).toHaveCount(0);
    const grade = page.getByLabel("Ta classe");
    await expect(grade).toHaveValue("8");
    await expect(grade).toBeDisabled();

    await page.getByRole("button", { name: /Continuer/ }).click();
    for (const interest of ["Football", "Musique", "Technologie"]) {
      await page.getByRole("button", { name: new RegExp(interest) }).click();
    }
    await page.getByRole("button", { name: /Commencer le diagnostic/ }).click();
    await expect(page).toHaveURL(/\/student\/diagnostic/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Diagnostic adaptatif" })).toBeVisible();

    const { data: users } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const firstAuthUser = users.users.find((user) => user.email === firstEmail);
    expect(firstAuthUser).toBeDefined();
    createdAuthUserIds.push(firstAuthUser!.id);
    const { data: profile } = await service.from("profiles").select("id").eq("auth_user_id", firstAuthUser!.id).single();
    const { data: student } = await service.from("students").select("id,current_grade,onboarding_completed_at").eq("profile_id", profile!.id).single();
    expect(student!.current_grade).toBe(8);
    expect(student!.onboarding_completed_at).toBeTruthy();
    const { data: goal, error: goalError } = await service.from("learning_goals").select("scope").eq("student_id", student!.id).eq("status", "active").single();
    expect(goalError).toBeNull();
    expect((goal!.scope as { modalities: string[] }).modalities).toEqual(["reading", "writing", "grammar_analysis"]);
    const [enrollments, authorizations, savedInterests] = await Promise.all([
      service.from("enrollments").select("student_id", { count: "exact", head: true }).eq("student_id", student!.id).eq("class_id", firstClassId).eq("status", "active"),
      service.from("consent_records").select("id", { count: "exact", head: true }).eq("student_id", student!.id).eq("consent_type", "school").is("revoked_at", null),
      service.from("student_interests").select("student_id", { count: "exact", head: true }).eq("student_id", student!.id),
    ]);
    expect(enrollments.error).toBeNull();
    expect(authorizations.error).toBeNull();
    expect(savedInterests.error).toBeNull();
    expect(enrollments.count).toBe(1);
    expect(authorizations.count).toBe(1);
    expect(savedInterests.count).toBe(3);

    await page.getByRole("button", { name: "Se déconnecter" }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("E-mail ou nom d’utilisateur").fill(secondUsername);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page).toHaveURL(/\/student\/onboarding/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Bienvenue 👋" })).toBeVisible();
    await expect(page.getByLabel("Ta classe")).toHaveValue("6");
  });
});
