import type {TargetTeachingContent} from './teaching-content';
import type {AvoirAgreementCase} from './avoir-participle-agreement-drafts';
const nodeKey='accorder_participe_avoir_cod';
type Exercise=readonly [sentence:string,base:string,answer:string,explanation:string];
const exercises:Record<AvoirAgreementCase,readonly Exercise[]>={
 preceding:[
  ['La chanson que Tom a ___ parle de son quartier.','chanté','chantée','Tom a chanté quoi ? La chanson. Le COD féminin singulier est avant le participe : chantée.'],
  ['Ces dessins, Inès les a ___ à ses amis.','montré','montrés','Les reprend ces dessins, masculin pluriel. Ce COD est avant a montré : montrés.'],
  ['Quelles invitations Nora a-t-elle ___ ?','envoyé','envoyées','Le COD quelles invitations est féminin pluriel et placé avant : envoyées.'],
  ['Le vélo que les filles ont ___ est rouge.','réparé','réparé','Le COD le vélo est masculin singulier : réparé. On n’accorde pas avec les filles.'],
  ['Cette fenêtre, Rayan l’a ___ avant de partir.','fermé','fermée','L’ reprend cette fenêtre, féminin singulier. Le COD précède le participe : fermée.'],
  ['Les documents que Zoé a ___ sont sur le bureau.','imprimé','imprimés','Le COD les documents est masculin pluriel et placé avant : imprimés.'],
 ],
 following:[
  ['Les chanteuses ont ___ une mélodie.','inventé','inventé','Une mélodie est le COD, mais il vient après le participe : inventé.'],
  ['La dessinatrice a ___ ses crayons.','ramassé','ramassé','Le groupe « ses crayons » est le COD placé après : ramassé. Le pluriel du COD ne suffit pas à déclencher l’accord.'],
  ['Les garçons ont ___ les invitations.','envoyé','envoyé','Le COD les invitations vient après : envoyé reste sans marque de féminin ou de pluriel.'],
  ['Les filles ont ___ un vélo.','réparé','réparé','Le COD un vélo vient après le participe. Réparé ne s’accorde pas avec les filles.'],
  ['La voisine a ___ les volets.','fermé','fermé','Le COD les volets vient après : fermé.'],
  ['Les élèves ont ___ plusieurs pages.','imprimé','imprimé','Le COD plusieurs pages vient après : imprimé.'],
 ],
 absent:[
  ['Les danseuses ont ___ toute la soirée.','bavardé','bavardé','Toute la soirée indique une durée, pas un COD. Avec avoir, bavardé reste sans accord.'],
  ['Les filles ont ___ à leurs amis.','écrit','écrit','À leurs amis désigne les destinataires, avec la préposition à. Aucun COD n’est exprimé : écrit.'],
  ['Les enfants ont ___ de la plaisanterie.','ri','ri','De la plaisanterie indique de quoi les enfants ont ri. Ce n’est pas un COD : ri.'],
  ['Les voisines ont ___ sur le banc.','discuté','discuté','Sur le banc indique un lieu. Il n’y a pas de COD : discuté.'],
  ['Les musiciennes ont ___ pendant une heure.','répété','répété','Pendant une heure indique une durée. Aucun COD n’est exprimé : répété.'],
  ['Les joueuses ont ___ après le match.','souri','souri','Après le match indique un moment. Il n’y a pas de COD : souri.'],
 ],
};
const definitions:Record<AvoirAgreementCase,{title:string;question:string;steps:TargetTeachingContent['steps'];takeaway:string}>={
 preceding:{title:'Accorder avec ce qui est placé avant le verbe',question:'Pourquoi écrit-on les photos que j’ai regardées ?',steps:[
  {exampleFr:'J’ai regardé les photos. Les photos que j’ai regardées sont nettes.',explanationFr:'Dans les deux phrases, j’ai regardé quoi ? Les photos. Dans la deuxième, ce groupe est placé avant le participe regardées : on ajoute es, car photos est féminin pluriel.'},
  {exampleFr:'Ces photos, je les ai regardées.',explanationFr:'Les reprend ces photos. C’est le complément d’objet direct, ou COD : il complète le verbe sans préposition. Ici, il est placé avant le verbe. On accorde donc le participe passé avec les photos.'},
  {exampleFr:'Le portrait que les filles ont peint.',explanationFr:'Le sujet les filles est féminin pluriel, mais le COD le portrait est masculin singulier. Avec avoir, on regarde le COD placé avant, pas le sujet : peint.'},
 ],takeaway:'Avec avoir, si le COD est placé avant le participe passé, accorde avec ce COD en genre et en nombre.'},
 following:{title:'Garder le participe sans accord quand le COD vient après',question:'Pourquoi écrit-on elles ont décoré les salles sans ajouter es ?',steps:[
  {exampleFr:'Les filles ont décoré les salles.',explanationFr:'Elles ont décoré quoi ? Les salles. Ce groupe vient après décoré. Le participe reste décoré, même si les salles et les filles sont au pluriel.'},
  {exampleFr:'Les filles ont décoré quoi ? Les salles.',explanationFr:'Le groupe « les salles » est le complément d’objet direct, ou COD. Avec avoir, un COD placé après le participe ne commande pas son accord.'},
  {exampleFr:'Elles ont décoré les salles. Les salles qu’elles ont décorées.',explanationFr:'Dans la première phrase, le COD vient après : décoré. Dans la deuxième, le COD vient avant : décorées. La place du COD change la décision.'},
 ],takeaway:'Repère le COD et sa place. S’il vient après le participe employé avec avoir, garde la forme sans accord.'},
 absent:{title:'Garder le participe sans accord quand il n’y a pas de COD',question:'Pourquoi écrit-on elles ont dormi sans ajouter es ?',steps:[
  {exampleFr:'Les filles ont dormi dans le train.',explanationFr:'Dans le train indique un lieu. On ne trouve pas de COD dans cette phrase. Le participe reste dormi : il ne s’accorde pas avec les filles.'},
  {exampleFr:'Elles ont parlé à leur amie.',explanationFr:'À leur amie est un complément introduit par à. Ce n’est pas un complément d’objet direct. Il ne commande pas l’accord du participe parlé.'},
  {exampleFr:'Elles ont dansé pendant la fête.',explanationFr:'Pendant la fête indique un moment. Tous les groupes placés après un verbe ne sont pas des COD. Sans COD, le participe employé avec avoir reste ici dans sa forme sans accord.'},
 ],takeaway:'Ne confonds pas COD, lieu, moment ou complément avec une préposition. Sans COD, pas d’accord du participe avec le sujet après avoir.'},
};
export const AVOIR_PARTICIPLE_AGREEMENT_TEACHING:readonly TargetTeachingContent[]=(Object.keys(definitions) as AvoirAgreementCase[]).map(construction=>{
 const definition=definitions[construction];
 return {id:`french-v3-teaching:avoir-participle-agreement:${construction}`,nodeKey,facetKey:`${nodeKey}::construction:${construction}`,mode:'production',status:'draft_requires_review',titleFr:definition.title,learnerQuestionFr:definition.question,steps:definition.steps,takeawayFr:definition.takeaway,boundaryFr:'Cette leçon porte sur le participe employé avec avoir, sans verbe pronominal ni participe suivi d’un infinitif. La forme de départ est fournie : on travaille l’accord, pas la mémorisation de cette forme.',practice:exercises[construction].map(([sentence,base,answer,explanation],index)=>({id:`avoir-agreement-${construction}-${index}`,promptFr:`Forme au masculin singulier : ${base}.\n\n${sentence}\n\nÉcris seulement le participe passé manquant.`,answerFr:answer,hintFr:'Repère avoir. Cherche un COD et sa place avant de choisir la forme du participe.',explanationFr:explanation})),materialExposure:{sentences:[...definition.steps.map(step=>step.exampleFr),...exercises[construction].map(row=>row[0])]}};
});
