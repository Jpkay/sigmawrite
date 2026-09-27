import type {TargetTeachingContent} from './teaching-content';
export const REFERENCE_FOUNDATION_RECOGNITION = [
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "1",
    "sentence": "Le pilote vérifie son casque. Il ajuste ensuite la sangle.",
    "token": "Il",
    "answer": "Il est le sujet de ajuste et reprend le pilote.",
    "others": [
      "Il reprend le casque.",
      "Il reprend la sangle.",
      "Il accompagne un nom sans le remplacer."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "2",
    "sentence": "La nageuse rejoint la piscine. Elle salue son entraîneur.",
    "token": "Elle",
    "answer": "Elle est le sujet de salue et reprend la nageuse.",
    "others": [
      "Elle reprend la piscine.",
      "Elle reprend son entraîneur.",
      "Elle désigne plusieurs personnes."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "3",
    "sentence": "Les voisins ferment leurs fenêtres. Ils entendent un orage.",
    "token": "Ils",
    "answer": "Ils est le sujet de entendent et reprend les voisins.",
    "others": [
      "Ils reprend leurs fenêtres.",
      "Ils reprend un orage.",
      "Ils désigne une seule personne."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "4",
    "sentence": "Les étoiles apparaissent entre les branches. Elles brillent doucement.",
    "token": "Elles",
    "answer": "Elles est le sujet de brillent et reprend les étoiles.",
    "others": [
      "Elles reprend les branches.",
      "Elles reprend une seule étoile.",
      "Elles accompagne un nom sans le remplacer."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "5",
    "sentence": "Amir dit : « Je prépare le goûter. »",
    "token": "Je",
    "answer": "Je est le sujet de prépare et désigne Amir, qui parle.",
    "others": [
      "Je désigne la personne qui écoute Amir.",
      "Je reprend le goûter.",
      "Je désigne plusieurs personnes."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "6",
    "sentence": "Léa dit à Hugo : « Tu passes devant. »",
    "token": "Tu",
    "answer": "Tu est le sujet de passes et désigne Hugo, à qui Léa parle.",
    "others": [
      "Tu désigne Léa.",
      "Tu désigne Léa et Hugo ensemble.",
      "Tu reprend devant."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "7",
    "sentence": "Nils et moi arrivons au refuge. Nous posons nos sacs.",
    "token": "Nous",
    "answer": "Nous est le sujet de posons et désigne Nils et la personne qui raconte.",
    "others": [
      "Nous désigne seulement Nils.",
      "Nous reprend nos sacs.",
      "Nous désigne uniquement les personnes qui écoutent."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "8",
    "sentence": "La guide dit aux enfants : « Vous pouvez entrer. »",
    "token": "Vous",
    "answer": "Vous est le sujet de pouvez et désigne les enfants.",
    "others": [
      "Vous désigne la guide.",
      "Vous reprend entrer.",
      "Vous désigne la guide et les enfants ensemble."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "9",
    "sentence": "Jade voit son cousin. Elle le rejoint.",
    "token": "le",
    "answer": "Le reprend son cousin, mais il est complément de rejoint, pas sujet.",
    "others": [
      "Le est le sujet de rejoint.",
      "Le reprend Jade et fait l’action.",
      "Le accompagne un nom dans cette phrase."
    ],
    "negative": true
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "10",
    "sentence": "Le chat traverse la cour.",
    "token": "Le",
    "answer": "Le accompagne le nom chat : ce n’est pas un pronom sujet.",
    "others": [
      "Le remplace chat.",
      "Le est le sujet à lui seul.",
      "Le reprend la cour."
    ],
    "negative": true
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "11",
    "sentence": "Il neige depuis ce matin.",
    "token": "Il",
    "answer": "Il est un sujet grammatical, mais il ne reprend aucune personne ni chose dans cette phrase.",
    "others": [
      "Il reprend ce matin.",
      "Il désigne un garçon déjà nommé.",
      "Il reprend la neige comme un nom écrit avant lui."
    ],
    "negative": true
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "key": "12",
    "sentence": "Mina et son frère discutent. Mina écoute attentivement.",
    "token": "Mina",
    "answer": "Mina est un nom propre répété, pas un pronom sujet.",
    "others": [
      "Mina est un pronom qui remplace son frère.",
      "Mina est un pronom au pluriel.",
      "Mina désigne seulement la personne qui écoute le récit."
    ],
    "negative": true
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "1",
    "sentence": "Le pull gris est plus chaud que le bleu. Je prends celui qui est gris.",
    "token": "celui qui est gris",
    "answer": "Cette expression remplace le pull gris.",
    "others": [
      "Elle remplace le pull bleu.",
      "Elle accompagne le nom pull sans le remplacer.",
      "Elle désigne les deux pulls ensemble."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "2",
    "sentence": "La boîte ronde est vide, la carrée est pleine. Ana ouvre celle qui est carrée.",
    "token": "celle qui est carrée",
    "answer": "Cette expression remplace la boîte carrée.",
    "others": [
      "Elle remplace la boîte ronde.",
      "Elle désigne Ana.",
      "Elle désigne les deux boîtes ensemble."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "3",
    "sentence": "Les crayons rouges sont taillés, les verts ne le sont pas. Je prends ceux qui sont taillés.",
    "token": "ceux qui sont taillés",
    "answer": "Cette expression remplace les crayons rouges.",
    "others": [
      "Elle remplace les crayons verts.",
      "Elle désigne tous les crayons.",
      "Elle accompagne le nom crayons sans le remplacer."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "4",
    "sentence": "Les fleurs du jardin sont fanées. Celles du balcon sont fraîches.",
    "token": "Celles du balcon",
    "answer": "Cette expression remplace les fleurs du balcon.",
    "others": [
      "Elle remplace les fleurs du jardin.",
      "Elle désigne le balcon lui-même.",
      "Elle désigne toutes les fleurs."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "5",
    "sentence": "Le bus est arrivé en avance. Cela a surpris les voyageurs.",
    "token": "Cela",
    "answer": "Cela reprend le fait que le bus est arrivé en avance.",
    "others": [
      "Cela désigne seulement les voyageurs.",
      "Cela désigne uniquement un autre bus.",
      "Cela accompagne le nom voyageurs."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "6",
    "sentence": "Le gardien pose son trousseau sur le bureau. Celui-ci comporte trois tiroirs.",
    "token": "Celui-ci",
    "answer": "Celui-ci remplace le bureau, qui comporte trois tiroirs.",
    "others": [
      "Celui-ci remplace le trousseau.",
      "Celui-ci désigne le gardien.",
      "Celui-ci désigne les trois tiroirs."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "7",
    "sentence": "Deux tentes restaient : une percée et une intacte. Nous avons choisi celle qui était intacte.",
    "token": "celle qui était intacte",
    "answer": "Cette expression remplace la tente intacte.",
    "others": [
      "Elle remplace la tente percée.",
      "Elle désigne les deux tentes.",
      "Elle désigne les personnes qui choisissent."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "8",
    "sentence": "Les coureurs en rouge attendent. Ceux en blanc commencent.",
    "token": "Ceux en blanc",
    "answer": "Cette expression remplace les coureurs en blanc.",
    "others": [
      "Elle remplace les coureurs en rouge.",
      "Elle désigne tous les coureurs.",
      "Elle accompagne le nom coureurs dans la seconde phrase."
    ],
    "negative": false
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "9",
    "sentence": "Cette lampe éclaire le bureau.",
    "token": "Cette",
    "answer": "Cette accompagne le nom lampe : c’est un déterminant, pas un pronom qui remplace le nom.",
    "others": [
      "Cette remplace la lampe.",
      "Cette reprend le bureau.",
      "Cette désigne toute la phrase précédente."
    ],
    "negative": true
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "10",
    "sentence": "Ces livres sont abîmés.",
    "token": "Ces",
    "answer": "Ces accompagne le nom livres : il ne le remplace pas.",
    "others": [
      "Ces remplace les livres.",
      "Ces reprend abîmés.",
      "Ces désigne un seul livre."
    ],
    "negative": true
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "11",
    "sentence": "La comédienne entre. Elle sourit.",
    "token": "Elle",
    "answer": "Elle reprend la comédienne, mais c’est un pronom sujet personnel, pas un démonstratif.",
    "others": [
      "Elle est un pronom démonstratif.",
      "Elle accompagne un nom dans la seconde phrase.",
      "Elle désigne une autre comédienne non mentionnée."
    ],
    "negative": true
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "key": "12",
    "sentence": "La vitre est sale. Je la nettoie.",
    "token": "la",
    "answer": "La reprend la vitre, mais c’est un pronom complément personnel, pas un démonstratif.",
    "others": [
      "La est un pronom démonstratif.",
      "La accompagne le nom nettoie.",
      "La désigne toute l’action de salir."
    ],
    "negative": true
  }
];
export const REFERENCE_FOUNDATION_PRODUCTION = [
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "Le jardinier arrose les semis.",
    "replace": "Le jardinier",
    "answer": "Il arrose les semis.",
    "pronoun": "Il"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "La journaliste prépare une interview.",
    "replace": "La journaliste",
    "answer": "Elle prépare une interview.",
    "pronoun": "Elle"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "Les garçons attendent au portail.",
    "replace": "Les garçons",
    "answer": "Ils attendent au portail.",
    "pronoun": "Ils"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "Les danseuses répètent dans le studio.",
    "replace": "Les danseuses",
    "answer": "Elles répètent dans le studio.",
    "pronoun": "Elles"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "Ma sœur et moi visitons une grotte.",
    "replace": "Ma sœur et moi",
    "answer": "Nous visitons une grotte.",
    "pronoun": "Nous"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "Toi et tes amis préparez une affiche.",
    "replace": "Toi et tes amis",
    "answer": "Vous préparez une affiche.",
    "pronoun": "Vous"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "Le phare éclaire les rochers.",
    "replace": "Le phare",
    "answer": "Il éclaire les rochers.",
    "pronoun": "Il"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "La fusée traverse les nuages.",
    "replace": "La fusée",
    "answer": "Elle traverse les nuages.",
    "pronoun": "Elle"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "Les bateaux quittent le port.",
    "replace": "Les bateaux",
    "answer": "Ils quittent le port.",
    "pronoun": "Ils"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "Les feuilles couvrent le sentier.",
    "replace": "Les feuilles",
    "answer": "Elles couvrent le sentier.",
    "pronoun": "Elles"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "Mon cousin et moi réparons la barrière.",
    "replace": "Mon cousin et moi",
    "answer": "Nous réparons la barrière.",
    "pronoun": "Nous"
  },
  {
    "nodeKey": "construction_pronom_sujet",
    "sentence": "Toi et ta voisine écoutez la radio.",
    "replace": "Toi et ta voisine",
    "answer": "Vous écoutez la radio.",
    "pronoun": "Vous"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Je préfère le gâteau aux noix.",
    "replace": "le gâteau",
    "answer": "Je préfère celui aux noix.",
    "pronoun": "celui"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Elle emporte la veste en laine.",
    "replace": "la veste",
    "answer": "Elle emporte celle en laine.",
    "pronoun": "celle"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Nous utilisons les pinceaux à bout fin.",
    "replace": "les pinceaux",
    "answer": "Nous utilisons ceux à bout fin.",
    "pronoun": "ceux"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Il ramasse les pierres du chemin.",
    "replace": "les pierres",
    "answer": "Il ramasse celles du chemin.",
    "pronoun": "celles"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Tu choisis le fauteuil près de la fenêtre.",
    "replace": "le fauteuil",
    "answer": "Tu choisis celui près de la fenêtre.",
    "pronoun": "celui"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Je répare la roue de devant.",
    "replace": "la roue",
    "answer": "Je répare celle de devant.",
    "pronoun": "celle"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Elle garde les tickets du concert.",
    "replace": "les tickets",
    "answer": "Elle garde ceux du concert.",
    "pronoun": "ceux"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Nous lavons les assiettes du pique-nique.",
    "replace": "les assiettes",
    "answer": "Nous lavons celles du pique-nique.",
    "pronoun": "celles"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Vous admirez le tableau qui représente la mer.",
    "replace": "le tableau",
    "answer": "Vous admirez celui qui représente la mer.",
    "pronoun": "celui"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Je cherche la clé qui ouvre la cave.",
    "replace": "la clé",
    "answer": "Je cherche celle qui ouvre la cave.",
    "pronoun": "celle"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Tu nourris les oiseaux qui vivent ici.",
    "replace": "les oiseaux",
    "answer": "Tu nourris ceux qui vivent ici.",
    "pronoun": "ceux"
  },
  {
    "nodeKey": "construction_reprise_demonstrative",
    "sentence": "Il découpe les images qui montrent des animaux.",
    "replace": "les images",
    "answer": "Il découpe celles qui montrent des animaux.",
    "pronoun": "celles"
  }
];
export const REFERENCE_FOUNDATION_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:reference-foundation:subject:recognition",
    "nodeKey": "construction_pronom_sujet",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Choisir un pronom sujet dans une phrase",
    "learnerQuestionFr": "Quel petit mot remplace ce groupe, et que désigne-t-il ?",
    "steps": [
      {
        "exampleFr": "La pêcheuse répare son filet. Elle vérifie les nœuds.",
        "explanationFr": "Elle remplace la pêcheuse, la personne qui vérifie les nœuds. Ce mot prend la place du sujet du verbe : c’est un pronom sujet."
      },
      {
        "exampleFr": "Mon frère et moi lisons. Nous lisons.",
        "explanationFr": "Nous inclut la personne qui parle. Vous désigne la ou les personnes à qui elle parle. Il, elle, ils et elles permettent de reprendre une personne ou une chose déjà nommée. Vérifie aussi le singulier ou le pluriel."
      }
    ],
    "practice": [
      {
        "id": "subject-recognition-guided-0",
        "promptFr": "Le facteur sonne.\nIl sonne.\n\nQue remplace « Il » dans la deuxième phrase ?",
        "choices": [
          "Le facteur",
          "Le verbe de la phrase.",
          "Toute la phrase précédente.",
          "Aucun mot : il accompagne un nom."
        ],
        "answerFr": "Le facteur",
        "hintFr": "Compare les deux phrases : quel groupe a disparu ?",
        "explanationFr": "« Il » prend la place de « Le facteur ». Les autres mots sont conservés."
      },
      {
        "id": "subject-recognition-guided-1",
        "promptFr": "La musicienne accorde son violon.\nElle accorde son violon.\n\nQue remplace « Elle » dans la deuxième phrase ?",
        "choices": [
          "La musicienne",
          "Le verbe de la phrase.",
          "Toute la phrase précédente.",
          "Aucun mot : il accompagne un nom."
        ],
        "answerFr": "La musicienne",
        "hintFr": "Compare les deux phrases : quel groupe a disparu ?",
        "explanationFr": "« Elle » prend la place de « La musicienne ». Les autres mots sont conservés."
      },
      {
        "id": "subject-recognition-guided-2",
        "promptFr": "Les acrobates sautent.\nIls sautent.\n\nQue remplace « Ils » dans la deuxième phrase ?",
        "choices": [
          "Les acrobates",
          "Le verbe de la phrase.",
          "Toute la phrase précédente.",
          "Aucun mot : il accompagne un nom."
        ],
        "answerFr": "Les acrobates",
        "hintFr": "Compare les deux phrases : quel groupe a disparu ?",
        "explanationFr": "« Ils » prend la place de « Les acrobates ». Les autres mots sont conservés."
      },
      {
        "id": "subject-recognition-guided-3",
        "promptFr": "Les abeilles volent.\nElles volent.\n\nQue remplace « Elles » dans la deuxième phrase ?",
        "choices": [
          "Les abeilles",
          "Le verbe de la phrase.",
          "Toute la phrase précédente.",
          "Aucun mot : il accompagne un nom."
        ],
        "answerFr": "Les abeilles",
        "hintFr": "Compare les deux phrases : quel groupe a disparu ?",
        "explanationFr": "« Elles » prend la place de « Les abeilles ». Les autres mots sont conservés."
      },
      {
        "id": "subject-recognition-guided-4",
        "promptFr": "Mon amie et moi montons la tente.\nNous montons la tente.\n\nQue remplace « Nous » dans la deuxième phrase ?",
        "choices": [
          "Mon amie et moi",
          "Le verbe de la phrase.",
          "Toute la phrase précédente.",
          "Aucun mot : il accompagne un nom."
        ],
        "answerFr": "Mon amie et moi",
        "hintFr": "Compare les deux phrases : quel groupe a disparu ?",
        "explanationFr": "« Nous » prend la place de « Mon amie et moi ». Les autres mots sont conservés."
      },
      {
        "id": "subject-recognition-guided-5",
        "promptFr": "Toi et ton frère cuisinez.\nVous cuisinez.\n\nQue remplace « Vous » dans la deuxième phrase ?",
        "choices": [
          "Toi et ton frère",
          "Le verbe de la phrase.",
          "Toute la phrase précédente.",
          "Aucun mot : il accompagne un nom."
        ],
        "answerFr": "Toi et ton frère",
        "hintFr": "Compare les deux phrases : quel groupe a disparu ?",
        "explanationFr": "« Vous » prend la place de « Toi et ton frère ». Les autres mots sont conservés."
      },
      {
        "id": "construction_pronom_sujet-contrast-guided-0",
        "promptFr": "Il pleut sur la place.\n\nQue fait « Il » ici ?",
        "choices": [
          "Il ne reprend personne ni aucun objet.",
          "Il reprend la place.",
          "Il reprend une personne nommée avant.",
          "Il remplace un nom pluriel."
        ],
        "answerFr": "Il ne reprend personne ni aucun objet.",
        "hintFr": "Vérifie si le mot remplace un nom, accompagne un nom ou reprend une idée.",
        "explanationFr": "Dans il pleut, il sert à construire la phrase mais ne désigne personne."
      },
      {
        "id": "construction_pronom_sujet-contrast-guided-1",
        "promptFr": "Le peintre le regarde.\n\nQue fait « le » ici ?",
        "choices": [
          "Le est complément de regarde et n’est pas le sujet.",
          "Le est le sujet de regarde.",
          "Le désigne toujours le peintre.",
          "Le accompagne un nom après lui."
        ],
        "answerFr": "Le est complément de regarde et n’est pas le sujet.",
        "hintFr": "Vérifie si le mot remplace un nom, accompagne un nom ou reprend une idée.",
        "explanationFr": "Le peintre est le sujet. Le indique ce qui est regardé."
      }
    ],
    "takeawayFr": "Relis le groupe remplacé et vérifie le sens de la phrase. Le pronom doit permettre de savoir de qui ou de quoi on parle.",
    "boundaryFr": "Il ne reprend pas toujours un nom : dans il pleut, il ne désigne personne. Nous et vous se comprennent grâce à la situation de parole. Reconnaître une reprise et la produire par écrit sont évalués séparément.",
    "materialExposure": {
      "sentences": [
        "La pêcheuse répare son filet. Elle vérifie les nœuds.",
        "Mon frère et moi lisons. Nous lisons.",
        "Le facteur sonne.",
        "Il sonne.",
        "La musicienne accorde son violon.",
        "Elle accorde son violon.",
        "Les acrobates sautent.",
        "Ils sautent.",
        "Les abeilles volent.",
        "Elles volent.",
        "Mon amie et moi montons la tente.",
        "Nous montons la tente.",
        "Toi et ton frère cuisinez.",
        "Vous cuisinez.",
        "Il pleut sur la place.",
        "Le peintre le regarde."
      ]
    }
  },
  {
    "id": "french-v3-teaching:reference-foundation:subject:production",
    "nodeKey": "construction_pronom_sujet",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Choisir un pronom sujet en écrivant",
    "learnerQuestionFr": "Quel petit mot remplace ce groupe, et que désigne-t-il ?",
    "steps": [
      {
        "exampleFr": "La pêcheuse répare son filet. Elle vérifie les nœuds.",
        "explanationFr": "Elle remplace la pêcheuse, la personne qui vérifie les nœuds. Ce mot prend la place du sujet du verbe : c’est un pronom sujet."
      },
      {
        "exampleFr": "Mon frère et moi lisons. Nous lisons.",
        "explanationFr": "Nous inclut la personne qui parle. Vous désigne la ou les personnes à qui elle parle. Il, elle, ils et elles permettent de reprendre une personne ou une chose déjà nommée. Vérifie aussi le singulier ou le pluriel."
      }
    ],
    "practice": [
      {
        "id": "subject-production-guided-0",
        "promptFr": "Remplace « Le facteur » par un pronom sujet. Écris la phrase complète en gardant les autres mots.\n\nLe facteur sonne.",
        "answerFr": "Il sonne.",
        "hintFr": "Vérifie qui parle, à qui on parle, puis le genre et le nombre.",
        "explanationFr": "« Il » remplace « Le facteur ». La phrase devient : Il sonne."
      },
      {
        "id": "subject-production-guided-1",
        "promptFr": "Remplace « La musicienne » par un pronom sujet. Écris la phrase complète en gardant les autres mots.\n\nLa musicienne accorde son violon.",
        "answerFr": "Elle accorde son violon.",
        "hintFr": "Vérifie qui parle, à qui on parle, puis le genre et le nombre.",
        "explanationFr": "« Elle » remplace « La musicienne ». La phrase devient : Elle accorde son violon."
      },
      {
        "id": "subject-production-guided-2",
        "promptFr": "Remplace « Les acrobates » par un pronom sujet. Écris la phrase complète en gardant les autres mots.\n\nLes acrobates sautent.",
        "answerFr": "Ils sautent.",
        "hintFr": "Vérifie qui parle, à qui on parle, puis le genre et le nombre.",
        "explanationFr": "« Ils » remplace « Les acrobates ». La phrase devient : Ils sautent."
      },
      {
        "id": "subject-production-guided-3",
        "promptFr": "Remplace « Les abeilles » par un pronom sujet. Écris la phrase complète en gardant les autres mots.\n\nLes abeilles volent.",
        "answerFr": "Elles volent.",
        "hintFr": "Vérifie qui parle, à qui on parle, puis le genre et le nombre.",
        "explanationFr": "« Elles » remplace « Les abeilles ». La phrase devient : Elles volent."
      },
      {
        "id": "subject-production-guided-4",
        "promptFr": "Remplace « Mon amie et moi » par un pronom sujet. Écris la phrase complète en gardant les autres mots.\n\nMon amie et moi montons la tente.",
        "answerFr": "Nous montons la tente.",
        "hintFr": "Vérifie qui parle, à qui on parle, puis le genre et le nombre.",
        "explanationFr": "« Nous » remplace « Mon amie et moi ». La phrase devient : Nous montons la tente."
      },
      {
        "id": "subject-production-guided-5",
        "promptFr": "Remplace « Toi et ton frère » par un pronom sujet. Écris la phrase complète en gardant les autres mots.\n\nToi et ton frère cuisinez.",
        "answerFr": "Vous cuisinez.",
        "hintFr": "Vérifie qui parle, à qui on parle, puis le genre et le nombre.",
        "explanationFr": "« Vous » remplace « Toi et ton frère ». La phrase devient : Vous cuisinez."
      }
    ],
    "takeawayFr": "Relis le groupe remplacé et vérifie le sens de la phrase. Le pronom doit permettre de savoir de qui ou de quoi on parle.",
    "boundaryFr": "Il ne reprend pas toujours un nom : dans il pleut, il ne désigne personne. Nous et vous se comprennent grâce à la situation de parole. Reconnaître une reprise et la produire par écrit sont évalués séparément.",
    "materialExposure": {
      "sentences": [
        "La pêcheuse répare son filet. Elle vérifie les nœuds.",
        "Mon frère et moi lisons. Nous lisons.",
        "Le facteur sonne.",
        "Il sonne.",
        "La musicienne accorde son violon.",
        "Elle accorde son violon.",
        "Les acrobates sautent.",
        "Ils sautent.",
        "Les abeilles volent.",
        "Elles volent.",
        "Mon amie et moi montons la tente.",
        "Nous montons la tente.",
        "Toi et ton frère cuisinez.",
        "Vous cuisinez."
      ]
    }
  },
  {
    "id": "french-v3-teaching:reference-foundation:demonstrative:recognition",
    "nodeKey": "construction_reprise_demonstrative",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Choisir un pronom démonstratif dans une phrase",
    "learnerQuestionFr": "Quel petit mot remplace ce groupe, et que désigne-t-il ?",
    "steps": [
      {
        "exampleFr": "Le bonnet rouge me plaît. Je prends celui qui est rouge.",
        "explanationFr": "Celui remplace le nom bonnet. Qui est rouge précise lequel. On appelle celui un pronom démonstratif : il désigne sans répéter le nom."
      },
      {
        "exampleFr": "Cette écharpe est douce. Celle de Paul est rêche.",
        "explanationFr": "Cette accompagne encore le nom écharpe : c’est un déterminant démonstratif. Celle remplace ce nom. On emploie celui, celle, ceux ou celles selon le genre et le nombre du nom remplacé."
      }
    ],
    "practice": [
      {
        "id": "demonstrative-recognition-guided-0",
        "promptFr": "Je range le bol à pois.\nJe range celui à pois.\n\nQue remplace « celui » dans la deuxième phrase ?",
        "choices": [
          "le bol",
          "Le verbe de la phrase.",
          "Toute la phrase précédente.",
          "Aucun mot : il accompagne un nom."
        ],
        "answerFr": "le bol",
        "hintFr": "Compare les deux phrases : quel groupe a disparu ?",
        "explanationFr": "« celui » prend la place de « le bol ». Les autres mots sont conservés."
      },
      {
        "id": "demonstrative-recognition-guided-1",
        "promptFr": "Tu lis la lettre de ton amie.\nTu lis celle de ton amie.\n\nQue remplace « celle » dans la deuxième phrase ?",
        "choices": [
          "la lettre",
          "Le verbe de la phrase.",
          "Toute la phrase précédente.",
          "Aucun mot : il accompagne un nom."
        ],
        "answerFr": "la lettre",
        "hintFr": "Compare les deux phrases : quel groupe a disparu ?",
        "explanationFr": "« celle » prend la place de « la lettre ». Les autres mots sont conservés."
      },
      {
        "id": "demonstrative-recognition-guided-2",
        "promptFr": "Nous fermons les volets du salon.\nNous fermons ceux du salon.\n\nQue remplace « ceux » dans la deuxième phrase ?",
        "choices": [
          "les volets",
          "Le verbe de la phrase.",
          "Toute la phrase précédente.",
          "Aucun mot : il accompagne un nom."
        ],
        "answerFr": "les volets",
        "hintFr": "Compare les deux phrases : quel groupe a disparu ?",
        "explanationFr": "« ceux » prend la place de « les volets ». Les autres mots sont conservés."
      },
      {
        "id": "demonstrative-recognition-guided-3",
        "promptFr": "Elle choisit les chaussures qui sont sèches.\nElle choisit celles qui sont sèches.\n\nQue remplace « celles » dans la deuxième phrase ?",
        "choices": [
          "les chaussures",
          "Le verbe de la phrase.",
          "Toute la phrase précédente.",
          "Aucun mot : il accompagne un nom."
        ],
        "answerFr": "les chaussures",
        "hintFr": "Compare les deux phrases : quel groupe a disparu ?",
        "explanationFr": "« celles » prend la place de « les chaussures ». Les autres mots sont conservés."
      },
      {
        "id": "construction_reprise_demonstrative-contrast-guided-0",
        "promptFr": "Cet arbre a poussé.\n\nQue fait « Cet » ici ?",
        "choices": [
          "Cet accompagne arbre : il ne remplace pas le nom.",
          "Cet remplace arbre.",
          "Cet reprend toute la phrase.",
          "Cet désigne une autre plante."
        ],
        "answerFr": "Cet accompagne arbre : il ne remplace pas le nom.",
        "hintFr": "Vérifie si le mot remplace un nom, accompagne un nom ou reprend une idée.",
        "explanationFr": "Le nom arbre est présent juste après Cet. Cet est donc un déterminant."
      },
      {
        "id": "construction_reprise_demonstrative-contrast-guided-1",
        "promptFr": "Notre équipe a gagné. Cela nous réjouit.\n\nQue fait « Cela » ici ?",
        "choices": [
          "Cela reprend le fait que notre équipe a gagné.",
          "Cela désigne seulement notre équipe.",
          "Cela accompagne le nom équipe.",
          "Cela désigne les adversaires."
        ],
        "answerFr": "Cela reprend le fait que notre équipe a gagné.",
        "hintFr": "Vérifie si le mot remplace un nom, accompagne un nom ou reprend une idée.",
        "explanationFr": "Cela peut reprendre une idée entière, ici la victoire de notre équipe."
      }
    ],
    "takeawayFr": "Relis le groupe remplacé et vérifie le sens de la phrase. Le pronom doit permettre de savoir de qui ou de quoi on parle.",
    "boundaryFr": "Celui et celle ont généralement une précision : celui de Zoé, celle qui chante, celui-ci. Cela peut reprendre une idée entière. Un geste peut aussi être nécessaire hors d’un texte. Ici, les transformations portent sur un nom et gardent sa précision.",
    "materialExposure": {
      "sentences": [
        "Le bonnet rouge me plaît. Je prends celui qui est rouge.",
        "Cette écharpe est douce. Celle de Paul est rêche.",
        "Je range le bol à pois.",
        "Je range celui à pois.",
        "Tu lis la lettre de ton amie.",
        "Tu lis celle de ton amie.",
        "Nous fermons les volets du salon.",
        "Nous fermons ceux du salon.",
        "Elle choisit les chaussures qui sont sèches.",
        "Elle choisit celles qui sont sèches.",
        "Cet arbre a poussé.",
        "Notre équipe a gagné. Cela nous réjouit."
      ]
    }
  },
  {
    "id": "french-v3-teaching:reference-foundation:demonstrative:production",
    "nodeKey": "construction_reprise_demonstrative",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Choisir un pronom démonstratif en écrivant",
    "learnerQuestionFr": "Quel petit mot remplace ce groupe, et que désigne-t-il ?",
    "steps": [
      {
        "exampleFr": "Le bonnet rouge me plaît. Je prends celui qui est rouge.",
        "explanationFr": "Celui remplace le nom bonnet. Qui est rouge précise lequel. On appelle celui un pronom démonstratif : il désigne sans répéter le nom."
      },
      {
        "exampleFr": "Cette écharpe est douce. Celle de Paul est rêche.",
        "explanationFr": "Cette accompagne encore le nom écharpe : c’est un déterminant démonstratif. Celle remplace ce nom. On emploie celui, celle, ceux ou celles selon le genre et le nombre du nom remplacé."
      }
    ],
    "practice": [
      {
        "id": "demonstrative-production-guided-0",
        "promptFr": "Remplace « le bol » par un pronom démonstratif. Écris la phrase complète en gardant les autres mots.\n\nJe range le bol à pois.",
        "answerFr": "Je range celui à pois.",
        "hintFr": "Choisis celui, celle, ceux ou celles et garde la précision qui suit.",
        "explanationFr": "« celui » remplace « le bol ». La phrase devient : Je range celui à pois."
      },
      {
        "id": "demonstrative-production-guided-1",
        "promptFr": "Remplace « la lettre » par un pronom démonstratif. Écris la phrase complète en gardant les autres mots.\n\nTu lis la lettre de ton amie.",
        "answerFr": "Tu lis celle de ton amie.",
        "hintFr": "Choisis celui, celle, ceux ou celles et garde la précision qui suit.",
        "explanationFr": "« celle » remplace « la lettre ». La phrase devient : Tu lis celle de ton amie."
      },
      {
        "id": "demonstrative-production-guided-2",
        "promptFr": "Remplace « les volets » par un pronom démonstratif. Écris la phrase complète en gardant les autres mots.\n\nNous fermons les volets du salon.",
        "answerFr": "Nous fermons ceux du salon.",
        "hintFr": "Choisis celui, celle, ceux ou celles et garde la précision qui suit.",
        "explanationFr": "« ceux » remplace « les volets ». La phrase devient : Nous fermons ceux du salon."
      },
      {
        "id": "demonstrative-production-guided-3",
        "promptFr": "Remplace « les chaussures » par un pronom démonstratif. Écris la phrase complète en gardant les autres mots.\n\nElle choisit les chaussures qui sont sèches.",
        "answerFr": "Elle choisit celles qui sont sèches.",
        "hintFr": "Choisis celui, celle, ceux ou celles et garde la précision qui suit.",
        "explanationFr": "« celles » remplace « les chaussures ». La phrase devient : Elle choisit celles qui sont sèches."
      }
    ],
    "takeawayFr": "Relis le groupe remplacé et vérifie le sens de la phrase. Le pronom doit permettre de savoir de qui ou de quoi on parle.",
    "boundaryFr": "Celui et celle ont généralement une précision : celui de Zoé, celle qui chante, celui-ci. Cela peut reprendre une idée entière. Un geste peut aussi être nécessaire hors d’un texte. Ici, les transformations portent sur un nom et gardent sa précision.",
    "materialExposure": {
      "sentences": [
        "Le bonnet rouge me plaît. Je prends celui qui est rouge.",
        "Cette écharpe est douce. Celle de Paul est rêche.",
        "Je range le bol à pois.",
        "Je range celui à pois.",
        "Tu lis la lettre de ton amie.",
        "Tu lis celle de ton amie.",
        "Nous fermons les volets du salon.",
        "Nous fermons ceux du salon.",
        "Elle choisit les chaussures qui sont sèches.",
        "Elle choisit celles qui sont sèches."
      ]
    }
  }
];
