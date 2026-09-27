import {beforeEach, expect, it, vi} from "vitest";
const getUser = vi.hoisted(() => vi.fn());
const journal = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({role: "student", studentId: "student-row"}));
const getCurrentStudentId = vi.hoisted(() => vi.fn(async () => state.studentId));
vi.mock("@/lib/supabase/server", () => ({createClient: async () => ({
 auth: {getUser},
 from: () => {
  const query = {select: () => query, eq: () => query, maybeSingle: async () => ({data:{role:state.role},error:null})};
  return query;
 },
})}));
vi.mock("@/lib/db/student", () => ({getCurrentStudentId}));
vi.mock("@/lib/diagnostic/granular/server-delivery-journal", () => ({journalStudentPayload: journal}));
import {GET} from "./route";
import {demoReviewDocumentDisplay, demoReviewForbiddenDisplay} from "@/lib/diagnostic/granular/demo-review-display";
beforeEach(() => {
 getUser.mockReset();
 journal.mockReset();
 getCurrentStudentId.mockClear();
 state.role="student";
 state.studentId="student-row";
 journal.mockImplementation(async (_owner, _boundary, payload) => payload);
});
it("restricts saved answer keys to the demo account", async () => {
 getUser.mockResolvedValue({data:{user:null},error:null});
 expect((await GET(new Request("https://app.trouvetaplume.com/student/diagnostic/demo-review"))).status).toBe(302);
 expect(journal).not.toHaveBeenCalled();
 getUser.mockResolvedValue({data:{user:{id:"another-student"}},error:null});
 const denied=await GET(new Request("https://app.trouvetaplume.com/student/diagnostic/demo-review"));
 expect(denied.status).toBe(403);
 expect(await denied.text()).not.toContain("Réponse attendue enregistrée");
 expect(journal).toHaveBeenLastCalledWith("student-row","legacy:diagnostic-demo-review-forbidden",demoReviewForbiddenDisplay());
 getUser.mockResolvedValue({data:{user:{id:"921b350e-61dc-4f0d-a8b7-a2717e94f902"}},error:null});
 state.studentId="demo-student-row";
 const allowed=await GET(new Request("https://app.trouvetaplume.com/student/diagnostic/demo-review"));
 expect(allowed.headers.get("cache-control")).toBe("private, no-store");
 const html=await allowed.text();
 expect(journal).toHaveBeenLastCalledWith("demo-student-row","legacy:diagnostic-demo-review",demoReviewDocumentDisplay(html));
 expect(html.match(/<article data-result=/g)).toHaveLength(48);
 expect(html.match(/<article data-result="wrong"/g)).toHaveLength(17);
});
it("preserves the forbidden response for an authenticated admin without inventing a student owner", async () => {
 state.role="platform_admin";
 getUser.mockResolvedValue({data:{user:{id:"admin-auth-user"}},error:null});
 const denied=await GET(new Request("https://app.trouvetaplume.com/student/diagnostic/demo-review"));
 expect(denied.status).toBe(403);
 expect(await denied.text()).toBe("Cette démonstration est accessible avec le compte doves.demo.");
 expect(getCurrentStudentId).not.toHaveBeenCalled();
 expect(journal).not.toHaveBeenCalled();
});
it("withholds forbidden and authorized documents when their capture fails", async () => {
 journal.mockRejectedValue(Error("capture unavailable"));
 getUser.mockResolvedValue({data:{user:{id:"another-student"}},error:null});
 await expect(GET(new Request("https://app.trouvetaplume.com/student/diagnostic/demo-review"))).rejects.toThrow("capture unavailable");

 getUser.mockResolvedValue({data:{user:{id:"921b350e-61dc-4f0d-a8b7-a2717e94f902"}},error:null});
 state.studentId="demo-student-row";
 await expect(GET(new Request("https://app.trouvetaplume.com/student/diagnostic/demo-review"))).rejects.toThrow("capture unavailable");
});
