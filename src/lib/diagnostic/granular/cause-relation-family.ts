import type { DiagnosticDifficultyTier } from "../item-bank";
import type { TargetTeachingContent } from "./teaching-content";

export type CauseRelationPool = "initial" | "learning";

export type CauseRecognitionQuestion = {
  registryId: "C081";
  key: string;
  sentence: string;
  answer: CauseRelationAnalysis;
  explanationFr: string;
  negative: boolean;
  pool: CauseRelationPool;
  difficultyTier: DiagnosticDifficultyTier;
  difficulty: number;
};

export type CauseProductionQuestion = {
  registryId: "C082";
  key: string;
  effect: string;
  reason: string;
  answer: string;
  reverse: string;
  pool: CauseRelationPool;
  difficultyTier: DiagnosticDifficultyTier;
  difficulty: number;
};

export const CAUSE_RELATION_ANALYSES = [
  "Une cause explique un fait.",
  "Les actions se succèdent dans le temps.",
  "Deux faits sont simplement ajoutés.",
  "Deux faits s’opposent.",
] as const;

export type CauseRelationAnalysis = typeof CAUSE_RELATION_ANALYSES[number];

const CAUSE = CAUSE_RELATION_ANALYSES[0];
const CHRONOLOGY = CAUSE_RELATION_ANALYSES[1];
const ADDITION = CAUSE_RELATION_ANALYSES[2];
const OPPOSITION = CAUSE_RELATION_ANALYSES[3];

const tier = (difficultyTier: DiagnosticDifficultyTier) => ({
  difficultyTier,
  difficulty: difficultyTier === "foundation" ? 35 : difficultyTier === "core" ? 50 : 65,
});

export const CAUSE_RECOGNITION_QUESTIONS: readonly CauseRecognitionQuestion[] = [
  {
    registryId: "C081",
    key: "wet-ground",
    sentence: "Le sol est mouillé parce qu’il a plu cette nuit.",
    answer: CAUSE,
    explanationFr: "La pluie explique pourquoi le sol est mouillé. Parce que introduit la cause.",
    negative: false,
    pool: "initial",
    ...tier("foundation"),
  },
  {
    registryId: "C081",
    key: "bag-then-exit",
    sentence: "Mila range son sac, puis elle sort de la classe.",
    answer: CHRONOLOGY,
    explanationFr: "Puis place les deux actions dans le temps. La première n’explique pas la seconde.",
    negative: true,
    pool: "initial",
    ...tier("foundation"),
  },
  {
    registryId: "C081",
    key: "late-bus",
    sentence: "Comme le bus est en retard, Nora part à pied.",
    answer: CAUSE,
    explanationFr: "Le retard du bus explique le départ à pied. Comme introduit ici la cause.",
    negative: false,
    pool: "initial",
    ...tier("core"),
  },
  {
    registryId: "C081",
    key: "newspapers-and-maps",
    sentence: "Le kiosque vend des journaux et des cartes postales.",
    answer: ADDITION,
    explanationFr: "Et ajoute deux produits vendus par le kiosque. Aucun ne cause l’autre.",
    negative: true,
    pool: "initial",
    ...tier("core"),
  },
  {
    registryId: "C081",
    key: "power-failure",
    sentence: "La séance est annulée en raison d’une panne d’électricité.",
    answer: CAUSE,
    explanationFr: "La panne explique l’annulation. En raison de introduit la cause.",
    negative: false,
    pool: "initial",
    ...tier("stretch"),
  },
  {
    registryId: "C081",
    key: "rain-match",
    sentence: "Il pleut, mais le match continue.",
    answer: OPPOSITION,
    explanationFr: "Mais oppose la pluie à la poursuite du match. La phrase ne présente pas la pluie comme la cause de cette poursuite.",
    negative: true,
    pool: "initial",
    ...tier("stretch"),
  },
  {
    registryId: "C081",
    key: "hot-window",
    sentence: "Puisqu’il fait chaud, nous ouvrons les fenêtres.",
    answer: CAUSE,
    explanationFr: "La chaleur explique l’ouverture des fenêtres. Puisque introduit la cause.",
    negative: false,
    pool: "learning",
    ...tier("foundation"),
  },
  {
    registryId: "C081",
    key: "wash-then-cut",
    sentence: "D’abord, Adam lave les tomates; ensuite, il les coupe.",
    answer: CHRONOLOGY,
    explanationFr: "D’abord et ensuite ordonnent les actions. Le lavage n’est pas donné comme la cause de la coupe.",
    negative: true,
    pool: "learning",
    ...tier("foundation"),
  },
  {
    registryId: "C081",
    key: "flat-tire",
    sentence: "Le vélo roule mal à cause d’un pneu dégonflé.",
    answer: CAUSE,
    explanationFr: "Le pneu dégonflé explique pourquoi le vélo roule mal. À cause de introduit la cause.",
    negative: false,
    pool: "learning",
    ...tier("core"),
  },
  {
    registryId: "C081",
    key: "tea-homework",
    sentence: "Léa boit du thé et son frère termine ses devoirs.",
    answer: ADDITION,
    explanationFr: "Et ajoute les deux actions. Aucune n’est présentée comme la cause de l’autre.",
    negative: true,
    pool: "learning",
    ...tier("core"),
  },
  {
    registryId: "C081",
    key: "sister-arrives",
    sentence: "Yanis sourit, car sa sœur arrive ce soir.",
    answer: CAUSE,
    explanationFr: "L’arrivée de sa sœur explique le sourire de Yanis. Car introduit la cause.",
    negative: false,
    pool: "learning",
    ...tier("stretch"),
  },
  {
    registryId: "C081",
    key: "narrow-bus",
    sentence: "La rue est étroite; pourtant, le bus y passe facilement.",
    answer: OPPOSITION,
    explanationFr: "Pourtant oppose l’étroitesse de la rue au passage facile du bus. Il n’introduit pas une cause.",
    negative: true,
    pool: "learning",
    ...tier("stretch"),
  },
];

const production = (
  key: string,
  effect: string,
  reason: string,
  answer: string,
  reverse: string,
  pool: CauseRelationPool,
  difficultyTier: DiagnosticDifficultyTier,
): CauseProductionQuestion => ({
  registryId: "C082",
  key,
  effect,
  reason,
  answer,
  reverse,
  pool,
  ...tier(difficultyTier),
});

export const CAUSE_PRODUCTION_QUESTIONS: readonly CauseProductionQuestion[] = [
  production("empty-yard", "La cour reste vide.", "Il pleut fort.", "La cour reste vide parce qu’il pleut fort.", "Il pleut fort parce que la cour reste vide.", "initial", "foundation"),
  production("closed-bakery", "La boulangerie est fermée.", "C’est un jour férié.", "La boulangerie est fermée parce que c’est un jour férié.", "C’est un jour férié parce que la boulangerie est fermée.", "initial", "foundation"),
  production("slow-walk", "Nina marche lentement.", "Elle porte deux sacs lourds.", "Nina marche lentement parce qu’elle porte deux sacs lourds.", "Elle porte deux sacs lourds parce que Nina marche lentement.", "initial", "core"),
  production("open-shutters", "Nous ouvrons les volets.", "Il fait jour.", "Nous ouvrons les volets parce qu’il fait jour.", "Il fait jour parce que nous ouvrons les volets.", "initial", "core"),
  production("early-return", "Samir rentre plus tôt.", "Son entraînement est annulé.", "Samir rentre plus tôt parce que son entraînement est annulé.", "Son entraînement est annulé parce que Samir rentre plus tôt.", "initial", "stretch"),
  production("quiet-library", "Les élèves parlent doucement.", "Des lecteurs travaillent dans la bibliothèque.", "Les élèves parlent doucement parce que des lecteurs travaillent dans la bibliothèque.", "Des lecteurs travaillent dans la bibliothèque parce que les élèves parlent doucement.", "initial", "stretch"),
  production("warm-coat", "Iris prend son manteau.", "L’air est froid ce matin.", "Iris prend son manteau parce que l’air est froid ce matin.", "L’air est froid ce matin parce qu’Iris prend son manteau.", "initial", "foundation"),
  production("charged-phone", "Tu branches ton téléphone.", "La batterie est presque vide.", "Tu branches ton téléphone parce que la batterie est presque vide.", "La batterie est presque vide parce que tu branches ton téléphone.", "initial", "core"),
  production("late-train", "Le train arrive en retard.", "Un arbre bloque la voie.", "Le train arrive en retard parce qu’un arbre bloque la voie.", "Un arbre bloque la voie parce que le train arrive en retard.", "learning", "foundation"),
  production("water-plants", "Awa arrose les plantes.", "La terre est sèche.", "Awa arrose les plantes parce que la terre est sèche.", "La terre est sèche parce qu’Awa arrose les plantes.", "learning", "foundation"),
  production("cancel-picnic", "Nous annulons le pique-nique.", "Un orage approche.", "Nous annulons le pique-nique parce qu’un orage approche.", "Un orage approche parce que nous annulons le pique-nique.", "learning", "core"),
  production("lower-voice", "Malik baisse la voix.", "Le bébé dort.", "Malik baisse la voix parce que le bébé dort.", "Le bébé dort parce que Malik baisse la voix.", "learning", "core"),
  production("crowded-road", "La circulation avance lentement.", "Des travaux occupent une voie.", "La circulation avance lentement parce que des travaux occupent une voie.", "Des travaux occupent une voie parce que la circulation avance lentement.", "learning", "stretch"),
  production("closed-window", "Élise ferme la fenêtre.", "La fumée entre dans la cuisine.", "Élise ferme la fenêtre parce que la fumée entre dans la cuisine.", "La fumée entre dans la cuisine parce qu’Élise ferme la fenêtre.", "learning", "stretch"),
  production("take-stairs", "Vous prenez l’escalier.", "L’ascenseur est en panne.", "Vous prenez l’escalier parce que l’ascenseur est en panne.", "L’ascenseur est en panne parce que vous prenez l’escalier.", "learning", "foundation"),
  production("move-table", "Ils déplacent la table.", "Elle bloque le passage.", "Ils déplacent la table parce qu’elle bloque le passage.", "Elle bloque le passage parce qu’ils déplacent la table.", "learning", "core"),
];

const recognitionPractice: TargetTeachingContent["practice"] = [
  ["lamp-off", "La lampe ne s’allume pas parce que l’ampoule est usée.", CAUSE, "L’ampoule usée explique le problème."],
  ["read-then-note", "Maya lit la consigne, puis elle prend des notes.", CHRONOLOGY, "Puis marque l’ordre des actions."],
  ["fog-flight", "À cause du brouillard, le vol part plus tard.", CAUSE, "Le brouillard explique le retard."],
  ["fruit-bread", "Le panier contient des fruits et du pain.", ADDITION, "Et ajoute deux éléments."],
  ["glasses-board", "Jo porte ses lunettes car il lit au tableau.", CAUSE, "La lecture au tableau explique le port des lunettes."],
  ["tired-walk", "Lina est fatiguée, pourtant elle poursuit sa marche.", OPPOSITION, "Pourtant oppose la fatigue à la poursuite de la marche."],
].map(([id, sentence, answerFr, explanationFr]) => ({
  id: `cause-relation:C081:guided-${id}`,
  promptFr: `${sentence}\n\nQuelle relation unit les deux idées ?`,
  choices: [...CAUSE_RELATION_ANALYSES],
  answerFr,
  hintFr: "Demande-toi si une idée répond à la question pourquoi.",
  explanationFr,
}));

const productionPractice: TargetTeachingContent["practice"] = [
  ["wet-bench", "Le banc est mouillé.", "La pluie vient de tomber.", "Le banc est mouillé parce que la pluie vient de tomber."],
  ["open-umbrella", "Zoé ouvre son parapluie.", "Il commence à pleuvoir.", "Zoé ouvre son parapluie parce qu’il commence à pleuvoir."],
  ["dim-screen", "Noé baisse la luminosité de l’écran.", "La pièce est sombre.", "Noé baisse la luminosité de l’écran parce que la pièce est sombre."],
  ["closed-pool", "La piscine ferme plus tôt.", "Une réparation est nécessaire.", "La piscine ferme plus tôt parce qu’une réparation est nécessaire."],
  ["carry-water", "Nous emportons de l’eau.", "La randonnée dure trois heures.", "Nous emportons de l’eau parce que la randonnée dure trois heures."],
  ["miss-call", "Amadou ne répond pas.", "Son téléphone est en mode silencieux.", "Amadou ne répond pas parce que son téléphone est en mode silencieux."],
].map(([id, effect, reason, answerFr]) => ({
  id: `cause-relation:C082:guided-${id}`,
  promptFr: `Relie les deux idées avec « parce que ». Commence par la première.\n\n${effect}\n${reason}`,
  answerFr,
  hintFr: "Garde la première idée au début, retire son point, puis ajoute parce que et la seconde idée.",
  explanationFr: `${answerFr} La partie après parce que donne la raison du premier fait.`,
}));

export const CAUSE_RELATION_TEACHING: readonly TargetTeachingContent[] = [
  {
    id: "french-v3-teaching:cause-relation:recognition",
    nodeKey: "relation_cause",
    mode: "recognition",
    status: "draft_requires_review",
    titleFr: "Reconnaître une relation de cause",
    learnerQuestionFr: "Comment savoir si une idée explique vraiment l’autre ?",
    steps: [
      {
        exampleFr: "Le chemin est glissant parce qu’il a gelé.",
        explanationFr: "Le gel répond à la question pourquoi le chemin est-il glissant. Cette raison s’appelle la cause.",
      },
      {
        exampleFr: "Parce que, car, comme, puisque, à cause de, en raison de",
        explanationFr: "Ces mots peuvent signaler une cause. Cherche toujours le sens de la phrase, car la cause peut venir avant ou après le fait expliqué.",
      },
      {
        exampleFr: "Lila ferme son cahier, puis elle range son stylo.",
        explanationFr: "Puis indique ici une suite dans le temps. Une phrase qui contient deux idées ne présente donc pas toujours une relation de cause.",
      },
    ],
    takeawayFr: "Trouve le fait, puis demande pourquoi il arrive. La réponse est la cause; sinon, identifie la relation réellement exprimée.",
    boundaryFr: "Cette leçon vérifie la reconnaissance d’une cause exprimée dans une phrase. Elle ne vérifie pas encore l’inférence d’une cause laissée implicite dans un texte.",
    practice: recognitionPractice,
    materialExposure: {
      sentences: [
        "Le chemin est glissant parce qu’il a gelé.",
        "Lila ferme son cahier, puis elle range son stylo.",
        ...recognitionPractice.map(row => row.promptFr.split("\n\n")[0]),
      ],
    },
  },
  {
    id: "french-v3-teaching:cause-relation:production",
    nodeKey: "relation_cause",
    mode: "production",
    status: "draft_requires_review",
    titleFr: "Relier un fait à sa cause",
    learnerQuestionFr: "Comment unir deux idées pour montrer pourquoi un fait arrive ?",
    steps: [
      {
        exampleFr: "Le match commence tard. Le bus de l’équipe est retardé.",
        explanationFr: "La seconde idée explique la première. Elle donne la cause du retard du match.",
      },
      {
        exampleFr: "Le match commence tard parce que le bus de l’équipe est retardé.",
        explanationFr: "Place le fait expliqué au début. Retire son point, ajoute parce que, puis écris la cause.",
      },
      {
        exampleFr: "Pourquoi le match commence-t-il tard ? Parce que le bus de l’équipe est retardé.",
        explanationFr: "Relis la phrase avec pourquoi. Si la partie après parce que répond clairement, la direction de la relation est correcte.",
      },
    ],
    takeawayFr: "Écris d’abord le fait expliqué, puis parce que et sa cause.",
    boundaryFr: "Cette leçon vérifie une combinaison contrôlée de deux idées fournies. Elle ne mesure pas encore la rédaction autonome d’une explication.",
    practice: productionPractice,
    materialExposure: {
      sentences: [
        "Le match commence tard.",
        "Le bus de l’équipe est retardé.",
        "Le match commence tard parce que le bus de l’équipe est retardé.",
        ...productionPractice.flatMap(row => {
          const [, pair] = row.promptFr.split("\n\n");
          return [...pair.split("\n"), row.answerFr];
        }),
      ],
    },
  },
];

export const CAUSE_RELATION_REVIEW = [
  {
    registryId: "C081" as const,
    skillId: "relation_cause::reading-analysis",
    status: "awaiting_real_review" as const,
    questionsFr: [
      "Chaque item causal exprime-t-il une raison claire, sans demander une inférence extérieure à la phrase ?",
      "Chaque contre-exemple exclut-il réellement la cause et illustre-t-il sans ambiguïté la relation annoncée ?",
    ],
  },
  {
    registryId: "C082" as const,
    skillId: "relation_cause::writing-controlled-production",
    status: "awaiting_real_review" as const,
    questionsFr: [
      "La direction fait-vers-cause reste-t-elle naturelle dans chaque phrase combinée ?",
      "Les deux propositions données permettent-elles une seule combinaison attendue avec parce que ?",
    ],
  },
] as const;
