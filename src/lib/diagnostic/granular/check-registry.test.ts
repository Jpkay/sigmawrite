import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {buildLearningCheckRegistry} from "./check-registry";
import {adaptV3ForAssessment} from "./v3-adapter";
import {buildV3Facets} from "./facets";
import {applyFacetTargets} from "./facet-adapter";
import {validateAnnotationReviewDraft} from "./annotation-review";
import {availableLearningBindings,planGranularActivities} from "./activity-plan";
import {assessSkills} from "./engine";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const assessment=applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank,validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"),bank)).assessment;
it("creates exact-target checks from eligible questions without publishing them",()=>{
 const registry=buildLearningCheckRegistry(assessment,bank,artifact.taxonomy);
 expect(registry.bindings.length).toBeGreaterThan(0);
 expect(registry.bindings.every(b=>b.status==="draft"&&b.kind==="independent_check")).toBe(true);
 for(const binding of registry.bindings)for(const id of binding.probeIds!){
  const probe=assessment.probes.find(p=>p.id===id)!;
  const skill=assessment.skills.find(s=>s.id===probe.skillId)!;
  expect([binding.nodeKey,binding.facetKey,binding.mode]).toEqual([skill.nodeKey,skill.facetKey,probe.mode]);
 }
 expect(planGranularActivities(assessment,assessSkills(assessment.skills,[]),registry.bindings).activities).toEqual([]);
 expect(registry.coverage.filter(c=>!c.eligibleQuestions).every(c=>c.additionalEligibleQuestionsNeeded>0)).toBe(true);
});
it("cannot smuggle repaired questions, substitute a different evidence target or use a stale bank",()=>{
 const modified=structuredClone(assessment);
 const repairedKey=read("docs/diagnostic/v3-item-repairs.json")[0].itemKey;
 modified.probes.push({...modified.probes[0],id:repairedKey});
 expect(()=>buildLearningCheckRegistry(modified,bank,artifact.taxonomy)).toThrow(/Ineligible/);
 const retargeted=structuredClone(assessment);
 retargeted.probes[0].skillId=assessment.skills.find(s=>s.nodeKey!==assessment.skills.find(s=>s.id===retargeted.probes[0].skillId)!.nodeKey)!.id;
 expect(()=>buildLearningCheckRegistry(retargeted,bank,artifact.taxonomy)).toThrow(/mismatched/);
 expect(()=>buildLearningCheckRegistry({...assessment,bankChecksum:"stale"},bank,artifact.taxonomy)).toThrow(/bank/);
});
it("uses stable binding identities and removes an exhausted check from available activities",()=>{
 const first=buildLearningCheckRegistry(assessment,bank,artifact.taxonomy);
 const second=buildLearningCheckRegistry(assessment,bank,artifact.taxonomy);
 expect(second).toEqual(first);
 const binding=first.bindings[0];
 expect(availableLearningBindings(assessment,[binding],new Set())).toHaveLength(1);
 expect(availableLearningBindings(assessment,[binding],new Set(binding.probeIds))).toHaveLength(0);
});

it("excludes reserved passages already assigned to the diagnostic across skill boundaries",()=>{
 const copy=structuredClone(assessment);
 const reading=copy.probes.filter(probe=>probe.contextId.startsWith("passage-content:"));
 const initial=reading[0],later=reading.find(probe=>probe.skillId!==initial.skillId)!;
 expect(later).toBeDefined();
 initial.usage="initial";later.usage="learning";later.contextId=initial.contextId;
 const registry=buildLearningCheckRegistry(copy,bank,artifact.taxonomy);
 expect(registry.bindings.flatMap(binding=>binding.probeIds??[])).not.toContain(later.id);
 expect(registry.coverage.find(row=>row.skillId===later.skillId&&row.mode===later.mode)!.excludedRepeatedPassageQuestionIds).toContain(later.id);
});
it("pins scope in the registry and retains deferred coverage rows",()=>{
 const target=assessment.skills.find(s=>s.prerequisites.length===0)!;
 const scoped={...assessment,probes:assessment.probes.filter(p=>p.skillId===target.id),releaseScope:{version:"french-granular-release-scope-v1" as const,assessmentSkillIds:[target.id],teachingSkillIds:[],limitationFr:"Couverture progressive."}};
 const registry=buildLearningCheckRegistry(scoped,bank,artifact.taxonomy);
 expect(registry.releaseScopeChecksum).toBeTruthy();
 expect(registry.coverage.some(row=>row.availability==="deferred")).toBe(true);
 expect(registry.coverage.find(row=>row.skillId===target.id)?.availability).toBe("supported");
 const outside=assessment.probes.find(p=>p.skillId!==target.id)!;
 expect(()=>buildLearningCheckRegistry({...scoped,probes:[...scoped.probes,outside]},bank,artifact.taxonomy)).toThrow(/outside release scope/);
});
