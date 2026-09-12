import {conjugate,type Person} from '@/lib/linguistic/conjugation';
import type {TargetTeachingContent} from './teaching-content';

type ImperativePerson=Extract<Person,'2s'|'1p'|'2p'>;
type Example={verb:string;person:ImperativePerson;gap:string;answer:string};
type Family={key:string;model:string;forms:[string,string,string];rule:string;contrast:string;cases:Example[]};
const audience:Record<ImperativePerson,string>={
 '2s':'Tu donnes une consigne à une personne que tu tutoies.',
 '1p':'Tu proposes une action à faire ensemble, toi compris.',
 '2p':'Tu donnes une consigne à plusieurs personnes.',
};
const families:Family[]=[
 {key:'regular_er',model:'parler',forms:['parle','parlons','parlez'],rule:'Avec les verbes comme parler, enlève -er et ajoute -e, -ons ou -ez. Pour une personne tutoyée, il n’y a pas de s final ici.',contrast:'Tu parles doucement. → Parle doucement.',cases:[
  {verb:'écouter',person:'2s',gap:'___ la dernière note.',answer:'écoute'},
  {verb:'regarder',person:'2s',gap:'___ le panneau avant de traverser.',answer:'regarde'},
  {verb:'préparer',person:'1p',gap:'___ notre présentation ensemble.',answer:'préparons'},
  {verb:'chercher',person:'1p',gap:'___ une autre solution.',answer:'cherchons'},
  {verb:'dessiner',person:'2p',gap:'___ chacun un personnage.',answer:'dessinez'},
  {verb:'fermer',person:'2p',gap:'___ vos cahiers.',answer:'fermez'},
 ]},
 {key:'regular_ir',model:'finir',forms:['finis','finissons','finissez'],rule:'Avec les verbes du modèle finir, enlève -ir et ajoute -is, -issons ou -issez. Le s de finis reste écrit. Le groupe iss apparaît avec nous et vous.',contrast:'Finis ton dessin. → Finissons notre dessin. → Finissez vos dessins.',cases:[
  {verb:'choisir',person:'2s',gap:'___ une couleur pour ton titre.',answer:'choisis'},
  {verb:'remplir',person:'2s',gap:'___ ta gourde avant le départ.',answer:'remplis'},
  {verb:'réfléchir',person:'1p',gap:'___ ensemble avant de répondre.',answer:'réfléchissons'},
  {verb:'ralentir',person:'1p',gap:'___ pour attendre les autres.',answer:'ralentissons'},
  {verb:'applaudir',person:'2p',gap:'___ les acteurs à la fin.',answer:'applaudissez'},
  {verb:'finir',person:'2p',gap:'___ vos affiches avant la pause.',answer:'finissez'},
 ]},
 {key:'spelling_ger',model:'manger',forms:['mange','mangeons','mangez'],rule:'Les terminaisons sont -e, -ons et -ez. Devant le o de -ons, garde un e après le g pour conserver le son doux : mangeons. Devant e, le g donne déjà ce son.',contrast:'Mange lentement. → Mangeons lentement. → Mangez lentement.',cases:[
  {verb:'ranger',person:'2s',gap:'___ ton casque dans le placard.',answer:'range'},
  {verb:'bouger',person:'2s',gap:'___ doucement ton bras.',answer:'bouge'},
  {verb:'partager',person:'1p',gap:'___ le matériel entre nous.',answer:'partageons'},
  {verb:'mélanger',person:'1p',gap:'___ les deux couleurs.',answer:'mélangeons'},
  {verb:'changer',person:'2p',gap:'___ de place au prochain tour.',answer:'changez'},
  {verb:'nager',person:'2p',gap:'___ jusqu’à la ligne bleue.',answer:'nagez'},
 ]},
 {key:'spelling_cer',model:'lancer',forms:['lance','lançons','lancez'],rule:'Les terminaisons sont -e, -ons et -ez. Devant le o de -ons, écris ç pour garder le son s : lançons. Devant e, le c donne déjà ce son et ne prend pas de cédille.',contrast:'Lance le ballon. → Lançons le ballon. → Lancez le ballon.',cases:[
  {verb:'placer',person:'2s',gap:'___ ta pièce au centre du plateau.',answer:'place'},
  {verb:'effacer',person:'2s',gap:'___ seulement le trait de crayon.',answer:'efface'},
  {verb:'commencer',person:'1p',gap:'___ notre répétition.',answer:'commençons'},
  {verb:'avancer',person:'1p',gap:'___ ensemble jusqu’au repère.',answer:'avançons'},
  {verb:'tracer',person:'2p',gap:'___ un cercle sur vos feuilles.',answer:'tracez'},
  {verb:'lancer',person:'2p',gap:'___ les dés à tour de rôle.',answer:'lancez'},
 ]},
];

/** Authoring drafts. Guided examples are exposure, never independent checks. */
export const IMPERATIF_FAMILY_TEACHING:readonly TargetTeachingContent[]=families.map(f=>{
 const persons:ImperativePerson[]=['2s','1p','2p'];
 for(const [i,person] of persons.entries())if(conjugate(f.model,'imperatif_present',person)!==f.forms[i])throw Error(`Imperative model disagreement: ${f.model}/${person}`);
 for(const c of f.cases)if(conjugate(c.verb,'imperatif_present',c.person)!==c.answer)throw Error(`Imperative answer disagreement: ${c.verb}/${c.person}`);
 const practice=f.cases.map((c,i)=>({
  id:`imperatif-family:${f.key}:${i+1}`,
  promptFr:`${audience[c.person]} Complète avec ${c.verb} à l’impératif présent. Écris seulement le verbe : ${c.gap}`,
  answerFr:c.answer,
  hintFr:`Choisis la forme correspondant à ${c.person==='2s'?'tu':c.person==='1p'?'nous':'vous'}, sans écrire ce pronom. ${f.rule}`,
  explanationFr:`${c.gap.replace('___',c.answer[0].toLocaleUpperCase('fr')+c.answer.slice(1))} ${audience[c.person]} La forme attendue est ${c.answer}.`,
 }));
 const steps:TargetTeachingContent['steps']=[
  {exampleFr:'Écoute la consigne. Préparons notre affiche. Fermez vos cahiers.',explanationFr:'Pour donner une consigne ou proposer une action à faire ensemble, on peut commencer directement par le verbe. Cette forme s’appelle l’impératif présent. Le pronom sujet tu, nous ou vous n’est pas écrit.'},
  {exampleFr:`Une personne tutoyée : ${f.forms[0]}\nNous, ensemble : ${f.forms[1]}\nPlusieurs personnes : ${f.forms[2]}`,explanationFr:'Choisis d’abord à qui tu t’adresses. La forme de nous inclut la personne qui parle. La forme de vous sert aussi à parler poliment à une seule personne.'},
  {exampleFr:f.contrast,explanationFr:f.rule},
  {exampleFr:'Tu parles. → Parle.\nTu finis. → Finis.',explanationFr:'Ne retire pas toujours le s. Les verbes comme parler perdent ici le s de tu parles, mais les verbes comme finir gardent celui de tu finis.'},
 ];
 return {
  id:`french-v3-teaching:imperatif-present:pattern:${f.key}`,nodeKey:'produire_imperatif',facetKey:`produire_imperatif::pattern:${f.key}`,mode:'production',status:'draft_requires_review',
  titleFr:`Donner une consigne avec les verbes comme ${f.model}`,
  learnerQuestionFr:`Comment écrire les verbes comme ${f.model} quand je donne une consigne ?`,steps,practice,
  takeawayFr:'Repère à qui tu parles, choisis la forme de tu, nous ou vous, puis écris le verbe sans le pronom sujet.',
  boundaryFr:'Tu travailles ici la forme de l’impératif demandé, pas le choix du mode dans un texte. Les pronoms après le verbe se travaillent séparément : mange n’a pas de s, mais manges-en en prend un. Aller ne suit pas le modèle parler ; partir ne suit pas le modèle finir.',
  materialExposure:{words:[...new Set([f.model,...f.cases.map(c=>c.verb)])].map(lemma=>({lemma,form:lemma})),sentences:[...steps.flatMap(s=>s.exampleFr.split('\n')),...f.cases.map(c=>c.gap.replace('___',c.answer[0].toLocaleUpperCase('fr')+c.answer.slice(1)))]},
 };
});
