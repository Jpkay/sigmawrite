import { describe, expect, it } from "vitest";
import { weaveWordEntries, wordBurstHref } from "./plan-entries";

describe("word entries in the daily plan", () => {
  it("weaves word bursts after other entries, never first and never side by side", () => {
    const woven = weaveWordEntries(["a", "b", "c"], ["w1", "w2"]);
    expect(woven[0]).toBe("a");
    expect(woven).toEqual(["a", "w1", "b", "w2", "c"]);
    for (let i = 1; i < woven.length; i++) expect(woven[i].startsWith("w") && woven[i - 1].startsWith("w")).toBe(false);
  });
  it("keeps only as many bursts as there are gaps", () => {
    expect(weaveWordEntries(["a"], ["w1", "w2", "w3"])).toEqual(["a", "w1"]);
    expect(weaveWordEntries([], ["w1", "w2"])).toEqual(["w1"]);
    expect(weaveWordEntries(["a", "b"], [])).toEqual(["a", "b"]);
  });
  it("links a burst without showing how many words are due", () => {
    const href = wordBurstHref({ type: "review_word", cards: [], senses: 4, newWords: 1, seconds: 78 }, 1);
    expect(href).toBe("/student/vocabulary/rappel?n=4&nouveaux=1&etape=1");
  });
});
