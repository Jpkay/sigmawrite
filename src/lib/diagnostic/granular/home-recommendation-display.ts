import {SEED_TEXT_BY_ID} from '@/lib/content/texts';
import {recommendTextId} from '@/lib/content/recommend';
import {interestPickReasonFr,matchInterest} from '@/lib/content/interest-matching';
import {difficultyBandLabel} from '@/lib/scoring/band';
import type {SeedText} from '@/lib/content/types';
export const homeFallbackText=(interests:readonly string[])=>SEED_TEXT_BY_ID[recommendTextId([...interests])];
export const homeReadingCardText=(text:SeedText,interests:readonly string[]=[])=>({title:text.title,band:difficultyBandLabel(text.difficultyBand),concepts:text.concepts.slice(0,2),why:text.pickReasonFr??interestPickReasonFr(matchInterest(text.primaryInterest,interests))});
export const homeFallbackDisplay=(interests:readonly string[])=>homeReadingCardText(homeFallbackText(interests),interests);
export type HomeRecommendations={key:string;texts:SeedText[]};
/** A result for earlier interests cannot replace the current initial card. */
export function visibleHomeRecommendations(loaded:HomeRecommendations|null,key:string,fallback:SeedText):SeedText[]{
 return loaded?.key===key&&loaded.texts.length?loaded.texts:[fallback];
}
