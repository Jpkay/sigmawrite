import {vouloirImperativeAnswers,type VouloirImperativeUse} from '@/lib/linguistic/vouloir-imperative';
import type {Person} from '@/lib/linguistic/conjugation';
import type {TargetTeachingContent} from './teaching-content';
type Context=readonly [Extract<Person,'2s'|'1p'|'2p'>,VouloirImperativeUse,string];
const audience={ '2s':'Tu t’adresses à une personne que tu tutoies.', '1p':'Tu inclus les personnes auxquelles tu parles et toi-même.', '2p':'Tu t’adresses à plusieurs personnes ou à une personne que tu vouvoies.' };
const instruction=(use:VouloirImperativeUse)=>use==='polite_request'?'Tu écris une formule de politesse.':'En vouloir signifie ici garder de la rancune envers quelqu’un.';
const prompt=(person:Context[0],use:VouloirImperativeUse,sentence:string)=>`${audience[person]} ${instruction(use)} Complète avec vouloir à l’impératif présent : ${sentence}`;
const contexts:readonly Context[]=[
  [
    "2s",
    "resentment",
    "Ne m’en ___ pas pour ce retard."
  ],
  [
    "2s",
    "resentment",
    "Ne lui en ___ pas d’avoir oublié ton prénom."
  ],
  [
    "2s",
    "resentment",
    "Ne leur en ___ pas pour cette maladresse."
  ],
  [
    "2s",
    "resentment",
    "Ne nous en ___ pas si nous partons tôt."
  ],
  [
    "1p",
    "resentment",
    "Ne lui en ___ pas pour cette petite erreur."
  ],
  [
    "1p",
    "resentment",
    "Ne leur en ___ plus pour le ballon perdu."
  ],
  [
    "1p",
    "resentment",
    "N’en ___ pas à Lina d’avoir changé d’avis."
  ],
  [
    "1p",
    "resentment",
    "Ne nous en ___ pas mutuellement pour ce malentendu."
  ],
  [
    "2p",
    "resentment",
    "Ne m’en ___ pas si je refuse cette invitation."
  ],
  [
    "2p",
    "resentment",
    "Ne lui en ___ pas pour son absence."
  ],
  [
    "2p",
    "resentment",
    "Ne leur en ___ plus après leurs excuses."
  ],
  [
    "2p",
    "resentment",
    "Ne nous en ___ pas pour cette annulation."
  ],
  [
    "2s",
    "polite_request",
    "___ accepter mes excuses pour cet oubli."
  ],
  [
    "2s",
    "polite_request",
    "___ transmettre ce message à ta famille."
  ],
  [
    "2s",
    "polite_request",
    "___ recevoir mes remerciements pour ton aide."
  ],
  [
    "2p",
    "polite_request",
    "___ déposer vos dossiers à l’accueil."
  ],
  [
    "2p",
    "polite_request",
    "___ patienter jusqu’à l’ouverture des portes."
  ],
  [
    "2p",
    "polite_request",
    "___ indiquer votre nom en haut de la feuille."
  ]
];
const guided:readonly Context[]=[
  [
    "2s",
    "resentment",
    "Ne m’en ___ pas pour mon hésitation."
  ],
  [
    "2s",
    "resentment",
    "Ne lui en ___ plus pour sa remarque."
  ],
  [
    "1p",
    "resentment",
    "Ne leur en ___ pas pour leur départ précipité."
  ],
  [
    "1p",
    "resentment",
    "N’en ___ pas à notre ami pour son silence."
  ],
  [
    "2p",
    "resentment",
    "Ne m’en ___ pas de poser cette question."
  ],
  [
    "2p",
    "resentment",
    "Ne lui en ___ plus pour le verre cassé."
  ],
  [
    "2s",
    "polite_request",
    "___ croire à mon amitié."
  ],
  [
    "2p",
    "polite_request",
    "___ présenter votre billet au contrôle."
  ]
];
// Interleave contexts; ordinal-first item keys preserve this balance through pool sorting.
export const VOULOIR_IMPERATIVE_APPLICATIONS=([0,4,8,12,15,1,5,13,16,2,6,9,14,17,3,7,10,11].map(index=>contexts[index])).map(([person,use,sentence])=>{
 const forms=vouloirImperativeAnswers('vouloir','imperatif_present',person,use);
 return {verb:'vouloir',person,use,sentence,answer:forms[0],acceptableAnswers:forms.slice(1),prompt:prompt(person,use,sentence)};
});
const steps=[
 {exampleFr:'Veuillez entrer. Ne m’en veux pas.',explanationFr:'La première phrase invite poliment quelqu’un à entrer. La seconde demande à quelqu’un de ne pas garder de rancune. Les deux emploient vouloir à l’impératif, mais dans des usages différents.'},
 {exampleFr:'Une formule de politesse : veuille ou veuillez, selon la personne.',explanationFr:'Avec une personne tutoyée, la forme est veuille, dans une formule soutenue. Avec vous, on écrit veuillez, suivi d’un verbe à l’infinitif. Le u après le premier e est nécessaire : veillez vient d’un autre verbe, veiller.'},
 {exampleFr:'Tu : veux ou veuille. Nous : voulons ou veuillons. Vous : voulez ou veuillez.',explanationFr:'Avec en vouloir, les deux séries sont possibles. Les formes veux, voulons et voulez sont courantes dans cet emploi négatif. Les autres formes appartiennent à un usage plus soutenu.'},
 {exampleFr:'Que tu veuilles. Ne m’en veuille pas.',explanationFr:'Ne copie pas la terminaison du subjonctif : à l’impératif, veuille ne prend pas de s. La personne visée et l’usage indiqué t’aident à choisir la forme.'},
];
export const VOULOIR_IMPERATIVE_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:imperatif-present:verb:vouloir',nodeKey:'produire_imperatif',facetKey:'produire_imperatif::verb:vouloir',mode:'production',status:'draft_requires_review',
 titleFr:'Écrire vouloir dans une demande ou une excuse',learnerQuestionFr:'Pourquoi écrit-on veuillez entrer, mais ne m’en veux pas ?',steps,
 practice:guided.map(([person,use,sentence],i)=>{
  const forms=vouloirImperativeAnswers('vouloir','imperatif_present',person,use),answerFr=forms.join(' ou ');
  const distractors=person==='2s'?['veut','veuilles']:person==='1p'?['voulions','veulent']:['vouliez','veillez'];
  return {id:`vouloir-imperative-guided-${i+1}`,promptFr:prompt(person,use,sentence)+' Choisis la réponse qui donne la ou les formes possibles.',choices:[answerFr,...distractors],answerFr,hintFr:instruction(use),explanationFr:forms.map(form=>sentence.replace('___',form)).join(' ')+' '+(use==='resentment'?'Les deux formes sont acceptées dans cet emploi.':'Cette formule de politesse utilise la forme en veuill-.')};
 }),
 takeawayFr:'Dans une demande polie, utilise veuille ou veuillez. Avec en vouloir, veux, voulons et voulez sont aussi possibles. Vérifie à qui tu parles.',
 boundaryFr:'Ces expressions ne couvrent pas tous les sens de vouloir. L’usage affirmatif exprimant une ferme volonté est rare et n’est pas travaillé ici. Les pronoms sont déjà fournis : leur placement n’est pas évalué.',
 materialExposure:{words:[{lemma:'vouloir',form:'vouloir'}],sentences:[...steps.map(s=>s.exampleFr),...guided.flatMap(([person,use,sentence])=>vouloirImperativeAnswers('vouloir','imperatif_present',person,use).map(form=>sentence.replace('___',form)))]},
}];
