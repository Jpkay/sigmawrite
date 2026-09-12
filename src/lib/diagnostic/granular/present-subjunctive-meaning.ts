import type {TargetTeachingContent} from "./teaching-content";

/** Interpretation drafts; structure checks do not confer pedagogical review. */
export const PRESENT_SUBJUNCTIVE_MEANING_DRAFTS = [
  {
    "key": "present-1",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Regarde : le funambule traverse le fil en ce moment.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une action en cours au moment où l’on parle",
    "distractors": [
      "Une habitude qui se répète",
      "Une propriété ou une règle générale"
    ],
    "assessedTexts": [
      "Regarde : le funambule traverse le fil en ce moment."
    ],
    "reason": "Le contexte situe l’action au moment où la personne parle.",
    "category": 0
  },
  {
    "key": "present-2",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Je t’appelle depuis la cuisine : je prépare le dîner maintenant.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une action en cours au moment où l’on parle",
    "distractors": [
      "Une habitude qui se répète",
      "Une propriété ou une règle générale"
    ],
    "assessedTexts": [
      "Je t’appelle depuis la cuisine : je prépare le dîner maintenant."
    ],
    "reason": "Le contexte situe l’action au moment où la personne parle.",
    "category": 0
  },
  {
    "key": "present-3",
    "nodeKey": "interpreter_usages_present",
    "prompt": "À cet instant, les visiteurs entrent dans la cour.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une action en cours au moment où l’on parle",
    "distractors": [
      "Une habitude qui se répète",
      "Une propriété ou une règle générale"
    ],
    "assessedTexts": [
      "À cet instant, les visiteurs entrent dans la cour."
    ],
    "reason": "Le contexte situe l’action au moment où la personne parle.",
    "category": 0
  },
  {
    "key": "present-4",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Écoute : quelqu’un frappe à la porte maintenant.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une action en cours au moment où l’on parle",
    "distractors": [
      "Une habitude qui se répète",
      "Une propriété ou une règle générale"
    ],
    "assessedTexts": [
      "Écoute : quelqu’un frappe à la porte maintenant."
    ],
    "reason": "Le contexte situe l’action au moment où la personne parle.",
    "category": 0
  },
  {
    "key": "present-5",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Chaque mercredi, nous échangeons nos livres.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une habitude qui se répète",
    "distractors": [
      "Une action en cours au moment où l’on parle",
      "Une propriété ou une règle générale"
    ],
    "assessedTexts": [
      "Chaque mercredi, nous échangeons nos livres."
    ],
    "reason": "Le repère de répétition indique une habitude, pas seulement une action en cours maintenant.",
    "category": 1
  },
  {
    "key": "present-6",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Tous les matins, Inès prend le même bus.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une habitude qui se répète",
    "distractors": [
      "Une action en cours au moment où l’on parle",
      "Une propriété ou une règle générale"
    ],
    "assessedTexts": [
      "Tous les matins, Inès prend le même bus."
    ],
    "reason": "Le repère de répétition indique une habitude, pas seulement une action en cours maintenant.",
    "category": 1
  },
  {
    "key": "present-7",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Le dimanche, mon voisin répare souvent des objets.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une habitude qui se répète",
    "distractors": [
      "Une action en cours au moment où l’on parle",
      "Une propriété ou une règle générale"
    ],
    "assessedTexts": [
      "Le dimanche, mon voisin répare souvent des objets."
    ],
    "reason": "Le repère de répétition indique une habitude, pas seulement une action en cours maintenant.",
    "category": 1
  },
  {
    "key": "present-8",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Chaque soir, les membres de ce club ferment le local ensemble.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une habitude qui se répète",
    "distractors": [
      "Une action en cours au moment où l’on parle",
      "Une propriété ou une règle générale"
    ],
    "assessedTexts": [
      "Chaque soir, les membres de ce club ferment le local ensemble."
    ],
    "reason": "Le repère de répétition indique une habitude, pas seulement une action en cours maintenant.",
    "category": 1
  },
  {
    "key": "present-9",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Un triangle possède trois côtés.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une propriété ou une règle générale",
    "distractors": [
      "Une action en cours au moment où l’on parle",
      "Une habitude qui se répète"
    ],
    "assessedTexts": [
      "Un triangle possède trois côtés."
    ],
    "reason": "La phrase présente une propriété ou une règle générale, sans la limiter au moment où l’on parle.",
    "category": 2
  },
  {
    "key": "present-10",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Une douzaine contient douze éléments.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une propriété ou une règle générale",
    "distractors": [
      "Une action en cours au moment où l’on parle",
      "Une habitude qui se répète"
    ],
    "assessedTexts": [
      "Une douzaine contient douze éléments."
    ],
    "reason": "La phrase présente une propriété ou une règle générale, sans la limiter au moment où l’on parle.",
    "category": 2
  },
  {
    "key": "present-11",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Une semaine compte sept jours.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une propriété ou une règle générale",
    "distractors": [
      "Une action en cours au moment où l’on parle",
      "Une habitude qui se répète"
    ],
    "assessedTexts": [
      "Une semaine compte sept jours."
    ],
    "reason": "La phrase présente une propriété ou une règle générale, sans la limiter au moment où l’on parle.",
    "category": 2
  },
  {
    "key": "present-12",
    "nodeKey": "interpreter_usages_present",
    "prompt": "Un carré a quatre côtés de même longueur.\n\nQuel usage du présent reconnais-tu ici ?",
    "answer": "Une propriété ou une règle générale",
    "distractors": [
      "Une action en cours au moment où l’on parle",
      "Une habitude qui se répète"
    ],
    "assessedTexts": [
      "Un carré a quatre côtés de même longueur."
    ],
    "reason": "La phrase présente une propriété ou une règle générale, sans la limiter au moment où l’on parle.",
    "category": 2
  },
  {
    "key": "subjunctive-trigger-1",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Il faut que chacun puisse entendre la consigne.\n\nQuel rôle joue ici « Il faut que » dans le choix du mode ?",
    "answer": "La construction exprime une nécessité",
    "distractors": [
      "Une simple description d’un fait tenu pour certain",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Il faut que chacun puisse entendre la consigne."
    ],
    "reason": "« Il faut que » appelle ici le subjonctif : la construction exprime une nécessité. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "necessity"
  },
  {
    "key": "subjunctive-trigger-2",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Il est nécessaire que vous soyez à l’heure.\n\nQuel rôle joue ici « Il est nécessaire que » dans le choix du mode ?",
    "answer": "La construction exprime une nécessité",
    "distractors": [
      "Une simple description d’un fait tenu pour certain",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Il est nécessaire que vous soyez à l’heure."
    ],
    "reason": "« Il est nécessaire que » appelle ici le subjonctif : la construction exprime une nécessité. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "necessity"
  },
  {
    "key": "subjunctive-trigger-3",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Il est indispensable que nous ayons une autorisation.\n\nQuel rôle joue ici « Il est indispensable que » dans le choix du mode ?",
    "answer": "La construction exprime une nécessité",
    "distractors": [
      "Une simple description d’un fait tenu pour certain",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Il est indispensable que nous ayons une autorisation."
    ],
    "reason": "« Il est indispensable que » appelle ici le subjonctif : la construction exprime une nécessité. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "necessity"
  },
  {
    "key": "subjunctive-trigger-4",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Je souhaite que tu viennes à la rencontre.\n\nQuel rôle joue ici « Je souhaite que » dans le choix du mode ?",
    "answer": "La construction exprime un souhait ou une volonté",
    "distractors": [
      "Une prévision tenue pour certaine",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Je souhaite que tu viennes à la rencontre."
    ],
    "reason": "« Je souhaite que » appelle ici le subjonctif : la construction exprime un souhait ou une volonté. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "wish"
  },
  {
    "key": "subjunctive-trigger-5",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "La responsable veut que nous prenions le temps de vérifier.\n\nQuel rôle joue ici « veut que » dans le choix du mode ?",
    "answer": "La construction exprime un souhait ou une volonté",
    "distractors": [
      "Une prévision tenue pour certaine",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "La responsable veut que nous prenions le temps de vérifier."
    ],
    "reason": "« veut que » appelle ici le subjonctif : la construction exprime un souhait ou une volonté. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "wish"
  },
  {
    "key": "subjunctive-trigger-6",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Nous désirons que chacun ait une place.\n\nQuel rôle joue ici « Nous désirons que » dans le choix du mode ?",
    "answer": "La construction exprime un souhait ou une volonté",
    "distractors": [
      "Une prévision tenue pour certaine",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Nous désirons que chacun ait une place."
    ],
    "reason": "« Nous désirons que » appelle ici le subjonctif : la construction exprime un souhait ou une volonté. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "wish"
  },
  {
    "key": "subjunctive-trigger-7",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Je suis heureuse que tu sois revenu.\n\nQuel rôle joue ici « Je suis heureuse que » dans le choix du mode ?",
    "answer": "La construction exprime une émotion à propos d’un fait",
    "distractors": [
      "Une consigne donnant un ordre direct",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Je suis heureuse que tu sois revenu."
    ],
    "reason": "« Je suis heureuse que » appelle ici le subjonctif : la construction exprime une émotion à propos d’un fait. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "emotion"
  },
  {
    "key": "subjunctive-trigger-8",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Nous regrettons que le musée soit fermé.\n\nQuel rôle joue ici « Nous regrettons que » dans le choix du mode ?",
    "answer": "La construction exprime une émotion à propos d’un fait",
    "distractors": [
      "Une consigne donnant un ordre direct",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Nous regrettons que le musée soit fermé."
    ],
    "reason": "« Nous regrettons que » appelle ici le subjonctif : la construction exprime une émotion à propos d’un fait. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "emotion"
  },
  {
    "key": "subjunctive-trigger-9",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Il est triste que ce bâtiment disparaisse.\n\nQuel rôle joue ici « Il est triste que » dans le choix du mode ?",
    "answer": "La construction exprime une émotion à propos d’un fait",
    "distractors": [
      "Une consigne donnant un ordre direct",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Il est triste que ce bâtiment disparaisse."
    ],
    "reason": "« Il est triste que » appelle ici le subjonctif : la construction exprime une émotion à propos d’un fait. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "emotion"
  },
  {
    "key": "subjunctive-trigger-10",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Je doute qu’il puisse finir avant midi.\n\nQuel rôle joue ici « Je doute que » dans le choix du mode ?",
    "answer": "La construction exprime un doute ou une possibilité",
    "distractors": [
      "Une affirmation présentée comme certaine",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Je doute qu’il puisse finir avant midi."
    ],
    "reason": "« Je doute que » appelle ici le subjonctif : la construction exprime un doute ou une possibilité. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "doubt"
  },
  {
    "key": "subjunctive-trigger-11",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Il est possible que nous soyons en retard.\n\nQuel rôle joue ici « Il est possible que » dans le choix du mode ?",
    "answer": "La construction exprime un doute ou une possibilité",
    "distractors": [
      "Une affirmation présentée comme certaine",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Il est possible que nous soyons en retard."
    ],
    "reason": "« Il est possible que » appelle ici le subjonctif : la construction exprime un doute ou une possibilité. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "doubt"
  },
  {
    "key": "subjunctive-trigger-12",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Il se peut que tu aies besoin d’aide.\n\nQuel rôle joue ici « Il se peut que » dans le choix du mode ?",
    "answer": "La construction exprime un doute ou une possibilité",
    "distractors": [
      "Une affirmation présentée comme certaine",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Il se peut que tu aies besoin d’aide."
    ],
    "reason": "« Il se peut que » appelle ici le subjonctif : la construction exprime un doute ou une possibilité. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "doubt"
  },
  {
    "key": "subjunctive-trigger-13",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Je parle lentement pour que chacun comprenne.\n\nQuel rôle joue ici « pour que » dans le choix du mode ?",
    "answer": "La construction exprime le but recherché",
    "distractors": [
      "Le récit d’une cause déjà certaine",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Je parle lentement pour que chacun comprenne."
    ],
    "reason": "« pour que » appelle ici le subjonctif : la construction exprime le but recherché. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "purpose"
  },
  {
    "key": "subjunctive-trigger-14",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Nous ajoutons une lampe afin que vous puissiez lire.\n\nQuel rôle joue ici « afin que » dans le choix du mode ?",
    "answer": "La construction exprime le but recherché",
    "distractors": [
      "Le récit d’une cause déjà certaine",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Nous ajoutons une lampe afin que vous puissiez lire."
    ],
    "reason": "« afin que » appelle ici le subjonctif : la construction exprime le but recherché. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "purpose"
  },
  {
    "key": "subjunctive-trigger-15",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Elle ouvre le portail pour que les cyclistes passent.\n\nQuel rôle joue ici « pour que » dans le choix du mode ?",
    "answer": "La construction exprime le but recherché",
    "distractors": [
      "Le récit d’une cause déjà certaine",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Elle ouvre le portail pour que les cyclistes passent."
    ],
    "reason": "« pour que » appelle ici le subjonctif : la construction exprime le but recherché. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet.",
    "category": "purpose"
  },
  {
    "key": "subjunctive-trigger-16",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Je sais que tu viens demain.\n\nQuel rôle joue ici « Je sais que » dans le choix du mode ?",
    "answer": "La construction affirme un fait et emploie ici l’indicatif",
    "distractors": [
      "La présence de que impose toujours le subjonctif",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Je sais que tu viens demain."
    ],
    "reason": "« Je sais que » présente ici un fait comme affirmé ; la proposition utilise l’indicatif. Que seul ne suffit pas à imposer le subjonctif.",
    "category": "indicative"
  },
  {
    "key": "subjunctive-trigger-17",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Nous constatons que la lumière fonctionne.\n\nQuel rôle joue ici « Nous constatons que » dans le choix du mode ?",
    "answer": "La construction affirme un fait et emploie ici l’indicatif",
    "distractors": [
      "La présence de que impose toujours le subjonctif",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Nous constatons que la lumière fonctionne."
    ],
    "reason": "« Nous constatons que » présente ici un fait comme affirmé ; la proposition utilise l’indicatif. Que seul ne suffit pas à imposer le subjonctif.",
    "category": "indicative"
  },
  {
    "key": "subjunctive-trigger-18",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "prompt": "Elle affirme que les portes sont ouvertes.\n\nQuel rôle joue ici « affirme que » dans le choix du mode ?",
    "answer": "La construction affirme un fait et emploie ici l’indicatif",
    "distractors": [
      "La présence de que impose toujours le subjonctif",
      "Le sujet pluriel impose à lui seul le choix du mode"
    ],
    "assessedTexts": [
      "Elle affirme que les portes sont ouvertes."
    ],
    "reason": "« affirme que » présente ici un fait comme affirmé ; la proposition utilise l’indicatif. Que seul ne suffit pas à imposer le subjonctif.",
    "category": "indicative"
  }
] as const;

export const PRESENT_SUBJUNCTIVE_MEANING_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:present-subjunctive-meaning:present",
    "nodeKey": "interpreter_usages_present",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Comprendre les différents usages du présent",
    "learnerQuestionFr": "Le présent parle-t-il toujours de ce qui se passe maintenant ?",
    "steps": [
      {
        "exampleFr": "À cet instant, la musicienne accorde sa guitare.",
        "explanationFr": "À cet instant situe l’action au moment décrit. C’est un emploi du présent pour une action en cours."
      },
      {
        "exampleFr": "Tous les lundis, elle répète avec son groupe.",
        "explanationFr": "Tous les lundis indique une répétition. Le présent décrit une habitude, même si la répétition n’a pas lieu au moment où l’on parle."
      },
      {
        "exampleFr": "Un mètre contient cent centimètres.",
        "explanationFr": "La phrase énonce une relation générale. Elle ne décrit pas un événement qui commence maintenant."
      }
    ],
    "takeawayFr": "Lis le contexte et la construction entière avant d’expliquer le choix du temps ou du mode.",
    "boundaryFr": "Le présent peut aussi raconter un événement passé ou annoncer un avenir prévu. Ces exemples travaillent trois usages fréquents ; le contexte reste nécessaire.",
    "practice": [
      {
        "id": "present-subjunctive-meaning-guided:present:1",
        "promptFr": "Tiens, je vois ton frère qui arrive à cet instant.\n\nQuel usage du présent reconnais-tu ici ?",
        "choices": [
          "Une action en cours au moment où l’on parle",
          "Une habitude qui se répète",
          "Une propriété ou une règle générale"
        ],
        "answerFr": "Une action en cours au moment où l’on parle",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "Le contexte situe l’action au moment où la personne parle."
      },
      {
        "id": "present-subjunctive-meaning-guided:present:2",
        "promptFr": "En ce moment, les enfants dessinent sur la terrasse.\n\nQuel usage du présent reconnais-tu ici ?",
        "choices": [
          "Une action en cours au moment où l’on parle",
          "Une habitude qui se répète",
          "Une propriété ou une règle générale"
        ],
        "answerFr": "Une action en cours au moment où l’on parle",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "Le contexte situe l’action au moment où la personne parle."
      },
      {
        "id": "present-subjunctive-meaning-guided:present:3",
        "promptFr": "Chaque été, nous séjournons dans ce village.\n\nQuel usage du présent reconnais-tu ici ?",
        "choices": [
          "Une habitude qui se répète",
          "Une action en cours au moment où l’on parle",
          "Une propriété ou une règle générale"
        ],
        "answerFr": "Une habitude qui se répète",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "Le repère de répétition indique une habitude, pas seulement une action en cours maintenant."
      },
      {
        "id": "present-subjunctive-meaning-guided:present:4",
        "promptFr": "Le samedi matin, Salma fait toujours du vélo.\n\nQuel usage du présent reconnais-tu ici ?",
        "choices": [
          "Une habitude qui se répète",
          "Une action en cours au moment où l’on parle",
          "Une propriété ou une règle générale"
        ],
        "answerFr": "Une habitude qui se répète",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "Le repère de répétition indique une habitude, pas seulement une action en cours maintenant."
      },
      {
        "id": "present-subjunctive-meaning-guided:present:5",
        "promptFr": "Une heure contient soixante minutes.\n\nQuel usage du présent reconnais-tu ici ?",
        "choices": [
          "Une propriété ou une règle générale",
          "Une action en cours au moment où l’on parle",
          "Une habitude qui se répète"
        ],
        "answerFr": "Une propriété ou une règle générale",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "La phrase présente une propriété ou une règle générale, sans la limiter au moment où l’on parle."
      },
      {
        "id": "present-subjunctive-meaning-guided:present:6",
        "promptFr": "Un centimètre correspond à dix millimètres.\n\nQuel usage du présent reconnais-tu ici ?",
        "choices": [
          "Une propriété ou une règle générale",
          "Une action en cours au moment où l’on parle",
          "Une habitude qui se répète"
        ],
        "answerFr": "Une propriété ou une règle générale",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "La phrase présente une propriété ou une règle générale, sans la limiter au moment où l’on parle."
      }
    ],
    "materialExposure": {
      "sentences": [
        "À cet instant, la musicienne accorde sa guitare.",
        "Tous les lundis, elle répète avec son groupe.",
        "Un mètre contient cent centimètres.",
        "Tiens, je vois ton frère qui arrive à cet instant.",
        "En ce moment, les enfants dessinent sur la terrasse.",
        "Chaque été, nous séjournons dans ce village.",
        "Le samedi matin, Salma fait toujours du vélo.",
        "Une heure contient soixante minutes.",
        "Un centimètre correspond à dix millimètres."
      ]
    }
  },
  {
    "id": "french-v3-teaching:present-subjunctive-meaning:subjunctive-trigger",
    "nodeKey": "interpreter_declencheur_subjonctif",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Comprendre pourquoi une construction appelle le subjonctif",
    "learnerQuestionFr": "Pourquoi écrit-on « il faut qu’il vienne » mais « je sais qu’il vient » ?",
    "steps": [
      {
        "exampleFr": "Il faut qu’il vienne. Je souhaite qu’il vienne.",
        "explanationFr": "La première construction exprime une nécessité, la seconde un souhait. Toutes deux appellent ici le subjonctif vienne."
      },
      {
        "exampleFr": "Je suis content qu’il vienne. Il est possible qu’il vienne.",
        "explanationFr": "Une émotion peut porter sur un fait réel ; elle appelle pourtant ici le subjonctif. Il est possible que exprime une possibilité. Le subjonctif ne signifie donc pas simplement « faux » ou « irréel »."
      },
      {
        "exampleFr": "J’attends pour qu’il puisse me rejoindre. Je sais qu’il vient.",
        "explanationFr": "Pour que introduit un but et appelle le subjonctif puisse. Je sais que affirme un fait et utilise ici l’indicatif vient. Que ne commande pas, à lui seul, le subjonctif."
      }
    ],
    "takeawayFr": "Lis le contexte et la construction entière avant d’expliquer le choix du temps ou du mode.",
    "boundaryFr": "Le mode dépend de la construction et de son sens en contexte. La négation, l’interrogation et certaines expressions peuvent modifier le choix ; on ne généralise pas à tous les verbes suivis de que.",
    "practice": [
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:1",
        "promptFr": "Il faut que tu fasses une pause.\n\nQuel rôle joue ici « Il faut que » dans le choix du mode ?",
        "choices": [
          "La construction exprime une nécessité",
          "Une simple description d’un fait tenu pour certain",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction exprime une nécessité",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« Il faut que » appelle ici le subjonctif : la construction exprime une nécessité. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:2",
        "promptFr": "Il est essentiel que les visiteurs restent ensemble.\n\nQuel rôle joue ici « Il est essentiel que » dans le choix du mode ?",
        "choices": [
          "La construction exprime une nécessité",
          "Une simple description d’un fait tenu pour certain",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction exprime une nécessité",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« Il est essentiel que » appelle ici le subjonctif : la construction exprime une nécessité. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:3",
        "promptFr": "Lina souhaite que ses amis puissent participer.\n\nQuel rôle joue ici « souhaite que » dans le choix du mode ?",
        "choices": [
          "La construction exprime un souhait ou une volonté",
          "Une prévision tenue pour certaine",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction exprime un souhait ou une volonté",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« souhaite que » appelle ici le subjonctif : la construction exprime un souhait ou une volonté. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:4",
        "promptFr": "Je veux que vous sachiez la vérité.\n\nQuel rôle joue ici « Je veux que » dans le choix du mode ?",
        "choices": [
          "La construction exprime un souhait ou une volonté",
          "Une prévision tenue pour certaine",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction exprime un souhait ou une volonté",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« Je veux que » appelle ici le subjonctif : la construction exprime un souhait ou une volonté. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:5",
        "promptFr": "Je suis ravi que vous ayez du temps.\n\nQuel rôle joue ici « Je suis ravi que » dans le choix du mode ?",
        "choices": [
          "La construction exprime une émotion à propos d’un fait",
          "Une consigne donnant un ordre direct",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction exprime une émotion à propos d’un fait",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« Je suis ravi que » appelle ici le subjonctif : la construction exprime une émotion à propos d’un fait. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:6",
        "promptFr": "Nous sommes surpris qu’elle connaisse déjà l’histoire.\n\nQuel rôle joue ici « Nous sommes surpris que » dans le choix du mode ?",
        "choices": [
          "La construction exprime une émotion à propos d’un fait",
          "Une consigne donnant un ordre direct",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction exprime une émotion à propos d’un fait",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« Nous sommes surpris que » appelle ici le subjonctif : la construction exprime une émotion à propos d’un fait. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:7",
        "promptFr": "Je doute que cette clé ouvre le coffre.\n\nQuel rôle joue ici « Je doute que » dans le choix du mode ?",
        "choices": [
          "La construction exprime un doute ou une possibilité",
          "Une affirmation présentée comme certaine",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction exprime un doute ou une possibilité",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« Je doute que » appelle ici le subjonctif : la construction exprime un doute ou une possibilité. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:8",
        "promptFr": "Il est possible que les invités viennent demain.\n\nQuel rôle joue ici « Il est possible que » dans le choix du mode ?",
        "choices": [
          "La construction exprime un doute ou une possibilité",
          "Une affirmation présentée comme certaine",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction exprime un doute ou une possibilité",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« Il est possible que » appelle ici le subjonctif : la construction exprime un doute ou une possibilité. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:9",
        "promptFr": "Il dessine un plan pour que nous trouvions l’entrée.\n\nQuel rôle joue ici « pour que » dans le choix du mode ?",
        "choices": [
          "La construction exprime le but recherché",
          "Le récit d’une cause déjà certaine",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction exprime le but recherché",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« pour que » appelle ici le subjonctif : la construction exprime le but recherché. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:10",
        "promptFr": "Nous écrivons les noms afin que tu saches où t’asseoir.\n\nQuel rôle joue ici « afin que » dans le choix du mode ?",
        "choices": [
          "La construction exprime le but recherché",
          "Le récit d’une cause déjà certaine",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction exprime le but recherché",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« afin que » appelle ici le subjonctif : la construction exprime le but recherché. Le choix ne dépend pas seulement de la présence de que ni du nombre du sujet."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:11",
        "promptFr": "Je vois que vous êtes prêts.\n\nQuel rôle joue ici « Je vois que » dans le choix du mode ?",
        "choices": [
          "La construction affirme un fait et emploie ici l’indicatif",
          "La présence de que impose toujours le subjonctif",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction affirme un fait et emploie ici l’indicatif",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« Je vois que » présente ici un fait comme affirmé ; la proposition utilise l’indicatif. Que seul ne suffit pas à imposer le subjonctif."
      },
      {
        "id": "present-subjunctive-meaning-guided:subjunctive-trigger:12",
        "promptFr": "Nous savons que le bus arrive à huit heures.\n\nQuel rôle joue ici « Nous savons que » dans le choix du mode ?",
        "choices": [
          "La construction affirme un fait et emploie ici l’indicatif",
          "La présence de que impose toujours le subjonctif",
          "Le sujet pluriel impose à lui seul le choix du mode"
        ],
        "answerFr": "La construction affirme un fait et emploie ici l’indicatif",
        "hintFr": "Cherche ce que la construction exprime ; ne t’appuie pas seulement sur une terminaison.",
        "explanationFr": "« Nous savons que » présente ici un fait comme affirmé ; la proposition utilise l’indicatif. Que seul ne suffit pas à imposer le subjonctif."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Il faut qu’il vienne. Je souhaite qu’il vienne.",
        "Je suis content qu’il vienne. Il est possible qu’il vienne.",
        "J’attends pour qu’il puisse me rejoindre. Je sais qu’il vient.",
        "Il faut que tu fasses une pause.",
        "Il est essentiel que les visiteurs restent ensemble.",
        "Lina souhaite que ses amis puissent participer.",
        "Je veux que vous sachiez la vérité.",
        "Je suis ravi que vous ayez du temps.",
        "Nous sommes surpris qu’elle connaisse déjà l’histoire.",
        "Je doute que cette clé ouvre le coffre.",
        "Il est possible que les invités viennent demain.",
        "Il dessine un plan pour que nous trouvions l’entrée.",
        "Nous écrivons les noms afin que tu saches où t’asseoir.",
        "Je vois que vous êtes prêts.",
        "Nous savons que le bus arrive à huit heures."
      ]
    }
  }
];
