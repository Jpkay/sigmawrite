import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  headerGet: vi.fn(),
  dbRpc: vi.fn(),
  serviceRpc: vi.fn(),
  serviceFrom: vi.fn(),
  createUser: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => ({ get: f.headerGet }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: f.dbRpc,
    auth: { signInWithPassword: f.signIn },
  }),
  createServiceClient: () => ({
    rpc: f.serviceRpc,
    from: f.serviceFrom,
    auth: { admin: { createUser: f.createUser } },
  }),
}));

import { joinClassWithoutEmail } from "./auth";

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
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = previousSecret;
    if (previousSupabaseCaptcha === undefined) delete process.env.SUPABASE_CAPTCHA_ENABLED;
    else process.env.SUPABASE_CAPTCHA_ENABLED = previousSupabaseCaptcha;
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
});
