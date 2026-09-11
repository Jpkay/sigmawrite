import {readFileSync,writeFileSync} from "node:fs";
import {conjugate,type Person,type Tense} from "../src/lib/linguistic/conjugation";
const paths=["generated/diagnostic-bank-v3-draft.json","generated/french-v3-conjugation-expansion.json","generated/french-v3-agreement-expansion.json"];
const reports=paths.map(path=>{
 const artifact=JSON.parse(readFileSync(path,"utf8"));
 const issues:Array<{itemKey:string;stored:string;computed?:string;error?:string}>=[];let checked=0;
 for(const entry of artifact.items){
  if(entry.item.validatorType!=="conjugator")continue;
  checked++;const c=entry.item.validatorConfig;
  try{
   const computed=conjugate(c.verb,c.tense as Tense,c.person as Person,{gender:c.gender,codBefore:c.codBefore});
   if(computed!==entry.item.correctAnswer)issues.push({itemKey:entry.itemKey,stored:entry.item.correctAnswer,computed});
  }catch(error){issues.push({itemKey:entry.itemKey,stored:entry.item.correctAnswer,error:error instanceof Error?error.message:String(error)});}
 }
 return {path,checked,issues};
});
const report={scope:"Local artifacts only; no live database inspection",limitations:["Matching an answer to its generator is not independent linguistic validation", "Exact-answer questions are not recomputed", "Legacy production content requires a separate live audit"],reports};
writeFileSync("docs/diagnostic/conjugator-artifact-audit.json",JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(reports.map(r=>({path:r.path,checked:r.checked,issues:r.issues.length})),null,2));
