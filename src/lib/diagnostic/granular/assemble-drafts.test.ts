import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {assembleDraftBank,type DraftExpansion} from "./assemble-drafts";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const bank=read("generated/diagnostic-bank-v3-draft.json"),taxonomy=read("generated/french-taxonomy-v3.json").taxonomy;
const expansion=read("generated/french-v3-reading-expansion.json") as DraftExpansion;
function resign(source:DraftExpansion){const {checksum:previous,...content}=source;void previous;source.checksum=checksum(content);return source;}
it("preserves base entries and approval state while assembling mapped drafts",()=>{
 const before=JSON.stringify(bank),result=assembleDraftBank(bank,taxonomy,[expansion]);
 expect(result.bank.items).toHaveLength(bank.items.length+expansion.items.length);
 expect(JSON.stringify(bank)).toBe(before);
 expect(result.bank.items.slice(0,bank.items.length)).toEqual(bank.items);
 expect(result.bank.manifest!.eligibleItemCount).toBe(238);
 expect(result.annotations).toHaveLength(expansion.items.length);
});
it("rejects stale provenance, missing mappings, duplicate sources and inserted approvals",()=>{
 const stale=structuredClone(expansion);stale.sourceBankChecksum="other";
 expect(()=>assembleDraftBank(bank,taxonomy,[resign(stale)])).toThrow(/Stale expansion/);
 expect(()=>assembleDraftBank(bank,taxonomy,[expansion,expansion])).toThrow(/Duplicate expansion/);
 const missing=structuredClone(expansion);missing.annotations.pop();
 expect(()=>assembleDraftBank(bank,taxonomy,[resign(missing)])).toThrow(/exactly one/);
 const edited=structuredClone(expansion);edited.items[0].item.promptFr+=" changed";
 expect(()=>assembleDraftBank(bank,taxonomy,[resign(edited)])).toThrow(/Stale item mapping/);
 const approved=structuredClone(expansion);approved.items[0].reviewStatus="human_approved";
 expect(()=>assembleDraftBank(bank,taxonomy,[resign(approved)])).toThrow(/introduce approval/);
});
