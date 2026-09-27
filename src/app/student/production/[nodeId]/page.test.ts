import { beforeEach, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({ role: vi.fn(), load: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireRole: f.role }));
vi.mock("@/lib/actions/student", () => ({ loadIndependentProductionTask: f.load }));
vi.mock("./production-player", () => ({ IndependentProductionPlayer: () => null }));

import Page from "./page";

const task = { nodeId: "node", minimumWords: 80, maximumWords: 120 };
beforeEach(() => {
  vi.clearAllMocks();
  f.role.mockResolvedValue({});
  f.load.mockResolvedValue(task);
});

it("authorizes before loading and returns only the captured task", async () => {
  const page = await Page({ params: Promise.resolve({ nodeId: "node" }) });
  expect(f.role).toHaveBeenCalledWith(["student"]);
  expect(f.role.mock.invocationCallOrder[0]).toBeLessThan(f.load.mock.invocationCallOrder[0]);
  expect(f.load).toHaveBeenCalledWith({ nodeId: "node" });
  expect(page.props.task).toBe(task);
});

it("does not load or render a task after authorization failure", async () => {
  f.role.mockRejectedValueOnce(Error("unauthorized"));
  await expect(Page({ params: Promise.resolve({ nodeId: "node" }) })).rejects.toThrow("unauthorized");
  expect(f.load).not.toHaveBeenCalled();
});

it("withholds the player when the task action fails closed", async () => {
  f.load.mockRejectedValueOnce(Error("journal unavailable"));
  await expect(Page({ params: Promise.resolve({ nodeId: "node" }) })).rejects.toThrow("journal unavailable");
});
