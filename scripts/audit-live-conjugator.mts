import {writeFileSync} from "node:fs";
import {config} from "dotenv";
import {createClient} from "@supabase/supabase-js";
import {conjugate,type Person,type Tense} from "../src/lib/linguistic/conjugation";
config({path:".env.local",quiet:true});
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const findings:Array<Record<string,unknown>>=[];let checked=0;
for(let offset=0;;offset+=1000){
 const {data,error}=await db.from("competency_items").select("id,review_status,correct_answer,validator_config").eq("validator_type","conjugator").order("id").range(offset,offset+999);
 if(error)throw Error(error.message);
 for(const item of data){
  checked++;const c=item.validator_config??{};
  try{
   const computed=conjugate(c.verb,c.tense as Tense,c.person as Person,{gender:c.gender,codBefore:c.codBefore});
   if(computed!==item.correct_answer)findings.push({id:item.id,reviewStatus:item.review_status,config:c,stored:item.correct_answer,computed});
  }catch(error){findings.push({id:item.id,reviewStatus:item.review_status,config:c,stored:item.correct_answer,error:error instanceof Error?error.message:String(error)});}
 }
 if(data.length<1000)break;
}
const report={checkedAt:new Date().toISOString(),scope:"Read-only current configured Supabase competency_items, all review statuses, conjugator validators only",checked,findings,limitations:["Does not inspect exact-answer questions, application deployment version or historical attempts", "Matching current generator output is not independent linguistic proof", "No database mutation performed"]};
writeFileSync("docs/diagnostic/live-conjugator-audit.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({checked,findings:findings.length,byStatus:findings.reduce((counts:Record<string,number>,item)=>{const key=String(item.reviewStatus);counts[key]=(counts[key]??0)+1;return counts;},{})},null,2));
