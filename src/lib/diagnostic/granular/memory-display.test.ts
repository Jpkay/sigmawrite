import {expect,it} from 'vitest';
import {memoryDisplay} from './memory-display';
it('covers due-count changes without interpreting card repetitions as mastery',()=>{
 const display=memoryDisplay({retrievalCards:[{conceptLabel:'Sujet'},{conceptLabel:'Sujet'},{conceptLabel:'Verbe'}],vocab:{chevaux:{exposures:2}}});
 expect(display.dueStates).toEqual(['0 carte(s) à réviser','1 carte(s) à réviser','2 carte(s) à réviser','3 carte(s) à réviser']);
 expect(display.concepts[0]).toEqual({label:'Sujet',states:['2 cartes · 0 à revoir aujourd’hui','2 cartes · 1 à revoir aujourd’hui','2 cartes · 2 à revoir aujourd’hui']});
 expect(display.concepts[1].states).toEqual(['1 carte · 0 à revoir aujourd’hui','1 carte · 1 à revoir aujourd’hui']);
 expect(display.vocabulary).toEqual(['chevaux · 2×']);
});
