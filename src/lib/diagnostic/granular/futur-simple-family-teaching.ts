import {conjugate,PERSONS,type Person} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';
const endings:Record<Person,string>={'1s':'ai','2s':'as','3s':'a','1p':'ons','2p':'ez','3p':'ont'};
const subjects:Record<Person,string>={'1s':'je','2s':'tu','3s':'il ou elle','1p':'nous','2p':'vous','3p':'ils ou elles'};
export const FUTUR_SIMPLE_FAMILY_TEACHING:readonly TargetTeachingContent[]=CONJUGATION_TEACHING_CASES.filter(d=>d.key.startsWith('pattern:')).map(d=>{
 const form=(verb:string,person:Person)=>{
  const answer=verb+endings[person];
  if(conjugate(verb,'futur_simple',person)!==answer)throw Error(`Future family disagreement: ${verb}/${person}`);
  return answer;
 };
 const first=d.cases[0],firstSentence=conjugationSentenceGap(first.sentence,form(first.verb,first.person)).replace('___',form(first.verb,first.person));
 const contrast=d.key==='pattern:regular_ir'?{exampleFr:'Nous finissons maintenant. Nous finirons demain.',explanationFr:'Au présent, on écrit finissons avec iss. Au futur simple, garde finir entier puis ajoute -ons : finirons. Ne transporte pas le morceau iss du présent dans le futur.'}:
 d.key==='pattern:spelling_ger'?{exampleFr:'Nous mangeons maintenant. Nous mangerons demain.',explanationFr:'Au présent, le e de mangeons garde le son du g devant o. Au futur, pars de manger : le e est déjà devant le r. Ajoute -ons après ce r, sans ajouter un autre e.'}:
 d.key==='pattern:spelling_cer'?{exampleFr:'Nous lançons maintenant. Nous lancerons demain.',explanationFr:'Au présent, lançons prend une cédille devant o. Au futur, pars de lancer : c est devant e et garde le son s sans cédille. Écris lancerons avec c.'}:
 {exampleFr:'Je parle maintenant. Je parlerai demain.',explanationFr:'Au présent, la forme parle ne contient plus le r de parler. Au futur simple, garde parler entier et ajoute -ai. Le r fait partie de la base du futur.'};
 const steps:TargetTeachingContent['steps']=[
  {exampleFr:`Demain : ${firstSentence}`,explanationFr:'Cette phrase annonce une action à venir. Le verbe est au futur simple et s’écrit en un seul mot.'},
  {exampleFr:`${d.model} + -ai → ${form(d.model,'1s')}`,explanationFr:'Pour ce modèle, pars de la forme du dictionnaire, appelée infinitif. Garde-la entière : elle sert de base, ou radical. Ajoute ensuite la terminaison qui correspond au sujet.'},
  contrast,
  {exampleFr:PERSONS.map(p=>`${subjects[p]} : ${form(d.model,p)}`).join('\n'),explanationFr:'Avec je, tu, il ou elle, nous, vous, ils ou elles, ajoute respectivement -ai, -as, -a, -ons, -ez, -ont. Le sujet permet de choisir les lettres, même quand des formes se prononcent de la même façon.'},
 ];
 const practice=d.cases.map((row,index)=>{
  const answerFr=form(row.verb,row.person),sentence=conjugationSentenceGap(row.sentence,answerFr);
  return {id:`futur-simple:${d.key}:guided-${index}`,promptFr:`L’action aura lieu plus tard. Complète avec ${row.verb} au futur simple : ${sentence}`,answerFr,hintFr:`Garde ${row.verb} entier et ajoute -${endings[row.person]} avec ${subjects[row.person]}.`,explanationFr:`${sentence.replace('___',answerFr)} ${row.verb} + -${endings[row.person]} donne ${answerFr}.`};
 });
 return {id:`french-v3-teaching:futur-simple:${d.key}`,nodeKey:'produire_futur_simple',facetKey:`produire_futur_simple::${d.key}`,mode:'production',status:'draft_requires_review',titleFr:`Écrire les verbes comme ${d.model} au futur simple`,learnerQuestionFr:`Comment annoncer une action à venir avec les verbes comme ${d.model} ?`,steps,practice,takeawayFr:'Pour ce modèle, garde l’infinitif entier, puis ajoute -ai, -as, -a, -ons, -ez ou -ont selon le sujet.',boundaryFr:'Le temps est donné : ces exercices vérifient la forme écrite. Choisir entre futur simple, futur proche et conditionnel dans un texte se travaille séparément. Cette règle ne s’applique pas à tous les verbes : certains ont une autre base.',materialExposure:{words:[...new Set([d.model,...d.cases.map(c=>c.verb)])].map(lemma=>({lemma,form:lemma})),sentences:[...steps.flatMap(s=>s.exampleFr.split('\n')),...d.cases.map(row=>conjugationSentenceGap(row.sentence,form(row.verb,row.person)).replace('___',form(row.verb,row.person)))]}};
});
