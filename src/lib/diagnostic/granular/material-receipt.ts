import {z} from "zod";
const keySchema=z.string().regex(/^(word|sentence|audio):sha256:[a-f0-9]{64}$/);
const receiptSchema=z.array(z.object({material_key:keySchema,first_recorded_exposure:z.boolean()}).strict()).max(1000);
export type MaterialReceipt={firstRecordedKeys:string[];previouslySeenKeys:string[]};
/** A receipt concerns the first recorded presentation, not complete historical
 * coverage or outside-app knowledge. Missing evidence must never become "new". */
export function parseMaterialReceipt(input:unknown,expectedKeys:readonly string[]):MaterialReceipt|null{
 const expected=[...new Set(expectedKeys.map(key=>keySchema.parse(key)))].sort();
 const rows=receiptSchema.parse(input);
 if(!rows.length)return null;
 const actual=rows.map(row=>row.material_key).sort();
 if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error("Material receipt does not match assessed content");
 return {firstRecordedKeys:rows.filter(row=>row.first_recorded_exposure).map(row=>row.material_key),
  previouslySeenKeys:rows.filter(row=>!row.first_recorded_exposure).map(row=>row.material_key)};
}

export type ObservedMaterialReceipt=MaterialReceipt&{presentationId:string;sourceChecksum:string;historyComplete:boolean;assessedMaterialKeys?:string[]};
export function hasVerifiedNovelMaterial(receipt:ObservedMaterialReceipt|undefined,kind:"word"|"sentence"):boolean{
 const targets=(receipt?.assessedMaterialKeys??[...(receipt?.firstRecordedKeys??[]),...(receipt?.previouslySeenKeys??[])]).filter(key=>key.startsWith(`${kind}:`));
 return receipt?.historyComplete===true&&targets.length>0
  &&targets.every(key=>receipt.firstRecordedKeys.includes(key)&&!receipt.previouslySeenKeys.includes(key))
  // A new written label cannot make an already heard recording fresh.
  &&(receipt.assessedMaterialKeys??[...receipt.firstRecordedKeys,...receipt.previouslySeenKeys]).filter(key=>key.startsWith("audio:")).every(key=>receipt.firstRecordedKeys.includes(key)&&!receipt.previouslySeenKeys.includes(key));
}
