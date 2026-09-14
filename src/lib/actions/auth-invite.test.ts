import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  headerGet: vi.fn(),
  dbRpc: vi.fn(),
  serviceRpc: vi.fn(),
  serviceFrom: vi.fn(),
  createUser: vi.fn(),
  signIn: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => ({ get: f.headerGet }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: f.dbRpc,
    auth: { signInWithPassword: f.signIn, resetPasswordForEmail: f.resetPassword },
  }),
  createServiceClient: () => ({
    rpc: f.serviceRpc,
    from: f.serviceFrom,
    auth: { admin: { createUser: f.createUser } },
  }),
}));

import { joinClassWithoutEmail, requestPasswordRecovery } from "./auth";

const baseInput = {
  code: `SW-${"a".repeat(32)}`,
  displayName: "Élève test",
  username: "eleve.test",
  dateOfBirth: "2012-05-10",
  password: "mot-de-passe-solide",
  captchaToken: "automatic-turnstile-token",
};
const previousSecret = process.env.TURNSTILE_SECRET_KEY;
const previousSupabaseCaptcha = process.env.SUPABASE_CAPTCHA_ENABLED;
const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

describe("no-email class join", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.SUPABASE_CAPTCHA_ENABLED;
    f.headerGet.mockReturnValue(null);
    f.dbRpc.mockResolvedValue({ data: [{ allowed: true }], error: null });
    f.serviceRpc.mockResolvedValue({ data: [{ class_name: "5e A", school_name: "École A" }], error: null });
    f.serviceFrom.mockImplementation(() => {
      const query = {
        select: () => query,
        ilike: () => query,
        maybeSingle: async () => ({ data: null, error: null }),
      };
      return query;
    });
    f.createUser.mockResolvedValue({ data: { user: { id: "auth-user" } }, error: null });
    f.signIn.mockResolvedValue({ error: null });
    f.resetPassword.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = previousSecret;
    if (previousSupabaseCaptcha === undefined) delete process.env.SUPABASE_CAPTCHA_ENABLED;
    else process.env.SUPABASE_CAPTCHA_ENABLED = previousSupabaseCaptcha;
    if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    vi.unstubAllGlobals();
  });

  it("accepts and normalizes a legacy long code for the no-email path", async () => {
    await expect(joinClassWithoutEmail({ ...baseInput, code: `  ${baseInput.code}  ` })).resolves.toEqual({
      username: baseInput.username,
      signedIn: true,
    });
    expect(f.serviceRpc).toHaveBeenCalledWith("validate_class_join_code", { p_code: baseInput.code.toUpperCase() });
  });

  it("does not bypass independent Turnstile when the production secret is active", async () => {
    process.env.TURNSTILE_SECRET_KEY = "configured-secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: false }) }));

    await expect(joinClassWithoutEmail(baseInput)).rejects.toThrow("vérification anti-robot a échoué");
    expect(fetch).toHaveBeenCalledWith("https://challenges.cloudflare.com/turnstile/v0/siteverify", expect.objectContaining({ method: "POST" }));
    expect(f.serviceRpc).not.toHaveBeenCalled();
    expect(f.createUser).not.toHaveBeenCalled();
  });

  it("requires a token before any account or invitation operation when independent Turnstile is active", async () => {
    process.env.TURNSTILE_SECRET_KEY = "configured-secret";
    await expect(joinClassWithoutEmail({ ...baseInput, captchaToken: null })).rejects.toThrow("vérification anti-robot");
    expect(f.serviceRpc).not.toHaveBeenCalled();
    expect(f.createUser).not.toHaveBeenCalled();
  });

  describe("privileged creation with delegated public Auth CAPTCHA", () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = "configured-secret";
      process.env.SUPABASE_CAPTCHA_ENABLED = "true";
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: true }) }));
    });

    it("requires a token before checking the invitation or creating an account", async () => {
      await expect(joinClassWithoutEmail({ ...baseInput, captchaToken: null })).rejects.toThrow("vérification anti-robot");
      expect(fetch).not.toHaveBeenCalled();
      expect(f.serviceRpc).not.toHaveBeenCalled();
      expect(f.createUser).not.toHaveBeenCalled();
      expect(f.signIn).not.toHaveBeenCalled();
    });

    it("rejects passwords longer than the login limit before any privileged operation", async () => {
      await expect(joinClassWithoutEmail({ ...baseInput, password: "a".repeat(129) })).rejects.toThrow();
      expect(f.dbRpc).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      expect(f.serviceRpc).not.toHaveBeenCalled();
      expect(f.createUser).not.toHaveBeenCalled();
    });

    it("blocks a failed independent token before any privileged operation", async () => {
      vi.mocked(fetch).mockResolvedValue({ json: async () => ({ success: false }) } as Response);
      await expect(joinClassWithoutEmail(baseInput)).rejects.toThrow("vérification anti-robot a échoué");
      expect(fetch).toHaveBeenCalledOnce();
      expect(f.serviceRpc).not.toHaveBeenCalled();
      expect(f.createUser).not.toHaveBeenCalled();
      expect(f.signIn).not.toHaveBeenCalled();
    });

    it("fails closed without a local secret even though public Auth delegates", async () => {
      delete process.env.TURNSTILE_SECRET_KEY;
      await expect(joinClassWithoutEmail(baseInput)).rejects.toThrow("momentanément indisponible");
      expect(fetch).not.toHaveBeenCalled();
      expect(f.serviceRpc).not.toHaveBeenCalled();
      expect(f.createUser).not.toHaveBeenCalled();
    });

    it("verifies before creating the invited student and hands off to a fresh login", async () => {
      await expect(joinClassWithoutEmail(baseInput)).resolves.toEqual({ username: baseInput.username, signedIn: false });
      expect(fetch).toHaveBeenCalledExactlyOnceWith("https://challenges.cloudflare.com/turnstile/v0/siteverify", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ secret: "configured-secret", response: baseInput.captchaToken }),
      }));
      expect(f.serviceRpc).toHaveBeenCalledWith("validate_class_join_code", { p_code: baseInput.code.toUpperCase() });
      expect(f.createUser).toHaveBeenCalledExactlyOnceWith({
        email: expect.stringMatching(/^account\+.+@accounts\.sigmawrite\.app$/),
        password: baseInput.password, email_confirm: true,
        user_metadata: {
          role: "student", display_name: baseInput.displayName, username: baseInput.username,
          date_of_birth: baseInput.dateOfBirth, join_code: baseInput.code.toUpperCase(), password_set: true,
        },
      });
      expect(f.dbRpc.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(fetch).mock.invocationCallOrder[0]);
      expect(vi.mocked(fetch).mock.invocationCallOrder[0]).toBeLessThan(f.serviceRpc.mock.invocationCallOrder[0]);
      expect(f.serviceRpc.mock.invocationCallOrder[0]).toBeLessThan(f.createUser.mock.invocationCallOrder[0]);
      expect(f.signIn).not.toHaveBeenCalled();
    });

    it("still refuses an invalid invitation after successful CAPTCHA", async () => {
      f.serviceRpc.mockResolvedValue({ data: [], error: null });
      await expect(joinClassWithoutEmail(baseInput)).rejects.toThrow("code est invalide");
      expect(f.createUser).not.toHaveBeenCalled();
      expect(f.signIn).not.toHaveBeenCalled();
    });

    it("still enforces the rate budget before verification or creation", async () => {
      f.dbRpc.mockResolvedValue({ data: [{ allowed: false }], error: null });
      await expect(joinClassWithoutEmail(baseInput)).rejects.toThrow("Trop de tentatives");
      expect(fetch).not.toHaveBeenCalled();
      expect(f.serviceRpc).not.toHaveBeenCalled();
      expect(f.createUser).not.toHaveBeenCalled();
    });
  });
});

describe("password recovery Turnstile boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.TURNSTILE_SECRET_KEY = "configured-secret";
    delete process.env.SUPABASE_CAPTCHA_ENABLED;
    process.env.NEXT_PUBLIC_APP_URL = "https://plume.example.invalid";
    f.headerGet.mockReturnValue(null);
    f.dbRpc.mockResolvedValue({ data: [{ allowed: true }], error: null });
    f.resetPassword.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = previousSecret;
    if (previousSupabaseCaptcha === undefined) delete process.env.SUPABASE_CAPTCHA_ENABLED;
    else process.env.SUPABASE_CAPTCHA_ENABLED = previousSupabaseCaptcha;
    if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    vi.unstubAllGlobals();
  });

  it("requires a token before resolving a recovery username or sending mail", async () => {
    await expect(requestPasswordRecovery({ identifier: "eleve.test", captchaToken: null })).rejects.toThrow("vérification anti-robot");
    expect(f.serviceFrom).not.toHaveBeenCalled();
    expect(f.resetPassword).not.toHaveBeenCalled();
  });

  it("stops a failed token before identifier lookup or recovery mail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: false }) }));
    await expect(requestPasswordRecovery({ identifier: "eleve.test", captchaToken: "failed-token" })).rejects.toThrow("vérification anti-robot a échoué");
    expect(f.serviceFrom).not.toHaveBeenCalled();
    expect(f.resetPassword).not.toHaveBeenCalled();
  });

  it("delegates one token to Supabase when native CAPTCHA is explicitly enabled", async () => {
    process.env.SUPABASE_CAPTCHA_ENABLED = "true";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(requestPasswordRecovery({ identifier: "adult@example.invalid", captchaToken: "supabase-token" })).resolves.toMatchObject({ message: expect.any(String) });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(f.serviceFrom).not.toHaveBeenCalled();
    expect(f.resetPassword).toHaveBeenCalledWith("adult@example.invalid", expect.objectContaining({ captchaToken: "supabase-token" }));
  });

  it("does not report recovery success when the delegated provider rejects CAPTCHA", async () => {
    process.env.SUPABASE_CAPTCHA_ENABLED = "true";
    vi.stubGlobal("fetch", vi.fn());
    f.resetPassword.mockResolvedValue({ error: { code: "captcha_failed", message: "private provider detail" } });
    await expect(requestPasswordRecovery({ identifier: "adult@example.invalid", captchaToken: "rejected-token" })).rejects.toThrow("Le lien n’a pas pu être envoyé.");
    expect(fetch).not.toHaveBeenCalled();
    expect(f.resetPassword).toHaveBeenCalledWith("adult@example.invalid", expect.objectContaining({ captchaToken: "rejected-token" }));
  });
});
