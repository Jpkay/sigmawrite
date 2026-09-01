import { describe, expect, it } from "vitest";
import { safeAuthRedirect } from "./auth-redirect";

describe("safeAuthRedirect",()=>{
  it("accepts internal application paths",()=>expect(safeAuthRedirect("/student/progress?tab=skills","/student")).toBe("/student/progress?tab=skills"));
  it.each(["https://evil.test","//evil.test","javascript:alert(1)","/\\evil.test","/%2f%2fevil.test","/%5cevil.test"])("rejects unsafe target %s",target=>expect(safeAuthRedirect(target,"/student")).toBe("/student"));
});
