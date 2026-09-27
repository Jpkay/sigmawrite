import {journalMaterialDelivery,type DeliveryJournalStore} from "./delivery-journal";
import {checksum} from "@/lib/taxonomy/validate";
import {stableUuid} from "@/lib/lexicon/baseline";
import type {getNodePractice} from "@/lib/db/practice";
import type {MaterialDeliveryStore} from "./material-delivery";
import {annotatedMaterialKeys} from "./material-annotations";

/** Record the selected payload before it reaches the browser, including answer
 * keys and feedback shipped with practice. Missing annotations are unknown
 * coverage, never proof that the learner has not seen a word or sentence. */
export async function recordPracticeMaterialDelivery(
 store:Pick<MaterialDeliveryStore,"recordMaterialPresentation"> & DeliveryJournalStore,
 studentId:string,
 practice:Awaited<ReturnType<typeof getNodePractice>>,
):Promise<void>{
 const lesson=practice.lesson;
 const sources=[{
  id:`lesson:${practice.node.id}`,
  content:lesson,
  keys:annotatedMaterialKeys(lesson.materialExposure,[lesson.eyebrow,lesson.explanation,lesson.pattern,...lesson.examples,...lesson.exceptions]),
 },...practice.items.map(item=>({
  id:`item:${item.id}`,
  // Exclude learner-dependent ratings and ordering from content identity.
  content:{promptFr:item.promptFr,instructionsFr:item.instructionsFr,validatorConfig:item.validatorConfig,
   correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,choices:item.choices},
  keys:annotatedMaterialKeys(item.validatorConfig?.materialExposure,[item.promptFr,item.instructionsFr??"",item.correctAnswer??"",
   ...(item.acceptableAnswers??[]),...item.choices.flatMap(choice=>[choice.text,choice.feedbackFr??""])]),
 }))];
 // Validate all annotations before the first write. A failed write still
 // withholds delivery; successful earlier writes are safe on retry.
 for(const source of sources){
  if(!source.keys.length)continue;
  const sourceChecksum=checksum(source.content);
  await store.recordMaterialPresentation({studentId,sourceChecksum,materialKeys:source.keys,
   presentationId:stableUuid("practice-material-presentation",`${studentId}:${source.id}:${sourceChecksum}`)});
 }
 await journalMaterialDelivery(store,studentId,"legacy:practice",practice);
}
