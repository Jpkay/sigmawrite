import {beforeEach, expect, it, vi} from "vitest";
const getUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({createClient: async () => ({auth: {getUser}})}));
import {GET} from "./route";
beforeEach(() => getUser.mockReset());
it("restricts saved answer keys to the demo account", async () => {
 getUser.mockResolvedValue({data:{user:null},error:null});
 expect((await GET(new Request("https://app.trouvetaplume.com/student/diagnostic/demo-review"))).status).toBe(302);
 getUser.mockResolvedValue({data:{user:{id:"another-student"}},error:null});
 const denied=await GET(new Request("https://app.trouvetaplume.com/student/diagnostic/demo-review"));
 expect(denied.status).toBe(403);
 expect(await denied.text()).not.toContain("Réponse attendue enregistrée");
 getUser.mockResolvedValue({data:{user:{id:"c0a033fc-2b2a-480e-b3d1-28d562901fd7"}},error:null});
 const allowed=await GET(new Request("https://app.trouvetaplume.com/student/diagnostic/demo-review"));
 expect(allowed.headers.get("cache-control")).toBe("private, no-store");
 const html=await allowed.text();
 expect(html.match(/<article data-result=/g)).toHaveLength(48);
 expect(html.match(/<article data-result="wrong"/g)).toHaveLength(17);
});
