'use client';
import {DIAGNOSTIC_COPY} from './diagnostic-copy';
import {useState} from 'react';
const copy=DIAGNOSTIC_COPY.child;
export function QuestionAudio({src,onComplete,onFailure,teaching=false}:{teaching?:boolean;src:string;onComplete:()=>void;onFailure:()=>void}){
 const [failed,setFailed]=useState(false);
 return <div className="my-5 rounded-lg border border-border p-4">
  <p className="mb-3 text-sm">{copy.audioHelp}</p>
  <audio controls preload="none" src={src} aria-label={copy.audioLabel} onPlaying={()=>setFailed(false)} onEnded={()=>{setFailed(false);onComplete();}} onError={()=>{setFailed(true);onFailure();}} className="w-full" />
  {failed&&<p role="alert" className="mt-3 text-sm">{teaching?copy.teachingAudioError:copy.assessmentAudioError}</p>}
 </div>;
}
