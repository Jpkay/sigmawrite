import { conjugate, PERSONS, type Person } from "@/lib/linguistic/conjugation";
import type { DiagnosticDifficultyTier } from "../item-bank";
import type { TargetTeachingContent } from "./teaching-content";

export type PasseRecentModalPool = "initial" | "learning";

export type PasseRecentModalQuestion = {
  registryId: "C001" | "C002" | "C003";
  verb: "vouloir" | "savoir" | "devoir";
  person: Person;
  sentence: string;
  answer: string;
  pool: PasseRecentModalPool;
  difficultyTier: DiagnosticDifficultyTier;
  difficulty: number;
};

type QuestionSeed = Omit<PasseRecentModalQuestion, "registryId" | "verb" | "answer" | "pool">;

type ModalTarget = {
  registryId: PasseRecentModalQuestion["registryId"];
  verb: PasseRecentModalQuestion["verb"];
  naturalnessScopeFr: string;
  ownerReviewQuestionsFr: readonly string[];
  lesson: TargetTeachingContent;
  initial: readonly QuestionSeed[];
  learning: readonly QuestionSeed[];
};

const labels: Record<Person, string> = {
  "1s": "je",
  "2s": "tu",
  "3s": "il, elle ou on",
  "1p": "nous",
  "2p": "vous",
  "3p": "ils ou elles",
};

const difficulty = (person: Person): Pick<QuestionSeed, "difficultyTier" | "difficulty"> => {
  if (person === "1s" || person === "2s") return { difficultyTier: "foundation", difficulty: 35 };
  if (person === "3s" || person === "1p") return { difficultyTier: "core", difficulty: 50 };
  return { difficultyTier: "stretch", difficulty: 65 };
};

const seed = (person: Person, sentence: string): QuestionSeed => ({ person, sentence, ...difficulty(person) });

const guidedPractice = (
  registryId: PasseRecentModalQuestion["registryId"],
  verb: PasseRecentModalQuestion["verb"],
  cases: readonly [Person, string, string][],
): TargetTeachingContent["practice"] => cases.map(([person, sentence, why], index) => {
  const answerFr = conjugate(verb, "passe_recent", person);
  return {
    id: `passe-recent-modal:${registryId}:guided-${index + 1}`,
    promptFr: `Le passé récent est demandé. Complète avec ${verb}. Écris seulement le groupe verbal manquant : ${sentence}`,
    answerFr,
    hintFr: `Le sujet correspond à ${labels[person]}. Conjugue venir au présent, puis ajoute de et ${verb}.`,
    explanationFr: `${sentence.replace("___", answerFr)} ${why}`,
  };
});

const lesson = (input: {
  registryId: PasseRecentModalQuestion["registryId"];
  verb: PasseRecentModalQuestion["verb"];
  titleFr: string;
  introductionExample: string;
  introductionExplanation: string;
  presentContrast: string;
  recentContrast: string;
  boundaryFr: string;
  guided: readonly [Person, string][];
}): TargetTeachingContent => {
  const forms = PERSONS.map(person => `${labels[person]} : ${conjugate(input.verb, "passe_recent", person)}`).join("\n");
  const practice = guidedPractice(
    input.registryId,
    input.verb,
    input.guided.map(([person, sentence]) => [
      person,
      sentence,
      `Avec ce sujet, venir s’écrit ${conjugate("venir", "present", person)}. ${input.verb} reste à la forme du dictionnaire, appelée infinitif.`,
    ]),
  );
  const completedGuided = input.guided.map(([person, sentence]) => sentence.replace("___", conjugate(input.verb, "passe_recent", person)));
  const steps: TargetTeachingContent["steps"] = [
    {
      exampleFr: input.introductionExample,
      explanationFr: input.introductionExplanation,
    },
    {
      exampleFr: forms,
      explanationFr: `Seul venir change avec le sujet. ${input.verb} garde sa forme du dictionnaire. Le groupe contient donc une forme de venir, le mot de, puis ${input.verb}.`,
    },
    {
      exampleFr: `${input.presentContrast}\n${input.recentContrast}`,
      explanationFr: `La première ligne emploie ${input.verb} au présent. La seconde construit le passé récent avec venons de ${input.verb}. Dans cette activité, le temps et le verbe sont donnés : tu construis la forme, tu ne choisis pas le verbe le plus naturel pour une situation libre.`,
    },
  ];
  return {
    id: `french-v3-teaching:passe-recent:modal:${input.verb}`,
    nodeKey: "produire_passe_recent",
    facetKey: `produire_passe_recent::verb:${input.verb}`,
    mode: "production",
    status: "draft_requires_review",
    titleFr: input.titleFr,
    learnerQuestionFr: `Comment construire le passé récent quand le verbe demandé est ${input.verb} ?`,
    steps,
    takeawayFr: `Repère le sujet, conjugue venir au présent, puis écris de et ${input.verb} à l’infinitif.`,
    boundaryFr: input.boundaryFr,
    practice,
    materialExposure: {
      words: ["venir", input.verb].map(value => ({ lemma: value, form: value })),
      sentences: [...steps.flatMap(step => step.exampleFr.split("\n")), ...completedGuided],
    },
  };
};

export const PASSE_RECENT_MODAL_TARGETS: readonly ModalTarget[] = [
  {
    registryId: "C001",
    verb: "vouloir",
    naturalnessScopeFr: "Le passé récent de vouloir peut présenter un désir apparu à l’instant. Selon la situation, une autre formulation peut être plus spontanée. Les questions imposent donc le verbe et vérifient seulement la construction de sa forme.",
    ownerReviewQuestionsFr: [
      "Chaque situation rend-elle plausible un désir apparu tout récemment ?",
      "La consigne indique-t-elle assez clairement que vouloir est imposé ?",
    ],
    lesson: lesson({
      registryId: "C001",
      verb: "vouloir",
      titleFr: "Construire le passé récent de vouloir",
      introductionExample: "Inès veut participer.\nEn voyant l’affiche, Inès vient de vouloir participer.",
      introductionExplanation: "La première phrase présente le désir maintenant. Dans la seconde, le désir apparaît à ce moment. Vient de vouloir le présente comme tout récent.",
      presentContrast: "Nous voulons revenir avec notre classe.",
      recentContrast: "Nous venons de vouloir revenir avec notre classe.",
      boundaryFr: "Cette leçon vérifie une transformation contrôlée : le passé récent et le verbe vouloir sont donnés. Elle ne prouve pas que tu choisirais spontanément vouloir dans un texte. Certaines situations appellent une formulation plus naturelle, que la relecture humaine doit encore juger.",
      guided: [
        ["1s", "En lisant l’annonce, je ___ participer au concours."],
        ["2s", "À la fin du film, tu ___ relire le livre."],
        ["3s", "En voyant la pluie, Sami ___ rentrer."],
        ["1p", "Après la répétition, nous ___ recommencer le dernier passage."],
        ["2p", "En découvrant le jardin, vous ___ y rester plus longtemps."],
        ["3p", "En entendant la musique, elles ___ danser."],
      ],
    }),
    initial: [
      seed("1s", "En voyant la carte, je ___ visiter cette région."),
      seed("2s", "Après ce message, tu ___ appeler ta cousine."),
      seed("3s", "En découvrant la photo, Lina ___ rencontrer cette artiste."),
      seed("1p", "À la sortie, nous ___ prolonger la promenade."),
      seed("2p", "En entendant la proposition, vous ___ participer au projet."),
      seed("3p", "Après avoir lu le récit, les élèves ___ connaître la suite."),
    ],
    learning: [
      seed("1s", "À la vue du sentier, je ___ marcher jusqu’au lac."),
      seed("2s", "En découvrant le programme, tu ___ assister au débat."),
      seed("3s", "Après cette rencontre, le journaliste ___ écrire un portrait."),
      seed("1p", "En retrouvant cette chanson, nous ___ l’écouter ensemble."),
      seed("2p", "Après la visite, vous ___ revenir avec votre classe."),
      seed("3p", "En voyant les cerfs-volants, les enfants ___ en fabriquer un."),
    ],
  },
  {
    registryId: "C002",
    verb: "savoir",
    naturalnessScopeFr: "Venir de savoir que peut indiquer qu’une information vient d’être connue, mais venir d’apprendre que est souvent plus spontané. Le remplacement par apprendre n’est pas accepté ici, car la cible approuvée porte exactement sur savoir.",
    ownerReviewQuestionsFr: [
      "Le registre accepte-t-il venir de savoir que pour les élèves visés ?",
      "La limite avec la formulation plus courante venir d’apprendre que est-elle assez visible sans changer la cible ?",
    ],
    lesson: lesson({
      registryId: "C002",
      verb: "savoir",
      titleFr: "Construire le passé récent de savoir",
      introductionExample: "Lina sait que la rencontre est reportée.\nLina vient de savoir que la rencontre est reportée.",
      introductionExplanation: "La première phrase dit que Lina possède l’information maintenant. La seconde insiste sur le moment très récent où elle l’a reçue.",
      presentContrast: "Nous savons que la salle est libre.",
      recentContrast: "Nous venons de savoir que la salle est libre.",
      boundaryFr: "Cette leçon vérifie la construction demandée avec savoir. Dans de nombreux contextes, venir d’apprendre que est plus spontané pour une nouvelle reçue, mais apprendre n’est pas le verbe évalué ici. Une réponse correcte ne prouve pas le choix naturel du verbe dans une production libre.",
      guided: [
        ["1s", "À l’instant, je ___ que le train partira plus tard."],
        ["2s", "Après cet appel, tu ___ que ton équipe est qualifiée."],
        ["3s", "Par ce message, Ana ___ que son dossier est accepté."],
        ["1p", "À l’instant, nous ___ que la salle est disponible."],
        ["2p", "Après la réunion, vous ___ que la date a changé."],
        ["3p", "Par la radio, ils ___ que la route est rouverte."],
      ],
    }),
    initial: [
      seed("1s", "Par ce courriel, je ___ que mon inscription est confirmée."),
      seed("2s", "À l’instant, tu ___ que le musée ferme plus tôt."),
      seed("3s", "Après cet appel, Malik ___ que son colis est arrivé."),
      seed("1p", "Par l’annonce, nous ___ que le concert est maintenu."),
      seed("2p", "À l’instant, vous ___ que votre demande est retenue."),
      seed("3p", "Après le conseil, les délégués ___ que la sortie est autorisée."),
    ],
    learning: [
      seed("1s", "Après ce bulletin, je ___ que l’école ouvrira demain."),
      seed("2s", "Par ce mot, tu ___ que Léa sera absente."),
      seed("3s", "À l’instant, la gardienne ___ que le match est déplacé."),
      seed("1p", "Après la visite, nous ___ que le bâtiment sera rénové."),
      seed("2p", "Par cette lettre, vous ___ que le prix vous est attribué."),
      seed("3p", "À l’instant, les familles ___ que le bus est arrivé."),
    ],
  },
  {
    registryId: "C003",
    verb: "devoir",
    naturalnessScopeFr: "Le passé récent de devoir présente une obligation rencontrée ou accomplie il y a peu. Les compléments fournis rendent cette lecture explicite, mais la réponse reste une production contrôlée de forme.",
    ownerReviewQuestionsFr: [
      "Chaque situation exprime-t-elle clairement une obligation récente plutôt qu’une supposition ?",
      "Les compléments permettent-ils de comprendre devoir sans transformer l’exercice en choix lexical ?",
    ],
    lesson: lesson({
      registryId: "C003",
      verb: "devoir",
      titleFr: "Construire le passé récent de devoir",
      introductionExample: "Inès doit annuler la sortie.\nÀ cause de l’orage, Inès vient de devoir annuler la sortie.",
      introductionExplanation: "La première phrase présente une obligation actuelle. La seconde présente une obligation rencontrée juste avant le moment où l’on parle.",
      presentContrast: "Nous devons modifier le programme.",
      recentContrast: "Nous venons de devoir modifier le programme.",
      boundaryFr: "Cette leçon porte sur l’obligation récente. Devoir peut aussi servir à exprimer une supposition, par exemple il doit être midi. Cette autre valeur et le choix du verbe dans une production libre ne sont pas évalués ici.",
      guided: [
        ["1s", "À cause d’une erreur, je ___ refaire le calcul."],
        ["2s", "Après la panne, tu ___ redémarrer l’ordinateur."],
        ["3s", "Faute de place, Zoé ___ déplacer la table."],
        ["1p", "À cause du vent, nous ___ fermer les fenêtres."],
        ["2p", "Après le changement, vous ___ modifier votre affiche."],
        ["3p", "Faute de lumière, ils ___ arrêter la répétition."],
      ],
    }),
    initial: [
      seed("1s", "À cause du retard, je ___ reporter mon rendez-vous."),
      seed("2s", "Après cette erreur, tu ___ corriger le formulaire."),
      seed("3s", "Faute de batterie, Luc ___ emprunter un téléphone."),
      seed("1p", "À cause de la pluie, nous ___ déplacer le spectacle."),
      seed("2p", "Après la consigne, vous ___ recommencer l’expérience."),
      seed("3p", "Faute de billets, les visiteurs ___ choisir une autre séance."),
    ],
    learning: [
      seed("1s", "Après la fermeture, je ___ prendre un autre chemin."),
      seed("2s", "À cause du bruit, tu ___ répéter ta réponse."),
      seed("3s", "Faute de clé, Nora ___ attendre devant la porte."),
      seed("1p", "Après cette annonce, nous ___ changer notre programme."),
      seed("2p", "À cause du règlement, vous ___ laisser les vélos dehors."),
      seed("3p", "Faute de temps, les élèves ___ terminer le travail chez eux."),
    ],
  },
] as const;

export const PASSE_RECENT_MODAL_QUESTIONS: readonly PasseRecentModalQuestion[] = PASSE_RECENT_MODAL_TARGETS.flatMap(target =>
  (["initial", "learning"] as const).flatMap(pool => target[pool].map(question => ({
    ...question,
    registryId: target.registryId,
    verb: target.verb,
    pool,
    answer: conjugate(target.verb, "passe_recent", question.person),
  }))),
);

export const PASSE_RECENT_MODAL_TEACHING: readonly TargetTeachingContent[] = PASSE_RECENT_MODAL_TARGETS.map(target => target.lesson);
