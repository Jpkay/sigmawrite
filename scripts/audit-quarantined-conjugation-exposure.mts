import {config} from "dotenv";
import {createClient} from "@supabase/supabase-js";
import {readFileSync,writeFileSync} from "node:fs";
config({path:".env.local",quiet:true});
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const ids=JSON.parse(readFileSync("docs/diagnostic/conjugation-quarantine-result.json","utf8")).items.map((item:{id:string})=>item.id);
const results=[];
for(const id of ids){
 const {count,error}=await db.from("competency_attempts").select("id",{count:"exact",head:true}).eq("item_id",id);
 if(error)throw error;
 const {count:eligible,error:eligibleError}=await db.from("competency_items").select("id",{count:"exact",head:true}).eq("id",id).in("review_status",["auto_approved","human_approved"]);
 if(eligibleError)throw eligibleError;
 const {count:assignments,error:assignmentError}=await db.from("diagnostic_run_items").select("id",{count:"exact",head:true}).eq("item_id",id);
 if(assignmentError)throw assignmentError;
 const {count:memberships,error:membershipError}=await db.from("diagnostic_item_bank_memberships").select("item_id",{count:"exact",head:true}).eq("item_id",id);
 if(membershipError)throw membershipError;
 const {data:pilotEligible,error:pilotError}=await db.rpc("diagnostic_pilot_item_is_eligible",{p_item_id:id});
 if(pilotError)throw pilotError;
 results.push({itemId:id,recordedAttempts:count,diagnosticAssignments:assignments,bankMemberships:memberships,pilotEligible,currentlyApproved:eligible===1});
}
const report={checkedAt:new Date().toISOString(),scope:"Read-only exact counts for six quarantined item IDs; no student identities or answers retrieved",items:results,
 totalRecordedAttempts:results.reduce((sum,row)=>sum+(row.recordedAttempts??0),0),limitations:["Counts do not include questions displayed but never submitted", "Database eligibility does not prove deployed serving code matches local source", "Other answer-key defects and historical copies under different IDs are outside this query"]};
writeFileSync("docs/diagnostic/conjugation-quarantine-exposure.json",JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));
