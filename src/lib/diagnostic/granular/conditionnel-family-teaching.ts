import {conjugate,PERSONS,type Person} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';
const endings:Record<Person,string>={'1s':'ais','2s':'ais','3s':'ait','1p':'ions','2p':'iez','3p':'aient'};
const subjects:Record<Person,string>={'1s':'je','2s':'tu','3s':'il ou elle','1p':'nous','2p':'vous','3p':'ils ou elles'};
export const CONDITIONNEL_FAMILY_TEACHING:readonly TargetTeachingContent[]=CONJUGATION_TEACHING_CASES.filter(d=>d.key.startsWith('pattern:')).map(d=>{
 const form=(verb:string,person:Person)=>{
  const answer=verb+endings[person];
  if(conjugate(verb,'conditionnel_present',person)!==answer)throw Error(`Conditional family disagreement: ${verb}/${person}`);
  return answer;
 };
 const first=d.cases[0],firstSentence=conjugationSentenceGap(first.sentence,form(first.verb,first.person)).replace('___',form(first.verb,first.person));
 const contrast=d.key==='pattern:regular_ir'?{exampleFr:'Nous finissions hier. Nous finirions plus tôt avec ton aide.',explanationFr:'À l’imparfait, on écrit finissions avec iss. Au conditionnel, garde finir entier puis ajoute -ions : finirions. La base contient le r du futur, sans le morceau iss de l’imparfait.'}:
 d.key==='pattern:spelling_ger'?{exampleFr:'Nous mangions hier. Nous mangerions dehors avec une table.',explanationFr:'Au conditionnel, pars de manger entier puis ajoute -ions : mangerions. Le e reste devant le r. Ne pars pas de mangions, la forme de l’imparfait.'}:
 d.key==='pattern:spelling_cer'?{exampleFr:'Je lançais la balle hier. Je lancerais la balle plus loin avec cet élan.',explanationFr:'À l’imparfait, lançais prend une cédille devant a. Au conditionnel, pars de lancer : c est devant e et garde le son s sans cédille. Écris lancerais avec c.'}:
 {exampleFr:'Je parlerai demain. Je parlerais plus fort avec un micro.',explanationFr:'Le futur simple parlerai se termine par -ai avec je. Au conditionnel, ajoute -ais à parler : parlerais. Le s final distingue les deux formes écrites.'};
 const steps:TargetTeachingContent['steps']=[
  {exampleFr:`Dans une situation imaginée : ${firstSentence}`,explanationFr:'Cette phrase présente une action imaginée. Le conditionnel présent permet ici de dire ce qui pourrait se produire. Le verbe conjugué s’écrit en un seul mot.'},
  {exampleFr:`${d.model} + -ais → ${form(d.model,'1s')}`,explanationFr:'Pour ce modèle, pars de la forme du dictionnaire, appelée infinitif. Garde-la entière : elle sert de base, ou radical. Ajoute ensuite la terminaison qui correspond au sujet.'},
  contrast,
  {exampleFr:PERSONS.map(p=>`${subjects[p]} : ${form(d.model,p)}`).join('\n'),explanationFr:'Avec je, tu, il ou elle, nous, vous, ils ou elles, ajoute respectivement -ais, -ais, -ait, -ions, -iez, -aient. Le sujet permet de choisir les lettres, même quand des formes se prononcent de la même façon.'},
 ];
 const practice=d.cases.map((row,index)=>{
  const answerFr=form(row.verb,row.person),sentence=conjugationSentenceGap(row.sentence,answerFr);
  return {id:`conditionnel-present:${d.key}:guided-${index}`,promptFr:`Imagine cette situation. Complète avec ${row.verb} au conditionnel présent : ${sentence}`,answerFr,hintFr:`Garde ${row.verb} entier et ajoute -${endings[row.person]} avec ${subjects[row.person]}.`,explanationFr:`${sentence.replace('___',answerFr)} ${row.verb} + -${endings[row.person]} donne ${answerFr}.`};
 });
 return {id:`french-v3-teaching:conditionnel-present:${d.key}`,nodeKey:'produire_conditionnel_present',facetKey:`produire_conditionnel_present::${d.key}`,mode:'production',status:'draft_requires_review',titleFr:`Écrire les verbes comme ${d.model} au conditionnel présent`,learnerQuestionFr:`Comment présenter une action imaginée avec les verbes comme ${d.model} ?`,steps,practice,takeawayFr:'Pour ce modèle, garde l’infinitif entier, puis ajoute -ais, -ais, -ait, -ions, -iez ou -aient selon le sujet.',boundaryFr:'Le temps est donné : ces exercices vérifient la forme écrite. Choisir entre conditionnel, futur et imparfait dans un texte, ou choisir le temps après si se travaille séparément. Cette règle ne s’applique pas à tous les verbes : certains ont une autre base.',materialExposure:{words:[...new Set([d.model,...d.cases.map(c=>c.verb)])].map(lemma=>({lemma,form:lemma})),sentences:[...steps.flatMap(s=>s.exampleFr.split('\n')),...d.cases.map(row=>conjugationSentenceGap(row.sentence,form(row.verb,row.person)).replace('___',form(row.verb,row.person)))]}};
});
