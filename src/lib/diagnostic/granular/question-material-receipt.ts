import {checksum} from "@/lib/taxonomy/validate";
import {stableUuid} from "@/lib/lexicon/baseline";
import {questionMaterialKeys,questionAssessedMaterialKeys} from "./material-annotations";
import type {AssessmentStore,AssessmentBundle,StoredSession} from "./service";
import type {ObservedMaterialReceipt} from "./material-receipt";
/** Grading reads a receipt; it never creates exposure evidence retroactively.
 * Complete history is a separate server assertion. Until capture/backfill can
 * establish that assertion, first recorded exposure remains unverified novelty. */
export async function readQuestionMaterialReceipt(store:AssessmentStore,session:StoredSession,bundle:AssessmentBundle,itemId:string):Promise<ObservedMaterialReceipt|undefined>{
 const entry=bundle.bank.items.find(item=>item.itemKey===itemId);
 if(!entry)throw Error("Material receipt question unavailable");
 const materialKeys=questionMaterialKeys(entry.item);
 if(!materialKeys.length||!store.loadMaterialReceipt)return undefined;
 const presentationId=stableUuid("granular-material-presentation",`${session.id}:question:${itemId}`),sourceChecksum=checksum(entry);
 const receipt=await store.loadMaterialReceipt({studentId:session.studentId,presentationId,sourceChecksum,materialKeys});
 if(!receipt)return undefined;
 const historyComplete=store.materialHistoryComplete?await store.materialHistoryComplete(session.studentId,presentationId):false;
 return {...receipt,presentationId,sourceChecksum,historyComplete,assessedMaterialKeys:questionAssessedMaterialKeys(entry.item)};
}
