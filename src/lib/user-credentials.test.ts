import { describe, expect, it } from "vitest";
import {
  generateTemporaryPassword,
  internalAuthEmail,
  isInternalAuthEmail,
  normalizeRequestedUsername,
  usernameBase,
} from "./user-credentials";

describe("managed user credentials", () => {
  it("normalizes and validates usernames", () => {
    expect(normalizeRequestedUsername("  Maya.K  ")).toBe("maya.k");
    expect(() => normalizeRequestedUsername("a b")).toThrow(/nom d’utilisateur/i);
    expect(() => normalizeRequestedUsername("ab")).toThrow(/nom d’utilisateur/i);
  });

  it("derives readable username bases without accents", () => {
    expect(usernameBase("Élodie Uwase")).toBe("elodie.uwase");
    expect(usernameBase("李")).toBe("utilisateur");
  });

  it("generates policy-compliant temporary passwords", () => {
    const password = generateTemporaryPassword();
    expect(password.length).toBeGreaterThanOrEqual(16);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[^A-Za-z0-9]/);
  });

  it("keeps placeholder auth emails out of recovery flows", () => {
    const email = internalAuthEmail();
    expect(isInternalAuthEmail(email)).toBe(true);
    expect(isInternalAuthEmail("student@example.org")).toBe(false);
  });
});
