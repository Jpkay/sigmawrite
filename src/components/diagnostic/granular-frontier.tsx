"use client";
import {useState} from 'react';
import Link from 'next/link';
import {PageHeader} from '@/components/page';
import {SkillFeatureResults} from './skill-feature-results';
import type {GranularFrontierView} from '@/lib/diagnostic/granular/frontier-view';
const STATUS={mastered:'Bien acquis',missing:'À travailler',fragile:'À consolider',uncertain:'À confirmer',unknown:'Pas encore vérifié'};
const MODE={recognition:'Reconnaître',production:'Écrire la réponse',interpretation:'Comprendre',independent_production:'Utiliser dans un texte personnel'};
export function GranularFrontier({data,title='Ma carte des compétences'}:{data:GranularFrontierView;title?:string}){
 const [search,setSearch]=useState(''),[status,setStatus]=useState('all'),[focused,setFocused]=useState<string|null>(null);
 const byId=new Map(data.nodes.map(node=>[node.id,node]));
 const visible=data.nodes.filter(node=>focused?node.id===focused:(status==='all'||node.result.status===status)&&node.labelFr.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')));
 function show(id:string){setFocused(id);setSearch('');setStatus('all');}
 return <>
  <PageHeader title={title} description="Chaque point a son propre bilan. Reconnaître une règle et l’utiliser sans aide sont vérifiés séparément."/>
  <p className="mb-4 text-sm text-muted-foreground">Les points encore incertains seront précisés pendant tes activités. Une base acquise ne suffit pas à prouver que la suite est maîtrisée.</p>
  {data.phase==='assessing'&&<p className="mb-5">Ton diagnostic est encore en cours. <Link className="underline" href="/student/diagnostic">Reprendre le diagnostic</Link></p>}
  {data.coverage&&<p className="mb-5 text-sm text-muted-foreground">{data.coverage.supportedSkillCount} points peuvent être évalués actuellement ; les questions pour {data.coverage.deferredSkillCount} autres points restent à venir.</p>}
  {data.activities.length>0&&<section className="mb-8"><h2 className="mb-3 text-xl font-semibold">Tes prochaines étapes</h2><ul className="space-y-3">{data.activities.map(activity=><li key={activity.activityId}><Link className="font-medium underline" href={activity.href}>{activity.titleFr}</Link><span className="ml-2 text-sm text-muted-foreground">{activity.estimatedMinutes} min</span></li>)}</ul></section>}
  <div className="mb-5 flex flex-wrap gap-4">
   <label className="grid gap-1 text-sm">Chercher une compétence<input className="rounded-md border border-border bg-background p-2" value={search} onChange={event=>{setSearch(event.target.value);setFocused(null);}}/></label>
   <label className="grid gap-1 text-sm">Afficher<select className="rounded-md border border-border bg-background p-2" value={status} onChange={event=>{setStatus(event.target.value);setFocused(null);}}><option value="all">Tous les points</option>{Object.entries(STATUS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
   {focused&&<button className="self-end p-2 underline" onClick={()=>setFocused(null)}>Revoir tous les points</button>}
  </div>
  <p role="status" className="mb-3 text-sm text-muted-foreground">{visible.length} point(s) affiché(s)</p>
  <div className="space-y-3">{visible.map(node=><details key={node.id} open={focused===node.id||undefined} className="rounded-lg border border-border p-4"><summary className="cursor-pointer"><span className="font-semibold">{node.labelFr}</span><span className="mt-1 block text-sm text-muted-foreground">{node.result.modes.map(mode=>MODE[mode.mode]).join(' · ')} · {STATUS[node.result.status]}{!node.assessmentAvailable?' · Questions à venir':''}</span></summary>
   <div className="mt-4 space-y-3"><p className="text-sm">{node.result.modes.reduce((total,mode)=>total+mode.distinctItems,0)} réponse(s) prise(s) en compte.</p><SkillFeatureResults result={node.result}/>
    {node.prerequisites.length>0&&<div><h3 className="font-medium">Les bases liées à ce point</h3><ul className="mt-2 space-y-2">{node.prerequisites.map(id=>{const base=byId.get(id);return base?<li key={id}><button className="text-left underline" onClick={()=>show(id)}>{base.labelFr} — {base.result.modes.map(mode=>MODE[mode.mode]).join(' · ')} — {STATUS[base.result.status]}</button></li>:null;})}</ul></div>}
   </div>
  </details>)}</div>
 </>;
}
