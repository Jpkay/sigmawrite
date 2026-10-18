import type {VocabularyMemory} from '@/lib/actions/vocabulary';
import {EXERCISE_CONTROL_COPY} from '@/lib/content/exercise-control-copy';
import {TO_CONFIRM_LABEL,WORD_STATUS_LABELS} from '@/lib/vocabulary/word-status';
export const VOCABULARY_COPY={write:'Écris le mot français',exact:'Exact.',expected:'Réponse attendue : ',next:'Continuer',verify:'Vérifier',pendingDefinition:'Définition en attente de validation : cette carte ne produit pas encore de preuve de rappel.',done:'Révisions terminées',scheduled:'Les mots reviendront au moment prévu par ta mémoire.',lexicon:'Lexique personnel',hidden:'Le mot demandé est masqué ici jusqu’à la correction.',empty:'Termine une lecture pour ajouter tes premiers mots.',error:'Ta révision n’a pas pu être enregistrée. Réessaie.',controls:EXERCISE_CONTROL_COPY};
export const vocabularyDue=(count:number)=>`${count} à réviser`;
export const vocabularyExposures=(count:number)=>`${count} rencontre(s)`;
/** B.3 student-facing status. A word lowered by the 2026-10 recompute reads "À confirmer", never "lost". */
export const vocabularyStatus=(row:Pick<VocabularyMemory,'status'|'toConfirm'>)=>row.toConfirm&&(row.status==='decouvert'||row.status==='en_route')?TO_CONFIRM_LABEL:WORD_STATUS_LABELS[row.status]??WORD_STATUS_LABELS.decouvert;
export function vocabularyDisplay(rows:VocabularyMemory[]){
 return {copy:VOCABULARY_COPY,dueStates:Array.from({length:rows.length+1},(_,count)=>vocabularyDue(count)),rows:rows.map(row=>({exposures:vocabularyExposures(row.exposures),status:vocabularyStatus(row),correction:`${VOCABULARY_COPY.expected}${row.word}`}))};
}
