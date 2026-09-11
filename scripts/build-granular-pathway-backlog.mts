/** Prepared-content inventory. Pool allocation is not teaching or publication. */
import {readFileSync,writeFileSync} from 'node:fs';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json');
const scoped=read('docs/diagnostic/v3-scoped-review-candidate.json');
const scope=new Set<string>(scoped.assessment.releaseScope.assessmentSkillIds);
const rows=candidate.assessment.skills.map((skill:{id:string,nodeKey:string,facetKey?:string,prerequisites:string[],assessmentStage?:string})=>{
 const pools=candidate.poolCoverage.filter((row:{skillId:string})=>row.skillId===skill.id);
 const teaching=candidate.teachingReadiness.filter((row:{skillId:string})=>row.skillId===skill.id);
 const allocated=pools.length>0&&pools.every((row:{status:string})=>row.status==='allocated');
 const fresh=teaching.some((row:{freshCheckAvailable:boolean})=>row.freshCheckAvailable);
 const action=scope.has(skill.id)?'prepared_scoped_pathway':skill.assessmentStage==='learning'?'connected_writing_evidence':!allocated?'complete_question_pools':!teaching.length?'author_exact_target_lesson':!fresh?'add_fresh_independent_checks':'resolve_prerequisite_scope';
 return {skillId:skill.id,nodeKey:skill.nodeKey,facetKey:skill.facetKey??null,action,pools,lessonIds:teaching.map((row:{lessonId:string})=>row.lessonId),freshCheckAvailable:fresh,prerequisitesOutsidePreparedScope:skill.prerequisites.filter(id=>!scope.has(id))};
});
if(new Set(rows.map((row:{skillId:string})=>row.skillId)).size!==rows.length||rows.length!==542)throw Error('Incomplete or duplicated graph accounting');
const counts:Record<string,number>={};for(const row of rows)counts[row.action]=(counts[row.action]??0)+1;
if(counts.prepared_scoped_pathway!==scoped.summary.assessmentTargets)throw Error('Scope mismatch');
const output={status:'prepared_inventory_not_release_or_review_approval',parallelCandidateChecksum:candidate.checksum,scopedCandidateChecksum:scoped.checksum,targets:rows.length,counts,limitations:['Question allocation alone does not establish suitable teaching, novelty after instruction, human review or educational calibration.','Draft refinements retain their approved parent node; they do not inherit human approval.','Connected writing is verified during learning, not replaced by isolated form questions.'],rows};
const path='docs/diagnostic/granular-pathway-backlog.json';const serialized=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==serialized)throw Error('Stale pathway backlog');}else writeFileSync(path,serialized);
console.log(JSON.stringify({targets:rows.length,counts}));
