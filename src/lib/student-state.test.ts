import { describe, expect, it } from "vitest";
import {
  diagnosticSectionProfileFromRows,
  diagnosticSkillsFromDb,
} from "@/lib/student-state";

describe("diagnosticSkillsFromDb", () => {
  it("maps database skill keys to the diagnostic contract", () => {
    expect(diagnosticSkillsFromDb({
      literal_comprehension: 72,
      inference: 61,
      vocabulary_in_context: 68,
      sentence_parsing: 57,
      summarization: 64,
      argument_structure: 53,
      academic_connectors: 59,
    })).toEqual({
      literalComprehension: 72,
      inference: 61,
      vocabularyInContext: 68,
      sentenceParsing: 57,
      summary: 64,
      argumentStructure: 53,
      academicConnectors: 59,
    });
  });

  it("uses a neutral estimate when relational evidence is missing", () => {
    expect(diagnosticSkillsFromDb({})).toEqual({
      literalComprehension: 50,
      inference: 50,
      vocabularyInContext: 50,
      sentenceParsing: 50,
      summary: 50,
      argumentStructure: 50,
      academicConnectors: 50,
    });
  });
});

describe("diagnosticSectionProfileFromRows", () => {
  it("preserves granular run classifications and counts unprobed targets as unknown", () => {
    const profile = diagnosticSectionProfileFromRows([
      { sectionKey: "grammar", classification: "mastered", masteryProbability: .91, evidenceCoverageConfirmed: true, evidenceKind: "direct" },
      { sectionKey: "grammar", classification: "fragile", masteryProbability: .72, evidenceCoverageConfirmed: true, evidenceKind: "direct" },
      { sectionKey: "grammar", classification: "missing", masteryProbability: .2, evidenceCoverageConfirmed: true, evidenceKind: "direct" },
      { sectionKey: "grammar", classification: "mastered", masteryProbability: .88, evidenceCoverageConfirmed: false, evidenceKind: "inferred_prerequisite" },
    ], { grammar: 6 });
    expect(profile.grammar).toMatchObject({
      total: 6,
      confirmed: 3,
      mastered: 2,
      fragile: 1,
      missing: 1,
      unknown: 2,
    });
    expect(profile.grammar?.meanMastery).toBeCloseTo(.6775);
  });
});
