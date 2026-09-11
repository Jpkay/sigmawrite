import type {TargetTeachingContent} from "./teaching-content";
/** Fictional examples. Drafts require pedagogical and exposure review. */
export const READING_INFORMATION_TEACHING:readonly TargetTeachingContent[]=[
  {
    "id": "french-v3-teaching:reading:localiser_information_explicite:informational",
    "nodeKey": "localiser_information_explicite",
    "facetKey": "localiser_information_explicite::text_type:informational",
    "mode": "interpretation",
    "status": "draft_requires_review",
    "titleFr": "Trouver la bonne information dans une annonce",
    "learnerQuestionFr": "Plusieurs dates et lieux apparaissent : lequel répond à la question ?",
    "steps": [
      {
        "exampleFr": "Les valises sont déposées à l’accueil. Le départ est prévu à dix heures devant la gare.",
        "explanationFr": "Où faut-il déposer les valises ? À l’accueil. « Devant la gare » est aussi un lieu, mais il concerne le départ. Il faut associer chaque information à la bonne action."
      },
      {
        "exampleFr": "Question : où déposer les valises ? Passage utile : « Les valises sont déposées à l’accueil. »",
        "explanationFr": "Le mot « où » demande un lieu. Cherche ensuite l’action demandée, déposer les valises. La réponse est écrite directement dans le texte : c’est une information explicite."
      },
      {
        "exampleFr": "Les valises ne sont plus déposées à l’accueil : utilisez le local près de l’entrée.",
        "explanationFr": "Lis aussi les mots qui changent le sens. « Ne sont plus » écarte l’ancien lieu. Ici, la réponse est le local près de l’entrée, même si « accueil » apparaît dans le texte."
      }
    ],
    "takeawayFr": "Repère ce que la question demande : qui, où, quand ou combien. Retrouve l’action concernée et relis toute la phrase avant de choisir.",
    "boundaryFr": "Repérer une information écrite ne consiste pas à deviner une raison cachée. Si le renseignement demandé manque, on ne peut pas l’inventer. Ces exercices portent sur de courtes annonces.",
    "practice": [
      {
        "id": "reading-localiser_information_explicite-guide-1",
        "promptFr": "Les serviettes sont disponibles au vestiaire. Les objets trouvés doivent être remis à la réception. La piscine ferme à dix-huit heures.\n\nOù faut-il remettre les objets trouvés ?",
        "choices": [
          "À la réception.",
          "Au vestiaire.",
          "Dans la piscine.",
          "Le texte ne le précise pas."
        ],
        "answerFr": "À la réception.",
        "hintFr": "Cherche la phrase qui parle des objets trouvés, pas celle qui parle des serviettes.",
        "explanationFr": "« Les objets trouvés doivent être remis à la réception » contient la réponse. Le vestiaire concerne les serviettes."
      },
      {
        "id": "reading-localiser_information_explicite-guide-2",
        "promptFr": "La séance de lecture est déplacée de mardi à jeudi. Elle commence toujours à dix-sept heures. Les inscriptions se terminent lundi.\n\nQuel jour la séance aura-t-elle lieu ?",
        "choices": [
          "Jeudi.",
          "Mardi.",
          "Lundi.",
          "Le texte ne donne aucun jour."
        ],
        "answerFr": "Jeudi.",
        "hintFr": "Distingue l’ancien jour, le nouveau jour et la date limite d’inscription.",
        "explanationFr": "Le déplacement « de mardi à jeudi » fixe la séance au jeudi. Lundi concerne les inscriptions."
      },
      {
        "id": "reading-localiser_information_explicite-guide-3",
        "promptFr": "Pour la collecte, Maëlle trie les vêtements et Idriss pèse les sacs. Lucie note le poids de chaque sac dans le cahier.\n\nQui note les poids ?",
        "choices": [
          "Lucie.",
          "Maëlle.",
          "Idriss.",
          "Les trois personnes ensemble."
        ],
        "answerFr": "Lucie.",
        "hintFr": "Quelle personne est associée au verbe « note » ?",
        "explanationFr": "Idriss pèse les sacs, mais c’est Lucie qui note les poids. Maëlle s’occupe du tri."
      },
      {
        "id": "reading-localiser_information_explicite-guide-4",
        "promptFr": "Chaque boîte contient six cartes rouges et quatre cartes bleues. Deux boîtes sont distribuées à chaque table.\n\nCombien de cartes bleues contient une boîte ?",
        "choices": [
          "Quatre.",
          "Six.",
          "Deux.",
          "Huit."
        ],
        "answerFr": "Quatre.",
        "hintFr": "La question porte sur une seule boîte et sur les cartes bleues.",
        "explanationFr": "La phrase indique quatre cartes bleues par boîte. Deux est le nombre de boîtes par table; huit serait le total de cartes bleues de deux boîtes."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Les valises sont déposées à l’accueil. Le départ est prévu à dix heures devant la gare.",
        "Question : où déposer les valises ? Passage utile : « Les valises sont déposées à l’accueil. »",
        "Les valises ne sont plus déposées à l’accueil : utilisez le local près de l’entrée.",
        "Les serviettes sont disponibles au vestiaire. Les objets trouvés doivent être remis à la réception. La piscine ferme à dix-huit heures.",
        "La séance de lecture est déplacée de mardi à jeudi. Elle commence toujours à dix-sept heures. Les inscriptions se terminent lundi.",
        "Pour la collecte, Maëlle trie les vêtements et Idriss pèse les sacs. Lucie note le poids de chaque sac dans le cahier.",
        "Chaque boîte contient six cartes rouges et quatre cartes bleues. Deux boîtes sont distribuées à chaque table."
      ]
    }
  },
  {
    "id": "french-v3-teaching:reading:distinguer_fait_opinion:argumentative",
    "nodeKey": "distinguer_fait_opinion",
    "facetKey": "distinguer_fait_opinion::text_type:argumentative",
    "mode": "interpretation",
    "status": "draft_requires_review",
    "titleFr": "Distinguer une information vérifiable d’un avis",
    "learnerQuestionFr": "Est-ce une information à vérifier ou un jugement personnel ?",
    "steps": [
      {
        "exampleFr": "Le refuge accueille douze chiens. Je trouve que les chiens sont les meilleurs compagnons.",
        "explanationFr": "On peut compter les chiens du refuge. En revanche, « les meilleurs compagnons » exprime une préférence : une autre personne peut préférer les chats sans se tromper dans un comptage."
      },
      {
        "exampleFr": "Information vérifiable : le refuge accueille douze chiens. Avis : les chiens sont les meilleurs compagnons.",
        "explanationFr": "La première phrase présente une affirmation factuelle, que l’on peut vérifier. La seconde exprime une opinion, un jugement ou une préférence. Une opinion peut avoir des raisons : elle n’est pas forcément donnée au hasard."
      },
      {
        "exampleFr": "Ce dessin est magnifique. Je crois que le dessin mesure trente centimètres de large.",
        "explanationFr": "« Magnifique » porte un jugement, même sans « je trouve ». La largeur reste vérifiable avec une règle, même si « je crois » marque une hésitation. Ne classe pas la phrase à partir d’un seul petit mot."
      }
    ],
    "takeawayFr": "Demande-toi comment vérifier l’affirmation. Un lieu, une mesure ou un événement peuvent être contrôlés. « Le plus beau » ou « préférable » expriment généralement un jugement.",
    "boundaryFr": "Une affirmation factuelle peut être fausse : il faut encore la vérifier. La reconnaître ne prouve pas sa vérité. Une phrase peut aussi mélanger une information et un avis; examine alors chaque partie.",
    "practice": [
      {
        "id": "reading-distinguer_fait_opinion-guide-1",
        "promptFr": "Le nouveau sentier mesure deux kilomètres. À mes yeux, c’est la plus belle promenade du quartier. On devrait la recommander à tout le monde.\n\nQuelle affirmation peut être vérifiée par une mesure ?",
        "choices": [
          "Le sentier mesure deux kilomètres.",
          "C’est la plus belle promenade du quartier.",
          "On devrait la recommander à tout le monde.",
          "Toutes ces affirmations sont des mesures."
        ],
        "answerFr": "Le sentier mesure deux kilomètres.",
        "hintFr": "Quelle phrase donne une longueur ?",
        "explanationFr": "Deux kilomètres est une longueur mesurable. « La plus belle » est une appréciation, et la recommandation exprime un choix."
      },
      {
        "id": "reading-distinguer_fait_opinion-guide-2",
        "promptFr": "Le roman comporte quinze chapitres. Son dernier chapitre est splendide. L’autrice a signé les exemplaires samedi.\n\nQuelle phrase exprime un jugement sur la qualité du roman ?",
        "choices": [
          "Son dernier chapitre est splendide.",
          "Le roman comporte quinze chapitres.",
          "L’autrice a signé les exemplaires samedi.",
          "Aucune, car il n’y a pas « je pense »."
        ],
        "answerFr": "Son dernier chapitre est splendide.",
        "hintFr": "Un avis peut apparaître sans « je » ni « à mon avis ».",
        "explanationFr": "« Splendide » évalue la qualité du chapitre. Le nombre de chapitres et la séance de signature sont des informations vérifiables."
      },
      {
        "id": "reading-distinguer_fait_opinion-guide-3",
        "promptFr": "Je crois que la passerelle a été ouverte en avril. Elle est beaucoup plus élégante que l’ancien pont. Ce serait dommage de la remplacer.\n\nQuelle affirmation reste vérifiable malgré l’hésitation de la personne ?",
        "choices": [
          "La passerelle a été ouverte en avril.",
          "Elle est beaucoup plus élégante que l’ancien pont.",
          "Ce serait dommage de la remplacer.",
          "Aucune affirmation n’est vérifiable après « je crois »."
        ],
        "answerFr": "La passerelle a été ouverte en avril.",
        "hintFr": "On peut chercher une date d’ouverture dans une annonce ou un compte rendu.",
        "explanationFr": "« Je crois » exprime l’incertitude, mais la date peut être vérifiée. Cela ne prouve pas que la date annoncée est exacte."
      },
      {
        "id": "reading-distinguer_fait_opinion-guide-4",
        "promptFr": "La boutique ferme à dix-neuf heures, un horaire vraiment idéal pour les habitants. Elle se trouve en face de la mairie.\n\nQuelle partie exprime un avis ?",
        "choices": [
          "Un horaire vraiment idéal pour les habitants.",
          "La boutique ferme à dix-neuf heures.",
          "Elle se trouve en face de la mairie.",
          "La phrase entière est nécessairement un fait."
        ],
        "answerFr": "Un horaire vraiment idéal pour les habitants.",
        "hintFr": "Sépare l’heure annoncée du jugement porté sur cet horaire.",
        "explanationFr": "L’heure et l’emplacement sont vérifiables. « Vraiment idéal » est une appréciation qui ne convient pas forcément à tous les habitants."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Le refuge accueille douze chiens. Je trouve que les chiens sont les meilleurs compagnons.",
        "Information vérifiable : le refuge accueille douze chiens. Avis : les chiens sont les meilleurs compagnons.",
        "Ce dessin est magnifique. Je crois que le dessin mesure trente centimètres de large.",
        "Le nouveau sentier mesure deux kilomètres. À mes yeux, c’est la plus belle promenade du quartier. On devrait la recommander à tout le monde.",
        "Le roman comporte quinze chapitres. Son dernier chapitre est splendide. L’autrice a signé les exemplaires samedi.",
        "Je crois que la passerelle a été ouverte en avril. Elle est beaucoup plus élégante que l’ancien pont. Ce serait dommage de la remplacer.",
        "La boutique ferme à dix-neuf heures, un horaire vraiment idéal pour les habitants. Elle se trouve en face de la mairie."
      ]
    }
  }
];
