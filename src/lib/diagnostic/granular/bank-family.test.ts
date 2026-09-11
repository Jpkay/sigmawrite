import {expect,it} from "vitest";
import {isFrenchGranularBankKey} from "./bank-family";
it("accepts explicit immutable French v3 revisions",()=>{
 for(const key of ["french-diagnostic-bank-v3","french-diagnostic-bank-v3-r1","french-diagnostic-bank-v3-r24"])expect(isFrenchGranularBankKey(key)).toBe(true);
});
it("excludes legacy, unrelated and ambiguous bank keys",()=>{
 for(const key of ["french-diagnostic-bank-v2","french-diagnostic-bank-v30","science-v3","french-diagnostic-bank-v3-r0","french-diagnostic-bank-v3-r01","french-diagnostic-bank-v3-draft","french-diagnostic-bank-v3\n"])expect(isFrenchGranularBankKey(key)).toBe(false);
});
