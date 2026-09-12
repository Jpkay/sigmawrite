import {EXERCISE_CONTROL_COPY} from '@/lib/content/exercise-control-copy';
export const ANSWER_REVIEW_COPY = {
 title:'Tes réponses au diagnostic',
 back:'Revenir à mon bilan et à mes activités',
 errorsOnly:'Voir seulement mes erreurs',
 submitted:'Ta réponse',
 expected:'Réponse attendue',
 skipped:'Tu as passé cette question.',
 missingAnswer:'Le détail de cette ancienne réponse n’a pas été conservé.',
 missingExpected:'Aucune réponse modèle disponible.',
 submittedSupport:'Ton passage justificatif',
 missingSupport:'Passage choisi non conservé.',
 expectedSupport:'Passage attendu',
 noErrors:'Aucune réponse incorrecte dans ce diagnostic.',
 missingSession:'Ouvre la revue depuis les résultats de ton diagnostic.',
 status:{correct:'Réponse correcte',wrong:'Réponse à revoir',skipped:'Question passée'},
 controls:EXERCISE_CONTROL_COPY,
} as const;
export const answerReviewDescription=(count:number,wrong:number)=>`${count} questions · ${wrong} réponse(s) incorrecte(s). Ce détail ne remplace pas ton bilan par compétence.`;
export const answerReviewRowHeading=(number:number,status:keyof typeof ANSWER_REVIEW_COPY.status)=>`Question ${number} · ${ANSWER_REVIEW_COPY.status[status]}`;
export function answerReviewDisplayText(rows:readonly {number:number;status:keyof typeof ANSWER_REVIEW_COPY.status}[]){
 return {copy:ANSWER_REVIEW_COPY,description:answerReviewDescription(rows.length,rows.filter(row=>row.status==='wrong').length),headings:rows.map(row=>answerReviewRowHeading(row.number,row.status))};
}
