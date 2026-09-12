import {readAudioStimulus} from './audio-stimulus';
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import {writtenGuessingFloor} from "./response-space";
import {PERSON_NUMBER_LABELS} from "./person-number-categories";
/** Sampling metadata from a reviewed question's explicit answer choices. This
 * does not add a mastery criterion or grant approval to authoring drafts. */
function samplingCategory(entry:CanonicalDiagnosticBankItem):string|undefined{
 if(entry.item.nodeKey!=="distinguer_personne_nombre"||entry.evidenceKey!=="reading-receptive"||entry.item.responseType!=="mcq")return;
 const choices=entry.item.choices??[],correct=choices.filter(choice=>choice.correct);
 if(choices.length!==6||correct.length!==1||!PERSON_NUMBER_LABELS.every(label=>choices.filter(choice=>choice.text===label).length===1))return;
 return `person-number:${PERSON_NUMBER_LABELS.indexOf(correct[0].text as typeof PERSON_NUMBER_LABELS[number])}`;
}
/** Current source-derived routing estimates. Written-answer guessing and time
 * estimates still require calibration; a compiled bundle cannot change them
 * independently of the adapter's versioned content policy. */
export function canonicalProbeMetrics(entry:CanonicalDiagnosticBankItem){
 const audio=readAudioStimulus(entry.item);
 const writtenGuess=writtenGuessingFloor(entry.item);
 const category=samplingCategory(entry);
 return {
  ...(category?{samplingCategory:category}:{}),
  difficulty:({foundation:.25,core:.5,stretch:.75} as const)[entry.difficultyTier],
  expectedSeconds:(entry.sectionKey==="reading_comprehension"?60:30)+(audio?Math.ceil(audio.durationMs/1000):0),
  // Answer and supporting-passage choices are correlated, not independent draws.
  guessProbability:entry.item.responseType==="mcq"?1/Math.max(2,entry.item.choices?.length??0):writtenGuess,
 };
}
