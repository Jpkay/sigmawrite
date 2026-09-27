import type {TargetTeachingContent} from './teaching-content';
export const LEXICAL_REFERENCE_CHAINS_DRAFTS = [
  {
    "key": "narrative-skater",
    "passage": "Yanis remporta la course de patinage. Le vainqueur leva les bras devant le public. Le jeune champion reçut ensuite une médaille.",
    "pronoun": "Le jeune champion",
    "sentence": "Le jeune champion reçut ensuite une médaille.",
    "answer": "Yanis",
    "distractors": [
      "le public",
      "la médaille",
      "la course"
    ],
    "support": "Yanis remporta la course de patinage.",
    "otherSpans": [
      "Le vainqueur leva les bras devant le public.",
      "Le jeune champion reçut ensuite une médaille."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "narrative",
    "question": "Dans ce texte, qui ou que désigne « Le jeune champion » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "narrative-fox",
    "passage": "Un renard se glissa sous la clôture. L’animal traversa le potager sans bruit. Le visiteur roux disparut derrière une haie.",
    "pronoun": "Le visiteur roux",
    "sentence": "Le visiteur roux disparut derrière une haie.",
    "answer": "le renard",
    "distractors": [
      "le potager",
      "la clôture",
      "la haie"
    ],
    "support": "Un renard se glissa sous la clôture.",
    "otherSpans": [
      "L’animal traversa le potager sans bruit.",
      "Le visiteur roux disparut derrière une haie."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "narrative",
    "question": "Dans ce texte, qui ou que désigne « Le visiteur roux » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "narrative-drone",
    "passage": "Sofia lança son drone au-dessus du terrain. Le petit appareil monta lentement. La machine volante filma le groupe depuis le ciel.",
    "pronoun": "La machine volante",
    "sentence": "La machine volante filma le groupe depuis le ciel.",
    "answer": "le drone",
    "distractors": [
      "Sofia",
      "le groupe",
      "le terrain"
    ],
    "support": "Sofia lança son drone au-dessus du terrain.",
    "otherSpans": [
      "Le petit appareil monta lentement.",
      "La machine volante filma le groupe depuis le ciel."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "narrative",
    "question": "Dans ce texte, qui ou que désigne « La machine volante » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "narrative-painter",
    "passage": "Mila peignait une fresque sur le mur du préau. L’artiste choisit une couleur vive. La créatrice du dessin recula pour regarder son travail.",
    "pronoun": "La créatrice du dessin",
    "sentence": "La créatrice du dessin recula pour regarder son travail.",
    "answer": "Mila",
    "distractors": [
      "la fresque",
      "le préau",
      "la couleur"
    ],
    "support": "Mila peignait une fresque sur le mur du préau.",
    "otherSpans": [
      "L’artiste choisit une couleur vive.",
      "La créatrice du dessin recula pour regarder son travail."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "narrative",
    "question": "Dans ce texte, qui ou que désigne « La créatrice du dessin » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "narrative-boat",
    "passage": "Un voilier entra dans le port. Le bateau passa près de la jetée. L’embarcation s’arrêta enfin au quai.",
    "pronoun": "L’embarcation",
    "sentence": "L’embarcation s’arrêta enfin au quai.",
    "answer": "le voilier",
    "distractors": [
      "la jetée",
      "le port",
      "le quai"
    ],
    "support": "Un voilier entra dans le port.",
    "otherSpans": [
      "Le bateau passa près de la jetée.",
      "L’embarcation s’arrêta enfin au quai."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "narrative",
    "question": "Dans ce texte, qui ou que désigne « L’embarcation » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "narrative-manga",
    "passage": "Noam retrouva son manga sous le lit. Le livre avait une page pliée. Le volume abîmé retrouva sa place sur l’étagère.",
    "pronoun": "Le volume abîmé",
    "sentence": "Le volume abîmé retrouva sa place sur l’étagère.",
    "answer": "le manga",
    "distractors": [
      "le lit",
      "la page seule",
      "l’étagère"
    ],
    "support": "Noam retrouva son manga sous le lit.",
    "otherSpans": [
      "Le livre avait une page pliée.",
      "Le volume abîmé retrouva sa place sur l’étagère."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "narrative",
    "question": "Dans ce texte, qui ou que désigne « Le volume abîmé » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "narrative-dog",
    "passage": "Une chienne attendait devant le portail. La bête remuait la queue en voyant Sam. La nouvelle compagne de Sam entra dans la cour avec lui.",
    "pronoun": "La nouvelle compagne de Sam",
    "sentence": "La nouvelle compagne de Sam entra dans la cour avec lui.",
    "answer": "la chienne",
    "distractors": [
      "Sam",
      "la queue",
      "la cour"
    ],
    "support": "Une chienne attendait devant le portail.",
    "otherSpans": [
      "La bête remuait la queue en voyant Sam.",
      "La nouvelle compagne de Sam entra dans la cour avec lui."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "narrative",
    "question": "Dans ce texte, qui ou que désigne « La nouvelle compagne de Sam » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "narrative-bike",
    "passage": "Lou sortit son vélo du garage. La bicyclette avait les pneus dégonflés. Le deux-roues resta près de la pompe pendant la réparation.",
    "pronoun": "Le deux-roues",
    "sentence": "Le deux-roues resta près de la pompe pendant la réparation.",
    "answer": "le vélo",
    "distractors": [
      "la pompe",
      "le garage",
      "les pneus seuls"
    ],
    "support": "Lou sortit son vélo du garage.",
    "otherSpans": [
      "La bicyclette avait les pneus dégonflés.",
      "Le deux-roues resta près de la pompe pendant la réparation."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "narrative",
    "question": "Dans ce texte, qui ou que désigne « Le deux-roues » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "informational-badge",
    "passage": "Un badge nominatif est remis à chaque participant. Ce laissez-passer permet d’entrer dans les ateliers. Le document doit être conservé pendant toute la journée.",
    "pronoun": "Le document",
    "sentence": "Le document doit être conservé pendant toute la journée.",
    "answer": "le badge nominatif",
    "distractors": [
      "chaque participant",
      "les ateliers",
      "la journée"
    ],
    "support": "Un badge nominatif est remis à chaque participant.",
    "otherSpans": [
      "Ce laissez-passer permet d’entrer dans les ateliers.",
      "Le document doit être conservé pendant toute la journée."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "informational",
    "question": "Dans ce texte, qui ou que désigne « Le document » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "informational-guide",
    "passage": "Le guide du musée accompagne les groupes. Ce professionnel présente les salles ouvertes à la visite. L’accompagnateur répond aussi aux questions sur le parcours.",
    "pronoun": "L’accompagnateur",
    "sentence": "L’accompagnateur répond aussi aux questions sur le parcours.",
    "answer": "le guide du musée",
    "distractors": [
      "les groupes",
      "le parcours",
      "les salles"
    ],
    "support": "Le guide du musée accompagne les groupes.",
    "otherSpans": [
      "Ce professionnel présente les salles ouvertes à la visite.",
      "L’accompagnateur répond aussi aux questions sur le parcours."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "informational",
    "question": "Dans ce texte, qui ou que désigne « L’accompagnateur » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "informational-tank",
    "passage": "Une cuve récupère l’eau de pluie. Ce réservoir est placé derrière le bâtiment. Le contenant possède un couvercle fermé.",
    "pronoun": "Le contenant",
    "sentence": "Le contenant possède un couvercle fermé.",
    "answer": "la cuve",
    "distractors": [
      "le bâtiment",
      "le couvercle seul",
      "l’eau de pluie"
    ],
    "support": "Une cuve récupère l’eau de pluie.",
    "otherSpans": [
      "Ce réservoir est placé derrière le bâtiment.",
      "Le contenant possède un couvercle fermé."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "informational",
    "question": "Dans ce texte, qui ou que désigne « Le contenant » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "informational-shuttle",
    "passage": "Une navette relie le parking à l’entrée du parc. Le véhicule part toutes les vingt minutes. Ce moyen de transport est accessible avec le billet du parc.",
    "pronoun": "Ce moyen de transport",
    "sentence": "Ce moyen de transport est accessible avec le billet du parc.",
    "answer": "la navette",
    "distractors": [
      "le parking",
      "le billet",
      "l’entrée du parc"
    ],
    "support": "Une navette relie le parking à l’entrée du parc.",
    "otherSpans": [
      "Le véhicule part toutes les vingt minutes.",
      "Ce moyen de transport est accessible avec le billet du parc."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "informational",
    "question": "Dans ce texte, qui ou que désigne « Ce moyen de transport » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "informational-manual",
    "passage": "Un manuel est fourni avec le télescope. Cet ouvrage explique le montage du matériel. Le livre contient aussi un schéma des différentes pièces.",
    "pronoun": "Le livre",
    "sentence": "Le livre contient aussi un schéma des différentes pièces.",
    "answer": "le manuel",
    "distractors": [
      "le télescope",
      "le matériel",
      "le schéma seul"
    ],
    "support": "Un manuel est fourni avec le télescope.",
    "otherSpans": [
      "Cet ouvrage explique le montage du matériel.",
      "Le livre contient aussi un schéma des différentes pièces."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "informational",
    "question": "Dans ce texte, qui ou que désigne « Le livre » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "informational-printer",
    "passage": "Une imprimante est disponible dans la salle informatique. L’appareil accepte les fichiers envoyés depuis les ordinateurs du club. Cette machine fonctionne avec la carte de membre.",
    "pronoun": "Cette machine",
    "sentence": "Cette machine fonctionne avec la carte de membre.",
    "answer": "l’imprimante",
    "distractors": [
      "les ordinateurs",
      "les fichiers",
      "la carte de membre"
    ],
    "support": "Une imprimante est disponible dans la salle informatique.",
    "otherSpans": [
      "L’appareil accepte les fichiers envoyés depuis les ordinateurs du club.",
      "Cette machine fonctionne avec la carte de membre."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "informational",
    "question": "Dans ce texte, qui ou que désigne « Cette machine » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "informational-shelter",
    "passage": "Un abri couvert se trouve près du départ du sentier. Cette construction permet d’attendre à l’écart de la pluie. Le petit bâtiment reste ouvert toute l’année.",
    "pronoun": "Le petit bâtiment",
    "sentence": "Le petit bâtiment reste ouvert toute l’année.",
    "answer": "l’abri couvert",
    "distractors": [
      "le sentier",
      "le départ seul",
      "la pluie"
    ],
    "support": "Un abri couvert se trouve près du départ du sentier.",
    "otherSpans": [
      "Cette construction permet d’attendre à l’écart de la pluie.",
      "Le petit bâtiment reste ouvert toute l’année."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "informational",
    "question": "Dans ce texte, qui ou que désigne « Le petit bâtiment » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "informational-newsletter",
    "passage": "Une lettre d’information est envoyée chaque mois aux adhérents. Cette publication annonce les rencontres à venir. Le bulletin contient les dates et les lieux de rendez-vous.",
    "pronoun": "Le bulletin",
    "sentence": "Le bulletin contient les dates et les lieux de rendez-vous.",
    "answer": "la lettre d’information",
    "distractors": [
      "les adhérents",
      "les rencontres",
      "les lieux de rendez-vous"
    ],
    "support": "Une lettre d’information est envoyée chaque mois aux adhérents.",
    "otherSpans": [
      "Cette publication annonce les rencontres à venir.",
      "Le bulletin contient les dates et les lieux de rendez-vous."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "informational",
    "question": "Dans ce texte, qui ou que désigne « Le bulletin » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "argumentative-library",
    "passage": "Je souhaite que la bibliothèque ouvre le samedi. Ce lieu de lecture serait alors accessible aux familles qui travaillent en semaine. Cet espace culturel mérite des horaires plus larges.",
    "pronoun": "Cet espace culturel",
    "sentence": "Cet espace culturel mérite des horaires plus larges.",
    "answer": "la bibliothèque",
    "distractors": [
      "le samedi",
      "les familles",
      "les horaires"
    ],
    "support": "Je souhaite que la bibliothèque ouvre le samedi.",
    "otherSpans": [
      "Ce lieu de lecture serait alors accessible aux familles qui travaillent en semaine.",
      "Cet espace culturel mérite des horaires plus larges."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "argumentative",
    "question": "Dans ce texte, qui ou que désigne « Cet espace culturel » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "argumentative-bike",
    "passage": "Le vélo devrait avoir plus de place dans nos déplacements. Ce véhicule permet de faire de courts trajets sans moteur. Ce moyen de transport mérite donc des chemins adaptés.",
    "pronoun": "Ce moyen de transport",
    "sentence": "Ce moyen de transport mérite donc des chemins adaptés.",
    "answer": "le vélo",
    "distractors": [
      "les chemins",
      "le moteur",
      "les trajets seuls"
    ],
    "support": "Le vélo devrait avoir plus de place dans nos déplacements.",
    "otherSpans": [
      "Ce véhicule permet de faire de courts trajets sans moteur.",
      "Ce moyen de transport mérite donc des chemins adaptés."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "argumentative",
    "question": "Dans ce texte, qui ou que désigne « Ce moyen de transport » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "argumentative-theatre",
    "passage": "Le club de théâtre devrait être maintenu. Cet atelier aide les élèves à travailler leur expression. Cette activité collective offre aussi une occasion de créer ensemble.",
    "pronoun": "Cette activité collective",
    "sentence": "Cette activité collective offre aussi une occasion de créer ensemble.",
    "answer": "le club de théâtre",
    "distractors": [
      "les élèves",
      "leur expression",
      "une création précise"
    ],
    "support": "Le club de théâtre devrait être maintenu.",
    "otherSpans": [
      "Cet atelier aide les élèves à travailler leur expression.",
      "Cette activité collective offre aussi une occasion de créer ensemble."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "argumentative",
    "question": "Dans ce texte, qui ou que désigne « Cette activité collective » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "argumentative-garden",
    "passage": "Je défends le projet de jardin partagé. Cet espace de culture permettrait aux habitants de se rencontrer. Ce terrain commun ne devrait pas devenir un parking.",
    "pronoun": "Ce terrain commun",
    "sentence": "Ce terrain commun ne devrait pas devenir un parking.",
    "answer": "le jardin partagé prévu",
    "distractors": [
      "un parking déjà construit",
      "les habitants",
      "les rencontres"
    ],
    "support": "Je défends le projet de jardin partagé.",
    "otherSpans": [
      "Cet espace de culture permettrait aux habitants de se rencontrer.",
      "Ce terrain commun ne devrait pas devenir un parking."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "argumentative",
    "question": "Dans ce texte, qui ou que désigne « Ce terrain commun » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "argumentative-repair",
    "passage": "Un atelier de réparation serait utile dans le quartier. Ce service aiderait à remettre les objets en état. Cette aide de proximité limiterait les achats de remplacement.",
    "pronoun": "Cette aide de proximité",
    "sentence": "Cette aide de proximité limiterait les achats de remplacement.",
    "answer": "l’atelier de réparation proposé",
    "distractors": [
      "le quartier entier",
      "les objets",
      "les achats de remplacement"
    ],
    "support": "Un atelier de réparation serait utile dans le quartier.",
    "otherSpans": [
      "Ce service aiderait à remettre les objets en état.",
      "Cette aide de proximité limiterait les achats de remplacement."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "argumentative",
    "question": "Dans ce texte, qui ou que désigne « Cette aide de proximité » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "argumentative-paper",
    "passage": "Le journal des élèves mérite un soutien. Cette publication donne une place à leurs idées. Ce média scolaire ne devrait pas disparaître faute de matériel.",
    "pronoun": "Ce média scolaire",
    "sentence": "Ce média scolaire ne devrait pas disparaître faute de matériel.",
    "answer": "le journal des élèves",
    "distractors": [
      "leurs idées seules",
      "le matériel",
      "les élèves"
    ],
    "support": "Le journal des élèves mérite un soutien.",
    "otherSpans": [
      "Cette publication donne une place à leurs idées.",
      "Ce média scolaire ne devrait pas disparaître faute de matériel."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "argumentative",
    "question": "Dans ce texte, qui ou que désigne « Ce média scolaire » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "argumentative-canteen",
    "passage": "Je propose un repas végétarien supplémentaire à la cantine. Cette option élargirait le choix des élèves. Cette possibilité devrait être discutée avec les cuisiniers.",
    "pronoun": "Cette possibilité",
    "sentence": "Cette possibilité devrait être discutée avec les cuisiniers.",
    "answer": "le repas végétarien supplémentaire proposé",
    "distractors": [
      "la cantine entière",
      "les cuisiniers",
      "le choix actuel uniquement"
    ],
    "support": "Je propose un repas végétarien supplémentaire à la cantine.",
    "otherSpans": [
      "Cette option élargirait le choix des élèves.",
      "Cette possibilité devrait être discutée avec les cuisiniers."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "argumentative",
    "question": "Dans ce texte, qui ou que désigne « Cette possibilité » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  },
  {
    "key": "argumentative-park",
    "passage": "Le petit parc du quartier doit rester ouvert. Ce lieu de promenade accueille des habitants de tous âges. Cet espace de détente est utile à la vie du quartier.",
    "pronoun": "Cet espace de détente",
    "sentence": "Cet espace de détente est utile à la vie du quartier.",
    "answer": "le petit parc",
    "distractors": [
      "les habitants",
      "tous les âges",
      "le quartier entier"
    ],
    "support": "Le petit parc du quartier doit rester ouvert.",
    "otherSpans": [
      "Ce lieu de promenade accueille des habitants de tous âges.",
      "Cet espace de détente est utile à la vie du quartier."
    ],
    "nodeKey": "suivre_chaine_lexicale",
    "genre": "argumentative",
    "question": "Dans ce texte, qui ou que désigne « Cet espace de détente » ?",
    "reason": "Suivre plusieurs noms ou reformulations qui désignent le même référent, sans confondre celui-ci avec une partie ou un élément du décor."
  }
];
export const LEXICAL_REFERENCE_CHAINS_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:lexical-chain:narrative",
    "nodeKey": "suivre_chaine_lexicale",
    "facetKey": "suivre_chaine_lexicale::text_type:narrative",
    "mode": "interpretation",
    "status": "draft_requires_review",
    "titleFr": "Suivre les mots qui désignent la même chose : récit",
    "learnerQuestionFr": "Parle-t-on encore de la même personne ou de la même chose ?",
    "steps": [
      {
        "exampleFr": "Un chat grimpa sur le banc. Le félin regarda la rue. L’animal sauta à terre.",
        "explanationFr": "Le texte change les mots, mais continue de parler de la même chose. Relie ces expressions entre elles : cette suite de reprises forme ici une chaîne lexicale."
      },
      {
        "exampleFr": "Un lapin se cache derrière un arbre. L’animal reste immobile. Le tronc est couvert de mousse.",
        "explanationFr": "Animal reprend lapin. Tronc désigne une partie de l’arbre, pas le lapin. Deux mots présents dans le même décor ne désignent pas forcément la même chose."
      }
    ],
    "practice": [
      {
        "id": "lexical-chain-narrative-guided-0",
        "promptFr": "Une tortue avançait sur le sable. Le reptile atteignit une pierre. La petite bête se cacha dessous.\n\nQui ou que désigne « La petite bête » ?",
        "choices": [
          "la tortue",
          "la pierre",
          "le sable",
          "une autre bête"
        ],
        "answerFr": "la tortue",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Tortue, reptile et petite bête désignent ici le même animal."
      },
      {
        "id": "lexical-chain-narrative-guided-1",
        "promptFr": "Adam écrivit un poème. Le texte plut à sa sœur. La création du jeune auteur fut affichée dans le salon.\n\nQui ou que désigne « La création du jeune auteur » ?",
        "choices": [
          "le poème",
          "Adam",
          "sa sœur",
          "le salon"
        ],
        "answerFr": "le poème",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Le texte puis la création reprennent le poème écrit par Adam."
      },
      {
        "id": "lexical-chain-narrative-guided-2",
        "promptFr": "Une camionnette arriva devant la maison. Le véhicule freina doucement. Le fourgon se gara près de la grille.\n\nQui ou que désigne « Le fourgon » ?",
        "choices": [
          "la camionnette",
          "la maison",
          "la grille",
          "une autre voiture"
        ],
        "answerFr": "la camionnette",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Camionnette, véhicule et fourgon désignent ici le même véhicule."
      },
      {
        "id": "lexical-chain-narrative-guided-3",
        "promptFr": "Nora gagna le tournoi. La gagnante salua son adversaire. La championne posa sa coupe sur la table.\n\nQui ou que désigne « La championne » ?",
        "choices": [
          "Nora",
          "son adversaire",
          "la coupe",
          "la table"
        ],
        "answerFr": "Nora",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Gagnante et championne reprennent Nora, qui a gagné le tournoi."
      }
    ],
    "takeawayFr": "Relie les expressions qui désignent le même élément. Distingue cet élément de ses parties et des autres choses du texte.",
    "boundaryFr": "Un mot de la même famille ou du même thème ne désigne pas forcément le même élément. Ici, chaîne lexicale signifie la suite des expressions qui gardent le même référent : la personne, la chose ou l’idée dont on parle.",
    "materialExposure": {
      "sentences": [
        "Un chat grimpa sur le banc. Le félin regarda la rue. L’animal sauta à terre.",
        "Un lapin se cache derrière un arbre. L’animal reste immobile. Le tronc est couvert de mousse.",
        "Une tortue avançait sur le sable. Le reptile atteignit une pierre. La petite bête se cacha dessous.",
        "Adam écrivit un poème. Le texte plut à sa sœur. La création du jeune auteur fut affichée dans le salon.",
        "Une camionnette arriva devant la maison. Le véhicule freina doucement. Le fourgon se gara près de la grille.",
        "Nora gagna le tournoi. La gagnante salua son adversaire. La championne posa sa coupe sur la table."
      ]
    }
  },
  {
    "id": "french-v3-teaching:lexical-chain:informational",
    "nodeKey": "suivre_chaine_lexicale",
    "facetKey": "suivre_chaine_lexicale::text_type:informational",
    "mode": "interpretation",
    "status": "draft_requires_review",
    "titleFr": "Suivre les mots qui désignent la même chose : texte informatif",
    "learnerQuestionFr": "Parle-t-on encore de la même personne ou de la même chose ?",
    "steps": [
      {
        "exampleFr": "Une armoire contient les dossiers. Ce meuble ferme à clé. Le meuble de rangement est réservé au personnel.",
        "explanationFr": "Le texte change les mots, mais continue de parler de la même chose. Relie ces expressions entre elles : cette suite de reprises forme ici une chaîne lexicale."
      },
      {
        "exampleFr": "Un lapin se cache derrière un arbre. L’animal reste immobile. Le tronc est couvert de mousse.",
        "explanationFr": "Animal reprend lapin. Tronc désigne une partie de l’arbre, pas le lapin. Deux mots présents dans le même décor ne désignent pas forcément la même chose."
      }
    ],
    "practice": [
      {
        "id": "lexical-chain-informational-guided-0",
        "promptFr": "Une bouilloire est disponible dans la cuisine. Cet appareil chauffe l’eau. La machine doit être débranchée après usage.\n\nQui ou que désigne « La machine » ?",
        "choices": [
          "la bouilloire",
          "la cuisine",
          "l’eau",
          "la prise"
        ],
        "answerFr": "la bouilloire",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Bouilloire, appareil et machine désignent ici le même équipement."
      },
      {
        "id": "lexical-chain-informational-guided-1",
        "promptFr": "Un plan du site est remis aux visiteurs. Ce document indique les sorties. La carte est aussi affichée à l’accueil.\n\nQui ou que désigne « La carte » ?",
        "choices": [
          "le plan du site",
          "les sorties",
          "les visiteurs",
          "l’accueil"
        ],
        "answerFr": "le plan du site",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Document et carte reprennent le plan fourni aux visiteurs."
      },
      {
        "id": "lexical-chain-informational-guided-2",
        "promptFr": "Une éducatrice accueille les enfants. Cette professionnelle organise les jeux. L’animatrice reste présente pendant toute la séance.\n\nQui ou que désigne « L’animatrice » ?",
        "choices": [
          "l’éducatrice",
          "les enfants",
          "la séance",
          "une autre personne"
        ],
        "answerFr": "l’éducatrice",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Le texte présente une seule personne, ensuite appelée professionnelle puis animatrice."
      },
      {
        "id": "lexical-chain-informational-guided-3",
        "promptFr": "Une cabane sert à ranger les outils. Cet abri est fermé le soir. La petite construction possède deux fenêtres.\n\nQui ou que désigne « La petite construction » ?",
        "choices": [
          "la cabane",
          "les outils",
          "le soir",
          "les fenêtres seules"
        ],
        "answerFr": "la cabane",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Abri et petite construction reprennent la cabane."
      }
    ],
    "takeawayFr": "Relie les expressions qui désignent le même élément. Distingue cet élément de ses parties et des autres choses du texte.",
    "boundaryFr": "Un mot de la même famille ou du même thème ne désigne pas forcément le même élément. Ici, chaîne lexicale signifie la suite des expressions qui gardent le même référent : la personne, la chose ou l’idée dont on parle.",
    "materialExposure": {
      "sentences": [
        "Une armoire contient les dossiers. Ce meuble ferme à clé. Le meuble de rangement est réservé au personnel.",
        "Un lapin se cache derrière un arbre. L’animal reste immobile. Le tronc est couvert de mousse.",
        "Une bouilloire est disponible dans la cuisine. Cet appareil chauffe l’eau. La machine doit être débranchée après usage.",
        "Un plan du site est remis aux visiteurs. Ce document indique les sorties. La carte est aussi affichée à l’accueil.",
        "Une éducatrice accueille les enfants. Cette professionnelle organise les jeux. L’animatrice reste présente pendant toute la séance.",
        "Une cabane sert à ranger les outils. Cet abri est fermé le soir. La petite construction possède deux fenêtres."
      ]
    }
  },
  {
    "id": "french-v3-teaching:lexical-chain:argumentative",
    "nodeKey": "suivre_chaine_lexicale",
    "facetKey": "suivre_chaine_lexicale::text_type:argumentative",
    "mode": "interpretation",
    "status": "draft_requires_review",
    "titleFr": "Suivre les mots qui désignent la même chose : argumentation",
    "learnerQuestionFr": "Parle-t-on encore de la même personne ou de la même chose ?",
    "steps": [
      {
        "exampleFr": "La piscine doit rester ouverte. Cet équipement permet aux habitants de nager. Ce lieu sportif est précieux pour la commune.",
        "explanationFr": "Le texte change les mots, mais continue de parler de la même chose. Relie ces expressions entre elles : cette suite de reprises forme ici une chaîne lexicale."
      },
      {
        "exampleFr": "Un lapin se cache derrière un arbre. L’animal reste immobile. Le tronc est couvert de mousse.",
        "explanationFr": "Animal reprend lapin. Tronc désigne une partie de l’arbre, pas le lapin. Deux mots présents dans le même décor ne désignent pas forcément la même chose."
      }
    ],
    "practice": [
      {
        "id": "lexical-chain-argumentative-guided-0",
        "promptFr": "Le concert de fin d’année doit être conservé. Cette rencontre rassemble les familles. Cet événement donne aussi un but aux répétitions.\n\nQui ou que désigne « Cet événement » ?",
        "choices": [
          "le concert",
          "les familles",
          "les répétitions",
          "l’année entière"
        ],
        "answerFr": "le concert",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Rencontre et événement reprennent le concert défendu dans la première phrase."
      },
      {
        "id": "lexical-chain-argumentative-guided-1",
        "promptFr": "Je souhaite garder la fontaine sur la place. Ce point d’eau sert aux passants. Cet équipement public ne devrait pas être supprimé.\n\nQui ou que désigne « Cet équipement public » ?",
        "choices": [
          "la fontaine",
          "la place",
          "les passants",
          "tous les équipements"
        ],
        "answerFr": "la fontaine",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Point d’eau puis équipement public désignent la fontaine."
      },
      {
        "id": "lexical-chain-argumentative-guided-2",
        "promptFr": "Un atelier de dessin serait utile. Cette activité permettrait de découvrir différentes techniques. Ce temps de création mérite une salle adaptée.\n\nQui ou que désigne « Ce temps de création » ?",
        "choices": [
          "l’atelier de dessin proposé",
          "les techniques seules",
          "la salle",
          "un cours déjà existant"
        ],
        "answerFr": "l’atelier de dessin proposé",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Activité et temps de création reprennent l’atelier proposé."
      },
      {
        "id": "lexical-chain-argumentative-guided-3",
        "promptFr": "Le pont piéton doit être réparé. Ce passage évite un long détour. Cet ouvrage est important pour les habitants.\n\nQui ou que désigne « Cet ouvrage » ?",
        "choices": [
          "le pont piéton",
          "le détour",
          "les habitants",
          "la réparation seule"
        ],
        "answerFr": "le pont piéton",
        "hintFr": "Reviens au premier nom et vérifie ce que chaque expression désigne.",
        "explanationFr": "Passage et ouvrage sont deux façons de nommer le pont."
      }
    ],
    "takeawayFr": "Relie les expressions qui désignent le même élément. Distingue cet élément de ses parties et des autres choses du texte.",
    "boundaryFr": "Un mot de la même famille ou du même thème ne désigne pas forcément le même élément. Ici, chaîne lexicale signifie la suite des expressions qui gardent le même référent : la personne, la chose ou l’idée dont on parle.",
    "materialExposure": {
      "sentences": [
        "La piscine doit rester ouverte. Cet équipement permet aux habitants de nager. Ce lieu sportif est précieux pour la commune.",
        "Un lapin se cache derrière un arbre. L’animal reste immobile. Le tronc est couvert de mousse.",
        "Le concert de fin d’année doit être conservé. Cette rencontre rassemble les familles. Cet événement donne aussi un but aux répétitions.",
        "Je souhaite garder la fontaine sur la place. Ce point d’eau sert aux passants. Cet équipement public ne devrait pas être supprimé.",
        "Un atelier de dessin serait utile. Cette activité permettrait de découvrir différentes techniques. Ce temps de création mérite une salle adaptée.",
        "Le pont piéton doit être réparé. Ce passage évite un long détour. Cet ouvrage est important pour les habitants."
      ]
    }
  }
];
