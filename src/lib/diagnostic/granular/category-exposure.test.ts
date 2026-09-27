import {expect,it} from "vitest";
import type {Probe} from "./engine";
import {categoryExposurePriority} from "./category-exposure";
const probe=(id:string,skillId="skill",mode:Probe["mode"]="recognition",samplingCategory:string|undefined="category"):Probe=>({id,skillId,mode,samplingCategory,contextId:id,difficulty:.5,guessProbability:.25,expectedSeconds:30});
it("counts known question exposure once, separately for each skill and response mode",()=>{
 const bank=[probe("a"),probe("b"),probe("other-skill","other"),probe("production","skill","production"),probe("uncategorized")];
 bank[4].samplingCategory=undefined;
 const before=JSON.stringify(bank),priority=categoryExposurePriority(bank,["a","a","production","unknown","uncategorized"]);
 expect(priority(bank[0])).toBe(1);expect(priority(bank[1])).toBe(1);
 expect(priority(bank[2])).toBe(0);expect(priority(bank[3])).toBe(1);expect(priority(bank[4])).toBe(0);
 expect(priority(probe("new-category","skill","recognition","unseen"))).toBe(0);
 expect(JSON.stringify(bank)).toBe(before);
});
