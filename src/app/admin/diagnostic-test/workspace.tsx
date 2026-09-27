'use client';
import {useCallback,useRef,useState} from 'react';
import {Download,RotateCcw} from 'lucide-react';
import {GranularDiagnostic} from '@/components/diagnostic/granular-diagnostic';
import {Button} from '@/components/ui/button';
import {startAdminDiagnosticTest,updateAdminDiagnosticTest,type AdminDiagnosticTestResult} from '@/lib/actions/admin-diagnostic-test';
import type {AssessmentResponse} from '@/lib/diagnostic/granular/client-state';

type TimingRow={id:number;at:string;command:string;roundTripMs:number;serverMs:number|null;spans:{name:string;startMs:number;ms:number}[];error:string|null};
function ms(value:number){return `${Math.round(value).toLocaleString('fr-FR')} ms`;}

export function DiagnosticTestWorkspace(){
 const [run,setRun]=useState(0),[rows,setRows]=useState<TimingRow[]>([]),[release,setRelease]=useState<string|null>(null),[pending,setPending]=useState<{id:number;command:string}|null>(null);
 const token=useRef<string|null>(null),serial=useRef(0),callSerial=useRef(0),generation=useRef(0);
 const measure=useCallback(async(command:string,work:()=>Promise<AdminDiagnosticTestResult>):Promise<AssessmentResponse>=>{
  const started=performance.now(),at=new Date().toISOString(),runGeneration=generation.current,callId=++callSerial.current;
  setPending({id:callId,command});
  let result:AdminDiagnosticTestResult;
  try{result=await work();}
  catch(error){result={error:error instanceof Error?error.message:'Échec de la communication.'};}
  if(runGeneration!==generation.current)return {error:'Ce test a été remplacé.'};
  setPending(previous=>previous?.id===callId?null:previous);
  if(result.token)token.current=result.token;
  if(result.releaseKey)setRelease(result.releaseKey);
  const row:TimingRow={id:++serial.current,at,command,roundTripMs:performance.now()-started,serverMs:result.server?.totalMs??null,spans:result.server?.spans??[],error:result.error??(result.conflict?'Conflit de révision':null)};
  setRows(previous=>[...previous,row]);
  return result;
 },[]);
 const start=useCallback(()=>measure('Démarrage',()=>startAdminDiagnosticTest()),[measure]);
 const update=useCallback((kind:'diagnostic'|'learning'|'teaching')=>(command:unknown)=>{
  if(!token.current)return Promise.resolve({error:'Démarrez un nouveau test.'});
  const label=command&&typeof command==='object'&&'type'in command&&typeof command.type==='string'?command.type:'Commande';
  return measure(label,()=>updateAdminDiagnosticTest({token:token.current!,command,kind}));
 },[measure]);
 const diagnostic=useCallback((command:unknown)=>update('diagnostic')(command),[update]);
 const learning=useCallback((command:unknown)=>update('learning')(command),[update]);
 const teaching=useCallback((command:unknown)=>update('teaching')(command),[update]);
 const reset=()=>{generation.current++;token.current=null;serial.current=0;setRows([]);setRelease(null);setPending(null);setRun(value=>value+1);};
 const exportReport=()=>{
  const payload={kind:'granular_diagnostic_admin_test',exportedAt:new Date().toISOString(),releaseKey:release,notes:['Browser round trip includes network and framework transport.','Server spans are nested or overlapping; their durations must not be summed into a total.','This isolated test does not read or write student history, so novelty-dependent outcomes may differ.'],calls:rows};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`diagnostic-test-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;link.click();URL.revokeObjectURL(url);
 };
 return <div className="space-y-7">
  <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
   <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Outil de diagnostic</p><h1 className="text-3xl font-semibold tracking-tight">Test du parcours élève</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Parcourez le diagnostic publié et mesurez chaque appel. Cette session de test reste séparée des données des élèves.</p><p className="mt-1 max-w-2xl text-xs text-muted-foreground">Le rechargement recommence le test. Les résultats liés à la nouveauté d’un contenu peuvent différer d’un vrai parcours, car aucun historique d’élève n’est consulté.</p>{release&&<p className="mt-2 text-xs text-muted-foreground">Version publiée : <span className="font-medium text-foreground">{release}</span></p>}</div>
   <div className="flex gap-2"><Button variant="outline" onClick={reset}><RotateCcw className="size-4"/> Nouveau test</Button><Button variant="outline" disabled={!rows.length} onClick={exportReport}><Download className="size-4"/> Exporter les temps</Button></div>
  </header>
  <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
   <section aria-label="Aperçu du parcours élève" className="min-w-0"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Aperçu élève</p><GranularDiagnostic key={run} preview start={start} retake={start} update={diagnostic} updateLearning={learning} updateTeaching={teaching}/></section>
   <aside className="min-w-0 xl:sticky xl:top-6"><div className="flex items-baseline justify-between border-b border-border pb-3"><h2 className="text-lg font-semibold">Temps des appels</h2><span className="text-xs text-muted-foreground">{rows.length} appel{rows.length===1?'':'s'}</span></div><p className="my-3 text-xs leading-relaxed text-muted-foreground">Le trajet navigateur comprend le réseau et le transport. Le temps serveur est mesuré séparément. Les étapes imbriquées peuvent se chevaucher.</p>
    {pending&&<p role="status" className="border-t border-border py-3 text-sm text-primary">Mesure en cours : {pending.command}…</p>}
    {!rows.length&&!pending&&<p role="status" className="py-8 text-sm text-muted-foreground">Le premier appel apparaîtra ici.</p>}{rows.length>0&&<ol className="max-h-[72vh] divide-y divide-border overflow-y-auto border-y border-border">{rows.map(row=><li key={row.id} className="py-3"><details><summary className="cursor-pointer list-none"><span className="flex items-start justify-between gap-3"><span><span className="block text-sm font-medium">{String(row.id).padStart(2,'0')} · {row.command}</span><span className="mt-1 block text-xs text-muted-foreground">{new Date(row.at).toLocaleTimeString('fr-FR')} · navigateur {ms(row.roundTripMs)} · serveur {row.serverMs===null?'—':ms(row.serverMs)}</span>{row.error&&<span className="mt-1 block text-xs text-destructive">Échec : {row.error}</span>}</span><span aria-hidden className="text-muted-foreground">⌄</span></span></summary><div className="mt-3 border-l border-border pl-3">{row.spans.length?<ol className="space-y-1.5">{row.spans.map((step,index)=><li key={`${step.name}-${index}`} className="flex justify-between gap-3 text-xs"><span className="min-w-0 break-words text-muted-foreground">{step.name} <span className="tabular-nums opacity-70">+{ms(step.startMs)}</span></span><span className="shrink-0 font-medium tabular-nums">{ms(step.ms)}</span></li>)}</ol>:<p className="text-xs text-muted-foreground">Aucune étape serveur disponible.</p>}</div></details></li>)}</ol>}
   </aside>
  </div>
 </div>;
}
