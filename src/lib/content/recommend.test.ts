import { describe, expect, it } from "vitest";
import { rankInterestSignals, type InterestSignal } from "./recommend";

const base: InterestSignal = { interestKey: "science", declaredStrength: 1, inferredStrength: 0.7, completionRate: 0.9, avgSuccess: 0.82, avgTimeOnTask: 600, abandonCount: 0 };

describe("rankInterestSignals", () => {
  it("changes topic after high performance but low engagement", () => expect(rankInterestSignals([{ ...base, inferredStrength: 0.1, completionRate: 0.2, avgSuccess: 0.9 }])[0].reason).toBe("explore_new_topic"));
  it("keeps an engaging topic while lowering complexity after struggle", () => { const result = rankInterestSignals([{ ...base, avgSuccess: 0.55 }])[0]; expect(result.reason).toBe("keep_topic_lower_complexity"); expect(result.difficultyAdjustment).toBe(-1); });
  it("raises complexity when engagement and success are both high", () => expect(rankInterestSignals([{ ...base, avgSuccess: 0.96 }])[0].difficultyAdjustment).toBe(1));
  it("penalizes repeated abandonment", () => { const ranked = rankInterestSignals([{ ...base, interestKey: "abandoned", abandonCount: 2 }, { ...base, interestKey: "completed", abandonCount: 0 }]); expect(ranked[0].interestKey).toBe("completed"); });
});
