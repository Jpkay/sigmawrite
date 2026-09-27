import type {TargetTeachingContent} from './teaching-content';
export const NEGATION_ANALYSES=[
 'Ne…pas ou n’…pas nie ce qui est dit du sujet.',
 'La phrase affirme quelque chose, sans négation.',
 'La phrase pose une question, sans négation.',
 'La phrase donne un ordre ou une consigne, sans négation.',
] as const;
export const NEGATION_RECOGNITION:readonly {sentence:string;answer:number}[]=[
 {sentence:'Le robot ne bouge pas.',answer:0},
 {sentence:'Les volets sont fermés.',answer:1},
 {sentence:'Pourquoi le bateau ralentit-il ?',answer:2},
 {sentence:'La musicienne n’entend pas le signal.',answer:0},
 {sentence:'Fermez vos cahiers.',answer:3},
 {sentence:'Nous ne lui prêtons pas ce jeu.',answer:0},
 {sentence:'Ce sentier mène au lac.',answer:1},
 {sentence:'Ils n’ont pas quitté le stade.',answer:0},
 {sentence:'Tu ne veux pas attendre.',answer:0},
 {sentence:'La réunion commence à neuf heures.',answer:1},
 {sentence:'Comment fonctionne cette machine ?',answer:2},
 {sentence:'Cette réponse n’est pas exacte.',answer:0},
 {sentence:'Regarde la première image.',answer:3},
 {sentence:'Je ne me souviens pas de ce titre.',answer:0},
 {sentence:'Les enfants ont gagné la partie.',answer:1},
 {sentence:'Vous ne les voyez pas.',answer:0},
];
const guided=[
 {sentence:'La bougie ne brûle pas.',answer:0,why:'Ne et pas encadrent brûle. La phrase nie le fait que la bougie brûle.'},
 {sentence:'Le portail reste fermé.',answer:1,why:'Fermé décrit un état. Ce mot ne constitue pas à lui seul la construction ne…pas.'},
 {sentence:'Où part cette route ?',answer:2,why:'La phrase demande une information. Elle ne comporte pas de négation.'},
 {sentence:'Pose ta trousse ici.',answer:3,why:'La phrase donne une consigne affirmative. On n’y trouve ni ne ni pas.'},
];
export const NEGATION_RECOGNITION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:simple-negation:recognition',nodeKey:'construction_negation_simple',mode:'recognition',status:'draft_requires_review',titleFr:'Repérer ne…pas dans une phrase',learnerQuestionFr:'Quels mots montrent qu’une phrase nie quelque chose ?',
 steps:[
 {exampleFr:'Le moteur tourne. Le moteur ne tourne pas.',explanationFr:'La première phrase affirme que le moteur tourne. La seconde nie cette action : ne et pas entourent tourne. Ils forment ici une négation.'},
 {exampleFr:'Le moteur n’a pas démarré.',explanationFr:'Ne devient n’ devant une voyelle. Dans n’a pas démarré, les deux parties entourent a, la partie conjuguée du verbe.'},
 {exampleFr:'Le moteur est arrêté. Est-ce que le moteur tourne ? Démarre le moteur.',explanationFr:'Ces phrases décrivent un état, posent une question ou donnent une consigne. Aucune ne contient ne…pas. Un état comme arrêté n’est pas à lui seul cette construction négative.'},
 ],practice:guided.map((r,i)=>({id:`guided:negation-recognition:${i+1}`,promptFr:`${r.sentence}\nChoisis l’analyse correcte.`,choices:[...NEGATION_ANALYSES],answerFr:NEGATION_ANALYSES[r.answer],hintFr:'Cherche ne ou n’, puis pas. Si ces mots sont absents, observe ce que fait la phrase.',explanationFr:r.why})),
 takeawayFr:'Repère les deux parties ne…pas ou n’…pas et le verbe qu’elles entourent. Vérifie aussi les phrases où cette construction est absente.',boundaryFr:'Cette leçon cible ne…pas. D’autres formes comme jamais, rien ou personne se travaillent séparément. Reconnaître la construction ne prouve pas encore que tu sais l’écrire.',materialExposure:{sentences:['Le moteur tourne.','Le moteur ne tourne pas.','Le moteur n’a pas démarré.','Le moteur est arrêté.','Est-ce que le moteur tourne ?','Démarre le moteur.',...guided.map(r=>r.sentence)]},
}];
