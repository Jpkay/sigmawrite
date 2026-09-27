import type {TargetTeachingContent} from './teaching-content';
export const COORDINATION_ANALYSES=[
 'Deux propositions sont reliées par un mot de coordination, comme « et », « mais », « ou » ou « car ».',
 'Une proposition dépend de l’autre : il y a une subordination.',
 'Deux propositions sont séparées par une ponctuation, sans mot de liaison : elles sont juxtaposées.',
 'La phrase ne contient qu’une proposition.',
] as const;
export const COORDINATION_RECOGNITION:readonly {sentence:string;answer:number}[]=[
 {sentence:'Lina dessine et son frère écrit.',answer:0},
 {sentence:'Nous sortons quand la pluie cesse.',answer:1},
 {sentence:'Le vent souffle ; les branches bougent.',answer:2},
 {sentence:'Le sac est lourd mais Nora le porte seule.',answer:0},
 {sentence:'Les élèves et leur professeur visitent le musée.',answer:3},
 {sentence:'Tu prends le bus ou tu marches jusqu’au stade.',answer:0},
 {sentence:'La lumière reste allumée car Sam lit encore.',answer:0},
 {sentence:'Je pense que le train arrivera bientôt.',answer:1},
 {sentence:'Le téléphone sonne, Malik répond.',answer:2},
 {sentence:'La porte s’ouvre et les visiteurs entrent.',answer:0},
 {sentence:'Ce dessin est petit mais ses détails sont précis.',answer:0},
 {sentence:'Le chemin devient étroit parce que les buissons l’envahissent.',answer:1},
 {sentence:'Les joueurs attendent ; l’arbitre vérifie le terrain.',answer:2},
 {sentence:'Cette trousse contient des crayons ou des feutres.',answer:3},
 {sentence:'Nous restons à l’intérieur car l’orage approche.',answer:0},
 {sentence:'Vous écrivez un message ou vous appelez vos amis.',answer:0},
];
const guided=[
 {sentence:'Le chat dort et le chien joue.',answer:0,why:'Et relie le chat dort à le chien joue. Chaque groupe possède son verbe conjugué : ce sont deux propositions coordonnées.'},
 {sentence:'Maya ferme la fenêtre parce qu’elle a froid.',answer:1,why:'Parce que introduit une proposition qui donne la cause et dépend de Maya ferme la fenêtre. C’est une subordination.'},
 {sentence:'La cloche retentit ; les portes s’ouvrent.',answer:2,why:'Les deux propositions sont reliées seulement par un point-virgule. Il n’y a pas de mot de coordination.'},
 {sentence:'Un vélo et une trottinette occupent le garage.',answer:3,why:'Et relie deux groupes dans le sujet. Il n’y a qu’un verbe conjugué, occupent, et qu’une proposition. On ne coordonne pas ici deux propositions.'},
 {sentence:'Le coureur accélère mais son adversaire reste devant.',answer:0,why:'Mais relie deux propositions : le coureur accélère et son adversaire reste devant.'},
 {sentence:'Nous ouvrons les rideaux car la pièce est sombre.',answer:0,why:'Car relie nous ouvrons les rideaux à la pièce est sombre. Il coordonne ici deux propositions.'},
];
export const COORDINATION_RECOGNITION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:coordination:recognition',nodeKey:'construction_coordination',mode:'recognition',status:'draft_requires_review',titleFr:'Repérer deux propositions reliées',learnerQuestionFr:'Comment les deux parties de cette phrase sont-elles reliées ?',
 steps:[
 {exampleFr:'Le soleil se couche et les lampes s’allument.',explanationFr:'Le soleil se couche pourrait former une phrase. Les lampes s’allument aussi. Chaque partie s’organise autour d’un verbe conjugué : on l’appelle une proposition. Ici, et relie ces deux propositions sans faire dépendre l’une de l’autre. C’est une coordination.'},
 {exampleFr:'Les lampes s’allument quand le soleil se couche. Le soleil se couche ; les lampes s’allument.',explanationFr:'Dans la première phrase, quand le soleil se couche dépend de l’autre proposition et indique le moment : c’est une subordination. Dans la seconde, seul le point-virgule sépare les propositions : c’est une juxtaposition.'},
 {exampleFr:'Le soleil et la lune apparaissent sur le dessin.',explanationFr:'Et peut aussi relier des mots ou des groupes. Ici, il relie le soleil et la lune dans le sujet d’une seule proposition. Voir et ne suffit donc pas à reconnaître deux propositions coordonnées.'},
 ],practice:guided.map((g,i)=>({id:`coordination-guided-${i+1}`,promptFr:`${g.sentence}\n\nComment cette phrase est-elle construite ?`,choices:[...COORDINATION_ANALYSES],answerFr:COORDINATION_ANALYSES[g.answer],hintFr:'Repère les verbes conjugués, puis regarde ce qui relie les propositions.',explanationFr:g.why})),
 takeawayFr:'Repère les propositions, puis leur lien. Un mot comme « et », « mais », « ou » ou « car » peut coordonner deux propositions. Une ponctuation seule marque leur juxtaposition.',boundaryFr:'La coordination peut aussi relier des mots ou des groupes. Ici, nous distinguons surtout les liens entre propositions. Reconnaître ce lien ne prouve pas encore que tu sais construire toi-même ces phrases.',materialExposure:{sentences:[...guided.map(g=>g.sentence),'Le soleil se couche et les lampes s’allument.','Les lampes s’allument quand le soleil se couche.','Le soleil se couche ; les lampes s’allument.','Le soleil et la lune apparaissent sur le dessin.']},
}];
