import { describe, expect, it } from "vitest";
import { hasStudentPathCoverage } from "./activation";

const controlled = {
  record_id: "controlled",
  record_snapshot: { evidence: [{ expectation: "controlled_production" }] },
};
const independent = {
  record_id: "independent",
  record_snapshot: { evidence: [{ expectation: "independent_production" }] },
};

describe("student path taxonomy activation", () => {
  it("requires an approved lesson for every node", () => {
    expect(hasStudentPathCoverage({
      nodes: [controlled, independent],
      approvedLessonNodeIds: ["controlled"],
      approvedItems: [1, 2, 3].map((id) => ({ id: String(id), primary_node_id: "controlled" })),
    })).toBe(false);
  });

  it("requires three distinct approved exercises for controlled production", () => {
    expect(hasStudentPathCoverage({
      nodes: [controlled],
      approvedLessonNodeIds: ["controlled"],
      approvedItems: [
        { id: "one", primary_node_id: "controlled" },
        { id: "two", primary_node_id: "controlled" },
      ],
    })).toBe(false);
  });

  it("does not require item-bank exercises for independent production", () => {
    expect(hasStudentPathCoverage({
      nodes: [controlled, independent],
      approvedLessonNodeIds: ["controlled", "independent"],
      approvedItems: [1, 2, 3].map((id) => ({ id: String(id), primary_node_id: "controlled" })),
    })).toBe(true);
  });
});
