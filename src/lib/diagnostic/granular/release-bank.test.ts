import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {adaptV3ForAssessment} from "./v3-adapter";
import {inspectReleaseBank} from "./release-bank";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const bank=read("generated/diagnostic-bank-v3-draft.json"),artifact=read("generated/french-taxonomy-v3.json");
const bundle={bank,assessment:adaptV3ForAssessment({bank,artifact}),taxonomyId:"taxonomy",bankId:"bank"};
it("validates the real bank binding while refusing replacement or incomplete parent graphs",()=>{
 expect(inspectReleaseBank(bundle)).toBe(true); // Bank check only; pool coverage remains insufficient.
 expect(inspectReleaseBank({...bundle,assessment:{...bundle.assessment,skills:bundle.assessment.skills.slice(1)}})).toBe(false);
 expect(inspectReleaseBank({...bundle,assessment:{...bundle.assessment,taxonomyChecksum:"other"}})).toBe(false);
 const changed=structuredClone(bundle);changed.bank.items[0].item.promptFr+=" changed";
 expect(inspectReleaseBank(changed)).toBe(false);
 const weakened=structuredClone(bundle),first=weakened.assessment.skills[0];
 first.evidenceRequirements![first.modes[0]]!.minimumItems=1;
 expect(inspectReleaseBank(weakened)).toBe(false);
});
it("rejects unapproved and wrongly targeted questions inside an otherwise valid bank",()=>{
 const changed=structuredClone(bundle);
 changed.assessment.probes[0].id=read("docs/diagnostic/v3-item-repairs.json")[0].itemKey;
 expect(inspectReleaseBank(changed)).toBe(false);
 const wrongTarget=structuredClone(bundle);wrongTarget.assessment.probes[0].skillId=wrongTarget.assessment.skills.find(s=>s.nodeKey!==bank.items.find((i:{itemKey:string})=>i.itemKey===wrongTarget.assessment.probes[0].id).item.nodeKey)!.id;
 expect(inspectReleaseBank(wrongTarget)).toBe(false);
});
it("rejects weakening the approved distinct-text rule or inventing a new context for the same passage",()=>{
 const weakened=structuredClone(bundle),reading=weakened.assessment.skills.find(s=>s.nodeKey==="localiser_information_explicite")!;
 reading.evidenceRequirements!.interpretation!.minimumContexts=1;
 expect(inspectReleaseBank(weakened)).toBe(false);
 const renamed=structuredClone(bundle),probe=renamed.assessment.probes.find(p=>bank.items.find((entry:{itemKey:string})=>entry.itemKey===p.id)?.item.validatorConfig?.sourceTextKey==="garden")!;
 probe.contextId="passage:garden-question-2";
 expect(inspectReleaseBank(renamed)).toBe(false);
});
it("rejects a genre refinement outside the approved reading evidence scope",()=>{
 const changed=structuredClone(bundle),skill=changed.assessment.skills.find(s=>s.nodeKey==="distinguer_fait_opinion")!;
 skill.facetKey="distinguer_fait_opinion::text_type:narrative";
 expect(inspectReleaseBank(changed)).toBe(false);
});
it("rejects weakened contrast requirements and invented probe error families",()=>{
 const weakened=structuredClone(bundle),skill=weakened.assessment.skills.find(s=>(s.evidenceRequirements?.[s.modes[0]]?.minimumContrastingErrors??0)>0)!;
 skill.evidenceRequirements![skill.modes[0]]!.minimumContrastingErrors=0;
 expect(inspectReleaseBank(weakened)).toBe(false);
 const forged=structuredClone(bundle);forged.assessment.probes[0].contrastingErrorKeys=["not-in-reviewed-content"];
 expect(inspectReleaseBank(forged)).toBe(false);
});
it("rejects removing counterexample requirements or inventing counterexample evidence",()=>{
 const weakened=structuredClone(bundle),skill=weakened.assessment.skills.find(s=>s.evidenceRequirements?.[s.modes[0]]?.negativeExamplesRequired)!;
 skill.evidenceRequirements![skill.modes[0]]!.negativeExamplesRequired=false;
 expect(inspectReleaseBank(weakened)).toBe(false);
 const forged=structuredClone(bundle);forged.assessment.probes[0].negativeExampleAssessed=true;
 expect(inspectReleaseBank(forged)).toBe(false);
});

it("rejects copied assessed MCQs even after changing instructions, IDs and choice order",async()=>{
 const {validateCanonicalDiagnosticBank}=await import("../item-bank");
 const {checksum}=await import("@/lib/taxonomy/validate");
 const candidate=read("generated/french-v3-direct-object-expansion.json").items[0];
 // Synthetic review provenance exists only in this in-memory release fixture.
 candidate.reviewStatus="human_approved";candidate.review={reviewerProfileId:"fixture-reviewer",reviewedAt:"2026-09-11T00:00:00Z"};
 const cloned=structuredClone(candidate);cloned.itemKey+="-copy";cloned.item.promptFr+="\nSélectionne l’analyse correcte.";cloned.item.choices.reverse();
 const fixtureBank={...structuredClone(bank),items:[...structuredClone(bank.items),candidate,cloned]};
 const build=()=>{
  const validation=validateCanonicalDiagnosticBank(fixtureBank,artifact.taxonomy);
  expect(validation.issues).toEqual([]);
  fixtureBank.manifest=validation.manifest;
  return {bank:fixtureBank,assessment:adaptV3ForAssessment({bank:fixtureBank,artifact}),taxonomyId:"fixture",bankId:"fixture"};
 };
 const duplicated=build(),before=checksum(duplicated);
 expect(inspectReleaseBank(duplicated)).toBe(false);
 expect(checksum(duplicated)).toBe(before);
 fixtureBank.items.pop();
 expect(inspectReleaseBank(build())).toBe(true);
 // A genuinely different answer set is not rejected by this exact-content
 // safeguard. Its validity/semantic independence still belongs to review.
 const different=structuredClone(cloned);
 different.item.choices[0].text+=" Vérifie aussi la fonction de chaque groupe.";
 fixtureBank.items.push(different);
 expect(inspectReleaseBank(build())).toBe(true);
});

it("supports a scoped bank without permitting graph pruning or out-of-scope questions",()=>{
 const base=bundle.assessment.skills.find(skill=>!skill.prerequisites.length&&bundle.assessment.probes.some(probe=>probe.skillId===skill.id))!;
 expect(base).toBeTruthy();
 const scoped={...bundle,assessment:{...bundle.assessment,probes:bundle.assessment.probes.filter(probe=>probe.skillId===base.id),releaseScope:{version:"french-granular-release-scope-v1" as const,assessmentSkillIds:[base.id],teachingSkillIds:[],limitationFr:"Les autres compétences restent à vérifier."}}};
 expect(inspectReleaseBank(scoped)).toBe(true);
 expect(inspectReleaseBank({...scoped,assessment:{...scoped.assessment,skills:[base]}})).toBe(false);
 const outside=bundle.assessment.probes.find(probe=>probe.skillId!==base.id)!;
 expect(inspectReleaseBank({...scoped,assessment:{...scoped.assessment,probes:[...scoped.assessment.probes,outside]}})).toBe(false);
 const weakened=structuredClone(scoped),deferred=weakened.assessment.skills.find(skill=>skill.id!==base.id)!;
 deferred.evidenceRequirements![deferred.modes[0]]!.minimumItems=0;
 expect(inspectReleaseBank(weakened)).toBe(false);
});
