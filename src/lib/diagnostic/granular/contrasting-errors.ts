import {z} from "zod";
import type {CanonicalDiagnosticBankItem} from "../item-bank";

const schema=z.array(z.object({errorKey:z.string().trim().min(1),incorrectChoiceFr:z.string().trim().min(1)}).strict()).min(1);
/** Error families are reviewed content annotations, not the number of distractors.
 * Each annotation must identify an actual incorrect option in the source item.
 * The reviewer still has to establish that its error-family label is accurate. */
export function contrastingErrorKeys(item:CanonicalDiagnosticBankItem["item"]):string[]{
 const raw=item.validatorConfig?.contrastingErrors;
 if(raw===undefined)return [];
 const annotations=schema.parse(raw);
 const seen=new Set<string>();
 for(const annotation of annotations){
  const choices=item.choices?.filter(choice=>choice.text.trim()===annotation.incorrectChoiceFr)??[];
  if(choices.length!==1||choices[0].correct||seen.has(annotation.incorrectChoiceFr))throw Error("Contrasting error must identify one distinct incorrect option");
  seen.add(annotation.incorrectChoiceFr);
 }
 return [...new Set(annotations.map(annotation=>annotation.errorKey))];
}
