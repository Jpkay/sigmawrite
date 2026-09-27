import {conjugate,PERSONS,type Person} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';
const subjects:Record<Person,string>={'1s':'je','2s':'tu','3s':'il, elle ou on','1p':'nous','2p':'vous','3p':'ils ou elles'};
const endings:Record<Person,string>={'1s':'ais','2s':'ais','3s':'ait','1p':'ions','2p':'iez','3p':'aient'};
/** Separate exact-verb targets. Guided forms never count as unaided evidence. */
export const IMPARFAIT_TEACHING:readonly TargetTeachingContent[]=CONJUGATION_TEACHING_CASES.filter(d=>d.key.startsWith('verb:')).map(draft=>{
 const verb=draft.model,presentNous=conjugate(verb,'present','1p');
 const stem=verb==='être'?'ét':presentNous.slice(0,-3);
 if(verb!=='être'&&!presentNous.endsWith('ons'))throw Error(`Unverified imparfait stem: ${verb}`);
 const first=draft.cases[0];
 const before=first.sentence.replace('___',conjugate(verb,'present',first.person));
 const after=conjugationSentenceGap(first.sentence,conjugate(verb,'imparfait',first.person)).replace('___',conjugate(verb,'imparfait',first.person));
 const steps=[
  {exampleFr:`${before}\n${after}`,explanationFr:`Le sujet et le verbe sont les mêmes, mais la forme change. Dans la seconde phrase, ${conjugate(verb,'imparfait',first.person)} est à l’imparfait. Ce temps permet notamment de raconter une habitude ou une situation dans le passé.`},
  verb==='être'?{exampleFr:'être → ét- : j’étais, nous étions',explanationFr:'Être a une base particulière à l’imparfait : ét-. Ne pars pas de nous sommes. À cette base, ajoute la terminaison correspondant au sujet.'}:{exampleFr:`nous ${presentNous} → ${stem}- + -${endings[first.person]} → ${conjugate(verb,'imparfait',first.person)}`,explanationFr:`Pars de la forme avec nous au présent : ${presentNous}. Retire -ons. Le morceau qui reste, ${stem}-, est la base appelée radical. Ajoute ensuite la terminaison de l’imparfait.`},
  {exampleFr:PERSONS.map(person=>`${subjects[person]} : ${conjugate(verb,'imparfait',person)}`).join('\n'),explanationFr:'Les six terminaisons sont -ais, -ais, -ait, -ions, -iez et -aient. Observe les lettres écrites : plusieurs formes se ressemblent à l’oral.'},
  {exampleFr:`nous ${conjugate(verb,'imparfait','1p')} ; vous ${conjugate(verb,'imparfait','2p')}`,explanationFr:`Avec nous et vous, garde la base ${stem}- et ajoute -ions ou -iez en entier. N’oublie pas le i de la terminaison.`},
 ];
 const practice=draft.cases.map((item,index)=>{
  const answerFr=conjugate(verb,'imparfait',item.person);
  const sentence=conjugationSentenceGap(item.sentence,answerFr);
  return {id:`guided:imparfait:${verb}:${index+1}`,promptFr:`Le récit est au passé. Complète avec ${verb} à l’imparfait. Écris seulement le verbe : ${sentence}`,answerFr,
   hintFr:`Avec ${subjects[item.person]}, ajoute -${endings[item.person]} à la base ${stem}-.`,explanationFr:`${sentence.replace('___',answerFr)} La base ${stem}- et la terminaison -${endings[item.person]} donnent ${answerFr}.`};
 });
 return {id:`french-v3-teaching:imparfait:${verb}`,nodeKey:'produire_imparfait',facetKey:`produire_imparfait::verb:${verb}`,mode:'production',status:'draft_requires_review',titleFr:`Écrire ${verb} à l’imparfait`,learnerQuestionFr:`Comment retrouver les formes de ${verb} à l’imparfait selon le sujet ?`,steps,
  takeawayFr:verb==='être'?'Pour être, pars de ét- puis choisis la terminaison : -ais, -ais, -ait, -ions, -iez ou -aient.':`Pour ${verb}, pars de nous ${presentNous}, retire -ons et ajoute la terminaison de l’imparfait correspondant au sujet.`,
  boundaryFr:`Cette leçon concerne ${verb} à l’imparfait. Elle ne suffit pas pour choisir entre imparfait et passé composé dans un récit, ni pour connaître les autres temps de ce verbe.`,practice,
  materialExposure:{words:[{lemma:verb,form:verb}],sentences:[...steps.map(step=>step.exampleFr),...draft.cases.map((item,index)=>conjugationSentenceGap(item.sentence,practice[index].answerFr).replace('___',practice[index].answerFr))]},
 };
});
