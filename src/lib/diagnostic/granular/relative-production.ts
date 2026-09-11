import type {TargetTeachingContent} from './teaching-content';
export interface RelativeCombination {first:string;second:string;relative:string;pronoun:'qui'|'que'|'dont'|'où';explanation:string}
const row=(first:string,second:string,relative:string,pronoun:RelativeCombination['pronoun'],explanation:string):RelativeCombination=>({first,second,relative,pronoun,explanation});
export const RELATIVE_PRODUCTION_ASSESSMENT:readonly RelativeCombination[]=[
 row('Je regarde un oiseau.','Cet oiseau chante.','qui chante','qui','L’oiseau est le sujet de chante : qui remplace ce sujet.'),
 row('Nous croisons une athlète.','Cette athlète court chaque matin.','qui court chaque matin','qui','L’athlète est le sujet de court : qui remplace ce sujet.'),
 row('Tu photographies des bateaux.','Ces bateaux quittent le port.','qui quittent le port','qui','Les bateaux sont le sujet de quittent : qui remplace ce sujet.'),
 row('Je retrouve le guide.','Tu connais ce guide.','que tu connais','que','Le guide est ce que tu connais : que le remplace devant tu connais.'),
 row('Nous goûtons une soupe.','Lina prépare cette soupe.','que Lina prépare','que','La soupe est ce que Lina prépare : que la remplace.'),
 row('Vous rangez les outils.','Les ouvriers utilisent ces outils.','que les ouvriers utilisent','que','Les outils sont ce que les ouvriers utilisent : que les remplace.'),
 row('Je choisis un roman.','Tu parles de ce roman.','dont tu parles','dont','On parle de ce roman : dont remplace de ce roman.'),
 row('Elle découvre un sport.','Son frère rêve de ce sport.','dont son frère rêve','dont','On rêve de ce sport : dont remplace de ce sport.'),
 row('Nous apportons les documents.','Le club a besoin de ces documents.','dont le club a besoin','dont','On a besoin de ces documents : dont remplace de ces documents.'),
 row('Nous découvrons un village.','Ma tante vit dans ce village.','où ma tante vit','où','Le village est le lieu où vit ma tante : où remplace dans ce village.'),
 row('Je visite le musée.','Les peintres exposent dans ce musée.','où les peintres exposent','où','Le musée est un lieu : où remplace dans ce musée.'),
 row('Tu connais le stade.','Notre équipe s’entraîne dans ce stade.','où notre équipe s’entraîne','où','Le stade est un lieu : où remplace dans ce stade.'),
];
const guided:readonly RelativeCombination[]=[
 row('Voici une voisine.','Cette voisine joue du violon.','qui joue du violon','qui','Qui remplace cette voisine, le sujet de joue.'),
 row('Je salue les bénévoles.','Ces bénévoles installent les chaises.','qui installent les chaises','qui','Qui remplace ces bénévoles, le sujet du verbe installent. Le verbe reste au pluriel.'),
 row('Je porte un pull.','Ma sœur tricote ce pull.','que ma sœur tricote','que','Que remplace ce pull. Ma sœur reste le sujet du verbe tricote.'),
 row('Nous ramassons les feuilles.','Le vent emporte ces feuilles.','que le vent emporte','que','Que remplace ces feuilles. Le vent reste le sujet du verbe emporte.'),
 row('Voici le matériel.','Nous avons besoin de ce matériel.','dont nous avons besoin','dont','Dont remplace de ce matériel après avoir besoin de.'),
 row('Je rencontre une artiste.','Mes amis parlent de cette artiste.','dont mes amis parlent','dont','Dont remplace de cette artiste après parler de.'),
 row('Je traverse une place.','Le marché se tient sur cette place.','où le marché se tient','où','Où remplace sur cette place : c’est un lieu.'),
 row('Nous admirons un jardin.','Les enfants jouent dans ce jardin.','où les enfants jouent','où','Où remplace dans ce jardin : c’est un lieu.'),
];
export const combinedRelative=(r:RelativeCombination)=>`${r.first.slice(0,-1)} ${r.relative}.`;
export const combinationPrompt=(r:RelativeCombination)=>`Réunis ces deux phrases en une seule avec une proposition relative. Utilise qui, que, dont ou où. Garde tous les mots de la première phrase dans leur ordre, puis ajoute la relative à la place du point final. Dans la seconde phrase, remplace la répétition du nom par le pronom relatif adapté. N’ajoute pas d’autres informations.\n\n${r.first}\n${r.second}`;
export const RELATIVE_PRODUCTION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:relative-clause:production',nodeKey:'construction_subordonnee_relative',mode:'production',status:'draft_requires_review',titleFr:'Réunir deux phrases avec une relative',learnerQuestionFr:'Comment éviter de répéter « un chat » dans « Je vois un chat. Ce chat dort. » ?',
 steps:[
  {exampleFr:'Je vois un chat. Ce chat dort. → Je vois un chat qui dort.',explanationFr:'Garde la première phrase, puis remplace ce chat dans la seconde par qui. Qui dort précise le nom chat : c’est une proposition relative. Qui prend ici la place du sujet du verbe dort.'},
  {exampleFr:'Je lis une lettre. Nina écrit cette lettre. → Je lis une lettre que Nina écrit.',explanationFr:'Dans la seconde phrase, Nina est le sujet. Cette lettre désigne ce qu’elle écrit : remplace ce groupe par que et place-le devant Nina écrit. Ne garde pas une seconde fois cette lettre.'},
  {exampleFr:'Voilà le projet. Vous parlez de ce projet. → Voilà le projet dont vous parlez.',explanationFr:'Le groupe répété commence par de : on parle de ce projet. Dont remplace tout le groupe de ce projet. N’écris pas dont vous parlez de.'},
  {exampleFr:'Je cherche une salle. Nous travaillerons dans cette salle. → Je cherche une salle où nous travaillerons.',explanationFr:'Dans cette salle indique un lieu. Où remplace ce groupe. Garde le sujet nous et le verbe travaillerons après où.'},
 ],
 takeawayFr:'Repère le groupe répété dans la seconde phrase : sujet → qui ; objet directement lié au verbe → que ; groupe introduit par de → dont dans les exemples étudiés ; lieu → où. Relis pour vérifier que le nom n’est pas répété.',
 boundaryFr:'Tu combines ici deux phrases fournies, dans un ordre imposé. Cela entraîne une construction écrite précise, sans prouver que tu sais organiser un texte libre. Les constructions plus complexes avec lequel et les autres emplois des pronoms demandent un travail supplémentaire.',
 practice:guided.map((r,index)=>({id:`guided:relative-production:${index+1}`,promptFr:combinationPrompt(r),answerFr:combinedRelative(r),hintFr:r.explanation,explanationFr:`${combinedRelative(r)} ${r.explanation}`})),
 materialExposure:{sentences:[...guided.flatMap(r=>[r.first,r.second,combinedRelative(r)]),'Je vois un chat qui dort.','Je lis une lettre que Nina écrit.','Voilà le projet dont vous parlez.','Je cherche une salle où nous travaillerons.']},
}];
