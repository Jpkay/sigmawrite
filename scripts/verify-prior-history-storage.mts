/** Read-only comparison of the local history reader against raw saved QA rows. */
import {strict as assert} from 'node:assert';
import {readFileSync,writeFileSync} from 'node:fs';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {SupabaseAssessmentStore} from '../src/lib/diagnostic/granular/store';
import {checksum} from '../src/lib/taxonomy/validate';
config({path:'.env.local',quiet:true});
const credential=JSON.parse(readFileSync(process.env.PLUME_VERIFY_CREDENTIALS!,'utf8'));
assert.match(credential.username,/^doves\.granular\..*\.qa$/);
const presentation=process.env.PLUME_VERIFY_PRESENTATION!;assert.ok(presentation);
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const raw=[];let complete=false;
for(let offset=0;offset<1000;offset+=100){
 const {data,error}=await db.rpc('prior_student_material_delivery_text',{p_student_id:credential.studentId,p_presentation_id:presentation,p_offset:offset,p_limit:100});if(error)throw error;
 for(const row of data)raw.push({boundary:row.boundary,payloadChecksum:row.payload_checksum,textFragments:row.text_fragments as string[]});
 if(data.length<100){complete=true;break;}
}
assert.ok(complete,'Fixture exceeds row cap');
const result=await new SupabaseAssessmentStore(db).loadPriorDeliveryText(credential.studentId,presentation);
assert.equal(result.complete,true);assert.deepEqual(result.rows,raw);
const strings=raw.flatMap(row=>row.textFragments);
const report={studentId:credential.studentId,presentationId:presentation,rows:raw.length,rawCharacters:strings.reduce((n,s)=>n+s.length,0),distinctCharacters:[...new Set(strings)].reduce((n,s)=>n+s.length,0),sourceRowsChecksum:checksum(raw),allRowsAndReferencesPreserved:true,completeRead:true,limits:'Local reader against saved production technical-QA history; no production deployment or complete-history assertion.'};
writeFileSync(process.env.PLUME_VERIFY_REPORT!,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
