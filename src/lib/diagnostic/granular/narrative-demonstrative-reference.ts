import type {TargetTeachingContent} from './teaching-content';

export const NARRATIVE_DEMONSTRATIVE_REFERENCE_DRAFTS = [
  {
    "key": "manga",
    "passage": "Lina hésita entre un manga illustré et un roman sans images. Elle emporta celui qui était illustré. Elle voulait regarder les dessins.",
    "pronoun": "celui qui était illustré",
    "sentence": "Elle emporta celui qui était illustré.",
    "answer": "le manga",
    "distractors": [
      "le roman",
      "Lina",
      "les dessins"
    ],
    "support": "Lina hésita entre un manga illustré et un roman sans images.",
    "otherSpans": [
      "Elle emporta celui qui était illustré.",
      "Elle voulait regarder les dessins."
    ],
    "nodeKey": "resoudre_demonstratif",
    "genre": "narrative",
    "question": "Dans « Elle emporta celui qui était illustré. », qui ou que désigne « celui qui était illustré » ?",
    "reason": "Relier un pronom démonstratif à son référent dans un récit court, en utilisant les indices du texte plutôt qu’une règle de proximité automatique."
  },
  {
    "key": "coat",
    "passage": "Sami posa son manteau près de son sac. Celui-ci contenait encore ses cahiers. Sami les sortit pour travailler.",
    "pronoun": "Celui-ci",
    "sentence": "Celui-ci contenait encore ses cahiers.",
    "answer": "son sac",
    "distractors": [
      "son manteau",
      "ses cahiers",
      "Sami"
    ],
    "support": "Sami posa son manteau près de son sac.",
    "otherSpans": [
      "Celui-ci contenait encore ses cahiers.",
      "Sami les sortit pour travailler."
    ],
    "nodeKey": "resoudre_demonstratif",
    "genre": "narrative",
    "question": "Dans « Celui-ci contenait encore ses cahiers. », qui ou que désigne « Celui-ci » ?",
    "reason": "Relier un pronom démonstratif à son référent dans un récit court, en utilisant les indices du texte plutôt qu’une règle de proximité automatique."
  },
  {
    "key": "bike",
    "passage": "Inès retrouva sa trottinette à côté de sa bicyclette. Celle-ci avait une pédale cassée. Inès renonça à pédaler.",
    "pronoun": "Celle-ci",
    "sentence": "Celle-ci avait une pédale cassée.",
    "answer": "sa bicyclette",
    "distractors": [
      "sa trottinette",
      "Inès",
      "la pédale"
    ],
    "support": "Inès retrouva sa trottinette à côté de sa bicyclette.",
    "otherSpans": [
      "Celle-ci avait une pédale cassée.",
      "Inès renonça à pédaler."
    ],
    "nodeKey": "resoudre_demonstratif",
    "genre": "narrative",
    "question": "Dans « Celle-ci avait une pédale cassée. », qui ou que désigne « Celle-ci » ?",
    "reason": "Relier un pronom démonstratif à son référent dans un récit court, en utilisant les indices du texte plutôt qu’une règle de proximité automatique."
  },
  {
    "key": "photos",
    "passage": "Noé étala des photos vierges au dos et des cartes postales couvertes de messages. Celles-ci racontaient les vacances de ses cousins. Il relut leurs nouvelles avec plaisir.",
    "pronoun": "Celles-ci",
    "sentence": "Celles-ci racontaient les vacances de ses cousins.",
    "answer": "les cartes postales",
    "distractors": [
      "les photos",
      "ses cousins",
      "les messages"
    ],
    "support": "Noé étala des photos vierges au dos et des cartes postales couvertes de messages.",
    "otherSpans": [
      "Celles-ci racontaient les vacances de ses cousins.",
      "Il relut leurs nouvelles avec plaisir."
    ],
    "nodeKey": "resoudre_demonstratif",
    "genre": "narrative",
    "question": "Dans « Celles-ci racontaient les vacances de ses cousins. », qui ou que désigne « Celles-ci » ?",
    "reason": "Relier un pronom démonstratif à son référent dans un récit court, en utilisant les indices du texte plutôt qu’une règle de proximité automatique."
  },
  {
    "key": "skates",
    "passage": "Aya avait rangé ses patins sous les bancs. Ceux-ci étaient fixés au sol et ne pouvaient pas bouger. Elle se glissa dessous pour récupérer ses patins.",
    "pronoun": "Ceux-ci",
    "sentence": "Ceux-ci étaient fixés au sol et ne pouvaient pas bouger.",
    "answer": "les bancs",
    "distractors": [
      "ses patins",
      "Aya",
      "le sol"
    ],
    "support": "Aya avait rangé ses patins sous les bancs.",
    "otherSpans": [
      "Ceux-ci étaient fixés au sol et ne pouvaient pas bouger.",
      "Elle se glissa dessous pour récupérer ses patins."
    ],
    "nodeKey": "resoudre_demonstratif",
    "genre": "narrative",
    "question": "Dans « Ceux-ci étaient fixés au sol et ne pouvaient pas bouger. », qui ou que désigne « Ceux-ci » ?",
    "reason": "Relier un pronom démonstratif à son référent dans un récit court, en utilisant les indices du texte plutôt qu’une règle de proximité automatique."
  },
  {
    "key": "red",
    "passage": "Malo compara deux cerfs-volants : un rouge et un bleu. Il choisit celui qui portait une étoile blanche, le rouge. Il courut sur la plage avec son achat.",
    "pronoun": "celui qui portait une étoile blanche",
    "sentence": "Il choisit celui qui portait une étoile blanche, le rouge.",
    "answer": "le cerf-volant rouge",
    "distractors": [
      "le cerf-volant bleu",
      "Malo",
      "la plage"
    ],
    "support": "Malo compara deux cerfs-volants : un rouge et un bleu.",
    "otherSpans": [
      "Il choisit celui qui portait une étoile blanche, le rouge.",
      "Il courut sur la plage avec son achat."
    ],
    "nodeKey": "resoudre_demonstratif",
    "genre": "narrative",
    "question": "Dans « Il choisit celui qui portait une étoile blanche, le rouge. », qui ou que désigne « celui qui portait une étoile blanche » ?",
    "reason": "Relier un pronom démonstratif à son référent dans un récit court, en utilisant les indices du texte plutôt qu’une règle de proximité automatique."
  },
  {
    "key": "plants",
    "passage": "Zoé regarda les plantes de la cour et les plantes du préau. Elle arrosa celles du préau, car la pluie ne les avait pas atteintes. Puis elle rangea son arrosoir.",
    "pronoun": "celles du préau",
    "sentence": "Elle arrosa celles du préau, car la pluie ne les avait pas atteintes.",
    "answer": "les plantes du préau",
    "distractors": [
      "les plantes de la cour",
      "la pluie",
      "son arrosoir"
    ],
    "support": "Zoé regarda les plantes de la cour et les plantes du préau.",
    "otherSpans": [
      "Elle arrosa celles du préau, car la pluie ne les avait pas atteintes.",
      "Puis elle rangea son arrosoir."
    ],
    "nodeKey": "resoudre_demonstratif",
    "genre": "narrative",
    "question": "Dans « Elle arrosa celles du préau, car la pluie ne les avait pas atteintes. », qui ou que désigne « celles du préau » ?",
    "reason": "Relier un pronom démonstratif à son référent dans un récit court, en utilisant les indices du texte plutôt qu’une règle de proximité automatique."
  },
  {
    "key": "team",
    "passage": "Des joueurs portaient un brassard jaune, les autres un brassard vert. Ceux qui portaient du jaune entrèrent les premiers sur le terrain. Le match allait commencer.",
    "pronoun": "Ceux qui portaient du jaune",
    "sentence": "Ceux qui portaient du jaune entrèrent les premiers sur le terrain.",
    "answer": "les joueurs au brassard jaune",
    "distractors": [
      "les joueurs au brassard vert",
      "tous les joueurs",
      "les brassards"
    ],
    "support": "Des joueurs portaient un brassard jaune, les autres un brassard vert.",
    "otherSpans": [
      "Ceux qui portaient du jaune entrèrent les premiers sur le terrain.",
      "Le match allait commencer."
    ],
    "nodeKey": "resoudre_demonstratif",
    "genre": "narrative",
    "question": "Dans « Ceux qui portaient du jaune entrèrent les premiers sur le terrain. », qui ou que désigne « Ceux qui portaient du jaune » ?",
    "reason": "Relier un pronom démonstratif à son référent dans un récit court, en utilisant les indices du texte plutôt qu’une règle de proximité automatique."
  }
];

export const NARRATIVE_DEMONSTRATIVE_REFERENCE_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:narrative-demonstrative-reference",
    "nodeKey": "resoudre_demonstratif",
    "facetKey": "resoudre_demonstratif::text_type:narrative",
    "mode": "interpretation",
    "status": "draft_requires_review",
    "titleFr": "Retrouver ce que désignent celui, celle et ceux",
    "learnerQuestionFr": "De qui ou de quoi parle ce petit mot dans l’histoire ?",
    "steps": [
      {
        "exampleFr": "Jade avait une écharpe rouge et une écharpe verte. Elle mit celle qui était verte.",
        "explanationFr": "Jade met l’écharpe verte. Celle évite de répéter écharpe, et qui était verte indique laquelle. Ce mot qui remplace un nom en désignant une personne ou une chose est un pronom démonstratif."
      },
      {
        "exampleFr": "Tom déposa les ballons près des poteaux. Ceux-ci étaient solidement plantés dans le sol.",
        "explanationFr": "Ceux-ci désigne les poteaux : ils sont plantés dans le sol. Relis les noms possibles et remplace le pronom par chacun. Vérifie le singulier ou le pluriel, puis le sens de toute la phrase."
      }
    ],
    "practice": [
      {
        "id": "narrative-demonstrative-guided-0",
        "promptFr": "Emma posa une guitare près de sa valise. Celle-ci était remplie de vêtements.\n\nQui ou que désigne « Celle-ci » ?",
        "choices": [
          "sa valise",
          "une guitare",
          "Emma",
          "les vêtements"
        ],
        "answerFr": "sa valise",
        "hintFr": "Relis les noms possibles et les mots qui précisent de quoi on parle.",
        "explanationFr": "Une valise peut contenir les vêtements. Remplacer Celle-ci par sa valise garde le sens de cette histoire."
      },
      {
        "id": "narrative-demonstrative-guided-1",
        "promptFr": "Deux biscuits restaient : un au citron et un au chocolat. Yan prit celui au citron.\n\nQui ou que désigne « celui au citron » ?",
        "choices": [
          "le biscuit au citron",
          "le biscuit au chocolat",
          "Yan",
          "les deux biscuits"
        ],
        "answerFr": "le biscuit au citron",
        "hintFr": "Relis les noms possibles et les mots qui précisent de quoi on parle.",
        "explanationFr": "Celui remplace le nom biscuit. Les mots au citron précisent lequel des deux."
      },
      {
        "id": "narrative-demonstrative-guided-2",
        "promptFr": "Les chaussures sèches étaient sur le tapis, les chaussures mouillées près du radiateur. Lou enfila celles qui étaient sèches.\n\nQui ou que désigne « celles qui étaient sèches » ?",
        "choices": [
          "les chaussures sur le tapis",
          "les chaussures près du radiateur",
          "Lou",
          "le radiateur"
        ],
        "answerFr": "les chaussures sur le tapis",
        "hintFr": "Relis les noms possibles et les mots qui précisent de quoi on parle.",
        "explanationFr": "Le texte place les chaussures sèches sur le tapis. Celles reprend chaussures, puis qui étaient sèches permet de choisir le bon groupe."
      },
      {
        "id": "narrative-demonstrative-guided-3",
        "promptFr": "Les enfants avaient des billets, mais certains avaient oublié leur gourde. Ceux qui avaient oublié leur gourde retournèrent au vestiaire.\n\nQui ou que désigne « Ceux qui avaient oublié leur gourde » ?",
        "choices": [
          "les enfants sans leur gourde",
          "tous les enfants",
          "les billets",
          "les gourdes"
        ],
        "answerFr": "les enfants sans leur gourde",
        "hintFr": "Relis les noms possibles et les mots qui précisent de quoi on parle.",
        "explanationFr": "Ceux désigne des enfants. La suite de la phrase limite ce groupe aux enfants qui ont oublié leur gourde."
      }
    ],
    "takeawayFr": "Cherche ce que le petit mot remplace, puis utilise les précisions et le sens du récit pour choisir. Ne choisis pas automatiquement le nom le plus proche.",
    "boundaryFr": "Ces récits donnent assez d’indices pour retrouver la réponse. Dans une conversation, un geste peut être nécessaire pour comprendre celui-là. Certains textes restent ambigus : le pronom seul ne permet pas toujours de décider.",
    "materialExposure": {
      "sentences": [
        "Jade avait une écharpe rouge et une écharpe verte. Elle mit celle qui était verte.",
        "Tom déposa les ballons près des poteaux. Ceux-ci étaient solidement plantés dans le sol.",
        "Emma posa une guitare près de sa valise. Celle-ci était remplie de vêtements.",
        "Deux biscuits restaient : un au citron et un au chocolat. Yan prit celui au citron.",
        "Les chaussures sèches étaient sur le tapis, les chaussures mouillées près du radiateur. Lou enfila celles qui étaient sèches.",
        "Les enfants avaient des billets, mais certains avaient oublié leur gourde. Ceux qui avaient oublié leur gourde retournèrent au vestiaire."
      ]
    }
  }
];
