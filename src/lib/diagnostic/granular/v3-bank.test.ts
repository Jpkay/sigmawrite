import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { prepareV3Bank } from "./v3-bank";
const read = (path:string)=>JSON.parse(readFileSync(path,"utf8"));
const previous = read("generated/french-taxonomy-v2.json"), target = read("generated/french-taxonomy-v3.json"), source = read("generated/diagnostic-bank-v2.json");
const input = { previous: previous.taxonomy, target: target.taxonomy, source,
 targetRelease:{key:target.release.key,version:target.release.version,checksum:target.manifest.contentChecksum} };
it("reuses exact items without mutating the approved source or inventing reviews",()=>{
 const before=JSON.stringify(source), result=prepareV3Bank(input);
 expect(JSON.stringify(source)).toBe(before);
 for(const item of result.bank.items) expect(item).toEqual(source.items.find((i:{itemKey:string})=>i.itemKey===item.itemKey));
 expect(result.bank.taxonomy.releaseKey).toBe("french-taxonomy-v3");
 expect(result.reconciliation.status).toBe("draft_requires_release_validation");
});
it("quarantines broad pronoun items rather than spreading their approval to new nodes",()=>{
 const result=prepareV3Bank(input);
 expect(result.reconciliation.excluded).toHaveLength(6);
 expect(result.reconciliation.excluded.every(i=>i.previousNodeKey==="construction_pronom_objet")).toBe(true);
 expect(result.bank.items.some(i=>i.item.nodeKey==="construction_pronom_objet")).toBe(false);
 expect(result.reconciliation.missingSlots.some(i=>i.nodeKey==="produire_pronom_cod")).toBe(true);
});
it("rejects implicit transfer after evidence criteria change",()=>{
 const changed=structuredClone(input);
 changed.target.nodes[0].evidence[0].successCriteria.minimumDistinctItems=8;
 const result=prepareV3Bank(changed);
 expect(result.bank.items.filter(i=>i.item.nodeKey===changed.target.nodes[0].key)).toHaveLength(0);
});
