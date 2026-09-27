import {checksum} from "@/lib/taxonomy/validate";
export type MaterialKind="word"|"sentence";
/** For words, callers supply the reviewed lemma, so cheval/chevaux can share
 * identity. This function does not guess French morphology. Sentence callers
 * supply the assessed sentence/frame, not its surrounding task instructions. */
export function materialIdentity(kind:MaterialKind,reviewedText:string):string{
 if(kind!=="word"&&kind!=="sentence")throw Error("Unknown material kind");
 const normalized=reviewedText.normalize("NFC").toLocaleLowerCase("fr")
  .replace(/[’‘]/g,"'").replace(/\s*'\s*/g,"'").replace(/\s+/g," ")
  .trim().replace(/[.!?…]+$/g,"").trim();
 if(!normalized)throw Error("Material identity requires text");
 return `${kind}:${checksum(normalized)}`;
}
