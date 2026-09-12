import {DIAGNOSTIC_COPY,featureCountText} from "./diagnostic-copy";
import React from 'react';
import type {SkillResult} from '@/lib/diagnostic/granular/engine';
import {featureLabel} from '@/lib/diagnostic/granular/feature-labels';
const copy=DIAGNOSTIC_COPY.child;

export function SkillFeatureResults({result}:{result:SkillResult}){
 const rows=result.modes.flatMap(mode=>(mode.featureEvidence??[]).flatMap(row=>{
  const label=featureLabel(row.feature);return label?[{...row,label,mode:mode.mode}]:[];
 }));
 if(!rows.length)return null;
 return <div className="mt-3 text-sm">
  <p className="font-medium">{copy.featureTitle}</p>
  <ul className="mt-1 space-y-1">
   {rows.map(row=><li key={`${row.mode}:${row.feature}`}><span>{row.label} : </span><span className="text-muted-foreground">{row.distinctItems===0?copy.featureUnknown:featureCountText(row.correctItems,row.distinctItems)}</span></li>)}
  </ul>
  <p className="mt-2 text-muted-foreground">{copy.featureScope}</p>
 </div>;
}
