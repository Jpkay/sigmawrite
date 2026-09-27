import type {TargetTeachingContent} from "./teaching-content";

/** Context meaning drafts, not publication or mastery evidence. */
export const PERIPHRASTIC_MEANING_DRAFTS = [
  {
    "key": "near-future-1",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "J’ai choisi mon activité pour septembre prochain : je vais apprendre la poterie.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Un projet pour septembre prochain",
    "distractors": [
      "Un départ immédiat vers un atelier",
      "Une activité déjà terminée"
    ],
    "assessedTexts": [
      "J’ai choisi mon activité pour septembre prochain : je vais apprendre la poterie."
    ],
    "meaning": 0,
    "reason": "Le contexte annonce une intention ou un projet, sans dire que l’action est déjà réalisée."
  },
  {
    "key": "near-future-2",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "Nous avons pris une décision : nous allons créer un journal du quartier.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Une intention décidée par le groupe",
    "distractors": [
      "Un journal qui existe depuis longtemps",
      "Une habitude du passé"
    ],
    "assessedTexts": [
      "Nous avons pris une décision : nous allons créer un journal du quartier."
    ],
    "meaning": 0,
    "reason": "Le contexte annonce une intention ou un projet, sans dire que l’action est déjà réalisée."
  },
  {
    "key": "near-future-3",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "Mon inscription est prévue pour l’année prochaine : je vais suivre un cours de dessin.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Un projet situé l’année prochaine",
    "distractors": [
      "Un cours obligatoirement commencé à cet instant",
      "Un cours déjà achevé"
    ],
    "assessedTexts": [
      "Mon inscription est prévue pour l’année prochaine : je vais suivre un cours de dessin."
    ],
    "meaning": 0,
    "reason": "Le contexte annonce une intention ou un projet, sans dire que l’action est déjà réalisée."
  },
  {
    "key": "near-future-4",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "J’ai décidé de changer mon trajet : je vais prendre le tram demain.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Une intention pour le lendemain",
    "distractors": [
      "Un trajet terminé la veille",
      "Un déplacement en cours dans le tram"
    ],
    "assessedTexts": [
      "J’ai décidé de changer mon trajet : je vais prendre le tram demain."
    ],
    "meaning": 0,
    "reason": "Le contexte annonce une intention ou un projet, sans dire que l’action est déjà réalisée."
  },
  {
    "key": "near-future-5",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "Le ciel devient très sombre. Il va pleuvoir, pense Noé.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Une prévision fondée sur l’aspect du ciel",
    "distractors": [
      "La preuve qu’il pleut déjà",
      "Un souvenir de pluie ancienne"
    ],
    "assessedTexts": [
      "Le ciel devient très sombre. Il va pleuvoir, pense Noé."
    ],
    "meaning": 1,
    "reason": "Un indice conduit à prévoir la suite. La forme ne transforme pas cette prévision en fait déjà accompli."
  },
  {
    "key": "near-future-6",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "Cette pile ne tient presque plus debout. Les livres vont tomber, prévient Inès.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Une prévision fondée sur l’instabilité de la pile",
    "distractors": [
      "Des livres déjà ramassés au sol",
      "Une décision volontaire des livres"
    ],
    "assessedTexts": [
      "Cette pile ne tient presque plus debout. Les livres vont tomber, prévient Inès."
    ],
    "meaning": 1,
    "reason": "Un indice conduit à prévoir la suite. La forme ne transforme pas cette prévision en fait déjà accompli."
  },
  {
    "key": "near-future-7",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "Le réservoir est presque vide. Le moteur va s’arrêter si on continue ainsi.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Une prévision liée au manque de carburant",
    "distractors": [
      "Un moteur arrêté depuis hier",
      "Une habitude sans rapport avec le réservoir"
    ],
    "assessedTexts": [
      "Le réservoir est presque vide. Le moteur va s’arrêter si on continue ainsi."
    ],
    "meaning": 1,
    "reason": "Un indice conduit à prévoir la suite. La forme ne transforme pas cette prévision en fait déjà accompli."
  },
  {
    "key": "near-future-8",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "Le score et le temps restant nous sont favorables. Nous allons gagner, estime le capitaine.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Une prévision du capitaine sur la fin du match",
    "distractors": [
      "Un résultat déjà définitivement acquis",
      "Le récit d’une victoire ancienne"
    ],
    "assessedTexts": [
      "Le score et le temps restant nous sont favorables. Nous allons gagner, estime le capitaine."
    ],
    "meaning": 1,
    "reason": "Un indice conduit à prévoir la suite. La forme ne transforme pas cette prévision en fait déjà accompli."
  },
  {
    "key": "near-future-9",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "Le compte à rebours affiche trois secondes : la fusée va décoller.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Un décollage annoncé comme imminent",
    "distractors": [
      "Une fusée qui a déjà terminé son vol",
      "Un décollage nécessairement prévu dans un an"
    ],
    "assessedTexts": [
      "Le compte à rebours affiche trois secondes : la fusée va décoller."
    ],
    "meaning": 2,
    "reason": "Les indices situent l’événement juste après le moment décrit : il est annoncé comme imminent."
  },
  {
    "key": "near-future-10",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "Les portes se ferment et le signal retentit : le train va partir.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Un départ annoncé pour tout de suite",
    "distractors": [
      "Un train arrivé à destination hier",
      "Une habitude de voyage dans le passé"
    ],
    "assessedTexts": [
      "Les portes se ferment et le signal retentit : le train va partir."
    ],
    "meaning": 2,
    "reason": "Les indices situent l’événement juste après le moment décrit : il est annoncé comme imminent."
  },
  {
    "key": "near-future-11",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "L’arbitre porte le sifflet à ses lèvres : la rencontre va commencer.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Un début de rencontre annoncé comme imminent",
    "distractors": [
      "Une rencontre déjà terminée",
      "Une description d’anciens matchs"
    ],
    "assessedTexts": [
      "L’arbitre porte le sifflet à ses lèvres : la rencontre va commencer."
    ],
    "meaning": 2,
    "reason": "Les indices situent l’événement juste après le moment décrit : il est annoncé comme imminent."
  },
  {
    "key": "near-future-12",
    "nodeKey": "interpreter_futur_proche",
    "prompt": "Tout le monde est en place et le rideau bouge : le spectacle va débuter.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
    "answer": "Un début de spectacle annoncé pour les instants qui suivent",
    "distractors": [
      "Un spectacle achevé depuis une heure",
      "Un déplacement du public vers une autre ville"
    ],
    "assessedTexts": [
      "Tout le monde est en place et le rideau bouge : le spectacle va débuter."
    ],
    "meaning": 2,
    "reason": "Les indices situent l’événement juste après le moment décrit : il est annoncé comme imminent."
  },
  {
    "key": "recent-past-1",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Je viens de fermer la fenêtre, dit Lila maintenant.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "La fermeture a eu lieu peu avant le moment où Lila parle",
    "distractors": [
      "Lila prévoit de fermer la fenêtre demain",
      "Lila vient d’un lieu appelé la fenêtre"
    ],
    "assessedTexts": [
      "Je viens de fermer la fenêtre, dit Lila maintenant."
    ],
    "meaning": 0,
    "reason": "Venir au présent suivi de de et d’un infinitif situe ici l’action peu avant le moment où l’on parle."
  },
  {
    "key": "recent-past-2",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Nous venons de finir le puzzle, annoncent les enfants.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "Le puzzle a été terminé peu avant leur annonce",
    "distractors": [
      "Le puzzle est seulement prévu pour demain",
      "Le puzzle était fini depuis plusieurs années"
    ],
    "assessedTexts": [
      "Nous venons de finir le puzzle, annoncent les enfants."
    ],
    "meaning": 0,
    "reason": "Venir au présent suivi de de et d’un infinitif situe ici l’action peu avant le moment où l’on parle."
  },
  {
    "key": "recent-past-3",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Le colis vient d’arriver, m’indique le gardien à l’instant.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "L’arrivée est récente par rapport au moment où le gardien parle",
    "distractors": [
      "L’arrivée aura nécessairement lieu le lendemain",
      "Le gardien décrit une arrivée habituelle chaque été"
    ],
    "assessedTexts": [
      "Le colis vient d’arriver, m’indique le gardien à l’instant."
    ],
    "meaning": 0,
    "reason": "Venir au présent suivi de de et d’un infinitif situe ici l’action peu avant le moment où l’on parle."
  },
  {
    "key": "recent-past-4",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Tu viens de gagner la partie : regarde le résultat qui s’affiche !\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "La victoire a eu lieu juste avant cette remarque",
    "distractors": [
      "La victoire est seulement annoncée pour une prochaine partie",
      "La remarque décrit le lieu d’origine du joueur"
    ],
    "assessedTexts": [
      "Tu viens de gagner la partie : regarde le résultat qui s’affiche !"
    ],
    "meaning": 0,
    "reason": "Venir au présent suivi de de et d’un infinitif situe ici l’action peu avant le moment où l’on parle."
  },
  {
    "key": "recent-past-5",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Hier, à dix heures, je venais de sortir lorsque tu as appelé.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "La sortie était récente au moment de l’appel d’hier",
    "distractors": [
      "La sortie vient forcément d’avoir lieu aujourd’hui",
      "La sortie a commencé après l’appel"
    ],
    "assessedTexts": [
      "Hier, à dix heures, je venais de sortir lorsque tu as appelé."
    ],
    "meaning": 1,
    "reason": "Venir à l’imparfait suivi de de et d’un infinitif situe ici l’action peu avant un repère déjà passé."
  },
  {
    "key": "recent-past-6",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Quand le visiteur est arrivé lundi, nous venions de ranger les outils.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "Le rangement était tout juste terminé avant l’arrivée du visiteur",
    "distractors": [
      "Le rangement est seulement prévu pour lundi prochain",
      "Le rangement doit être récent par rapport au moment présent"
    ],
    "assessedTexts": [
      "Quand le visiteur est arrivé lundi, nous venions de ranger les outils."
    ],
    "meaning": 1,
    "reason": "Venir à l’imparfait suivi de de et d’un infinitif situe ici l’action peu avant un repère déjà passé."
  },
  {
    "key": "recent-past-7",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Ce matin-là, le train venait de partir quand Sara a atteint le quai.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "Le départ précédait de peu l’arrivée de Sara sur le quai",
    "distractors": [
      "Le train allait partir après l’arrivée de Sara",
      "Le départ a nécessairement eu lieu aujourd’hui"
    ],
    "assessedTexts": [
      "Ce matin-là, le train venait de partir quand Sara a atteint le quai."
    ],
    "meaning": 1,
    "reason": "Venir à l’imparfait suivi de de et d’un infinitif situe ici l’action peu avant un repère déjà passé."
  },
  {
    "key": "recent-past-8",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "À la fin du repas de dimanche, ils venaient de servir le dessert lorsque la lumière s’est éteinte.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "Le service du dessert précédait de peu la coupure de lumière",
    "distractors": [
      "Le dessert a été servi seulement après la coupure",
      "Le dessert vient forcément d’être servi maintenant"
    ],
    "assessedTexts": [
      "À la fin du repas de dimanche, ils venaient de servir le dessert lorsque la lumière s’est éteinte."
    ],
    "meaning": 1,
    "reason": "Venir à l’imparfait suivi de de et d’un infinitif situe ici l’action peu avant un repère déjà passé."
  },
  {
    "key": "recent-past-9",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Je viens de Dakar et je vis ici depuis cinq ans.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "La phrase indique un lieu d’origine",
    "distractors": [
      "La phrase dit qu’une action vient de se terminer",
      "La phrase annonce un événement imminent"
    ],
    "assessedTexts": [
      "Je viens de Dakar et je vis ici depuis cinq ans."
    ],
    "meaning": 2,
    "reason": "Après venir de, le complément est ici un lieu ou une provenance, pas un infinitif : ce n’est pas le passé récent."
  },
  {
    "key": "recent-past-10",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Ces tissus viennent de cette région montagneuse.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "La phrase indique la provenance des tissus",
    "distractors": [
      "La phrase indique qu’une action vient de finir",
      "La phrase promet une livraison future"
    ],
    "assessedTexts": [
      "Ces tissus viennent de cette région montagneuse."
    ],
    "meaning": 2,
    "reason": "Après venir de, le complément est ici un lieu ou une provenance, pas un infinitif : ce n’est pas le passé récent."
  },
  {
    "key": "recent-past-11",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Nous venons du village voisin pour assister à la fête.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "La phrase indique d’où le groupe arrive",
    "distractors": [
      "La phrase utilise venir de suivi d’un infinitif pour une action récente",
      "La phrase indique une fête déjà terminée"
    ],
    "assessedTexts": [
      "Nous venons du village voisin pour assister à la fête."
    ],
    "meaning": 2,
    "reason": "Après venir de, le complément est ici un lieu ou une provenance, pas un infinitif : ce n’est pas le passé récent."
  },
  {
    "key": "recent-past-12",
    "nodeKey": "interpreter_passe_recent",
    "prompt": "Ce bois vient d’une forêt située au nord du pays.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
    "answer": "La phrase indique la provenance du bois",
    "distractors": [
      "La phrase raconte une action tout juste achevée",
      "La phrase annonce une action prévue"
    ],
    "assessedTexts": [
      "Ce bois vient d’une forêt située au nord du pays."
    ],
    "meaning": 2,
    "reason": "Après venir de, le complément est ici un lieu ou une provenance, pas un infinitif : ce n’est pas le passé récent."
  }
] as const;

export const PERIPHRASTIC_MEANING_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:periphrastic-meaning:near-future",
    "nodeKey": "interpreter_futur_proche",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Comprendre ce qui va se passer",
    "learnerQuestionFr": "La phrase annonce-t-elle une intention, un indice sur la suite ou un événement imminent ?",
    "steps": [
      {
        "exampleFr": "J’ai décidé : je vais apprendre à nager l’été prochain.",
        "explanationFr": "Le futur proche présente une intention. L’été prochain montre que proche ne signifie pas toujours dans quelques minutes."
      },
      {
        "exampleFr": "Le vent se lève : la mer va devenir agitée, prévoit le marin.",
        "explanationFr": "Le marin s’appuie sur un indice pour prévoir la suite. Cette prévision concerne ce qui n’est pas encore réalisé."
      },
      {
        "exampleFr": "Le feu passe au vert : les voitures vont démarrer.",
        "explanationFr": "Le contexte annonce ici une action imminente. Compare avec « Je vais au stade » : cette dernière phrase décrit un déplacement, sans infinitif après aller."
      }
    ],
    "takeawayFr": "Lis la construction entière et les repères du contexte pour situer correctement l’action.",
    "boundaryFr": "Le futur proche n’impose pas que l’événement arrive dans quelques secondes. Il peut annoncer un projet pour l’année suivante. Aller suivi d’un lieu peut simplement exprimer un déplacement.",
    "practice": [
      {
        "id": "periphrastic-meaning-guided:near-future:1",
        "promptFr": "J’ai fait mon choix : je vais apprendre le violon cet automne.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
        "choices": [
          "Une intention pour cet automne",
          "Un apprentissage déjà achevé",
          "Un déplacement immédiat"
        ],
        "answerFr": "Une intention pour cet automne",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Le contexte annonce une intention ou un projet, sans dire que l’action est déjà réalisée."
      },
      {
        "id": "periphrastic-meaning-guided:near-future:2",
        "promptFr": "Notre décision est prise : nous allons aménager le balcon au printemps.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
        "choices": [
          "Un projet décidé pour le printemps",
          "Un balcon déjà aménagé",
          "Une habitude ancienne"
        ],
        "answerFr": "Un projet décidé pour le printemps",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Le contexte annonce une intention ou un projet, sans dire que l’action est déjà réalisée."
      },
      {
        "id": "periphrastic-meaning-guided:near-future:3",
        "promptFr": "Le verre est au bord de la table. Il va tomber, pense Léa.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
        "choices": [
          "Une prévision fondée sur sa position",
          "Un verre déjà cassé",
          "Une promesse faite par le verre"
        ],
        "answerFr": "Une prévision fondée sur sa position",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Un indice conduit à prévoir la suite. La forme ne transforme pas cette prévision en fait déjà accompli."
      },
      {
        "id": "periphrastic-meaning-guided:near-future:4",
        "promptFr": "La neige s’accumule sur la route. Le trajet va être difficile, prévoit le chauffeur.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
        "choices": [
          "Une prévision fondée sur l’état de la route",
          "Un trajet déjà terminé",
          "Une certitude sans aucun indice"
        ],
        "answerFr": "Une prévision fondée sur l’état de la route",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Un indice conduit à prévoir la suite. La forme ne transforme pas cette prévision en fait déjà accompli."
      },
      {
        "id": "periphrastic-meaning-guided:near-future:5",
        "promptFr": "Le minuteur affiche une seconde : l’alarme va sonner.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
        "choices": [
          "Un événement annoncé comme imminent",
          "Une alarme qui a sonné hier",
          "Une habitude ancienne"
        ],
        "answerFr": "Un événement annoncé comme imminent",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Les indices situent l’événement juste après le moment décrit : il est annoncé comme imminent."
      },
      {
        "id": "periphrastic-meaning-guided:near-future:6",
        "promptFr": "La présentatrice lève son micro : elle va annoncer le résultat.\n\nQue signifie la construction avec « aller » dans ce contexte ?",
        "choices": [
          "Une annonce attendue dans les instants suivants",
          "Une annonce déjà faite la veille",
          "Un trajet vers un autre lieu"
        ],
        "answerFr": "Une annonce attendue dans les instants suivants",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Les indices situent l’événement juste après le moment décrit : il est annoncé comme imminent."
      }
    ],
    "materialExposure": {
      "sentences": [
        "J’ai décidé : je vais apprendre à nager l’été prochain.",
        "Le vent se lève : la mer va devenir agitée, prévoit le marin.",
        "Le feu passe au vert : les voitures vont démarrer.",
        "J’ai fait mon choix : je vais apprendre le violon cet automne.",
        "Notre décision est prise : nous allons aménager le balcon au printemps.",
        "Le verre est au bord de la table. Il va tomber, pense Léa.",
        "La neige s’accumule sur la route. Le trajet va être difficile, prévoit le chauffeur.",
        "Le minuteur affiche une seconde : l’alarme va sonner.",
        "La présentatrice lève son micro : elle va annoncer le résultat."
      ]
    }
  },
  {
    "id": "french-v3-teaching:periphrastic-meaning:recent-past",
    "nodeKey": "interpreter_passe_recent",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Repérer ce qui vient de se terminer",
    "learnerQuestionFr": "À quel moment l’action était-elle tout juste terminée ?",
    "steps": [
      {
        "exampleFr": "Je viens de terminer mon dessin.",
        "explanationFr": "Venir de suivi de l’infinitif terminer indique une action tout juste achevée par rapport au moment où je parle."
      },
      {
        "exampleFr": "Hier, je venais de terminer mon dessin quand tu as téléphoné.",
        "explanationFr": "Le repère est l’appel d’hier. Le dessin était tout juste terminé à ce moment-là, pas nécessairement au moment présent."
      },
      {
        "exampleFr": "Je viens de Bruxelles.",
        "explanationFr": "Bruxelles est un lieu, pas une action à l’infinitif. La phrase indique une origine ; elle n’exprime pas le passé récent."
      }
    ],
    "takeawayFr": "Lis la construction entière et les repères du contexte pour situer correctement l’action.",
    "boundaryFr": "Le point de repère peut être le présent ou un moment passé. « Venir de » suivi d’un lieu exprime une origine, pas le passé récent.",
    "practice": [
      {
        "id": "periphrastic-meaning-guided:recent-past:1",
        "promptFr": "Je viens de retrouver mes lunettes, annonce Malik.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
        "choices": [
          "Malik les a retrouvées peu avant son annonce",
          "Malik les retrouvera demain",
          "Malik indique son lieu d’origine"
        ],
        "answerFr": "Malik les a retrouvées peu avant son annonce",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Venir au présent suivi de de et d’un infinitif situe ici l’action peu avant le moment où l’on parle."
      },
      {
        "id": "periphrastic-meaning-guided:recent-past:2",
        "promptFr": "Les ouvriers viennent de terminer le mur.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
        "choices": [
          "Le mur a été terminé récemment par rapport au moment décrit",
          "Le mur sera construit l’année prochaine",
          "Les ouvriers décrivent leur origine"
        ],
        "answerFr": "Le mur a été terminé récemment par rapport au moment décrit",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Venir au présent suivi de de et d’un infinitif situe ici l’action peu avant le moment où l’on parle."
      },
      {
        "id": "periphrastic-meaning-guided:recent-past:3",
        "promptFr": "Vendredi, elle venait de s’asseoir quand le cours a commencé.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
        "choices": [
          "Elle s’était assise peu avant le début du cours vendredi",
          "Elle vient nécessairement de s’asseoir aujourd’hui",
          "Elle s’est assise après le cours"
        ],
        "answerFr": "Elle s’était assise peu avant le début du cours vendredi",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Venir à l’imparfait suivi de de et d’un infinitif situe ici l’action peu avant un repère déjà passé."
      },
      {
        "id": "periphrastic-meaning-guided:recent-past:4",
        "promptFr": "À cet instant du récit, nous venions de traverser le fleuve.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
        "choices": [
          "La traversée était récente par rapport à cet instant passé",
          "La traversée était encore prévue pour le lendemain",
          "La traversée est forcément récente par rapport à maintenant"
        ],
        "answerFr": "La traversée était récente par rapport à cet instant passé",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Venir à l’imparfait suivi de de et d’un infinitif situe ici l’action peu avant un repère déjà passé."
      },
      {
        "id": "periphrastic-meaning-guided:recent-past:5",
        "promptFr": "Cette peinture vient d’un atelier familial.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
        "choices": [
          "La phrase indique la provenance de la peinture",
          "La phrase décrit une action tout juste terminée",
          "La phrase annonce une future peinture"
        ],
        "answerFr": "La phrase indique la provenance de la peinture",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Après venir de, le complément est ici un lieu ou une provenance, pas un infinitif : ce n’est pas le passé récent."
      },
      {
        "id": "periphrastic-meaning-guided:recent-past:6",
        "promptFr": "Elle vient de la capitale pour le festival.\n\nQue signifie la construction avec « venir » dans ce contexte ?",
        "choices": [
          "La phrase indique son lieu de départ",
          "La phrase utilise le passé récent pour une action achevée",
          "La phrase situe le festival dans un passé lointain"
        ],
        "answerFr": "La phrase indique son lieu de départ",
        "hintFr": "Cherche le moment de repère et regarde ce qui suit aller ou venir.",
        "explanationFr": "Après venir de, le complément est ici un lieu ou une provenance, pas un infinitif : ce n’est pas le passé récent."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Je viens de terminer mon dessin.",
        "Hier, je venais de terminer mon dessin quand tu as téléphoné.",
        "Je viens de Bruxelles.",
        "Je viens de retrouver mes lunettes, annonce Malik.",
        "Les ouvriers viennent de terminer le mur.",
        "Vendredi, elle venait de s’asseoir quand le cours a commencé.",
        "À cet instant du récit, nous venions de traverser le fleuve.",
        "Cette peinture vient d’un atelier familial.",
        "Elle vient de la capitale pour le festival."
      ]
    }
  }
];
