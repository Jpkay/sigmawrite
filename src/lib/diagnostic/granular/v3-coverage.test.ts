import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { buildV3Coverage } from "./v3-coverage";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import type { CanonicalDiagnosticBankArtifact } from "../item-bank";
const previous = JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")).taxonomy as TaxonomyCandidate;
const target = JSON.parse(readFileSync("generated/french-taxonomy-v3.json", "utf8")).taxonomy as TaxonomyCandidate;
const bank = JSON.parse(readFileSync("generated/diagnostic-bank-v2.json", "utf8")) as CanonicalDiagnosticBankArtifact;
const input = { previous, target, bank, independentProductionKeys: new Set<string>() };
it("covers every approved v3 competency and exact evidence definition", () => {
 const rows = buildV3Coverage(input);
 expect(rows).toHaveLength(181);
 expect(rows.flatMap(r=>r.evidence)).toHaveLength(target.nodes.reduce((s,n)=>s+n.evidence.length,0));
 expect(rows.filter(r=>!r.previousNodeExists)).toHaveLength(21);
});
it("never transfers question compatibility after changing the competency meaning", () => {
 const changed = structuredClone(target);
 changed.nodes[0].descriptionFr += " New requirement.";
 const row = buildV3Coverage({ ...input, target: changed })[0];
 expect(row.evidence.every(e=>e.compatibility==="requires_mapping_review" && e.compatibleV2Items===0)).toBe(true);
});
it("does not treat MCQ practice as production or missing live data as zero", () => {
 const key = target.nodes.find(n=>n.evidence.some(e=>e.expectation==="controlled_production"))!.key;
 const row = buildV3Coverage({ ...input, liveItems: [{ nodeKey:key, reviewStatus:"human_approved", responseType:"mcq" }] }).find(r=>r.key===key)!;
 expect(row.evidence.find(e=>e.expectation==="controlled_production")?.approvedLivePracticeCandidates).toBe(0);
 expect(buildV3Coverage(input).find(r=>r.key===key)!.evidence[0].approvedLivePracticeCandidates).toBeNull();
});
it("keeps independent writing verification separate from short diagnostic questions", () => {
 const rows=buildV3Coverage(input);
 const writing=rows.flatMap(r=>r.evidence).filter(e=>e.expectation==="independent_production");
 expect(writing.length).toBeGreaterThan(0);
 expect(writing.every(e=>e.assessmentStage==="learning_verification" && e.missingApprovedItems===null && !e.readyForPublication)).toBe(true);
});

it("uses live review eligibility without carrying stale artifact approval", () => {
 const rows = buildV3Coverage({...input,liveDiagnosticReviews:[]});
 expect(rows.flatMap(r=>r.evidence).every(e=>e.approvedCompatibleLiveItems===0)).toBe(true);
 const approved = bank.items.find(i=>i.reviewStatus==="human_approved")!;
 const changed = buildV3Coverage({...input,liveDiagnosticReviews:[{itemKey:approved.itemKey,eligible:true,unchanged:false}]});
 expect(changed.flatMap(r=>r.evidence).every(e=>e.approvedCompatibleLiveItems===0)).toBe(true);
});
