/**
 * Diagnostic item bank (PRD §C). Compact 20–30 min equivalent: leveled
 * multiple-choice items across sections + skills, then a short written
 * summary. Each item carries the `grade` it represents so the scorer can
 * estimate a reading band, and a `skillKey` to seed skill estimates.
 */
export type DiagnosticSection =
  | "vocabulary_in_context"
  | "sentence_comprehension"
  | "paragraph_comprehension"
  | "expository"
  | "argumentative";

export type DiagnosticItem = {
  id: string;
  section: DiagnosticSection;
  skillKey: string;
  grade: number; // reading grade this item represents
  passage?: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
};

export const DIAGNOSTIC_ITEMS: DiagnosticItem[] = [
  {
    id: "d1",
    section: "vocabulary_in_context",
    skillKey: "vocabulary_in_context",
    grade: 6,
    prompt: "« Le climat de la région est aride. » Le mot « aride » signifie…",
    choices: ["très sec", "très froid", "très bruyant", "très peuplé"],
    correctIndex: 0,
  },
  {
    id: "d2",
    section: "vocabulary_in_context",
    skillKey: "vocabulary_in_context",
    grade: 8,
    prompt: "« Sa réussite est due à sa persévérance. » Le mot « persévérance » signifie…",
    choices: ["la chance", "le fait de continuer malgré les difficultés", "la rapidité", "la richesse"],
    correctIndex: 1,
  },
  {
    id: "d3",
    section: "sentence_comprehension",
    skillKey: "sentence_parsing",
    grade: 6,
    prompt:
      "« Bien qu'il soit fatigué, Karim termine ses devoirs. » Que comprend-on ?",
    choices: [
      "Karim ne fait pas ses devoirs",
      "Karim termine ses devoirs malgré la fatigue",
      "Karim est en pleine forme",
      "Karim dort",
    ],
    correctIndex: 1,
  },
  {
    id: "d4",
    section: "sentence_comprehension",
    skillKey: "academic_connectors",
    grade: 7,
    prompt:
      "« Les prix ont augmenté ; par conséquent, les familles achètent moins. » Le connecteur « par conséquent » exprime…",
    choices: ["une opposition", "une conséquence", "un exemple", "une condition"],
    correctIndex: 1,
  },
  {
    id: "d5",
    section: "paragraph_comprehension",
    skillKey: "main_idea",
    grade: 7,
    passage:
      "Les abeilles jouent un rôle essentiel. En transportant le pollen d'une fleur à l'autre, elles permettent à de nombreuses plantes de produire des fruits. Sans elles, une grande partie de notre alimentation serait menacée.",
    prompt: "Quelle est l'idée principale du paragraphe ?",
    choices: [
      "Les abeilles piquent",
      "Les abeilles sont essentielles à la production de nombreux aliments",
      "Les fleurs sont colorées",
      "Les fruits sont sucrés",
    ],
    correctIndex: 1,
  },
  {
    id: "d6",
    section: "paragraph_comprehension",
    skillKey: "inference",
    grade: 8,
    passage:
      "Quand Léa a vu les nuages noirs s'accumuler, elle a rangé ses affaires et a couru vers la maison sans dire un mot.",
    prompt: "Que peut-on déduire ?",
    choices: [
      "Il va sûrement pleuvoir",
      "Léa part en vacances",
      "C'est le matin",
      "Léa a gagné un prix",
    ],
    correctIndex: 0,
  },
  {
    id: "d7",
    section: "expository",
    skillKey: "cause_consequence",
    grade: 8,
    passage:
      "De nombreuses villes plantent des arbres dans les rues. Les arbres apportent de l'ombre et rafraîchissent l'air. En été, les quartiers arborés sont donc plus agréables et moins chauds que les quartiers de béton.",
    prompt: "Pourquoi les quartiers arborés sont-ils moins chauds ?",
    choices: [
      "Parce qu'ils sont plus anciens",
      "Parce que les arbres apportent de l'ombre et rafraîchissent l'air",
      "Parce qu'il y a moins de monde",
      "Parce que le béton est gratuit",
    ],
    correctIndex: 1,
  },
  {
    id: "d8",
    section: "argumentative",
    skillKey: "argument_structure",
    grade: 9,
    passage:
      "Certains pensent que les téléphones devraient être interdits à l'école car ils distraient les élèves. D'autres répondent qu'ils peuvent servir d'outils d'apprentissage si leur usage est encadré.",
    prompt: "Quelle est la structure de ce passage ?",
    choices: [
      "Il raconte une histoire",
      "Il présente deux points de vue opposés sur une question",
      "Il donne une recette",
      "Il décrit un paysage",
    ],
    correctIndex: 1,
  },
];

export const DIAGNOSTIC_SUMMARY_PROMPT =
  "Lis ce court texte, puis résume-le en 2 phrases : « Les arbres en ville apportent de l'ombre et rafraîchissent l'air. C'est pourquoi les quartiers arborés sont plus agréables en été. »";
