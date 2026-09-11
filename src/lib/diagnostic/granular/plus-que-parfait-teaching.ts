import {conjugate,PERSONS,type Person} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';
const participles:Record<string,string>={être:'été',avoir:'eu',aller:'allé',faire:'fait',prendre:'pris',venir:'venu',partir:'parti',sortir:'sorti',dire:'dit',voir:'vu',pouvoir:'pu',vouloir:'voulu',savoir:'su',devoir:'dû'};
const etre=new Set(['aller','venir','partir','sortir']);
const labels:Record<Person,string>={'1s':'je','2s':'tu','3s':'il','1p':'nous','2p':'vous','3p':'ils'};
export const PLUS_QUE_PARFAIT_TEACHING:readonly TargetTeachingContent[]=CONJUGATION_TEACHING_CASES.filter(d=>d.key.startsWith('verb:')).map(d=>{
 const verb=d.model,pp=participles[verb];if(!pp)throw Error(`Missing authored participle: ${verb}`);
 const usesEtre=etre.has(verb),aux=usesEtre?'être':'avoir';
 const first=d.cases[0],answer=conjugate(verb,'plus_que_parfait',first.person,{gender:'m',...(verb==='sortir'?{auxiliaryUse:'intransitive' as const}:{})});
 const steps:TargetTeachingContent['steps']=[
  {exampleFr:'Quand Lina est arrivée, le train était déjà parti.',explanationFr:'Le départ du train a eu lieu avant l’arrivée de Lina. Était parti permet de situer ce premier fait avant un autre moment du passé : c’est le plus-que-parfait.'},
  {exampleFr:conjugationSentenceGap(first.sentence,answer).replace('___',answer),explanationFr:`${answer} est le plus-que-parfait de ${verb} dans cette phrase. Le premier mot, une forme de ${aux} à l’imparfait, aide à construire ce temps : c’est l’auxiliaire. La seconde partie vient de ${verb} : c’est le participe passé ${pp}.`},
  {exampleFr:PERSONS.map(person=>`${labels[person]} : ${conjugate(verb,'plus_que_parfait',person,{gender:'m'})}`).join('\n'),explanationFr:usesEtre?'Ce tableau est au masculin. Être change avec le sujet. Le participe s’accorde avec le sujet : au pluriel masculin, il prend s.':'Avoir change avec le sujet. Dans ces phrases sans complément direct placé avant, le participe garde la forme donnée.'},
  ...(usesEtre?[{exampleFr:`il : ${conjugate(verb,'plus_que_parfait','3s',{gender:'m'})}\nelle : ${conjugate(verb,'plus_que_parfait','3s',{gender:'f'})}\nelles : ${conjugate(verb,'plus_que_parfait','3p',{gender:'f'})}`,explanationFr:'Avec être, le participe prend e au féminin singulier et es au féminin pluriel. Le sujet et son nombre sont indiqués dans les exercices.'}]:[{exampleFr:`${verb} → ${pp}`,explanationFr:`Retiens le participe ${pp} avec le verbe ${verb}. Il ne change pas simplement parce que la forme d’avoir change.`}]),
  ...(verb==='sortir'?[{exampleFr:'Elle était sortie du hangar.\nElle avait sorti le tracteur.',explanationFr:'Quand sortir a ici un complément direct, le tracteur, il utilise avoir. Quand elle quitte le lieu elle-même, il utilise être. Choisis d’abord selon la construction, puis conjugue.'}]:[]),
 ];
 const completedPractice:string[]=[];
 const practice=d.cases.map((item,index)=>{
  const gender=usesEtre&&/^(Elle|Elles)\b/.test(item.sentence)?'f' as const:'m' as const;
  const auxiliaryUse=verb==='sortir'?([1,3].includes(index)?'transitive' as const:'intransitive' as const):undefined;
  const answerFr=conjugate(verb,'plus_que_parfait',item.person,{gender,auxiliaryUse});
  const sourceSentence=verb==='partir'&&item.person==='1p'?'Nous ___ dix minutes après le concert.':item.sentence;
  const sentence=conjugationSentenceGap(sourceSentence,answerFr);
  completedPractice.push(sentence.replace('___',answerFr));
  return {id:`guided:plus-que-parfait:${verb}:${index+1}`,promptFr:`Complète avec ${verb} au plus-que-parfait. Écris le groupe verbal manquant : ${sentence}${usesEtre?` Sujet ${gender==='f'?'féminin':'masculin'} ${item.person.endsWith('p')?'pluriel':'singulier'}.`:''}`,answerFr,hintFr:verb==='sortir'?'Observe si sortir possède un complément direct. Choisis ensuite la forme de l’auxiliaire.':`Conjugue ${aux} à l’imparfait avec le sujet, puis écris le participe ${pp}${usesEtre?' en l’accordant avec le sujet':''}.`,explanationFr:`${sentence.replace('___',answerFr)} Le groupe ${answerFr} est la forme demandée dans cette construction.`};
 });
 return {id:`french-v3-teaching:plus-que-parfait:${verb}`,nodeKey:'produire_plus_que_parfait',facetKey:`produire_plus_que_parfait::verb:${verb}`,mode:'production',status:'draft_requires_review',titleFr:`Écrire ${verb} au plus-que-parfait`,learnerQuestionFr:`Comment former le plus-que-parfait de ${verb} dans une phrase ?`,steps,practice,takeawayFr:`Associe l’auxiliaire à l’imparfait et le participe ${pp}. Vérifie le sujet${usesEtre?' et l’accord du participe avec être':''}.`,boundaryFr:'Cette leçon demande un temps précis dans des phrases fournies. Elle ne démontre pas que tu sais choisir les temps dans un texte autonome ni traiter toutes les constructions avec un complément placé avant.',materialExposure:{words:[{lemma:verb,form:verb}],sentences:[...steps.flatMap(s=>s.exampleFr.split('\n')),...completedPractice]}};
});
