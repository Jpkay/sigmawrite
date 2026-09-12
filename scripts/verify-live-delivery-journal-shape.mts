/** Read-only serialization QA. Does not record an exposure, journal or answer. */
import {config} from 'dotenv';
import {writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {publicAssessmentView} from '../src/lib/diagnostic/granular/service';
import {deliveredTextFragments} from '../src/lib/diagnostic/granular/delivery-journal';
import {getStudentStateData} from '../src/lib/db/student';
config({path:'.env.local',quiet:true});
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const row=await db.from('granular_assessment_sessions').select('id,student_id,release_id,state').eq('id','fb56fa77-8c93-499e-93d7-fe4901f1af00').single();if(row.error)throw row.error;
if(row.data.student_id!=='17a545e9-a478-4935-9e93-2c46992fae1d')throw Error('Wrong technical QA owner');
const release=await db.from('granular_assessment_releases').select('bundle').eq('id',row.data.release_id).single();if(release.error)throw release.error;
const view=publicAssessmentView({id:row.data.id,studentId:row.data.student_id,releaseId:row.data.release_id,state:row.data.state},release.data.bundle);
const studentState=await getStudentStateData(row.data.student_id,db);
const fragments=deliveredTextFragments({view,studentState});
const report={sessionId:row.data.id,phase:view.phase,distinctTextFragments:fragments.length,textCharacters:fragments.reduce((n,s)=>n+s.length,0),fullFinalPayloadSerializable:true,databaseWrites:false,exposuresRecorded:false};
writeFileSync('docs/diagnostic/delivery-journal-live-shape-2026-09-12.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
