import {expect,it} from 'vitest';
import {SEED_TEXTS} from '@/lib/content/texts';
import {homeFallbackDisplay,homeFallbackText,homeReadingCardText,visibleHomeRecommendations} from './home-recommendation-display';
it('records only the selected initial card, without its passage or hidden questions',()=>{
 const selected=SEED_TEXTS.at(-1)!;
 const text=homeFallbackText([selected.primaryInterest]);
 const display=homeFallbackDisplay([selected.primaryInterest]);
 expect(display).toEqual(homeReadingCardText(text,[selected.primaryInterest]));
 expect(Object.keys(display).sort()).toEqual(['band','concepts','title','why']);
 expect(display.why).toMatch(/^Parce que tu aimes /);
 expect(display.concepts).toEqual(text.concepts.slice(0,2));
});
it('uses current fallback when no loaded result exists or interests have changed',()=>{
 const fallback=SEED_TEXTS[0],other=SEED_TEXTS[1];
 expect(visibleHomeRecommendations(null,'current',fallback)).toEqual([fallback]);
 expect(visibleHomeRecommendations({key:'previous',texts:[other]},'current',fallback)).toEqual([fallback]);
 expect(visibleHomeRecommendations({key:'current',texts:[]},'current',fallback)).toEqual([fallback]);
 expect(visibleHomeRecommendations({key:'current',texts:[other]},'current',fallback)).toEqual([other]);
});
it('explains a pick only when it relates to the student interests',()=>{
 const football=SEED_TEXTS.find(text=>text.primaryInterest==='football')!;
 expect(homeReadingCardText(football,['football']).why).toBe('Parce que tu aimes le foot');
 expect(homeReadingCardText(football,['basketball']).why).toBe('Tu aimes le basket ? Voici un texte sur le foot.');
 expect(homeReadingCardText(football,['space']).why).toBeNull();
 expect(homeReadingCardText({...football,pickReasonFr:'Parce que tu aimes le foot'},[]).why).toBe('Parce que tu aimes le foot');
});
