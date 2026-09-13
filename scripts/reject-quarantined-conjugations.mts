import {config} from "dotenv";
import {createClient} from "@supabase/supabase-js";
import {readFileSync,writeFileSync} from "node:fs";
config({path:".env.local",quiet:true});
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const items=JSON.parse(readFileSync("docs/diagnostic/conjugation-quarantine-result.json","utf8")).items;
for(const item of items){
 const {data:current,error}=await db.from("competency_items").select("review_status,correct_answer").eq("id",item.id).single();if(error)throw error;
 if(current.review_status==="rejected")continue;
 if(current.review_status!=="needs_human_review"||current.correct_answer!==item.correct_answer)throw Error("Quarantined content changed");
 const {data,error:changed}=await db.from("competency_items").update({review_status:"rejected"}).eq("id",item.id).eq("review_status","needs_human_review").eq("correct_answer",item.correct_answer).select("id");
 if(changed)throw changed;if(data.length!==1)throw Error("Concurrent item change");
}
const {data,error}=await db.from("competency_items").select("id,review_status,correct_answer").in("id",items.map((item:{id:string})=>item.id));if(error)throw error;
if(data.length!==6||data.some(item=>item.review_status!=="rejected"))throw Error("Rejection verification failed");
writeFileSync("docs/diagnostic/conjugation-rejection-result.json",JSON.stringify({verifiedAt:new Date().toISOString(),reason:"Confirmed wrong keys; needs_human_review remains eligible in isolated pilot, rejected excludes these versions from both paths",items:data},null,2)+"\n");console.log("Verified all six defective versions rejected.");
