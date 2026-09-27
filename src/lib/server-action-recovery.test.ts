import { expect, it } from "vitest";
import { isMissingServerActionError } from "./server-action-recovery";

it("recognizes missing action errors from current and older Next.js deployments", () => {
  expect(isMissingServerActionError(new Error('Failed to find Server Action "abc". This request might be from an older or newer deployment.'))).toBe(true);
  expect(isMissingServerActionError('Server Action "abc" was not found on the server. Read more: https://nextjs.org/docs/messages/failed-to-find-server-action')).toBe(true);
  expect(isMissingServerActionError(new Error("Network request failed"))).toBe(false);
  expect(isMissingServerActionError(null)).toBe(false);
});
