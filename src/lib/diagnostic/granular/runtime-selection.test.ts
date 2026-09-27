import {expect,it} from "vitest";
import {selectGranularRuntime} from "./runtime-selection";
it("preserves completed legacy results on rollout and starts new students in the granular runtime",()=>{
 expect(selectGranularRuntime({enabled:true,hasLegacyResult:true,hasGranularSession:false,restart:false})).toBe(false);
 expect(selectGranularRuntime({enabled:true,hasLegacyResult:false,hasGranularSession:false,restart:false})).toBe(true);
});
it("resumes granular work or honours an explicit reassessment without bypassing the feature switch",()=>{
 expect(selectGranularRuntime({enabled:true,hasLegacyResult:true,hasGranularSession:true,restart:false})).toBe(true);
 expect(selectGranularRuntime({enabled:true,hasLegacyResult:true,hasGranularSession:false,restart:true})).toBe(true);
 expect(selectGranularRuntime({enabled:false,hasLegacyResult:false,hasGranularSession:true,restart:true})).toBe(false);
});
