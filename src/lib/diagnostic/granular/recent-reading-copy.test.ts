import {expect,it} from 'vitest';
import {SEED_TEXT_BY_ID} from '@/lib/content/texts';
import {NEXT_ACTION_LABEL} from '@/lib/scoring/session';
import {recentReadingDisplay} from './recent-reading-copy';
it('records only displayed reading titles and actions, retaining reverse chronological order',()=>{
 const [selected,other]=Object.values(SEED_TEXT_BY_ID);
 const sessions=[{textVersionId:selected.id,recommendedNextAction:'maintain' as const,successRate:.81},{textVersionId:'unknown-version',recommendedNextAction:'foundation_repair' as const,successRate:.42}];
 const before=JSON.stringify(sessions),display=recentReadingDisplay(sessions);
 expect(display.rows).toEqual([
  {key:'unknown-version-0',title:'unknown-version',nextAction:NEXT_ACTION_LABEL.foundation_repair,success:'42%'},
  {key:`${selected.id}-1`,title:selected.title,nextAction:NEXT_ACTION_LABEL.maintain,success:'81%'},
 ]);
 expect(JSON.stringify(sessions)).toBe(before);
 if(other.title!==selected.title)expect(display.rows.some(row=>row.title===other.title)).toBe(false);
});
