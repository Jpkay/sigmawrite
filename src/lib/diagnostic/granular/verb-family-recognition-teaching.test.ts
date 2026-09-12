import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {checksum} from '@/lib/taxonomy/validate';
import {VERB_FAMILY_RECOGNITION_FACETS as facets,VERB_FAMILY_RECOGNITION_TEACHING as lessons} from './verb-family-recognition-teaching';
import {VERB_FAMILY_RECOGNITION_DRAFTS as drafts} from './verb-family-recognition-drafts';
import {validateTeachingTargets} from './teaching-content';
import {questionMaterialKeys,questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {canonicalProbeMetrics} from './probe-metrics';
import {applyFacetTargets} from './facet-adapter';
import {allocateTeachingQuestionPools} from './teaching-question-pools';
import {assessSkills,type Observation} from './engine';
import type {CanonicalDiagnosticBankArtifact,CanonicalDiagnosticBankItem} from '../item-bank';
import type {V3Assessment} from './v3-adapter';
function study(){
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 const parent=candidate.assessment.skills.find((skill:{id:string})=>skill.id==='classer_famille_verbale::reading-receptive');
 if(!parent)throw Error('Approved parent missing');
 const items=JSON.parse(readFileSync('generated/french-v3-verb-family-recognition-expansion.json','utf8')).items as CanonicalDiagnosticBankItem[];
 const base=JSON.parse(readFileSync('generated/diagnostic-bank-v3-draft.json','utf8')) as CanonicalDiagnosticBankArtifact;
 const bank={...base,items};delete bank.manifest;
 // Isolated authoring simulation; this does not grant publication or classroom review.
 const source:V3Assessment={taxonomyChecksum:candidate.assessment.taxonomyChecksum,bankChecksum:checksum(bank),skills:[structuredClone(parent)],probes:items.map(entry=>({id:entry.itemKey,skillId:parent.id,mode:'recognition',contextId:entry.itemKey,materialKeys:questionMaterialKeys(entry.item),assessedMaterialKeys:questionAssessedMaterialKeys(entry.item),...canonicalProbeMetrics(entry)}))};
 const annotations=items.map(entry=>({itemKey:entry.itemKey,itemChecksum:checksum(entry),contextKey:entry.itemKey,facetKey:facets.find(facet=>facet.value===drafts.find(draft=>entry.itemKey===`v3-verb-family-recognition:${draft.infinitive}`)!.family)!.key}));
 const before=structuredClone(source);const refined=applyFacetTargets(source,facets,bank,annotations);
 expect(source).toEqual(before);
 return {source,assessment:refined.assessment};
}
it('keeps all three recognition patterns separate while inheriting the approved evidence requirements',()=>{
 const {source,assessment}=study();expect(assessment.skills).toHaveLength(3);
 for(const skill of assessment.skills){expect(skill.nodeKey).toBe(source.skills[0].nodeKey);expect(skill.evidenceRequirements?.recognition).toMatchObject(source.skills[0].evidenceRequirements!.recognition!);expect(assessment.probes.filter(probe=>probe.skillId===skill.id)).toHaveLength(12);}
 const er=assessment.skills.find(skill=>skill.facetKey?.endsWith(':er'))!;
 const observations:Observation[]=assessment.probes.filter(probe=>probe.skillId===er.id).map((probe,index)=>({...probe,itemId:probe.id,correct:true,activeSeconds:15,occasionId:index<6?'initial':'learning',unaided:true}));
 const results=assessSkills(assessment.skills,observations);
 expect(results.find(result=>result.skillId===er.id)?.status).toBe('mastered');
 expect(results.filter(result=>result.skillId!==er.id).map(result=>result.status)).toEqual(['unknown','unknown']);
});
it('binds three exact lessons and retains independent initial and learning questions after teaching',()=>{
 const {assessment}=study();expect(()=>validateTeachingTargets(assessment,lessons)).not.toThrow();
 const allocation=allocateTeachingQuestionPools(assessment,lessons);
 expect(allocation.coverage).toHaveLength(3);
 for(const row of allocation.coverage){expect(row.status).toBe('allocated');expect(row.initialItems).toBe(6);expect(row.learningItems).toBe(6);}
 for(const lesson of lessons){
  expect(lesson.practice).toHaveLength(6);expect(new Set(lesson.practice.map(exercise=>exercise.answerFr)).size).toBe(3);
  const taught=new Set(teachingMaterialKeys(lesson));expect(taught.size).toBeGreaterThan(0);
  // No quiz infinitive is used as a guided target or taught example.
  const visible=[...lesson.steps.flatMap(step=>[step.exampleFr,step.explanationFr]),...lesson.practice.flatMap(exercise=>[exercise.promptFr,exercise.explanationFr])].join('\n');
  for(const draft of drafts)expect(new RegExp(`(?<![\\p{L}])${draft.infinitive}(?![\\p{L}])`,'u').test(visible)).toBe(false);
  expect(JSON.stringify(lesson)).not.toContain('—');
  const target=assessment.skills.find(skill=>skill.facetKey===lesson.facetKey)!;
  for(const probe of allocation.assessment.probes.filter(probe=>probe.skillId===target.id&&probe.usage==='learning'))expect(probe.assessedMaterialKeys?.some(key=>taught.has(key))).toBe(false);
 }
});
