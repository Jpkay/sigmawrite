import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  validateCanonicalDiagnosticBank,
  type CanonicalDiagnosticBankArtifact,
} from "../item-bank";
import { FRENCH_DRAFT_EXPANSION_SOURCES } from "./draft-expansion-sources";
import { rewriteRevision45TenseItem } from "./revision-45-tense-copy";

const read = <T>(path: string): T =>
  JSON.parse(readFileSync(path, "utf8")) as T;
const base = read<CanonicalDiagnosticBankArtifact>(
  "generated/diagnostic-bank-v3-draft.json",
);
const bank: CanonicalDiagnosticBankArtifact = {
  ...base,
  items: [
    ...base.items,
    ...FRENCH_DRAFT_EXPANSION_SOURCES.flatMap(
      (source) =>
        read<{ items: CanonicalDiagnosticBankArtifact["items"] }>(
          `generated/french-v3-${source}-expansion.json`,
        ).items,
    ),
  ],
};
delete bank.manifest;
const taxonomy = read<{
  taxonomy: Parameters<typeof validateCanonicalDiagnosticBank>[1];
}>("generated/french-taxonomy-v3.json").taxonomy;
const rewritten = bank.items.map((entry) => rewriteRevision45TenseItem(entry));
const changed = rewritten.filter((entry, index) => entry !== bank.items[index]);
const byKey = (key: string) => {
  const entry = bank.items.find((candidate) => candidate.itemKey === key);
  if (!entry) throw Error(`Missing fixture ${key}`);
  return entry;
};

describe("revision 45 tense copy", () => {
  it("rewrites every guarded nomenclature gate and legacy near-future production prompt", () => {
    const counts = Object.fromEntries(
      [
        ...changed.reduce(
          (map, entry) =>
            map.set(entry.item.nodeKey, (map.get(entry.item.nodeKey) ?? 0) + 1),
          new Map<string, number>(),
        ),
      ].sort(),
    );
    expect(changed).toHaveLength(411);
    expect(counts).toEqual({
      distinguer_infinitif_participe: 25,
      produire_futur_proche: 216,
      produire_present_indicatif: 16,
      reconnaitre_conditionnel_present: 15,
      reconnaitre_futur_proche: 8,
      reconnaitre_futur_simple: 15,
      reconnaitre_imparfait: 12,
      reconnaitre_imperatif: 24,
      reconnaitre_passe_compose: 13,
      reconnaitre_passe_recent: 6,
      reconnaitre_passe_simple: 24,
      reconnaitre_plus_que_parfait: 13,
      reconnaitre_subjonctif_present: 24,
    });
    for (const entry of changed) {
      const visibleCopy = [
        entry.item.promptFr,
        entry.item.instructionsFr,
        entry.item.correctAnswer,
        ...entry.item.acceptableAnswers,
        ...(entry.item.choices ?? []).flatMap((choice) => [
          choice.text,
          choice.feedbackFr,
        ]),
      ]
        .filter(Boolean)
        .join("\n");
      expect(visibleCopy).not.toMatch(
        /présent de l[’']indicatif|futur proche|passé récent|futur simple|conditionnel présent|passé composé|plus-que-parfait|subjonctif présent|passé simple|impératif présent|participe passé|infinitif/iu,
      );
    }
  });

  it("preserves identity, evidence, validators, and the unique correct choice", () => {
    for (const [index, before] of bank.items.entries()) {
      const after = rewritten[index];
      if (after === before) continue;
      const { item: beforeItem, ...beforeMetadata } = before;
      const { item: afterItem, ...afterMetadata } = after;
      expect(afterMetadata).toEqual(beforeMetadata);
      expect(afterItem.nodeKey).toBe(beforeItem.nodeKey);
      expect(afterItem.validatorType).toBe(beforeItem.validatorType);
      const beforeValidator = { ...(beforeItem.validatorConfig ?? {}) };
      const afterValidator = { ...(afterItem.validatorConfig ?? {}) };
      delete beforeValidator.materialExposure;
      delete afterValidator.materialExposure;
      expect(afterValidator).toEqual(beforeValidator);
      const beforeAssessed = (
        beforeItem.validatorConfig?.materialExposure as
          { assessed?: unknown } | undefined
      )?.assessed;
      const afterAssessed = (
        afterItem.validatorConfig?.materialExposure as
          { assessed?: unknown } | undefined
      )?.assessed;
      expect(afterAssessed).toEqual(beforeAssessed);
      if (beforeItem.responseType !== "mcq") {
        expect(afterItem.correctAnswer).toBe(beforeItem.correctAnswer);
        expect(afterItem.acceptableAnswers).toEqual(
          beforeItem.acceptableAnswers,
        );
        continue;
      }
      const beforeChoices = beforeItem.choices ?? [];
      const afterChoices = afterItem.choices ?? [];
      expect(afterChoices.filter((choice) => choice.correct)).toHaveLength(1);
      expect(new Set(afterChoices.map((choice) => choice.text)).size).toBe(
        afterChoices.length,
      );
      expect(afterChoices.findIndex((choice) => choice.correct)).toBe(
        beforeChoices.findIndex((choice) => choice.correct),
      );
      const replacementByChoice = new Map(
        beforeChoices.map((choice, choiceIndex) => [
          choice.text,
          afterChoices[choiceIndex]?.text ?? choice.text,
        ]),
      );
      expect(afterItem.correctAnswer).toBe(
        beforeItem.correctAnswer
          ? (replacementByChoice.get(beforeItem.correctAnswer) ??
              beforeItem.correctAnswer)
          : beforeItem.correctAnswer,
      );
      expect(afterItem.acceptableAnswers).toEqual(
        beforeItem.acceptableAnswers.map(
          (answer) => replacementByChoice.get(answer) ?? answer,
        ),
      );
    }
    expect(
      validateCanonicalDiagnosticBank(
        { ...bank, manifest: undefined, items: rewritten },
        taxonomy,
      ).issues,
    ).toEqual([]);
  });

  it("uses form examples and plain descriptions across the targeted families", () => {
    const samples: [string, string][] = [
      ["v3-tense-recognition:imparfait-sketch", "je chantais"],
      ["v3-tense-recognition:futur_simple-carry", "je chanterai"],
      ["v3-tense-recognition:conditionnel-form-1", "je chanterais"],
      ["v3-tense-recognition:passe-compose-form-1", "j’ai chanté"],
      ["v3-tense-recognition:plus-que-parfait-form-1", "j’avais chanté"],
      ["v3-tense-recognition:future-measure", "je vais chanter"],
      ["v3-tense-recognition:recent-find", "je viens de chanter"],
    ];
    for (const [key, cue] of samples)
      expect(rewriteRevision45TenseItem(byKey(key)).item.promptFr).toContain(
        cue,
      );
    expect(
      rewriteRevision45TenseItem(
        byKey("v3-futur-proche-production:aller:1s:0"),
      ).item.promptFr,
    ).toContain("Écris deux mots");

    for (const key of [
      "v3-tense-recognition:future-name",
      "v3-tense-recognition:recent-name",
      "v3-tense-recognition:subjonctif-recognition-1",
      "v3-past-tense-foundations:recognition-1",
      "v3-imperatif-recognition:imperatif-recognition-1",
      "v3-infinitive-participle:concept-1",
    ]) {
      const before = byKey(key),
        after = rewriteRevision45TenseItem(before);
      expect(after.item.promptFr).toMatch(/Quelle description correspond/u);
      expect(after.item.choices?.map((choice) => choice.text)).not.toEqual(
        before.item.choices?.map((choice) => choice.text),
      );
      expect(JSON.stringify(after.item.validatorConfig)).not.toContain(
        before.item.promptFr,
      );
      for (const choice of before.item.choices ?? [])
        expect(JSON.stringify(after.item.validatorConfig)).not.toContain(
          choice.text,
        );
    }
  });

  it("keeps contrast and spelling items aligned with their original correct answers", () => {
    const placeBefore = byKey("v3-tense-recognition:recent-place");
    const placeAfter = rewriteRevision45TenseItem(placeBefore);
    expect(placeAfter.item.promptFr).toBe(
      "Quelle phrase dit d’où viennent les colis, au lieu de dire ce qu’ils viennent de faire ?",
    );
    expect(placeAfter.item.choices).toEqual(placeBefore.item.choices);
    expect(
      placeAfter.item.choices?.find((choice) => choice.correct)?.text,
    ).toBe("Les colis viennent de l’entrepôt.");

    const agreement = rewriteRevision45TenseItem(
      byKey("review-draft-v1:reconnaitre_passe_compose:receptive:core"),
    );
    expect(agreement.item.promptFr).toContain(
      "écrit correctement « aller » pour « elle »",
    );
    expect(agreement.item.choices?.find((choice) => choice.correct)?.text).toBe(
      "Elle est allée à la plage.",
    );
    expect(
      agreement.item.choices?.map((choice) => choice.feedbackFr).join(" "),
    ).not.toMatch(/participe|auxiliaire|terminaison/iu);
  });

  it("updates explicit answer fields and material exposure when labels become descriptions", () => {
    const source = structuredClone(
      byKey("v3-tense-recognition:subjonctif-recognition-1"),
    );
    const correct = source.item.choices!.find((choice) => choice.correct)!.text;
    source.item.correctAnswer = correct;
    source.item.acceptableAnswers = [correct];
    const assessed = (
      source.item.validatorConfig?.materialExposure as
        { assessed?: unknown } | undefined
    )?.assessed;
    const result = rewriteRevision45TenseItem(source);
    const rewrittenCorrect = result.item.choices!.find(
      (choice) => choice.correct,
    )!.text;
    expect(result.item.correctAnswer).toBe(rewrittenCorrect);
    expect(result.item.acceptableAnswers).toEqual([rewrittenCorrect]);
    expect(JSON.stringify(result.item.validatorConfig)).not.toContain(correct);
    expect(
      (
        result.item.validatorConfig?.materialExposure as
          { assessed?: unknown } | undefined
      )?.assessed,
    ).toEqual(assessed);
  });

  it("returns unrelated entries unchanged and rejects drift inside guarded families", () => {
    for (const key of [
      "review-draft-v1:reconnaitre_present_indicatif:receptive:core",
      "v3-conjugation-foundation:present-draw",
      "v3-tense-recognition:recent-structure",
      "v3-tense-recognition:recent-comparison",
      "local-conjugation-gap-v1:distinguer_infinitif_participe:receptive:foundation",
    ]) {
      const entry = byKey(key);
      expect(rewriteRevision45TenseItem(entry)).toBe(entry);
    }

    const promptDrift = structuredClone(
      byKey("v3-tense-recognition:imparfait-sketch"),
    );
    promptDrift.item.promptFr = "Prompt source modifié";
    expect(() => rewriteRevision45TenseItem(promptDrift)).toThrow(
      /copy drift/u,
    );

    const validatorDrift = structuredClone(
      bank.items.find((entry) =>
        entry.itemKey.startsWith("v3-futur-proche-production:"),
      )!,
    );
    validatorDrift.item.validatorConfig!.tense = "futur_simple";
    expect(() => rewriteRevision45TenseItem(validatorDrift)).toThrow(
      /copy drift/u,
    );
  });
});
