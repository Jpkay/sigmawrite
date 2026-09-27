import {z} from "zod";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
const schema=z.object({alternatives:z.array(z.string().trim().min(1)).min(2).max(20),rationaleFr:z.string().trim().min(1)}).strict();
const normalize=(value:string)=>value.normalize("NFC").trim().toLocaleLowerCase("fr");
/** Authored evidence about restricted response choices, even when the learner
 * types an answer. Review must establish that the listed alternatives really
 * describe the task; the count is a conservative guessing floor, not calibration. */
export function writtenGuessingFloor(item:CanonicalDiagnosticBankItem["item"]):number{
 const raw=item.validatorConfig?.finiteResponseSpace;
 if(raw===undefined)return .05;
 if(!["short_answer","cloze","transform"].includes(item.responseType))throw Error("Finite written response space has an incompatible format");
 const annotation=schema.parse(raw),alternatives=new Set(annotation.alternatives.map(normalize));
 if(alternatives.size!==annotation.alternatives.length)throw Error("Duplicate finite response alternatives");
 if(!item.correctAnswer?.trim()||[item.correctAnswer,...(item.acceptableAnswers??[])].some(answer=>!alternatives.has(normalize(answer))))throw Error("Finite response space omits an accepted answer");
 const accepted=new Set([item.correctAnswer,...(item.acceptableAnswers??[])].map(normalize));
 return Math.max(.05,accepted.size/alternatives.size);
}
