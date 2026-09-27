import type {VocabularyMemory} from '@/lib/actions/vocabulary';
import {EXERCISE_CONTROL_COPY} from '@/lib/content/exercise-control-copy';
export const VOCABULARY_COPY={write:'Écris le mot français',exact:'Exact.',expected:'Réponse attendue : ',next:'Continuer',verify:'Vérifier',pendingDefinition:'Définition en attente de validation : cette carte ne produit pas encore de preuve de rappel.',done:'Révisions terminées',scheduled:'Les mots reviendront au moment prévu par ta mémoire.',lexicon:'Lexique personnel',hidden:'Le mot demandé est masqué ici jusqu’à la correction.',empty:'Termine une lecture pour ajouter tes premiers mots.',error:'Ta révision n’a pas pu être enregistrée. Réessaie.',controls:EXERCISE_CONTROL_COPY};
export const vocabularyDue=(count:number)=>`${count} à réviser`;
export const vocabularyExposures=(count:number)=>`${count} rencontre(s)`;
export function vocabularyDisplay(rows:VocabularyMemory[]){
 return {copy:VOCABULARY_COPY,dueStates:Array.from({length:rows.length+1},(_,count)=>vocabularyDue(count)),rows:rows.map(row=>({exposures:vocabularyExposures(row.exposures),correction:`${VOCABULARY_COPY.expected}${row.word}`}))};
}
