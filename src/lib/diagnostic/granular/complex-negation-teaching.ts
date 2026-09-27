import type {TargetTeachingContent} from './teaching-content';
import {COMPLEX_NEGATION_MEANINGS,complexNegationChoices,type ComplexNegationFeature} from './complex-negation';
const guides:readonly {feature:ComplexNegationFeature;sentence:string;why:string}[]=[
 {feature:'plus',sentence:'Depuis lundi, Léo ne mange plus à la cantine.',why:'Il y mangeait avant, mais cette situation a cessé. Ne…plus ne veut pas dire qu’il n’y a jamais mangé.'},
 {feature:'jamais',sentence:'Pendant ce séjour, Aya n’a jamais utilisé son téléphone.',why:'Elle ne l’a utilisé à aucun moment de ce séjour. La phrase ne dit pas qu’elle ne l’a jamais utilisé de toute sa vie.'},
 {feature:'rien',sentence:'Nous n’avons rien déplacé dans la chambre.',why:'Aucune chose n’a été déplacée par nous. La chambre peut contenir des objets : rien porte ici sur ce qui a été déplacé.'},
 {feature:'personne',sentence:'Je n’ai appelé personne cet après-midi.',why:'Aucune personne n’a reçu d’appel de ma part cet après-midi. Cela ne veut pas dire que je ne connais personne.'},
 {feature:'guere',sentence:'Cette petite lampe n’éclaire guère le couloir.',why:'Elle éclaire peu le couloir. Ne…guère, plus fréquent à l’écrit, ne signifie pas forcément une absence totale de lumière.'},
 {feature:'simple',sentence:'La fenêtre n’est pas ouverte.',why:'N’…pas nie simplement le fait que la fenêtre soit ouverte. La phrase n’indique pas qu’elle ne l’est jamais ou qu’elle a cessé de l’être.'},
 {feature:'restriction',sentence:'Yara ne collectionne que les cartes de cette série.',why:'Ici, ne…que signifie seulement : elle collectionne les cartes de cette série. Ce n’est pas une absence de cartes collectionnées.'},
];
export const COMPLEX_NEGATION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:complex-negation:recognition',nodeKey:'construction_negation_complexe',mode:'recognition',status:'draft_requires_review',titleFr:'Comprendre plus, jamais, rien, personne et guère dans une négation',learnerQuestionFr:'Ces phrases sont négatives, mais est-ce qu’elles disent la même chose ?',
 steps:[
  {exampleFr:'Le magasin n’ouvre pas le lundi. Le magasin n’ouvre plus le lundi.',explanationFr:'La première phrase nie une ouverture le lundi. La seconde ajoute un changement : le magasin ouvrait auparavant le lundi, mais cette situation a cessé. Le mot qui accompagne ne ou n’ précise le sens de la négation.'},
  {exampleFr:'Durant cette semaine, le magasin n’a jamais ouvert le matin.',explanationFr:'Jamais veut dire à aucun moment dans la période indiquée. Ici, on parle seulement de cette semaine. Garde les limites données par la phrase.'},
  {exampleFr:'Je n’ai rien entendu. Je n’ai entendu personne.',explanationFr:'Rien concerne ici les choses entendues : aucun son. Personne concerne les personnes entendues : aucune. Les deux phrases ne nient pas exactement la même chose.'},
  {exampleFr:'Ce rideau ne cache guère la fenêtre.',explanationFr:'Guère signifie peu ou pas beaucoup. Le rideau peut cacher une petite partie de la fenêtre. N’en conclus pas automatiquement qu’il ne cache absolument rien.'},
  {exampleFr:'Ce magasin ne vend que des cahiers.',explanationFr:'Ne…que veut dire seulement : le magasin vend des cahiers, et limite ce qu’il vend à cela. On parle d’une restriction. La présence de ne ne suffit donc pas à conclure que toute l’action est niée.'},
 ],practice:guides.map((g,index)=>({id:`complex-negation-guided:${g.feature}`,promptFr:`${g.sentence}\n\nChoisis le sens de cette construction.`,choices:complexNegationChoices(g.feature,index),answerFr:COMPLEX_NEGATION_MEANINGS[g.feature],hintFr:'Lis la phrase entière, puis regarde quel mot accompagne ne ou n’. Vérifie si l’on parle d’un moment, d’une chose, d’une personne ou d’une faible quantité.',explanationFr:g.why})),
 takeawayFr:'Plus indique ici un arrêt ; jamais, aucun moment ; rien, aucune chose ; personne, aucune personne ; guère, peu. Vérifie toujours de quoi parle la phrase et la période qu’elle précise.',
 boundaryFr:'Cette leçon travaille le sens de ces constructions dans les phrases proposées. Elle ne vérifie pas encore que tu sais les écrire ni interpréter toutes les combinaisons possibles, comme ni…ni ou plusieurs négations dans une même phrase. À l’oral, ne est parfois absent ; ici, on lit des formes écrites complètes.',
 materialExposure:{sentences:[...guides.map(g=>g.sentence),'Le magasin n’ouvre pas le lundi. Le magasin n’ouvre plus le lundi.','Durant cette semaine, le magasin n’a jamais ouvert le matin.','Je n’ai rien entendu. Je n’ai entendu personne.','Ce rideau ne cache guère la fenêtre.','Ce magasin ne vend que des cahiers.']},
}];
