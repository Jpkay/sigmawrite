import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
vi.mock('@/lib/actions/words',()=>({submitWordAnswer:vi.fn(),introduceSessionWord:vi.fn(),explainWordAnswer:vi.fn()}));
import {WordSessionPlayer} from './word-session-player';
import type {WordItem} from '@/lib/vocabulary/session/types';

const render=(items:WordItem[],holiday=false)=>renderToStaticMarkup(React.createElement(WordSessionPlayer,{session:{sessionId:'s',items,holiday,unavailable:false}}));

it('starts an introduction with the word in the sentence where the student met it',()=>{
 const html=render([{id:'i',token:'t',senseId:'x',interest:'football',format:'introduce',word:'intrépide',definition:'Qui n’a pas peur du danger.',context:{before:'Le gardien ',word:'intrépide',after:' plonge.'},example:null,letters:['e','d','i','p','é','r','t','n','i']}]);
 expect(html).toContain('Nouveau mot');expect(html).toContain('Tu l’as rencontré ici');expect(html).toContain('<mark');expect(html).toContain('⚽');
});
it('never puts the answer of a typed item in the page and never shows a due count',()=>{
 const html=render([{id:'d',token:'t',senseId:'x',interest:null,format:'type_from_definition',definition:'Qui n’a pas peur du danger.',length:9,firstLetter:'i'}]);
 expect(html).toContain('Quel mot correspond à cette définition ?');expect(html).not.toContain('intrépide');
 expect(html).not.toMatch(/à réviser|en retard|oubli/iu);expect(html).toContain('Voir le mot');
});
it('is warm when there is nothing to review, and quiet during holidays',()=>{
 expect(render([])).toContain('Tes mots sont au chaud pour aujourd’hui.');
 expect(render([],true)).toContain('C’est les vacances');
});
