import { beforeEach, describe, expect, it, vi } from "vitest";
const f = vi.hoisted(() => ({ journal: vi.fn(), record: vi.fn(), introduce: vi.fn(), load: vi.fn(), unlocked: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireRole: vi.fn(async () => ({ id: "p" })) }));
vi.mock("@/lib/db/student", () => ({ getCurrentStudentId: vi.fn(async () => "student-1") }));
vi.mock("@/lib/diagnostic/access", () => ({ requireStudentAccessAuthorized: vi.fn(), requireStudentLearningUnlocked: f.unlocked }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ rpc: vi.fn(async () => ({ data: { allowed: true }, error: null })) })), createServiceClient: vi.fn(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) })) }));
vi.mock("@/lib/diagnostic/granular/server-delivery-journal", () => ({ journalStudentPayload: f.journal }));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/vocabulary/server", () => ({ recordWordReviewAttempt: f.record, introduceWord: f.introduce }));
vi.mock("@/lib/vocabulary/session/loader", () => ({ loadWordSessionData: f.load, loadRelatedWords: vi.fn() }));
import { deliveredTextFragments } from "@/lib/diagnostic/granular/delivery-journal";
import { introduceSessionWord, loadWordSession, submitWordAnswer } from "./words";

const word = { senseId: "s1", word: "intrépide", definition: "Qui n'a pas peur du danger.", forms: ["intrépide"], partOfSpeech: null, domain: null, firstSeen: { sentence: "Le gardien intrépide plonge.", interest: "football" }, examples: [], relations: [], audioUrl: null };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.WORD_ITEM_SIGNING_SECRET = "test";
  f.journal.mockImplementation(async (_id: string, _boundary: string, payload: unknown) => { deliveredTextFragments(payload); return payload; });
  f.record.mockResolvedValue({ outcomes: [], status: "en_route" });
  f.load.mockResolvedValue({
    input: { seed: "x", interests: ["football"], reviews: [{ senseId: "s1", facets: ["spelling", "meaning"], retrievability: 0.4, lapses: 1, status: "a_revoir" }], introductions: [], words: new Map([["s1", word]]), pool: [], explainEnabled: false, maxItems: 4 },
    plan: { paused: false, holiday: null, rampActive: false }, validation: new Map(), introductions: new Map(),
  });
});

describe("word session actions", () => {
  it("loads a burst whose journal payload is JSON text and whose items hide the answer", async () => {
    const session = await loadWordSession({ units: 4, newWords: 0 });
    expect(session.unavailable).toBe(false);
    expect(session.items).toHaveLength(1);
    expect(JSON.stringify(session.items[0])).not.toContain("intrépide");
    expect(f.journal).toHaveBeenCalledWith("student-1", "words:session", expect.anything());
  });

  it("grades on the server, highlights the wrong letters and celebrates a rescued word", async () => {
    const { items } = await loadWordSession({ units: 4, newWords: 0 });
    const wrong = await submitWordAnswer({ token: items[0].token, answer: "intrepide", attempt: 0 });
    expect(wrong).toMatchObject({ outcome: "accent", correct: false, expected: "intrépide" });
    expect(wrong.segments?.find((segment) => segment.kind === "accent")?.text).toBe("é");
    expect(f.record).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ senseId: "s1", format: "type_from_definition", facets: ["spelling", "meaning"], correct: false, accentOnly: true, source: "review" }));
    const right = await submitWordAnswer({ token: items[0].token, answer: "intrépide", attempt: 1 });
    expect(right).toMatchObject({ outcome: "correct", celebration: "Tu as repêché « intrépide » !" });
  });

  it("never fails the page: a loading error gives an empty burst", async () => {
    f.load.mockRejectedValue(new Error("db down"));
    expect(await loadWordSession({ units: 4, newWords: 0 })).toMatchObject({ items: [], unavailable: true });
  });

  it("refuses a token for another kind of item", async () => {
    const { items } = await loadWordSession({ units: 4, newWords: 0 });
    await expect(introduceSessionWord({ token: items[0].token })).rejects.toThrow(/expiré/u);
  });
});
