import {skillEvidenceDisplay} from './skill-evidence-display';
import {DIAGNOSTIC_COPY,featureCountText} from '@/components/diagnostic/diagnostic-copy';
import type {GranularFrontierView} from './frontier-view';
import {studentActivityTitle,studentSkillTitle} from './student-results-display';
import {STUDENT_RESULT_SUMMARY_COPY} from './student-results-display';
export const FRONTIER_COPY={
 title:'Mon parcours',progressTitle:'Mes progrès',
 description:'Le bilan montre ce que tu réussis déjà, ce qu’il faut travailler et ce qui reste à vérifier.',
 help:'Ouvre un point pour voir les réponses utilisées. Si un point n’a pas encore été vérifié, cela ne veut pas dire que tu as des difficultés.',
 ongoing:'Ton diagnostic est encore en cours.',resume:'Reprendre le diagnostic',
 next:'Ce que nous te proposons de travailler ensuite',moreActivities:'Voir les autres activités proposées',search:'Chercher un point',filter:'Afficher',all:'Tous les points',reset:'Revoir tous les points',
 coming:'Questions à venir',prerequisites:'Les bases liées à ce point',
 status:DIAGNOSTIC_COPY.status,mode:DIAGNOSTIC_COPY.mode,
 skillEvidence:DIAGNOSTIC_COPY.skillEvidence,
 summary:STUDENT_RESULT_SUMMARY_COPY,
 featureCopy:DIAGNOSTIC_COPY.child,featureLabels:DIAGNOSTIC_COPY.featureLabels,
} as const;
export const frontierCountText=(count:number)=>`${count} point${count===1?'':'s'} affiché${count===1?'':'s'}`;
export const frontierAnswerText=(count:number)=>`${count} réponse${count===1?'':'s'} prise${count===1?'':'s'} en compte.`;
export const frontierDurationText=(minutes:number)=>`${minutes} min`;
export const frontierCoverageText=(supported:number,deferred:number)=>`${supported} point${supported===1?' peut':'s peuvent'} être vérifié${supported===1?'':'s'} maintenant. ${deferred} autre${deferred===1?'':'s'} reste${deferred===1?'':'nt'} à vérifier plus tard.`;
type Node=GranularFrontierView['nodes'][number];
export const frontierModeText=(node:Node)=>node.result.modes.map(mode=>FRONTIER_COPY.mode[mode.mode]).join(' · ');
export const frontierNodeStatus=(node:Node)=>`${frontierModeText(node)} · ${FRONTIER_COPY.status[node.result.status]}${!node.assessmentAvailable?' · '+FRONTIER_COPY.coming:''}`;
export const frontierPrerequisiteText=(node:Node)=>`${studentSkillTitle(node.labelFr)} · ${frontierModeText(node)} · ${FRONTIER_COPY.status[node.result.status]}`;
/** Include every possible filtered count; no student's search text is recorded. */
export function frontierDisplayText(data:GranularFrontierView,title:string=FRONTIER_COPY.title){
 return {copy:FRONTIER_COPY,title,counts:Array.from({length:data.nodes.length+1},(_,count)=>frontierCountText(count)),
  coverage:data.coverage?frontierCoverageText(data.coverage.supportedSkillCount,data.coverage.deferredSkillCount):null,
  activities:data.activities.map(activity=>({title:studentActivityTitle(activity),duration:frontierDurationText(activity.estimatedMinutes)})),
  nodes:data.nodes.map(node=>({title:studentSkillTitle(node.labelFr),evidence:skillEvidenceDisplay(node.result,DIAGNOSTIC_COPY.mode),status:frontierNodeStatus(node),prerequisite:frontierPrerequisiteText(node),answers:frontierAnswerText(node.result.modes.reduce((total,mode)=>total+mode.distinctItems,0)),features:node.result.modes.flatMap(mode=>(mode.featureEvidence??[]).filter(row=>row.distinctItems>0).map(row=>featureCountText(row.correctItems,row.distinctItems)))})),
 };
}
