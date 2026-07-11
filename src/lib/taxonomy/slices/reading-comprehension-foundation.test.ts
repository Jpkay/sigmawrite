import { describe, expect, it } from "vitest";
import { validateTaxonomy } from "../validate";
import {
  READING_ASSESSMENT_TEMPLATES,
  READING_FOUNDATION_CANDIDATE,
  READING_FOUNDATION_NODES,
  READING_QUESTION_TYPE_COMPETENCIES,
} from "./reading-comprehension-foundation";

describe("French reading-comprehension foundation v1", () => {
  it("is graph-valid and every node has evidence plus separate L1/FSL mappings", () => {
    const result = validateTaxonomy(READING_FOUNDATION_CANDIDATE);
    expect(result.valid, JSON.stringify(result.issues, null, 2)).toBe(true);
    expect(READING_FOUNDATION_NODES.length).toBeGreaterThanOrEqual(40);
    expect(READING_FOUNDATION_NODES.every((node) => node.evidence.length > 0)).toBe(true);
    expect(READING_FOUNDATION_NODES.every((node) => node.mappings.some((mapping) => mapping.framework === "native_grade"))).toBe(true);
    expect(READING_FOUNDATION_NODES.every((node) => node.mappings.some((mapping) => mapping.framework === "cefr"))).toBe(true);
  });

  it("maps every supported generated-question family to approved atomic nodes", () => {
    const keys = new Set(READING_FOUNDATION_NODES.map((node) => node.key));
    expect(Object.keys(READING_QUESTION_TYPE_COMPETENCIES)).toEqual([
      "explicit_information", "reference", "vocabulary_in_context", "main_idea", "text_structure",
      "inference", "summary", "viewpoint", "argument", "textual_evidence",
    ]);
    for (const mapped of Object.values(READING_QUESTION_TYPE_COMPETENCIES)) {
      expect(mapped.length).toBeGreaterThan(0);
      for (const key of mapped) expect(keys.has(key), key).toBe(true);
    }
  });

  it("distinguishes literary, informational, and argumentative evidence", () => {
    const applicability = new Set(READING_FOUNDATION_NODES.map((node) => node.textApplicability));
    expect(applicability).toEqual(new Set(["all", "literary", "informational", "argumentative"]));
    expect(READING_FOUNDATION_NODES.find((node) => node.key === "organiser_resume_narratif")?.textApplicability).toBe("literary");
    expect(READING_FOUNDATION_NODES.find((node) => node.key === "organiser_resume_informatif")?.textApplicability).toBe("informational");
    expect(READING_ASSESSMENT_TEMPLATES.some((template) => template.textApplicability === "argumentative")).toBe(true);
  });

  it("decomposes broad comprehension labels into observable evidence", () => {
    expect(READING_FOUNDATION_NODES.some((node) => node.key === "comprendre_un_texte")).toBe(false);
    expect(READING_FOUNDATION_NODES.every((node) => !/comprendre un texte/i.test(node.labelFr))).toBe(true);
    expect(READING_FOUNDATION_NODES.every((node) => Object.hasOwn(node.evidence[0].successCriteria, "minimumDistinctTexts"))).toBe(true);
  });
});

