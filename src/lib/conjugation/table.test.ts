import { describe, expect, it } from "vitest";
import { buildConjugationTable, subjectFor } from "./table";
import { UnsupportedVerbError } from "@/lib/linguistic/conjugation";

describe("buildConjugationTable", () => {
  it("renders all eleven tenses for a regular -er verb with elided subjects", () => {
    const table = buildConjugationTable("Parler");
    expect(table.tenses).toHaveLength(11);
    expect(table.group).toBe(1);
    expect(table.auxiliary).toBe("avoir");
    const present = table.tenses.find((t) => t.tense === "present")!;
    expect(present.rows[0]).toEqual({ person: "1s", subject: "je ", form: "parle" });
    const imparfait = table.tenses.find((t) => t.tense === "imparfait")!;
    expect(imparfait.rows[0].subject).toBe("je ");
    expect(imparfait.rows[0].form).toBe("parlais");
  });
  it("elides before vowels and drops the subject for the impératif", () => {
    const table = buildConjugationTable("aller");
    const present = table.tenses.find((t) => t.tense === "present")!;
    expect(present.rows[0]).toEqual({ person: "1s", subject: "je ", form: "vais" });
    expect(buildConjugationTable("avoir").tenses[0].rows[0].subject).toBe("j’");
    const imperative = table.tenses.find((t) => t.tense === "imperatif_present")!;
    expect(imperative.rows.map((r) => r.person)).toEqual(["2s", "1p", "2p"]);
    expect(imperative.rows[0].subject).toBe("");
    expect(table.auxiliary).toBe("être");
  });
  it("classifies second-group verbs and marks the subjonctif with que", () => {
    const table = buildConjugationTable("finir");
    expect(table.group).toBe(2);
    expect(subjectFor("1s", "finisse", "subjonctif_present")).toBe("que je ");
    expect(subjectFor("1s", "aie", "subjonctif_present")).toBe("que j’");
  });
  it("fails closed on unsupported or malformed input", () => {
    expect(() => buildConjugationTable("xyzzy")).toThrow(UnsupportedVerbError);
    expect(() => buildConjugationTable("parler; drop")).toThrow(UnsupportedVerbError);
  });
});
