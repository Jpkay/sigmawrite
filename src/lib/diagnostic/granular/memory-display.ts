import {RETRIEVAL_RESULT_LABEL} from '@/lib/scoring/retrieval';
import {EXERCISE_CONTROL_COPY} from '@/lib/content/exercise-control-copy';
export const MEMORY_COPY={title:'Mémoire',loading:'Chargement…',description:'Les cartes reviennent selon tes réponses, pour t’aider à retenir ce que tu as lu.',error:"Ta réponse n'a pas pu être enregistrée. Réessaie plus tard.",empty:'Termine une lecture pour créer tes premières cartes de mémoire.',upToDate:"Tu es à jour ! Aucune carte à réviser pour l'instant.",placeholder:'Réponds avec tes mots…',next:'Carte suivante',verify:'Vérifier',inventory:'Tes cartes par notion',inventoryHelp:'Le nombre de cartes ne mesure pas tes acquis. ',results:'Voir mon bilan de compétences',vocabulary:'Vocabulaire travaillé',grades:RETRIEVAL_RESULT_LABEL,controls:EXERCISE_CONTROL_COPY};
export const memoryDueText=(count:number)=>`${count} carte(s) à réviser`;
export const memoryConceptText=(cards:number,due:number)=>`${cards} carte${cards>1?'s':''} · ${due} à revoir aujourd’hui`;
export const memoryWordText=(word:string,exposures:number)=>`${word} · ${exposures}×`;
export function memoryDisplay(state:{retrievalCards:readonly {conceptLabel:string}[];vocab:Record<string,{exposures:number}>}){
 const counts=new Map<string,number>();for(const card of state.retrievalCards)counts.set(card.conceptLabel,(counts.get(card.conceptLabel)??0)+1);
 return {dueStates:Array.from({length:state.retrievalCards.length+1},(_,count)=>memoryDueText(count)),concepts:[...counts].map(([label,cards])=>({label,states:Array.from({length:cards+1},(_,due)=>memoryConceptText(cards,due))})),vocabulary:Object.entries(state.vocab).map(([word,value])=>memoryWordText(word,value.exposures))};
}
