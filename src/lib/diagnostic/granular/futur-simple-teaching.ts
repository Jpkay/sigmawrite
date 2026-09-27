import {conjugate,PERSONS,type Person} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';

const stems:Record<string,string>={être:'ser',avoir:'aur',aller:'ir',faire:'fer',prendre:'prendr',venir:'viendr',partir:'partir',sortir:'sortir',dire:'dir',voir:'verr',pouvoir:'pourr',vouloir:'voudr',savoir:'saur',devoir:'devr'};
const subjects:Record<Person,string>={'1s':'je','2s':'tu','3s':'il, elle ou on','1p':'nous','2p':'vous','3p':'ils ou elles'};
const endings:Record<Person,string>={'1s':'ai','2s':'as','3s':'a','1p':'ons','2p':'ez','3p':'ont'};

export const FUTUR_SIMPLE_TEACHING:readonly TargetTeachingContent[]=CONJUGATION_TEACHING_CASES.filter(d=>d.key.startsWith('verb:')).map(draft=>{
 const verb=draft.model,stem=stems[verb];
 if(!stem)throw Error(`Missing authored future stem: ${verb}`);
 const form=(person:Person)=>{
  const answer=stem+endings[person];
  if(conjugate(verb,'futur_simple',person)!==answer)throw Error(`Future paradigm disagreement: ${verb}/${person}`);
  return answer;
 };
 const completed=(sentence:string,person:Person)=>conjugationSentenceGap(sentence,form(person)).replace('___',form(person));
 const first=draft.cases[0];
 const regular=stem===verb?'Garde le verbe entier comme base.':verb.endsWith('re')&&stem===verb.slice(0,-1)?'Enlève le e final du verbe pour obtenir cette base.':`La base ${stem}- est particulière à ce verbe : retiens-la avec un exemple.`;
 const steps=[
  {exampleFr:completed(first.sentence,first.person),explanationFr:`La forme ${form(first.person)} permet ici d’annoncer ce qui se passera plus tard. C’est le futur simple du verbe ${verb}. Le verbe conjugué s’écrit en un seul mot.`},
  {exampleFr:`${verb} → ${stem}- + -${endings[first.person]} → ${form(first.person)}`,explanationFr:`Le début qui reste le même dans les six formes est ${stem}-. On l’appelle la base, ou le radical. ${regular} Ajoute ensuite la terminaison qui correspond au sujet.`},
  {exampleFr:PERSONS.map(person=>`${subjects[person]} : ${form(person)}`).join('\n'),explanationFr:'Les terminaisons du futur simple sont -ai, -as, -a, -ons, -ez et -ont. La base se termine par r. Garde ce r quand tu ajoutes la terminaison.'},
  {exampleFr:`je : ${form('1s')} ; tu : ${form('2s')} ; il ou elle : ${form('3s')}`,explanationFr:'À l’écrit, distingue -ai avec je, -as avec tu et -a avec il ou elle. Le sujet permet de choisir les lettres, même quand deux formes se prononcent de la même façon.'},
 ];
 const practice=draft.cases.map((item,index)=>{
  const answerFr=form(item.person),sentence=conjugationSentenceGap(item.sentence,answerFr);
  return {id:`guided:futur-simple:${verb}:${index+1}`,promptFr:`Complète avec ${verb} au futur simple. Écris seulement le verbe : ${sentence}`,answerFr,
   hintFr:`Avec ${subjects[item.person]}, ajoute -${endings[item.person]} à la base ${stem}-.`,explanationFr:`${completed(item.sentence,item.person)} La base ${stem}- et la terminaison -${endings[item.person]} donnent ${answerFr}.`};
 });
 return {id:`french-v3-teaching:futur-simple:${verb}`,nodeKey:'produire_futur_simple',facetKey:`produire_futur_simple::verb:${verb}`,mode:'production',status:'draft_requires_review',titleFr:`Écrire ${verb} au futur simple`,learnerQuestionFr:`Comment écrire ${verb} au futur simple avec chaque sujet ?`,steps,practice,
  takeawayFr:`Pour ${verb} au futur simple, pars de ${stem}- puis ajoute -ai, -as, -a, -ons, -ez ou -ont selon le sujet.`,
  boundaryFr:`Cette leçon entraîne les formes de ${verb} au futur simple. Elle ne prouve pas que tu sais choisir entre futur simple, futur proche et conditionnel dans un texte.`,
  materialExposure:{words:[{lemma:verb,form:verb}],sentences:[...steps.map(step=>step.exampleFr),...draft.cases.map(item=>completed(item.sentence,item.person))]},
 };
});
