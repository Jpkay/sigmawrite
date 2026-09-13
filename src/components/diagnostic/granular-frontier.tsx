"use client";
import {SkillEvidenceResults} from "./skill-evidence-results";
import {FRONTIER_COPY as copy,frontierCountText,frontierAnswerText,frontierDurationText,frontierCoverageText,frontierNodeStatus,frontierPrerequisiteText} from "@/lib/diagnostic/granular/frontier-copy";
import {useState} from 'react';
import Link from 'next/link';
import {PageHeader} from '@/components/page';
import {SkillFeatureResults} from './skill-feature-results';
import type {GranularFrontierView} from '@/lib/diagnostic/granular/frontier-view';
const STATUS=copy.status;

export function GranularFrontier({data,title=copy.title}:{data:GranularFrontierView;title?:string}){
 const [search,setSearch]=useState(''),[status,setStatus]=useState('all'),[focused,setFocused]=useState<string|null>(null);
 const byId=new Map(data.nodes.map(node=>[node.id,node]));
 const visible=data.nodes.filter(node=>focused?node.id===focused:(status==='all'||node.result.status===status)&&node.labelFr.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')));
 function show(id:string){setFocused(id);setSearch('');setStatus('all');}
 return <>
  <PageHeader title={title} description={copy.description}/>
  <p className="mb-4 text-sm text-muted-foreground">{copy.help}</p>
  {data.phase==='assessing'&&<p className="mb-5">{copy.ongoing} <Link className="underline" href="/student/diagnostic">{copy.resume}</Link></p>}
  {data.coverage&&<p className="mb-5 text-sm text-muted-foreground">{frontierCoverageText(data.coverage.supportedSkillCount,data.coverage.deferredSkillCount)}</p>}
  {data.activities.length>0&&<section className="mb-8"><h2 className="mb-3 text-xl font-semibold">{copy.next}</h2><ul className="space-y-3">{data.activities.map(activity=><li key={activity.activityId}><Link className="font-medium underline" href={activity.href}>{activity.titleFr}</Link><span className="ml-2 text-sm text-muted-foreground">{frontierDurationText(activity.estimatedMinutes)}</span></li>)}</ul></section>}
  <div className="mb-5 flex flex-wrap gap-4">
   <label className="grid gap-1 text-sm">{copy.search}<input className="rounded-md border border-border bg-background p-2" value={search} onChange={event=>{setSearch(event.target.value);setFocused(null);}}/></label>
   <label className="grid gap-1 text-sm">{copy.filter}<select className="rounded-md border border-border bg-background p-2" value={status} onChange={event=>{setStatus(event.target.value);setFocused(null);}}><option value="all">{copy.all}</option>{Object.entries(STATUS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
   {focused&&<button className="self-end p-2 underline" onClick={()=>setFocused(null)}>{copy.reset}</button>}
  </div>
  <p role="status" className="mb-3 text-sm text-muted-foreground">{frontierCountText(visible.length)}</p>
  <div className="space-y-3">{visible.map(node=><details key={node.id} open={focused===node.id||undefined} className="rounded-lg border border-border p-4"><summary className="cursor-pointer"><span className="font-semibold">{node.labelFr}</span><span className="mt-1 block text-sm text-muted-foreground">{frontierNodeStatus(node)}</span></summary>
   <div className="mt-4 space-y-3"><p className="text-sm">{frontierAnswerText(node.result.modes.reduce((total,mode)=>total+mode.distinctItems,0))}</p><SkillEvidenceResults result={node.result}/><SkillFeatureResults result={node.result}/>
    {node.prerequisites.length>0&&<div><h3 className="font-medium">{copy.prerequisites}</h3><ul className="mt-2 space-y-2">{node.prerequisites.map(id=>{const base=byId.get(id);return base?<li key={id}><button className="text-left underline" onClick={()=>show(id)}>{frontierPrerequisiteText(base)}</button></li>:null;})}</ul></div>}
   </div>
  </details>)}</div>
 </>;
}
