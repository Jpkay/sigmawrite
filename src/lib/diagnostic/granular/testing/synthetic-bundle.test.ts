import type {SupabaseClient} from "@supabase/supabase-js";
import {checksum} from "@/lib/taxonomy/validate";
vi.mock("server-only",()=>({}));
import {SupabaseAssessmentStore} from "../store";
import {readFileSync} from "node:fs";
import {expect,it,vi} from "vitest";
import {buildSyntheticIntegrationBundle} from "./synthetic-bundle";
import {inspectReleaseBank} from "../release-bank";
import {inspectQuestionPools} from "../question-pools";
const artifact=JSON.parse(readFileSync("generated/french-taxonomy-v3.json","utf8"));
it("builds a full-graph test bundle accepted by real pool, bank and teaching validators",async()=>{
 const bundle=buildSyntheticIntegrationBundle(artifact,{taxonomyId:"test-taxonomy",bankId:"test-bank"});
 expect(inspectReleaseBank(bundle)).toBe(true);expect(inspectQuestionPools(bundle.assessment)).toEqual({ok:true,issues:[]});
 expect(new Set(bundle.assessment.skills.map(skill=>skill.nodeKey)).size).toBe(181);
 expect(bundle.assessment.skills).toHaveLength(257);
 expect(bundle.bank.items.every(entry=>entry.item.promptFr.startsWith("TEST UNIQUEMENT"))).toBe(true);
 expect(bundle.teachingContent).toHaveLength(257);
 // Only the database transport is substituted. The store's normal release
 // guards and content validators run unchanged against the full fixture.
 const rows:Record<string,Record<string,unknown>>={granular_assessment_releases:{id:"release",status:"published",taxonomy_release_id:"test-taxonomy",bank_release_id:"test-bank",bundle,content_checksum:checksum(bundle)},taxonomy_releases:{id:"test-taxonomy",status:"published",manifest_checksum:bundle.assessment.taxonomyChecksum},diagnostic_item_bank_releases:{id:"test-bank",taxonomy_release_id:"test-taxonomy",status:"published",manifest_checksum:bundle.assessment.bankChecksum}};
 const db={from:(table:string)=>{
  const filters:Array<[string,unknown]>=[];
  const query={select:()=>query,eq:(key:string,value:unknown)=>{filters.push([key,value]);return query;},maybeSingle:async()=>({data:rows[table]&&filters.every(([key,value])=>rows[table][key]===value)?rows[table]:null,error:null})};return query;
 }};
 expect(await new SupabaseAssessmentStore(db as unknown as SupabaseClient).release("release")).toEqual(bundle);
 // A newly calculated bundle checksum cannot authorize removing graph edges.
 const brokenGraph=structuredClone(bundle);brokenGraph.assessment.skills.find(skill=>skill.prerequisites.length>0)!.prerequisites=[];
 rows.granular_assessment_releases.bundle=brokenGraph;rows.granular_assessment_releases.content_checksum=checksum(brokenGraph);
 expect(await new SupabaseAssessmentStore(db as unknown as SupabaseClient).release("release")).toBeNull();
 for(const key of ["guessProbability","expectedSeconds","difficulty"] as const){
  const altered=structuredClone(bundle),probe=altered.assessment.probes.find(probe=>probe.guessProbability===.25)!;
  probe[key]=key==="guessProbability"?.01:key==="expectedSeconds"?1:.99;
  // These values satisfy the generic numeric/pool schema. The release must
  // additionally prove that they agree with the reviewed source question.
  expect(inspectQuestionPools(altered.assessment).ok).toBe(true);
  rows.granular_assessment_releases.bundle=altered;rows.granular_assessment_releases.content_checksum=checksum(altered);
  expect(await new SupabaseAssessmentStore(db as unknown as SupabaseClient).release("release")).toBeNull();
 }
 const changed=structuredClone(bundle);changed.assessment.skills.shift();expect(inspectReleaseBank(changed)).toBe(false);
 const collapsed=structuredClone(bundle);collapsed.assessment.skills.find(skill=>skill.samplingGroup==="orthographe_lexicale")!.samplingGroup="orthographe_grammaticale";
 expect(inspectReleaseBank(collapsed)).toBe(false);
},15_000); // Full-graph validation includes several hostile bundle variants.
