import type {CanonicalDiagnosticBankArtifact} from "../../item-bank";
import {adaptV3ForAssessment} from "../v3-adapter";
import {canonicalProbeMetrics} from "../probe-metrics";
import {questionMaterialKeys,questionAssessedMaterialKeys} from "../material-annotations";
import {assessesNegativeExample} from "../negative-examples";
import {allocateQuestionPools} from "../question-pools";
import {assessSkills,selectProbe,DEFAULT_POLICY,type Observation,type Probe} from "../engine";
import {planGranularActivities,type LearningActivityBinding} from "../activity-plan";
import {DETERMINER_AGREEMENT_TEACHING} from "../determiner-agreement-teaching";

/** Simulation only. Synthetic prior evidence, novelty receipts and activity
 * bindings are never publication approvals or real student measurements. */
export function auditDeterminerProfile(artifact:Parameters<typeof adaptV3ForAssessment>[0]["artifact"],bank:CanonicalDiagnosticBankArtifact,recognitionCorrect:boolean,productionCorrect:boolean){
 const full=adaptV3ForAssessment({artifact,bank}),targets=full.skills.filter(skill=>skill.nodeKey==="construction_accord_determinant_nom");
 const needed=new Set(targets.map(skill=>skill.id));
 const include=(id:string)=>{if(needed.has(id))return;needed.add(id);full.skills.find(skill=>skill.id===id)!.prerequisites.forEach(include);};
 targets.forEach(skill=>skill.prerequisites.forEach(include));
 const skills=full.skills.filter(skill=>needed.has(skill.id));
 const probes:Probe[]=bank.items.filter(entry=>/^v3-determiner-(agreement|production):/.test(entry.itemKey)).map(entry=>{
  const skill=targets.find(skill=>skill.evidenceKey===entry.evidenceKey)!;
  const assessed=questionAssessedMaterialKeys(entry.item);
  return {id:entry.itemKey,skillId:skill.id,mode:skill.modes[0],contextId:assessed.join("|"),...canonicalProbeMetrics(entry),negativeExampleAssessed:assessesNegativeExample(entry.item),materialKeys:questionMaterialKeys(entry.item),assessedMaterialKeys:assessed};
 });
 const assessment=allocateQuestionPools({...full,skills,probes}).assessment;
 const history:Observation[]=skills.filter(skill=>!targets.includes(skill)).flatMap(skill=>Array.from({length:8},(_,i)=>({itemId:`synthetic-prior:${skill.id}:${i}`,skillId:skill.id,mode:skill.modes[0],contextId:`synthetic-context:${skill.id}:${i}`,correct:true,guessProbability:.01,activeSeconds:0,unaided:true,occasionId:`prior-day-${i%2}`,negativeExampleAssessed:true,materialReceipt:{presentationId:`prior:${skill.id}:${i}`,sourceChecksum:"synthetic-prior",historyComplete:true,firstRecordedKeys:[`sentence:sha256:${i.toString().padStart(64,"0")}`],previouslySeenKeys:[]}})));
 const priorCount=history.length,selected:Probe[]=[];
 let ending="";
 for(let i=0;i<100;i++){
  const next=selectProbe(skills,assessment.probes,history,{...DEFAULT_POLICY,activeSeconds:2100});
  if(next.kind!=="question"){ending=next.kind;break;}
  const probe=next.item;selected.push(probe);
  history.push({itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct:probe.mode==="recognition"?recognitionCorrect:productionCorrect,guessProbability:probe.guessProbability,activeSeconds:probe.expectedSeconds,unaided:true,occasionId:"diagnostic-day",negativeExampleAssessed:probe.negativeExampleAssessed,materialReceipt:{presentationId:`synthetic:${probe.id}`,sourceChecksum:"candidate-fixture",historyComplete:true,firstRecordedKeys:probe.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:probe.assessedMaterialKeys}});
 }
 if(!ending)throw Error("Determiner simulation did not terminate");
 const results=assessSkills(skills,history);
 // These in-memory bindings exercise mode selection only. They are not written
 // to a release and do not pass through or bypass publication admission.
 const bindings:LearningActivityBinding[]=skills.flatMap(skill=>[
  {id:`fixture-check:${skill.id}`,nodeKey:skill.nodeKey,mode:skill.modes[0],kind:"independent_check",status:"published",titleFr:"Synthetic check",href:"/student/diagnostic",probeIds:assessment.probes.filter(probe=>probe.skillId===skill.id&&probe.usage==="learning").map(probe=>probe.id)},
  ...DETERMINER_AGREEMENT_TEACHING.filter(lesson=>lesson.nodeKey===skill.nodeKey&&lesson.mode===skill.modes[0]).map(lesson=>({id:`fixture-lesson:${lesson.id}`,nodeKey:skill.nodeKey,mode:lesson.mode,kind:"instruction" as const,status:"published" as const,titleFr:lesson.titleFr,href:"/student/diagnostic",contentId:lesson.id})),
 ]);
 const plan=planGranularActivities(assessment,results,bindings);
 const unknownFoundationResults=assessSkills(skills,history.slice(priorCount));
 const unreadyPlan=planGranularActivities(assessment,unknownFoundationResults,bindings);
 const later=assessment.probes.filter(probe=>probe.usage==="learning"&&!(probe.mode==="recognition"?recognitionCorrect:productionCorrect));
 const refinements:Observation[]=later.map((probe,index)=>({source:"learning",itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct:true,guessProbability:probe.guessProbability,activeSeconds:probe.expectedSeconds,unaided:true,occasionId:`later-day-${index%2}`,negativeExampleAssessed:probe.negativeExampleAssessed,materialReceipt:{presentationId:`synthetic-later:${probe.id}`,sourceChecksum:"candidate-fixture",historyComplete:true,firstRecordedKeys:probe.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:probe.assessedMaterialKeys}}));
 const updated=assessSkills(skills,[...history,...refinements]);
 return {ending,activeSeconds:selected.reduce((sum,probe)=>sum+probe.expectedSeconds,0),selected: selected.map(probe=>({id:probe.id,mode:probe.mode})),results:results.filter(result=>targets.some(skill=>skill.id===result.skillId)),activities:plan.activities,withoutPriorEvidence:unreadyPlan,
  afterFreshChecks:{questionIds:later.map(probe=>probe.id),results:updated.filter(result=>targets.some(skill=>skill.id===result.skillId)),activities:planGranularActivities(assessment,updated,bindings).activities},
  sourceTaxonomyChecksum:assessment.taxonomyChecksum,sourceBankChecksum:assessment.bankChecksum,assumptions:["synthetic foundation evidence","complete novelty history assumed only for simulation","draft questions simulated regardless of review status","in-memory bindings only, no publication","successful fresh checks over two later occasions"]};
}
