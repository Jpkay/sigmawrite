import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({cards:[
 {id:'a',conceptLabel:'Le sujet',promptFr:'Qui agit ?',keywords:['sujet'],dueAt:'2026-09-11T00:00:00Z',repetitions:5},
 {id:'b',conceptLabel:'Le sujet',promptFr:'Trouve le sujet.',keywords:['sujet'],dueAt:'2026-09-14T00:00:00Z',repetitions:20},
]}));
vi.mock('@/lib/student-store',()=>({hasStudentBackend:true,useStudentState:()=>({hydrated:true,retrievalCards:f.cards,vocab:{}}),recordRetrieval:vi.fn(),replaceStudentState:vi.fn()}));
vi.mock('@/lib/actions/student',()=>({submitRetrievalAttempt:vi.fn()}));
vi.mock('@/lib/analytics',()=>({track:vi.fn()}));
import MemoryPage from './page';
afterEach(()=>vi.restoreAllMocks());
it('shows card inventory and due work without interpreting repetitions as mastery',()=>{
 vi.spyOn(Date,'now').mockReturnValue(Date.parse('2026-09-12T12:00:00Z'));
 const html=renderToStaticMarkup(React.createElement(MemoryPage));
 expect(html).toContain('Tes cartes par notion');
 expect(html).toContain('2 cartes');expect(html).toContain('1 à revoir aujourd’hui');
 expect(html).toContain('Voir mon bilan de compétences');
 expect(html).not.toContain('Maîtrise des concepts');expect(html).not.toContain('100%');
 expect(html).not.toContain('1, 3, 7, 21');
});
