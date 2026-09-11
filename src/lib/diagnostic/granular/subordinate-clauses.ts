import type {TargetTeachingContent} from './teaching-content';
export type ClauseKind='completive'|'circonstancielle';
export interface ClauseExample {sentence:string;clause:string|null;relation:string;explanation:string}
const c=(sentence:string,clause:string,verb:string):ClauseExample=>({sentence,clause,relation:`complète le verbe « ${verb} »`,explanation:`${clause} indique ce qui est dit, pensé, perçu ou attendu avec le verbe ${verb}. Que ne reprend pas un nom.`});
const a=(sentence:string,clause:string,relation:string):ClauseExample=>({sentence,clause,relation:`exprime ${relation}`,explanation:`Le groupe ${clause} contient un verbe conjugué et exprime ${relation} par rapport à l’autre partie de la phrase.`});
const n=(sentence:string,explanation:string):ClauseExample=>({sentence,clause:null,relation:'',explanation});
export const SUBORDINATE_ASSESSMENT:Record<ClauseKind,readonly ClauseExample[]>={
 completive:[
  c('Le gardien annonce que la piscine ferme.','que la piscine ferme','annonce'),
  c('Je pense que cette solution convient.','que cette solution convient','pense'),
  c('Nous voyons que le niveau de l’eau monte.','que le niveau de l’eau monte','voyons'),
  n('Le film que vous regardez dure une heure.','Que vous regardez reprend le nom film : c’est une relative.'),
  c('Tu crois que le colis arrivera demain.','que le colis arrivera demain','crois'),
  c('La guide explique que le sentier est fermé.','que le sentier est fermé','explique'),
  c('Les joueurs savent que la finale approche.','que la finale approche','savent'),
  n('Nous courons parce que le bus arrive.','Parce que le bus arrive donne la cause de la course.'),
  c('Elle remarque que la fenêtre est ouverte.','que la fenêtre est ouverte','remarque'),
  c('Le médecin affirme que la blessure guérit.','que la blessure guérit','affirme'),
  c('J’espère que votre voyage se passera bien.','que votre voyage se passera bien','espère'),
  n('Que dessines-tu sur cette feuille ?','Que introduit ici une question directe ; aucune proposition ne complète un autre verbe.'),
  c('Vous constatez que la peinture sèche vite.','que la peinture sèche vite','constatez'),
  c('Ma sœur souhaite que nous restions.','que nous restions','souhaite'),
  c('Le voisin raconte que son chat a disparu.','que son chat a disparu','raconte'),
  n('Le train partira lorsque le signal changera.','Lorsque le signal changera indique le moment du départ.'),
 ],
 circonstancielle:[
  a('Quand la sonnerie retentit, les élèves sortent.','Quand la sonnerie retentit','le temps'),
  a('Je ferme les volets parce que le soleil m’éblouit.','parce que le soleil m’éblouit','la cause'),
  a('Nous parlons doucement pour que le bébé dorme.','pour que le bébé dorme','le but'),
  n('Le professeur pense que nous réussirons.','Que nous réussirons complète le verbe pense : c’est une complétive.'),
  a('Si le vent se lève, nous rangerons la voile.','Si le vent se lève','une condition'),
  a('Bien que la route soit longue, ils continuent.','Bien que la route soit longue','une concession'),
  a('Nous attendrons ici jusqu’à ce que le taxi arrive.','jusqu’à ce que le taxi arrive','le temps'),
  n('La maison où vivent mes cousins est ancienne.','Où vivent mes cousins précise le nom maison : c’est une relative.'),
  a('Puisque le magasin est fermé, nous reviendrons demain.','Puisque le magasin est fermé','la cause'),
  a('Elle note l’adresse afin que personne ne l’oublie.','afin que personne ne l’oublie','le but'),
  a('Nous pique-niquerons si le ciel reste dégagé.','si le ciel reste dégagé','une condition'),
  n('Il court malgré la fatigue.','Malgré la fatigue exprime une concession, mais ne contient aucun verbe conjugué : ce n’est pas une proposition.'),
  a('Quoique le sac soit lourd, Inès le porte seule.','Quoique le sac soit lourd','une concession'),
  a('Pendant que tu prépares la pâte, je coupe les fruits.','Pendant que tu prépares la pâte','le temps'),
  a('Les spectateurs applaudissent parce que le concert leur plaît.','parce que le concert leur plaît','la cause'),
  n('Je me demande si le musée est ouvert.','Si le musée est ouvert exprime une question indirecte, pas une condition.'),
  a('Il met une étiquette pour que nous reconnaissions sa boîte.','pour que nous reconnaissions sa boîte','le but'),
  a('Si tu termines tôt, rejoins-nous au jardin.','Si tu termines tôt','une condition'),
  a('Même si elle est débutante, elle joue avec assurance.','Même si elle est débutante','une concession'),
  n('Le chemin que nous suivons traverse un bois.','Que nous suivons précise le nom chemin : c’est une relative.'),
 ],
};
const guided:Record<ClauseKind,readonly ClauseExample[]>={
 completive:[
  c('Léo dit que son vélo est réparé.','que son vélo est réparé','dit'),
  c('Je comprends que tu sois déçu.','que tu sois déçu','comprends'),
  c('Nous constatons que la neige fond.','que la neige fond','constatons'),
  c('La cheffe souhaite que chacun participe.','que chacun participe','souhaite'),
  n('Le gâteau que tu découpes sent bon.','Que tu découpes précise gâteau : c’est une relative.'),
  n('Je souris parce que je suis content.','Parce que je suis content exprime la cause du sourire.'),
 ],
 circonstancielle:[
  a('Lorsque la musique commence, nous dansons.','Lorsque la musique commence','le temps'),
  a('Il prend un manteau parce qu’il fait froid.','parce qu’il fait froid','la cause'),
  a('Je laisse un mot pour que tu me retrouves.','pour que tu me retrouves','le but'),
  a('Si la clé fonctionne, nous entrerons.','Si la clé fonctionne','une condition'),
  a('Bien qu’elle soit fatiguée, elle termine son dessin.','Bien qu’elle soit fatiguée','une concession'),
  n('Elle sait que le magasin ouvre bientôt.','Que le magasin ouvre bientôt complète sait, sans exprimer une circonstance.'),
  n('Nous restons à l’abri pendant l’orage.','Pendant l’orage indique un moment mais ne contient aucun verbe conjugué.'),
 ],
};
export function clauseChoices(kind:ClauseKind,row:ClauseExample){
 const absent=`Cette phrase ne contient pas de proposition subordonnée ${kind==='completive'?'complétive':'circonstancielle'}.`;
 const answer=row.clause?`« ${row.clause} » ${row.relation}.`:absent;
 return {answer,choices:row.clause?[answer,absent,'La phrase entière est une seule proposition subordonnée.','Ce groupe est une relative qui précise un nom.']:[answer,'La phrase entière est la proposition subordonnée recherchée.','Tout groupe de mots contenant que convient.','Un groupe sans verbe conjugué suffit toujours.']};
}
const definitions:Record<ClauseKind,Pick<TargetTeachingContent,'titleFr'|'learnerQuestionFr'|'steps'|'takeawayFr'|'boundaryFr'>>={
 completive:{titleFr:'Repérer une proposition complétive',learnerQuestionFr:'Dans « Nora dit que le repas est prêt », quels mots donnent le contenu de ce que Nora dit ?',steps:[
  {exampleFr:'Nora dit que le repas est prêt.',explanationFr:'Que le repas est prêt donne le contenu de ce que Nora dit. Ce groupe contient son propre verbe, est, et complète le verbe dit. C’est une proposition subordonnée complétive.'},
  {exampleFr:'Je crois que tu as raison.\nJe souhaite que tu viennes.',explanationFr:'Une complétive peut suivre une pensée ou un souhait. La forme du verbe peut varier, mais le lien reste le même : le groupe complète ici crois ou souhaite.'},
  {exampleFr:'Le repas que Nora prépare est prêt.',explanationFr:'Que Nora prépare précise le nom repas et le reprend. C’est une relative. Pour distinguer les deux constructions, cherche ce que le groupe complète : un verbe dans nos exemples de complétives, ou un nom repris dans la relative.'},
 ],takeawayFr:'Repère le groupe avec son verbe conjugué. Dans les exemples étudiés, il donne le contenu d’une parole, d’une pensée, d’une perception ou d’un souhait, sans reprendre un nom.',boundaryFr:'Cette leçon porte sur les complétives introduites par que après un verbe. Il existe d’autres constructions complétives. Les reconnaître ici ne prouve pas encore que tu sais en construire une.'},
 circonstancielle:{titleFr:'Repérer une proposition circonstancielle',learnerQuestionFr:'Dans « Nous rentrons parce que la nuit tombe », quels mots donnent la raison du retour ?',steps:[
  {exampleFr:'Nous rentrons parce que la nuit tombe.',explanationFr:'Parce que la nuit tombe donne la raison du retour. Ce groupe a un verbe conjugué, tombe, et exprime une circonstance : c’est une proposition subordonnée circonstancielle.'},
  {exampleFr:'Quand le feu passe au vert, nous avançons.\nNous ralentissons pour que chacun puisse suivre.',explanationFr:'Quand indique ici le moment. Pour que indique le but, ce que l’on cherche à obtenir. Le mot qui introduit le groupe et le sens de la phrase aident à reconnaître la relation.'},
  {exampleFr:'Si le temps le permet, nous sortirons.\nBien que le temps soit mauvais, nous sortons.',explanationFr:'Si pose ici une condition : la sortie dépend du temps. Bien que présente un obstacle qui n’empêche pas la sortie. Cette relation s’appelle une concession.'},
  {exampleFr:'Nous partons après le repas.\nJe sais que tu pars.\nJe demande si tu pars.',explanationFr:'Après le repas indique un moment, mais n’a pas de verbe conjugué. Que tu pars donne le contenu de ce que je sais. Si tu pars donne le contenu d’une question indirecte. Aucune de ces phrases ne contient la circonstancielle étudiée.'},
 ],takeawayFr:'Cherche un groupe avec son propre verbe qui exprime un moment, une cause, un but, une condition ou une concession. Vérifie le sens : un mot comme si ne suffit pas.',boundaryFr:'Cette leçon couvre cinq relations fréquentes avec des verbes conjugués. Elle ne couvre pas toutes les constructions circonstancielles et ne suffit pas à prouver que tu sais les écrire.'},
};
export const SUBORDINATE_TEACHING:readonly TargetTeachingContent[]=(['completive','circonstancielle'] as const).map(kind=>{
 const definition=definitions[kind];
 return {id:`french-v3-teaching:subordinate:${kind}`,nodeKey:`construction_subordonnee_${kind}`,mode:'recognition',status:'draft_requires_review',...definition,
 practice:guided[kind].map((row,index)=>{const {answer,choices}=clauseChoices(kind,row);return {id:`guided:${kind}:${index+1}`,promptFr:`${row.sentence}\n\nQuelle analyse est correcte ?`,choices,answerFr:answer,hintFr:kind==='completive'?'Cherche ce que le groupe complète : un verbe ou un nom repris ?':'Vérifie la présence d’un verbe, puis le sens du lien entre les deux parties.',explanationFr:row.explanation};}),
 materialExposure:{sentences:[...definition.steps.flatMap(step=>step.exampleFr.split('\n')),...guided[kind].map(row=>row.sentence)]},
 };
});
