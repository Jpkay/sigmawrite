import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({role:vi.fn(),load:vi.fn(),journal:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/actions/student',()=>({loadStudentRecueil:f.load}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalCurrentStudentPayload:f.journal}));
import Page from './page';
beforeEach(()=>{vi.resetAllMocks();f.role.mockResolvedValue({displayName:'Auteur'});f.load.mockResolvedValue({since:'2026-09-01',entries:[{id:'a',kind:'summary',at:'2026-09-12T23:30:00Z',title:'Résumé',text:'Le récit.',note:'Version 2'}]});});
it('records the date and labels actually used in the printable collection',async()=>{
 const page=await Page();const display=f.journal.mock.calls[0][1];
 expect(f.journal.mock.calls[0][0]).toBe('student:recueil-display');expect(display.author).toBe('Auteur');expect(display.count).toBe('1 texte(s)');
 expect(display.entries[0]).toEqual({kind:'1 · Résumé',date:'12 septembre 2026 · Version 2'});
 expect(page.props.children[0].props.description).toBe(display.description);
});
it('records the empty state and withholds the page on capture failure',async()=>{
 f.load.mockResolvedValue({since:'2026-09-01',entries:[]});await Page();expect(f.journal.mock.calls[0][1].copy.empty).toContain('Pas encore');
 f.journal.mockRejectedValueOnce(Error('capture failed'));await expect(Page()).rejects.toThrow('capture failed');
});
