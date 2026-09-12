import type {TargetTeachingContent} from "./teaching-content";

/** Recognition drafts; approval and independent mastery are not implied. */
export const INFLECTION_RECOGNITION_DRAFTS = [
  {
    "key": "plural-1",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "crayon",
    "sentence": "La boîte contient cinq ___.",
    "answer": "crayons",
    "distractors": [
      "crayon",
      "crayonx"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de crayon est crayons."
  },
  {
    "key": "plural-2",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "carnet",
    "sentence": "Les élèves comparent leurs ___.",
    "answer": "carnets",
    "distractors": [
      "carnet",
      "carnetx"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de carnet est carnets."
  },
  {
    "key": "plural-3",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "tabouret",
    "sentence": "Quatre ___ entourent le comptoir.",
    "answer": "tabourets",
    "distractors": [
      "tabouret",
      "tabouretx"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de tabouret est tabourets."
  },
  {
    "key": "plural-4",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "fauteuil",
    "sentence": "Les invités occupent plusieurs ___.",
    "answer": "fauteuils",
    "distractors": [
      "fauteuil",
      "fauteuilx"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de fauteuil est fauteuils."
  },
  {
    "key": "plural-5",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "sapin",
    "sentence": "Des ___ bordent le sentier.",
    "answer": "sapins",
    "distractors": [
      "sapin",
      "sapinx"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de sapin est sapins."
  },
  {
    "key": "plural-6",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "nuage",
    "sentence": "De gros ___ cachent le soleil.",
    "answer": "nuages",
    "distractors": [
      "nuage",
      "nuagex"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de nuage est nuages."
  },
  {
    "key": "plural-7",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "banc",
    "sentence": "Le square possède trois ___.",
    "answer": "bancs",
    "distractors": [
      "banc",
      "bancx"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de banc est bancs."
  },
  {
    "key": "plural-8",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "pont",
    "sentence": "Deux ___ traversent cette rivière.",
    "answer": "ponts",
    "distractors": [
      "pont",
      "pontx"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de pont est ponts."
  },
  {
    "key": "plural-9",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "perle",
    "sentence": "Le collier compte vingt ___.",
    "answer": "perles",
    "distractors": [
      "perle",
      "perlex"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de perle est perles."
  },
  {
    "key": "plural-10",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "assiette",
    "sentence": "Nous disposons les ___ sur la table.",
    "answer": "assiettes",
    "distractors": [
      "assiette",
      "assiettex"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de assiette est assiettes."
  },
  {
    "key": "plural-11",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "fourchette",
    "sentence": "Range les ___ dans ce tiroir.",
    "answer": "fourchettes",
    "distractors": [
      "fourchette",
      "fourchettex"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de fourchette est fourchettes."
  },
  {
    "key": "plural-12",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "fenêtre",
    "sentence": "Les ___ de la salle sont ouvertes.",
    "answer": "fenêtres",
    "distractors": [
      "fenêtre",
      "fenêtrex"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de fenêtre est fenêtres."
  },
  {
    "key": "plural-13",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "casquette",
    "sentence": "Les joueurs portent des ___ rouges.",
    "answer": "casquettes",
    "distractors": [
      "casquette",
      "casquettex"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de casquette est casquettes."
  },
  {
    "key": "plural-14",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "chemise",
    "sentence": "Elle repasse deux ___.",
    "answer": "chemises",
    "distractors": [
      "chemise",
      "chemisex"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de chemise est chemises."
  },
  {
    "key": "plural-15",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "chaussure",
    "sentence": "Les ___ restent près de la porte.",
    "answer": "chaussures",
    "distractors": [
      "chaussure",
      "chaussurex"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de chaussure est chaussures."
  },
  {
    "key": "plural-16",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "lemma": "coquillage",
    "sentence": "Ils ramassent des ___ sur le sable.",
    "answer": "coquillages",
    "distractors": [
      "coquillage",
      "coquillagex"
    ],
    "reason": "Le contexte désigne plusieurs éléments : le pluriel régulier de coquillage est coquillages."
  },
  {
    "key": "feminine-1",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "lent",
    "sentence": "La tortue ___ traverse le chemin.",
    "answer": "lente",
    "distractors": [
      "lent",
      "lents"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à lent, ce qui donne lente."
  },
  {
    "key": "feminine-2",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "dur",
    "sentence": "Cette roche ___ résiste aux chocs.",
    "answer": "dure",
    "distractors": [
      "dur",
      "durs"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à dur, ce qui donne dure."
  },
  {
    "key": "feminine-3",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "blond",
    "sentence": "La fillette ___ porte un chapeau.",
    "answer": "blonde",
    "distractors": [
      "blond",
      "blonds"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à blond, ce qui donne blonde."
  },
  {
    "key": "feminine-4",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "content",
    "sentence": "Cette spectatrice semble ___.",
    "answer": "contente",
    "distractors": [
      "content",
      "contents"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à content, ce qui donne contente."
  },
  {
    "key": "feminine-5",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "prudent",
    "sentence": "Une conductrice ___ ralentit avant le virage.",
    "answer": "prudente",
    "distractors": [
      "prudent",
      "prudents"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à prudent, ce qui donne prudente."
  },
  {
    "key": "feminine-6",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "absent",
    "sentence": "La joueuse ___ reviendra demain.",
    "answer": "absente",
    "distractors": [
      "absent",
      "absents"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à absent, ce qui donne absente."
  },
  {
    "key": "feminine-7",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "présent",
    "sentence": "La personne ___ peut répondre.",
    "answer": "présente",
    "distractors": [
      "présent",
      "présents"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à présent, ce qui donne présente."
  },
  {
    "key": "feminine-8",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "différent",
    "sentence": "Nous cherchons une solution ___.",
    "answer": "différente",
    "distractors": [
      "différent",
      "différents"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à différent, ce qui donne différente."
  },
  {
    "key": "feminine-9",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "important",
    "sentence": "Une information ___ manque au dossier.",
    "answer": "importante",
    "distractors": [
      "important",
      "importants"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à important, ce qui donne importante."
  },
  {
    "key": "feminine-10",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "amusant",
    "sentence": "Il raconte une histoire ___.",
    "answer": "amusante",
    "distractors": [
      "amusant",
      "amusants"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à amusant, ce qui donne amusante."
  },
  {
    "key": "feminine-11",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "élégant",
    "sentence": "Cette tenue est ___.",
    "answer": "élégante",
    "distractors": [
      "élégant",
      "élégants"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à élégant, ce qui donne élégante."
  },
  {
    "key": "feminine-12",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "distant",
    "sentence": "La tour ___ paraît minuscule.",
    "answer": "distante",
    "distractors": [
      "distant",
      "distants"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à distant, ce qui donne distante."
  },
  {
    "key": "feminine-13",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "plat",
    "sentence": "Cette pierre ___ glisse sur l’eau.",
    "answer": "plate",
    "distractors": [
      "plat",
      "plats"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à plat, ce qui donne plate."
  },
  {
    "key": "feminine-14",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "sourd",
    "sentence": "Une détonation ___ retentit au loin.",
    "answer": "sourde",
    "distractors": [
      "sourd",
      "sourds"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à sourd, ce qui donne sourde."
  },
  {
    "key": "feminine-15",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "loyal",
    "sentence": "Une amie ___ reste à ses côtés.",
    "answer": "loyale",
    "distractors": [
      "loyal",
      "loyals"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à loyal, ce qui donne loyale."
  },
  {
    "key": "feminine-16",
    "nodeKey": "former_feminin_adjectif_regulier",
    "lemma": "uni",
    "sentence": "L’équipe reste ___ face aux difficultés.",
    "answer": "unie",
    "distractors": [
      "uni",
      "unis"
    ],
    "reason": "Le contexte demande le féminin singulier : on ajoute e à uni, ce qui donne unie."
  }
] as const;

export const INFLECTION_RECOGNITION_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:inflection-recognition:plural",
    "nodeKey": "marquer_pluriel_nom_regulier",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Reconnaître le pluriel régulier",
    "learnerQuestionFr": "Comment choisir la bonne forme quand il y en a plusieurs ?",
    "steps": [
      {
        "exampleFr": "un ticket → des tickets",
        "explanationFr": "Des indique plusieurs éléments. Le nom ticket prend la marque régulière du pluriel : s."
      },
      {
        "exampleFr": "deux chats, pas deux chat ni deux chatx",
        "explanationFr": "Chat sans s manque la marque du pluriel. Chatx utilise une marque qui ne convient pas à ce nom régulier."
      },
      {
        "exampleFr": "un bateau → des bateaux",
        "explanationFr": "Certains noms suivent une autre règle. Cette leçon cible les noms dont le pluriel régulier se forme avec s."
      }
    ],
    "takeawayFr": "Lis le groupe de mots avant de choisir la marque du pluriel.",
    "boundaryFr": "Cette règle ne couvre pas tous les noms ou adjectifs. Reconnaître une forme parmi des choix ne prouve pas encore que tu sais la produire sans modèle.",
    "practice": [
      {
        "id": "inflection-recognition-guided:plural:0",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nPlusieurs ___ sont vides.",
        "choices": [
          "bouteilles",
          "bouteille",
          "bouteillex"
        ],
        "answerFr": "bouteilles",
        "hintFr": "Repère le nombre du nom.",
        "explanationFr": "Le contexte désigne plusieurs éléments : le pluriel régulier de bouteille est bouteilles."
      },
      {
        "id": "inflection-recognition-guided:plural:1",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nLes ___ attendent sur le plateau.",
        "choices": [
          "tasses",
          "tasse",
          "tassex"
        ],
        "answerFr": "tasses",
        "hintFr": "Repère le nombre du nom.",
        "explanationFr": "Le contexte désigne plusieurs éléments : le pluriel régulier de tasse est tasses."
      },
      {
        "id": "inflection-recognition-guided:plural:2",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nJe coupe trois ___.",
        "choices": [
          "pommes",
          "pomme",
          "pommex"
        ],
        "answerFr": "pommes",
        "hintFr": "Repère le nombre du nom.",
        "explanationFr": "Le contexte désigne plusieurs éléments : le pluriel régulier de pomme est pommes."
      },
      {
        "id": "inflection-recognition-guided:plural:3",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nDes ___ forment le mur.",
        "choices": [
          "briques",
          "brique",
          "briquex"
        ],
        "answerFr": "briques",
        "hintFr": "Repère le nombre du nom.",
        "explanationFr": "Le contexte désigne plusieurs éléments : le pluriel régulier de brique est briques."
      },
      {
        "id": "inflection-recognition-guided:plural:4",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nLes ___ sont dans la trousse.",
        "choices": [
          "stylos",
          "stylo",
          "stylox"
        ],
        "answerFr": "stylos",
        "hintFr": "Repère le nombre du nom.",
        "explanationFr": "Le contexte désigne plusieurs éléments : le pluriel régulier de stylo est stylos."
      },
      {
        "id": "inflection-recognition-guided:plural:5",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nQuatre ___ occupent cette étagère.",
        "choices": [
          "livres",
          "livre",
          "livrex"
        ],
        "answerFr": "livres",
        "hintFr": "Repère le nombre du nom.",
        "explanationFr": "Le contexte désigne plusieurs éléments : le pluriel régulier de livre est livres."
      }
    ],
    "materialExposure": {
      "words": [
        {
          "lemma": "bouteille",
          "form": "bouteille"
        },
        {
          "lemma": "bouteille",
          "form": "bouteilles"
        },
        {
          "lemma": "bouteille",
          "form": "bouteillex"
        },
        {
          "lemma": "tasse",
          "form": "tasse"
        },
        {
          "lemma": "tasse",
          "form": "tasses"
        },
        {
          "lemma": "tasse",
          "form": "tassex"
        },
        {
          "lemma": "pomme",
          "form": "pomme"
        },
        {
          "lemma": "pomme",
          "form": "pommes"
        },
        {
          "lemma": "pomme",
          "form": "pommex"
        },
        {
          "lemma": "brique",
          "form": "brique"
        },
        {
          "lemma": "brique",
          "form": "briques"
        },
        {
          "lemma": "brique",
          "form": "briquex"
        },
        {
          "lemma": "stylo",
          "form": "stylo"
        },
        {
          "lemma": "stylo",
          "form": "stylos"
        },
        {
          "lemma": "stylo",
          "form": "stylox"
        },
        {
          "lemma": "livre",
          "form": "livre"
        },
        {
          "lemma": "livre",
          "form": "livres"
        },
        {
          "lemma": "livre",
          "form": "livrex"
        }
      ],
      "sentences": [
        "un ticket → des tickets",
        "deux chats, pas deux chat ni deux chatx",
        "un bateau → des bateaux"
      ]
    }
  },
  {
    "id": "french-v3-teaching:inflection-recognition:feminine",
    "nodeKey": "former_feminin_adjectif_regulier",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Reconnaître le féminin régulier",
    "learnerQuestionFr": "Quelle terminaison convient à un nom féminin singulier ?",
    "steps": [
      {
        "exampleFr": "un sac rempli → une boîte remplie",
        "explanationFr": "Le nom boîte est féminin singulier. L’adjectif rempli prend ici e : remplie."
      },
      {
        "exampleFr": "une pièce éclairée, pas une pièce éclairé ni une pièce éclairés",
        "explanationFr": "Éclairé manque le e du féminin. Éclairés porte un s de pluriel qui ne convient pas à une seule pièce."
      },
      {
        "exampleFr": "un bel endroit → une belle place",
        "explanationFr": "Tous les adjectifs ne suivent pas le simple ajout de e. Cette leçon cible les féminins réguliers."
      }
    ],
    "takeawayFr": "Pour ces adjectifs réguliers, le féminin singulier se forme avec e, sans s de pluriel.",
    "boundaryFr": "Cette règle ne couvre pas tous les noms ou adjectifs. Reconnaître une forme parmi des choix ne prouve pas encore que tu sais la produire sans modèle.",
    "practice": [
      {
        "id": "inflection-recognition-guided:feminine:0",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nUne cliente ___ attend son tour.",
        "choices": [
          "patiente",
          "patient",
          "patients"
        ],
        "answerFr": "patiente",
        "hintFr": "Repère le genre et le nombre du nom décrit.",
        "explanationFr": "Le contexte demande le féminin singulier : on ajoute e à patient, ce qui donne patiente."
      },
      {
        "id": "inflection-recognition-guided:feminine:1",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nUne maison ___ borde le canal.",
        "choices": [
          "charmante",
          "charmant",
          "charmants"
        ],
        "answerFr": "charmante",
        "hintFr": "Repère le genre et le nombre du nom décrit.",
        "explanationFr": "Le contexte demande le féminin singulier : on ajoute e à charmant, ce qui donne charmante."
      },
      {
        "id": "inflection-recognition-guided:feminine:2",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nLa vendeuse ___ accueille les visiteurs.",
        "choices": [
          "souriante",
          "souriant",
          "souriants"
        ],
        "answerFr": "souriante",
        "hintFr": "Repère le genre et le nombre du nom décrit.",
        "explanationFr": "Le contexte demande le féminin singulier : on ajoute e à souriant, ce qui donne souriante."
      },
      {
        "id": "inflection-recognition-guided:feminine:3",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nCette fleur ___ craint le vent.",
        "choices": [
          "délicate",
          "délicat",
          "délicats"
        ],
        "answerFr": "délicate",
        "hintFr": "Repère le genre et le nombre du nom décrit.",
        "explanationFr": "Le contexte demande le féminin singulier : on ajoute e à délicat, ce qui donne délicate."
      },
      {
        "id": "inflection-recognition-guided:feminine:4",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nUne sorcière ___ apparaît dans le conte.",
        "choices": [
          "méchante",
          "méchant",
          "méchants"
        ],
        "answerFr": "méchante",
        "hintFr": "Repère le genre et le nombre du nom décrit.",
        "explanationFr": "Le contexte demande le féminin singulier : on ajoute e à méchant, ce qui donne méchante."
      },
      {
        "id": "inflection-recognition-guided:feminine:5",
        "promptFr": "Choisis la forme qui complète correctement la phrase.\n\nUne voisine ___ raconte sa journée.",
        "choices": [
          "bavarde",
          "bavard",
          "bavards"
        ],
        "answerFr": "bavarde",
        "hintFr": "Repère le genre et le nombre du nom décrit.",
        "explanationFr": "Le contexte demande le féminin singulier : on ajoute e à bavard, ce qui donne bavarde."
      }
    ],
    "materialExposure": {
      "words": [
        {
          "lemma": "patient",
          "form": "patient"
        },
        {
          "lemma": "patient",
          "form": "patiente"
        },
        {
          "lemma": "patient",
          "form": "patients"
        },
        {
          "lemma": "charmant",
          "form": "charmant"
        },
        {
          "lemma": "charmant",
          "form": "charmante"
        },
        {
          "lemma": "charmant",
          "form": "charmants"
        },
        {
          "lemma": "souriant",
          "form": "souriant"
        },
        {
          "lemma": "souriant",
          "form": "souriante"
        },
        {
          "lemma": "souriant",
          "form": "souriants"
        },
        {
          "lemma": "délicat",
          "form": "délicat"
        },
        {
          "lemma": "délicat",
          "form": "délicate"
        },
        {
          "lemma": "délicat",
          "form": "délicats"
        },
        {
          "lemma": "méchant",
          "form": "méchant"
        },
        {
          "lemma": "méchant",
          "form": "méchante"
        },
        {
          "lemma": "méchant",
          "form": "méchants"
        },
        {
          "lemma": "bavard",
          "form": "bavard"
        },
        {
          "lemma": "bavard",
          "form": "bavarde"
        },
        {
          "lemma": "bavard",
          "form": "bavards"
        }
      ],
      "sentences": [
        "un sac rempli → une boîte remplie",
        "une pièce éclairée, pas une pièce éclairé ni une pièce éclairés",
        "un bel endroit → une belle place"
      ]
    }
  }
];
