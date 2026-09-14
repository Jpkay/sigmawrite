import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./account-row.tsx", import.meta.url), "utf8");
const toggleStart = source.indexOf("async function toggleDeactivated");
const toggleEnd = source.indexOf("\n  return (", toggleStart);
const toggleSource = source.slice(toggleStart, toggleEnd);

describe("teacher deactivation UI state", () => {
  it("clears both teacher assignment collections only after successful deactivation", () => {
    expect(toggleSource).toContain("const nextDeactivated = !deactivated;");
    expect(toggleSource).toMatch(
      /await actions\.setUserDeactivated[\s\S]*setDeactivated\(nextDeactivated\);[\s\S]*if \(account\.role === "teacher" && nextDeactivated\) \{[\s\S]*setClassIds\(\[\]\);[\s\S]*setDirectStudentIds\(\[\]\);/,
    );
    expect(toggleSource).not.toContain("setClassIds(account.classIds)");
    expect(toggleSource).not.toContain("setDirectStudentIds(account.directStudentIds)");
  });

  it("uses cleared local collections for teacher counts and assignment buttons", () => {
    expect(source).toContain("${classIds.length} classe(s)");
    expect(source).toContain("${directStudentIds.length} élève(s) en direct");
    expect(source).toContain("const assigned = classIds.includes(cls.id);");
    expect(source).toContain("const assigned = directStudentIds.includes(student.id);");
  });

  it("explains that teacher assignments are removed and must be reassigned", () => {
    expect(toggleSource).toContain("Les affectations aux classes et aux élèves directs ont été supprimées ; elles devront être réattribuées après réactivation.");
    expect(toggleSource).toContain("Compte enseignant réactivé. Les affectations supprimées doivent être réattribuées.");
  });
});
