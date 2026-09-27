import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  headerGet: vi.fn(),
  rateLimit: vi.fn(),
  serviceProfile: vi.fn(),
  getUserById: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  sessionProfile: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => ({ get: f.headerGet }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: f.rateLimit,
    auth: { signInWithPassword: f.signIn, signOut: f.signOut },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: f.sessionProfile }),
      }),
    }),
  }),
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: f.serviceProfile }),
      }),
    }),
    auth: { admin: { getUserById: f.getUserById } },
  }),
}));

import { loginWithPassword } from "./auth";

const input = {
  identifier: "qa.admin",
  password: "temporary-password",
  captchaToken: "turnstile-token",
  next: null,
};
const previousSecret = process.env.TURNSTILE_SECRET_KEY;
const previousSupabaseCaptcha = process.env.SUPABASE_CAPTCHA_ENABLED;

describe("password login result boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.SUPABASE_CAPTCHA_ENABLED;
    f.headerGet.mockReturnValue(null);
    f.rateLimit.mockResolvedValue({ data: [{ allowed: true }], error: null });
    f.serviceProfile.mockResolvedValue({ data: { auth_user_id: "auth-user" }, error: null });
    f.getUserById.mockResolvedValue({ data: { user: { email: "admin@example.test" } }, error: null });
    f.signIn.mockResolvedValue({ data: { user: { id: "auth-user" } }, error: null });
    f.sessionProfile.mockResolvedValue({ data: { role: "school_admin", must_change_password: true }, error: null });
    f.signOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = previousSecret;
    if (previousSupabaseCaptcha === undefined) delete process.env.SUPABASE_CAPTCHA_ENABLED;
    else process.env.SUPABASE_CAPTCHA_ENABLED = previousSupabaseCaptcha;
    vi.unstubAllGlobals();
  });

  it("returns an expected validation error instead of rejecting the Server Action", async () => {
    await expect(loginWithPassword({ ...input, identifier: "x" })).resolves.toEqual({
      ok: false,
      error: "Identifiant ou mot de passe invalide.",
    });
    expect(f.rateLimit).not.toHaveBeenCalled();
  });

  it("returns an expected credentials error when password authentication fails", async () => {
    f.signIn.mockResolvedValue({ data: { user: null }, error: new Error("invalid credentials") });

    await expect(loginWithPassword(input)).resolves.toEqual({
      ok: false,
      error: "Identifiant ou mot de passe incorrect.",
    });
  });

  it("maps a Supabase CAPTCHA rejection without exposing its provider message", async () => {
    f.signIn.mockResolvedValue({
      data: { user: null },
      error: { code: "captcha_failed", message: "provider response with internal detail" },
    });

    await expect(loginWithPassword(input)).resolves.toEqual({
      ok: false,
      error: "La vérification anti-robot a échoué. Réessayez.",
    });
  });

  it("returns an expected Turnstile error without attempting account lookup", async () => {
    process.env.TURNSTILE_SECRET_KEY = "configured-secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: false }) }));

    await expect(loginWithPassword(input)).resolves.toEqual({
      ok: false,
      error: "La vérification anti-robot a échoué. Réessayez.",
    });
    expect(f.serviceProfile).not.toHaveBeenCalled();
    expect(f.signIn).not.toHaveBeenCalled();
  });

  it("does not return a raw unexpected Turnstile network exception", async () => {
    process.env.TURNSTILE_SECRET_KEY = "configured-secret";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private upstream network detail")));

    const outcome = await loginWithPassword(input).then(
      (value) => ({ kind: "returned" as const, value }),
      () => ({ kind: "thrown" as const }),
    );
    expect(outcome).toEqual({ kind: "thrown" });
    expect(f.serviceProfile).not.toHaveBeenCalled();
    expect(f.signIn).not.toHaveBeenCalled();
  });

  it("does not turn an unexpected rate-limit RPC exception into a returned message", async () => {
    f.rateLimit.mockRejectedValue(new Error("private database connection detail"));

    const outcome = await loginWithPassword(input).then(
      (value) => ({ kind: "returned" as const, value }),
      () => ({ kind: "thrown" as const }),
    );
    expect(outcome).toEqual({ kind: "thrown" });
    expect(f.serviceProfile).not.toHaveBeenCalled();
  });

  it("returns the fixed rate-limit message without resolving the account", async () => {
    f.rateLimit.mockResolvedValue({ data: [{ allowed: false }], error: null });

    await expect(loginWithPassword(input)).resolves.toEqual({
      ok: false,
      error: "Trop de tentatives. Attendez quelques minutes avant de réessayer.",
    });
    expect(f.serviceProfile).not.toHaveBeenCalled();
    expect(f.signIn).not.toHaveBeenCalled();
  });

  it("returns the first-login destination for a valid managed account", async () => {
    await expect(loginWithPassword(input)).resolves.toEqual({
      ok: true,
      redirectTo: "/set-password?first=1",
    });
    expect(f.signIn).toHaveBeenCalledWith({
      email: "admin@example.test",
      password: input.password,
      options: { captchaToken: input.captchaToken },
    });
  });

  it("returns a fixed inactive-profile message and clears the new session", async () => {
    f.sessionProfile.mockResolvedValue({ data: null, error: null });

    await expect(loginWithPassword(input)).resolves.toEqual({
      ok: false,
      error: "Ce compte n’a pas de profil actif.",
    });
    expect(f.signOut).toHaveBeenCalledOnce();
  });

  it("returns a normal role destination after password rotation", async () => {
    f.sessionProfile.mockResolvedValue({ data: { role: "teacher", must_change_password: false }, error: null });

    await expect(loginWithPassword({ ...input, next: "/teacher/classes" })).resolves.toEqual({
      ok: true,
      redirectTo: "/teacher/classes",
    });
  });

  describe("delegated Supabase CAPTCHA", () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = "configured-secret";
      process.env.SUPABASE_CAPTCHA_ENABLED = "true";
      vi.stubGlobal("fetch", vi.fn());
    });

    it("passes the original token once and preserves mandatory first-password routing", async () => {
      f.headerGet.mockImplementation((name) => name === "x-forwarded-for" ? "192.0.2.1" : null);
      await expect(loginWithPassword({ ...input, next: "/teacher" })).resolves.toEqual({
        ok: true, redirectTo: "/set-password?first=1",
      });
      expect(fetch).not.toHaveBeenCalled();
      expect(f.signIn).toHaveBeenCalledExactlyOnceWith({
        email: "admin@example.test", password: input.password,
        options: { captchaToken: input.captchaToken },
      });
      expect(f.rateLimit).toHaveBeenCalledTimes(2);
      expect(f.rateLimit.mock.invocationCallOrder[1]).toBeLessThan(f.signIn.mock.invocationCallOrder[0]);
    });

    it.each(["turnstile-token", null])("blocks provider rejection with token %s", async (captchaToken) => {
      f.signIn.mockResolvedValue({ data: { user: null }, error: { code: "captcha_failed", message: "private provider detail" } });
      await expect(loginWithPassword({ ...input, captchaToken })).resolves.toEqual({
        ok: false, error: "La vérification anti-robot a échoué. Réessayez.",
      });
      expect(fetch).not.toHaveBeenCalled();
      expect(f.signIn).toHaveBeenCalledWith(expect.objectContaining({ options: { captchaToken: captchaToken ?? undefined } }));
      expect(f.sessionProfile).not.toHaveBeenCalled();
    });

    it("blocks a denied rate budget before lookup or provider authentication", async () => {
      f.rateLimit.mockResolvedValue({ data: [{ allowed: false }], error: null });
      await expect(loginWithPassword(input)).resolves.toEqual({
        ok: false, error: "Trop de tentatives. Attendez quelques minutes avant de réessayer.",
      });
      expect(fetch).not.toHaveBeenCalled();
      expect(f.serviceProfile).not.toHaveBeenCalled();
      expect(f.signIn).not.toHaveBeenCalled();
    });
  });
});
