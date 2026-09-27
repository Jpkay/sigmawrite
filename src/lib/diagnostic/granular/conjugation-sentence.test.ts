import {expect,it} from 'vitest';
import {conjugationSentenceGap} from './conjugation-sentence';
it('adjusts je when a tense change requires elision without changing other subjects',()=>{
 expect(conjugationSentenceGap('Je ___ au marché.','vais')).toBe('Je ___ au marché.');
 expect(conjugationSentenceGap('Je ___ au marché.','allais')).toBe('J’___ au marché.');
 expect(conjugationSentenceGap('Je ___ ici.','étais')).toBe('J’___ ici.');
 expect(conjugationSentenceGap('J’___ une carte.','avais')).toBe('J’___ une carte.');
 expect(conjugationSentenceGap('Tu ___ au marché.','allais')).toBe('Tu ___ au marché.');
});
