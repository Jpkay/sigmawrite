import {skillEvidenceDisplay} from './skill-evidence-display';
import {DIAGNOSTIC_COPY,featureCountText} from '@/components/diagnostic/diagnostic-copy';
import type {GranularFrontierView} from './frontier-view';
export const FRONTIER_COPY={
 title:'Ma carte des compétences',progressTitle:'Mes progrès',
 description:'Chaque point a son propre bilan. Reconnaître une règle et l’utiliser sans aide sont vérifiés séparément.',
 help:'Les points encore incertains seront précisés pendant tes activités. Une base acquise ne suffit pas à prouver que la suite est maîtrisée.',
 ongoing:'Ton diagnostic est encore en cours.',resume:'Reprendre le diagnostic',
 next:'Tes prochaines étapes',search:'Chercher une compétence',filter:'Afficher',all:'Tous les points',reset:'Revoir tous les points',
 coming:'Questions à venir',prerequisites:'Les bases liées à ce point',
 status:DIAGNOSTIC_COPY.status,mode:DIAGNOSTIC_COPY.mode,
 skillEvidence:DIAGNOSTIC_COPY.skillEvidence,
 featureCopy:DIAGNOSTIC_COPY.child,featureLabels:DIAGNOSTIC_COPY.featureLabels,
} as const;
export const frontierCountText=(count:number)=>`${count} point(s) affiché(s)`;
export const frontierAnswerText=(count:number)=>`${count} réponse(s) prise(s) en compte.`;
export const frontierDurationText=(minutes:number)=>`${minutes} min`;
export const frontierCoverageText=(supported:number,deferred:number)=>`${supported} points peuvent être évalués actuellement ; les questions pour ${deferred} autres points restent à venir.`;
type Node=GranularFrontierView['nodes'][number];
export const frontierModeText=(node:Node)=>node.result.modes.map(mode=>FRONTIER_COPY.mode[mode.mode]).join(' · ');
export const frontierNodeStatus=(node:Node)=>`${frontierModeText(node)} · ${FRONTIER_COPY.status[node.result.status]}${!node.assessmentAvailable?' · '+FRONTIER_COPY.coming:''}`;
export const frontierPrerequisiteText=(node:Node)=>`${node.labelFr} — ${frontierModeText(node)} — ${FRONTIER_COPY.status[node.result.status]}`;
/** Include every possible filtered count; no student's search text is recorded. */
export function frontierDisplayText(data:GranularFrontierView,title:string=FRONTIER_COPY.title){
 return {copy:FRONTIER_COPY,title,counts:Array.from({length:data.nodes.length+1},(_,count)=>frontierCountText(count)),
  coverage:data.coverage?frontierCoverageText(data.coverage.supportedSkillCount,data.coverage.deferredSkillCount):null,
  durations:data.activities.map(activity=>frontierDurationText(activity.estimatedMinutes)),
  nodes:data.nodes.map(node=>({evidence:skillEvidenceDisplay(node.result,DIAGNOSTIC_COPY.mode),status:frontierNodeStatus(node),prerequisite:frontierPrerequisiteText(node),answers:frontierAnswerText(node.result.modes.reduce((total,mode)=>total+mode.distinctItems,0)),features:node.result.modes.flatMap(mode=>(mode.featureEvidence??[]).filter(row=>row.distinctItems>0).map(row=>featureCountText(row.correctItems,row.distinctItems)))})),
 };
}
