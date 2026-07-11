import { ROLE_HOME, type Role } from "@/lib/types";

type InvitedUser = {
  invited_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

export function needsInvitedPasswordSetup(user: InvitedUser): boolean {
  return Boolean(user.invited_at) && user.user_metadata?.password_set !== true;
}

export function invitedUserHome(role: unknown): string {
  if (typeof role === "string" && role in ROLE_HOME) {
    return ROLE_HOME[role as Role];
  }
  return "/";
}

export function sessionTokensFromAuthFragment(fragment: string): { access_token: string; refresh_token: string } | null {
  const params = new URLSearchParams(fragment.startsWith("#") ? fragment.slice(1) : fragment);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  return { access_token: accessToken, refresh_token: refreshToken };
}
