import {InvalidConjugationContextError,type Person} from './conjugation';

/** Authored usage metadata, never inferred from the student's response.
 * Sources: Académie française, Pierre V. (France), 2021-07-01;
 * OQLF, Sens et emploi de veuillez et de veillez.
 * Both series are attested with en vouloir. Polite requests use veuille/veuillez;
 * no first-person polite-request prompt is supported by this contract. */
export type VouloirImperativeUse = 'polite_request' | 'resentment';
export function vouloirImperativeAnswers(verb:string,tense:string,person:Person,use:unknown):readonly string[]{
 if(verb.toLocaleLowerCase('fr')!=='vouloir'||tense!=='imperatif_present')throw new InvalidConjugationContextError('vouloirImperativeUse requires vouloir at imperatif_present');
 if(use==='polite_request'){
  if(person==='2s')return ['veuille'];
  if(person==='2p')return ['veuillez'];
  throw new InvalidConjugationContextError('polite_request supports only second-person imperative forms');
 }
 if(use==='resentment'){
  if(person==='2s')return ['veux','veuille'];
  if(person==='1p')return ['voulons','veuillons'];
  if(person==='2p')return ['voulez','veuillez'];
  throw new InvalidConjugationContextError('resentment requires an imperative person');
 }
 throw new InvalidConjugationContextError('Unknown vouloirImperativeUse');
}
