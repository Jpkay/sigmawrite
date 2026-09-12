import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {ExercisePrompt} from './exercise-prompt';
import {AccentTextarea} from './accent-textarea';
import {DIAGNOSTIC_COPY} from './diagnostic/diagnostic-copy';
import {deliveredTextFragments} from '@/lib/diagnostic/granular/delivery-journal';
it('includes the rendered prompt and accent controls in the diagnostic capture payload',()=>{
 const recorded=deliveredTextFragments(DIAGNOSTIC_COPY);
 const prompt=renderToStaticMarkup(React.createElement(ExercisePrompt,{promptFr:'Lis le texte.\n\nLe train arrive.\n\nQue fait le train ?'}));
 for(const text of ['Consigne','Texte à lire','Question']){
  expect(prompt).toContain(`aria-label="${text}"`);expect(recorded).toContain(text);
 }
 const input=renderToStaticMarkup(React.createElement(AccentTextarea,{value:'Brouillon privé',onChange:()=>{}}));
 expect(input).toContain('aria-label="Caractères français"');
 expect(recorded).toContain('Caractères français');
 for(const char of DIAGNOSTIC_COPY.exerciseControls.accents){expect(input).toContain(`>${char}</button>`);expect(recorded).toContain(char);}
 expect(recorded).not.toContain('Brouillon privé');
});
