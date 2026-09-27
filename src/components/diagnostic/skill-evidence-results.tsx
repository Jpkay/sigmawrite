import React from 'react';
import {DIAGNOSTIC_COPY} from './diagnostic-copy';
import {SKILL_EVIDENCE_COPY as copy,skillEvidenceDisplay} from '@/lib/diagnostic/granular/skill-evidence-display';
import type {SkillResult} from '@/lib/diagnostic/granular/engine';
export function SkillEvidenceResults({result}:{result:SkillResult}){
 const rows=skillEvidenceDisplay(result,DIAGNOSTIC_COPY.mode);
 if(!rows.length)return null;
 return <div className="mt-3 text-sm"><p className="font-medium">{copy.title}</p><ul className="mt-1 space-y-1">{rows.map(row=><li key={row}>{row}</li>)}</ul><p className="mt-2 text-muted-foreground">{copy.help}</p></div>;
}
