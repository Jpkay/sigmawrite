import {CONJUGATION_CHALLENGE_ORDER} from './conjugation-challenge';
/** Scheduling categories only. They neither add graph edges nor share evidence.
 * Optional on pinned older releases; new metadata changes the release checksum.
 * This routing refinement remains subject to parallel pedagogical review.
 */
export type ConjugationFormFamily='simple'|'compound'|'periphrastic'|'contrast';
const compounds=new Set(['produire_passe_compose','reconnaitre_passe_compose','interpreter_passe_compose','produire_plus_que_parfait','reconnaitre_plus_que_parfait','interpreter_anteriorite_passee']);
const periphrases=new Set(['produire_futur_proche','reconnaitre_futur_proche','interpreter_futur_proche','produire_passe_recent','reconnaitre_passe_recent','interpreter_passe_recent']);
const contrasts=new Set(['contraster_pc_imparfait','produire_contraste_pc_imparfait']);
export function conjugationFormFamily(nodeKey:string):ConjugationFormFamily|undefined{
 if(!Object.hasOwn(CONJUGATION_CHALLENGE_ORDER.ranks,nodeKey))return undefined;
 if(compounds.has(nodeKey))return 'compound';
 if(periphrases.has(nodeKey))return 'periphrastic';
 if(contrasts.has(nodeKey))return 'contrast';
 return 'simple';
}
