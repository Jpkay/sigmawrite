import {SEED_TEXT_BY_ID} from '@/lib/content/texts';
import {NEXT_ACTION_LABEL} from '@/lib/scoring/session';
import type {ReadingSessionResult} from '@/lib/types';
export const RECENT_READING_COPY={title:'Séances récentes',empty:"Aucune séance pour l'instant."} as const;
/** Select only the titles actually displayed, never the entire seed library. */
export function recentReadingDisplay(sessions:readonly Pick<ReadingSessionResult,'textVersionId'|'recommendedNextAction'|'successRate'>[]){
 return {copy:RECENT_READING_COPY,rows:[...sessions].reverse().map((session,index)=>({
  key:`${session.textVersionId}-${index}`,title:SEED_TEXT_BY_ID[session.textVersionId]?.title??session.textVersionId,
  nextAction:NEXT_ACTION_LABEL[session.recommendedNextAction],success:`${Math.round(session.successRate*100)}%`,
 }))};
}
