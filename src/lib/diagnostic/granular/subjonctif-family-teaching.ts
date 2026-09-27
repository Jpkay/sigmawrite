import {conjugate,PERSONS,type Person} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';
const endings:Record<Person,string>={'1s':'e','2s':'es','3s':'e','1p':'ions','2p':'iez','3p':'ent'};
const subjects:Record<Person,string>={'1s':'je','2s':'tu','3s':'il ou elle','1p':'nous','2p':'vous','3p':'ils ou elles'};
export function subjunctiveContext(sentence:string){
 return `Il faut que ${sentence[0].toLocaleLowerCase('fr')}${sentence.slice(1)}`.replace('que elle','qu’elle').replace('que elles','qu’elles').replace('que ils','qu’ils').replace('que il ','qu’il ');
}
export const SUBJONCTIF_FAMILY_TEACHING:readonly TargetTeachingContent[]=CONJUGATION_TEACHING_CASES.filter(d=>d.key.startsWith('pattern:')).map(d=>{
 const stem=(verb:string)=>verb.slice(0,-2)+(d.key==='pattern:regular_ir'?'iss':'');
 const form=(verb:string,person:Person)=>{
  const answer=stem(verb)+endings[person];
  if(conjugate(verb,'subjonctif_present',person)!==answer)throw Error(`Subjunctive family disagreement: ${verb}/${person}`);
  return answer;
 };
 const sentence=(text:string,answer:string)=>conjugationSentenceGap(subjunctiveContext(text),answer);
 const first=d.cases[0],example=sentence(first.sentence,form(first.verb,first.person)).replace('___',form(first.verb,first.person));
 const contrast=d.key==='pattern:regular_ir'?{exampleFr:'Il faut que je finisse. Il faut que nous finissions.',explanationFr:'Le modèle finir garde iss à toutes les personnes au subjonctif présent. Enlève -ir, ajoute -iss-, puis la terminaison : fin- + -iss- + -e donne finisse.'}:
 d.key==='pattern:spelling_ger'?{exampleFr:'Nous mangeons. Il faut que nous mangions.',explanationFr:'Dans mangeons, le e garde le son doux du g devant o. Au subjonctif, la terminaison commence par i : mangions. Le i suffit déjà pour ce son. N’ajoute pas de e entre g et i.'}:
 d.key==='pattern:spelling_cer'?{exampleFr:'Nous lançons. Il faut que nous lancions.',explanationFr:'Dans lançons, ç garde le son s devant o. Dans lancions, le c est devant i et donne déjà ce son. Il ne prend pas de cédille. Devant le e de lance, c suffit aussi.'}:
 {exampleFr:'Nous parlons. Il faut que nous parlions.',explanationFr:'Avec nous, le subjonctif présent se termine par -ions. Le début parl- reste le même. Avec vous, la terminaison devient -iez : parliez.'};
 const steps:TargetTeachingContent['steps']=[
  {exampleFr:example,explanationFr:'Après il faut que, on présente ici une action nécessaire. Le verbe demandé est au subjonctif présent. Le sujet placé après que indique la forme à écrire.'},
  {exampleFr:`${d.model} → ${stem(d.model)}- + -e → ${form(d.model,'1s')}`,explanationFr:`Le début conservé s’appelle le radical. Pour ce modèle, ${d.key==='pattern:regular_ir'?'enlève -ir et ajoute -iss-':'enlève -er'}. Ajoute ensuite la fin correspondant au sujet, appelée terminaison.`},
  contrast,
  {exampleFr:PERSONS.map(p=>`${subjects[p]} : ${form(d.model,p)}`).join('\n'),explanationFr:'Les terminaisons sont -e, -es, -e, -ions, -iez, -ent. Je et il ou elle ont ici la même forme écrite. Avec tu, on garde un s ; avec ils ou elles, on écrit -ent.'},
 ];
 const practice=d.cases.map((r,i)=>{const answerFr=form(r.verb,r.person),gap=sentence(r.sentence,answerFr);return {id:`subjonctif-family:${d.key}:${i+1}`,promptFr:`Complète avec ${r.verb} au subjonctif présent. Écris seulement le verbe : ${gap}`,answerFr,hintFr:`Avec ${subjects[r.person]}, ajoute -${endings[r.person]} à ${stem(r.verb)}-.`,explanationFr:`${gap.replace('___',answerFr)} Le radical ${stem(r.verb)}- suivi de -${endings[r.person]} donne ${answerFr}.`};});
 return {id:`french-v3-teaching:subjonctif-present:${d.key}`,nodeKey:'produire_subjonctif_present_frequent',facetKey:`produire_subjonctif_present_frequent::${d.key}`,mode:'production',status:'draft_requires_review',titleFr:`Écrire les verbes comme ${d.model} au subjonctif présent`,learnerQuestionFr:`Comment écrire les verbes comme ${d.model} après « il faut que » ?`,steps,practice,takeawayFr:'Repère le sujet, construis le radical du modèle et ajoute -e, -es, -e, -ions, -iez ou -ent.',boundaryFr:'Le subjonctif est demandé : tu travailles ici la forme du verbe, pas le choix du mode dans un texte. Aller ne suit pas le modèle parler, et partir ne suit pas le modèle finir.',materialExposure:{words:[...new Set([d.model,...d.cases.map(r=>r.verb)])].map(lemma=>({lemma,form:lemma})),sentences:[...steps.flatMap(s=>s.exampleFr.split('\n')),...d.cases.map(r=>sentence(r.sentence,form(r.verb,r.person)).replace('___',form(r.verb,r.person)))]}};
});
