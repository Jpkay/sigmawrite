"use client";
import {useState} from "react";
import Link from "next/link";
import {PageHeader} from "@/components/page";
import {ExercisePrompt} from "@/components/exercise-prompt";
import type {DiagnosticAnswerReview} from "@/lib/diagnostic/granular/answer-review";
export function DiagnosticAnswerReviewPanel({review}:{review:DiagnosticAnswerReview}){
 const [errorsOnly,setErrorsOnly]=useState(false);
 const wrong=review.rows.filter(row=>row.status==="wrong").length;
 return <>
  <PageHeader title="Tes réponses au diagnostic" description={`${review.rows.length} questions · ${wrong} réponse(s) incorrecte(s). Ce détail ne remplace pas ton bilan par compétence.`}/>
  <Link href="/student/diagnostic" className="text-primary underline">Revenir à mon bilan et à mes activités</Link>
  <label className="my-6 flex items-center gap-2"><input type="checkbox" checked={errorsOnly} onChange={event=>setErrorsOnly(event.target.checked)}/>Voir seulement mes erreurs</label>
  <div className="space-y-5">{review.rows.filter(row=>!errorsOnly||row.status==="wrong").map(row=><article key={row.itemId} data-result={row.status} className="rounded-lg border border-border p-5">
   <p className="mb-4 font-semibold">Question {row.number} · {row.status==="correct"?"Réponse correcte":row.status==="wrong"?"Réponse à revoir":"Question passée"}</p>
   <ExercisePrompt promptFr={row.promptFr} instructionsFr={row.instructionsFr}/>
   <dl className="mt-5 space-y-3">
    <div><dt className="font-semibold">Ta réponse</dt><dd className="whitespace-pre-wrap">{row.submittedAnswer??(row.status==="skipped"?"Tu as passé cette question.":"Le détail de cette ancienne réponse n’a pas été conservé.")}</dd></div>
    <div><dt className="font-semibold">Réponse attendue</dt><dd className="whitespace-pre-wrap">{row.expectedAnswer??"Aucune réponse modèle disponible."}</dd></div>
    {row.expectedSupport&&<><div><dt className="font-semibold">Ton passage justificatif</dt><dd>{row.submittedSupport??"Passage choisi non conservé."}</dd></div><div><dt className="font-semibold">Passage attendu</dt><dd>{row.expectedSupport}</dd></div></>}
   </dl>
  </article>)}</div>
  {errorsOnly&&wrong===0&&<p>Aucune réponse incorrecte dans ce diagnostic.</p>}
 </>;
}
