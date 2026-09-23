import {conjugate,PERSONS} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {PRESENT_APPLICATION_CONTEXTS} from './present-application-contexts';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';
import {FUTUR_PROCHE_FAMILY_CONTEXTS} from './futur-proche-family-contexts';
const models=CONJUGATION_TEACHING_CASES;
const individualModels=models.filter(d=>d.key.startsWith('verb:'));
const verbs=new Set(individualModels.map(d=>d.model));
/** Existing authored application contexts with a different, explicitly supplied
 * tense. The completed forms are new; this does not claim novel vocabulary. */
export const FUTUR_PROCHE_APPLICATIONS=[...PRESENT_APPLICATION_CONTEXTS.filter(([verb])=>verbs.has(verb)),...PRESENT_APPLICATION_CONTEXTS.filter(([verb])=>!verbs.has(verb)),...FUTUR_PROCHE_FAMILY_CONTEXTS].map(([verb,person,source])=>{
 const answer=conjugate(verb,'futur_proche',person);
 return {verb,person,answer,sentence:conjugationSentenceGap(source,answer)};
});
const labels={'1s':'je','2s':'tu','3s':'il / elle','1p':'nous','2p':'vous','3p':'ils / elles'};
export const FUTUR_PROCHE_PRODUCTION_TEACHING:readonly TargetTeachingContent[]=models.map(model=>{
 const verb=model.model;
 const identity=model.key.startsWith('verb:')?verb:model.key;
 const family=model.key.startsWith('pattern:');
 const practice=model.cases.map((row,i)=>{
  const verb=row.verb;
  const answerFr=conjugate(verb,'futur_proche',row.person);
  const sentence=conjugationSentenceGap(row.sentence,answerFr);
  return {id:`futur-proche-production:${identity}:guided-${i}`,promptFr:`Complète avec une forme d’aller suivie de « ${verb} » pour annoncer ce qui va se passer : ${sentence}`,answerFr,hintFr:`Choisis la forme d’aller qui va avec le sujet, puis garde ${verb} comme dans le dictionnaire.`,explanationFr:`${sentence.replace('___',answerFr)} Dans ${answerFr}, seule la forme d’aller change avec le sujet.`};
 });
 const first=model.cases[0],answer=conjugate(first.verb,'futur_proche',first.person),sentence=conjugationSentenceGap(first.sentence,answer).replace('___',answer);
 const steps:TargetTeachingContent['steps']=[
  {exampleFr:sentence,explanationFr:`${answer} annonce ici une action ou une situation à venir. La forme d’aller au présent est suivie de ${first.verb}, sa forme du dictionnaire, appelée infinitif. Cet ensemble forme le futur proche.`},
  {exampleFr:PERSONS.map(person=>`${labels[person]} : ${conjugate(verb,'futur_proche',person)}`).join('\n'),explanationFr:`Choisis vais, vas, va, allons, allez ou vont selon le sujet. Le second verbe reste ${verb} pour toutes les personnes. Il ne prend pas la terminaison du présent.`},
  ...(family?[{exampleFr:model.key==='pattern:spelling_ger'?'Nous mangeons. Nous allons manger.':model.key==='pattern:spelling_cer'?'Nous lançons. Nous allons lancer.':model.key==='pattern:regular_ir'?'Nous finissons. Nous allons finir.':'Nous parlons. Nous allons parler.',explanationFr:'Au futur proche, c’est aller qui change avec le sujet. Le second verbe retrouve sa forme du dictionnaire. Ne lui ajoute ni la terminaison du présent ni une modification de lettres propre à une forme conjuguée.'}]:[]),
  ...(verb==='aller'?[{exampleFr:'Nous allons au parc. Nous allons aller au parc.',explanationFr:'Allons au parc peut décrire un déplacement au présent. Dans allons aller, le premier aller est conjugué et le second reste à l’infinitif. Cette répétition est possible pour annoncer le déplacement à venir.'}]:[]),
 ];
 return {id:`french-v3-teaching:futur-proche:production:${identity}`,nodeKey:'produire_futur_proche',facetKey:`produire_futur_proche::${model.key}`,mode:'production',status:'draft_requires_review',titleFr:family?`Annoncer la suite avec un verbe comme ${verb}`:`Annoncer la suite avec ${verb}`,learnerQuestionFr:`Comment annoncer une action ou une situation à venir avec ${verb} ?`,steps,practice,takeawayFr:`Écris aller au présent avec le sujet, puis ${verb} à l’infinitif.`,boundaryFr:'Le temps est donné dans ces exercices. Ils ne vérifient pas encore ton choix entre présent, futur simple et futur proche dans un texte. Futur proche ne signifie pas toujours dans quelques secondes : le contexte précise le moment.',materialExposure:{words:[...new Set([verb,'aller',...model.cases.map(row=>row.verb)])].map(lemma=>({lemma,form:lemma})),sentences:[...steps.flatMap(s=>s.exampleFr.split('\n')),...practice.map(p=>p.explanationFr.split(' Dans ')[0])]}};
});
