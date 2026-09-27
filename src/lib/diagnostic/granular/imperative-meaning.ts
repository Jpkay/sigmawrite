import type {TargetTeachingContent} from './teaching-content';
export const IMPERATIVE_MEANING_LABELS=[
  "Exiger que la personne fasse quelque chose",
  "Donner un conseil que la personne peut choisir de suivre",
  "Indiquer une étape pour réaliser une tâche",
  "Inviter quelqu’un à participer ou à venir"
] as const;
const reasons=[
  "La personne intervient pour faire respecter une obligation. Elle ne laisse pas ici le choix : c’est un ordre.",
  "La personne propose une aide ou une amélioration. Le destinataire peut choisir de suivre ce conseil.",
  "Le texte indique une étape à suivre pour accomplir une tâche. Il s’agit d’une instruction.",
  "La personne propose de venir ou de participer avec les autres. Il s’agit d’une invitation."
];
const cases:readonly (readonly [string,number])[]=[
  [
    "Le match est arrêté. L’arbitre s’adresse au joueur exclu : « Quittez le terrain immédiatement. »",
    0
  ],
  [
    "Un visiteur dépasse la barrière interdite au public. Le gardien intervient : « Revenez derrière la barrière. »",
    0
  ],
  [
    "Pendant une évacuation, la responsable s’adresse au groupe : « Sortez du bâtiment maintenant. »",
    0
  ],
  [
    "Un élève continue de filmer malgré le refus de son camarade. L’enseignante intervient : « Arrête de filmer. »",
    0
  ],
  [
    "Un passager bloque la fermeture des portes. Le conducteur intervient : « Éloignez-vous des portes. »",
    0
  ],
  [
    "Un enfant lance des pierres vers les autres. L’adulte intervient : « Pose ces pierres tout de suite. »",
    0
  ],
  [
    "Léa hésite entre plusieurs romans. Son amie lui répond : « Essaie celui-ci, il pourrait te plaire. »",
    1
  ],
  [
    "Un joueur demande comment moins se fatiguer. Son partenaire répond : « Garde un peu d’énergie pour la fin, cela peut t’aider. »",
    1
  ],
  [
    "Amir cherche une manière de retenir ses mots. Sa sœur propose : « Dessine une petite image à côté, si cela t’aide. »",
    1
  ],
  [
    "Une élève demande comment améliorer son affiche. Son camarade répond : « Agrandis le titre pour qu’il se voie mieux. »",
    1
  ],
  [
    "Noa ne sait pas quelle activité choisir. Un ami lui répond : « Teste plusieurs clubs avant de te décider. »",
    1
  ],
  [
    "Une amie trouve son sac trop lourd. Zoé lui répond : « Laisse les livres inutiles chez toi, tu seras plus à l’aise. »",
    1
  ],
  [
    "Une fiche explique comment fabriquer un moulin en papier : « Pliez chaque coin vers le centre. »",
    2
  ],
  [
    "Un tutoriel montre comment créer un dossier : « Cliquez sur le bouton Nouveau dossier. »",
    2
  ],
  [
    "Une recette indique comment préparer la pâte : « Ajoutez la farine au mélange. »",
    2
  ],
  [
    "La notice explique le montage d’une étagère : « Insérez la vis dans le trou du haut. »",
    2
  ],
  [
    "Une fiche explique comment planter une graine : « Recouvrez la graine d’une fine couche de terre. »",
    2
  ],
  [
    "La règle d’un jeu explique le début du tour : « Piochez deux cartes dans la pile. »",
    2
  ],
  [
    "Inès prépare sa fête et écrit à ses amis : « Venez partager le goûter samedi ! »",
    3
  ],
  [
    "Un club organise une séance ouverte à tous. Son affiche annonce : « Rejoignez-nous pour découvrir le théâtre ! »",
    3
  ],
  [
    "Sami voit son ami seul à la cantine et lui sourit : « Installe-toi avec nous ! »",
    3
  ],
  [
    "Une famille accueille ses voisins pour le week-end : « Passez déjeuner chez nous dimanche ! »",
    3
  ],
  [
    "Des élèves préparent une fresque collective. Ils écrivent aux autres classes : « Participez à notre grand dessin ! »",
    3
  ],
  [
    "Une amie organise une promenade et écrit au groupe : « Accompagnez-moi au bord du lac demain ! »",
    3
  ]
];
const guided:readonly (readonly [string,number])[]=[
  [
    "Une surveillante intervient quand deux élèves se battent : « Séparez-vous immédiatement. »",
    0
  ],
  [
    "La zone est fermée pour travaux. Un agent dit à une personne qui entre : « Faites demi-tour. »",
    0
  ],
  [
    "Un ami demande comment mieux préparer son oral. Tu réponds : « Entraîne-toi devant quelqu’un, cela peut te rassurer. »",
    1
  ],
  [
    "Ta sœur cherche une idée pour son histoire. Tu lui proposes : « Imagine d’abord le personnage principal. »",
    1
  ],
  [
    "Pour préparer une boisson, la recette indique : « Versez le jus dans la carafe. »",
    2
  ],
  [
    "La notice explique comment allumer la lampe : « Appuyez sur le bouton vert. »",
    2
  ],
  [
    "Tu organises un pique-nique et écris à tes cousins : « Retrouvez-nous au parc samedi ! »",
    3
  ],
  [
    "À une amie qui arrive pour une soirée jeux, tu dis en souriant : « Viens jouer avec nous ! »",
    3
  ]
];
const prompt=(text:string)=>`${text}

Dans cette situation, que cherche à faire la personne avec la phrase entre guillemets ?`;
export const IMPERATIVE_MEANING_DRAFTS=cases.map(([text,category],i)=>({key:`imperative-meaning-${i+1}`,nodeKey:'interpreter_valeur_imperatif',prompt:prompt(text),answer:IMPERATIVE_MEANING_LABELS[category],distractors:IMPERATIVE_MEANING_LABELS.filter((_,index)=>index!==category),assessedTexts:[text],reason:reasons[category],category}));
const steps=[
  {
    "exampleFr": "Un ami t’écrit : « Viens goûter chez moi ! »",
    "explanationFr": "Ton ami te propose de le rejoindre. Il ne t’oblige pas à venir : cette phrase est une invitation. Le verbe viens est à l’impératif, mais l’impératif ne sert pas seulement à donner des ordres."
  },
  {
    "exampleFr": "Un gardien intervient dans une zone interdite : « Sortez. » Une hôte accueille ses invités dans le jardin : « Sortez nous rejoindre ! »",
    "explanationFr": "Dans le premier contexte, le gardien exige une action : c’est un ordre. Dans le second, la personne invite les autres à venir. La forme du verbe ne suffit pas : regarde qui parle, à qui et dans quelle situation."
  },
  {
    "exampleFr": "Un ami te propose : « Essaie un crayon plus doux, cela pourrait t’aider. » Une notice indique : « Fixez la roue sur son axe. »",
    "explanationFr": "Le conseil propose une aide que l’on peut choisir de suivre. L’instruction indique comment effectuer une tâche. Ici, la notice donne une étape du montage."
  },
  {
    "exampleFr": "« Assieds-toi. »",
    "explanationFr": "Sans contexte, plusieurs intentions sont possibles. Cela peut être un ordre ou une invitation à prendre place. Le point ou le point d’exclamation ne permet pas à lui seul de décider."
  }
];
export const IMPERATIVE_MEANING_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:imperative:meaning',nodeKey:'interpreter_valeur_imperatif',mode:'recognition',status:'draft_requires_review',
 titleFr:'Comprendre ce que demande une phrase à l’impératif',learnerQuestionFr:'Un impératif donne-t-il toujours un ordre ?',steps,
 practice:guided.map(([text,category],i)=>({id:`imperative-meaning-guided-${i+1}`,promptFr:prompt(text),choices:[...IMPERATIVE_MEANING_LABELS],answerFr:IMPERATIVE_MEANING_LABELS[category],hintFr:'Cherche le but de la personne : exiger une action, proposer une aide, expliquer une étape ou accueillir quelqu’un.',explanationFr:reasons[category]})),
 takeawayFr:'Lis la situation entière. Un impératif peut donner un ordre, un conseil, une instruction ou une invitation.',
 boundaryFr:'Certaines phrases peuvent avoir plusieurs intentions. Ici, les situations donnent des indices pour choisir la plus claire. Reconnaître cette intention ne prouve pas encore que tu sais écrire toi-même un texte adapté à ton destinataire.',
 materialExposure:{sentences:[...steps.map(s=>s.exampleFr),...guided.map(([text])=>text)]},
}];
