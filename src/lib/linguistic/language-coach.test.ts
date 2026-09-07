import { afterEach, expect, it, vi } from "vitest";
import { coachReadingLanguage } from "./language-coach";
afterEach(() => vi.unstubAllEnvs());
const input = { answer: "Les joueur coopèrent.", prompt: "Lis le texte.", previousAnswers: [], requested: true };
const tip = { kind: "grammar", before: "Les joueur", after: "Les joueurs", explanationFr: "Avec « les », le nom prend un s.", recurring: false };
function config() { vi.stubEnv("AI_PROVIDER", "openai"); vi.stubEnv("OPENAI_API_KEY", "test-only"); }
it("returns a small quoted correction without changing a grade", async () => {
  config(); const response = await coachReadingLanguage(input, vi.fn().mockResolvedValue(JSON.stringify({ tip })));
  expect(response).toEqual({ tip, available: true });
  expect(response).not.toHaveProperty("correct");
});
it("permits no suggestion and fails softly during provider outages", async () => {
  config();
  expect(await coachReadingLanguage(input, vi.fn().mockResolvedValue('{"tip":null}'))).toEqual({ tip: null, available: true });
  expect(await coachReadingLanguage(input, vi.fn().mockRejectedValue(new Error("offline")))).toEqual({ tip: null, available: false });
});
it("suppresses invented quotes, unnecessary changes and automatic style tips", async () => {
  config();
  for (const suggestion of [{ ...tip, before: "absent" }, { ...tip, after: tip.before }, { ...tip, kind: "clarity" }]) {
    expect((await coachReadingLanguage({ ...input, requested: false }, vi.fn().mockResolvedValue(JSON.stringify({ tip: suggestion })))).tip).toBeNull();
  }
});
