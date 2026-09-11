import {PRESENT_APPLICATION_CONTEXTS} from './present-application-contexts';
/** Curated adaptations, not novel-vocabulary claims. Future dates, habitual
 * arrivals and static sign/light descriptions are replaced by completed events. */
export const PASSE_RECENT_ACTION_VERBS=new Set(['aller','faire','prendre','venir','partir','sortir','dire','voir']);
const replacements:Readonly<Record<string,string>>={
 'Le facteur ___ chaque matin.':'Le facteur ___ déposer un colis.',
 'La lumière ___ de cette fenêtre.':'La voisine ___ demander une lampe.',
 'Les cris ___ du terrain de sport.':'Les entraîneurs ___ féliciter les joueurs.',
 'Je ___ pour Lyon samedi.':'Je ___ pour Lyon avec mon équipe.',
 'La fusée ___ dans quelques secondes.':'La fusée ___ de sa base de lancement.',
 'Cette pancarte ___ de ralentir.':'La monitrice ___ de ralentir.',
 'Nous ___ dans dix minutes.':'Nous ___ après la remise des prix.',
};
export function recentActionSentence(sentence:string):string{return replacements[sentence]??sentence;}
export const PASSE_RECENT_ACTION_CONTEXTS=PRESENT_APPLICATION_CONTEXTS.filter(([verb])=>PASSE_RECENT_ACTION_VERBS.has(verb))
 .map(([verb,person,sentence])=>[verb,person,recentActionSentence(sentence)] as const);
