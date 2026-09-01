import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import {
  generateTemporaryPassword,
  internalAuthEmail,
  isInternalAuthEmail,
  normalizeRequestedUsername,
  usernameBase,
} from "@/lib/user-credentials";

export type ManagedAccountRole = "student" | "teacher" | "supervisor";

export type ProvisionedCredentials = {
  authUserId: string;
  profileId: string;
  studentId: string | null;
  username: string;
  temporaryPassword: string;
  email: string | null;
  emailDelivered: boolean;
};

type ProvisionManagedAccountInput = {
  role: ManagedAccountRole;
  displayName: string;
  requestedUsername?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  grade?: number | null;
  provisionedByProfileId: string;
  deliverEmail?: boolean;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

async function availableUsername(displayName: string, requested?: string | null): Promise<string> {
  const service = createServiceClient();
  if (requested?.trim()) {
    const username = normalizeRequestedUsername(requested);
    const { data, error } = await service.from("profiles").select("id").eq("username", username).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) throw new Error("Ce nom d’utilisateur est déjà utilisé.");
    return username;
  }

  const base = usernameBase(displayName);
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const ending = suffix === 0 ? "" : `.${suffix + 1}`;
    const username = `${base.slice(0, 32 - ending.length)}${ending}`;
    const { data, error } = await service.from("profiles").select("id").eq("username", username).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return username;
  }
  throw new Error("Impossible de générer un nom d’utilisateur unique.");
}

async function deliverCredentials(input: {
  email: string | null;
  displayName: string;
  username: string;
  temporaryPassword: string;
}): Promise<boolean> {
  if (!input.email) return false;
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""}/login`;
  try {
    const result = await sendEmail({
      to: input.email,
      subject: "Vos identifiants temporaires Plume",
      html: `<p>Bonjour ${escapeHtml(input.displayName)},</p><p>Votre compte Plume est prêt.</p><p><strong>Nom d’utilisateur :</strong> ${escapeHtml(input.username)}<br><strong>Mot de passe temporaire :</strong> ${escapeHtml(input.temporaryPassword)}</p><p>Connectez-vous${loginUrl === "/login" ? "" : ` sur <a href="${escapeHtml(loginUrl)}">Plume</a>`}. Vous devrez choisir un nouveau mot de passe avant d’accéder à votre espace.</p><p>Si vous n’attendiez pas ce message, contactez votre établissement.</p>`,
      text: `Bonjour ${input.displayName},\n\nVotre compte Plume est prêt.\n\nNom d’utilisateur : ${input.username}\nMot de passe temporaire : ${input.temporaryPassword}\n\nConnectez-vous${loginUrl === "/login" ? "." : ` sur ${loginUrl}.`} Vous devrez choisir un nouveau mot de passe avant d’accéder à votre espace.\n\nSi vous n’attendiez pas ce message, contactez votre établissement.`,
    });
    return result.sent;
  } catch {
    return false;
  }
}

export async function provisionManagedAccount(input: ProvisionManagedAccountInput): Promise<ProvisionedCredentials> {
  const service = createServiceClient();
  const username = await availableUsername(input.displayName, input.requestedUsername);
  const email = input.email?.trim().toLowerCase() || null;
  const authEmail = email ?? internalAuthEmail();
  const temporaryPassword = generateTemporaryPassword();
  const triggerRole = input.role === "supervisor" ? "parent" : input.role;
  const { data: created, error: authError } = await service.auth.admin.createUser({
    email: authEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      role: triggerRole,
      display_name: input.displayName,
      date_of_birth: input.dateOfBirth ?? null,
      password_set: false,
    },
  });
  if (authError || !created.user) throw new Error(authError?.message ?? "Le compte n’a pas pu être créé.");

  try {
    const { error: metadataError } = await service.auth.admin.updateUserById(created.user.id, {
      user_metadata: {
        ...created.user.user_metadata,
        role: input.role,
        display_name: input.displayName,
        username,
        password_set: false,
      },
    });
    if (metadataError) throw new Error(metadataError.message);

    const { data: profile, error: profileError } = await service.from("profiles").update({
      role: input.role,
      display_name: input.displayName,
      username,
      must_change_password: true,
      email_recovery_enabled: Boolean(email),
      provisioned_by_profile_id: input.provisionedByProfileId,
    }).eq("auth_user_id", created.user.id).select("id").single();
    if (profileError || !profile) throw new Error(profileError?.message ?? "Le profil n’a pas pu être créé.");

    let studentId: string | null = null;
    if (input.role === "student") {
      const { data: student, error: studentError } = await service.from("students").update({
        display_name: input.displayName,
        date_of_birth: input.dateOfBirth ?? null,
        current_grade: input.grade ?? null,
      }).eq("profile_id", profile.id).select("id").single();
      if (studentError || !student) throw new Error(studentError?.message ?? "Le dossier élève n’a pas pu être créé.");
      studentId = student.id as string;
    }

    const emailDelivered = input.deliverEmail === false ? false : await deliverCredentials({ email, displayName: input.displayName, username, temporaryPassword });
    return {
      authUserId: created.user.id,
      profileId: profile.id as string,
      studentId,
      username,
      temporaryPassword,
      email,
      emailDelivered,
    };
  } catch (error) {
    await service.auth.admin.deleteUser(created.user.id);
    throw error;
  }
}

export async function deliverProvisionedCredentials(
  credentials: Pick<ProvisionedCredentials, "email" | "username" | "temporaryPassword">,
  displayName: string,
): Promise<boolean> {
  return deliverCredentials({ ...credentials, displayName });
}

export async function rotateManagedPassword(profileId: string): Promise<Omit<ProvisionedCredentials, "studentId">> {
  const service = createServiceClient();
  const { data: profile, error: profileError } = await service.from("profiles")
    .select("id,auth_user_id,display_name,username,email_recovery_enabled")
    .eq("id", profileId).single();
  if (profileError || !profile) throw new Error("Compte introuvable.");

  const { data: authData, error: authError } = await service.auth.admin.getUserById(profile.auth_user_id as string);
  if (authError || !authData.user) throw new Error(authError?.message ?? "Compte introuvable.");
  const temporaryPassword = generateTemporaryPassword();
  const { error: updateError } = await service.auth.admin.updateUserById(authData.user.id, {
    password: temporaryPassword,
    user_metadata: { ...authData.user.user_metadata, password_set: false },
  });
  if (updateError) throw new Error(updateError.message);
  const { error: markerError } = await service.from("profiles").update({ must_change_password: true }).eq("id", profile.id);
  if (markerError) throw new Error(markerError.message);

  const authEmail = authData.user.email ?? null;
  const email = profile.email_recovery_enabled && !isInternalAuthEmail(authEmail) ? authEmail : null;
  const emailDelivered = await deliverCredentials({
    email,
    displayName: (profile.display_name as string | null) ?? (profile.username as string),
    username: profile.username as string,
    temporaryPassword,
  });
  return {
    authUserId: authData.user.id,
    profileId: profile.id as string,
    username: profile.username as string,
    temporaryPassword,
    email,
    emailDelivered,
  };
}
