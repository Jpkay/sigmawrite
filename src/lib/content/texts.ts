import type { SeedText } from "./types";

/**
 * Manually-authored seed texts (PRD §25 Phase 1). Evergreen topics, no
 * unverified statistics (PRD §27 Risk 3). These mirror what the AI pipeline
 * will later produce and what gets inserted into `text_versions`.
 */
export const SEED_TEXTS: SeedText[] = [
  {
    id: "football-migration",
    title: "Pourquoi de jeunes footballeurs quittent leur pays",
    primaryInterest: "football",
    primaryDomain: "geography",
    concepts: ["migration", "opportunité économique"],
    textType: "expository",
    difficultyBand: "Secondary 7A",
    wordCount: 320,
    body: [
      "Chaque année, de jeunes footballeurs quittent leur pays pour rejoindre un club étranger. Beaucoup rêvent de jouer un jour dans un grand championnat européen. Ce déplacement de personnes d'un endroit vers un autre porte un nom : la migration.",
      "Pourquoi partir si loin de sa famille ? La raison principale est l'opportunité économique. Dans certains pays, il existe peu de clubs capables de payer correctement les joueurs. Ailleurs, les salaires sont plus élevés et les installations sont meilleures. Un jeune talent pense donc qu'il aura de meilleures chances de réussir en partant.",
      "Cette migration n'est pas toujours simple. Le jeune joueur doit s'adapter à une nouvelle langue, à un climat différent et à une autre culture. Certains réussissent et deviennent des stars. D'autres, en revanche, ne trouvent pas de club et se retrouvent dans une situation difficile, loin de chez eux.",
      "Le football ressemble ainsi à d'autres formes de migration. Partout dans le monde, des personnes quittent leur région pour chercher du travail, souvent dans les grandes villes. Comprendre la migration des footballeurs aide donc à comprendre un phénomène bien plus large.",
    ],
    targetVocabulary: [
      { word: "migration", definitionFr: "Quand des personnes quittent un lieu pour aller vivre ou travailler ailleurs.", examplesFr: ["Une famille part de son village pour habiter en ville : c’est une migration.", "Un joueur quitte son pays pour rejoindre un club étranger."], grade: 7, relatedTopics: ["football", "géographie", "travail"] },
      { word: "opportunité", definitionFr: "Une bonne occasion qui permet d’essayer, de réussir ou d’améliorer sa situation.", examplesFr: ["Le club lui propose un essai : c’est une opportunité de montrer son talent.", "Une formation gratuite est une opportunité d’apprendre un métier."], grade: 7, relatedTopics: ["football", "travail", "école"] },
      { word: "s'adapter", definitionFr: "Changer certaines habitudes pour être à l’aise dans une situation nouvelle.", examplesFr: ["Le joueur apprend la langue de ses coéquipiers pour s’adapter.", "Dans une nouvelle école, Amina observe les règles puis adapte ses habitudes."], grade: 7, relatedTopics: ["football", "école", "voyage"] },
      { word: "phénomène", definitionFr: "Un fait que plusieurs personnes peuvent observer et chercher à comprendre.", examplesFr: ["La pluie qui tombe chaque saison est un phénomène naturel.", "Le départ de nombreux jeunes vers les villes est un phénomène social."], grade: 7, relatedTopics: ["science", "géographie", "société"] },
    ],
    questions: [
      {
        id: "q1",
        type: "literal",
        skillKey: "literal_comprehension",
        prompt: "D'après le texte, qu'est-ce que la migration ?",
        choices: [
          "Le déplacement de personnes d'un endroit vers un autre",
          "Le fait de gagner un match important",
          "Le changement de poste sur le terrain",
          "L'entraînement quotidien d'un joueur",
        ],
        correctIndex: 0,
        explanationFr: "Le premier paragraphe définit la migration comme un déplacement de personnes.",
      },
      {
        id: "q2",
        type: "cause_consequence",
        skillKey: "cause_consequence",
        prompt: "Quelle est la raison principale pour laquelle ces jeunes partent ?",
        answerFormat: "short_answer",
        studentInstruction: "Écris une ou deux phrases. Nomme la raison et explique ce qu’elle peut améliorer.",
        acceptedConcepts: ["opportunité économique", "meilleures chances", "réussir", "salaires plus élevés"],
        modelAnswer: "Ils partent surtout pour une opportunité économique : ils espèrent être mieux payés et avoir de meilleures chances de réussir.",
        scoringCriteria: [{ label: "Nomme la raison économique", conceptIds: ["opportunité économique", "salaires plus élevés"], points: 1 }, { label: "Explique le bénéfice attendu", conceptIds: ["meilleures chances", "réussir"], points: 1 }],
        choices: [
          "Ils n'aiment pas leur pays",
          "L'opportunité économique : de meilleures chances de réussir",
          "Ils veulent apprendre une nouvelle langue",
          "Le climat est trop chaud chez eux",
        ],
        correctIndex: 1,
        explanationFr: "Le deuxième paragraphe indique que la raison principale est l'opportunité économique.",
      },
      {
        id: "q3",
        type: "vocabulary_in_context",
        skillKey: "vocabulary_in_context",
        prompt: "Dans le texte, « s'adapter » à une nouvelle langue signifie…",
        choices: [
          "refuser de parler",
          "oublier sa langue d'origine",
          "se modifier pour convenir à la nouvelle situation",
          "voyager rapidement",
        ],
        correctIndex: 2,
        explanationFr: "S'adapter, c'est se modifier pour convenir à une situation nouvelle.",
      },
      {
        id: "q4",
        type: "inference",
        skillKey: "inference",
        prompt: "Que peut-on déduire du texte au sujet de cette migration ?",
        choices: [
          "Elle réussit toujours",
          "Elle est sans risque",
          "Elle peut réussir pour certains et échouer pour d'autres",
          "Elle concerne seulement le football",
        ],
        correctIndex: 2,
        explanationFr: "Le texte oppose ceux qui deviennent des stars à ceux qui se retrouvent en difficulté.",
      },
      {
        id: "q5",
        type: "main_idea",
        skillKey: "main_idea",
        prompt: "Quelle est l'idée principale du texte ?",
        choices: [
          "Le football est un sport difficile",
          "La migration des footballeurs éclaire un phénomène plus large",
          "Les grandes villes sont surpeuplées",
          "Les salaires des joueurs sont trop élevés",
        ],
        correctIndex: 1,
        explanationFr: "Le dernier paragraphe relie la migration des footballeurs à un phénomène mondial.",
      },
    ],
    summaryPrompt:
      "Résume le texte en 2 ou 3 phrases. Garde l'idée principale et le lien entre migration et opportunité.",
    retrievalPrompt: "Avec tes mots, qu'est-ce que la migration ?",
  },
  {
    id: "social-media-attention",
    title: "Pourquoi les applications cherchent à capter ton attention",
    primaryInterest: "social_media",
    primaryDomain: "media_literacy",
    concepts: ["biais", "opportunité économique"],
    textType: "expository",
    difficultyBand: "Secondary 7B",
    wordCount: 340,
    body: [
      "Quand tu ouvres une application de réseau social, tout semble pensé pour que tu restes le plus longtemps possible. Ce n'est pas un hasard. Les entreprises gagnent de l'argent grâce à la publicité : plus tu regardes, plus elles peuvent te montrer d'annonces.",
      "Pour te garder, les applications utilisent des techniques précises. Les notifications attirent ton attention. Le défilement sans fin t'empêche de t'arrêter. Les vidéos courtes s'enchaînent automatiquement. Chaque détail vise un même but : capter ton attention le plus souvent possible.",
      "Ce système peut créer un biais dans ta façon de voir le monde. Comme l'application te montre surtout ce qui te fait réagir, tu vois toujours le même type de contenu. Tu peux alors croire que tout le monde pense comme toi, alors que ce n'est pas le cas.",
      "Comprendre ce fonctionnement ne signifie pas qu'il faut tout supprimer. Cela permet plutôt de choisir : décider quand utiliser ces applications, et garder ton esprit critique face à ce qu'elles te montrent.",
    ],
    targetVocabulary: [
      { word: "capter", definitionFr: "Attirer quelque chose puis le garder, comme le regard ou l’attention d’une personne.", examplesFr: ["Une vidéo colorée capte ton regard quand tu ouvres l’application.", "Le professeur pose une question surprenante pour capter l’attention de la classe."], grade: 7, relatedTopics: ["réseaux sociaux", "médias", "école"] },
      { word: "biais", definitionFr: "Une façon de penser qui pousse le jugement dans une direction sans montrer toute la réalité.", examplesFr: ["Si l’application ne montre que les avis que tu aimes, elle crée un biais.", "Interroger seulement ses amis donne une réponse avec un biais, car d’autres avis manquent."], grade: 7, relatedTopics: ["réseaux sociaux", "médias", "information"] },
      { word: "esprit critique", definitionFr: "L’habitude de vérifier une information, de demander des preuves et de comparer plusieurs points de vue avant de la croire.", examplesFr: ["Aline cherche la source d’une vidéo avant de la partager : elle utilise son esprit critique.", "Comparer deux articles aide à garder son esprit critique face à une rumeur."], grade: 7, relatedTopics: ["réseaux sociaux", "information", "école"] },
      { word: "notification", definitionFr: "Un petit message affiché par un appareil pour signaler qu’une chose nouvelle vient d’arriver.", examplesFr: ["Mon téléphone affiche une notification quand je reçois un message.", "L’application envoie une notification pour annoncer une nouvelle vidéo."], grade: 7, relatedTopics: ["réseaux sociaux", "technologie", "médias"] },
    ],
    questions: [
      {
        id: "q1",
        type: "literal",
        skillKey: "literal_comprehension",
        prompt: "Comment les entreprises de réseaux sociaux gagnent-elles de l'argent, d'après le texte ?",
        choices: [
          "En vendant des téléphones",
          "Grâce à la publicité",
          "En faisant payer chaque message",
          "En organisant des concours",
        ],
        correctIndex: 1,
        explanationFr: "Le premier paragraphe explique qu'elles gagnent de l'argent grâce à la publicité.",
      },
      {
        id: "q2",
        type: "cause_consequence",
        skillKey: "cause_consequence",
        prompt: "Pourquoi les applications utilisent-elles des notifications et le défilement sans fin ?",
        choices: [
          "Pour te faire payer",
          "Pour capter ton attention le plus longtemps possible",
          "Pour économiser de la batterie",
          "Pour t'apprendre à lire",
        ],
        correctIndex: 1,
        explanationFr: "Le deuxième paragraphe indique que ces techniques visent à capter l'attention.",
      },
      {
        id: "q3",
        type: "vocabulary_in_context",
        skillKey: "vocabulary_in_context",
        prompt: "Dans le texte, un « biais » est…",
        choices: [
          "une publicité",
          "une inclination qui déforme le jugement",
          "un type de vidéo",
          "une notification",
        ],
        correctIndex: 1,
        explanationFr: "Un biais déforme la façon de voir, comme l'explique le troisième paragraphe.",
      },
      {
        id: "q4",
        type: "inference",
        skillKey: "inference",
        prompt: "Que suggère le texte sur la solution à adopter ?",
        answerFormat: "short_answer",
        studentInstruction: "Réponds en une ou deux phrases. Donne l’action proposée et l’attitude à garder.",
        acceptedConcepts: ["choisir quand", "utiliser", "esprit critique", "vérifier"],
        modelAnswer: "Le texte conseille de choisir quand utiliser les réseaux sociaux et de garder son esprit critique face aux contenus.",
        scoringCriteria: [{ label: "Donne une action concrète", conceptIds: ["choisir quand", "utiliser"], points: 1 }, { label: "Nomme l’attitude de vérification", conceptIds: ["esprit critique", "vérifier"], points: 1 }],
        choices: [
          "Tout supprimer immédiatement",
          "Ne jamais utiliser de réseaux sociaux",
          "Choisir quand les utiliser et garder son esprit critique",
          "Croire tout ce qu'on y voit",
        ],
        correctIndex: 2,
        explanationFr: "Le dernier paragraphe propose de choisir et de garder son esprit critique.",
      },
      {
        id: "q5",
        type: "main_idea",
        skillKey: "main_idea",
        prompt: "Quelle est l'idée principale du texte ?",
        choices: [
          "Les réseaux sociaux sont dangereux",
          "Les applications sont conçues pour capter l'attention, et le comprendre aide à mieux choisir",
          "La publicité est interdite",
          "Les vidéos courtes sont les meilleures",
        ],
        correctIndex: 1,
        explanationFr: "Le texte explique le fonctionnement puis invite à un usage choisi et critique.",
      },
    ],
    summaryPrompt:
      "Résume le texte en 2 ou 3 phrases. Explique pourquoi les applications cherchent ton attention et ce que tu peux faire.",
    retrievalPrompt: "Avec tes mots, qu'est-ce qu'un biais dans ce que te montre une application ?",
  },
];

export const SEED_TEXT_BY_ID: Record<string, SeedText> = Object.fromEntries(
  SEED_TEXTS.map((t) => [t.id, t])
);
