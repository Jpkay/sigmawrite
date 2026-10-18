import { describe, expect, it } from "vitest";
import { activityMinutes, buildSessionPlan, newLearningSlots, planWordBursts, weaveWordBursts, WORD_SESSION, type DueWordReview, type SessionActivity } from "./session-plan";
import type { EncompassingEdge } from "@/lib/graph/fire";

const edges: EncompassingEdge[] = [
  { sourceNodeId: "pc_avoir", targetNodeId: "present_aux", strength: 0.8 },
  { sourceNodeId: "pc_avoir", targetNodeId: "pp_formation", strength: 0.9 },
  { sourceNodeId: "pc_vs_imp", targetNodeId: "pc_avoir", strength: 0.5 },
  { sourceNodeId: "pc_vs_imp", targetNodeId: "imparfait", strength: 0.5 },
];

const nodesOf = (plan: SessionActivity[]) =>
  plan.map((a) => (a.type === "review_card" ? a.cardId : a.type === "review_word" ? "words" : a.nodeId));

describe("buildSessionPlan — repetition compression", () => {
  it("prefers a task whose encompassing closure clears multiple due reviews", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: [
        { nodeId: "present_aux", overdueDays: 3 },
        { nodeId: "pp_formation", overdueDays: 2 },
      ],
      dueCards: [],
      newSteps: [{ nodeId: "pc_avoir", position: 1 }],
      encompassingEdges: edges,
      familyPairs: [],
      budget: 4,
    });
    // pc_avoir covers both dues and is still counted as a new frontier step.
    const compression = plan.find((a) => a.type === "practice" && a.role === "new");
    expect(compression).toBeDefined();
    expect(nodesOf(plan)).not.toContain("present_aux");
    expect(nodesOf(plan)).not.toContain("pp_formation");
  });

  it("a due advanced node can clear its own due sub-skills", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: [
        { nodeId: "pc_avoir", overdueDays: 5 },
        { nodeId: "present_aux", overdueDays: 3 },
        { nodeId: "pp_formation", overdueDays: 1 },
      ],
      dueCards: [],
      newSteps: [],
      encompassingEdges: edges,
      familyPairs: [],
      budget: 6,
    });
    expect(plan).toEqual([{ type: "review_node", nodeId: "pc_avoir" }]);
  });
});

describe("buildSessionPlan — explicit reviews and ordering", () => {
  it("falls back to explicit reviews, most overdue first", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: [
        { nodeId: "a", overdueDays: 1 },
        { nodeId: "b", overdueDays: 9 },
      ],
      dueCards: [{ cardId: "c1", nodeId: null, overdueDays: 4 }],
      newSteps: [],
      encompassingEdges: [],
      familyPairs: [],
      budget: 6,
    });
    expect(nodesOf(plan)).toEqual(["b", "c1", "a"]);
  });

  it("keeps the ≥25% new-learning floor even under heavy review load", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: Array.from({ length: 10 }, (_, i) => ({
        nodeId: `due_${i}`, overdueDays: i,
      })),
      dueCards: [],
      newSteps: [{ nodeId: "new_1", position: 1 }, { nodeId: "new_2", position: 2 }],
      encompassingEdges: [],
      familyPairs: [],
      budget: 8,
    });
    const news = plan.filter((a) => a.type === "practice" && a.role === "new");
    expect(plan.length).toBeLessThanOrEqual(8);
    expect(news.length).toBeGreaterThanOrEqual(2); // ceil(8 × 0.25)
  });

  it("keeps the ≥25% floor for the default six-activity budget", () => {
    expect(newLearningSlots(0.2, 6)).toBe(2);
  });

  it("uses the full review budget when no frontier work is available", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: Array.from({ length: 10 }, (_, i) => ({ nodeId: `due_${i}`, overdueDays: i })),
      dueCards: [],
      newSteps: [],
      encompassingEdges: [],
      familyPairs: [],
      budget: 6,
    });
    expect(plan).toHaveLength(6);
    expect(plan.every((activity) => activity.type === "review_node")).toBe(true);
  });

  it("shortens the itinerary instead of repeating a lone frontier step", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: Array.from({ length: 10 }, (_, i) => ({ nodeId: `due_${i}`, overdueDays: i })),
      dueCards: [],
      newSteps: [{ nodeId: "only_new", position: 1 }],
      encompassingEdges: [],
      familyPairs: [],
      budget: 6,
    });
    expect(plan).toHaveLength(4);
    expect(plan.filter((activity) => activity.type === "practice" && activity.role === "new")).toHaveLength(1);
  });

  it("fits the complete itinerary inside a wall-clock budget without dropping new learning", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: Array.from({ length: 8 }, (_, i) => ({ nodeId: `due_${i}`, overdueDays: i })),
      dueCards: [],
      newSteps: [{ nodeId: "new_1", position: 1 }, { nodeId: "new_2", position: 2 }],
      encompassingEdges: [],
      familyPairs: [],
      budget: 6,
      durationBudgetMinutes: 28,
      progressMastery: 0.2,
    });
    expect(plan.reduce((minutes, activity) => minutes + (activity.type === "review_card" ? 3 : 7), 0)).toBeLessThanOrEqual(28);
    expect(plan.filter((activity) => activity.type === "practice" && activity.role === "new")).toHaveLength(2);
  });

  it("keeps at least 25% new work after cheap reviews are fitted to time", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: [],
      dueCards: Array.from({ length: 8 }, (_, i) => ({ cardId: `card_${i}`, nodeId: null, overdueDays: i })),
      newSteps: [{ nodeId: "new_long", position: 1 }],
      encompassingEdges: [],
      familyPairs: [],
      budget: 8,
      durationBudgetMinutes: 28,
      minutesByNode: new Map([["new_long", 10]]),
    });
    const news = plan.filter((activity) => activity.type === "practice" && activity.role === "new");
    expect(news).toHaveLength(1);
    expect(news.length / plan.length).toBeGreaterThanOrEqual(0.25);
    expect(plan.reduce((minutes, activity) => minutes + (activity.type === "review_card" ? 3 : 10), 0)).toBeLessThanOrEqual(28);
  });

  it("preserves as much mastery-weighted advancement as the time cap permits", () => {
    const newSteps = Array.from({ length: 6 }, (_, i) => ({ nodeId: `new_${i}`, position: i }));
    const plan = buildSessionPlan({
      dueNodeReviews: [{ nodeId: "due", overdueDays: 4 }],
      dueCards: [],
      newSteps,
      encompassingEdges: [],
      familyPairs: [],
      budget: 6,
      progressMastery: 0.9,
      durationBudgetMinutes: 28,
      minutesByNode: new Map(newSteps.map((step) => [step.nodeId, 10])),
    });
    expect(plan.filter((activity) => activity.type === "practice" && activity.role === "new")).toHaveLength(2);
    expect(plan.reduce((minutes, activity) => minutes + (activity.type === "practice" ? 10 : 7), 0)).toBeLessThanOrEqual(28);
  });

  it("respects the total budget", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: Array.from({ length: 20 }, (_, i) => ({ nodeId: `d${i}`, overdueDays: i })),
      dueCards: Array.from({ length: 20 }, (_, i) => ({ cardId: `c${i}`, nodeId: null, overdueDays: i })),
      newSteps: Array.from({ length: 20 }, (_, i) => ({ nodeId: `n${i}`, position: i })),
      encompassingEdges: [],
      familyPairs: [],
      budget: 6,
    });
    expect(plan.length).toBe(6);
  });
});

describe("buildSessionPlan — interleaving", () => {
  it("separates same_family (confusable) nodes when possible", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: [
        { nodeId: "pc", overdueDays: 2 },
        { nodeId: "imp", overdueDays: 1 },
      ],
      dueCards: [],
      newSteps: [{ nodeId: "other", position: 1 }],
      encompassingEdges: [],
      familyPairs: [["pc", "imp"]],
      budget: 4,
    });
    const nodes = nodesOf(plan);
    const pcIndex = nodes.indexOf("pc");
    const impIndex = nodes.indexOf("imp");
    expect(Math.abs(pcIndex - impIndex)).toBeGreaterThan(1);
  });

  it("separates same-strand activities when possible", () => {
    const strands = new Map([
      ["conj_1", "conjugaison"], ["conj_2", "conjugaison"], ["ortho_1", "orthographe"],
    ]);
    const plan = buildSessionPlan({
      dueNodeReviews: [
        { nodeId: "conj_1", overdueDays: 3 },
        { nodeId: "conj_2", overdueDays: 2 },
        { nodeId: "ortho_1", overdueDays: 1 },
      ],
      dueCards: [],
      newSteps: [],
      encompassingEdges: [],
      familyPairs: [],
      strandByNode: strands,
      budget: 4,
    });
    const nodes = nodesOf(plan);
    expect(Math.abs(nodes.indexOf("conj_1") - nodes.indexOf("conj_2"))).toBeGreaterThan(1);
  });
});

describe("buildSessionPlan — edge cases", () => {
  it("empty inputs produce an empty plan", () => {
    expect(buildSessionPlan({
      dueNodeReviews: [], dueCards: [], newSteps: [],
      encompassingEdges: [], familyPairs: [],
    })).toEqual([]);
  });

  it("all-new session when nothing is due", () => {
    const plan = buildSessionPlan({
      dueNodeReviews: [], dueCards: [],
      newSteps: [{ nodeId: "n1", position: 1 }, { nodeId: "n2", position: 2 }],
      encompassingEdges: [], familyPairs: [], budget: 6,
    });
    expect(plan).toHaveLength(2);
    expect(plan.every((a) => a.type === "practice" && a.role === "new")).toBe(true);
  });
});

describe("mastery-weighted spiral", () => {
  it("increases advancement as mastery grows without eliminating review", () => {
    expect(newLearningSlots(0.3, 6)).toBe(2);
    expect(newLearningSlots(0.55, 6)).toBe(2);
    expect(newLearningSlots(0.75, 6)).toBe(3);
    expect(newLearningSlots(0.9, 6)).toBe(4);
  });
});

describe("buildSessionPlan — review_word (roadmap 2026-10 D.2)", () => {
  const due = (count: number, both = false): DueWordReview[] => Array.from({ length: count }, (_, i) => [
    { cardId: `s${i}`, senseId: `w${i}`, facet: "spelling" as const, retrievability: 0.5 + i / 100 },
    ...(both ? [{ cardId: `m${i}`, senseId: `w${i}`, facet: "meaning" as const, retrievability: 0.6 + i / 100 }] : []),
  ]).flat();
  const base = {
    dueNodeReviews: [{ nodeId: "a", overdueDays: 3 }, { nodeId: "b", overdueDays: 2 }],
    dueCards: [],
    newSteps: [{ nodeId: "n1", position: 1 }, { nodeId: "n2", position: 2 }],
    encompassingEdges: [],
    familyPairs: [],
  };
  const words = (plan: SessionActivity[]) => plan.filter((activity): activity is Extract<SessionActivity, { type: "review_word" }> => activity.type === "review_word");

  it("keeps vocabulary inside the ~4 minute budget", () => {
    const plan = buildSessionPlan({ ...base, dueWords: due(30), newWords: 3 });
    const seconds = words(plan).reduce((total, burst) => total + burst.seconds, 0);
    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThanOrEqual(WORD_SESSION.budgetMinutes * 60);
    expect(words(plan).reduce((total, burst) => total + activityMinutes(burst), 0)).toBeLessThanOrEqual(WORD_SESSION.budgetMinutes + words(plan).length);
  });

  it("caps the backlog: never more than the session card cap, lowest retrievability first", () => {
    const backlog = due(200).map((card, i) => ({ ...card, retrievability: (i * 37 % 200) / 200 }));
    const plan = buildSessionPlan({ ...base, dueWords: backlog, wordBudgetMinutes: 60 });
    const cards = words(plan).flatMap((burst) => burst.cards);
    expect(cards.length).toBe(WORD_SESSION.maxCards);
    const chosen = new Set(cards.map((card) => card.cardId));
    const lowest = [...backlog].sort((a, b) => a.retrievability - b.retrievability).slice(0, WORD_SESSION.maxCards);
    expect(lowest.every((card) => chosen.has(card.cardId))).toBe(true);
  });

  it("drops new words before reviews when time is short", () => {
    const [burst] = planWordBursts(due(19), 4, 3);
    const all = planWordBursts(due(19), 4, 3);
    expect(all.reduce((total, entry) => total + entry.newWords, 0)).toBe(0);
    expect(burst.senses).toBeGreaterThan(0);
  });

  it("introduces new words when reviews leave time", () => {
    const bursts = planWordBursts(due(3), 3);
    expect(bursts.reduce((total, entry) => total + entry.newWords, 0)).toBe(3);
  });

  it("counts both traces of one word as one item", () => {
    const bursts = planWordBursts(due(4, true), 0);
    expect(bursts.reduce((total, entry) => total + entry.cards.length, 0)).toBe(8);
    expect(bursts.reduce((total, entry) => total + entry.senses, 0)).toBe(4);
    expect(bursts.reduce((total, entry) => total + entry.seconds, 0)).toBe(4 * WORD_SESSION.secondsPerBothTraces);
  });

  it("interleaves words between other activities, never first and never two bursts side by side", () => {
    const plan = buildSessionPlan({ ...base, dueWords: due(16) });
    expect(words(plan).length).toBeGreaterThan(1);
    expect(plan[0].type).not.toBe("review_word");
    for (let i = 1; i < plan.length; i++) expect(plan[i].type === "review_word" && plan[i - 1].type === "review_word").toBe(false);
    for (const burst of words(plan)) expect(burst.senses + burst.newWords).toBeLessThanOrEqual(WORD_SESSION.burstMax * 2);
  });

  it("merges bursts when there are fewer gaps than bursts", () => {
    const bursts = planWordBursts(due(12), 0);
    expect(bursts.length).toBeGreaterThan(1);
    const woven = weaveWordBursts([{ type: "practice", nodeId: "only", role: "new" }], bursts);
    expect(woven).toHaveLength(2);
    expect(woven[0].type).toBe("practice");
    expect(words(woven)[0].cards).toHaveLength(12);
  });

  it("leaves the plan unchanged with no due words", () => {
    const withWords = buildSessionPlan({ ...base, dueWords: [], newWords: 0 });
    const without = buildSessionPlan(base);
    expect(withWords).toEqual(without);
  });

  it("reserves word minutes inside a wall-clock budget", () => {
    const plan = buildSessionPlan({ ...base, dueWords: due(10), durationBudgetMinutes: 15 });
    const total = plan.reduce((sum, activity) => sum + activityMinutes(activity), 0);
    expect(total).toBeLessThanOrEqual(15 + words(plan).length);
    expect(words(plan).length).toBeGreaterThan(0);
  });
});
