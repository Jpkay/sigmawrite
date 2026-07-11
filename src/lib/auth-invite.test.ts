import { describe, expect, it } from "vitest";
import { invitedUserHome, needsInvitedPasswordSetup, sessionTokensFromAuthFragment } from "./auth-invite";

describe("invited account activation", () => {
  it("requires a password for a newly invited account", () => {
    expect(needsInvitedPasswordSetup({ invited_at: "2026-07-10T15:00:00Z", user_metadata: {} })).toBe(true);
  });

  it("does not repeat activation after the password is set", () => {
    expect(needsInvitedPasswordSetup({ invited_at: "2026-07-10T15:00:00Z", user_metadata: { password_set: true } })).toBe(false);
    expect(needsInvitedPasswordSetup({ invited_at: null, user_metadata: {} })).toBe(false);
  });

  it("routes activated administrators and reviewers to their own portals", () => {
    expect(invitedUserHome("platform_admin")).toBe("/admin");
    expect(invitedUserHome("content_reviewer")).toBe("/review");
    expect(invitedUserHome("unknown")).toBe("/");
  });

  it("extracts both tokens from an implicit invitation redirect", () => {
    expect(sessionTokensFromAuthFragment("#access_token=access-1&refresh_token=refresh-1&type=invite")).toEqual({
      access_token: "access-1",
      refresh_token: "refresh-1",
    });
    expect(sessionTokensFromAuthFragment("#access_token=access-1&type=invite")).toBeNull();
  });
});
