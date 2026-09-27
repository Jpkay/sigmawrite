import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
vi.mock('@/lib/actions/vocabulary',()=>({reviewVocabulary:vi.fn()}));
import {VocabularyPractice} from './vocabulary-practice';
const rows=[
 {itemId:'active',word:'mangrove',definition:'Forêt du littoral tropical.',example:null,mastery:1,exposures:5,dueAt:null,lastResult:null},
 {itemId:'later',word:'rivage',definition:'Bord de la mer.',example:null,mastery:1,exposures:2,dueAt:'2099-01-01T00:00:00Z',lastResult:null},
];
it('does not reveal the current answer in the adjacent personal word list',()=>{
 const html=renderToStaticMarkup(React.createElement(VocabularyPractice,{initial:rows}));
 expect(html).toContain('Forêt du littoral tropical.');expect(html).not.toContain('mangrove');
 expect(html).toContain('rivage');expect(html).toContain('2 rencontre(s)');
 expect(html).not.toContain('100%');expect(html).toContain('Le mot demandé est masqué');
});
it('retains words in the personal list when no recall question is due',()=>{
 const initial=rows.map(row=>({...row,dueAt:'2099-01-01T00:00:00Z'}));
 const html=renderToStaticMarkup(React.createElement(VocabularyPractice,{initial}));
 expect(html).toContain('mangrove');expect(html).toContain('rivage');
 expect(html).toContain('Révisions terminées');expect(html).not.toContain('Le mot demandé est masqué');
});
