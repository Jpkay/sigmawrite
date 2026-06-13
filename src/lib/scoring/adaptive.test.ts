import { describe, it, expect } from "vitest";
import {
  updateSkillEstimate,
  updateSkillsFromSession,
  INITIAL_SKILL,
  type SkillEstimate,
} from "./skill-estimate";
import { nextBand, detectFoundationRepair, selectNextStep } from "./adaptive";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";

describe("updateSkillEstimate", () => {
  it("raises ability on a correct answer and lowers on a wrong one", () => {
    expect(updateSkillEstimate(INITIAL_SKILL, true).ability).toBeGreaterThan(50);
    expect(updateSkillEstimate(INITIAL_SKILL, false).ability).toBeLessThan(50);
  });
  it("reduces uncertainty and counts evidence", () => {
    const a = updateSkillEstimate(INITIAL_SKILL, true);
    const b = updateSkillEstimate(a, true);
    expect(b.uncertainty).toBeLessThan(a.uncertainty);
    expect(b.evidenceCount).toBe(2);
  });
  it("converges upward under repeated correct answers", () => {
    let e = INITIAL_SKILL;
    for (let i = 0; i < 6; i++) e = updateSkillEstimate(e, true);
    expect(e.ability).toBeGreaterThan(75);
  });
});

describe("updateSkillsFromSession", () => {
  it("updates an estimate per question skill", () => {
    const text = SEED_TEXT_BY_ID["football-migration"];
    const allCorrect = Object.fromEntries(
      text.questions.map((q) => [q.id, q.correctIndex])
    );
    const skills = updateSkillsFromSession({}, text, allCorrect);
    expect(skills["literal_comprehension"].ability).toBeGreaterThan(50);
    expect(skills["inference"].evidenceCount).toBe(1);
  });
});

describe("nextBand (one-step rule, PRD §G)", () => {
  it("moves one band on increase/reduce and stays on maintain", () => {
    expect(nextBand("Secondary 7A", "increase_difficulty")).toBe("Secondary 7B");
    expect(nextBand("Secondary 7B", "reduce_difficulty")).toBe("Secondary 7A");
    expect(nextBand("Secondary 7A", "maintain")).toBe("Secondary 7A");
  });
  it("clamps at the extremes", () => {
    expect(nextBand("Foundation 5A", "reduce_difficulty")).toBe("Foundation 5A");
    expect(nextBand("Advanced 11-12", "increase_difficulty")).toBe("Advanced 11-12");
  });
});

describe("detectFoundationRepair (PRD §K)", () => {
  const skills: Record<string, SkillEstimate> = {
    cause_consequence: { ability: 30, uncertainty: 40, evidenceCount: 3 },
    inference: { ability: 80, uncertainty: 40, evidenceCount: 3 },
  };
  it("returns the weakest repairable skill below threshold", () => {
    expect(detectFoundationRepair(skills)).toBe("cause_consequence");
  });
  it("ignores skills without evidence", () => {
    expect(
      detectFoundationRepair({
        cause_consequence: { ability: 20, uncertainty: 100, evidenceCount: 0 },
      })
    ).toBeNull();
  });
  it("returns null when all are above threshold", () => {
    expect(detectFoundationRepair({ inference: skills.inference })).toBeNull();
  });
});

describe("selectNextStep", () => {
  it("routes a triggered repair to a micro-lesson", () => {
    const step = selectNextStep({
      interests: ["football"],
      currentBand: "Secondary 7A",
      action: "foundation_repair",
      currentInterest: "football",
      skills: { cause_consequence: { ability: 30, uncertainty: 40, evidenceCount: 2 } },
    });
    expect(step).toEqual({ type: "repair", skillKey: "cause_consequence" });
  });

  it("raises the target band when increasing difficulty", () => {
    const step = selectNextStep({
      interests: ["football"],
      currentBand: "Secondary 7A",
      action: "increase_difficulty",
      skills: {},
    });
    expect(step.type).toBe("read");
    if (step.type === "read") expect(step.band).toBe("Secondary 7B");
  });

  it("changes topic to a different interest's text", () => {
    const step = selectNextStep({
      interests: ["football", "social_media"],
      currentBand: "Secondary 7B",
      action: "change_topic",
      currentInterest: "football",
      skills: {},
    });
    expect(step.type).toBe("read");
    if (step.type === "read") expect(step.textId).toBe("social-media-attention");
  });
});
