import {stableUuid} from "@/lib/lexicon/baseline";
import {shuffleChoices} from "@/lib/content/choice-order";
/** Stable across reloads, bound to the active student's lesson and exercise.
 * No correct flag or answer key is sent before the guided attempt. */
export function teachingChoices(sessionId:string,contentId:string,exercise:{id:string;choices?:string[]}){
 if(!exercise.choices)return undefined;
 const seed=`${sessionId}:${contentId}:${exercise.id}`;
 return shuffleChoices(exercise.choices.map((text,index)=>({id:stableUuid("granular-guided-choice",`${seed}:${index}`),text})),seed);
}
