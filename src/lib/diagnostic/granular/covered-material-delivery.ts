import {checksum} from '@/lib/taxonomy/validate';
import {collectMaterialPresentations,recordMaterialDelivery,type MaterialDeliveryStore,type MaterialPresentation} from './material-delivery';
import {deliveredTextFragments,journalMaterialDelivery,type DeliveryJournalStore} from './delivery-journal';
export type CoveredMaterialDelivery={studentId:string;boundary:string;payloadChecksum:string;textFragments:string[];presentations:Omit<MaterialPresentation,'studentId'>[];contractKey:string};
export type PreparedMaterialDeliveryStore=Pick<MaterialDeliveryStore,'recordMaterialPresentation'> & DeliveryJournalStore & {
 recordCoveredMaterialDelivery?(input:CoveredMaterialDelivery):Promise<void>;
};
export type CoveredMaterialDeliveryStore=MaterialDeliveryStore & PreparedMaterialDeliveryStore;
/** Prepared identities come from trusted source assembly, never a browser.
 * Validate the entire batch before writing any receipt. A requested contract
 * cannot fall back to separate writes or manufacture a coverage baseline. */
export async function capturePreparedMaterialDelivery(store:PreparedMaterialDeliveryStore,studentId:string,boundary:string,payload:unknown,presentations:readonly MaterialPresentation[],contractKey?:string):Promise<void>{
 if(!/^[a-z][a-z0-9:_-]{1,99}$/.test(boundary))throw Error('Invalid material delivery boundary');
 const owned=presentations.map(({studentId:owner,...presentation})=>{
  if(owner!==studentId)throw Error('Material delivery owner mismatch');
  return presentation;
 });
 const textFragments=deliveredTextFragments(payload);
 if(contractKey===undefined){
  for(const presentation of presentations)await store.recordMaterialPresentation(presentation);
  await journalMaterialDelivery(store,studentId,boundary,payload);
  return;
 }
 if(!contractKey.trim()||!store.recordCoveredMaterialDelivery)throw Error('Covered material delivery unavailable');
 if(!textFragments.length){if(presentations.length)throw Error('Covered presentation requires delivered text');return;}
 await store.recordCoveredMaterialDelivery({studentId,boundary,payloadChecksum:checksum(textFragments),textFragments,presentations:owned,contractKey});
}
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
 const presentations=await collectMaterialPresentations(store,studentId,payload);
 await capturePreparedMaterialDelivery(store,studentId,boundary,payload,presentations,contractKey);
}
