import type {TargetTeachingContent} from './teaching-content';
export const IMPERATIVE_LABELS=['Impératif présent','Indicatif présent','Indicatif futur simple','Infinitif'] as const;
type Example=readonly [string,string,typeof IMPERATIVE_LABELS[number]];
const examples:readonly Example[]=[
 ['Prends le chemin qui longe la rivière.','Prends','Impératif présent'],
 ['Ne touche pas à la peinture fraîche.','touche','Impératif présent'],
 ['Attendons le retour du guide.','Attendons','Impératif présent'],
 ['Soyez attentifs au signal sonore.','Soyez','Impératif présent'],
 ['N’oublie pas ton billet.','oublie','Impératif présent'],
 ['Fais une copie de ton dessin.','Fais','Impératif présent'],
 ['Finissons notre partie avant de sortir.','Finissons','Impératif présent'],
 ['Dites votre prénom à l’accueil.','Dites','Impératif présent'],
 ['Tu prends le bus du matin.','prends','Indicatif présent'],
 ['Nous attendons devant le cinéma.','attendons','Indicatif présent'],
 ['Vous dites toujours bonjour en entrant.','dites','Indicatif présent'],
 ['Tu fais un tour du jardin.','fais','Indicatif présent'],
 ['Les enfants jouent derrière la maison.','jouent','Indicatif présent'],
 ['Tu finis souvent ton travail avant moi.','finis','Indicatif présent'],
 ['Nous regardons le tableau des départs.','regardons','Indicatif présent'],
 ['Vous prenez vos repas à la cantine.','prenez','Indicatif présent'],
 ['Tu rangeras ta chambre après le goûter.','rangeras','Indicatif futur simple'],
 ['Nous apporterons une couverture demain.','apporterons','Indicatif futur simple'],
 ['Vous fermerez la porte en partant.','fermerez','Indicatif futur simple'],
 ['Elle viendra nous retrouver samedi.','viendra','Indicatif futur simple'],
 ['Ne pas courir dans les escaliers.','courir','Infinitif'],
 ['Bien agiter avant de servir.','agiter','Infinitif'],
 ['Découper le long des pointillés.','Découper','Infinitif'],
 ['Il faut attendre le feu vert.','attendre','Infinitif'],
];
const prompt=(sentence:string,form:string)=>`${sentence}\n\nQuelle est la forme du verbe « ${form} » dans cette phrase ?`;
export const IMPERATIF_RECOGNITION_DRAFTS=examples.map(([sentence,form,answer],i)=>({key:`imperatif-recognition-${i+1}`,nodeKey:'reconnaitre_imperatif',prompt:prompt(sentence,form),answer,distractors:IMPERATIVE_LABELS.filter(l=>l!==answer),assessedTexts:[sentence],reason:`Dans ce contexte, « ${form} » est à la forme ${answer.toLocaleLowerCase('fr')}.`}));
const guided:readonly Example[]=[
 ['Ouvre ton cahier à la page dix.','Ouvre','Impératif présent'],
 ['Tu ouvres ton cahier à la page dix.','ouvres','Indicatif présent'],
 ['Ne courez pas sur le sol mouillé.','courez','Impératif présent'],
 ['Vous courez le mercredi.','courez','Indicatif présent'],
 ['Tu ouvriras la fenêtre après la pause.','ouvriras','Indicatif futur simple'],
 ['Ouvrir la fenêtre après la pause.','Ouvrir','Infinitif'],
];
const reasons=[
 'Ouvre s’adresse directement à une personne. Aucun pronom sujet tu n’est écrit : c’est l’impératif présent.',
 'Le sujet tu est écrit et le verbe décrit ici une action : ouvres est au présent de l’indicatif.',
 'La consigne est négative, mais courez reste à l’impératif : aucun sujet vous n’est écrit.',
 'Avec le sujet vous, courez décrit ici une habitude au présent de l’indicatif. La forme seule ne suffit pas.',
 'Ouvriras est conjugué au futur simple avec le sujet tu. Même si la phrase sert de consigne, le mode n’est pas l’impératif.',
 'Ouvrir est la forme non conjuguée du verbe, appelée infinitif. Une consigne peut aussi employer un infinitif.',
];
const steps=[
 {exampleFr:'Ferme la boîte. Tu fermes la boîte.',explanationFr:'La première phrase s’adresse directement à quelqu’un sans écrire le sujet tu. Ferme est à l’impératif présent. Dans la seconde, tu fermes est au présent de l’indicatif.'},
 {exampleFr:'Prenons une pause. Prenez une pause. Ne prenez pas ce raccourci.',explanationFr:'L’impératif sert aussi à proposer une action ensemble ou à s’adresser à plusieurs personnes. Il peut être négatif. Le sujet nous ou vous n’est pas écrit.'},
 {exampleFr:'Vous prenez des notes. Prenez des notes.',explanationFr:'Prenez a la même orthographe dans les deux phrases. Lis le contexte et cherche le sujet : avec vous, c’est ici l’indicatif ; sans ce sujet, dans la consigne, c’est l’impératif.'},
 {exampleFr:'Ne pas toucher. Tu fermeras le portail. Ferme le portail.',explanationFr:'Ces phrases peuvent toutes donner une consigne, mais leur forme diffère. Toucher est un infinitif, fermeras un futur de l’indicatif et ferme un impératif. Le sens de consigne ou le point d’exclamation ne suffisent pas à reconnaître le mode.'},
];
export const IMPERATIF_RECOGNITION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:imperatif:recognition',nodeKey:'reconnaitre_imperatif',mode:'recognition',status:'draft_requires_review',titleFr:'Reconnaître un verbe à l’impératif',learnerQuestionFr:'Une consigne contient-elle toujours un impératif ?',steps,
 practice:guided.map(([sentence,form,answer],i)=>({id:`imperatif-recognition-guided-${i+1}`,promptFr:prompt(sentence,form),choices:[...IMPERATIVE_LABELS],answerFr:answer,hintFr:'Observe le verbe et cherche son sujet. Une consigne peut aussi être à l’infinitif ou au futur.',explanationFr:reasons[i]})),
 takeawayFr:'Lis la phrase entière : l’impératif s’adresse directement à quelqu’un sans écrire le pronom sujet. Distingue-le d’un infinitif et d’un futur utilisés pour donner une consigne.',
 boundaryFr:'Tu reconnais ici la forme du verbe dans des phrases complètes et courtes. Cela ne prouve pas encore que tu sais conjuguer tous les verbes à l’impératif. Un nom peut désigner la personne appelée : dans « Lina, viens ici », Lina est la personne à qui l’on parle.',
 materialExposure:{sentences:[...steps.map(s=>s.exampleFr),...guided.map(r=>r[0])]},
}];
