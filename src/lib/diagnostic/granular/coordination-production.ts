import type {TargetTeachingContent} from './teaching-content';
type Link='et'|'mais'|'ou'|'car';
export interface CoordinationCombination {first:string;second:string;link:Link;relation:string}
const row=(first:string,second:string,link:Link,relation:string):CoordinationCombination=>({first,second,link,relation});
export const COORDINATION_PRODUCTION_ASSESSMENT:readonly CoordinationCombination[]=[
 row('Le club prépare une exposition.','Il organise une rencontre.','et','Ajoute une deuxième activité à la première.'),
 row('Je range les outils.','Tu nettoies la table.','et','Présente les deux actions comme une addition.'),
 row('Les musiciens répètent.','Les danseurs s’échauffent.','et','Ajoute la deuxième action à la première.'),
 row('Le sentier est raide.','Nous continuons la montée.','mais','Marque une opposition entre la difficulté et notre décision.'),
 row('Le sac semble petit.','Il contient tout le matériel.','mais','Marque une opposition entre l’apparence du sac et ce qu’il contient.'),
 row('Je connais cette règle.','Je fais encore des erreurs.','mais','Marque une opposition entre mes connaissances et mes erreurs.'),
 row('Tu dessines l’affiche.','Tu rédiges le texte.','ou','Présente un choix entre deux tâches : une seule sera retenue.'),
 row('Nous prenons le train.','Nous voyageons en car.','ou','Présente deux possibilités de transport au choix.'),
 row('Vous jouez dehors.','Vous restez dans la salle.','ou','Présente un choix entre deux activités possibles.'),
 row('Je ferme les rideaux.','La lumière gêne la projection.','car','Donne dans la deuxième proposition la raison de la première action.'),
 row('Nous reportons la sortie.','Le pont est impraticable.','car','Donne dans la deuxième proposition la raison du report.'),
 row('Tu parles doucement.','Le bébé dort.','car','Donne dans la deuxième proposition la raison de parler doucement.'),
];
export const coordinationSentence=(r:CoordinationCombination,link:Link=r.link)=>`${r.first.slice(0,-1)} ${link} ${r.second[0].toLocaleLowerCase('fr')}${r.second.slice(1)}`;
export const coordinationPrompt=(r:CoordinationCombination)=>`${r.relation}\nRéunis les deux phrases en une seule avec « et », « mais », « ou » ou « car ». Garde les mots dans leur ordre. Remplace le premier point par le mot choisi et commence la deuxième proposition par une minuscule. Pour cet exercice, n’ajoute pas de virgule.\n\n${r.first}\n${r.second}`;
const guided:readonly CoordinationCombination[]=[
 row('Je prépare la soupe.','Mon frère coupe le pain.','et','Ajoute la deuxième action à la première.'),
 row('La valise est lourde.','Elle roule facilement.','mais','Marque une opposition entre son poids et la facilité de la déplacer.'),
 row('Tu lis une bande dessinée.','Tu écoutes une histoire.','ou','Propose deux occupations au choix.'),
 row('Nous allumons une lampe.','La pièce est sombre.','car','Donne dans la deuxième proposition la raison d’allumer une lampe.'),
];
export const COORDINATION_PRODUCTION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:coordination:production',nodeKey:'construction_coordination',mode:'production',status:'draft_requires_review',titleFr:'Relier deux propositions dans une phrase',learnerQuestionFr:'Quel mot traduit le lien que tu veux exprimer ?',
 steps:[
 {exampleFr:'Le groupe chante. Le public applaudit. → Le groupe chante et le public applaudit.',explanationFr:'Et ajoute une action à une autre. On garde les deux propositions, chacune avec son verbe conjugué, et on remplace le premier point par et.'},
 {exampleFr:'Il pleut. Nous sortons. → Il pleut mais nous sortons.',explanationFr:'Mais marque ici une opposition : la pluie pourrait nous retenir, pourtant nous sortons. Le mot choisi indique au lecteur le lien entre les deux idées.'},
 {exampleFr:'Tu viens à pied ou tu prends le tram. Nous attendons car le passage est bloqué.',explanationFr:'Ou présente ici deux possibilités au choix. Car introduit la raison de ce qui précède : le passage bloqué explique notre attente. Ne choisis pas seulement un mot qui rend la phrase grammaticale : vérifie le sens demandé.'},
 ],practice:guided.map((g,i)=>({id:`coordination-production-guided-${i+1}`,promptFr:coordinationPrompt(g),answerFr:coordinationSentence(g),hintFr:g.relation,explanationFr:`${coordinationSentence(g)} Le lien demandé est exprimé par « ${g.link} ».`})),
 takeawayFr:'Choisis le lien : addition avec et, opposition avec mais, choix avec ou, raison avec car. Garde les deux propositions et relis la phrase.',boundaryFr:'Tu combines ici des phrases données avec un sens demandé. D’autres liens et d’autres formulations existent. Cette tâche ne mesure pas encore ta capacité à organiser seul un texte.',materialExposure:{sentences:[...guided.flatMap(g=>[g.first,g.second,coordinationSentence(g)]),'Le groupe chante.','Le public applaudit.','Le groupe chante et le public applaudit.','Il pleut.','Nous sortons.','Il pleut mais nous sortons.','Tu viens à pied ou tu prends le tram.','Nous attendons car le passage est bloqué.']},
}];
