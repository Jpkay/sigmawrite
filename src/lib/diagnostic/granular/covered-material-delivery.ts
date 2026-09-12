import {checksum} from '@/lib/taxonomy/validate';
import {collectMaterialPresentations,recordMaterialDelivery,type MaterialDeliveryStore,type MaterialPresentation} from './material-delivery';
import {deliveredTextFragments,journalMaterialDelivery,type DeliveryJournalStore} from './delivery-journal';
export type CoveredMaterialDelivery={studentId:string;boundary:string;payloadChecksum:string;textFragments:string[];presentations:Omit<MaterialPresentation,'studentId'>[];contractKey:string};
export type CoveredMaterialDeliveryStore=MaterialDeliveryStore & DeliveryJournalStore & {
 recordCoveredMaterialDelivery?(input:CoveredMaterialDelivery):Promise<void>;
};
/** The contract is trusted server configuration, never request input. Omission
 * retains conservative ordinary capture. No caller enables a contract yet.
 * An explicitly requested covered write must succeed atomically or withhold
 * delivery; never silently downgrade a failed/missing covered RPC. */
export async function captureAssessmentDelivery(store:CoveredMaterialDeliveryStore,studentId:string,boundary:string,payload:unknown,contractKey?:string):Promise<void>{
 if(contractKey===undefined){
  await recordMaterialDelivery(store,studentId,payload);
  await journalMaterialDelivery(store,studentId,boundary,payload);
  return;
 }
 if(!contractKey.trim()||!store.recordCoveredMaterialDelivery)throw Error('Covered material delivery unavailable');
 if(!/^[a-z][a-z0-9:_-]{1,99}$/.test(boundary))throw Error('Invalid material delivery boundary');
 const textFragments=deliveredTextFragments(payload);
 const presentations=await collectMaterialPresentations(store,studentId,payload);
 if(!textFragments.length){if(presentations.length)throw Error('Covered presentation requires delivered text');return;}
 await store.recordCoveredMaterialDelivery({studentId,boundary,payloadChecksum:checksum(textFragments),textFragments,
  presentations:presentations.map(({studentId:owner,...presentation})=>{if(owner!==studentId)throw Error('Material delivery owner mismatch');return presentation;}),contractKey});
}
