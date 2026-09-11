/** Read-only live-source audit against local preparation. No session writes. */
import {readFileSync,writeFileSync} from 'node:fs';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {inspectLearningReleaseCompatibility} from '../src/lib/diagnostic/granular/learning-release-compatibility';
import {prepareLearningSuccessor} from '../src/lib/diagnostic/granular/learning-successor';
import {prepareParallelPublication} from '../src/lib/diagnostic/granular/publication-contract';
import {checksum} from '../src/lib/taxonomy/validate';
import type {AssessmentBundle} from '../src/lib/diagnostic/granular/service';
const [sourceReleaseKey,sessionId,outputPath]=process.argv.slice(2);
if(!sourceReleaseKey||!sessionId||!outputPath)throw Error('Expected source release key, completed QA session ID and output path');
config({path:'.env.local',quiet:true});
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const {data:release,error}=await db.from('granular_assessment_releases').select('id,bundle,status').eq('release_key',sourceReleaseKey).single();if(error)throw error;
if(release.status!=='published')throw Error('Source release is not published');
const {data:row,error:sessionError}=await db.from('granular_assessment_sessions').select('id,student_id,release_id,state').eq('id',sessionId).single();if(sessionError)throw sessionError;
if(row.release_id!==release.id)throw Error('QA session is not pinned to source release');
const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
const source=release.bundle as AssessmentBundle;
const target:AssessmentBundle={assessment:candidate.assessment,bank:JSON.parse(readFileSync('generated/diagnostic-bank-v3-consolidated-draft.json','utf8')),taxonomyId:source.taxonomyId,bankId:'prepared-bank-not-published',teachingContent:candidate.teachingContent,activities:candidate.activities.map((a:object)=>({...a,status:'published'}))};
const publication=prepareParallelPublication(target);
const compatibility=inspectLearningReleaseCompatibility(source,target);
const before=checksum(row.state);
let preservation:Record<string,unknown>={prepared:false};
if(compatibility.compatible){
 const next=prepareLearningSuccessor({id:row.id,studentId:row.student_id,releaseId:row.release_id,state:row.state},source,target);
 const fields=['observations','refinements','completedTeachingIds','elapsedActiveSeconds','completionReason','phase','paused'] as const;
 const preservedFields=Object.fromEntries(fields.map(field=>[field,JSON.stringify((row.state as Record<string,unknown>)[field])===JSON.stringify((next as unknown as Record<string,unknown>)[field])]));
 const responsesPreserved=JSON.stringify(next.diagnosticResponses)===JSON.stringify(row.state.diagnosticResponses?.map((r:{sourceSessionId?:string})=>({...r,sourceSessionId:r.sourceSessionId??row.id})));
 preservation={prepared:true,preservedFields,responsesPreserved,sourceObjectUnchanged:checksum(row.state)===before,observations:next.observations.length,refinements:next.refinements.length};
 if(Object.values(preservedFields).some(v=>!v)||!responsesPreserved||checksum(row.state)!==before)throw Error('Preparation changed historical evidence');
}
const result={status:'read_only_preparation_not_migration',sourceReleaseKey,sourceReleaseId:release.id,sourceSessionId:row.id,targetBankKey:target.bank.bank.key,targetBankChecksum:target.assessment.bankChecksum,publicationReady:publication.ready,compatibility,preservation};
writeFileSync(outputPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({compatible:compatibility.compatible,addedTargets:compatibility.addedScopeTargets.length,...preservation}));
if(!compatibility.compatible)process.exitCode=1;
