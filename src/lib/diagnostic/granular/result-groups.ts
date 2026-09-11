import type {Mode,SkillResult} from "./engine";
export type ResultDetail={assessmentAvailable?:boolean;labelFr:string;domain:string;samplingGroup?:string;mode:Mode};
const GROUPS=[
 {id:"reading_comprehension",labelFr:"Lecture"},
 {id:"grammar",labelFr:"Grammaire"},
 {id:"conjugation",labelFr:"Conjugaison"},
 {id:"orthographe_lexicale",labelFr:"Orthographe des mots"},
 {id:"orthographe_grammaticale",labelFr:"Accords et homophones"},
 {id:"spelling",labelFr:"Orthographe"},
 {id:"other",labelFr:"Autres points"},
] as const;
/** Display groups never combine scores or infer one skill from another. Older
 * releases without strand metadata retain a general spelling section. */
export function groupAssessmentResults(results:readonly SkillResult[],details:Record<string,ResultDetail>){
 const groupOf=(result:SkillResult)=>{
  const detail=details[result.skillId];
  if(detail?.domain==="spelling"&&["orthographe_lexicale","orthographe_grammaticale"].includes(detail.samplingGroup??""))return detail.samplingGroup;
  return GROUPS.some(group=>group.id===detail?.domain)?detail.domain:"other";
 };
 return GROUPS.map(group=>({...group,results:results.filter(result=>groupOf(result)===group.id)
  .map(result=>({result,detail:details[result.skillId]}))
  .sort((a,b)=>Number(a.result.status==="unknown")-Number(b.result.status==="unknown")||
   (a.detail?.labelFr??"").localeCompare(b.detail?.labelFr??"","fr")||a.result.skillId.localeCompare(b.result.skillId))}))
  .filter(group=>group.results.length>0);
}
