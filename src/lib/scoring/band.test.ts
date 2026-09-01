import { describe, expect, it } from "vitest";
import { targetLevelProfile } from "./band";

describe("targetLevelProfile", () => {
  it("turns an internal secondary band into clear reviewer context", () => {
    expect(targetLevelProfile("Secondary 7A")).toEqual({
      gradeLabel: "7e année",
      readerLabel: "Lecteur de 12–13 ans",
      stageLabel: "Début du secondaire · début d’année",
      guidance: "Vocabulaire scolaire intermédiaire et quelques inférences simples.",
      color: "blue",
    });
  });

  it("describes advanced readers without exposing an internal code", () => {
    expect(targetLevelProfile("Advanced 11-12").gradeLabel).toBe("11e–12e année");
    expect(targetLevelProfile("Advanced 11-12").readerLabel).toBe("Lecteur de 16 à 18 ans");
  });

  it("uses a safe prompt when the target is missing", () => {
    expect(targetLevelProfile(null).gradeLabel).toBe("Niveau à confirmer");
  });
});
