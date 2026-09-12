import type {TargetTeachingContent} from "./teaching-content";

/** Construction analysis and controlled application; no publication approval. */
export const ADJECTIVE_LINK_DRAFTS = [
  {
    "key": "analysis-1",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "La robe de ma sœur est verte.",
    "prompt": "La robe de ma sœur est verte.\n\nQuel mot commande l’accord de « verte » ?",
    "answer": "Le nom « robe », au féminin singulier.",
    "distractors": [
      "Le nom « sœur », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« verte » décrit « robe ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-2",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Les murs de la cabane sont blancs.",
    "prompt": "Les murs de la cabane sont blancs.\n\nQuel mot commande l’accord de « blancs » ?",
    "answer": "Le nom « murs », au masculin pluriel.",
    "distractors": [
      "Le nom « cabane », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« blancs » décrit « murs ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-3",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Les chaussures du gardien sont mouillées.",
    "prompt": "Les chaussures du gardien sont mouillées.\n\nQuel mot commande l’accord de « mouillées » ?",
    "answer": "Le nom « chaussures », au féminin pluriel.",
    "distractors": [
      "Le nom « gardien », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« mouillées » décrit « chaussures ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-4",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Le panier des voisines reste vide.",
    "prompt": "Le panier des voisines reste vide.\n\nQuel mot commande l’accord de « vide » ?",
    "answer": "Le nom « panier », au masculin singulier.",
    "distractors": [
      "Le nom « voisines », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« vide » décrit « panier ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-5",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Une épaisse fumée sort de la cheminée.",
    "prompt": "Une épaisse fumée sort de la cheminée.\n\nQuel mot commande l’accord de « épaisse » ?",
    "answer": "Le nom « fumée », au féminin singulier.",
    "distractors": [
      "Le nom « cheminée », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« épaisse » décrit « fumée ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-6",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "De petits oiseaux traversent le jardin.",
    "prompt": "De petits oiseaux traversent le jardin.\n\nQuel mot commande l’accord de « petits » ?",
    "answer": "Le nom « oiseaux », au masculin pluriel.",
    "distractors": [
      "Le nom « jardin », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« petits » décrit « oiseaux ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-7",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Des fenêtres étroites donnent sur la cour.",
    "prompt": "Des fenêtres étroites donnent sur la cour.\n\nQuel mot commande l’accord de « étroites » ?",
    "answer": "Le nom « fenêtres », au féminin pluriel.",
    "distractors": [
      "Le nom « cour », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« étroites » décrit « fenêtres ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-8",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Un immense arbre domine les maisons.",
    "prompt": "Un immense arbre domine les maisons.\n\nQuel mot commande l’accord de « immense » ?",
    "answer": "Le nom « arbre », au masculin singulier.",
    "distractors": [
      "Le nom « maisons », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« immense » décrit « arbre ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-9",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "La statue, malgré ses défauts, paraît élégante.",
    "prompt": "La statue, malgré ses défauts, paraît élégante.\n\nQuel mot commande l’accord de « élégante » ?",
    "answer": "Le nom « statue », au féminin singulier.",
    "distractors": [
      "Le nom « défauts », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« élégante » décrit « statue ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-10",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Les tiroirs, sous la tablette, semblent profonds.",
    "prompt": "Les tiroirs, sous la tablette, semblent profonds.\n\nQuel mot commande l’accord de « profonds » ?",
    "answer": "Le nom « tiroirs », au masculin pluriel.",
    "distractors": [
      "Le nom « tablette », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« profonds » décrit « tiroirs ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-11",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Les affiches de ce film sont originales.",
    "prompt": "Les affiches de ce film sont originales.\n\nQuel mot commande l’accord de « originales » ?",
    "answer": "Le nom « affiches », au féminin pluriel.",
    "distractors": [
      "Le nom « film », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« originales » décrit « affiches ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-12",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Le costume des acteurs paraît ancien.",
    "prompt": "Le costume des acteurs paraît ancien.\n\nQuel mot commande l’accord de « ancien » ?",
    "answer": "Le nom « costume », au masculin singulier.",
    "distractors": [
      "Le nom « acteurs », parce qu’il est dans la même phrase.",
      "L’adjectif ne dépend d’aucun nom dans cette phrase.",
      "Le verbe détermine à lui seul le genre de l’adjectif."
    ],
    "negative": false,
    "reason": "« ancien » décrit « costume ». L’accord dépend de ce nom, même si un autre groupe les sépare."
  },
  {
    "key": "analysis-absence-1",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Les cyclistes roulent vite.",
    "prompt": "Les cyclistes roulent vite.\n\nQuelle analyse de l’accord nom-adjectif est juste ?",
    "answer": "Cette phrase ne contient pas d’adjectif à accorder avec un nom.",
    "distractors": [
      "Le verbe est un adjectif accordé avec le premier nom.",
      "Chaque mot placé après un nom est un adjectif.",
      "Tous les mots de cette phrase prennent le genre du premier nom."
    ],
    "negative": true,
    "reason": "Il n’y a pas ici de relation nom-adjectif à analyser. Un verbe ou un adverbe n’est pas un adjectif simplement parce qu’il suit un nom."
  },
  {
    "key": "analysis-absence-2",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Le public applaudit.",
    "prompt": "Le public applaudit.\n\nQuelle analyse de l’accord nom-adjectif est juste ?",
    "answer": "Cette phrase ne contient pas d’adjectif à accorder avec un nom.",
    "distractors": [
      "Le verbe est un adjectif accordé avec le premier nom.",
      "Chaque mot placé après un nom est un adjectif.",
      "Tous les mots de cette phrase prennent le genre du premier nom."
    ],
    "negative": true,
    "reason": "Il n’y a pas ici de relation nom-adjectif à analyser. Un verbe ou un adverbe n’est pas un adjectif simplement parce qu’il suit un nom."
  },
  {
    "key": "analysis-absence-3",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "La porte du garage grince.",
    "prompt": "La porte du garage grince.\n\nQuelle analyse de l’accord nom-adjectif est juste ?",
    "answer": "Cette phrase ne contient pas d’adjectif à accorder avec un nom.",
    "distractors": [
      "Le verbe est un adjectif accordé avec le premier nom.",
      "Chaque mot placé après un nom est un adjectif.",
      "Tous les mots de cette phrase prennent le genre du premier nom."
    ],
    "negative": true,
    "reason": "Il n’y a pas ici de relation nom-adjectif à analyser. Un verbe ou un adverbe n’est pas un adjectif simplement parce qu’il suit un nom."
  },
  {
    "key": "analysis-absence-4",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "source": "Les invités parlent doucement.",
    "prompt": "Les invités parlent doucement.\n\nQuelle analyse de l’accord nom-adjectif est juste ?",
    "answer": "Cette phrase ne contient pas d’adjectif à accorder avec un nom.",
    "distractors": [
      "Le verbe est un adjectif accordé avec le premier nom.",
      "Chaque mot placé après un nom est un adjectif.",
      "Tous les mots de cette phrase prennent le genre du premier nom."
    ],
    "negative": true,
    "reason": "Il n’y a pas ici de relation nom-adjectif à analyser. Un verbe ou un adverbe n’est pas un adjectif simplement parce qu’il suit un nom."
  },
  {
    "key": "production-1",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "La nappe du restaurant reste ___.",
    "prompt": "Complète la phrase avec l’adjectif « blanc » correctement accordé.\n\nLa nappe du restaurant reste ___.",
    "answer": "blanche",
    "distractors": [
      "blanc",
      "blancs",
      "blanches"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « nappe ». La forme qui convient est « blanche »."
  },
  {
    "key": "production-2",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Les rayons de la boutique sont ___.",
    "prompt": "Complète la phrase avec l’adjectif « étroit » correctement accordé.\n\nLes rayons de la boutique sont ___.",
    "answer": "étroits",
    "distractors": [
      "étroit",
      "étroite",
      "étroites"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « rayons ». La forme qui convient est « étroits »."
  },
  {
    "key": "production-3",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Les couvertures du bébé sont ___.",
    "prompt": "Complète la phrase avec l’adjectif « chaud » correctement accordé.\n\nLes couvertures du bébé sont ___.",
    "answer": "chaudes",
    "distractors": [
      "chaud",
      "chaude",
      "chauds"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « couvertures ». La forme qui convient est « chaudes »."
  },
  {
    "key": "production-4",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Le dessin des enfants paraît ___.",
    "prompt": "Complète la phrase avec l’adjectif « réussi » correctement accordé.\n\nLe dessin des enfants paraît ___.",
    "answer": "réussi",
    "distractors": [
      "réussie",
      "réussis",
      "réussies"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « dessin ». La forme qui convient est « réussi »."
  },
  {
    "key": "production-5",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Une ___ valise bloque le passage.",
    "prompt": "Complète la phrase avec l’adjectif « lourd » correctement accordé.\n\nUne ___ valise bloque le passage.",
    "answer": "lourde",
    "distractors": [
      "lourd",
      "lourds",
      "lourdes"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « valise ». La forme qui convient est « lourde »."
  },
  {
    "key": "production-6",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "De ___ cordes relient les poteaux.",
    "prompt": "Complète la phrase avec l’adjectif « long » correctement accordé.\n\nDe ___ cordes relient les poteaux.",
    "answer": "longues",
    "distractors": [
      "long",
      "longs",
      "longue"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « cordes ». La forme qui convient est « longues »."
  },
  {
    "key": "production-7",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Un vent ___ traverse les rues.",
    "prompt": "Complète la phrase avec l’adjectif « froid » correctement accordé.\n\nUn vent ___ traverse les rues.",
    "answer": "froid",
    "distractors": [
      "froide",
      "froids",
      "froides"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « vent ». La forme qui convient est « froid »."
  },
  {
    "key": "production-8",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "De ___ éclats couvrent le sol.",
    "prompt": "Complète la phrase avec l’adjectif « petit » correctement accordé.\n\nDe ___ éclats couvrent le sol.",
    "answer": "petits",
    "distractors": [
      "petit",
      "petite",
      "petites"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « éclats ». La forme qui convient est « petits »."
  },
  {
    "key": "production-9",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "La bibliothèque, malgré les travaux, reste ___.",
    "prompt": "Complète la phrase avec l’adjectif « ouvert » correctement accordé.\n\nLa bibliothèque, malgré les travaux, reste ___.",
    "answer": "ouverte",
    "distractors": [
      "ouvert",
      "ouverts",
      "ouvertes"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « bibliothèque ». La forme qui convient est « ouverte »."
  },
  {
    "key": "production-10",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Les boîtes de ce jeu paraissent ___.",
    "prompt": "Complète la phrase avec l’adjectif « léger » correctement accordé.\n\nLes boîtes de ce jeu paraissent ___.",
    "answer": "légères",
    "distractors": [
      "léger",
      "légers",
      "légère"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « boîtes ». La forme qui convient est « légères »."
  },
  {
    "key": "production-11",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Les portails, derrière la haie, sont ___.",
    "prompt": "Complète la phrase avec l’adjectif « fermé » correctement accordé.\n\nLes portails, derrière la haie, sont ___.",
    "answer": "fermés",
    "distractors": [
      "fermé",
      "fermée",
      "fermées"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « portails ». La forme qui convient est « fermés »."
  },
  {
    "key": "production-12",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Le village des pêcheurs semble ___.",
    "prompt": "Complète la phrase avec l’adjectif « isolé » correctement accordé.\n\nLe village des pêcheurs semble ___.",
    "answer": "isolé",
    "distractors": [
      "isolée",
      "isolés",
      "isolées"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « village ». La forme qui convient est « isolé »."
  },
  {
    "key": "production-13",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "La lumière des lampions devient ___.",
    "prompt": "Complète la phrase avec l’adjectif « bleu » correctement accordé.\n\nLa lumière des lampions devient ___.",
    "answer": "bleue",
    "distractors": [
      "bleu",
      "bleus",
      "bleues"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « lumière ». La forme qui convient est « bleue »."
  },
  {
    "key": "production-14",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Les fleurs du balcon restent ___.",
    "prompt": "Complète la phrase avec l’adjectif « beau » correctement accordé.\n\nLes fleurs du balcon restent ___.",
    "answer": "belles",
    "distractors": [
      "beau",
      "beaux",
      "belle"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « fleurs ». La forme qui convient est « belles »."
  },
  {
    "key": "production-15",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Le sac des voyageurs paraît ___.",
    "prompt": "Complète la phrase avec l’adjectif « plein » correctement accordé.\n\nLe sac des voyageurs paraît ___.",
    "answer": "plein",
    "distractors": [
      "pleine",
      "pleins",
      "pleines"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « sac ». La forme qui convient est « plein »."
  },
  {
    "key": "production-16",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "source": "Les sentiers de la colline sont ___.",
    "prompt": "Complète la phrase avec l’adjectif « glissant » correctement accordé.\n\nLes sentiers de la colline sont ___.",
    "answer": "glissants",
    "distractors": [
      "glissant",
      "glissante",
      "glissantes"
    ],
    "negative": false,
    "reason": "L’adjectif décrit « sentiers ». La forme qui convient est « glissants »."
  }
] as const;

export const ADJECTIVE_LINK_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:adjective-link:recognition",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Trouver le nom qui commande l’accord",
    "learnerQuestionFr": "Quel nom l’adjectif décrit-il réellement ?",
    "steps": [
      {
        "exampleFr": "La veste de mon frère est grise.",
        "explanationFr": "Grise décrit la veste, pas le frère. Le nom veste impose ici le féminin singulier, même si frère est plus proche de l’adjectif."
      },
      {
        "exampleFr": "Les feuilles de cet arbre sont jaunes.",
        "explanationFr": "Jaunes décrit plusieurs feuilles. L’adjectif prend les marques demandées par feuilles, pas par arbre."
      },
      {
        "exampleFr": "Une grande tour. La tour est grande.",
        "explanationFr": "L’adjectif peut accompagner directement le nom ou lui être relié par un verbe comme être. Dans les deux cas, grande décrit tour."
      },
      {
        "exampleFr": "Les coureurs avancent rapidement.",
        "explanationFr": "Rapidement précise comment ils avancent : c’est un adverbe. La phrase ne contient pas d’adjectif à accorder avec coureurs."
      }
    ],
    "takeawayFr": "Relie l’adjectif au nom qu’il décrit, puis vérifie le genre et le nombre de ce nom.",
    "boundaryFr": "Le mot le plus proche n’est pas toujours celui qui commande l’accord. Certaines formes se ressemblent au masculin et au féminin ou au singulier et au pluriel : il faut analyser la relation, pas seulement la terminaison.",
    "practice": [
      {
        "id": "adjective-link-guided:recognition:0",
        "promptFr": "La façade des immeubles paraît abîmée.\n\nQuel nom commande l’accord de « abîmée » ?",
        "answerFr": "Le nom « façade ».",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "L’adjectif décrit « façade ». La forme adaptée est « abîmée ».",
        "choices": [
          "Le nom « façade ».",
          "Le verbe, sans tenir compte du nom.",
          "Le mot le plus proche, quel que soit son rôle."
        ]
      },
      {
        "id": "adjective-link-guided:recognition:1",
        "promptFr": "Les sacs de la cliente sont pesants.\n\nQuel nom commande l’accord de « pesants » ?",
        "answerFr": "Le nom « sacs ».",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "L’adjectif décrit « sacs ». La forme adaptée est « pesants ».",
        "choices": [
          "Le nom « sacs ».",
          "Le verbe, sans tenir compte du nom.",
          "Le mot le plus proche, quel que soit son rôle."
        ]
      },
      {
        "id": "adjective-link-guided:recognition:2",
        "promptFr": "Les branches de cet arbuste sont fines.\n\nQuel nom commande l’accord de « fines » ?",
        "answerFr": "Le nom « branches ».",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "L’adjectif décrit « branches ». La forme adaptée est « fines ».",
        "choices": [
          "Le nom « branches ».",
          "Le verbe, sans tenir compte du nom.",
          "Le mot le plus proche, quel que soit son rôle."
        ]
      },
      {
        "id": "adjective-link-guided:recognition:3",
        "promptFr": "Le manteau des touristes reste sec.\n\nQuel nom commande l’accord de « sec » ?",
        "answerFr": "Le nom « manteau ».",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "L’adjectif décrit « manteau ». La forme adaptée est « sec ».",
        "choices": [
          "Le nom « manteau ».",
          "Le verbe, sans tenir compte du nom.",
          "Le mot le plus proche, quel que soit son rôle."
        ]
      },
      {
        "id": "adjective-link-guided:recognition:4",
        "promptFr": "Une grande ombre couvre le toit.\n\nQuel nom commande l’accord de « grande » ?",
        "answerFr": "Le nom « ombre ».",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "L’adjectif décrit « ombre ». La forme adaptée est « grande ».",
        "choices": [
          "Le nom « ombre ».",
          "Le verbe, sans tenir compte du nom.",
          "Le mot le plus proche, quel que soit son rôle."
        ]
      },
      {
        "id": "adjective-link-guided:recognition:5",
        "promptFr": "De noirs nuages couvrent les sommets.\n\nQuel nom commande l’accord de « noirs » ?",
        "answerFr": "Le nom « nuages ».",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "L’adjectif décrit « nuages ». La forme adaptée est « noirs ».",
        "choices": [
          "Le nom « nuages ».",
          "Le verbe, sans tenir compte du nom.",
          "Le mot le plus proche, quel que soit son rôle."
        ]
      }
    ],
    "materialExposure": {
      "sentences": [
        "La veste de mon frère est grise.",
        "Les feuilles de cet arbre sont jaunes.",
        "Une grande tour. La tour est grande.",
        "Les coureurs avancent rapidement.",
        "La façade des immeubles paraît abîmée.",
        "Les sacs de la cliente sont pesants.",
        "Les branches de cet arbuste sont fines.",
        "Le manteau des touristes reste sec.",
        "Une grande ombre couvre le toit.",
        "De noirs nuages couvrent les sommets."
      ]
    }
  },
  {
    "id": "french-v3-teaching:adjective-link:production",
    "nodeKey": "construction_accord_nom_adjectif",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Accorder avec le bon nom malgré les mots intercalés",
    "learnerQuestionFr": "Quel nom l’adjectif décrit-il réellement ?",
    "steps": [
      {
        "exampleFr": "La veste de mon frère est grise.",
        "explanationFr": "Grise décrit la veste, pas le frère. Le nom veste impose ici le féminin singulier, même si frère est plus proche de l’adjectif."
      },
      {
        "exampleFr": "Les feuilles de cet arbre sont jaunes.",
        "explanationFr": "Jaunes décrit plusieurs feuilles. L’adjectif prend les marques demandées par feuilles, pas par arbre."
      },
      {
        "exampleFr": "Une grande tour. La tour est grande.",
        "explanationFr": "L’adjectif peut accompagner directement le nom ou lui être relié par un verbe comme être. Dans les deux cas, grande décrit tour."
      },
      {
        "exampleFr": "Les coureurs avancent rapidement.",
        "explanationFr": "Rapidement précise comment ils avancent : c’est un adverbe. La phrase ne contient pas d’adjectif à accorder avec coureurs."
      }
    ],
    "takeawayFr": "Relie l’adjectif au nom qu’il décrit, puis vérifie le genre et le nombre de ce nom.",
    "boundaryFr": "Le mot le plus proche n’est pas toujours celui qui commande l’accord. Certaines formes se ressemblent au masculin et au féminin ou au singulier et au pluriel : il faut analyser la relation, pas seulement la terminaison.",
    "practice": [
      {
        "id": "adjective-link-guided:production:0",
        "promptFr": "Complète avec « abîmé » correctement accordé.\n\nLa façade des immeubles paraît ___.",
        "answerFr": "abîmée",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "La façade des immeubles paraît abîmée. L’adjectif décrit « façade ». La forme adaptée est « abîmée »."
      },
      {
        "id": "adjective-link-guided:production:1",
        "promptFr": "Complète avec « pesant » correctement accordé.\n\nLes sacs de la cliente sont ___.",
        "answerFr": "pesants",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "Les sacs de la cliente sont pesants. L’adjectif décrit « sacs ». La forme adaptée est « pesants »."
      },
      {
        "id": "adjective-link-guided:production:2",
        "promptFr": "Complète avec « fin » correctement accordé.\n\nLes branches de cet arbuste sont ___.",
        "answerFr": "fines",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "Les branches de cet arbuste sont fines. L’adjectif décrit « branches ». La forme adaptée est « fines »."
      },
      {
        "id": "adjective-link-guided:production:3",
        "promptFr": "Complète avec « sec » correctement accordé.\n\nLe manteau des touristes reste ___.",
        "answerFr": "sec",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "Le manteau des touristes reste sec. L’adjectif décrit « manteau ». La forme adaptée est « sec »."
      },
      {
        "id": "adjective-link-guided:production:4",
        "promptFr": "Complète avec « grand » correctement accordé.\n\nUne ___ ombre couvre le toit.",
        "answerFr": "grande",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "Une grande ombre couvre le toit. L’adjectif décrit « ombre ». La forme adaptée est « grande »."
      },
      {
        "id": "adjective-link-guided:production:5",
        "promptFr": "Complète avec « noir » correctement accordé.\n\nDe ___ nuages couvrent les sommets.",
        "answerFr": "noirs",
        "hintFr": "Demande-toi quel être ou quelle chose l’adjectif décrit.",
        "explanationFr": "De noirs nuages couvrent les sommets. L’adjectif décrit « nuages ». La forme adaptée est « noirs »."
      }
    ],
    "materialExposure": {
      "sentences": [
        "La veste de mon frère est grise.",
        "Les feuilles de cet arbre sont jaunes.",
        "Une grande tour. La tour est grande.",
        "Les coureurs avancent rapidement.",
        "La façade des immeubles paraît abîmée.",
        "Les sacs de la cliente sont pesants.",
        "Les branches de cet arbuste sont fines.",
        "Le manteau des touristes reste sec.",
        "Une grande ombre couvre le toit.",
        "De noirs nuages couvrent les sommets.",
        "La façade des immeubles paraît ___.",
        "Les sacs de la cliente sont ___.",
        "Les branches de cet arbuste sont ___.",
        "Le manteau des touristes reste ___.",
        "Une ___ ombre couvre le toit.",
        "De ___ nuages couvrent les sommets."
      ]
    }
  }
];
