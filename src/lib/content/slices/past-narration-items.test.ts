import { describe, expect, it } from "vitest";
import { validateAnswer } from "@/lib/linguistic/validator";
import { NODES, MISCONCEPTIONS } from "./past-narration";
import { ITEMS } from "./past-narration-items";

const nodeKeys = new Set(NODES.map((n) => n.key));
const misconceptionKeys = new Set(MISCONCEPTIONS.map((m) => m.key));

describe("past-narration items — referential integrity", () => {
  it("every item targets a real slice node", () => {
    for (const it of ITEMS) expect(nodeKeys.has(it.nodeKey)).toBe(true);
  });
  it("item keys are unique", () => {
    const keys = ITEMS.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("every distractor misconception references a real misconception", () => {
    for (const it of ITEMS)
      for (const c of it.choices ?? [])
        if (c.misconceptionKey) expect(misconceptionKeys.has(c.misconceptionKey)).toBe(true);
  });
});

describe("Gate-2 — MCQ answer-key self-consistency", () => {
  const mcq = ITEMS.filter((i) => i.responseType === "mcq");
  it("covers several nodes", () => expect(mcq.length).toBeGreaterThanOrEqual(5));

  for (const item of mcq) {
    it(`${item.key}: exactly one correct choice`, () => {
      const correct = (item.choices ?? []).filter((c) => c.correct);
      expect(correct).toHaveLength(1);
      expect((item.choices ?? []).length).toBeGreaterThanOrEqual(2);
    });
  }
});

describe("Gate-2 — conjugator items: correct key passes, a wrong form fails", () => {
  const conj = ITEMS.filter((i) => i.validatorType === "conjugator");
  it("covers several nodes", () => expect(conj.length).toBeGreaterThanOrEqual(4));

  for (const item of conj) {
    it(`${item.key}: authored answer "${item.correctAnswer}" validates true`, async () => {
      const r = await validateAnswer(item.correctAnswer!, {
        validatorType: "conjugator",
        config: item.validatorConfig,
      });
      expect(r.pass).toBe(true);
    });

    it(`${item.key}: a corrupted answer validates false`, async () => {
      // Mutate the key into a plausible-but-wrong form (drop final letter).
      const wrong = item.correctAnswer!.slice(0, -1) + "x";
      const r = await validateAnswer(wrong, {
        validatorType: "conjugator",
        config: item.validatorConfig,
      });
      expect(r.pass).toBe(false);
    });
  }
});

describe("Gate-2 — the hard case is verified end to end", () => {
  it("accord_pp_avoir_cod item: « ai cueillies » is confirmed by the conjugator", async () => {
    const item = ITEMS.find((i) => i.key === "pn_pp_avoir_cod_cueillir")!;
    const r = await validateAnswer(item.correctAnswer!, {
      validatorType: "conjugator",
      config: item.validatorConfig,
    });
    expect(r.pass).toBe(true);
    // The common error « ai cueilli » (no agreement) is rejected.
    const wrong = await validateAnswer("ai cueilli", {
      validatorType: "conjugator",
      config: item.validatorConfig,
    });
    expect(wrong.pass).toBe(false);
  });
});
