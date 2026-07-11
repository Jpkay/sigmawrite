import { describe, expect, it } from "vitest";
import { diagnosticSkillsFromDb } from "@/lib/student-state";

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
