import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
vi.mock('@/lib/actions/student',()=>({setLeagueVisibility:vi.fn()}));
import {LeagueCard} from '@/components/league';
import {leagueDisplay} from './league-display';
import type {ClassLeague} from '@/lib/actions/student';
const rows=Array.from({length:12},(_,i)=>({studentId:`student-${i}`,name:`Élève ${i}`,rank:i+1,visible:true,isMe:i===11,tier:'bronze',totalXp:20,weekXp:10,streak:2}));
const league:NonNullable<ClassLeague>={className:'Classe A',weekStart:'2026-09-07',rows,me:rows[11],myVisible:true};
it('matches displayed league wording and limits the visible ranking to ten rows',()=>{
 const display=leagueDisplay(league)!;
 const text=renderToStaticMarkup(React.createElement(LeagueCard,{league})).replace(/<[^>]*>/g,'');
 for(const value of [display.title,display.week,display.tier,display.next,display.place,display.outsideTop,display.copy.hide])expect(text).toContain(value);
 expect(display.rows).toHaveLength(10);expect(display.rows.map(r=>r.name)).not.toContain('Élève 11 (toi)');
 expect(display.next).toBe('230 XP avant la ligue suivante');
 expect(display.place).toBe('Ta place cette semaine : 12e / 12');
});
it('handles the highest tier, first place and an absent personal ranking',()=>{
 const first={...rows[0],tier:'diamant',isMe:true};
 const display=leagueDisplay({...league,me:first})!;
 expect(display.next).toBe('Ligue la plus haute');expect(display.place).toContain('1re');expect(display.outsideTop).toBeNull();
 expect(leagueDisplay({...league,me:null})!.tier).toBeNull();expect(leagueDisplay(null)).toBeNull();
});
