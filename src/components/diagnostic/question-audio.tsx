'use client';
import {useState} from 'react';
export function QuestionAudio({src,onComplete,onFailure,teaching=false}:{teaching?:boolean;src:string;onComplete:()=>void;onFailure:()=>void}){
 const [failed,setFailed]=useState(false);
 return <div className="my-5 rounded-lg border border-border p-4">
  <p className="mb-3 text-sm">Écoute le mot jusqu’au bout avant de répondre. Tu peux le réécouter.</p>
  <audio controls preload="none" src={src} aria-label="Écouter le mot" onPlaying={()=>setFailed(false)} onEnded={()=>{setFailed(false);onComplete();}} onError={()=>{setFailed(true);onFailure();}} className="w-full" />
  {failed&&<p role="alert" className="mt-3 text-sm">{teaching?"Le son ne peut pas être lu. Tu peux réessayer ou quitter l’activité pour revenir à ton bilan.":"Le son ne peut pas être lu. Tu peux passer cette question ; cela ne comptera pas comme une erreur."}</p>}
 </div>;
}
