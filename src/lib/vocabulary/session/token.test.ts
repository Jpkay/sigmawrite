import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { openItem, sealItem } from "./token";

const claims = { sub: "student-a", sid: "s1", iid: "i1", senseId: "sense", format: "hear_and_type" as const, facets: ["spelling" as const], expected: "intrépide", novelContext: false, rescue: false, word: "intrépide" };

describe("signed word items", () => {
  beforeEach(() => { process.env.WORD_ITEM_SIGNING_SECRET = "test-secret"; });
  it("round-trips for the same student", () => {
    expect(openItem(sealItem(claims), "student-a")).toMatchObject({ expected: "intrépide", senseId: "sense" });
  });
  it("rejects another student, a tampered body and an expired token", () => {
    const token = sealItem(claims);
    expect(() => openItem(token, "student-b")).toThrow(/expiré/u);
    const [body, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), expected: "x" })).toString("base64url");
    expect(() => openItem(`${forged}.${signature}`, "student-a")).toThrow(/expiré/u);
    expect(() => openItem(sealItem(claims, 0), "student-a", Date.now())).toThrow(/expiré/u);
  });
});
