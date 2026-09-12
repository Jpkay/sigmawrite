import {journalMaterialDelivery} from "./delivery-journal";
import {stableUuid} from "@/lib/lexicon/baseline";
import {checksum} from "@/lib/taxonomy/validate";
import {z} from "zod";
import type {MaterialDeliveryStore} from "./material-delivery";
import {questionMaterialKeys} from "./material-annotations";
import {materialIdentity} from "./material-identity";
import {publicQuestion} from "./service";
import {publicTextualSupport,readTextualSupport} from "./textual-support";

/** Only the authenticated student's completed initial sitting can be reviewed.
 * Corrections are delivered only after their material receipts have succeeded. */
export async function loadDiagnosticAnswerReview(store:MaterialDeliveryStore,studentId:string,input:unknown){
 const id=z.uuid().parse(input),session=await store.load(studentId,id);
 if(!session)throw Error("Diagnostic introuvable.");
 if(session.state.phase!=="learning")throw Error("Termine le diagnostic avant de consulter les réponses.");
 if(session.state.learningCheck||session.state.teaching)throw Error("Termine ou quitte l’activité en cours avant de consulter les réponses.");
 const bundle=await store.release(session.releaseId);
 if(!bundle)throw Error("Ce diagnostic n’est plus disponible.");
 const materials=new Set<string>();
 const rows=session.state.observations.map((observation,index)=>{
  const entry=bundle.bank.items.find(entry=>entry.itemKey===observation.itemId);
  if(!entry||!bundle.assessment.probes.some(probe=>probe.id===observation.itemId))throw Error("Question indisponible.");
  const item=entry.item,response=session.state.diagnosticResponses?.find(response=>response.itemId===observation.itemId);
  const responseSessionId=response?.sourceSessionId??session.id;
  const question=publicQuestion(responseSessionId,observation.itemId,bundle)!;
  const submittedAnswer=response?(item.responseType==="mcq"?question.choices.find(choice=>choice.id===response.answer)?.text??null:response.answer):null;
  const expectedAnswer=item.responseType==="mcq"?item.choices?.filter(choice=>choice.correct).map(choice=>choice.text).join(" / "):item.correctAnswer;
  const support=readTextualSupport(item);
  for(const key of questionMaterialKeys(item))materials.add(key);
  for(const text of [item.promptFr,expectedAnswer,support?.passageText])if(text)materials.add(materialIdentity("sentence",text));
  return {itemId:observation.itemId,number:index+1,promptFr:item.promptFr,instructionsFr:item.instructionsFr??null,
   status:observation.skipped?"skipped" as const:observation.correct?"correct" as const:"wrong" as const,
   submittedAnswer,expectedAnswer:expectedAnswer??null,
   submittedSupport:response?.supportChoiceId?publicTextualSupport(responseSessionId,observation.itemId,item)?.find(choice=>choice.id===response.supportChoiceId)?.text??null:null,
   expectedSupport:support?.choices.find(choice=>choice.correct)?.quoteFr??null};
 });
 const keys=[...materials].sort();
 for(let offset=0;offset<keys.length;offset+=500){
  const materialKeys=keys.slice(offset,offset+500),sourceChecksum=checksum({release:session.state.release,rows,materialKeys});
  await store.recordMaterialPresentation({studentId,sourceChecksum,materialKeys,
   presentationId:stableUuid("granular-answer-review-v1",`${id}:${sourceChecksum}`)});
 }
 const result={sessionId:id,rows};
 await journalMaterialDelivery(store,studentId,"granular:answer-review",result);
 return result;
}
export type DiagnosticAnswerReview=Awaited<ReturnType<typeof loadDiagnosticAnswerReview>>;
