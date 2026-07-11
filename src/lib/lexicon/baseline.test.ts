import { describe, expect, it } from "vitest";
import corpus from "../../../taxonomy/lexicon/sigma-pilot-corpus.json";
import { buildBaselineLexicon, stableUuid, verifyBaselineArtifact } from "./baseline";

describe("licensed baseline French lexicon", () => {
  it("builds an idempotent manifest with stable identifiers", () => {
    const first = buildBaselineLexicon(corpus);
    const second = buildBaselineLexicon(JSON.parse(JSON.stringify(corpus)));
    expect(second).toEqual(first);
    expect(verifyBaselineArtifact(first)).toBe(true);
    expect(stableUuid("test", "chat")).toBe(stableUuid("test", "chat"));
  });

  it("resolves common inflections to the intended lemma", () => {
    const artifact = buildBaselineLexicon(corpus);
    const byLemma = new Map(artifact.entries.map((entry) => [entry.lemma, entry]));
    expect(byLemma.get("être")?.forms.map((form) => form.normalized)).toEqual(expect.arrayContaining(["est", "sont", "était"]));
    expect(byLemma.get("avoir")?.forms.map((form) => form.normalized)).toEqual(expect.arrayContaining(["a", "ont", "avait"]));
    expect(byLemma.get("aller")?.forms.map((form) => form.normalized)).toEqual(expect.arrayContaining(["va", "vont"]));
    expect(byLemma.get("élève")?.forms.map((form) => form.normalized)).toEqual(expect.arrayContaining(["élève", "élèves"]));
    expect(artifact.report.morphologyFixtureCoverage).toBe(1);
  });

  it("keeps homographic surface forms explicit instead of inventing a sense", () => {
    const artifact = buildBaselineLexicon(corpus);
    const vol = artifact.entries.find((entry) => entry.lemma === "vol");
    expect(vol?.forms.some((form) => form.normalized === "vol")).toBe(true);
    expect(Object.hasOwn(vol ?? {}, "definition")).toBe(false);
  });

  it("reports held-out coverage, unknown words, and proper nouns separately", () => {
    const artifact = buildBaselineLexicon(corpus);
    expect(artifact.report.heldOutCoverage).toBeGreaterThanOrEqual(0.8);
    expect(artifact.report.unknownHeldOut).toContain("xylophone");
    expect(artifact.entries.find((entry) => entry.lemma === "amina")?.isProperNoun).toBe(true);
  });
});

