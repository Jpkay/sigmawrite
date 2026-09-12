import {checksum} from "@/lib/taxonomy/validate";
import {z} from "zod";

const sourceSpanSchema=z.object({start:z.number().int().nonnegative(),end:z.number().int().positive(),text:z.string().min(1)}).strict();
const revisionProofSchema=z.object({kind:z.enum(['corrected','retained','introduced']),before:sourceSpanSchema.nullable()}).strict();
const tokenSchema=sourceSpanSchema.extend({criterionId:z.string().min(1).optional(),correct:z.boolean(),reasonFr:z.string().trim().min(1).max(1000).optional(),revisionProof:revisionProofSchema.optional()}).strict();
const schema=z.object({
 skillId:z.string().min(1),responseChecksum:z.string().regex(/^sha256:[a-f0-9]{64}$/),
 evaluator:z.object({version:z.string().min(1),model:z.string().min(1),protocolChecksum:z.string().regex(/^sha256:[a-f0-9]{64}$/),rubricChecksum:z.string().regex(/^sha256:[a-f0-9]{64}$/)}).strict().optional(),
 connectedWriting:z.literal(true),unaided:z.literal(true),
 eligibleTokens:z.number().int().positive(),correctTokens:z.number().int().nonnegative(),
 firstDraft:z.string().min(1).max(3000).optional(),revisionReviewed:z.literal(true).optional(),
 responseText:z.string().min(1).max(3000),tokens:z.array(tokenSchema).min(1).max(1000),
}).strict().superRefine((value,ctx)=>{
 if(value.responseChecksum!==checksum(value.responseText)||value.eligibleTokens!==value.tokens.length||
  value.correctTokens!==value.tokens.filter(token=>token.correct).length){
  ctx.addIssue({code:"custom",message:"Writing evidence source or counts mismatch"});
 }
 let end=0;
 const evaluatorRevision=Number(value.evaluator?.version.match(/^french-writing-evaluator-v(\d+)$/)?.[1]??0);
 if(value.revisionReviewed&&evaluatorRevision>=10&&value.tokens.some(token=>!token.revisionProof)){
  ctx.addIssue({code:'custom',message:'Revision proof required by evaluator protocol'});
 }
 for(const token of [...value.tokens].sort((a,b)=>a.start-b.start)){
  if(token.start<end||token.end<=token.start||token.end>value.responseText.length||
   value.responseText.slice(token.start,token.end)!==token.text||!token.text.trim()){
   ctx.addIssue({code:"custom",message:"Invalid eligible writing token span"});
  }
  end=token.end;
  if(token.revisionProof){
   const {kind,before}=token.revisionProof;
   if(!value.revisionReviewed||value.firstDraft===undefined
    ||(before&&(before.end<=before.start||before.end>value.firstDraft.length||value.firstDraft.slice(before.start,before.end)!==before.text))
    ||(kind==='corrected'&&(!before||before.text===token.text||!token.correct))
    ||(kind==='retained'&&(!before||before.text!==token.text||token.correct))
    ||(kind==='introduced'&&(token.correct||before?.text===token.text))){
    ctx.addIssue({code:'custom',message:'Invalid revision source or change verdict'});
   }
  }
 }
});
export type WritingEvidence=z.infer<typeof schema>;

/** Server-side adjudication boundary. Spans identify actual opportunities to use
 * this skill, not every word in the response. A grammar check reporting no errors
 * does not supply this judgment. Never accept these fields from browser input.
 * Store the source and judgments for audit. Owned-session feedback exposes only
 * verified passages and learner explanations, never evaluator protocol metadata. */
export function createWritingEvidence(input:{skillId:string;answer:string;connectedWriting:boolean;unaided:boolean;
 evaluator?:WritingEvidence["evaluator"];firstDraft?:string;revisionReviewed?:true;tokens:Array<z.infer<typeof tokenSchema>>}):WritingEvidence{
 if(!input.connectedWriting||!input.unaided)throw Error("Independent connected writing required");
 return schema.parse({skillId:input.skillId,responseChecksum:checksum(input.answer),connectedWriting:true,unaided:true,
  evaluator:input.evaluator,responseText:input.answer,tokens:input.tokens,firstDraft:input.firstDraft,revisionReviewed:input.revisionReviewed,
  eligibleTokens:input.tokens.length,correctTokens:input.tokens.filter(token=>token.correct).length});
}
export function verifiedWritingEvidence(value:unknown,skillId:string):WritingEvidence|null{
 const parsed=schema.safeParse(value);
 return parsed.success&&parsed.data.skillId===skillId?parsed.data:null;
}

export function requiresWritingRevision(nodeKey:string):boolean{
 return ["reviser_orthographe_lexicale_paragraphe","reviser_orthographe_grammaticale_paragraphe"].includes(nodeKey);
}

/** Conservative identity for distinct writing samples, separate from the exact
 * audit checksum. Typography-only edits are not new discourse evidence. Accents
 * and word order remain significant; this is not a semantic-paraphrase detector. */
export function writingSampleIdentity(text:string):string{
 const words=text.normalize("NFC").toLocaleLowerCase("fr").match(/[\p{L}\p{M}\p{N}]+/gu)??[];
 return checksum(words.join(" "));
}
