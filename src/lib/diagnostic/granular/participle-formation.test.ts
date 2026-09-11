import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PARTICIPLE_FORMATION_DRAFTS,PARTICIPLE_FORMATION_TEACHING} from './participle-formation';
import {canonicalProbeMetrics} from './probe-metrics';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {assessSkills,type Observation} from './engine';
import {planGranularActivities,type LearningActivityBinding} from './activity-plan';
import type {DraftExpansion} from './assemble-drafts';
import type {V3Assessment} from './v3-adapter';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
it('keeps irregular forms and the regular -ir family distinct from spelling by suffix alone',()=>{
 const expected:Record<string,string>={être:'été',avoir:'eu',faire:'fait',voir:'vu',prendre:'pris',écrire:'écrit',lire:'lu',mettre:'mis',boire:'bu',pouvoir:'pu',dire:'dit',venir:'venu'};
 const irregular=PARTICIPLE_FORMATION_DRAFTS.filter(d=>d.kind==='irregular');
 expect(Object.fromEntries(irregular.map(d=>[d.verb,d.answer]))).toEqual(expected);
 const guidedIrregular=PARTICIPLE_FORMATION_TEACHING.find(l=>l.facetKey?.endsWith(':irregular'))!;
 expect(guidedIrregular.practice.map(p=>p.answerFr)).toEqual(['conduit','connu','offert','ouvert']);
 expect(PARTICIPLE_FORMATION_TEACHING.find(l=>l.facetKey?.endsWith(':ir'))?.boundaryFr).toContain('ouvrir donne ouvert');
});
it('reserves fresh questions and does not promote authoring drafts to reviewed content',()=>{
 const expansion=read('generated/french-v3-participle-formation-expansion.json') as DraftExpansion;
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json');
 expect(expansion.items).toHaveLength(36);
 const taught=new Set(PARTICIPLE_FORMATION_TEACHING.flatMap(teachingMaterialKeys));
 for(const draft of PARTICIPLE_FORMATION_DRAFTS){
  const entry=expansion.items.find(i=>i.itemKey===`v3-participle-formation:${draft.key}`)!;
  expect(entry.item.correctAnswer).toBe(draft.answer);
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k)),entry.itemKey).toBe(false);
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(draft.kind==='irregular'?.05:.25);
 }
 for(const lesson of PARTICIPLE_FORMATION_TEACHING)expect(candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id)?.freshCheckAvailable).toBe(true);
});
it.each(['er','ir','irregular'])('keeps a strong %s participle family separate from weaker families and complete tenses',strong=>{
 const candidate=read('docs/diagnostic/v3-scoped-review-candidate.json');const assessment=candidate.assessment as V3Assessment;
 const targets=assessment.skills.filter(s=>s.nodeKey==='former_participe_passe');expect(targets).toHaveLength(3);
 const answers:Observation[]=assessment.probes.filter(p=>targets.some(s=>s.id===p.skillId)&&p.usage==='initial').map(p=>({itemId:p.id,skillId:p.skillId,mode:p.mode,contextId:p.contextId,correct:p.skillId.endsWith(`:${strong}`),guessProbability:p.guessProbability,activeSeconds:30,unaided:true,occasionId:'synthetic-initial-day'}));
 const results=assessSkills(assessment.skills,answers);
 const bindings:LearningActivityBinding[]=candidate.activities.map((a:LearningActivityBinding)=>({...a,status:'published'}));
 const plan=planGranularActivities(assessment,results,bindings,20);
 for(const skill of targets){
  const mode=results.find(r=>r.skillId===skill.id)!.modes[0];
  expect(mode.confirmed).toBe(false);
  if(skill.id.endsWith(`:${strong}`)){
   expect(mode.probability).toBeGreaterThan(.85);
   expect(plan.activities.some(a=>a.skillId===skill.id&&a.kind==='instruction')).toBe(false);
  }else{
   expect(mode.provisionalGap).toBe(true);
   expect(plan.activities.some(a=>a.skillId===skill.id&&a.kind==='instruction')).toBe(true);
  }
 }
 for(const id of ['produire_passe_compose::writing-controlled-production::verb:avoir','choisir_auxiliaire_compose::writing-controlled-production::construction:avoir'])expect(results.find(r=>r.skillId===id)).toMatchObject({status:'unknown',evidence:'untested'});
});
