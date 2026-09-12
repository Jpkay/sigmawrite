import {difficultyBandLabel} from '@/lib/scoring/band';
import type {SeedText} from '@/lib/content/types';
type Plan={role:string;estimatedMinutes:number;mastery?:number|null};
export const homePlanSummary=(count:number,minutes:number)=>`${count} activité(s) · environ ${minutes} min`;
export const homePlanEntryText=(entry:Plan)=>entry.role==='review'?`Révision · ${entry.estimatedMinutes} min`:entry.role==='compression'?`Réactive plusieurs notions · ${entry.estimatedMinutes} min`:entry.mastery!=null?`Nouvelle étape · ${entry.estimatedMinutes} min · maîtrise ${Math.round(entry.mastery*100)}%`:`Nouvelle étape · ${entry.estimatedMinutes} min`;
export const homeStreakText=(days:number)=>`${days} jour(s)`;
export const homeXpText=(xp:number)=>`${xp} XP`;
export const homeGoalText=(today:number,goal:number)=>`${Math.min(today,goal)} / ${goal} XP`;
export function homeDynamicDisplay(data:{plan:readonly Plan[]|null;fallbackPlan:readonly {mastery?:number|null}[]|null;motivation:{streak:number;totalXp:number;todayXp:number;goalXp:number}|null;texts:readonly Pick<SeedText,'difficultyBand'>[]|null}){
 const plan=data.plan?data.plan.slice(0,6):(data.fallbackPlan??[]).slice(0,3).map(step=>({role:'new',mastery:step.mastery,estimatedMinutes:7}));
 return {planSummary:homePlanSummary(plan.length,plan.reduce((total,entry)=>total+entry.estimatedMinutes,0)),planEntries:plan.map(homePlanEntryText),
  streak:homeStreakText(data.motivation?.streak??0),xp:homeXpText(data.motivation?.totalXp??0),goal:homeGoalText(data.motivation?.todayXp??0,data.motivation?.goalXp??10),
  readingBands:(data.texts??[]).map(text=>difficultyBandLabel(text.difficultyBand)),
 };
}
