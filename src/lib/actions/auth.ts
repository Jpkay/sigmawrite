"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isInternalAuthEmail, USERNAME_PATTERN } from "@/lib/user-credentials";
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

async function enforceAuthRateLimit(identifier: string) {
  const db = await createClient();
  const { data, error } = await db.rpc("consume_auth_attempt", {
    p_subject_hash: subjectHash(identifier),
  });
  const rate = Array.isArray(data) ? data[0] : data;
  if (error) throw new Error("Service d’authentification momentanément indisponible.");
  if (!rate?.allowed) throw new Error("Trop de tentatives. Attendez quelques minutes avant de réessayer.");
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
