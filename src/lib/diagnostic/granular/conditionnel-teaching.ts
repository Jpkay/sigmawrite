import {conjugate,PERSONS,type Person} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';

const stems:Record<string,string>={être:'ser',avoir:'aur',aller:'ir',faire:'fer',prendre:'prendr',venir:'viendr',partir:'partir',sortir:'sortir',dire:'dir',voir:'verr',pouvoir:'pourr',vouloir:'voudr',savoir:'saur',devoir:'devr'};
const subjects:Record<Person,string>={'1s':'je','2s':'tu','3s':'il, elle ou on','1p':'nous','2p':'vous','3p':'ils ou elles'};
const endings:Record<Person,string>={'1s':'ais','2s':'ais','3s':'ait','1p':'ions','2p':'iez','3p':'aient'};

export const CONDITIONNEL_PRODUCTION_TEACHING:readonly TargetTeachingContent[]=CONJUGATION_TEACHING_CASES.filter(d=>d.key.startsWith('verb:')).map(draft=>{
 const verb=draft.model,stem=stems[verb];
 if(!stem)throw Error(`Missing authored conditional stem: ${verb}`);
 const form=(person:Person)=>{
  const answer=stem+endings[person];
  if(conjugate(verb,'conditionnel_present',person)!==answer)throw Error(`Conditional paradigm disagreement: ${verb}/${person}`);
  return answer;
 };
 const completed=(sentence:string,person:Person)=>conjugationSentenceGap(sentence,form(person)).replace('___',form(person));
 const first=draft.cases[0];
 const regular=stem===verb?'Garde le verbe entier comme base.':verb.endsWith('re')&&stem===verb.slice(0,-1)?'Enlève le e final du verbe pour obtenir cette base.':`La base ${stem}- est particulière à ce verbe : retiens-la avec un exemple.`;
 const steps=[
  {exampleFr:completed(first.sentence,first.person),explanationFr:`La forme ${form(first.person)} peut servir à présenter un fait imaginé, un souhait ou une demande polie selon le contexte. C’est le conditionnel présent du verbe ${verb}. Le verbe conjugué s’écrit en un seul mot.`},
  {exampleFr:`${verb} → ${stem}- + -${endings[first.person]} → ${form(first.person)}`,explanationFr:`Le début qui reste le même dans les six formes est ${stem}-. On l’appelle la base, ou le radical. ${regular} Ajoute ensuite la terminaison qui correspond au sujet.`},
  {exampleFr:PERSONS.map(person=>`${subjects[person]} : ${form(person)}`).join('\n'),explanationFr:'Les terminaisons du conditionnel présent sont celles de l’imparfait : -ais, -ais, -ait, -ions, -iez et -aient. La base est celle du futur simple et se termine par r. Garde ce r.'},
  {exampleFr:`je : ${form('1s')} ; tu : ${form('2s')} ; il ou elle : ${form('3s')}`,explanationFr:'À l’écrit, je et tu prennent -ais, tandis que il ou elle prend -ait. Ces terminaisons se ressemblent à l’oral : utilise le sujet pour choisir les lettres.'},
 ];
 const practice=draft.cases.map((item,index)=>{
  const answerFr=form(item.person),sentence=conjugationSentenceGap(item.sentence,answerFr);
  return {id:`guided:conditionnel-present:${verb}:${index+1}`,promptFr:`Complète avec ${verb} au conditionnel présent. Écris seulement le verbe : ${sentence}`,answerFr,
   hintFr:`Avec ${subjects[item.person]}, ajoute -${endings[item.person]} à la base ${stem}-.`,explanationFr:`${completed(item.sentence,item.person)} La base ${stem}- et la terminaison -${endings[item.person]} donnent ${answerFr}.`};
 });
 return {id:`french-v3-teaching:conditionnel-present:${verb}`,nodeKey:'produire_conditionnel_present',facetKey:`produire_conditionnel_present::verb:${verb}`,mode:'production',status:'draft_requires_review',titleFr:`Écrire ${verb} au conditionnel présent`,learnerQuestionFr:`Comment écrire ${verb} au conditionnel présent avec chaque sujet ?`,steps,practice,
  takeawayFr:`Pour ${verb} au conditionnel présent, pars de ${stem}- puis ajoute -ais, -ais, -ait, -ions, -iez ou -aient selon le sujet.`,
  boundaryFr:`Cette leçon entraîne les formes de ${verb} au conditionnel présent. Elle ne prouve pas que tu sais choisir entre conditionnel, futur et imparfait dans un texte, ni choisir le temps après si.`,
  materialExposure:{words:[{lemma:verb,form:verb}],sentences:[...steps.map(step=>step.exampleFr),...draft.cases.map(item=>completed(item.sentence,item.person))]},
 };
});
