import {config} from "dotenv";
import {createClient} from "@supabase/supabase-js";
import {readFileSync,writeFileSync,existsSync} from "node:fs";
config({path:".env.local",quiet:true});
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const findings=JSON.parse(readFileSync("docs/diagnostic/live-conjugator-audit.json","utf8")).findings.filter((item:{config:{verb:string}})=>item.config.verb!=="blanchir");
if(findings.length!==6)throw Error("Unexpected reviewed quarantine set");
const backupPath="docs/diagnostic/conjugation-quarantine-before.json";
const {data:before,error}=await db.from("competency_items").select("id,prompt_fr,correct_answer,review_status,qc_gates,validator_config").in("id",findings.map((item:{id:string})=>item.id));
if(error)throw error;
if(!existsSync(backupPath))writeFileSync(backupPath,JSON.stringify(before,null,2)+"\n");
for(const finding of findings){
 const current=before.find(item=>item.id===finding.id);
 if(current?.review_status==="needs_human_review")continue;
 if(!current||current.review_status!=="auto_approved"||current.correct_answer!==finding.stored)throw Error(`Content changed: ${finding.id}`);
 const {data,error}=await db.from("competency_items").update({review_status:"needs_human_review"}).eq("id",finding.id).eq("review_status","auto_approved").eq("correct_answer",finding.stored).select("id");
 if(error)throw error;if(data.length!==1)throw Error(`Concurrent change: ${finding.id}`);
}
const {data:after,error:verifyError}=await db.from("competency_items").select("id,review_status,correct_answer").in("id",findings.map((item:{id:string})=>item.id));
if(verifyError)throw verifyError;
if(after.length!==6||after.some(item=>item.review_status!=="needs_human_review"))throw Error("Quarantine verification failed");
writeFileSync("docs/diagnostic/conjugation-quarantine-result.json",JSON.stringify({verifiedAt:new Date().toISOString(),action:"Removed six incorrect questions from approved status; keys and historical attempts untouched",items:after},null,2)+"\n");
console.log("Verified six incorrect items now require human review.");
