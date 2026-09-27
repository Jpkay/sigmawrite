import {expect,it} from 'vitest';
import {homeDynamicDisplay} from './home-display-text';
it('records the same six plan entries displayed by the home client',()=>{
 const data={plan:Array.from({length:8},()=>({role:'review',estimatedMinutes:3})),fallbackPlan:null,motivation:{streak:2,totalXp:45,todayXp:12,goalXp:10},texts:null};
 const text=homeDynamicDisplay(data);
 expect(text.planEntries).toHaveLength(6);expect(text.planSummary).toBe('6 activité(s) · environ 18 min');
 expect(text.planEntries[0]).toBe('Révision · 3 min');expect(text.streak).toBe('2 jour(s)');expect(text.goal).toBe('10 / 10 XP');
});
it('matches fallback plan limits and distinguishes an empty primary plan from a failed one',()=>{
 const base={fallbackPlan:Array.from({length:5},()=>({mastery:.5})),motivation:null,texts:null};
 expect(homeDynamicDisplay({...base,plan:null}).planEntries).toEqual(Array(3).fill('Nouvelle étape · 7 min · maîtrise 50%'));
 expect(homeDynamicDisplay({...base,plan:[]}).planEntries).toEqual([]);
});
