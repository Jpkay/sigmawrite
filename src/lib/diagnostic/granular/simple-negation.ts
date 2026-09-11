import type {TargetTeachingContent} from './teaching-content';
export const SIMPLE_NEGATION_DRAFTS:readonly [string,string][]=[
 ['Le train arrive à midi.','Le train n’arrive pas à midi.'],
 ['Nous regardons le match.','Nous ne regardons pas le match.'],
 ['Tu connais cette chanson.','Tu ne connais pas cette chanson.'],
 ['Elle ouvre la fenêtre.','Elle n’ouvre pas la fenêtre.'],
 ['Les élèves comprennent la consigne.','Les élèves ne comprennent pas la consigne.'],
 ['Vous aimez ce dessin.','Vous n’aimez pas ce dessin.'],
 ['Je termine mon exposé.','Je ne termine pas mon exposé.'],
 ['Le chat dort sur le fauteuil.','Le chat ne dort pas sur le fauteuil.'],
 ['Nous avons reçu le message.','Nous n’avons pas reçu le message.'],
 ['Elle est venue ce matin.','Elle n’est pas venue ce matin.'],
 ['Tu lui réponds.','Tu ne lui réponds pas.'],
 ['Ils se préparent dans le vestiaire.','Ils ne se préparent pas dans le vestiaire.'],
 ['La porte reste ouverte.','La porte ne reste pas ouverte.'],
 ['Vous pouvez entrer.','Vous ne pouvez pas entrer.'],
 ['Je les retrouve au parc.','Je ne les retrouve pas au parc.'],
 ['Le spectacle commence maintenant.','Le spectacle ne commence pas maintenant.'],
];
const guided:readonly [string,string,string][]=[
 ['Sami joue dehors.','Sami ne joue pas dehors.','Place ne avant joue et pas après joue.'],
 ['La lampe éclaire la pièce.','La lampe n’éclaire pas la pièce.','Devant éclaire, ne devient n’. Pas reste après le verbe.'],
 ['Nora a rangé son sac.','Nora n’a pas rangé son sac.','Encadre a, la partie conjuguée du verbe : n’a pas rangé.'],
 ['Nous le cherchons.','Nous ne le cherchons pas.','Ne se place avant le pronom le ; pas suit cherchons.'],
];
export const SIMPLE_NEGATION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:simple-negation:production',nodeKey:'construction_negation_simple',mode:'production',status:'draft_requires_review',titleFr:'Écrire une phrase avec ne…pas',learnerQuestionFr:'Comment dire par écrit qu’une action n’a pas lieu ?',
 steps:[
 {exampleFr:'Mina chante. → Mina ne chante pas.',explanationFr:'La seconde phrase dit que Mina ne fait pas cette action. Ne et pas entourent chante, le verbe conjugué. Cette construction s’appelle une négation.'},
 {exampleFr:'Mina écoute. → Mina n’écoute pas.',explanationFr:'Devant une voyelle, ne devient n’. On garde pas après le verbe. À l’écrit soigné, on conserve les deux parties, même si ne disparaît souvent à l’oral.'},
 {exampleFr:'Mina a dansé. → Mina n’a pas dansé.\nMina veut danser. → Mina ne veut pas danser.',explanationFr:'Repère la partie conjuguée : a dans le premier exemple, veut dans le second. Pas se place après cette partie, avant dansé ou danser.'},
 {exampleFr:'Mina se repose. → Mina ne se repose pas.\nMina lui parle. → Mina ne lui parle pas.',explanationFr:'Quand un pronom comme se ou lui précède le verbe, place ne avant ce pronom. Pas reste après le verbe conjugué.'},
 ],practice:guided.map(([source,answer,why],i)=>({id:`guided:simple-negation:${i+1}`,promptFr:`Transforme avec ne…pas. Garde les autres mots : ${source}`,answerFr:answer,hintFr:'Repère le verbe conjugué et place les deux parties de la négation.',explanationFr:why})),
 takeawayFr:'Place ne ou n’ avant le verbe et ses pronoms, puis pas après la partie conjuguée.',boundaryFr:'Ces phrases gardent leurs autres mots. Cette leçon ne couvre pas le changement un/des en de, ni jamais, rien, personne ou la portée de négations complexes.',materialExposure:{sentences:['Mina chante.','Mina ne chante pas.','Mina écoute.','Mina n’écoute pas.','Mina a dansé.','Mina n’a pas dansé.','Mina veut danser.','Mina ne veut pas danser.','Mina se repose.','Mina ne se repose pas.','Mina lui parle.','Mina ne lui parle pas.',...guided.flatMap(([source,answer])=>[source,answer])]},
}];
