import type {TargetTeachingContent} from "./teaching-content";

/** Authored context interpretation, pending owner review. */
export const TENSE_MEANING_DRAFTS = [
  {
    "key": "imperfect-1",
    "nodeKey": "interpreter_imparfait",
    "prompt": "Chaque dimanche, Tom préparait le petit déjeuner pour sa famille.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "Une habitude dans le passé",
    "distractors": [
      "La description d’une situation passée",
      "Une action en cours à un moment passé"
    ],
    "assessedTexts": [
      "Chaque dimanche, Tom préparait le petit déjeuner pour sa famille."
    ],
    "reason": "Le repère de répétition présente une habitude passée.",
    "meaning": 0
  },
  {
    "key": "imperfect-2",
    "nodeKey": "interpreter_imparfait",
    "prompt": "Autrefois, nous empruntions ce pont tous les matins.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "Une habitude dans le passé",
    "distractors": [
      "La description d’une situation passée",
      "Une action en cours à un moment passé"
    ],
    "assessedTexts": [
      "Autrefois, nous empruntions ce pont tous les matins."
    ],
    "reason": "Le repère de répétition présente une habitude passée.",
    "meaning": 0
  },
  {
    "key": "imperfect-3",
    "nodeKey": "interpreter_imparfait",
    "prompt": "Durant cette période, les élèves lisaient dix minutes au début de chaque cours.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "Une habitude dans le passé",
    "distractors": [
      "La description d’une situation passée",
      "Une action en cours à un moment passé"
    ],
    "assessedTexts": [
      "Durant cette période, les élèves lisaient dix minutes au début de chaque cours."
    ],
    "reason": "Le repère de répétition présente une habitude passée.",
    "meaning": 0
  },
  {
    "key": "imperfect-4",
    "nodeKey": "interpreter_imparfait",
    "prompt": "Tous les étés, ma tante louait une chambre près du port.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "Une habitude dans le passé",
    "distractors": [
      "La description d’une situation passée",
      "Une action en cours à un moment passé"
    ],
    "assessedTexts": [
      "Tous les étés, ma tante louait une chambre près du port."
    ],
    "reason": "Le repère de répétition présente une habitude passée.",
    "meaning": 0
  },
  {
    "key": "imperfect-5",
    "nodeKey": "interpreter_imparfait",
    "prompt": "Le grenier était étroit et son plafond semblait très bas.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "La description d’une situation passée",
    "distractors": [
      "Une habitude dans le passé",
      "Une action en cours à un moment passé"
    ],
    "assessedTexts": [
      "Le grenier était étroit et son plafond semblait très bas."
    ],
    "reason": "Le passage donne les caractéristiques du cadre passé.",
    "meaning": 1
  },
  {
    "key": "imperfect-6",
    "nodeKey": "interpreter_imparfait",
    "prompt": "À cette époque, la façade portait une grande enseigne bleue.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "La description d’une situation passée",
    "distractors": [
      "Une habitude dans le passé",
      "Une action en cours à un moment passé"
    ],
    "assessedTexts": [
      "À cette époque, la façade portait une grande enseigne bleue."
    ],
    "reason": "Le passage donne les caractéristiques du cadre passé.",
    "meaning": 1
  },
  {
    "key": "imperfect-7",
    "nodeKey": "interpreter_imparfait",
    "prompt": "Dans mon souvenir, la cour ressemblait à un immense labyrinthe.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "La description d’une situation passée",
    "distractors": [
      "Une habitude dans le passé",
      "Une action en cours à un moment passé"
    ],
    "assessedTexts": [
      "Dans mon souvenir, la cour ressemblait à un immense labyrinthe."
    ],
    "reason": "Le passage donne les caractéristiques du cadre passé.",
    "meaning": 1
  },
  {
    "key": "imperfect-8",
    "nodeKey": "interpreter_imparfait",
    "prompt": "Le vieux salon avait deux fenêtres et ses murs étaient verts.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "La description d’une situation passée",
    "distractors": [
      "Une habitude dans le passé",
      "Une action en cours à un moment passé"
    ],
    "assessedTexts": [
      "Le vieux salon avait deux fenêtres et ses murs étaient verts."
    ],
    "reason": "Le passage donne les caractéristiques du cadre passé.",
    "meaning": 1
  },
  {
    "key": "imperfect-9",
    "nodeKey": "interpreter_imparfait",
    "prompt": "À quinze heures, Lina dessinait encore lorsque son frère est entré.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "Une action en cours à un moment passé",
    "distractors": [
      "Une habitude dans le passé",
      "La description d’une situation passée"
    ],
    "assessedTexts": [
      "À quinze heures, Lina dessinait encore lorsque son frère est entré."
    ],
    "reason": "Le passage situe une action en train de se dérouler au moment indiqué.",
    "meaning": 2
  },
  {
    "key": "imperfect-10",
    "nodeKey": "interpreter_imparfait",
    "prompt": "Quand la sonnette a retenti, nous cherchions une recette.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "Une action en cours à un moment passé",
    "distractors": [
      "Une habitude dans le passé",
      "La description d’une situation passée"
    ],
    "assessedTexts": [
      "Quand la sonnette a retenti, nous cherchions une recette."
    ],
    "reason": "Le passage situe une action en train de se dérouler au moment indiqué.",
    "meaning": 2
  },
  {
    "key": "imperfect-11",
    "nodeKey": "interpreter_imparfait",
    "prompt": "Au moment où le rideau s’est levé, les spectateurs discutaient encore.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "Une action en cours à un moment passé",
    "distractors": [
      "Une habitude dans le passé",
      "La description d’une situation passée"
    ],
    "assessedTexts": [
      "Au moment où le rideau s’est levé, les spectateurs discutaient encore."
    ],
    "reason": "Le passage situe une action en train de se dérouler au moment indiqué.",
    "meaning": 2
  },
  {
    "key": "imperfect-12",
    "nodeKey": "interpreter_imparfait",
    "prompt": "Lorsque le ballon est tombé, tu attachais tes chaussures.\n\nÀ quoi sert ici l’imparfait ?",
    "answer": "Une action en cours à un moment passé",
    "distractors": [
      "Une habitude dans le passé",
      "La description d’une situation passée"
    ],
    "assessedTexts": [
      "Lorsque le ballon est tombé, tu attachais tes chaussures."
    ],
    "reason": "Le passage situe une action en train de se dérouler au moment indiqué.",
    "meaning": 2
  },
  {
    "key": "future-1",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Selon les prévisions météo, le brouillard disparaîtra avant midi.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "Une prévision sur ce qui devrait se produire",
    "distractors": [
      "Un engagement pris envers quelqu’un",
      "La présentation d’un projet à venir"
    ],
    "assessedTexts": [
      "Selon les prévisions météo, le brouillard disparaîtra avant midi."
    ],
    "reason": "Le contexte annonce une prévision. Il ne garantit pas que l’événement se réalisera.",
    "meaning": 0
  },
  {
    "key": "future-2",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "D’après notre estimation, la rivière atteindra ce repère demain.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "Une prévision sur ce qui devrait se produire",
    "distractors": [
      "Un engagement pris envers quelqu’un",
      "La présentation d’un projet à venir"
    ],
    "assessedTexts": [
      "D’après notre estimation, la rivière atteindra ce repère demain."
    ],
    "reason": "Le contexte annonce une prévision. Il ne garantit pas que l’événement se réalisera.",
    "meaning": 0
  },
  {
    "key": "future-3",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Les astronomes prévoient que la comète sera visible cette nuit.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "Une prévision sur ce qui devrait se produire",
    "distractors": [
      "Un engagement pris envers quelqu’un",
      "La présentation d’un projet à venir"
    ],
    "assessedTexts": [
      "Les astronomes prévoient que la comète sera visible cette nuit."
    ],
    "reason": "Le contexte annonce une prévision. Il ne garantit pas que l’événement se réalisera.",
    "meaning": 0
  },
  {
    "key": "future-4",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Selon le modèle étudié, la population de cette ville augmentera dans dix ans.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "Une prévision sur ce qui devrait se produire",
    "distractors": [
      "Un engagement pris envers quelqu’un",
      "La présentation d’un projet à venir"
    ],
    "assessedTexts": [
      "Selon le modèle étudié, la population de cette ville augmentera dans dix ans."
    ],
    "reason": "Le contexte annonce une prévision. Il ne garantit pas que l’événement se réalisera.",
    "meaning": 0
  },
  {
    "key": "future-5",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Je te le promets : je garderai ton secret.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "Un engagement pris envers quelqu’un",
    "distractors": [
      "Une prévision sur ce qui devrait se produire",
      "La présentation d’un projet à venir"
    ],
    "assessedTexts": [
      "Je te le promets : je garderai ton secret."
    ],
    "reason": "La personne s’engage explicitement à faire quelque chose pour son interlocuteur.",
    "meaning": 1
  },
  {
    "key": "future-6",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Tu peux compter sur moi : je viendrai te chercher après ton cours.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "Un engagement pris envers quelqu’un",
    "distractors": [
      "Une prévision sur ce qui devrait se produire",
      "La présentation d’un projet à venir"
    ],
    "assessedTexts": [
      "Tu peux compter sur moi : je viendrai te chercher après ton cours."
    ],
    "reason": "La personne s’engage explicitement à faire quelque chose pour son interlocuteur.",
    "meaning": 1
  },
  {
    "key": "future-7",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Je prends cet engagement envers toi : je rendrai le livre lundi, sans faute.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "Un engagement pris envers quelqu’un",
    "distractors": [
      "Une prévision sur ce qui devrait se produire",
      "La présentation d’un projet à venir"
    ],
    "assessedTexts": [
      "Je prends cet engagement envers toi : je rendrai le livre lundi, sans faute."
    ],
    "reason": "La personne s’engage explicitement à faire quelque chose pour son interlocuteur.",
    "meaning": 1
  },
  {
    "key": "future-8",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Nous vous le promettons : nous réparerons votre portail avant vendredi.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "Un engagement pris envers quelqu’un",
    "distractors": [
      "Une prévision sur ce qui devrait se produire",
      "La présentation d’un projet à venir"
    ],
    "assessedTexts": [
      "Nous vous le promettons : nous réparerons votre portail avant vendredi."
    ],
    "reason": "La personne s’engage explicitement à faire quelque chose pour son interlocuteur.",
    "meaning": 1
  },
  {
    "key": "future-9",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Voici notre programme : nous visiterons deux fermes pendant le séjour.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "La présentation d’un projet à venir",
    "distractors": [
      "Une prévision sur ce qui devrait se produire",
      "Un engagement pris envers quelqu’un"
    ],
    "assessedTexts": [
      "Voici notre programme : nous visiterons deux fermes pendant le séjour."
    ],
    "reason": "Le passage présente une organisation ou un projet situé dans l’avenir.",
    "meaning": 2
  },
  {
    "key": "future-10",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Notre projet pour juin est prêt : nous organiserons une exposition de photos.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "La présentation d’un projet à venir",
    "distractors": [
      "Une prévision sur ce qui devrait se produire",
      "Un engagement pris envers quelqu’un"
    ],
    "assessedTexts": [
      "Notre projet pour juin est prêt : nous organiserons une exposition de photos."
    ],
    "reason": "Le passage présente une organisation ou un projet situé dans l’avenir.",
    "meaning": 2
  },
  {
    "key": "future-11",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Pour son prochain spectacle, la troupe utilisera des décors en carton. C’est le projet retenu.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "La présentation d’un projet à venir",
    "distractors": [
      "Une prévision sur ce qui devrait se produire",
      "Un engagement pris envers quelqu’un"
    ],
    "assessedTexts": [
      "Pour son prochain spectacle, la troupe utilisera des décors en carton. C’est le projet retenu."
    ],
    "reason": "Le passage présente une organisation ou un projet situé dans l’avenir.",
    "meaning": 2
  },
  {
    "key": "future-12",
    "nodeKey": "interpreter_futur_simple",
    "prompt": "Selon le programme de l’atelier, vous fabriquerez d’abord un carnet.\n\nÀ quoi sert ici le futur simple ?",
    "answer": "La présentation d’un projet à venir",
    "distractors": [
      "Une prévision sur ce qui devrait se produire",
      "Un engagement pris envers quelqu’un"
    ],
    "assessedTexts": [
      "Selon le programme de l’atelier, vous fabriquerez d’abord un carnet."
    ],
    "reason": "Le passage présente une organisation ou un projet situé dans l’avenir.",
    "meaning": 2
  },
  {
    "key": "conditional-1",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Si le local était plus grand, nous installerions une bibliothèque.\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une possibilité qui dépend d’une condition",
    "distractors": [
      "Une demande formulée avec politesse",
      "Une information qui reste à confirmer"
    ],
    "assessedTexts": [
      "Si le local était plus grand, nous installerions une bibliothèque."
    ],
    "reason": "La condition annoncée présente une situation possible ou imaginaire, sans affirmer qu’elle est réalisée.",
    "meaning": 0
  },
  {
    "key": "conditional-2",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Avec un peu plus de temps libre, Mila apprendrait la photographie.\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une possibilité qui dépend d’une condition",
    "distractors": [
      "Une demande formulée avec politesse",
      "Une information qui reste à confirmer"
    ],
    "assessedTexts": [
      "Avec un peu plus de temps libre, Mila apprendrait la photographie."
    ],
    "reason": "La condition annoncée présente une situation possible ou imaginaire, sans affirmer qu’elle est réalisée.",
    "meaning": 0
  },
  {
    "key": "conditional-3",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Si tu gagnais ce voyage, tu découvrirais la côte en bateau.\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une possibilité qui dépend d’une condition",
    "distractors": [
      "Une demande formulée avec politesse",
      "Une information qui reste à confirmer"
    ],
    "assessedTexts": [
      "Si tu gagnais ce voyage, tu découvrirais la côte en bateau."
    ],
    "reason": "La condition annoncée présente une situation possible ou imaginaire, sans affirmer qu’elle est réalisée.",
    "meaning": 0
  },
  {
    "key": "conditional-4",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Sans ce bruit, les enfants pourraient entendre les oiseaux.\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une possibilité qui dépend d’une condition",
    "distractors": [
      "Une demande formulée avec politesse",
      "Une information qui reste à confirmer"
    ],
    "assessedTexts": [
      "Sans ce bruit, les enfants pourraient entendre les oiseaux."
    ],
    "reason": "La condition annoncée présente une situation possible ou imaginaire, sans affirmer qu’elle est réalisée.",
    "meaning": 0
  },
  {
    "key": "conditional-5",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Pourriez-vous baisser un peu la musique, s’il vous plaît ?\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une demande formulée avec politesse",
    "distractors": [
      "Une possibilité qui dépend d’une condition",
      "Une information qui reste à confirmer"
    ],
    "assessedTexts": [
      "Pourriez-vous baisser un peu la musique, s’il vous plaît ?"
    ],
    "reason": "La forme au conditionnel atténue la demande adressée à quelqu’un.",
    "meaning": 1
  },
  {
    "key": "conditional-6",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Je voudrais un renseignement sur les horaires, s’il vous plaît.\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une demande formulée avec politesse",
    "distractors": [
      "Une possibilité qui dépend d’une condition",
      "Une information qui reste à confirmer"
    ],
    "assessedTexts": [
      "Je voudrais un renseignement sur les horaires, s’il vous plaît."
    ],
    "reason": "La forme au conditionnel atténue la demande adressée à quelqu’un.",
    "meaning": 1
  },
  {
    "key": "conditional-7",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Auriez-vous la gentillesse de m’indiquer la sortie ?\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une demande formulée avec politesse",
    "distractors": [
      "Une possibilité qui dépend d’une condition",
      "Une information qui reste à confirmer"
    ],
    "assessedTexts": [
      "Auriez-vous la gentillesse de m’indiquer la sortie ?"
    ],
    "reason": "La forme au conditionnel atténue la demande adressée à quelqu’un.",
    "meaning": 1
  },
  {
    "key": "conditional-8",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Accepteriez-vous de relire mon message, s’il vous plaît ?\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une demande formulée avec politesse",
    "distractors": [
      "Une possibilité qui dépend d’une condition",
      "Une information qui reste à confirmer"
    ],
    "assessedTexts": [
      "Accepteriez-vous de relire mon message, s’il vous plaît ?"
    ],
    "reason": "La forme au conditionnel atténue la demande adressée à quelqu’un.",
    "meaning": 1
  },
  {
    "key": "conditional-9",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Selon une rumeur encore non vérifiée, le magasin fermerait cet hiver.\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une information qui reste à confirmer",
    "distractors": [
      "Une possibilité qui dépend d’une condition",
      "Une demande formulée avec politesse"
    ],
    "assessedTexts": [
      "Selon une rumeur encore non vérifiée, le magasin fermerait cet hiver."
    ],
    "reason": "Le contexte et le conditionnel signalent une information non confirmée, pas un fait certain.",
    "meaning": 2
  },
  {
    "key": "conditional-10",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "D’après un témoignage à confirmer, plusieurs tableaux se trouveraient dans cette cave.\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une information qui reste à confirmer",
    "distractors": [
      "Une possibilité qui dépend d’une condition",
      "Une demande formulée avec politesse"
    ],
    "assessedTexts": [
      "D’après un témoignage à confirmer, plusieurs tableaux se trouveraient dans cette cave."
    ],
    "reason": "Le contexte et le conditionnel signalent une information non confirmée, pas un fait certain.",
    "meaning": 2
  },
  {
    "key": "conditional-11",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Une source non confirmée indique que le concert aurait lieu sur la place.\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une information qui reste à confirmer",
    "distractors": [
      "Une possibilité qui dépend d’une condition",
      "Une demande formulée avec politesse"
    ],
    "assessedTexts": [
      "Une source non confirmée indique que le concert aurait lieu sur la place."
    ],
    "reason": "Le contexte et le conditionnel signalent une information non confirmée, pas un fait certain.",
    "meaning": 2
  },
  {
    "key": "conditional-12",
    "nodeKey": "interpreter_conditionnel_present",
    "prompt": "Selon des informations encore incertaines, la mairie préparerait un nouveau jardin public.\n\nÀ quoi sert ici le conditionnel présent ?",
    "answer": "Une information qui reste à confirmer",
    "distractors": [
      "Une possibilité qui dépend d’une condition",
      "Une demande formulée avec politesse"
    ],
    "assessedTexts": [
      "Selon des informations encore incertaines, la mairie préparerait un nouveau jardin public."
    ],
    "reason": "Le contexte et le conditionnel signalent une information non confirmée, pas un fait certain.",
    "meaning": 2
  }
] as const;

export const TENSE_MEANING_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:tense-meaning:imperfect",
    "nodeKey": "interpreter_imparfait",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Comprendre ce que montre l’imparfait",
    "learnerQuestionFr": "Le texte décrit-il une habitude, un décor ou une action en cours ?",
    "steps": [
      {
        "exampleFr": "Chaque soir, elle fermait les volets.",
        "explanationFr": "Chaque soir indique la répétition. L’imparfait présente ici une habitude dans le passé."
      },
      {
        "exampleFr": "La pièce était fraîche et les rideaux étaient épais.",
        "explanationFr": "Le texte décrit le cadre. Il ne raconte pas une succession d’événements."
      },
      {
        "exampleFr": "Elle lisait quand la lampe s’est éteinte.",
        "explanationFr": "Lisait présente une action en cours au moment où un événement survient. Lis les repères autour du verbe."
      }
    ],
    "takeawayFr": "Lis la phrase entière et ses repères : la forme du verbe ne suffit pas, à elle seule, à expliquer son emploi.",
    "boundaryFr": "Ces emplois ne couvrent pas toutes les valeurs de l’imparfait. La durée seule ne permet pas de choisir le temps.",
    "practice": [
      {
        "id": "tense-meaning-guided:imperfect:1",
        "promptFr": "Chaque vendredi, les voisins partageaient un repas.\n\nÀ quoi sert ici l’imparfait ?",
        "choices": [
          "Une habitude dans le passé",
          "La description d’une situation passée",
          "Une action en cours à un moment passé"
        ],
        "answerFr": "Une habitude dans le passé",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le repère de répétition présente une habitude passée."
      },
      {
        "id": "tense-meaning-guided:imperfect:2",
        "promptFr": "En hiver, nous allumions toujours le poêle au réveil.\n\nÀ quoi sert ici l’imparfait ?",
        "choices": [
          "Une habitude dans le passé",
          "La description d’une situation passée",
          "Une action en cours à un moment passé"
        ],
        "answerFr": "Une habitude dans le passé",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le repère de répétition présente une habitude passée."
      },
      {
        "id": "tense-meaning-guided:imperfect:3",
        "promptFr": "La cabine était ronde et ses parois semblaient fragiles.\n\nÀ quoi sert ici l’imparfait ?",
        "choices": [
          "Une habitude dans le passé",
          "La description d’une situation passée",
          "Une action en cours à un moment passé"
        ],
        "answerFr": "La description d’une situation passée",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le passage donne les caractéristiques du cadre passé."
      },
      {
        "id": "tense-meaning-guided:imperfect:4",
        "promptFr": "Le jardin possédait une fontaine au milieu des rosiers.\n\nÀ quoi sert ici l’imparfait ?",
        "choices": [
          "Une habitude dans le passé",
          "La description d’une situation passée",
          "Une action en cours à un moment passé"
        ],
        "answerFr": "La description d’une situation passée",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le passage donne les caractéristiques du cadre passé."
      },
      {
        "id": "tense-meaning-guided:imperfect:5",
        "promptFr": "Quand le photographe est arrivé, les enfants fabriquaient leurs masques.\n\nÀ quoi sert ici l’imparfait ?",
        "choices": [
          "Une habitude dans le passé",
          "La description d’une situation passée",
          "Une action en cours à un moment passé"
        ],
        "answerFr": "Une action en cours à un moment passé",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le passage situe une action en train de se dérouler au moment indiqué."
      },
      {
        "id": "tense-meaning-guided:imperfect:6",
        "promptFr": "À cet instant, le cuisinier remuait encore la sauce.\n\nÀ quoi sert ici l’imparfait ?",
        "choices": [
          "Une habitude dans le passé",
          "La description d’une situation passée",
          "Une action en cours à un moment passé"
        ],
        "answerFr": "Une action en cours à un moment passé",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le passage situe une action en train de se dérouler au moment indiqué."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Chaque soir, elle fermait les volets.",
        "La pièce était fraîche et les rideaux étaient épais.",
        "Elle lisait quand la lampe s’est éteinte.",
        "Chaque vendredi, les voisins partageaient un repas.",
        "En hiver, nous allumions toujours le poêle au réveil.",
        "La cabine était ronde et ses parois semblaient fragiles.",
        "Le jardin possédait une fontaine au milieu des rosiers.",
        "Quand le photographe est arrivé, les enfants fabriquaient leurs masques.",
        "À cet instant, le cuisinier remuait encore la sauce."
      ]
    }
  },
  {
    "id": "french-v3-teaching:tense-meaning:future",
    "nodeKey": "interpreter_futur_simple",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Comprendre ce qu’annonce le futur",
    "learnerQuestionFr": "La personne prévoit-elle quelque chose ou prend-elle un engagement ?",
    "steps": [
      {
        "exampleFr": "D’après les prévisions, il neigera demain.",
        "explanationFr": "Le futur exprime ici une prévision. D’après les prévisions indique d’où vient cette annonce ; la neige n’est pas un fait déjà observé."
      },
      {
        "exampleFr": "Je te le promets : je reviendrai.",
        "explanationFr": "Le verbe est aussi au futur, mais la personne prend ici un engagement. Je te le promets permet de comprendre son intention."
      },
      {
        "exampleFr": "Notre programme est prêt : nous planterons des fleurs en avril.",
        "explanationFr": "Le contexte présente un projet organisé. Lis les mots autour du verbe pour distinguer ce projet d’une prévision ou d’une promesse."
      }
    ],
    "takeawayFr": "Lis la phrase entière et ses repères : la forme du verbe ne suffit pas, à elle seule, à expliquer son emploi.",
    "boundaryFr": "Les valeurs du futur dépendent du contexte. Une même forme peut aussi exprimer une consigne ; ces exemples travaillent prévision, engagement et projet.",
    "practice": [
      {
        "id": "tense-meaning-guided:future:1",
        "promptFr": "D’après les météorologues, les températures baisseront ce soir.\n\nÀ quoi sert ici le futur simple ?",
        "choices": [
          "Une prévision sur ce qui devrait se produire",
          "Un engagement pris envers quelqu’un",
          "La présentation d’un projet à venir"
        ],
        "answerFr": "Une prévision sur ce qui devrait se produire",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le contexte annonce une prévision. Il ne garantit pas que l’événement se réalisera."
      },
      {
        "id": "tense-meaning-guided:future:2",
        "promptFr": "Les spécialistes estiment que cette étoile restera visible plusieurs mois.\n\nÀ quoi sert ici le futur simple ?",
        "choices": [
          "Une prévision sur ce qui devrait se produire",
          "Un engagement pris envers quelqu’un",
          "La présentation d’un projet à venir"
        ],
        "answerFr": "Une prévision sur ce qui devrait se produire",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le contexte annonce une prévision. Il ne garantit pas que l’événement se réalisera."
      },
      {
        "id": "tense-meaning-guided:future:3",
        "promptFr": "Je te donne ma parole : je t’aiderai à déménager.\n\nÀ quoi sert ici le futur simple ?",
        "choices": [
          "Une prévision sur ce qui devrait se produire",
          "Un engagement pris envers quelqu’un",
          "La présentation d’un projet à venir"
        ],
        "answerFr": "Un engagement pris envers quelqu’un",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "La personne s’engage explicitement à faire quelque chose pour son interlocuteur."
      },
      {
        "id": "tense-meaning-guided:future:4",
        "promptFr": "Nous vous le garantissons : nous remplacerons cette vitre.\n\nÀ quoi sert ici le futur simple ?",
        "choices": [
          "Une prévision sur ce qui devrait se produire",
          "Un engagement pris envers quelqu’un",
          "La présentation d’un projet à venir"
        ],
        "answerFr": "Un engagement pris envers quelqu’un",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "La personne s’engage explicitement à faire quelque chose pour son interlocuteur."
      },
      {
        "id": "tense-meaning-guided:future:5",
        "promptFr": "Notre programme est fixé : nous tournerons le film en avril.\n\nÀ quoi sert ici le futur simple ?",
        "choices": [
          "Une prévision sur ce qui devrait se produire",
          "Un engagement pris envers quelqu’un",
          "La présentation d’un projet à venir"
        ],
        "answerFr": "La présentation d’un projet à venir",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le passage présente une organisation ou un projet situé dans l’avenir."
      },
      {
        "id": "tense-meaning-guided:future:6",
        "promptFr": "Le plan du club prévoit une sortie : les membres découvriront un atelier de poterie.\n\nÀ quoi sert ici le futur simple ?",
        "choices": [
          "Une prévision sur ce qui devrait se produire",
          "Un engagement pris envers quelqu’un",
          "La présentation d’un projet à venir"
        ],
        "answerFr": "La présentation d’un projet à venir",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le passage présente une organisation ou un projet situé dans l’avenir."
      }
    ],
    "materialExposure": {
      "sentences": [
        "D’après les prévisions, il neigera demain.",
        "Je te le promets : je reviendrai.",
        "Notre programme est prêt : nous planterons des fleurs en avril.",
        "D’après les météorologues, les températures baisseront ce soir.",
        "Les spécialistes estiment que cette étoile restera visible plusieurs mois.",
        "Je te donne ma parole : je t’aiderai à déménager.",
        "Nous vous le garantissons : nous remplacerons cette vitre.",
        "Notre programme est fixé : nous tournerons le film en avril.",
        "Le plan du club prévoit une sortie : les membres découvriront un atelier de poterie."
      ]
    }
  },
  {
    "id": "french-v3-teaching:tense-meaning:conditional",
    "nodeKey": "interpreter_conditionnel_present",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Comprendre les nuances du conditionnel",
    "learnerQuestionFr": "La phrase imagine-t-elle une possibilité, adoucit-elle une demande ou rapporte-t-elle une information incertaine ?",
    "steps": [
      {
        "exampleFr": "Si j’avais un balcon, je planterais des herbes.",
        "explanationFr": "Planterais dépend d’une condition imaginaire : avoir un balcon. La phrase n’affirme pas que les plantes existent déjà."
      },
      {
        "exampleFr": "Pourriez-vous fermer la porte, s’il vous plaît ?",
        "explanationFr": "La personne demande une action. Le conditionnel rend la demande plus polie ; elle ne raconte pas un événement passé."
      },
      {
        "exampleFr": "Selon une source non vérifiée, une collection rare serait dans ce musée.",
        "explanationFr": "Serait rapporte ici une information incertaine. Il faut la confirmer avant de la présenter comme un fait."
      }
    ],
    "takeawayFr": "Lis la phrase entière et ses repères : la forme du verbe ne suffit pas, à elle seule, à expliquer son emploi.",
    "boundaryFr": "Le conditionnel a d’autres emplois, notamment pour situer un avenir par rapport au passé. Ne conclus pas à une incertitude en regardant seulement la terminaison.",
    "practice": [
      {
        "id": "tense-meaning-guided:conditional:1",
        "promptFr": "Si le ciel était dégagé, nous observerions les étoiles.\n\nÀ quoi sert ici le conditionnel présent ?",
        "choices": [
          "Une possibilité qui dépend d’une condition",
          "Une demande formulée avec politesse",
          "Une information qui reste à confirmer"
        ],
        "answerFr": "Une possibilité qui dépend d’une condition",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "La condition annoncée présente une situation possible ou imaginaire, sans affirmer qu’elle est réalisée."
      },
      {
        "id": "tense-meaning-guided:conditional:2",
        "promptFr": "Avec un vélo, Omar arriverait plus vite à son entraînement.\n\nÀ quoi sert ici le conditionnel présent ?",
        "choices": [
          "Une possibilité qui dépend d’une condition",
          "Une demande formulée avec politesse",
          "Une information qui reste à confirmer"
        ],
        "answerFr": "Une possibilité qui dépend d’une condition",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "La condition annoncée présente une situation possible ou imaginaire, sans affirmer qu’elle est réalisée."
      },
      {
        "id": "tense-meaning-guided:conditional:3",
        "promptFr": "Voudriez-vous patienter un instant, s’il vous plaît ?\n\nÀ quoi sert ici le conditionnel présent ?",
        "choices": [
          "Une possibilité qui dépend d’une condition",
          "Une demande formulée avec politesse",
          "Une information qui reste à confirmer"
        ],
        "answerFr": "Une demande formulée avec politesse",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "La forme au conditionnel atténue la demande adressée à quelqu’un."
      },
      {
        "id": "tense-meaning-guided:conditional:4",
        "promptFr": "Pourrais-tu me prêter ta règle, s’il te plaît ?\n\nÀ quoi sert ici le conditionnel présent ?",
        "choices": [
          "Une possibilité qui dépend d’une condition",
          "Une demande formulée avec politesse",
          "Une information qui reste à confirmer"
        ],
        "answerFr": "Une demande formulée avec politesse",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "La forme au conditionnel atténue la demande adressée à quelqu’un."
      },
      {
        "id": "tense-meaning-guided:conditional:5",
        "promptFr": "Selon une information non vérifiée, une équipe chercherait un trésor dans la vallée.\n\nÀ quoi sert ici le conditionnel présent ?",
        "choices": [
          "Une possibilité qui dépend d’une condition",
          "Une demande formulée avec politesse",
          "Une information qui reste à confirmer"
        ],
        "answerFr": "Une information qui reste à confirmer",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le contexte et le conditionnel signalent une information non confirmée, pas un fait certain."
      },
      {
        "id": "tense-meaning-guided:conditional:6",
        "promptFr": "D’après une rumeur à confirmer, ce bâtiment abriterait un ancien théâtre.\n\nÀ quoi sert ici le conditionnel présent ?",
        "choices": [
          "Une possibilité qui dépend d’une condition",
          "Une demande formulée avec politesse",
          "Une information qui reste à confirmer"
        ],
        "answerFr": "Une information qui reste à confirmer",
        "hintFr": "Cherche les indices de sens autour du verbe avant de choisir.",
        "explanationFr": "Le contexte et le conditionnel signalent une information non confirmée, pas un fait certain."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Si j’avais un balcon, je planterais des herbes.",
        "Pourriez-vous fermer la porte, s’il vous plaît ?",
        "Selon une source non vérifiée, une collection rare serait dans ce musée.",
        "Si le ciel était dégagé, nous observerions les étoiles.",
        "Avec un vélo, Omar arriverait plus vite à son entraînement.",
        "Voudriez-vous patienter un instant, s’il vous plaît ?",
        "Pourrais-tu me prêter ta règle, s’il te plaît ?",
        "Selon une information non vérifiée, une équipe chercherait un trésor dans la vallée.",
        "D’après une rumeur à confirmer, ce bâtiment abriterait un ancien théâtre."
      ]
    }
  }
];
