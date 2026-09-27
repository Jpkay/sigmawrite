import { beforeEach, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  role: vi.fn(),
  owner: vi.fn(),
  practice: vi.fn(),
  material: vi.fn(),
  journal: vi.fn(),
  client: { name: "student-db" },
  service: { name: "service-db" },
}));

vi.mock("@/lib/auth", () => ({ requireRole: f.role }));
vi.mock("@/lib/db/student", () => ({ getCurrentStudentId: f.owner }));
vi.mock("@/lib/db/practice", () => ({ getNodePractice: f.practice }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => f.client, createServiceClient: () => f.service }));
vi.mock("@/lib/diagnostic/granular/store", () => ({ SupabaseAssessmentStore: class { constructor(public db: unknown) {} } }));
vi.mock("@/lib/diagnostic/granular/practice-material-delivery", () => ({ recordPracticeMaterialDelivery: f.material }));
vi.mock("@/lib/diagnostic/granular/server-delivery-journal", () => ({ journalStudentPayload: f.journal }));
vi.mock("./practice-player", () => ({ PracticePlayer: () => null }));

import { practicePlayerDisplay } from "@/lib/diagnostic/granular/practice-player-display";
import Page from "./page";

const practice = {
  node: { id: "node", key: "key", label: "Accord", description: null, strand: "grammaire" },
  scaffoldLevel: 0,
  lesson: { family: "grammar", eyebrow: "Leçon", explanation: "Observe.", pattern: "Sujet + verbe", examples: [], exceptions: [] },
  items: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GRANULAR_DIAGNOSTIC_ENABLED", "true");
  f.owner.mockResolvedValue("owner");
  f.practice.mockResolvedValue(practice);
  f.material.mockResolvedValue(undefined);
  f.journal.mockResolvedValue(undefined);
});

it("records database material and the browser display before returning the player", async () => {
  const page = await Page({ params: Promise.resolve({ nodeId: "node" }) });
  expect(f.role).toHaveBeenCalledWith(["student"]);
  expect(f.owner).toHaveBeenCalledWith(f.client);
  expect(f.practice).toHaveBeenCalledWith("node", f.client, "owner");
  expect(f.material).toHaveBeenCalledWith(expect.objectContaining({ db: f.service }), "owner", practice);
  expect(f.journal).toHaveBeenCalledWith("owner", "legacy:practice-player", practicePlayerDisplay(practice as never));
  expect(f.material.mock.invocationCallOrder[0]).toBeLessThan(f.journal.mock.invocationCallOrder[0]);
  expect(page.props.practice).toBe(practice);
});

it("withholds the browser props when either capture write fails", async () => {
  f.material.mockRejectedValueOnce(Error("material unavailable"));
  await expect(Page({ params: Promise.resolve({ nodeId: "node" }) })).rejects.toThrow("material unavailable");
  expect(f.journal).not.toHaveBeenCalled();

  f.material.mockResolvedValueOnce(undefined);
  f.journal.mockRejectedValueOnce(Error("journal unavailable"));
  await expect(Page({ params: Promise.resolve({ nodeId: "node" }) })).rejects.toThrow("journal unavailable");
});

it("does not capture before authorization or when granular delivery is disabled", async () => {
  f.role.mockRejectedValueOnce(Error("unauthorized"));
  await expect(Page({ params: Promise.resolve({ nodeId: "node" }) })).rejects.toThrow("unauthorized");
  expect(f.practice).not.toHaveBeenCalled();
  expect(f.material).not.toHaveBeenCalled();
  expect(f.journal).not.toHaveBeenCalled();

  f.role.mockResolvedValueOnce({});
  vi.stubEnv("GRANULAR_DIAGNOSTIC_ENABLED", "false");
  await Page({ params: Promise.resolve({ nodeId: "node" }) });
  expect(f.material).not.toHaveBeenCalled();
  expect(f.journal).not.toHaveBeenCalled();
});
