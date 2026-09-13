import { beforeEach, describe, expect, it, vi } from "vitest";

const { authorizeJob, processPassageAutomation, withJobRun } = vi.hoisted(() => ({
  authorizeJob: vi.fn(),
  processPassageAutomation: vi.fn(),
  withJobRun: vi.fn(async (_name: string, work: (db: object) => Promise<{ result: unknown; processed: number }>) => {
    const output = await work({});
    return output.result;
  }),
}));

vi.mock("@/lib/jobs", () => ({ authorizeJob, withJobRun }));
vi.mock("@/lib/content/automation/worker", () => ({ processPassageAutomation }));

import { GET } from "./route";

describe("passage automation job route", () => {
  beforeEach(() => {
    authorizeJob.mockReset();
    processPassageAutomation.mockReset();
    withJobRun.mockClear();
  });

  it("rejects an unauthenticated request before claiming or processing a job", async () => {
    authorizeJob.mockReturnValue(false);

    const response = await GET(new Request("https://example.test/api/jobs/passage-automation"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(withJobRun).not.toHaveBeenCalled();
    expect(processPassageAutomation).not.toHaveBeenCalled();
  });

  it("processes an authorized request through the idempotent job boundary", async () => {
    authorizeJob.mockReturnValue(true);
    processPassageAutomation.mockResolvedValue({ mode: "shadow", results: [{ candidateId: "candidate", decision: "human_review" }] });

    const request = new Request("https://example.test/api/jobs/passage-automation", { headers: { authorization: "Bearer test-secret" } });
    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ mode: "shadow", results: [{ candidateId: "candidate", decision: "human_review" }] });
    expect(authorizeJob).toHaveBeenCalledWith(request);
    expect(withJobRun).toHaveBeenCalledWith("passage_automation", expect.any(Function));
    expect(processPassageAutomation).toHaveBeenCalledOnce();
  });
});
