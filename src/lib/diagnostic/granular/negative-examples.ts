import {z} from "zod";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
const schema=z.object({excerptFr:z.string().trim().min(1),rationaleFr:z.string().trim().min(1)}).strict();
/** A counterexample lacks the target construction; it is not merely a wrong
 * answer option. Content review must verify that the task actually assesses
 * recognizing this absence. Structural checks cannot establish that meaning. */
export function assessesNegativeExample(item:CanonicalDiagnosticBankItem["item"]):boolean{
 const raw=item.validatorConfig?.negativeExample;
 if(raw===undefined)return false;
 const annotation=schema.parse(raw);
 if(!item.promptFr.includes(annotation.excerptFr))throw Error("Negative-example excerpt must occur in the question prompt");
 return true;
}
