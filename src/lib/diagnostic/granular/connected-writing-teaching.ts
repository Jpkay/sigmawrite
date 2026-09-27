import type {TargetTeachingContent} from "./teaching-content";

/** Guided examples and decisions support writing; they never certify independent production. */
export const CONNECTED_WRITING_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:connected-writing:present",
    "nodeKey": "employer_present_indicatif_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Décrire ce qui se passe ou se répète",
    "learnerQuestionFr": "Comment garder mes verbes cohérents quand je décris une scène ?",
    "steps": [
      {
        "exampleFr": "Chaque mercredi, Nora ouvre le local. Ses voisins apportent leurs outils et nous réparons des objets.",
        "explanationFr": "Le texte présente une habitude. Les verbes sont au présent, mais leur terminaison dépend de leur sujet : Nora ouvre, ses voisins apportent, nous réparons."
      },
      {
        "exampleFr": "Un chien traverse la place. Deux passants le regardent, puis une enfant appelle sa mère.",
        "explanationFr": "Pour chaque nouvelle phrase, retrouve qui agit avant de choisir la forme du verbe. Le présent peut aussi décrire une scène en cours."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:present:1",
        "promptFr": "Continue cette description au présent : « Les musiciens s’installent. Ensuite, nous… »",
        "choices": [
          "préparons les micros.",
          "préparent les micros."
        ],
        "answerFr": "préparons les micros.",
        "hintFr": "Cherche le sujet du verbe à compléter.",
        "explanationFr": "Avec nous, préparer donne préparons au présent."
      },
      {
        "id": "connected-writing-guided:present:2",
        "promptFr": "Continue l’habitude décrite : « Tous les soirs, Mila lit. Son frère… »",
        "choices": [
          "dessine près d’elle.",
          "dessinent près d’elle."
        ],
        "answerFr": "dessine près d’elle.",
        "hintFr": "Son frère désigne une seule personne.",
        "explanationFr": "Le sujet singulier son frère demande dessine."
      }
    ],
    "takeawayFr": "Choisis un repère de temps, puis vérifie le sujet de chaque verbe.",
    "boundaryFr": "Un paragraphe peut changer de temps si son sens le demande. Cette leçon travaille une description au présent, pas tous les emplois de ce temps.",
    "materialExposure": {
      "sentences": [
        "Chaque mercredi, Nora ouvre le local. Ses voisins apportent leurs outils et nous réparons des objets.",
        "Un chien traverse la place. Deux passants le regardent, puis une enfant appelle sa mère.",
        "Continue cette description au présent : « Les musiciens s’installent. Ensuite, nous… »",
        "préparons les micros.",
        "préparent les micros.",
        "Continue l’habitude décrite : « Tous les soirs, Mila lit. Son frère… »",
        "dessine près d’elle.",
        "dessinent près d’elle."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:imperfect",
    "nodeKey": "employer_imparfait_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Décrire le décor et les habitudes du passé",
    "learnerQuestionFr": "Comment montrer ce qui se passait autrefois ?",
    "steps": [
      {
        "exampleFr": "Autrefois, le café ouvrait tôt. Nous y prenions une boisson et les habitués discutaient près du comptoir.",
        "explanationFr": "Ces actions se répétaient. L’imparfait présente ici des habitudes : ouvrait, prenions, discutaient."
      },
      {
        "exampleFr": "La salle était sombre. Une lampe éclairait le bureau et des papiers couvraient le sol.",
        "explanationFr": "L’imparfait décrit aussi une situation passée. Vérifie les sujets : une lampe éclairait, des papiers couvraient."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:imperfect:1",
        "promptFr": "Complète cette habitude passée : « Chaque matin, nous… »",
        "choices": [
          "rangions les paniers.",
          "rangeaient les paniers."
        ],
        "answerFr": "rangions les paniers.",
        "hintFr": "Le sujet est nous.",
        "explanationFr": "À l’imparfait, nous rangions porte la terminaison -ions."
      },
      {
        "id": "connected-writing-guided:imperfect:2",
        "promptFr": "Choisis la suite qui décrit le décor passé : « Les murs étaient blancs. Une horloge… »",
        "choices": [
          "sonnait dans le couloir.",
          "sonnaient dans le couloir."
        ],
        "answerFr": "sonnait dans le couloir.",
        "hintFr": "Une horloge est un sujet singulier.",
        "explanationFr": "Une horloge sonnait garde le sujet singulier et l’imparfait."
      }
    ],
    "takeawayFr": "Pour décrire une situation ou une habitude passée, utilise l’imparfait et accorde chaque verbe avec son sujet.",
    "boundaryFr": "L’imparfait ne signifie pas forcément une action longue. Le point de vue du récit compte aussi.",
    "materialExposure": {
      "sentences": [
        "Autrefois, le café ouvrait tôt. Nous y prenions une boisson et les habitués discutaient près du comptoir.",
        "La salle était sombre. Une lampe éclairait le bureau et des papiers couvraient le sol.",
        "Complète cette habitude passée : « Chaque matin, nous… »",
        "rangions les paniers.",
        "rangeaient les paniers.",
        "Choisis la suite qui décrit le décor passé : « Les murs étaient blancs. Une horloge… »",
        "sonnait dans le couloir.",
        "sonnaient dans le couloir."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:near-future",
    "nodeKey": "employer_futur_proche_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Annoncer une action prévue",
    "learnerQuestionFr": "Comment dire ce que nous prévoyons de faire ?",
    "steps": [
      {
        "exampleFr": "Le colis est prêt. Je vais le déposer et mes voisins vont prévenir le destinataire.",
        "explanationFr": "Le futur proche se construit avec aller au présent suivi d’un infinitif : vais déposer, vont prévenir. Seul aller change avec le sujet."
      },
      {
        "exampleFr": "Nous allons vérifier l’adresse. Ensuite, tu vas fermer le carton.",
        "explanationFr": "Vérifier et fermer restent à l’infinitif. Nous allons et tu vas indiquent qui agit."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:near-future:1",
        "promptFr": "Complète le projet : « Vous… »",
        "choices": [
          "allez installer les tables.",
          "allez installez les tables."
        ],
        "answerFr": "allez installer les tables.",
        "hintFr": "Après aller, le second verbe reste à l’infinitif.",
        "explanationFr": "Installer reste à l’infinitif après allez."
      },
      {
        "id": "connected-writing-guided:near-future:2",
        "promptFr": "Complète : « Les bénévoles… »",
        "choices": [
          "vont accueillir les visiteurs.",
          "va accueillir les visiteurs."
        ],
        "answerFr": "vont accueillir les visiteurs.",
        "hintFr": "Les bénévoles correspond à ils ou elles.",
        "explanationFr": "Au présent, aller donne vont avec un sujet pluriel."
      }
    ],
    "takeawayFr": "Conjugue aller au présent, puis ajoute l’action à l’infinitif.",
    "boundaryFr": "Le futur proche peut annoncer un projet assez éloigné. Il ne suffit pas de compter les minutes avant l’action.",
    "materialExposure": {
      "sentences": [
        "Le colis est prêt. Je vais le déposer et mes voisins vont prévenir le destinataire.",
        "Nous allons vérifier l’adresse. Ensuite, tu vas fermer le carton.",
        "Complète le projet : « Vous… »",
        "allez installer les tables.",
        "allez installez les tables.",
        "Complète : « Les bénévoles… »",
        "vont accueillir les visiteurs.",
        "va accueillir les visiteurs."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:recent-past",
    "nodeKey": "employer_passe_recent_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Raconter ce qui vient de se terminer",
    "learnerQuestionFr": "Comment raconter plusieurs actions tout juste achevées ?",
    "steps": [
      {
        "exampleFr": "Je viens de poster la lettre. Mes amis viennent de quitter le bureau de poste.",
        "explanationFr": "Le passé récent se construit avec venir au présent, de, puis un infinitif. Viens et viennent changent avec le sujet."
      },
      {
        "exampleFr": "Nous venons de recevoir une réponse. Vous venez de découvrir la nouvelle.",
        "explanationFr": "Recevoir et découvrir restent à l’infinitif. Il faut garder les trois parties : venir, de, action."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:recent-past:1",
        "promptFr": "Complète : « Tu… »",
        "choices": [
          "viens de terminer ton affiche.",
          "vient de terminer ton affiche."
        ],
        "answerFr": "viens de terminer ton affiche.",
        "hintFr": "Conjugue venir avec tu.",
        "explanationFr": "Tu viens prend un s, puis de terminer reste inchangé."
      },
      {
        "id": "connected-writing-guided:recent-past:2",
        "promptFr": "Complète : « Les artistes viennent… »",
        "choices": [
          "de signer leurs œuvres.",
          "signent leurs œuvres."
        ],
        "answerFr": "de signer leurs œuvres.",
        "hintFr": "Repère la partie manquante de venir de + infinitif.",
        "explanationFr": "Après viennent, on écrit de signer."
      }
    ],
    "takeawayFr": "Pour une action tout juste terminée, utilise venir au présent + de + infinitif.",
    "boundaryFr": "Venait de exprime une action récente par rapport à un moment passé. Cette leçon travaille vient de au présent.",
    "materialExposure": {
      "sentences": [
        "Je viens de poster la lettre. Mes amis viennent de quitter le bureau de poste.",
        "Nous venons de recevoir une réponse. Vous venez de découvrir la nouvelle.",
        "Complète : « Tu… »",
        "viens de terminer ton affiche.",
        "vient de terminer ton affiche.",
        "Complète : « Les artistes viennent… »",
        "de signer leurs œuvres.",
        "signent leurs œuvres."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:perfect",
    "nodeKey": "employer_passe_compose_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Raconter des actions accomplies",
    "learnerQuestionFr": "Comment enchaîner les événements d’un souvenir ?",
    "steps": [
      {
        "exampleFr": "Hier, Karim a fermé la boutique. Ses collègues sont partis et nous avons éteint les lumières.",
        "explanationFr": "Le passé composé raconte ici des actions accomplies. Chaque verbe comprend un auxiliaire, avoir ou être au présent, et un participe passé."
      },
      {
        "exampleFr": "Ana et Lou sont rentrées. Elles ont posé leurs sacs, puis Ana a téléphoné.",
        "explanationFr": "Avec être, le participe s’accorde ici avec le sujet : Ana et Lou sont rentrées. Avec avoir, il ne s’accorde pas simplement parce que le sujet est pluriel : elles ont posé."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:perfect:1",
        "promptFr": "Complète : « Léa et Inès… »",
        "choices": [
          "sont arrivées à midi.",
          "sont arrivé à midi."
        ],
        "answerFr": "sont arrivées à midi.",
        "hintFr": "Arriver se construit ici avec être. Qui est arrivé ?",
        "explanationFr": "Avec être, arrivées s’accorde avec les deux personnes féminines."
      },
      {
        "id": "connected-writing-guided:perfect:2",
        "promptFr": "Complète : « Nous… »",
        "choices": [
          "avons choisi une date.",
          "avons choisir une date."
        ],
        "answerFr": "avons choisi une date.",
        "hintFr": "Après l’auxiliaire, il faut un participe passé.",
        "explanationFr": "Le participe passé de choisir est choisi, pas choisir."
      }
    ],
    "takeawayFr": "Pour chaque action accomplie, vérifie l’auxiliaire, le participe passé et les accords nécessaires.",
    "boundaryFr": "Avec avoir, un complément direct placé avant peut entraîner un accord. Les verbes pronominaux demandent aussi une analyse particulière.",
    "materialExposure": {
      "sentences": [
        "Hier, Karim a fermé la boutique. Ses collègues sont partis et nous avons éteint les lumières.",
        "Ana et Lou sont rentrées. Elles ont posé leurs sacs, puis Ana a téléphoné.",
        "Complète : « Léa et Inès… »",
        "sont arrivées à midi.",
        "sont arrivé à midi.",
        "Complète : « Nous… »",
        "avons choisi une date.",
        "avons choisir une date."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:future",
    "nodeKey": "employer_futur_simple_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Présenter ce qui se passera plus tard",
    "learnerQuestionFr": "Comment écrire un projet au futur simple ?",
    "steps": [
      {
        "exampleFr": "L’an prochain, je participerai au concours. Mes amis prépareront le décor et nous choisirons la musique.",
        "explanationFr": "Le futur simple place ces actions dans l’avenir. Les terminaisons varient avec le sujet : -ai, -as, -a, -ons, -ez, -ont."
      },
      {
        "exampleFr": "Tu viendras avec nous. Nous serons prêts et vous aurez une place au premier rang.",
        "explanationFr": "Certains verbes changent de base : venir donne viendr-, être ser-, avoir aur-. On ajoute ensuite la terminaison du sujet."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:future:1",
        "promptFr": "Complète le projet : « Nous… »",
        "choices": [
          "visiterons le musée.",
          "visiteront le musée."
        ],
        "answerFr": "visiterons le musée.",
        "hintFr": "Avec nous, la terminaison est -ons.",
        "explanationFr": "Nous visiterons termine par -ons."
      },
      {
        "id": "connected-writing-guided:future:2",
        "promptFr": "Complète : « Demain, elle… »",
        "choices": [
          "viendra nous aider.",
          "venirra nous aider."
        ],
        "answerFr": "viendra nous aider.",
        "hintFr": "Le futur de venir utilise la base viendr-.",
        "explanationFr": "Viendr- + -a donne viendra."
      }
    ],
    "takeawayFr": "Associe la base du futur à la terminaison du sujet, puis garde un repère temporel clair.",
    "boundaryFr": "Le futur ne se forme pas toujours en ajoutant une terminaison à l’infinitif entier : prends le temps de vérifier les bases particulières.",
    "materialExposure": {
      "sentences": [
        "L’an prochain, je participerai au concours. Mes amis prépareront le décor et nous choisirons la musique.",
        "Tu viendras avec nous. Nous serons prêts et vous aurez une place au premier rang.",
        "Complète le projet : « Nous… »",
        "visiterons le musée.",
        "visiteront le musée.",
        "Complète : « Demain, elle… »",
        "viendra nous aider.",
        "venirra nous aider."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:pluperfect",
    "nodeKey": "employer_plus_que_parfait_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Raconter ce qui était déjà fait",
    "learnerQuestionFr": "Comment expliquer un événement antérieur dans un récit passé ?",
    "steps": [
      {
        "exampleFr": "À dix heures, le livreur est arrivé. Nous avions préparé les cartons et Zoé avait libéré l’entrée.",
        "explanationFr": "Le récit est déjà au passé. Avions préparé et avait libéré racontent ce qui était accompli avant l’arrivée : c’est le plus-que-parfait."
      },
      {
        "exampleFr": "Quand la pluie a commencé, les promeneuses étaient rentrées. Elles avaient fermé les fenêtres.",
        "explanationFr": "Le plus-que-parfait utilise être ou avoir à l’imparfait, puis le participe passé. Rentrées s’accorde ici avec les promeneuses."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:pluperfect:1",
        "promptFr": "Les préparatifs précèdent l’ouverture passée. Complète : « Les employés… »",
        "choices": [
          "avaient nettoyé la salle avant l’ouverture.",
          "ont nettoyer la salle avant l’ouverture."
        ],
        "answerFr": "avaient nettoyé la salle avant l’ouverture.",
        "hintFr": "Choisis un auxiliaire à l’imparfait et un participe passé.",
        "explanationFr": "Avaient nettoyé exprime l’action accomplie avant l’ouverture."
      },
      {
        "id": "connected-writing-guided:pluperfect:2",
        "promptFr": "Complète l’action antérieure : « Quand le bus est passé, elles… »",
        "choices": [
          "étaient déjà parties.",
          "étaient déjà parti."
        ],
        "answerFr": "étaient déjà parties.",
        "hintFr": "Avec être, le participe s’accorde ici avec elles.",
        "explanationFr": "Parties s’accorde au féminin pluriel."
      }
    ],
    "takeawayFr": "Installe un moment passé, puis utilise le plus-que-parfait pour ce qui était accompli auparavant.",
    "boundaryFr": "Tous les verbes d’un récit passé ne doivent pas être au plus-que-parfait. Il sert à montrer une antériorité par rapport à un autre repère passé.",
    "materialExposure": {
      "sentences": [
        "À dix heures, le livreur est arrivé. Nous avions préparé les cartons et Zoé avait libéré l’entrée.",
        "Quand la pluie a commencé, les promeneuses étaient rentrées. Elles avaient fermé les fenêtres.",
        "Les préparatifs précèdent l’ouverture passée. Complète : « Les employés… »",
        "avaient nettoyé la salle avant l’ouverture.",
        "ont nettoyer la salle avant l’ouverture.",
        "Complète l’action antérieure : « Quand le bus est passé, elles… »",
        "étaient déjà parties.",
        "étaient déjà parti."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:conditional",
    "nodeKey": "employer_conditionnel_present_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Imaginer ce qui serait possible",
    "learnerQuestionFr": "Comment raconter une possibilité qui dépend d’une condition ?",
    "steps": [
      {
        "exampleFr": "Si nous avions un atelier, nous fabriquerions nos décors. Ma sœur peindrait les panneaux et je réparerais les accessoires.",
        "explanationFr": "La condition imaginaire utilise ici si + imparfait. Les conséquences utilisent le conditionnel présent : fabriquerions, peindrait, réparerais."
      },
      {
        "exampleFr": "Avec davantage de place, ils pourraient recevoir du public. Nous serions heureux de les aider.",
        "explanationFr": "Le conditionnel présent associe généralement la base du futur aux terminaisons de l’imparfait. Certaines bases sont particulières : pourr-, ser-."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:conditional:1",
        "promptFr": "Choisis la conséquence : « Si j’avais plus de temps, je… »",
        "choices": [
          "lirais ce roman.",
          "lis ce roman."
        ],
        "answerFr": "lirais ce roman.",
        "hintFr": "La phrase imagine une possibilité dépendant d’une condition.",
        "explanationFr": "Lirais est au conditionnel présent et convient à cette hypothèse."
      },
      {
        "id": "connected-writing-guided:conditional:2",
        "promptFr": "Complète : « Si elles habitaient plus près, elles… »",
        "choices": [
          "viendraient chaque semaine.",
          "viendrait chaque semaine."
        ],
        "answerFr": "viendraient chaque semaine.",
        "hintFr": "Le sujet est elles.",
        "explanationFr": "Viendraient prend -aient avec elles."
      }
    ],
    "takeawayFr": "Pour cette hypothèse, écris la condition à l’imparfait et la conséquence au conditionnel présent.",
    "boundaryFr": "Le conditionnel sert aussi à exprimer une demande polie ou une information incertaine. Ne mets pas automatiquement un conditionnel après si.",
    "materialExposure": {
      "sentences": [
        "Si nous avions un atelier, nous fabriquerions nos décors. Ma sœur peindrait les panneaux et je réparerais les accessoires.",
        "Avec davantage de place, ils pourraient recevoir du public. Nous serions heureux de les aider.",
        "Choisis la conséquence : « Si j’avais plus de temps, je… »",
        "lirais ce roman.",
        "lis ce roman.",
        "Complète : « Si elles habitaient plus près, elles… »",
        "viendraient chaque semaine.",
        "viendrait chaque semaine."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:subjunctive",
    "nodeKey": "employer_subjonctif_present_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Exprimer un souhait ou une nécessité",
    "learnerQuestionFr": "Comment écrire ce que je souhaite que les autres fassent ?",
    "steps": [
      {
        "exampleFr": "Je souhaite que chacun trouve sa place. Il faut que nous soyons attentifs et que les nouveaux puissent participer.",
        "explanationFr": "Après ces expressions de souhait ou de nécessité, les verbes sont au subjonctif présent : trouve, soyons, puissent."
      },
      {
        "exampleFr": "La responsable veut que tu viennes tôt. Elle demande aussi que vous ayez votre matériel.",
        "explanationFr": "Le sujet peut changer dans chaque proposition. Vérifie tu viennes et vous ayez, plutôt que de recopier une seule terminaison."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:subjunctive:1",
        "promptFr": "Complète : « Il faut que nous… »",
        "choices": [
          "fassions une pause.",
          "faisons une pause."
        ],
        "answerFr": "fassions une pause.",
        "hintFr": "Après il faut que, utilise le subjonctif.",
        "explanationFr": "Avec nous, faire donne fassions au subjonctif présent."
      },
      {
        "id": "connected-writing-guided:subjunctive:2",
        "promptFr": "Complète : « Je souhaite qu’ils… »",
        "choices": [
          "soient disponibles.",
          "sont disponibles."
        ],
        "answerFr": "soient disponibles.",
        "hintFr": "Je souhaite que introduit ici un souhait.",
        "explanationFr": "Être donne soient avec ils au subjonctif présent."
      }
    ],
    "takeawayFr": "Repère l’expression qui appelle le subjonctif, puis conjugue selon le sujet de la proposition.",
    "boundaryFr": "La présence de que ne suffit pas : « Je sais qu’il vient » utilise l’indicatif. Le sens et la construction commandent le choix.",
    "materialExposure": {
      "sentences": [
        "Je souhaite que chacun trouve sa place. Il faut que nous soyons attentifs et que les nouveaux puissent participer.",
        "La responsable veut que tu viennes tôt. Elle demande aussi que vous ayez votre matériel.",
        "Complète : « Il faut que nous… »",
        "fassions une pause.",
        "faisons une pause.",
        "Complète : « Je souhaite qu’ils… »",
        "soient disponibles.",
        "sont disponibles."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:imperative",
    "nodeKey": "employer_imperatif_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Donner des consignes reliées",
    "learnerQuestionFr": "Comment guider quelqu’un sans répéter son nom à chaque phrase ?",
    "steps": [
      {
        "exampleFr": "Observe la carte, puis choisis une direction. N’oublie pas ta lampe.",
        "explanationFr": "Ces phrases s’adressent directement à une personne. L’impératif n’a pas de sujet exprimé. L’interdiction encadre le verbe avec ne et pas."
      },
      {
        "exampleFr": "Avancez jusqu’au repère, puis attendez le signal. Restons ensemble pour la suite.",
        "explanationFr": "Avancez et attendez s’adressent à plusieurs personnes ou à une personne vouvoyée. Restons inclut la personne qui parle dans l’action proposée."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:imperative:1",
        "promptFr": "Adresse cette consigne à un ami :",
        "choices": [
          "Ferme la fenêtre, puis écoute.",
          "Tu fermes la fenêtre, puis tu écoutes."
        ],
        "answerFr": "Ferme la fenêtre, puis écoute.",
        "hintFr": "Une consigne à l’impératif n’exprime pas le sujet tu.",
        "explanationFr": "Ferme et écoute donnent directement les consignes à l’impératif."
      },
      {
        "id": "connected-writing-guided:imperative:2",
        "promptFr": "Adresse une interdiction à plusieurs personnes :",
        "choices": [
          "Ne courez pas dans le couloir.",
          "Vous ne courez pas dans le couloir."
        ],
        "answerFr": "Ne courez pas dans le couloir.",
        "hintFr": "Choisis l’impératif sans sujet exprimé.",
        "explanationFr": "Ne courez pas forme une interdiction à l’impératif."
      }
    ],
    "takeawayFr": "Choisis tu, nous ou vous comme destinataire implicite, puis relie tes consignes sans exprimer ce sujet.",
    "boundaryFr": "Les formes ne se déduisent pas toutes du présent : sois, aie, va. Le s réapparaît notamment dans vas-y et manges-en.",
    "materialExposure": {
      "sentences": [
        "Observe la carte, puis choisis une direction. N’oublie pas ta lampe.",
        "Avancez jusqu’au repère, puis attendez le signal. Restons ensemble pour la suite.",
        "Adresse cette consigne à un ami :",
        "Ferme la fenêtre, puis écoute.",
        "Tu fermes la fenêtre, puis tu écoutes.",
        "Adresse une interdiction à plusieurs personnes :",
        "Ne courez pas dans le couloir.",
        "Vous ne courez pas dans le couloir."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:simple-past",
    "nodeKey": "employer_passe_simple_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Faire avancer une histoire écrite",
    "learnerQuestionFr": "Comment raconter les actions successives d’un personnage ?",
    "steps": [
      {
        "exampleFr": "La voyageuse souleva le rideau. Elle aperçut une silhouette, puis recula de quelques pas.",
        "explanationFr": "Dans ce récit écrit, le passé simple fait avancer les événements. Les formes souleva, aperçut et recula dépendent du verbe, pas seulement du sujet."
      },
      {
        "exampleFr": "Les gardes ouvrirent le portail. Nous franchîmes le seuil et je reconnus enfin la maison.",
        "explanationFr": "Les terminaisons changent avec le sujet et la famille du verbe. Compare ouvrirent, franchîmes et reconnus."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:simple-past:1",
        "promptFr": "Continue le récit au passé simple : « Le capitaine entra. Les marins… »",
        "choices": [
          "saluèrent leur capitaine.",
          "saluaient leur capitaine."
        ],
        "answerFr": "saluèrent leur capitaine.",
        "hintFr": "On demande ici une nouvelle action au passé simple.",
        "explanationFr": "Saluèrent est le passé simple de saluer avec les marins."
      },
      {
        "id": "connected-writing-guided:simple-past:2",
        "promptFr": "Continue au passé simple : « Nous… »",
        "choices": [
          "prîmes le sentier de gauche.",
          "prenions le sentier de gauche."
        ],
        "answerFr": "prîmes le sentier de gauche.",
        "hintFr": "Le passé simple de prendre utilise ici prîmes.",
        "explanationFr": "Nous prîmes raconte ici une action successive au passé simple."
      }
    ],
    "takeawayFr": "Pour faire avancer ce récit, choisis le passé simple et vérifie la forme de chaque verbe avec son sujet.",
    "boundaryFr": "Le passé simple n’exprime pas nécessairement une action courte. Il est surtout employé dans les récits écrits et coexiste souvent avec l’imparfait.",
    "materialExposure": {
      "sentences": [
        "La voyageuse souleva le rideau. Elle aperçut une silhouette, puis recula de quelques pas.",
        "Les gardes ouvrirent le portail. Nous franchîmes le seuil et je reconnus enfin la maison.",
        "Continue le récit au passé simple : « Le capitaine entra. Les marins… »",
        "saluèrent leur capitaine.",
        "saluaient leur capitaine.",
        "Continue au passé simple : « Nous… »",
        "prîmes le sentier de gauche.",
        "prenions le sentier de gauche."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:contrast",
    "nodeKey": "produire_contraste_pc_imparfait",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Relier le décor et les événements",
    "learnerQuestionFr": "Comment passer de ce qui se passait à ce qui est arrivé ?",
    "steps": [
      {
        "exampleFr": "Le four chauffait et nous préparions la pâte. Soudain, la minuterie a sonné.",
        "explanationFr": "L’imparfait présente les actions en cours. Le passé composé présente ici l’événement qui survient dans cette situation."
      },
      {
        "exampleFr": "La salle était vide. Nous avons installé les chaises pendant une heure, puis les invités sont arrivés.",
        "explanationFr": "Une action au passé composé peut durer : avons installé couvre une heure délimitée. Le choix ne dépend donc pas seulement d’une action courte ou longue."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:contrast:1",
        "promptFr": "Choisis le récit qui distingue le cadre en cours de l’événement :",
        "choices": [
          "Le téléphone sonnait depuis un moment quand j’ai décroché.",
          "Le téléphone a sonné depuis un moment quand je décrochais."
        ],
        "answerFr": "Le téléphone sonnait depuis un moment quand j’ai décroché.",
        "hintFr": "Le cadre est déjà en cours lorsque l’événement arrive.",
        "explanationFr": "Sonnait installe la situation en cours ; ai décroché présente l’événement."
      },
      {
        "id": "connected-writing-guided:contrast:2",
        "promptFr": "Choisis la suite pour une période terminée : « Hier, la route était fermée. Nous… »",
        "choices": [
          "avons attendu deux heures, puis nous sommes repartis.",
          "attendions deux heures, puis nous sommes repartis."
        ],
        "answerFr": "avons attendu deux heures, puis nous sommes repartis.",
        "hintFr": "La période d’attente est présentée comme terminée avant le départ.",
        "explanationFr": "Avons attendu convient à cette période délimitée, même si elle dure deux heures."
      }
    ],
    "takeawayFr": "Distingue le cadre ou l’action en cours des événements présentés comme accomplis.",
    "boundaryFr": "Un même événement peut être présenté différemment selon le point de vue. Évite la règle trompeuse « court = passé composé, long = imparfait ».",
    "materialExposure": {
      "sentences": [
        "Le four chauffait et nous préparions la pâte. Soudain, la minuterie a sonné.",
        "La salle était vide. Nous avons installé les chaises pendant une heure, puis les invités sont arrivés.",
        "Choisis le récit qui distingue le cadre en cours de l’événement :",
        "Le téléphone sonnait depuis un moment quand j’ai décroché.",
        "Le téléphone a sonné depuis un moment quand je décrochais.",
        "Choisis la suite pour une période terminée : « Hier, la route était fermée. Nous… »",
        "avons attendu deux heures, puis nous sommes repartis.",
        "attendions deux heures, puis nous sommes repartis."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:sequence",
    "nodeKey": "produire_sequence_temporelle",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Faire comprendre l’ordre des actions",
    "learnerQuestionFr": "Comment éviter que le lecteur se perde dans mon récit ?",
    "steps": [
      {
        "exampleFr": "D’abord, Yara a mesuré le tissu. Ensuite, elle l’a découpé. Enfin, elle a cousu les morceaux.",
        "explanationFr": "Les mots d’abord, ensuite et enfin indiquent la succession. L’ordre des phrases correspond ici à celui des actions."
      },
      {
        "exampleFr": "Pendant que Yara cousait, son frère préparait les attaches. Plus tôt, il avait dessiné le modèle.",
        "explanationFr": "Pendant que montre des actions simultanées. Plus tôt et avait dessiné signalent un retour à une action antérieure."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:sequence:1",
        "promptFr": "Le sac est préparé avant le départ. Choisis l’ordre cohérent :",
        "choices": [
          "D’abord, j’ai préparé mon sac. Ensuite, j’ai quitté la maison.",
          "D’abord, j’ai quitté la maison. Ensuite, j’ai préparé mon sac."
        ],
        "answerFr": "D’abord, j’ai préparé mon sac. Ensuite, j’ai quitté la maison.",
        "hintFr": "Respecte l’ordre donné dans la consigne.",
        "explanationFr": "La préparation précède le départ."
      },
      {
        "id": "connected-writing-guided:sequence:2",
        "promptFr": "Les deux actions se passent en même temps. Choisis le lien adapté :",
        "choices": [
          "Pendant que Sami peignait, Lou découpait les étiquettes.",
          "Après que Sami a peint, Lou a découpé les étiquettes."
        ],
        "answerFr": "Pendant que Sami peignait, Lou découpait les étiquettes.",
        "hintFr": "Cherche un lien qui indique la simultanéité.",
        "explanationFr": "Pendant que situe les deux actions au même moment ; après que les présente comme successives."
      }
    ],
    "takeawayFr": "Décide ce qui se passe avant, après ou en même temps, puis choisis les liens et les temps qui le montrent.",
    "boundaryFr": "Ajouter ensuite entre toutes les phrases ne suffit pas. Un récit peut revenir en arrière si ce retour est clairement signalé.",
    "materialExposure": {
      "sentences": [
        "D’abord, Yara a mesuré le tissu. Ensuite, elle l’a découpé. Enfin, elle a cousu les morceaux.",
        "Pendant que Yara cousait, son frère préparait les attaches. Plus tôt, il avait dessiné le modèle.",
        "Le sac est préparé avant le départ. Choisis l’ordre cohérent :",
        "D’abord, j’ai préparé mon sac. Ensuite, j’ai quitté la maison.",
        "D’abord, j’ai quitté la maison. Ensuite, j’ai préparé mon sac.",
        "Les deux actions se passent en même temps. Choisis le lien adapté :",
        "Pendant que Sami peignait, Lou découpait les étiquettes.",
        "Après que Sami a peint, Lou a découpé les étiquettes."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:pronouns",
    "nodeKey": "employer_pronoms_complements_en_contexte",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Éviter les répétitions sans perdre le sens",
    "learnerQuestionFr": "Comment remplacer un nom tout en restant clair ?",
    "steps": [
      {
        "exampleFr": "J’ai trouvé une écharpe. Je la rapporte à sa propriétaire et je lui explique où elle était.",
        "explanationFr": "La remplace l’écharpe, complément direct de rapporte. Lui remplace à sa propriétaire, complément indirect de explique. Le choix dépend de la construction du verbe."
      },
      {
        "exampleFr": "Les voisins attendent leurs colis. Je les apporte, puis je leur indique où signer.",
        "explanationFr": "Les remplace les colis ; leur remplace aux voisins. Ces pronoms se placent ici avant le verbe conjugué."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:pronouns:1",
        "promptFr": "Remplace « à Hugo » : « J’écris à Hugo, puis… »",
        "choices": [
          "je lui envoie une photo.",
          "je le envoie une photo."
        ],
        "answerFr": "je lui envoie une photo.",
        "hintFr": "On envoie quelque chose à quelqu’un.",
        "explanationFr": "Lui reprend à Hugo et se place avant envoie."
      },
      {
        "id": "connected-writing-guided:pronouns:2",
        "promptFr": "Remplace « les affiches » : « Les affiches sont prêtes. Nous… »",
        "choices": [
          "les accrochons dans l’entrée.",
          "leur accrochons dans l’entrée."
        ],
        "answerFr": "les accrochons dans l’entrée.",
        "hintFr": "Accrocher quoi ? Les affiches, sans préposition.",
        "explanationFr": "Les reprend le complément direct pluriel les affiches."
      }
    ],
    "takeawayFr": "Retrouve le nom remplacé et la construction du verbe avant de choisir et placer le pronom.",
    "boundaryFr": "Si plusieurs noms peuvent être repris, répète le nom pour rester clair. La place des pronoms change dans certaines constructions, notamment à l’impératif affirmatif.",
    "materialExposure": {
      "sentences": [
        "J’ai trouvé une écharpe. Je la rapporte à sa propriétaire et je lui explique où elle était.",
        "Les voisins attendent leurs colis. Je les apporte, puis je leur indique où signer.",
        "Remplace « à Hugo » : « J’écris à Hugo, puis… »",
        "je lui envoie une photo.",
        "je le envoie une photo.",
        "Remplace « les affiches » : « Les affiches sont prêtes. Nous… »",
        "les accrochons dans l’entrée.",
        "leur accrochons dans l’entrée."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:lexical",
    "nodeKey": "maintenir_orthographe_lexicale_phrase",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Garder l’écriture des mots dans ses phrases",
    "learnerQuestionFr": "Comment écrire mes idées sans oublier la forme des mots ?",
    "steps": [
      {
        "exampleFr": "La fillette ouvre une bouteille. Elle la pose près de la fenêtre.",
        "explanationFr": "Pendant la rédaction, on doit retrouver la graphie des mots, leur façon de s’écrire. Bouteille garde ses deux l ; fenêtre garde son accent circonflexe."
      },
      {
        "exampleFr": "Une adresse apparaît sur l’enveloppe. Je la recopie dans mon carnet.",
        "explanationFr": "Adresse possède deux s. Le son seul ne permet pas toujours de retrouver toutes les lettres. Mémoriser un mot en contexte aide à le réutiliser."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:lexical:1",
        "promptFr": "Choisis la phrase dont le mot courant est bien écrit :",
        "choices": [
          "Il note une adresse sur le papier.",
          "Il note une adresse sur le papiet."
        ],
        "answerFr": "Il note une adresse sur le papier.",
        "hintFr": "Concentre-toi sur la fin du mot qui désigne le support.",
        "explanationFr": "Papier s’écrit avec un r final. Ce r fait partie de la graphie du mot."
      },
      {
        "id": "connected-writing-guided:lexical:2",
        "promptFr": "Choisis la phrase dont la graphie lexicale est correcte :",
        "choices": [
          "La fillette remplit sa bouteille.",
          "La fillette remplit sa bouteile."
        ],
        "answerFr": "La fillette remplit sa bouteille.",
        "hintFr": "Observe la consonne à la fin de bouteille.",
        "explanationFr": "Bouteille s’écrit avec deux l."
      }
    ],
    "takeawayFr": "Quand tu écris, retrouve la forme du mot entier, y compris les lettres muettes, les accents et les consonnes doubles.",
    "boundaryFr": "Un mot bien écrit ne prouve pas que tous les mots le sont. Les accords et les terminaisons verbales demandent une vérification différente.",
    "materialExposure": {
      "sentences": [
        "La fillette ouvre une bouteille. Elle la pose près de la fenêtre.",
        "Une adresse apparaît sur l’enveloppe. Je la recopie dans mon carnet.",
        "Choisis la phrase dont le mot courant est bien écrit :",
        "Il note une adresse sur le papier.",
        "Il note une adresse sur le papiet.",
        "Choisis la phrase dont la graphie lexicale est correcte :",
        "La fillette remplit sa bouteille.",
        "La fillette remplit sa bouteile."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:grammar",
    "nodeKey": "maintenir_orthographe_grammaticale_phrase",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Vérifier les liens qui commandent les accords",
    "learnerQuestionFr": "Comment choisir les marques qui dépendent des autres mots ?",
    "steps": [
      {
        "exampleFr": "Les petites valises restent ouvertes.",
        "explanationFr": "Le déterminant les annonce le pluriel. Petites et ouvertes s’accordent ici avec valises au féminin pluriel ; restent s’accorde avec le sujet les petites valises."
      },
      {
        "exampleFr": "La valise de mes voisins reste ouverte.",
        "explanationFr": "Le sujet principal est la valise, au singulier. Le groupe de mes voisins ne transforme pas le sujet en pluriel : on écrit reste ouverte."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:grammar:1",
        "promptFr": "Choisis l’accord sujet-verbe correct :",
        "choices": [
          "Le panier des vendeuses contient des fruits.",
          "Le panier des vendeuses contiennent des fruits."
        ],
        "answerFr": "Le panier des vendeuses contient des fruits.",
        "hintFr": "Quel nom désigne ce qui contient les fruits ?",
        "explanationFr": "Le noyau du sujet est panier, au singulier : contient."
      },
      {
        "id": "connected-writing-guided:grammar:2",
        "promptFr": "Choisis les accords corrects :",
        "choices": [
          "Des portes étroites ferment le passage.",
          "Des portes étroite ferment le passage."
        ],
        "answerFr": "Des portes étroites ferment le passage.",
        "hintFr": "L’adjectif décrit plusieurs portes.",
        "explanationFr": "Étroit s’accorde ici avec portes, féminin pluriel : étroites."
      }
    ],
    "takeawayFr": "Relie chaque verbe à son sujet et chaque adjectif au nom qu’il décrit. Ne choisis pas une terminaison seulement d’après le mot le plus proche.",
    "boundaryFr": "Ces liens couvrent des accords fréquents. D’autres règles, comme certains accords du participe passé, demandent une analyse supplémentaire.",
    "materialExposure": {
      "sentences": [
        "Les petites valises restent ouvertes.",
        "La valise de mes voisins reste ouverte.",
        "Choisis l’accord sujet-verbe correct :",
        "Le panier des vendeuses contient des fruits.",
        "Le panier des vendeuses contiennent des fruits.",
        "Choisis les accords corrects :",
        "Des portes étroites ferment le passage.",
        "Des portes étroite ferment le passage."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:revise-lexical",
    "nodeKey": "reviser_orthographe_lexicale_paragraphe",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Relire pour corriger l’écriture des mots",
    "learnerQuestionFr": "Comment améliorer ma première version sans changer mes idées ?",
    "steps": [
      {
        "exampleFr": "Première version : « Le messager porte une letre. Il connaît cette adrese. »\nVersion relue : « Le messager porte une lettre. Il connaît cette adresse. »",
        "explanationFr": "Relis lentement pour repérer les mots dont la graphie te paraît incertaine. Ici, lettre et adresse demandent chacun une consonne double. Les idées restent les mêmes."
      },
      {
        "exampleFr": "Première version : « Elle ferme la fenêtre. »\nVersion relue : « Elle ferme la fenêtre. »",
        "explanationFr": "Une relecture peut confirmer une graphie déjà correcte. Il ne faut pas modifier un mot uniquement pour montrer qu’on a fait une correction."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:revise-lexical:1",
        "promptFr": "Corrige la graphie sans supprimer l’idée : « Il prépare une surprize. »",
        "choices": [
          "Il prépare une surprise.",
          "Il prépare quelque chose."
        ],
        "answerFr": "Il prépare une surprise.",
        "hintFr": "Corriger un mot est différent d’éviter de l’écrire.",
        "explanationFr": "Surprise conserve l’idée et rétablit le s."
      },
      {
        "id": "connected-writing-guided:revise-lexical:2",
        "promptFr": "La phrase « Le message est dans une enveloppe. » est déjà correcte. Quelle révision convient ?",
        "choices": [
          "Le message est dans une enveloppe.",
          "Le message est dans une envelope."
        ],
        "answerFr": "Le message est dans une enveloppe.",
        "hintFr": "Ne retire pas une lettre sans raison.",
        "explanationFr": "Enveloppe possède deux p. Une version correcte peut rester inchangée."
      }
    ],
    "takeawayFr": "Compare tes deux versions : corrige les graphies incertaines sans supprimer les difficultés ni abîmer les mots déjà corrects.",
    "boundaryFr": "Si la première version ne contient aucune faute de cette catégorie, elle ne permet pas de vérifier ta capacité à corriger une faute. Cela ne signifie pas un échec.",
    "materialExposure": {
      "sentences": [
        "Première version : « Le messager porte une letre. Il connaît cette adrese. »\nVersion relue : « Le messager porte une lettre. Il connaît cette adresse. »",
        "Première version : « Elle ferme la fenêtre. »\nVersion relue : « Elle ferme la fenêtre. »",
        "Corrige la graphie sans supprimer l’idée : « Il prépare une surprize. »",
        "Il prépare une surprise.",
        "Il prépare quelque chose.",
        "La phrase « Le message est dans une enveloppe. » est déjà correcte. Quelle révision convient ?",
        "Le message est dans une enveloppe.",
        "Le message est dans une envelope."
      ]
    }
  },
  {
    "id": "french-v3-teaching:connected-writing:revise-grammar",
    "nodeKey": "reviser_orthographe_grammaticale_paragraphe",
    "mode": "independent_production",
    "status": "draft_requires_review",
    "titleFr": "Relire les accords et les verbes",
    "learnerQuestionFr": "Comment corriger les liens entre les mots dans mon texte ?",
    "steps": [
      {
        "exampleFr": "Première version : « Les lumières éclaire la pièce. Une grande tables occupe le centre. »\nVersion relue : « Les lumières éclairent la pièce. Une grande table occupe le centre. »",
        "explanationFr": "Relie éclaire à son sujet pluriel les lumières : éclairent. Puis repère une, qui annonce un seul objet : table doit rester au singulier."
      },
      {
        "exampleFr": "Première version : « Le bruit des machines réveille le voisin. »\nVersion relue : « Le bruit des machines réveille le voisin. »",
        "explanationFr": "Le mot machines est pluriel, mais le sujet principal est le bruit. La forme réveille était déjà correcte ; inutile de la mettre au pluriel."
      }
    ],
    "practice": [
      {
        "id": "connected-writing-guided:revise-grammar:1",
        "promptFr": "Corrige seulement l’accord erroné : « Les rideaux cache la fenêtre. »",
        "choices": [
          "Les rideaux cachent la fenêtre.",
          "Le rideau cache la fenêtre."
        ],
        "answerFr": "Les rideaux cachent la fenêtre.",
        "hintFr": "Garde plusieurs rideaux et corrige le verbe.",
        "explanationFr": "Cachent s’accorde avec les rideaux sans modifier l’idée."
      },
      {
        "id": "connected-writing-guided:revise-grammar:2",
        "promptFr": "Relis : « Les garçons prennent leurs sacs. » Quelle version conserve les accords corrects ?",
        "choices": [
          "Les garçons prennent leurs sacs.",
          "Les garçons prenne leurs sacs."
        ],
        "answerFr": "Les garçons prennent leurs sacs.",
        "hintFr": "Prendre doit rester accordé au sujet pluriel.",
        "explanationFr": "Prennent est déjà correct avec les garçons."
      }
    ],
    "takeawayFr": "Relis en suivant les relations entre les mots, puis compare les versions pour vérifier que tes modifications corrigent réellement les erreurs.",
    "boundaryFr": "Changer le sujet pour éviter un accord ne démontre pas que tu sais le corriger. Une phrase correcte n’a pas besoin d’être modifiée.",
    "materialExposure": {
      "sentences": [
        "Première version : « Les lumières éclaire la pièce. Une grande tables occupe le centre. »\nVersion relue : « Les lumières éclairent la pièce. Une grande table occupe le centre. »",
        "Première version : « Le bruit des machines réveille le voisin. »\nVersion relue : « Le bruit des machines réveille le voisin. »",
        "Corrige seulement l’accord erroné : « Les rideaux cache la fenêtre. »",
        "Les rideaux cachent la fenêtre.",
        "Le rideau cache la fenêtre.",
        "Relis : « Les garçons prennent leurs sacs. » Quelle version conserve les accords corrects ?",
        "Les garçons prennent leurs sacs.",
        "Les garçons prenne leurs sacs."
      ]
    }
  }
];
