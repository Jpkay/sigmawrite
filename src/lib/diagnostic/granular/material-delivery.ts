import {readingPassageText} from "./v3-adapter";
import {materialIdentity} from "./material-identity";
import {z} from "zod";
import {checksum} from "@/lib/taxonomy/validate";
import {stableUuid} from "@/lib/lexicon/baseline";
import type {AssessmentStore} from "./service";
import {questionMaterialKeys,teachingMaterialKeys} from "./material-annotations";
import {teachingContentChecksum} from "./teaching-content";
export interface MaterialDeliveryStore extends AssessmentStore{
 recordMaterialPresentation(input:{presentationId:string;studentId:string;sourceChecksum:string;materialKeys:string[]}):Promise<void>;
}
const question=z.object({id:z.string().min(1)}).passthrough();
const viewSchema=z.object({sessionId:z.string().min(1),question:question.nullable().optional(),
 learningCheck:z.object({question:question.nullable()}).passthrough().nullable().optional(),
 teaching:z.object({contentId:z.string().min(1)}).passthrough().nullable().optional(),
}).passthrough();
/** Call at the authenticated action boundary BEFORE returning any material.
 * Failed writes withhold delivery; stable IDs make successful-write retries safe.
 * Lessons conservatively expose their whole reviewed material list at first open,
 * including answers/hints the student might not yet have reached. */
export async function recordMaterialDelivery(store:MaterialDeliveryStore,studentId:string,result:unknown):Promise<void>{
 if(!result||typeof result!=="object"||!("view" in result)||!result.view)return;
 const view=viewSchema.parse(result.view);
 const session=await store.load(studentId,view.sessionId);
 if(!session)throw Error("Material delivery session unavailable");
 const bundle=await store.release(session.releaseId);
 if(!bundle)throw Error("Material delivery release unavailable");
 const questionIds=[...new Set([view.question?.id,view.learningCheck?.question?.id].filter((id):id is string=>Boolean(id)))];
 for(const id of questionIds){
  const entry=bundle.bank.items.find(item=>item.itemKey===id);
  if(!entry||!bundle.assessment.probes.some(probe=>probe.id===id))throw Error("Material delivery question unavailable");
  if(entry.sectionKey==="reading_comprehension"){
   // Separate versioned receipt preserves immutable earlier annotation receipts.
   const passageKey=materialIdentity("sentence",readingPassageText(entry.item.validatorConfig,entry.item.promptFr));
   await store.recordMaterialPresentation({presentationId:stableUuid("granular-reading-presentation-v1",`${session.id}:question:${id}`),studentId,sourceChecksum:checksum(entry),materialKeys:[passageKey]});
  }
  const keys=questionMaterialKeys(entry.item);
  if(keys.length)await store.recordMaterialPresentation({presentationId:stableUuid("granular-material-presentation",`${session.id}:question:${id}`),studentId,sourceChecksum:checksum(entry),materialKeys:keys});
 }
 if(view.teaching){
  const lesson=bundle.teachingContent?.find(content=>content.id===view.teaching!.contentId);
  if(!lesson)throw Error("Material delivery lesson unavailable");
  const keys=teachingMaterialKeys(lesson);
  if(keys.length)await store.recordMaterialPresentation({presentationId:stableUuid("granular-material-presentation",`${session.id}:lesson:${lesson.id}`),studentId,sourceChecksum:teachingContentChecksum(lesson),materialKeys:keys});
 }
}
