import type {TargetTeachingContent} from "./teaching-content";

/** Recognition and controlled transformations; no independent-writing approval. */
export const WRITTEN_DETERMINER_DRAFTS = [
  {
    "key": "recognition-1",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "phoque",
    "prompt": "Un seul animal est représenté.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "un phoque",
    "distractors": [
      "une phoque",
      "des phoque"
    ],
    "forms": [
      "phoque",
      "phoque",
      "phoque"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-2",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "marionnette",
    "prompt": "Un seul personnage articulé est posé sur la scène.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "une marionnette",
    "distractors": [
      "un marionnette",
      "des marionnette"
    ],
    "forms": [
      "marionnette",
      "marionnette",
      "marionnette"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-3",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "hamac",
    "prompt": "Un seul lit suspendu est installé.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "ce hamac",
    "distractors": [
      "cette hamac",
      "ces hamac"
    ],
    "forms": [
      "hamac",
      "hamac",
      "hamac"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-4",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "boussole",
    "prompt": "Un seul instrument indique le nord.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "cette boussole",
    "distractors": [
      "ce boussole",
      "ces boussole"
    ],
    "forms": [
      "boussole",
      "boussole",
      "boussole"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-5",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "cadenas",
    "prompt": "Une seule fermeture appartient à Nora.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "son cadenas",
    "distractors": [
      "sa cadenas",
      "ses cadenas"
    ],
    "forms": [
      "cadenas",
      "cadenas",
      "cadenas"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-6",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "moustache",
    "prompt": "On parle de la moustache d’un seul personnage.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "sa moustache",
    "distractors": [
      "son moustache",
      "ses moustache"
    ],
    "forms": [
      "moustache",
      "moustache",
      "moustache"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-7",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "pétale",
    "prompt": "Un seul élément de la fleur est tombé.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "un pétale",
    "distractors": [
      "une pétale",
      "des pétale"
    ],
    "forms": [
      "pétale",
      "pétale",
      "pétale"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-8",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "cabine",
    "prompt": "Une seule petite pièce est disponible.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "une cabine",
    "distractors": [
      "un cabine",
      "des cabine"
    ],
    "forms": [
      "cabine",
      "cabine",
      "cabine"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-9",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "couvercle",
    "prompt": "Un seul objet ferme la boîte.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "ce couvercle",
    "distractors": [
      "cette couvercle",
      "ces couvercle"
    ],
    "forms": [
      "couvercle",
      "couvercle",
      "couvercle"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-10",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "colline",
    "prompt": "Un seul relief apparaît sur la carte.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "cette colline",
    "distractors": [
      "ce colline",
      "ces colline"
    ],
    "forms": [
      "colline",
      "colline",
      "colline"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-11",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "plumier",
    "prompt": "Nora possède une seule boîte pour ses crayons.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "son plumier",
    "distractors": [
      "sa plumier",
      "ses plumier"
    ],
    "forms": [
      "plumier",
      "plumier",
      "plumier"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-12",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "cape",
    "prompt": "Nora porte un seul vêtement de ce type.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "sa cape",
    "distractors": [
      "son cape",
      "ses cape"
    ],
    "forms": [
      "cape",
      "cape",
      "cape"
    ],
    "errorKeys": [
      "determiner-gender",
      "determiner-number"
    ]
  },
  {
    "key": "recognition-13",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "fourmi",
    "prompt": "Plusieurs insectes avancent sur le sol.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "des fourmis",
    "distractors": [
      "une fourmis",
      "des fourmi"
    ],
    "forms": [
      "fourmis",
      "fourmis",
      "fourmi"
    ],
    "errorKeys": [
      "determiner-number",
      "noun-number"
    ]
  },
  {
    "key": "recognition-14",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "navet",
    "prompt": "Plusieurs légumes sont montrés.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "ces navets",
    "distractors": [
      "ce navets",
      "ces navet"
    ],
    "forms": [
      "navets",
      "navets",
      "navet"
    ],
    "errorKeys": [
      "determiner-number",
      "noun-number"
    ]
  },
  {
    "key": "recognition-15",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "sandale",
    "prompt": "Plusieurs chaussures appartiennent à Sami.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "ses sandales",
    "distractors": [
      "sa sandales",
      "ses sandale"
    ],
    "forms": [
      "sandales",
      "sandales",
      "sandale"
    ],
    "errorKeys": [
      "determiner-number",
      "noun-number"
    ]
  },
  {
    "key": "recognition-16",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "écharpe",
    "prompt": "Plusieurs accessoires sont exposés.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "des écharpes",
    "distractors": [
      "une écharpes",
      "des écharpe"
    ],
    "forms": [
      "écharpes",
      "écharpes",
      "écharpe"
    ],
    "errorKeys": [
      "determiner-number",
      "noun-number"
    ]
  },
  {
    "key": "recognition-17",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "pavillon",
    "prompt": "Plusieurs bâtiments sont montrés.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "ces pavillons",
    "distractors": [
      "ce pavillons",
      "ces pavillon"
    ],
    "forms": [
      "pavillons",
      "pavillons",
      "pavillon"
    ],
    "errorKeys": [
      "determiner-number",
      "noun-number"
    ]
  },
  {
    "key": "recognition-18",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "lemma": "coquille",
    "prompt": "Plusieurs enveloppes vides appartiennent à cette collection.\n\nQuel groupe respecte le sens indiqué et l’accord du déterminant avec le nom ?",
    "answer": "ses coquilles",
    "distractors": [
      "sa coquilles",
      "ses coquille"
    ],
    "forms": [
      "coquilles",
      "coquilles",
      "coquille"
    ],
    "errorKeys": [
      "determiner-number",
      "noun-number"
    ]
  },
  {
    "key": "production-1",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "lézard",
    "prompt": "Mets le groupe « un lézard » au pluriel. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "des lézards",
    "distractors": [
      "un lézards",
      "des lézard",
      "un lézard"
    ],
    "forms": [
      "lézard"
    ],
    "errorKeys": []
  },
  {
    "key": "production-2",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "tempête",
    "prompt": "Mets le groupe « une tempête » au pluriel. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "des tempêtes",
    "distractors": [
      "une tempêtes",
      "des tempête",
      "une tempête"
    ],
    "forms": [
      "tempête"
    ],
    "errorKeys": []
  },
  {
    "key": "production-3",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "papillon",
    "prompt": "Mets le groupe « ce papillon » au pluriel. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "ces papillons",
    "distractors": [
      "ce papillons",
      "ces papillon",
      "ce papillon"
    ],
    "forms": [
      "papillon"
    ],
    "errorKeys": []
  },
  {
    "key": "production-4",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "boucle",
    "prompt": "Mets le groupe « cette boucle » au pluriel. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "ces boucles",
    "distractors": [
      "cette boucles",
      "ces boucle",
      "cette boucle"
    ],
    "forms": [
      "boucle"
    ],
    "errorKeys": []
  },
  {
    "key": "production-5",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "parapluie",
    "prompt": "Mets le groupe « son parapluie » au pluriel. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "ses parapluies",
    "distractors": [
      "son parapluies",
      "ses parapluie",
      "son parapluie"
    ],
    "forms": [
      "parapluie"
    ],
    "errorKeys": []
  },
  {
    "key": "production-6",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "ceinture",
    "prompt": "Mets le groupe « sa ceinture » au pluriel. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "ses ceintures",
    "distractors": [
      "sa ceintures",
      "ses ceinture",
      "sa ceinture"
    ],
    "forms": [
      "ceinture"
    ],
    "errorKeys": []
  },
  {
    "key": "production-7",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "dépliant",
    "prompt": "Mets le groupe « un dépliant » au pluriel. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "des dépliants",
    "distractors": [
      "un dépliants",
      "des dépliant",
      "un dépliant"
    ],
    "forms": [
      "dépliant"
    ],
    "errorKeys": []
  },
  {
    "key": "production-8",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "falaise",
    "prompt": "Mets le groupe « une falaise » au pluriel. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "des falaises",
    "distractors": [
      "une falaises",
      "des falaise",
      "une falaise"
    ],
    "forms": [
      "falaise"
    ],
    "errorKeys": []
  },
  {
    "key": "production-9",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "ruche",
    "prompt": "Mets le groupe « cette ruche » au pluriel. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "ces ruches",
    "distractors": [
      "cette ruches",
      "ces ruche",
      "cette ruche"
    ],
    "forms": [
      "ruche"
    ],
    "errorKeys": []
  },
  {
    "key": "production-10",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "tunnel",
    "prompt": "Mets le groupe « des tunnels » au singulier. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "un tunnel",
    "distractors": [
      "des tunnel",
      "un tunnels",
      "des tunnels"
    ],
    "forms": [
      "tunnels"
    ],
    "errorKeys": []
  },
  {
    "key": "production-11",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "galerie",
    "prompt": "Mets le groupe « des galeries » au singulier. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "une galerie",
    "distractors": [
      "des galerie",
      "une galeries",
      "des galeries"
    ],
    "forms": [
      "galeries"
    ],
    "errorKeys": []
  },
  {
    "key": "production-12",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "moulin",
    "prompt": "Mets le groupe « ces moulins » au singulier. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "ce moulin",
    "distractors": [
      "ces moulin",
      "ce moulins",
      "ces moulins"
    ],
    "forms": [
      "moulins"
    ],
    "errorKeys": []
  },
  {
    "key": "production-13",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "terrasse",
    "prompt": "Mets le groupe « ces terrasses » au singulier. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "cette terrasse",
    "distractors": [
      "ces terrasse",
      "cette terrasses",
      "ces terrasses"
    ],
    "forms": [
      "terrasses"
    ],
    "errorKeys": []
  },
  {
    "key": "production-14",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "blouson",
    "prompt": "Mets le groupe « ses blousons » au singulier. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "son blouson",
    "distractors": [
      "ses blouson",
      "son blousons",
      "ses blousons"
    ],
    "forms": [
      "blousons"
    ],
    "errorKeys": []
  },
  {
    "key": "production-15",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "sacoche",
    "prompt": "Mets le groupe « ses sacoches » au singulier. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "sa sacoche",
    "distractors": [
      "ses sacoche",
      "sa sacoches",
      "ses sacoches"
    ],
    "forms": [
      "sacoches"
    ],
    "errorKeys": []
  },
  {
    "key": "production-16",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "piston",
    "prompt": "Mets le groupe « des pistons » au singulier. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "un piston",
    "distractors": [
      "des piston",
      "un pistons",
      "des pistons"
    ],
    "forms": [
      "pistons"
    ],
    "errorKeys": []
  },
  {
    "key": "production-17",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "prairie",
    "prompt": "Mets le groupe « des prairies » au singulier. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "une prairie",
    "distractors": [
      "des prairie",
      "une prairies",
      "des prairies"
    ],
    "forms": [
      "prairies"
    ],
    "errorKeys": []
  },
  {
    "key": "production-18",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "lemma": "sphère",
    "prompt": "Mets le groupe « ces sphères » au singulier. Garde la même famille de déterminants (un/une/des, ce/cette/ces ou son/sa/ses).",
    "answer": "cette sphère",
    "distractors": [
      "ces sphère",
      "cette sphères",
      "ces sphères"
    ],
    "forms": [
      "sphères"
    ],
    "errorKeys": []
  }
] as const;

export const WRITTEN_DETERMINER_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:written-determiner:recognition",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Reconnaître un groupe déterminant-nom bien accordé",
    "learnerQuestionFr": "Quels mots dois-je changer quand je passe du singulier au pluriel ?",
    "steps": [
      {
        "exampleFr": "un carton → des cartons",
        "explanationFr": "Le déterminant et le nom changent ensemble quand le nombre change. Des et le s de cartons indiquent ici le pluriel."
      },
      {
        "exampleFr": "ce ruban → ces rubans ; cette plume → ces plumes",
        "explanationFr": "Ce et cette distinguent le genre au singulier. Au pluriel, ces convient aux deux genres, et le nom reçoit sa marque du pluriel."
      },
      {
        "exampleFr": "sa lampe → ses lampes",
        "explanationFr": "Pour choisir sa ou ses, regarde le nom possédé, pas le genre de la personne qui possède. Le pluriel de lampe est lampes."
      }
    ],
    "takeawayFr": "Repère le nom, son genre et son nombre, puis vérifie la forme du déterminant et celle du nom.",
    "boundaryFr": "Devant une voyelle, certaines formes changent : mon amie reste un groupe féminin. Les groupes de cette leçon ne couvrent pas tous les déterminants ni tous les pluriels irréguliers.",
    "practice": [
      {
        "id": "written-determiner-guide:recognition:0",
        "promptFr": "Mets « une cloche » au pluriel, en gardant la même famille de déterminants.",
        "answerFr": "des cloches",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « des cloches ». Les deux mots portent des marques compatibles.",
        "choices": [
          "des cloches",
          "une cloches",
          "des cloche"
        ]
      },
      {
        "id": "written-determiner-guide:recognition:1",
        "promptFr": "Mets « ce sachet » au pluriel, en gardant la même famille de déterminants.",
        "answerFr": "ces sachets",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « ces sachets ». Les deux mots portent des marques compatibles.",
        "choices": [
          "ces sachets",
          "ce sachets",
          "ces sachet"
        ]
      },
      {
        "id": "written-determiner-guide:recognition:2",
        "promptFr": "Mets « sa médaille » au pluriel, en gardant la même famille de déterminants.",
        "answerFr": "ses médailles",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « ses médailles ». Les deux mots portent des marques compatibles.",
        "choices": [
          "ses médailles",
          "sa médailles",
          "ses médaille"
        ]
      },
      {
        "id": "written-determiner-guide:recognition:3",
        "promptFr": "Mets « des visages » au singulier, en gardant la même famille de déterminants.",
        "answerFr": "un visage",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « un visage ». Les deux mots portent des marques compatibles.",
        "choices": [
          "un visage",
          "des visage",
          "un visages"
        ]
      },
      {
        "id": "written-determiner-guide:recognition:4",
        "promptFr": "Mets « ces pancartes » au singulier, en gardant la même famille de déterminants.",
        "answerFr": "cette pancarte",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « cette pancarte ». Les deux mots portent des marques compatibles.",
        "choices": [
          "cette pancarte",
          "ces pancarte",
          "cette pancartes"
        ]
      },
      {
        "id": "written-determiner-guide:recognition:5",
        "promptFr": "Mets « ses bracelets » au singulier, en gardant la même famille de déterminants.",
        "answerFr": "son bracelet",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « son bracelet ». Les deux mots portent des marques compatibles.",
        "choices": [
          "son bracelet",
          "ses bracelet",
          "son bracelets"
        ]
      }
    ],
    "materialExposure": {
      "words": [
        {
          "lemma": "cloche",
          "form": "cloche"
        },
        {
          "lemma": "cloche",
          "form": "cloches"
        },
        {
          "lemma": "sachet",
          "form": "sachet"
        },
        {
          "lemma": "sachet",
          "form": "sachets"
        },
        {
          "lemma": "médaille",
          "form": "médaille"
        },
        {
          "lemma": "médaille",
          "form": "médailles"
        },
        {
          "lemma": "visage",
          "form": "visages"
        },
        {
          "lemma": "visage",
          "form": "visage"
        },
        {
          "lemma": "pancarte",
          "form": "pancartes"
        },
        {
          "lemma": "pancarte",
          "form": "pancarte"
        },
        {
          "lemma": "bracelet",
          "form": "bracelets"
        },
        {
          "lemma": "bracelet",
          "form": "bracelet"
        }
      ],
      "sentences": [
        "un carton → des cartons",
        "ce ruban → ces rubans ; cette plume → ces plumes",
        "sa lampe → ses lampes"
      ]
    }
  },
  {
    "id": "french-v3-teaching:written-determiner:production",
    "nodeKey": "accorder_determinant_nom_ecrit",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Écrire les deux mots avec les bons accords",
    "learnerQuestionFr": "Quels mots dois-je changer quand je passe du singulier au pluriel ?",
    "steps": [
      {
        "exampleFr": "un carton → des cartons",
        "explanationFr": "Le déterminant et le nom changent ensemble quand le nombre change. Des et le s de cartons indiquent ici le pluriel."
      },
      {
        "exampleFr": "ce ruban → ces rubans ; cette plume → ces plumes",
        "explanationFr": "Ce et cette distinguent le genre au singulier. Au pluriel, ces convient aux deux genres, et le nom reçoit sa marque du pluriel."
      },
      {
        "exampleFr": "sa lampe → ses lampes",
        "explanationFr": "Pour choisir sa ou ses, regarde le nom possédé, pas le genre de la personne qui possède. Le pluriel de lampe est lampes."
      }
    ],
    "takeawayFr": "Repère le nom, son genre et son nombre, puis vérifie la forme du déterminant et celle du nom.",
    "boundaryFr": "Devant une voyelle, certaines formes changent : mon amie reste un groupe féminin. Les groupes de cette leçon ne couvrent pas tous les déterminants ni tous les pluriels irréguliers.",
    "practice": [
      {
        "id": "written-determiner-guide:production:0",
        "promptFr": "Mets « une cloche » au pluriel, en gardant la même famille de déterminants.",
        "answerFr": "des cloches",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « des cloches ». Les deux mots portent des marques compatibles."
      },
      {
        "id": "written-determiner-guide:production:1",
        "promptFr": "Mets « ce sachet » au pluriel, en gardant la même famille de déterminants.",
        "answerFr": "ces sachets",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « ces sachets ». Les deux mots portent des marques compatibles."
      },
      {
        "id": "written-determiner-guide:production:2",
        "promptFr": "Mets « sa médaille » au pluriel, en gardant la même famille de déterminants.",
        "answerFr": "ses médailles",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « ses médailles ». Les deux mots portent des marques compatibles."
      },
      {
        "id": "written-determiner-guide:production:3",
        "promptFr": "Mets « des visages » au singulier, en gardant la même famille de déterminants.",
        "answerFr": "un visage",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « un visage ». Les deux mots portent des marques compatibles."
      },
      {
        "id": "written-determiner-guide:production:4",
        "promptFr": "Mets « ces pancartes » au singulier, en gardant la même famille de déterminants.",
        "answerFr": "cette pancarte",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « cette pancarte ». Les deux mots portent des marques compatibles."
      },
      {
        "id": "written-determiner-guide:production:5",
        "promptFr": "Mets « ses bracelets » au singulier, en gardant la même famille de déterminants.",
        "answerFr": "son bracelet",
        "hintFr": "Vérifie le déterminant et le nom, pas seulement un des deux.",
        "explanationFr": "Le groupe attendu est « son bracelet ». Les deux mots portent des marques compatibles."
      }
    ],
    "materialExposure": {
      "words": [
        {
          "lemma": "cloche",
          "form": "cloche"
        },
        {
          "lemma": "cloche",
          "form": "cloches"
        },
        {
          "lemma": "sachet",
          "form": "sachet"
        },
        {
          "lemma": "sachet",
          "form": "sachets"
        },
        {
          "lemma": "médaille",
          "form": "médaille"
        },
        {
          "lemma": "médaille",
          "form": "médailles"
        },
        {
          "lemma": "visage",
          "form": "visages"
        },
        {
          "lemma": "visage",
          "form": "visage"
        },
        {
          "lemma": "pancarte",
          "form": "pancartes"
        },
        {
          "lemma": "pancarte",
          "form": "pancarte"
        },
        {
          "lemma": "bracelet",
          "form": "bracelets"
        },
        {
          "lemma": "bracelet",
          "form": "bracelet"
        }
      ],
      "sentences": [
        "un carton → des cartons",
        "ce ruban → ces rubans ; cette plume → ces plumes",
        "sa lampe → ses lampes"
      ]
    }
  }
];
