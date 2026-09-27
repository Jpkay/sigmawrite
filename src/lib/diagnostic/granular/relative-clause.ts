import type {TargetTeachingContent} from './teaching-content';

export interface RelativeExample {sentence:string; clause:string|null; noun?:string; contrast?:string}
export const RELATIVE_ASSESSMENT:readonly RelativeExample[]=[
 {sentence:'Le vélo qui bloque le passage appartient à Sami.',clause:'qui bloque le passage',noun:'vélo'},
 {sentence:'La recette que tu proposes semble facile.',clause:'que tu proposes',noun:'recette'},
 {sentence:'Le gymnase où nous jouons ferme à dix-huit heures.',clause:'où nous jouons',noun:'gymnase'},
 {sentence:'Je pense que le match commence bientôt.',clause:null,contrast:'que le match commence bientôt complète pense, sans reprendre un nom.'},
 {sentence:'Le roman dont tu parles est disponible.',clause:'dont tu parles',noun:'roman'},
 {sentence:'Les élèves qui attendent dehors entrent maintenant.',clause:'qui attendent dehors',noun:'élèves'},
 {sentence:'Le manteau que Lina porte est imperméable.',clause:'que Lina porte',noun:'manteau'},
 {sentence:'Nous rentrerons quand la pluie cessera.',clause:null,contrast:'quand la pluie cessera indique le moment du retour, sans compléter un nom.'},
 {sentence:'Le parc où mon frère court longe la rivière.',clause:'où mon frère court',noun:'parc'},
 {sentence:'La chanteuse dont je connais les chansons arrive.',clause:'dont je connais les chansons',noun:'chanteuse'},
 {sentence:'Le chien qui dort sous la table ne nous entend pas.',clause:'qui dort sous la table',noun:'chien'},
 {sentence:'Que préfères-tu pour le goûter ?',clause:null,contrast:'Que sert ici à poser une question et ne reprend aucun nom.'},
 {sentence:'Les affiches que nous avons dessinées sèchent.',clause:'que nous avons dessinées',noun:'affiches'},
 {sentence:'Le village où ma tante habite organise une fête.',clause:'où ma tante habite',noun:'village'},
 {sentence:'Le joueur dont le maillot est rouge avance.',clause:'dont le maillot est rouge',noun:'joueur'},
 {sentence:'La porte reste ouverte parce que le couloir est chaud.',clause:null,contrast:'parce que le couloir est chaud indique une cause et ne complète pas un nom.'},
];
const guided:readonly RelativeExample[]=[
 {sentence:'La voisine qui cultive des tomates nous salue.',clause:'qui cultive des tomates',noun:'voisine'},
 {sentence:'Le dessin que Noé termine représente un dragon.',clause:'que Noé termine',noun:'dessin'},
 {sentence:'La salle où nous répétons est lumineuse.',clause:'où nous répétons',noun:'salle'},
 {sentence:'Le livre dont la couverture est bleue est à moi.',clause:'dont la couverture est bleue',noun:'livre'},
 {sentence:'Maya croit que son équipe gagnera.',clause:null,contrast:'que son équipe gagnera complète le verbe croit, sans reprendre un nom.'},
 {sentence:'Nous partons lorsque la cloche sonne.',clause:null,contrast:'lorsque la cloche sonne indique quand nous partons, sans compléter un nom.'},
];
export function relativeChoices(row:RelativeExample){
 const answer=row.clause?`« ${row.clause} » complète le nom « ${row.noun} ».`:'Cette phrase ne contient pas de proposition relative.';
 return {answer,choices:row.clause?[answer,'Cette phrase ne contient pas de proposition relative.',`« ${row.noun} » forme à lui seul la proposition relative.`,'La phrase entière forme une seule proposition relative.']:[answer,'La phrase entière est une proposition relative.','Tout groupe introduit par que, quand ou lorsque est une relative.','La présence d’un verbe suffit pour reconnaître une relative.']};
}
export const RELATIVE_CLAUSE_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:relative-clause:recognition',nodeKey:'construction_subordonnee_relative',mode:'recognition',status:'draft_requires_review',
 titleFr:'Repérer une proposition relative',learnerQuestionFr:'Dans « Le chat qui joue est petit », quels mots précisent de quel chat on parle ?',
 steps:[
  {exampleFr:'Le chat qui joue est petit.',explanationFr:'Qui joue ajoute une précision sur le chat. Ce groupe contient un verbe conjugué et dépend du nom chat : c’est une proposition subordonnée relative. Le nom qu’elle précise s’appelle son antécédent.'},
  {exampleFr:'Le bracelet que Zoé fabrique est coloré.',explanationFr:'Que Zoé fabrique précise le nom bracelet. Que reprend ce nom et introduit la relative : c’est un pronom relatif. Repère tout le groupe, pas seulement que.'},
  {exampleFr:'La cour où nous discutons est calme.\nLe sac dont la fermeture est cassée est vide.',explanationFr:'Où et dont peuvent aussi introduire une relative. Ici, où reprend cour ; dont relie la fermeture au sac. Cherche toujours le nom précisé et le verbe du groupe.'},
  {exampleFr:'Je sais que tu viendras.',explanationFr:'Que tu viendras complète le verbe sais. Aucun nom n’est repris : ce groupe n’est pas une relative. Voir le mot que ne suffit donc pas.'},
 ],
 takeawayFr:'Cherche un groupe avec un verbe, introduit par un pronom relatif et rattaché à un nom qu’il précise. Vérifie ce lien avant de décider.',
 boundaryFr:'Cette leçon concerne les relatives avec un nom exprimé et les pronoms qui, que, où et dont. Les relatives sans antécédent exprimé et celles avec lequel demandent un travail supplémentaire. Repérer une relative ne prouve pas encore que tu sais en écrire une.',
 practice:guided.map((row,index)=>{const {answer,choices}=relativeChoices(row);return {id:`guided:relative-clause:${index+1}`,promptFr:`${row.sentence}\n\nQuelle analyse est correcte ?`,choices,answerFr:answer,hintFr:'Cherche le nom que le groupe précise. S’il complète un verbe ou indique seulement un moment, ce n’est pas une relative.',explanationFr:row.clause?`Le groupe ${row.clause} précise ${row.noun}. Il contient un verbe conjugué et est introduit par un pronom relatif.`:row.contrast!};}),
 materialExposure:{sentences:['Le chat qui joue est petit.','Le bracelet que Zoé fabrique est coloré.','La cour où nous discutons est calme.','Le sac dont la fermeture est cassée est vide.','Je sais que tu viendras.',...guided.map(row=>row.sentence)]},
}];
