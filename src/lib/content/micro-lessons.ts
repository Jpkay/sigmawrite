/**
 * Foundation-repair micro-lessons (PRD §K). Format: a 2-minute explanation,
 * ~5 micro-questions, and one return-to-text question. Tone is mature and
 * age-respectful — a Grade 10 student with Grade 6 gaps must not get childish
 * content (§K UX rule).
 */
export type MicroQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanationFr: string;
};

export type MicroLesson = {
  skillKey: string;
  title: string;
  explanationFr: string;
  /** Key words/markers the lesson teaches. */
  markers: string[];
  questions: MicroQuestion[];
  returnToText: MicroQuestion;
};

export const MICRO_LESSONS: Record<string, MicroLesson> = {
  cause_consequence: {
    skillKey: "cause_consequence",
    title: "Cause et conséquence",
    explanationFr:
      "Certains mots signalent une cause (le pourquoi) ou une conséquence (le résultat). Les repérer aide à comprendre les liens logiques d'un texte.",
    markers: ["parce que", "puisque", "car", "donc", "par conséquent", "à cause de", "grâce à"],
    questions: [
      {
        prompt: "« Il pleut, donc le match est annulé. » Quel est le résultat ?",
        choices: ["Il pleut", "Le match est annulé", "Le match commence", "Il fait beau"],
        correctIndex: 1,
        explanationFr: "« donc » introduit la conséquence : le match est annulé.",
      },
      {
        prompt: "Quel mot exprime une cause ?",
        choices: ["donc", "par conséquent", "parce que", "ainsi"],
        correctIndex: 2,
        explanationFr: "« parce que » introduit la cause.",
      },
      {
        prompt: "« Grâce à l'entraînement, il a progressé. » Que montre « grâce à » ?",
        choices: ["une cause positive", "une conséquence négative", "une opposition", "un exemple"],
        correctIndex: 0,
        explanationFr: "« grâce à » introduit une cause au résultat favorable.",
      },
      {
        prompt: "Complète : « Les prix montent ___ les familles achètent moins. »",
        choices: ["par conséquent", "malgré", "bien que", "par exemple"],
        correctIndex: 0,
        explanationFr: "« par conséquent » relie la cause à sa conséquence.",
      },
      {
        prompt: "« À cause de la grève, les trains sont arrêtés. » La cause est…",
        choices: ["les trains", "la grève", "les voyageurs", "le retard"],
        correctIndex: 1,
        explanationFr: "« à cause de » introduit la cause : la grève.",
      },
    ],
    returnToText: {
      prompt:
        "Dans un texte : « Beaucoup de jeunes partent car les salaires sont plus élevés ailleurs. » Pourquoi partent-ils ?",
      choices: [
        "parce que les salaires sont plus élevés ailleurs",
        "parce qu'ils aiment voyager",
        "parce qu'il fait froid",
        "le texte ne le dit pas",
      ],
      correctIndex: 0,
      explanationFr: "« car » introduit la cause : des salaires plus élevés ailleurs.",
    },
  },
  academic_connectors: {
    skillKey: "academic_connectors",
    title: "Connecteurs d'opposition",
    explanationFr:
      "Les connecteurs d'opposition signalent un contraste entre deux idées. Les reconnaître évite de mal comprendre la position de l'auteur.",
    markers: ["mais", "pourtant", "cependant", "néanmoins", "en revanche", "alors que", "bien que"],
    questions: [
      {
        prompt: "« Il est doué, pourtant il échoue souvent. » Que montre « pourtant » ?",
        choices: ["une cause", "une opposition", "un exemple", "une addition"],
        correctIndex: 1,
        explanationFr: "« pourtant » oppose deux idées contraires.",
      },
      {
        prompt: "Quel mot n'exprime PAS une opposition ?",
        choices: ["cependant", "en revanche", "donc", "néanmoins"],
        correctIndex: 2,
        explanationFr: "« donc » exprime une conséquence, pas une opposition.",
      },
      {
        prompt: "« ___ il soit fatigué, il continue. »",
        choices: ["Bien que", "Parce que", "Donc", "Ainsi"],
        correctIndex: 0,
        explanationFr: "« Bien que » introduit une concession (opposition).",
      },
      {
        prompt: "« Le Nord est riche, ___ le Sud reste pauvre. »",
        choices: ["en revanche", "car", "grâce à", "par exemple"],
        correctIndex: 0,
        explanationFr: "« en revanche » marque le contraste entre deux situations.",
      },
      {
        prompt: "« Elle a étudié, mais a échoué. » Qu'attend-on après « mais » ?",
        choices: ["une idée attendue", "une idée contraire à l'attente", "une cause", "un exemple"],
        correctIndex: 1,
        explanationFr: "« mais » introduit une idée contraire à ce qu'on attendait.",
      },
    ],
    returnToText: {
      prompt:
        "« Les applications sont utiles, cependant elles captent trop notre attention. » Quelle est la nuance ?",
      choices: [
        "elles sont utiles mais ont un défaut",
        "elles sont totalement mauvaises",
        "elles sont parfaites",
        "le texte ne juge pas",
      ],
      correctIndex: 0,
      explanationFr: "« cependant » oppose l'utilité à un inconvénient.",
    },
  },
  summarization: {
    skillKey: "summarization",
    title: "Résumer un texte",
    explanationFr:
      "Résumer, c'est garder l'idée principale et les liens essentiels, en retirant les détails. Un bon résumé tient en 2 ou 3 phrases.",
    markers: ["idée principale", "retirer les détails", "garder la cause et l'effet"],
    questions: [
      {
        prompt: "Que doit-on garder dans un résumé ?",
        choices: ["tous les détails", "l'idée principale", "les exemples mineurs", "les chiffres exacts"],
        correctIndex: 1,
        explanationFr: "Un résumé garde l'idée principale, pas les détails.",
      },
      {
        prompt: "Un bon résumé fait environ…",
        choices: ["10 phrases", "2–3 phrases", "1 mot", "une page"],
        correctIndex: 1,
        explanationFr: "Deux à trois phrases suffisent.",
      },
      {
        prompt: "Que peut-on retirer d'un résumé ?",
        choices: ["l'idée principale", "le lien cause/effet", "les détails secondaires", "le sujet"],
        correctIndex: 2,
        explanationFr: "Les détails secondaires sont les premiers à retirer.",
      },
      {
        prompt: "Avant d'écrire, il faut d'abord…",
        choices: ["copier la première phrase", "trouver l'idée principale", "compter les mots", "changer le sujet"],
        correctIndex: 1,
        explanationFr: "On identifie d'abord l'idée principale.",
      },
      {
        prompt: "Un résumé doit-il garder ton avis personnel ?",
        choices: ["oui, surtout", "non, il reste fidèle au texte", "seulement à la fin", "uniquement les opinions"],
        correctIndex: 1,
        explanationFr: "Le résumé reste fidèle au texte, sans avis personnel.",
      },
    ],
    returnToText: {
      prompt:
        "Texte : « Les arbres en ville apportent de l'ombre et rafraîchissent l'air, donc les quartiers arborés sont plus agréables. » Meilleur résumé ?",
      choices: [
        "Les arbres rafraîchissent la ville et rendent les quartiers plus agréables.",
        "Il y a des arbres.",
        "Les villes ont des quartiers.",
        "L'ombre est grise.",
      ],
      correctIndex: 0,
      explanationFr: "Ce résumé garde l'idée principale et le lien cause/effet.",
    },
  },
};

export const MICRO_LESSON_KEYS = Object.keys(MICRO_LESSONS);
