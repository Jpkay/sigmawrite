import type {TargetTeachingContent} from './teaching-content';
export const PASSIVE_ANALYSES=[
 'Le sujet subit l’action : le verbe est à la voix passive.',
 'Le sujet fait l’action : le verbe est à la voix active, à un temps simple.',
 'Le verbe est à la voix active, à un temps composé avec un auxiliaire.',
 'La phrase décrit le sujet avec un adjectif, sans construction passive.',
] as const;
export const PASSIVE_RECOGNITION:readonly {sentence:string;answer:number}[]=[
 {sentence:'Le trophée est remis par la directrice.',answer:0},
 {sentence:'Le jardinier arrose les plantes.',answer:1},
 {sentence:'La nageuse est arrivée au bassin.',answer:2},
 {sentence:'Les décors seront transportés par les bénévoles.',answer:0},
 {sentence:'Ce personnage est courageux.',answer:3},
 {sentence:'Le courrier a été distribué par le facteur.',answer:0},
 {sentence:'Les résultats seront annoncés demain.',answer:0},
 {sentence:'Les élèves ont préparé une affiche.',answer:2},
 {sentence:'Un mécanicien réparera ce moteur.',answer:1},
 {sentence:'La gagnante était applaudie par le public.',answer:0},
 {sentence:'Les affiches sont dessinées par les membres du club.',answer:0},
 {sentence:'Les voisines sont parties tôt.',answer:2},
 {sentence:'Cette salle semble immense.',answer:3},
 {sentence:'L’orchestre jouait une nouvelle mélodie.',answer:1},
 {sentence:'Ce roman sera traduit en italien.',answer:0},
 {sentence:'Les fenêtres ont été nettoyées par l’équipe.',answer:0},
];
const guided=[
 {sentence:'Le colis est livré par une cycliste.',answer:0,why:'Le colis ne livre rien. Il reçoit l’action de livrer, faite par la cycliste. Est livré est une construction passive.'},
 {sentence:'Une cycliste livre le colis.',answer:1,why:'Le sujet une cycliste fait l’action de livrer. Livre est un verbe actif au présent.'},
 {sentence:'Une cycliste est venue ce matin.',answer:2,why:'Est venue est le passé composé de venir, avec l’auxiliaire être. La cycliste accomplit le déplacement : personne ne la « vient ». Ce n’est pas une voix passive.'},
 {sentence:'La cycliste est prudente.',answer:3,why:'Prudente est un adjectif qui décrit la cycliste. Être ne forme pas ici une construction passive.'},
 {sentence:'La décision sera expliquée demain.',answer:0,why:'Quelqu’un expliquera la décision. Le sujet la décision reçoit cette action. La construction est passive même si la personne qui explique n’est pas nommée.'},
 {sentence:'Les arbitres ont vérifié le matériel.',answer:2,why:'Ont vérifié est un passé composé actif. Le sujet les arbitres fait la vérification.'},
];
export const PASSIVE_RECOGNITION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:passive:recognition',nodeKey:'construction_voix_passive',mode:'recognition',status:'draft_requires_review',titleFr:'Qui fait l’action, qui la reçoit ?',learnerQuestionFr:'Le sujet fait-il l’action ou la subit-il ?',
 steps:[
 {exampleFr:'Le cuisinier prépare le repas. Le repas est préparé par le cuisinier.',explanationFr:'Les deux phrases parlent de la même action. Dans la première, le sujet le cuisinier fait l’action : le verbe est à la voix active. Dans la seconde, le sujet le repas subit l’action : le verbe est à la voix passive. Est préparé associe être à la forme préparé, appelée participe passé.'},
 {exampleFr:'Le repas sera servi à midi. Le repas a été servi par le cuisinier.',explanationFr:'Quelqu’un sert le repas, même si cette personne n’est pas nommée dans la première phrase. Sera servi et a été servi sont deux constructions passives à des temps différents. La voix et le temps sont deux informations distinctes.'},
 {exampleFr:'Le cuisinier est sorti. Le cuisinier est attentif.',explanationFr:'Dans est sorti, être aide à former le passé composé de sortir : le cuisinier accomplit le déplacement. Dans est attentif, l’adjectif attentif décrit le cuisinier. Ni l’une ni l’autre de ces phrases n’est passive. Ne décide pas seulement parce que tu vois être.'},
 ],practice:guided.map((g,i)=>({id:`passive-guided-${i+1}`,promptFr:`${g.sentence}\n\nChoisis l’analyse correcte.`,choices:[...PASSIVE_ANALYSES],answerFr:PASSIVE_ANALYSES[g.answer],hintFr:'Repère le sujet et l’action. Demande-toi si le sujet accomplit cette action ou la reçoit.',explanationFr:g.why})),
 takeawayFr:'Dans une construction passive, le sujet subit l’action. Vérifie son rôle et la construction du verbe : être apparaît aussi dans des phrases actives ou des descriptions.',boundaryFr:'La personne qui fait l’action peut être absente de la phrase passive. Cette leçon ne vérifie pas encore que tu sais transformer une phrase active en phrase passive ni accorder son participe passé.',materialExposure:{sentences:[...guided.map(g=>g.sentence),'Le cuisinier prépare le repas.','Le repas est préparé par le cuisinier.','Le repas sera servi à midi.','Le repas a été servi par le cuisinier.','Le cuisinier est sorti.','Le cuisinier est attentif.']},
}];
