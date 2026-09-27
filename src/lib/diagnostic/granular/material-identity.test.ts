import {expect,it} from "vitest";
import {materialIdentity} from "./material-identity";
it("normalizes cosmetic differences without dropping meaningful French accents",()=>{
 expect(materialIdentity("sentence","  L’ÉLÈVE   lit. ")).toBe(materialIdentity("sentence","l'e\u0301le\u0300ve lit !"));
 expect(materialIdentity("word","a")).not.toBe(materialIdentity("word","à"));
 expect(materialIdentity("word","sur")).not.toBe(materialIdentity("word","sûr"));
});
it("keeps kinds separate and emits only hashed material identities",()=>{
 const word=materialIdentity("word","cheval");
 expect(word).toMatch(/^word:sha256:[a-f0-9]{64}$/);
 expect(word).not.toContain("cheval");
 expect(word).not.toBe(materialIdentity("sentence","cheval"));
 expect(()=>materialIdentity("sentence","   ")).toThrow();
});
