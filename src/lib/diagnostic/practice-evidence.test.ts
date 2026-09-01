import { describe, expect, it } from "vitest";
import { nodePracticeEvidenceExpectation } from "./practice-evidence";

describe("node practice evidence", () => {
  it("treats an MCQ as receptive evidence", () => {
    expect(nodePracticeEvidenceExpectation("mcq")).toBe("receptive");
  });

  it.each(["short_answer", "cloze", "transform"])(
    "treats %s as controlled production",
    (responseType) => {
      expect(nodePracticeEvidenceExpectation(responseType)).toBe("controlled_production");
    },
  );

  it("never upgrades an unsupported writing shape to independent production", () => {
    expect(nodePracticeEvidenceExpectation("written")).toBe("receptive");
  });
});
