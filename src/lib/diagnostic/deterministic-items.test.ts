import { describe, expect, it } from "vitest";
import artifact from "../../../generated/french-taxonomy-v2.json";
import type { FrenchTaxonomyV2Artifact } from "@/lib/taxonomy/french-v2";
import { validateCanonicalDiagnosticBank } from "./item-bank";
import {
  buildDeterministicDiagnosticItems,
  DETERMINISTIC_DIAGNOSTIC_ITEM_PREFIX,
} from "./deterministic-items";

const taxonomyArtifact = artifact as unknown as FrenchTaxonomyV2Artifact;

describe("deterministic diagnostic items", () => {
  it("authors a reproducible three-tier set for every supported node", async () => {
    const items = await buildDeterministicDiagnosticItems(taxonomyArtifact.taxonomy);

    expect(items).toHaveLength(33);
    expect(new Set(items.map((entry) => entry.itemKey)).size).toBe(items.length);
    expect(new Set(items.map((entry) => entry.item.promptFr)).size).toBe(items.length);
    expect(new Set(items.map((entry) => entry.item.nodeKey))).toEqual(new Set([
      "produire_present_indicatif",
      "produire_imparfait",
      "produire_passe_compose",
      "accorder_participe_etre",
      "accorder_participe_avoir_cod",
      "produire_futur_proche",
      "produire_futur_simple",
      "produire_plus_que_parfait",
      "produire_conditionnel_present",
      "produire_subjonctif_present_frequent",
      "produire_imperatif",
    ]));
    expect(items.every((entry) =>
      entry.itemKey.startsWith(DETERMINISTIC_DIAGNOSTIC_ITEM_PREFIX)
      && entry.reviewStatus === "auto_approved"
      && entry.qcGates.gate0_computed.applied
      && entry.qcGates.gate2_answer_key.ok
      && entry.item.validatorType === "conjugator"
      && entry.item.responseType !== "mcq"
    )).toBe(true);
  });

  it("survives the canonical release verifier as computed content", async () => {
    const items = await buildDeterministicDiagnosticItems(taxonomyArtifact.taxonomy);
    const validation = validateCanonicalDiagnosticBank({
      schemaVersion: 1,
      bank: { key: "french-diagnostic-bank-v2", version: "2.0.0" },
      taxonomy: {
        releaseKey: taxonomyArtifact.release.key,
        releaseVersion: taxonomyArtifact.release.version,
        checksum: taxonomyArtifact.manifest.contentChecksum,
      },
      generatedAt: "2026-07-12T00:00:00.000Z",
      items,
    }, taxonomyArtifact.taxonomy);

    expect(validation.issues).not.toContainEqual(
      expect.stringContaining("computed conjugation could not be reproduced"),
    );
    expect(validation.issues).not.toContainEqual(
      expect.stringContaining("item is not release-approved"),
    );
    expect(validation.manifest.eligibleItemCount).toBe(33);
  });
});
