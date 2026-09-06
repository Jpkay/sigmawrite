"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { internalAuthEmail, isInternalAuthEmail, USERNAME_PATTERN } from "@/lib/user-credentials";
import { ROLE_HOME, type Role } from "@/lib/types";

const loginInput = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(128),
  captchaToken: z.string().min(1).max(4096).nullable().optional(),
  next: z.string().max(1000).nullable().optional(),
});

const recoveryInput = z.object({
  identifier: z.string().trim().min(3).max(254),
  captchaToken: z.string().min(1).max(4096).nullable().optional(),
});

const passwordInput = z.object({
  password: z.string().min(12).max(128),
  confirmation: z.string().min(12).max(128),
}).refine((value) => value.password === value.confirmation, {
  message: "Les deux mots de passe ne correspondent pas.",
  path: ["confirmation"],
});

function subjectHash(identifier: string): string {
  return createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex");
}

async function clientAddress(): Promise<string | null> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || null;
}

/** Per-identifier and per-address budgets (audit 2026-09-06): one user cannot be locked out by name alone, and one address cannot spray many names. */
async function enforceAuthRateLimit(identifier: string) {
  const db = await createClient();
  const address = await clientAddress();
  const subjects = [subjectHash(identifier), ...(address ? [subjectHash(`ip:${address}`)] : [])];
  for (const subject of subjects) {
    const { data, error } = await db.rpc("consume_auth_attempt", { p_subject_hash: subject });
    const rate = Array.isArray(data) ? data[0] : data;
    if (error) throw new Error("Service d’authentification momentanément indisponible.");
    if (!rate?.allowed) throw new Error("Trop de tentatives. Attendez quelques minutes avant de réessayer.");
  }
}

/**
 * Independent Turnstile check; a no-op unless TURNSTILE_SECRET_KEY is set.
 * Turnstile tokens are single-use, so when the Supabase project verifies the
 * captcha itself set SUPABASE_CAPTCHA_ENABLED=true and this check steps aside.
 */
async function verifyTurnstile(token: string | null | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || process.env.SUPABASE_CAPTCHA_ENABLED === "true") return;
  if (!token) throw new Error("Terminez la vérification anti-robot.");
  const address = await clientAddress();
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret, response: token, remoteip: address ?? undefined }) });
  const result = (await response.json().catch(() => ({}))) as { success?: boolean };
  if (!result.success) throw new Error("La vérification anti-robot a échoué. Réessayez.");
}

async function emailForIdentifier(identifier: string): Promise<string | null> {
  const normalized = identifier.trim().toLowerCase();
  if (normalized.includes("@")) return normalized;
  if (!USERNAME_PATTERN.test(normalized)) return null;
  const service = createServiceClient();
  const { data: profile, error } = await service.from("profiles")
    .select("auth_user_id")
    .eq("username", normalized)
    .maybeSingle();
  if (error || !profile) return null;
  const { data, error: userError } = await service.auth.admin.getUserById(profile.auth_user_id as string);
  if (userError || !data.user?.email) return null;
  return data.user.email.toLowerCase();
}

export async function loginWithPassword(input: unknown): Promise<{ redirectTo: string }> {
  const parsed = loginInput.safeParse(input);
  if (!parsed.success) throw new Error("Identifiant ou mot de passe invalide.");
  const identifier = parsed.data.identifier.trim().toLowerCase();
  await enforceAuthRateLimit(identifier);
  await verifyTurnstile(parsed.data.captchaToken);
  const email = await emailForIdentifier(identifier);
  if (!email) throw new Error("Identifiant ou mot de passe incorrect.");

  const db = await createClient();
  const { data, error } = await db.auth.signInWithPassword({
    email,
    password: parsed.data.password,
    options: { captchaToken: parsed.data.captchaToken ?? undefined },
  });
  if (error || !data.user) throw new Error("Identifiant ou mot de passe incorrect.");
  const { data: profile } = await db.from("profiles")
    .select("role,must_change_password")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  const role = profile?.role as Role | undefined;
  if (!role || !(role in ROLE_HOME)) {
    await db.auth.signOut();
    throw new Error("Ce compte n’a pas de profil actif.");
  }
  if (profile?.must_change_password) return { redirectTo: "/set-password?first=1" };
  return { redirectTo: safeAuthRedirect(parsed.data.next, ROLE_HOME[role]) };
}

async function applicationOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host || !/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) throw new Error("URL de l’application non configurée.");
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https" ? forwardedProtocol : host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function requestPasswordRecovery(input: unknown): Promise<{ message: string }> {
  const parsed = recoveryInput.safeParse(input);
  if (!parsed.success) throw new Error("Saisissez un e-mail ou un nom d’utilisateur valide.");
  const identifier = parsed.data.identifier.trim().toLowerCase();
  await enforceAuthRateLimit(identifier);

  let email: string | null = null;
  if (identifier.includes("@")) {
    email = identifier;
  } else if (USERNAME_PATTERN.test(identifier)) {
    const service = createServiceClient();
    const { data: profile } = await service.from("profiles")
      .select("auth_user_id,email_recovery_enabled")
      .eq("username", identifier)
      .maybeSingle();
    if (profile?.email_recovery_enabled) {
      const { data } = await service.auth.admin.getUserById(profile.auth_user_id as string);
      if (!isInternalAuthEmail(data.user?.email)) email = data.user?.email ?? null;
    }
  }

  if (email) {
    const origin = await applicationOrigin();
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/set-password?recovery=1")}`;
    const { error } = await (await createClient()).auth.resetPasswordForEmail(email, {
      redirectTo,
      captchaToken: parsed.data.captchaToken ?? undefined,
    });
    if (error) throw new Error("Le lien n’a pas pu être envoyé. Réessayez dans quelques minutes.");
  }

  return {
    message: "Si ce compte possède un e-mail de récupération, un lien sécurisé vient d’être envoyé. Sinon, demandez un nouveau mot de passe temporaire à votre enseignant ou administrateur.",
  };
}

export async function completePasswordSetup(input: unknown): Promise<{ redirectTo: string }> {
  const parsed = passwordInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Mot de passe invalide.");
  const db = await createClient();
  const { data: current, error: userError } = await db.auth.getUser();
  if (userError || !current.user) throw new Error("Votre session a expiré. Reconnectez-vous.");
  const { error: updateError } = await db.auth.updateUser({
    password: parsed.data.password,
    data: { ...current.user.user_metadata, password_set: true },
  });
  if (updateError) throw new Error(updateError.message);

  const service = createServiceClient();
  const { data: profile, error: profileError } = await service.from("profiles")
    .update({ must_change_password: false })
    .eq("auth_user_id", current.user.id)
    .select("role")
    .single();
  if (profileError || !profile) throw new Error("Le mot de passe est enregistré, mais le profil n’a pas pu être activé. Réessayez.");
  const role = profile.role as Role;
  return { redirectTo: ROLE_HOME[role] ?? "/" };
}

// ---------------------------------------------------------------------------
// Class join without an e-mail address (audit 2026-09-06, P0): the student
// chooses a username and password; the join code is validated server-side
// and the sign-up trigger enrols the account exactly as the e-mail path does.
// ---------------------------------------------------------------------------

const joinWithoutEmailInput = z.object({
  code: z.string().trim().min(6).max(20),
  displayName: z.string().trim().min(2).max(120),
  username: z.string().trim().toLowerCase().regex(USERNAME_PATTERN),
  dateOfBirth: z.string().date(),
  password: z.string().min(12).max(200),
  captchaToken: z.string().optional().nullable(),
});

export async function joinClassWithoutEmail(input: unknown): Promise<{ username: string; signedIn: boolean }> {
  const parsed = joinWithoutEmailInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Informations invalides.");
  const data = parsed.data;
  await enforceAuthRateLimit(`join:${data.username}`);
  await verifyTurnstile(data.captchaToken);
  const service = createServiceClient();
  const { data: codes, error: codeError } = await service.rpc("validate_class_join_code", { p_code: data.code.toUpperCase() });
  if (codeError || !(Array.isArray(codes) ? codes[0] : codes)) throw new Error("Ce code est invalide, expiré ou complet.");
  const { data: taken } = await service.from("profiles").select("id").ilike("username", data.username).maybeSingle();
  if (taken) throw new Error("Ce nom d’utilisateur est déjà pris. Choisis-en un autre.");
  const authEmail = internalAuthEmail();
  const { data: created, error } = await service.auth.admin.createUser({
    email: authEmail,
    password: data.password,
    email_confirm: true,
    user_metadata: { role: "student", display_name: data.displayName, username: data.username, date_of_birth: data.dateOfBirth, join_code: data.code.toUpperCase(), password_set: true },
  });
  if (error || !created.user) {
    const message = error?.message ?? "";
    throw new Error(/join_code/u.test(message) ? "Ce code est invalide, expiré ou complet." : /username|duplicate/u.test(message) ? "Ce nom d’utilisateur est déjà pris." : "Le compte n’a pas pu être créé.");
  }
  // Sign the new student in through the cookie-backed server client so no second captcha is needed.
  const db = await createClient();
  const { error: signInError } = await db.auth.signInWithPassword({ email: authEmail, password: data.password, options: { captchaToken: data.captchaToken ?? undefined } });
  return { username: data.username, signedIn: !signInError };
}
