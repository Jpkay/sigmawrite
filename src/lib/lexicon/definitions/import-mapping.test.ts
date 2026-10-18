import { describe, expect, it } from "vitest";
import { autoSenseId, planDefinitionImport, type DbLemma, type DbSense, type DbVocabularyItem } from "./import-mapping";
import { LEXICON_DEFINITIONS_PIPELINE_VERSION, type LexiconDefinitionEntry } from "./types";

const now = "2026-10-18T16:00:00.000Z";

function entry(lemma: string, overrides: Partial<LexiconDefinitionEntry> = {}): LexiconDefinitionEntry {
  return {
    lemmaId: `id-${lemma}`,
    lemma,
    displayLemma: lemma,
    normalizedLemma: lemma,
    partOfSpeech: "NOM",
    frequencyPerMillion: 50,
    gradeLevel: 6,
    status: "accepted",
    senseKey: "auto_core",
    definitionFr: `Définition de test pour ${lemma}.`,
    examplesFr: [{ text: `Une phrase avec ${lemma}.`, interest: "football" }],
    definitionValidation: [{ kind: "key_idea", idea: "idée", keywords: ["a", "b"], required: true }],
    relatedTopics: ["football"],
    closeWords: { synonyms: [], antonyms: [], semantic: [], orthographic: [] },
    gateResults: { passed: true, attempts: 1, gates: [] },
    pipelineVersion: LEXICON_DEFINITIONS_PIPELINE_VERSION,
    ...overrides,
  };
}

const lemma = (name: string, id = `id-${name}`): DbLemma => ({ id, normalized_lemma: name, vocabulary_item_id: id });
const item = (name: string, definition: string | null = null, version: string | null = null): DbVocabularyItem => ({ id: `id-${name}`, definition_fr: definition, content_pipeline_version: version });

describe("planDefinitionImport", () => {
  it("maps an accepted entry to an auto-approved sense and the vocabulary item", () => {
    const plan = planDefinitionImport([entry("courage")], { lemmas: [lemma("courage")], vocabulary: [item("courage")], senses: [] }, { now });
    expect(plan.senses).toHaveLength(1);
    expect(plan.senses[0]).toMatchObject({
      id: autoSenseId("id-courage"),
      lemma_id: "id-courage",
      sense_key: "auto_core",
      review_status: "auto_approved",
      pipeline_version: LEXICON_DEFINITIONS_PIPELINE_VERSION,
      auto_approved_at: now,
      grade_level: 6,
    });
    expect(plan.senses[0].gate_results.passed).toBe(true);
    expect(plan.vocabulary).toEqual([expect.objectContaining({ id: "id-courage", definition_fr: "Définition de test pour courage.", related_topics: ["football"], content_pipeline_version: LEXICON_DEFINITIONS_PIPELINE_VERSION })]);
  });

  it("is idempotent: the same input gives the same ids", () => {
    const db = { lemmas: [lemma("courage")], vocabulary: [item("courage")], senses: [] };
    const first = planDefinitionImport([entry("courage")], db, { now });
    const second = planDefinitionImport([entry("courage")], { ...db, senses: [{ id: first.senses[0].id, lemma_id: "id-courage", sense_key: "auto_core", review_status: "auto_approved" }], vocabulary: [item("courage", "Définition de test pour courage.", LEXICON_DEFINITIONS_PIPELINE_VERSION)] }, { now });
    expect(second.senses.map((sense) => sense.id)).toEqual(first.senses.map((sense) => sense.id));
    expect(second.vocabulary).toHaveLength(1);
  });

  it("never overwrites a definition written by a person", () => {
    const plan = planDefinitionImport([entry("intrépide")], { lemmas: [lemma("intrépide")], vocabulary: [item("intrépide", "Qui n’a peur de rien.")], senses: [] }, { now });
    expect(plan.senses).toEqual([]);
    expect(plan.vocabulary).toEqual([]);
    expect(plan.skipped).toEqual([{ lemma: "intrépide", reason: "human_definition" }]);
  });

  it("does not add a competing sense next to a human sense", () => {
    const senses: DbSense[] = [{ id: "s-human", lemma_id: "id-bureau", sense_key: "legacy_default", review_status: "human_approved" }];
    const plan = planDefinitionImport([entry("bureau")], { lemmas: [lemma("bureau")], vocabulary: [item("bureau")], senses }, { now });
    expect(plan.skipped).toEqual([{ lemma: "bureau", reason: "human_sense" }]);
  });

  it("does not resurrect a taken-down automatic sense", () => {
    const senses: DbSense[] = [{ id: "s-auto", lemma_id: "id-blague", sense_key: "auto_core", review_status: "retired" }];
    const plan = planDefinitionImport([entry("blague")], { lemmas: [lemma("blague")], vocabulary: [item("blague")], senses }, { now });
    expect(plan.skipped).toEqual([{ lemma: "blague", reason: "taken_down" }]);
  });

  it("resolves lemmas by spelling when ids differ, and skips missing lemmas and non-accepted entries", () => {
    const plan = planDefinitionImport(
      [entry("abri", { lemmaId: "other" }), entry("absent"), entry("sexuel", { status: "skipped", definitionFr: undefined })],
      { lemmas: [lemma("abri", "db-abri")], vocabulary: [{ id: "db-abri", definition_fr: null, content_pipeline_version: null }], senses: [] },
      { now },
    );
    expect(plan.senses.map((sense) => sense.lemma_id)).toEqual(["db-abri"]);
    expect(plan.skipped).toEqual([{ lemma: "absent", reason: "lemma_missing" }, { lemma: "sexuel", reason: "not_accepted" }]);
  });

  it("links synonyms, antonyms and orthographic neighbours only between senses that exist", () => {
    const entries = [
      entry("courage", { closeWords: { synonyms: ["bravoure"], antonyms: ["lâcheté", "inconnu"], semantic: ["force"], orthographic: ["cirage"] } }),
      entry("bravoure"),
      entry("lâcheté"),
    ];
    const senses: DbSense[] = [{ id: "s-cirage", lemma_id: "id-cirage", sense_key: "legacy_default", review_status: "human_approved" }];
    const plan = planDefinitionImport(entries, {
      lemmas: ["courage", "bravoure", "lâcheté", "cirage"].map((name) => lemma(name)),
      vocabulary: ["courage", "bravoure", "lâcheté"].map((name) => item(name)).concat(item("cirage", "Produit pour faire briller.")),
      senses,
    }, { now });
    const courageSense = autoSenseId("id-courage");
    expect(plan.relationships.map((row) => [row.source_sense_id, row.target_sense_id, row.relationship_type])).toEqual([
      [courageSense, autoSenseId("id-bravoure"), "synonym"],
      [courageSense, autoSenseId("id-lâcheté"), "antonym"],
      [courageSense, "s-cirage", "commonly_confused_with"],
    ]);
    expect(new Set(plan.relationships.map((row) => row.id)).size).toBe(3);
  });
});
