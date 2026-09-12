import React from 'react';
import type {SkillResult} from '@/lib/diagnostic/granular/engine';
import {featureLabel} from '@/lib/diagnostic/granular/feature-labels';

export function SkillFeatureResults({result}:{result:SkillResult}){
 const rows=result.modes.flatMap(mode=>(mode.featureEvidence??[]).flatMap(row=>{
  const label=featureLabel(row.feature);return label?[{...row,label,mode:mode.mode}]:[];
 }));
 if(!rows.length)return null;
 return <div className="mt-3 text-sm">
  <p className="font-medium">Détail des réponses prises en compte</p>
  <ul className="mt-1 space-y-1">
   {rows.map(row=><li key={`${row.mode}:${row.feature}`}><span>{row.label} : </span><span className="text-muted-foreground">{row.distinctItems===0?'Pas encore vérifié':`${row.correctItems} réponse${row.correctItems===1?'':'s'} réussie${row.correctItems===1?'':'s'} sur ${row.distinctItems}`}</span></li>)}
  </ul>
  <p className="mt-2 text-muted-foreground">Le statut tient aussi compte de questions différentes et de vérifications à différents moments.</p>
 </div>;
}
