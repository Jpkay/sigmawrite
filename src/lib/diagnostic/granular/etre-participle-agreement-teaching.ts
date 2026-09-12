import type {TargetTeachingContent} from './teaching-content';
import type {EtreAgreementCase} from './etre-participle-agreement-drafts';
const nodeKey='accorder_participe_etre';
const boundaryFr='Ces exemples emploient être sans verbe pronominal, c’est-à-dire sans se comme dans se laver. Ces verbes demandent une autre vérification. Avec avoir, on n’applique pas automatiquement la même règle. Ici, la forme de départ est donnée : tu travailles son accord.';
const definitions:Record<EtreAgreementCase,{title:string;question:string;steps:TargetTeachingContent['steps'];takeaway:string;subject:string;auxiliary:string;suffix:string;reason:string}>={
 feminine:{title:'Écrire le participe avec un sujet féminin',question:'Pourquoi écrit-on elle est arrivée avec un e ?',steps:[
  {exampleFr:'Le garçon est arrivé. La fille est arrivée.',explanationFr:'La personne change. Dans la deuxième phrase, arrivée prend un e parce que le sujet, la fille, est féminin singulier.'},
  {exampleFr:'La fille est arrivée.',explanationFr:'Arrivée est une forme du verbe arriver : le participe passé. Est vient du verbe être et l’aide à exprimer le passé : c’est l’auxiliaire.'},
  {exampleFr:'La fille est restée près de ses amis.',explanationFr:'Cherche le sujet : qui est resté ? La fille. Restée s’accorde avec ce sujet, pas avec le nom amis qui vient après.'},
 ],takeaway:'Avec être, repère le sujet. Au féminin singulier, les participes de cette leçon prennent e.',subject:'La randonneuse',auxiliary:'est',suffix:'e',reason:'« La randonneuse » est un sujet féminin singulier.'},
 plural:{title:'Écrire le participe avec un sujet au pluriel',question:'Pourquoi écrit-on ils sont arrivés avec un s ?',steps:[
  {exampleFr:'Le garçon est arrivé. Les garçons sont arrivés.',explanationFr:'On parle maintenant de plusieurs garçons. Arrivés prend un s : le sujet les garçons est masculin pluriel.'},
  {exampleFr:'Les garçons sont arrivés.',explanationFr:'Arrivés est le participe passé du verbe arriver. Sont est une forme de être, utilisé ici pour exprimer le passé. Le participe s’accorde avec le sujet.'},
  {exampleFr:'Les garçons sont restés près de la fontaine.',explanationFr:'La fontaine est singulier, mais ce n’est pas le sujet. Ce sont les garçons qui sont restés : le participe garde son s.'},
 ],takeaway:'Avec être, regarde le sujet plutôt que le nom le plus proche. Au masculin pluriel, les participes de cette leçon prennent s.',subject:'Les randonneurs',auxiliary:'sont',suffix:'s',reason:'« Les randonneurs » est un sujet masculin pluriel.'},
 both:{title:'Écrire le participe au féminin pluriel',question:'Pourquoi écrit-on elles sont arrivées avec es ?',steps:[
  {exampleFr:'La fille est arrivée. Les filles sont arrivées.',explanationFr:'Les filles est à la fois féminin et pluriel. Arrivées porte les deux marques : e pour le féminin et s pour le pluriel.'},
  {exampleFr:'Les filles sont arrivées.',explanationFr:'Arrivées est le participe passé du verbe arriver. Sont vient de être et sert ici à exprimer le passé. Le participe s’accorde avec le sujet les filles.'},
  {exampleFr:'Les filles sont restées près du portail.',explanationFr:'Le portail est masculin singulier, mais le sujet est les filles. Restées prend donc es : il faut vérifier le genre et le nombre ensemble.'},
 ],takeaway:'Avec être, cherche le sujet puis vérifie deux choses : féminin ou masculin, singulier ou pluriel. Ici, le féminin pluriel demande es.',subject:'Les randonneuses',auxiliary:'sont',suffix:'es',reason:'« Les randonneuses » est un sujet féminin pluriel.'},
};
const guided=[['arrivé','au refuge'],['resté','à l’abri'],['tombé','dans la neige'],['entré','dans la cabane'],['retourné','au village'],['monté','sur le sentier']] as const;
export const ETRE_PARTICIPLE_AGREEMENT_TEACHING:readonly TargetTeachingContent[]=Object.entries(definitions).map(([construction,d])=>{
 const practice=guided.map(([base,ending],index)=>{
  const answer=base+d.suffix,sentence=`${d.subject} ${d.auxiliary} ___ ${ending}.`;
  return {id:`etre-agreement-guided:${construction}:${index}`,promptFr:`Le participe au masculin singulier est « ${base} ». Complète : ${sentence}`,answerFr:answer,hintFr:'Qui fait l’action ? Vérifie le genre et le nombre de ce sujet.',explanationFr:`${d.reason} Avec être, on écrit ${answer} : ${sentence.replace('___',answer)}`};
 });
 const lesson:TargetTeachingContent={id:`french-v3-teaching:etre-participle-agreement:${construction}`,nodeKey,facetKey:`${nodeKey}::construction:${construction}`,mode:'production',status:'draft_requires_review',titleFr:d.title,learnerQuestionFr:d.question,steps:d.steps,takeawayFr:d.takeaway,boundaryFr,practice};
 return {...lesson,materialExposure:{sentences:[...lesson.steps.flatMap(step=>[step.exampleFr,step.explanationFr]),lesson.takeawayFr,lesson.boundaryFr,...practice.flatMap(exercise=>[exercise.promptFr,exercise.answerFr,exercise.hintFr,exercise.explanationFr])]}};
});
