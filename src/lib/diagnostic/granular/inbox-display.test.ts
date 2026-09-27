import {expect,it} from 'vitest';
import {inboxDisplay,inboxKind} from './inbox-display';
it('records all unread counts reachable by marking messages read and uses UTC dates',()=>{
 const rows=[{id:'a',kind:'teacher_comment',message:'Bonjour',payload:{},readAt:null,createdAt:'2026-09-12T23:30:00Z'},{id:'b',kind:'other',message:'Rappel',payload:{},readAt:null,createdAt:'2026-09-12T23:30:00Z'}];
 const display=inboxDisplay(rows);
 expect(display.unreadStates).toEqual(['Tout est lu.','1 non lu(s)','2 non lu(s)']);
 expect(display.rows[0].heading).toBe('Enseignant · sam. 12 sept.');expect(inboxKind('other')).toEqual({label:'Message'});
 expect(inboxDisplay([]).unreadStates).toEqual(['Tout est lu.']);
});
