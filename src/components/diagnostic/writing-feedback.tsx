import type {WritingFeedback} from '@/lib/diagnostic/granular/writing-feedback';

export function WritingFeedbackCard({feedback}:{feedback:WritingFeedback}){
 const mistakes=feedback.checkedCount-feedback.correctCount;
 return <section aria-labelledby="writing-feedback-title" className="mb-8 rounded-xl border border-border p-5">
  <h2 id="writing-feedback-title" className="text-xl font-semibold">Retour sur ton texte</h2>
  <p className="mt-2 text-sm text-muted-foreground">Point travaillé : {feedback.skillLabelFr}</p>
  {!feedback.assessed?<p className="mt-3">Ton texte est enregistré. Il ne permet pas encore de vérifier ce point. Tu peux continuer ton parcours ; nous le vérifierons avec une autre activité.</p>:<p className="mt-3">{mistakes===0?(feedback.checkedCount===1?'Le passage vérifié est correct pour ce point.':`Les ${feedback.checkedCount} passages vérifiés sont corrects pour ce point.`):`${mistakes} passage${mistakes===1?'':'s'} à revoir parmi ${feedback.checkedCount} vérifié${feedback.checkedCount===1?'':'s'}.`}</p>}
  {feedback.assessed&&<p className="mt-2 text-sm text-muted-foreground">Ce retour porte sur les passages vérifiés pour cette compétence. Tes prochains textes aideront à confirmer tes acquis.</p>}
  <details className="mt-4"><summary className="cursor-pointer font-medium">Relire mon texte</summary><p className="mt-3 whitespace-pre-wrap break-words">{feedback.text}</p></details>
  <ol className="mt-4 space-y-3">{feedback.passages.map(passage=><li key={`${passage.start}:${passage.end}`} className="rounded-lg border border-border p-3">
   <p className="text-sm font-semibold">{passage.correct?'Correct pour ce point':'À revoir'}</p>
   <blockquote className="my-2 whitespace-pre-wrap break-words">« {passage.text} »</blockquote>
   <p className="text-sm text-muted-foreground">{passage.explanationFr}</p>
  </li>)}</ol>
 </section>;
}
