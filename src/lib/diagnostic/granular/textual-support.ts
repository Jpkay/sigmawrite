import {z} from "zod";
import {stableUuid} from "@/lib/lexicon/baseline";
import {shuffleChoices} from "@/lib/content/choice-order";
import type {GeneratedItem} from "@/lib/ai/item-generation/schemas";

const schema=z.object({passageText:z.string().trim().min(10),choices:z.array(z.object({quoteFr:z.string().trim().min(3),correct:z.boolean()}).strict()).min(2).max(6)}).strict();
/** Part of the reviewed, checksum-bound item. A second selection elicits actual
 * textual support; ordinary answer choices alone cannot stand in for it. */
export function readTextualSupport(item:GeneratedItem){
 const raw=item.validatorConfig?.textualSupport;
 if(raw===undefined)return null;
 const support=schema.parse(raw);
 if(!item.promptFr.includes(support.passageText))throw Error("Evidence passage differs from displayed reading text");
 if(support.choices.filter(choice=>choice.correct).length!==1)throw Error("Textual support needs one correct choice");
 if(new Set(support.choices.map(choice=>choice.quoteFr)).size!==support.choices.length)throw Error("Duplicate evidence choice");
 if(support.choices.some(choice=>!support.passageText.includes(choice.quoteFr)))throw Error("Evidence choice is not a passage excerpt");
 return support;
}
const supportId=(sessionId:string,itemId:string,index:number)=>stableUuid("granular-textual-support",`${sessionId}:${itemId}:${index}`);
export function publicTextualSupport(sessionId:string,itemId:string,item:GeneratedItem){
 const support=readTextualSupport(item);
 return support?shuffleChoices(support.choices.map((choice,index)=>({id:supportId(sessionId,itemId,index),text:choice.quoteFr})),`${sessionId}:${itemId}:support`):null;
}
export function gradeTextualSupport(sessionId:string,itemId:string,item:GeneratedItem,choiceId:string|undefined):{valid:true;correct:boolean}|{valid:false;error:string}{
 const support=readTextualSupport(item);
 if(!support)return choiceId?{valid:false,error:"Cette question ne demande pas de passage justificatif."}:{valid:true,correct:true};
 const choice=support.choices.find((_,index)=>supportId(sessionId,itemId,index)===choiceId);
 return choice?{valid:true,correct:choice.correct}:{valid:false,error:"Choisis aussi le passage qui justifie ta réponse."};
}
