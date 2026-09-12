import type {TargetTeachingContent} from "./teaching-content";

export const INFINITIVE_PARTICIPLE_DRAFTS = [
  {
    "key": "concept-1",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Nous voulons comprendre la consigne.",
    "form": "comprendre",
    "lemma": null,
    "prompt": "Nous voulons comprendre la consigne.\n\nDans cette phrase, « comprendre » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Après voulons, comprendre reste à l’infinitif.",
    "errorKey": null
  },
  {
    "key": "concept-2",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Elle a compris la consigne.",
    "form": "compris",
    "lemma": null,
    "prompt": "Elle a compris la consigne.\n\nDans cette phrase, « compris » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Compris est le participe passé employé avec l’auxiliaire a.",
    "errorKey": null
  },
  {
    "key": "concept-3",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Il apprend à nager.",
    "form": "nager",
    "lemma": null,
    "prompt": "Il apprend à nager.\n\nDans cette phrase, « nager » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Après à, nager exprime l’activité qu’il apprend.",
    "errorKey": null
  },
  {
    "key": "concept-4",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Le nageur a nagé longtemps.",
    "form": "nagé",
    "lemma": null,
    "prompt": "Le nageur a nagé longtemps.\n\nDans cette phrase, « nagé » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Nagé fait partie du passé composé avec a.",
    "errorKey": null
  },
  {
    "key": "concept-5",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Lire demande de l’attention.",
    "form": "Lire",
    "lemma": null,
    "prompt": "Lire demande de l’attention.\n\nDans cette phrase, « Lire » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Lire nomme l’activité qui est le sujet de demande.",
    "errorKey": null
  },
  {
    "key": "concept-6",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "La journaliste avait lu le dossier.",
    "form": "lu",
    "lemma": null,
    "prompt": "La journaliste avait lu le dossier.\n\nDans cette phrase, « lu » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Lu est employé avec avait pour former le plus-que-parfait.",
    "errorKey": null
  },
  {
    "key": "concept-7",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Ils partent sans déjeuner.",
    "form": "déjeuner",
    "lemma": null,
    "prompt": "Ils partent sans déjeuner.\n\nDans cette phrase, « déjeuner » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Sans est suivi ici de l’infinitif déjeuner.",
    "errorKey": null
  },
  {
    "key": "concept-8",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Il avait déjeuné avant le départ.",
    "form": "déjeuné",
    "lemma": null,
    "prompt": "Il avait déjeuné avant le départ.\n\nDans cette phrase, « déjeuné » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Déjeuné est employé avec l’auxiliaire avait.",
    "errorKey": null
  },
  {
    "key": "concept-9",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Elle préfère écrire au crayon.",
    "form": "écrire",
    "lemma": null,
    "prompt": "Elle préfère écrire au crayon.\n\nDans cette phrase, « écrire » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Écrire dépend ici de préfère et reste à l’infinitif.",
    "errorKey": null
  },
  {
    "key": "concept-10",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Tu as écrit ton adresse.",
    "form": "écrit",
    "lemma": null,
    "prompt": "Tu as écrit ton adresse.\n\nDans cette phrase, « écrit » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Écrit est employé avec as pour former le passé composé.",
    "errorKey": null
  },
  {
    "key": "concept-11",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Il faut attendre le signal.",
    "form": "attendre",
    "lemma": null,
    "prompt": "Il faut attendre le signal.\n\nDans cette phrase, « attendre » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Attendre indique ce qu’il faut faire.",
    "errorKey": null
  },
  {
    "key": "concept-12",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Le public a attendu une heure.",
    "form": "attendu",
    "lemma": null,
    "prompt": "Le public a attendu une heure.\n\nDans cette phrase, « attendu » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Attendu est employé avec l’auxiliaire a.",
    "errorKey": null
  },
  {
    "key": "concept-13",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Elle va préparer le repas.",
    "form": "préparer",
    "lemma": null,
    "prompt": "Elle va préparer le repas.\n\nDans cette phrase, « préparer » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Préparer est l’infinitif employé après va dans le futur proche.",
    "errorKey": null
  },
  {
    "key": "concept-14",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Il aura préparé le repas avant midi.",
    "form": "préparé",
    "lemma": null,
    "prompt": "Il aura préparé le repas avant midi.\n\nDans cette phrase, « préparé » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Préparé est employé avec aura au futur antérieur.",
    "errorKey": null
  },
  {
    "key": "concept-15",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Le joueur essaie de courir plus vite.",
    "form": "courir",
    "lemma": null,
    "prompt": "Le joueur essaie de courir plus vite.\n\nDans cette phrase, « courir » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Courir est l’infinitif après essaie de.",
    "errorKey": null
  },
  {
    "key": "concept-16",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Il a couru jusqu’au stade.",
    "form": "couru",
    "lemma": null,
    "prompt": "Il a couru jusqu’au stade.\n\nDans cette phrase, « couru » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Couru est le participe passé employé avec a.",
    "errorKey": null
  },
  {
    "key": "concept-17",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Ouvrir cette boîte est difficile.",
    "form": "Ouvrir",
    "lemma": null,
    "prompt": "Ouvrir cette boîte est difficile.\n\nDans cette phrase, « Ouvrir » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Ouvrir nomme l’action qui est le sujet de est.",
    "errorKey": null
  },
  {
    "key": "concept-18",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Elle avait ouvert la boîte.",
    "form": "ouvert",
    "lemma": null,
    "prompt": "Elle avait ouvert la boîte.\n\nDans cette phrase, « ouvert » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Ouvert est employé avec avait au plus-que-parfait.",
    "errorKey": null
  },
  {
    "key": "concept-19",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Il continue à chercher ses clés.",
    "form": "chercher",
    "lemma": null,
    "prompt": "Il continue à chercher ses clés.\n\nDans cette phrase, « chercher » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Chercher reste à l’infinitif après continue à.",
    "errorKey": null
  },
  {
    "key": "concept-20",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Il aurait cherché plus longtemps.",
    "form": "cherché",
    "lemma": null,
    "prompt": "Il aurait cherché plus longtemps.\n\nDans cette phrase, « cherché » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Cherché est employé avec aurait au conditionnel passé.",
    "errorKey": null
  },
  {
    "key": "concept-21",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Nous devons prendre le train.",
    "form": "prendre",
    "lemma": null,
    "prompt": "Nous devons prendre le train.\n\nDans cette phrase, « prendre » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Prendre est l’infinitif qui suit devons.",
    "errorKey": null
  },
  {
    "key": "concept-22",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Elle a pris le train.",
    "form": "pris",
    "lemma": null,
    "prompt": "Elle a pris le train.\n\nDans cette phrase, « pris » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Pris est le participe passé employé avec a.",
    "errorKey": null
  },
  {
    "key": "concept-23",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Il travaille pour réussir.",
    "form": "réussir",
    "lemma": null,
    "prompt": "Il travaille pour réussir.\n\nDans cette phrase, « réussir » est-il un infinitif ou un participe passé ?",
    "answer": "infinitif",
    "distractors": [
      "participe passé"
    ],
    "reason": "Réussir reste à l’infinitif après pour.",
    "errorKey": null
  },
  {
    "key": "concept-24",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "source": "Elle a réussi son examen.",
    "form": "réussi",
    "lemma": null,
    "prompt": "Elle a réussi son examen.\n\nDans cette phrase, « réussi » est-il un infinitif ou un participe passé ?",
    "answer": "participe passé",
    "distractors": [
      "infinitif"
    ],
    "reason": "Réussi est employé avec l’auxiliaire a.",
    "errorKey": null
  },
  {
    "key": "recognition-1",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Le musicien veut ___ son instrument.",
    "form": "accorder",
    "lemma": "accorder",
    "prompt": "Choisis la forme qui convient.\n\nLe musicien veut ___ son instrument.",
    "answer": "accorder",
    "distractors": [
      "accordé"
    ],
    "reason": "On écrit « accorder » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-2",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "La cuisinière a ___ les légumes.",
    "form": "découpé",
    "lemma": "découper",
    "prompt": "Choisis la forme qui convient.\n\nLa cuisinière a ___ les légumes.",
    "answer": "découpé",
    "distractors": [
      "découper"
    ],
    "reason": "On écrit « découpé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-3",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Il cherche un endroit pour ___.",
    "form": "camper",
    "lemma": "camper",
    "prompt": "Choisis la forme qui convient.\n\nIl cherche un endroit pour ___.",
    "answer": "camper",
    "distractors": [
      "campé"
    ],
    "reason": "On écrit « camper » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-4",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Le gardien avait ___ le portail.",
    "form": "verrouillé",
    "lemma": "verrouiller",
    "prompt": "Choisis la forme qui convient.\n\nLe gardien avait ___ le portail.",
    "answer": "verrouillé",
    "distractors": [
      "verrouiller"
    ],
    "reason": "On écrit « verrouillé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-5",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Elle apprend à ___ une carte.",
    "form": "dessiner",
    "lemma": "dessiner",
    "prompt": "Choisis la forme qui convient.\n\nElle apprend à ___ une carte.",
    "answer": "dessiner",
    "distractors": [
      "dessiné"
    ],
    "reason": "On écrit « dessiner » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-6",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Le campeur a ___ son sac.",
    "form": "vidé",
    "lemma": "vider",
    "prompt": "Choisis la forme qui convient.\n\nLe campeur a ___ son sac.",
    "answer": "vidé",
    "distractors": [
      "vider"
    ],
    "reason": "On écrit « vidé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-7",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Le nageur part sans ___ la plage.",
    "form": "nettoyer",
    "lemma": "nettoyer",
    "prompt": "Choisis la forme qui convient.\n\nLe nageur part sans ___ la plage.",
    "answer": "nettoyer",
    "distractors": [
      "nettoyé"
    ],
    "reason": "On écrit « nettoyer » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-8",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "La classe a ___ une lettre.",
    "form": "rédigé",
    "lemma": "rédiger",
    "prompt": "Choisis la forme qui convient.\n\nLa classe a ___ une lettre.",
    "answer": "rédigé",
    "distractors": [
      "rédiger"
    ],
    "reason": "On écrit « rédigé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-9",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Il faut ___ le linge.",
    "form": "plier",
    "lemma": "plier",
    "prompt": "Choisis la forme qui convient.\n\nIl faut ___ le linge.",
    "answer": "plier",
    "distractors": [
      "plié"
    ],
    "reason": "On écrit « plier » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-10",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "L’ouvrier avait ___ le trou.",
    "form": "bouché",
    "lemma": "boucher",
    "prompt": "Choisis la forme qui convient.\n\nL’ouvrier avait ___ le trou.",
    "answer": "bouché",
    "distractors": [
      "boucher"
    ],
    "reason": "On écrit « bouché » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-11",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Les bénévoles viennent pour ___ les affiches.",
    "form": "coller",
    "lemma": "coller",
    "prompt": "Choisis la forme qui convient.\n\nLes bénévoles viennent pour ___ les affiches.",
    "answer": "coller",
    "distractors": [
      "collé"
    ],
    "reason": "On écrit « coller » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-12",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "La joueuse a ___ le ballon.",
    "form": "lancé",
    "lemma": "lancer",
    "prompt": "Choisis la forme qui convient.\n\nLa joueuse a ___ le ballon.",
    "answer": "lancé",
    "distractors": [
      "lancer"
    ],
    "reason": "On écrit « lancé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-13",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Elle souhaite ___ le village.",
    "form": "visiter",
    "lemma": "visiter",
    "prompt": "Choisis la forme qui convient.\n\nElle souhaite ___ le village.",
    "answer": "visiter",
    "distractors": [
      "visité"
    ],
    "reason": "On écrit « visiter » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-14",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Le libraire a ___ les livres.",
    "form": "emballé",
    "lemma": "emballer",
    "prompt": "Choisis la forme qui convient.\n\nLe libraire a ___ les livres.",
    "answer": "emballé",
    "distractors": [
      "emballer"
    ],
    "reason": "On écrit « emballé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-15",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Il commence à ___ la montagne.",
    "form": "escalader",
    "lemma": "escalader",
    "prompt": "Choisis la forme qui convient.\n\nIl commence à ___ la montagne.",
    "answer": "escalader",
    "distractors": [
      "escaladé"
    ],
    "reason": "On écrit « escalader » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-16",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Le jardinier avait ___ les branches.",
    "form": "coupé",
    "lemma": "couper",
    "prompt": "Choisis la forme qui convient.\n\nLe jardinier avait ___ les branches.",
    "answer": "coupé",
    "distractors": [
      "couper"
    ],
    "reason": "On écrit « coupé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-17",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Le photographe doit ___ son appareil.",
    "form": "régler",
    "lemma": "régler",
    "prompt": "Choisis la forme qui convient.\n\nLe photographe doit ___ son appareil.",
    "answer": "régler",
    "distractors": [
      "réglé"
    ],
    "reason": "On écrit « régler » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-18",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Le soleil a ___ la neige.",
    "form": "réchauffé",
    "lemma": "réchauffer",
    "prompt": "Choisis la forme qui convient.\n\nLe soleil a ___ la neige.",
    "answer": "réchauffé",
    "distractors": [
      "réchauffer"
    ],
    "reason": "On écrit « réchauffé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-19",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Les enfants vont ___ le goûter.",
    "form": "partager",
    "lemma": "partager",
    "prompt": "Choisis la forme qui convient.\n\nLes enfants vont ___ le goûter.",
    "answer": "partager",
    "distractors": [
      "partagé"
    ],
    "reason": "On écrit « partager » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-20",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "La famille a ___ le voyage.",
    "form": "annulé",
    "lemma": "annuler",
    "prompt": "Choisis la forme qui convient.\n\nLa famille a ___ le voyage.",
    "answer": "annulé",
    "distractors": [
      "annuler"
    ],
    "reason": "On écrit « annulé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-21",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Il hésite à ___ son avis.",
    "form": "donner",
    "lemma": "donner",
    "prompt": "Choisis la forme qui convient.\n\nIl hésite à ___ son avis.",
    "answer": "donner",
    "distractors": [
      "donné"
    ],
    "reason": "On écrit « donner » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-22",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "L’artiste avait ___ le tableau.",
    "form": "signé",
    "lemma": "signer",
    "prompt": "Choisis la forme qui convient.\n\nL’artiste avait ___ le tableau.",
    "answer": "signé",
    "distractors": [
      "signer"
    ],
    "reason": "On écrit « signé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "recognition-23",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Elle sort pour ___ le courrier.",
    "form": "poster",
    "lemma": "poster",
    "prompt": "Choisis la forme qui convient.\n\nElle sort pour ___ le courrier.",
    "answer": "poster",
    "distractors": [
      "posté"
    ],
    "reason": "On écrit « poster » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "recognition-24",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "source": "Le menuisier a ___ la planche.",
    "form": "mesuré",
    "lemma": "mesurer",
    "prompt": "Choisis la forme qui convient.\n\nLe menuisier a ___ la planche.",
    "answer": "mesuré",
    "distractors": [
      "mesurer"
    ],
    "reason": "On écrit « mesuré » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-1",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Elle veut ___ cette date.",
    "form": "mémoriser",
    "lemma": "mémoriser",
    "prompt": "Complète avec le verbe « mémoriser ». Écris seulement le mot manquant.\n\nElle veut ___ cette date.",
    "answer": "mémoriser",
    "distractors": [
      "mémorisé"
    ],
    "reason": "On écrit « mémoriser » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-2",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Le guide a ___ les visiteurs.",
    "form": "rassemblé",
    "lemma": "rassembler",
    "prompt": "Complète avec le verbe « rassembler ». Écris seulement le mot manquant.\n\nLe guide a ___ les visiteurs.",
    "answer": "rassemblé",
    "distractors": [
      "rassembler"
    ],
    "reason": "On écrit « rassemblé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-3",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Il s’arrête pour ___ la fontaine.",
    "form": "admirer",
    "lemma": "admirer",
    "prompt": "Complète avec le verbe « admirer ». Écris seulement le mot manquant.\n\nIl s’arrête pour ___ la fontaine.",
    "answer": "admirer",
    "distractors": [
      "admiré"
    ],
    "reason": "On écrit « admirer » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-4",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "La passante avait ___ ses clés.",
    "form": "retrouvé",
    "lemma": "retrouver",
    "prompt": "Complète avec le verbe « retrouver ». Écris seulement le mot manquant.\n\nLa passante avait ___ ses clés.",
    "answer": "retrouvé",
    "distractors": [
      "retrouver"
    ],
    "reason": "On écrit « retrouvé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-5",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Nous devons ___ les billets.",
    "form": "réserver",
    "lemma": "réserver",
    "prompt": "Complète avec le verbe « réserver ». Écris seulement le mot manquant.\n\nNous devons ___ les billets.",
    "answer": "réserver",
    "distractors": [
      "réservé"
    ],
    "reason": "On écrit « réserver » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-6",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "La joueuse a ___ la règle.",
    "form": "respecté",
    "lemma": "respecter",
    "prompt": "Complète avec le verbe « respecter ». Écris seulement le mot manquant.\n\nLa joueuse a ___ la règle.",
    "answer": "respecté",
    "distractors": [
      "respecter"
    ],
    "reason": "On écrit « respecté » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-7",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Les ouvriers vont ___ la façade.",
    "form": "restaurer",
    "lemma": "restaurer",
    "prompt": "Complète avec le verbe « restaurer ». Écris seulement le mot manquant.\n\nLes ouvriers vont ___ la façade.",
    "answer": "restaurer",
    "distractors": [
      "restauré"
    ],
    "reason": "On écrit « restaurer » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-8",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Il avait ___ les verres.",
    "form": "essuyé",
    "lemma": "essuyer",
    "prompt": "Complète avec le verbe « essuyer ». Écris seulement le mot manquant.\n\nIl avait ___ les verres.",
    "answer": "essuyé",
    "distractors": [
      "essuyer"
    ],
    "reason": "On écrit « essuyé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-9",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Elle apprend à ___ un cerf-volant.",
    "form": "piloter",
    "lemma": "piloter",
    "prompt": "Complète avec le verbe « piloter ». Écris seulement le mot manquant.\n\nElle apprend à ___ un cerf-volant.",
    "answer": "piloter",
    "distractors": [
      "piloté"
    ],
    "reason": "On écrit « piloter » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-10",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "La voisine a ___ les rideaux.",
    "form": "installé",
    "lemma": "installer",
    "prompt": "Complète avec le verbe « installer ». Écris seulement le mot manquant.\n\nLa voisine a ___ les rideaux.",
    "answer": "installé",
    "distractors": [
      "installer"
    ],
    "reason": "On écrit « installé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-11",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Le fermier sort pour ___ les animaux.",
    "form": "observer",
    "lemma": "observer",
    "prompt": "Complète avec le verbe « observer ». Écris seulement le mot manquant.\n\nLe fermier sort pour ___ les animaux.",
    "answer": "observer",
    "distractors": [
      "observé"
    ],
    "reason": "On écrit « observer » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-12",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Le public a ___ la vedette.",
    "form": "acclamé",
    "lemma": "acclamer",
    "prompt": "Complète avec le verbe « acclamer ». Écris seulement le mot manquant.\n\nLe public a ___ la vedette.",
    "answer": "acclamé",
    "distractors": [
      "acclamer"
    ],
    "reason": "On écrit « acclamé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-13",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Il préfère ___ le problème calmement.",
    "form": "examiner",
    "lemma": "examiner",
    "prompt": "Complète avec le verbe « examiner ». Écris seulement le mot manquant.\n\nIl préfère ___ le problème calmement.",
    "answer": "examiner",
    "distractors": [
      "examiné"
    ],
    "reason": "On écrit « examiner » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-14",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Le campeur avait ___ la tente.",
    "form": "replié",
    "lemma": "replier",
    "prompt": "Complète avec le verbe « replier ». Écris seulement le mot manquant.\n\nLe campeur avait ___ la tente.",
    "answer": "replié",
    "distractors": [
      "replier"
    ],
    "reason": "On écrit « replié » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-15",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "La conductrice doit ___ le carrefour.",
    "form": "traverser",
    "lemma": "traverser",
    "prompt": "Complète avec le verbe « traverser ». Écris seulement le mot manquant.\n\nLa conductrice doit ___ le carrefour.",
    "answer": "traverser",
    "distractors": [
      "traversé"
    ],
    "reason": "On écrit « traverser » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-16",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Le jardinier a ___ les rosiers.",
    "form": "arrosé",
    "lemma": "arroser",
    "prompt": "Complète avec le verbe « arroser ». Écris seulement le mot manquant.\n\nLe jardinier a ___ les rosiers.",
    "answer": "arrosé",
    "distractors": [
      "arroser"
    ],
    "reason": "On écrit « arrosé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-17",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Elle essaie de ___ le mécanisme.",
    "form": "démonter",
    "lemma": "démonter",
    "prompt": "Complète avec le verbe « démonter ». Écris seulement le mot manquant.\n\nElle essaie de ___ le mécanisme.",
    "answer": "démonter",
    "distractors": [
      "démonté"
    ],
    "reason": "On écrit « démonter » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-18",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "La mairie a ___ le budget.",
    "form": "validé",
    "lemma": "valider",
    "prompt": "Complète avec le verbe « valider ». Écris seulement le mot manquant.\n\nLa mairie a ___ le budget.",
    "answer": "validé",
    "distractors": [
      "valider"
    ],
    "reason": "On écrit « validé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-19",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Il promet de ___ son voisin.",
    "form": "remercier",
    "lemma": "remercier",
    "prompt": "Complète avec le verbe « remercier ». Écris seulement le mot manquant.\n\nIl promet de ___ son voisin.",
    "answer": "remercier",
    "distractors": [
      "remercié"
    ],
    "reason": "On écrit « remercier » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-20",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Le professeur avait ___ les copies.",
    "form": "distribué",
    "lemma": "distribuer",
    "prompt": "Complète avec le verbe « distribuer ». Écris seulement le mot manquant.\n\nLe professeur avait ___ les copies.",
    "answer": "distribué",
    "distractors": [
      "distribuer"
    ],
    "reason": "On écrit « distribué » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-21",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Le joueur revient pour ___ le défi.",
    "form": "relever",
    "lemma": "relever",
    "prompt": "Complète avec le verbe « relever ». Écris seulement le mot manquant.\n\nLe joueur revient pour ___ le défi.",
    "answer": "relever",
    "distractors": [
      "relevé"
    ],
    "reason": "On écrit « relever » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-22",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "La tante a ___ son arrivée.",
    "form": "confirmé",
    "lemma": "confirmer",
    "prompt": "Complète avec le verbe « confirmer ». Écris seulement le mot manquant.\n\nLa tante a ___ son arrivée.",
    "answer": "confirmé",
    "distractors": [
      "confirmer"
    ],
    "reason": "On écrit « confirmé » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  },
  {
    "key": "production-23",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "Il faut ___ la fermeture.",
    "form": "vérifier",
    "lemma": "vérifier",
    "prompt": "Complète avec le verbe « vérifier ». Écris seulement le mot manquant.\n\nIl faut ___ la fermeture.",
    "answer": "vérifier",
    "distractors": [
      "vérifié"
    ],
    "reason": "On écrit « vérifier » : cette construction demande un infinitif.",
    "errorKey": "participle-for-infinitive"
  },
  {
    "key": "production-24",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "source": "La chorale avait ___ ce chant.",
    "form": "répété",
    "lemma": "répéter",
    "prompt": "Complète avec le verbe « répéter ». Écris seulement le mot manquant.\n\nLa chorale avait ___ ce chant.",
    "answer": "répété",
    "distractors": [
      "répéter"
    ],
    "reason": "On écrit « répété » : le participe passé accompagne ici un auxiliaire.",
    "errorKey": "infinitive-for-participle"
  }
] as const;

export const INFINITIVE_PARTICIPLE_TEACHING:readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:distinguer_infinitif_participe:recognition",
    "nodeKey": "distinguer_infinitif_participe",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Reconnaître l’infinitif et le participe passé",
    "learnerQuestionFr": "Comment savoir quelle forme du verbe convient ?",
    "steps": [
      {
        "exampleFr": "Elle veut chanter. Elle a chanté.",
        "explanationFr": "Dans la première phrase, chanter dit ce qu’elle veut faire : c’est un infinitif. Dans la seconde, a chanté forme un passé composé : chanté est le participe passé."
      },
      {
        "exampleFr": "Il vient pour jouer. Il a joué.",
        "explanationFr": "Après pour, on écrit ici un infinitif. Avec l’auxiliaire a, joué est un participe passé. Regarde la construction de la phrase, pas seulement le son final."
      },
      {
        "exampleFr": "Elle veut vendre. Elle a vendu.",
        "explanationFr": "Avec vendre et vendu, la différence s’entend. Ce remplacement peut aider : veut chanter comme veut vendre ; a chanté comme a vendu."
      },
      {
        "exampleFr": "Il avait dansé. Il aura dansé.",
        "explanationFr": "Dansé reste un participe passé avec avait ou aura. Il ne dépend pas seulement du passé composé."
      },
      {
        "exampleFr": "Il est parti. Il veut partir.",
        "explanationFr": "Parti est un participe passé ; partir est un infinitif. Les participes passés ne finissent pas tous par é."
      }
    ],
    "takeawayFr": "Repère la construction : infinitif ou participe passé. Choisis ensuite la forme écrite.",
    "boundaryFr": "Le son ne suffit pas. Tous les infinitifs ne finissent pas par er, et tous les participes passés ne finissent pas par é. L’accord du participe passé en ée, és ou ées est une autre étape.",
    "practice": [
      {
        "id": "infinitive-participle:distinguer_infinitif_participe:recognition:0",
        "promptFr": "Elle veut attraper le ballon.\n\n« attraper » est-il un infinitif ou un participe passé ?",
        "answerFr": "infinitif",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Elle veut attraper le ballon. La construction demande ici un infinitif.",
        "choices": [
          "infinitif",
          "participe passé"
        ]
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe:recognition:1",
        "promptFr": "Il a porté le panier.\n\n« porté » est-il un infinitif ou un participe passé ?",
        "answerFr": "participe passé",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Il a porté le panier. Le participe passé est employé avec un auxiliaire.",
        "choices": [
          "participe passé",
          "infinitif"
        ]
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe:recognition:2",
        "promptFr": "Elle sort pour appeler le chat.\n\n« appeler » est-il un infinitif ou un participe passé ?",
        "answerFr": "infinitif",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Elle sort pour appeler le chat. La construction demande ici un infinitif.",
        "choices": [
          "infinitif",
          "participe passé"
        ]
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe:recognition:3",
        "promptFr": "Il avait aidé son équipe.\n\n« aidé » est-il un infinitif ou un participe passé ?",
        "answerFr": "participe passé",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Il avait aidé son équipe. Le participe passé est employé avec un auxiliaire.",
        "choices": [
          "participe passé",
          "infinitif"
        ]
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe:recognition:4",
        "promptFr": "Il faut fermer la porte.\n\n« fermer » est-il un infinitif ou un participe passé ?",
        "answerFr": "infinitif",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Il faut fermer la porte. La construction demande ici un infinitif.",
        "choices": [
          "infinitif",
          "participe passé"
        ]
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe:recognition:5",
        "promptFr": "Elle a balayé le sol.\n\n« balayé » est-il un infinitif ou un participe passé ?",
        "answerFr": "participe passé",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Elle a balayé le sol. Le participe passé est employé avec un auxiliaire.",
        "choices": [
          "participe passé",
          "infinitif"
        ]
      }
    ],
    "materialExposure": {
      "sentences": [
        "Elle veut chanter. Elle a chanté.",
        "Il vient pour jouer. Il a joué.",
        "Elle veut vendre. Elle a vendu.",
        "Il avait dansé. Il aura dansé.",
        "Il est parti. Il veut partir."
      ],
      "words": [
        {
          "lemma": "attraper",
          "form": "attraper"
        },
        {
          "lemma": "porter",
          "form": "porté"
        },
        {
          "lemma": "appeler",
          "form": "appeler"
        },
        {
          "lemma": "aider",
          "form": "aidé"
        },
        {
          "lemma": "fermer",
          "form": "fermer"
        },
        {
          "lemma": "balayer",
          "form": "balayé"
        }
      ]
    }
  },
  {
    "id": "french-v3-teaching:distinguer_infinitif_participe_ecrit:recognition",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Choisir entre -er et -é",
    "learnerQuestionFr": "Comment savoir quelle forme du verbe convient ?",
    "steps": [
      {
        "exampleFr": "Elle veut chanter. Elle a chanté.",
        "explanationFr": "Dans la première phrase, chanter dit ce qu’elle veut faire : c’est un infinitif. Dans la seconde, a chanté forme un passé composé : chanté est le participe passé."
      },
      {
        "exampleFr": "Il vient pour jouer. Il a joué.",
        "explanationFr": "Après pour, on écrit ici un infinitif. Avec l’auxiliaire a, joué est un participe passé. Regarde la construction de la phrase, pas seulement le son final."
      },
      {
        "exampleFr": "Elle veut vendre. Elle a vendu.",
        "explanationFr": "Avec vendre et vendu, la différence s’entend. Ce remplacement peut aider : veut chanter comme veut vendre ; a chanté comme a vendu."
      },
      {
        "exampleFr": "Il avait dansé. Il aura dansé.",
        "explanationFr": "Dansé reste un participe passé avec avait ou aura. Il ne dépend pas seulement du passé composé."
      },
      {
        "exampleFr": "Il est parti. Il veut partir.",
        "explanationFr": "Parti est un participe passé ; partir est un infinitif. Les participes passés ne finissent pas tous par é."
      }
    ],
    "takeawayFr": "Repère la construction : infinitif ou participe passé. Choisis ensuite la forme écrite.",
    "boundaryFr": "Le son ne suffit pas. Tous les infinitifs ne finissent pas par er, et tous les participes passés ne finissent pas par é. L’accord du participe passé en ée, és ou ées est une autre étape.",
    "practice": [
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:recognition:0",
        "promptFr": "Choisis la forme correcte.\n\nElle veut ___ le ballon.",
        "answerFr": "attraper",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Elle veut attraper le ballon. La construction demande ici un infinitif.",
        "choices": [
          "attraper",
          "attrapé"
        ]
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:recognition:1",
        "promptFr": "Choisis la forme correcte.\n\nIl a ___ le panier.",
        "answerFr": "porté",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Il a porté le panier. Le participe passé est employé avec un auxiliaire.",
        "choices": [
          "porté",
          "porter"
        ]
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:recognition:2",
        "promptFr": "Choisis la forme correcte.\n\nElle sort pour ___ le chat.",
        "answerFr": "appeler",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Elle sort pour appeler le chat. La construction demande ici un infinitif.",
        "choices": [
          "appeler",
          "appelé"
        ]
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:recognition:3",
        "promptFr": "Choisis la forme correcte.\n\nIl avait ___ son équipe.",
        "answerFr": "aidé",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Il avait aidé son équipe. Le participe passé est employé avec un auxiliaire.",
        "choices": [
          "aidé",
          "aider"
        ]
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:recognition:4",
        "promptFr": "Choisis la forme correcte.\n\nIl faut ___ la porte.",
        "answerFr": "fermer",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Il faut fermer la porte. La construction demande ici un infinitif.",
        "choices": [
          "fermer",
          "fermé"
        ]
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:recognition:5",
        "promptFr": "Choisis la forme correcte.\n\nElle a ___ le sol.",
        "answerFr": "balayé",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Elle a balayé le sol. Le participe passé est employé avec un auxiliaire.",
        "choices": [
          "balayé",
          "balayer"
        ]
      }
    ],
    "materialExposure": {
      "sentences": [
        "Elle veut chanter. Elle a chanté.",
        "Il vient pour jouer. Il a joué.",
        "Elle veut vendre. Elle a vendu.",
        "Il avait dansé. Il aura dansé.",
        "Il est parti. Il veut partir."
      ],
      "words": [
        {
          "lemma": "attraper",
          "form": "attraper"
        },
        {
          "lemma": "porter",
          "form": "porté"
        },
        {
          "lemma": "appeler",
          "form": "appeler"
        },
        {
          "lemma": "aider",
          "form": "aidé"
        },
        {
          "lemma": "fermer",
          "form": "fermer"
        },
        {
          "lemma": "balayer",
          "form": "balayé"
        }
      ]
    }
  },
  {
    "id": "french-v3-teaching:distinguer_infinitif_participe_ecrit:production",
    "nodeKey": "distinguer_infinitif_participe_ecrit",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Écrire -er ou -é dans une phrase",
    "learnerQuestionFr": "Comment savoir quelle forme du verbe convient ?",
    "steps": [
      {
        "exampleFr": "Elle veut chanter. Elle a chanté.",
        "explanationFr": "Dans la première phrase, chanter dit ce qu’elle veut faire : c’est un infinitif. Dans la seconde, a chanté forme un passé composé : chanté est le participe passé."
      },
      {
        "exampleFr": "Il vient pour jouer. Il a joué.",
        "explanationFr": "Après pour, on écrit ici un infinitif. Avec l’auxiliaire a, joué est un participe passé. Regarde la construction de la phrase, pas seulement le son final."
      },
      {
        "exampleFr": "Elle veut vendre. Elle a vendu.",
        "explanationFr": "Avec vendre et vendu, la différence s’entend. Ce remplacement peut aider : veut chanter comme veut vendre ; a chanté comme a vendu."
      },
      {
        "exampleFr": "Il avait dansé. Il aura dansé.",
        "explanationFr": "Dansé reste un participe passé avec avait ou aura. Il ne dépend pas seulement du passé composé."
      },
      {
        "exampleFr": "Il est parti. Il veut partir.",
        "explanationFr": "Parti est un participe passé ; partir est un infinitif. Les participes passés ne finissent pas tous par é."
      }
    ],
    "takeawayFr": "Repère la construction : infinitif ou participe passé. Choisis ensuite la forme écrite.",
    "boundaryFr": "Le son ne suffit pas. Tous les infinitifs ne finissent pas par er, et tous les participes passés ne finissent pas par é. L’accord du participe passé en ée, és ou ées est une autre étape.",
    "practice": [
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:production:0",
        "promptFr": "Complète avec « attraper ».\n\nElle veut ___ le ballon.",
        "answerFr": "attraper",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Elle veut attraper le ballon. La construction demande ici un infinitif."
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:production:1",
        "promptFr": "Complète avec « porter ».\n\nIl a ___ le panier.",
        "answerFr": "porté",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Il a porté le panier. Le participe passé est employé avec un auxiliaire."
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:production:2",
        "promptFr": "Complète avec « appeler ».\n\nElle sort pour ___ le chat.",
        "answerFr": "appeler",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Elle sort pour appeler le chat. La construction demande ici un infinitif."
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:production:3",
        "promptFr": "Complète avec « aider ».\n\nIl avait ___ son équipe.",
        "answerFr": "aidé",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Il avait aidé son équipe. Le participe passé est employé avec un auxiliaire."
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:production:4",
        "promptFr": "Complète avec « fermer ».\n\nIl faut ___ la porte.",
        "answerFr": "fermer",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Il faut fermer la porte. La construction demande ici un infinitif."
      },
      {
        "id": "infinitive-participle:distinguer_infinitif_participe_ecrit:production:5",
        "promptFr": "Complète avec « balayer ».\n\nElle a ___ le sol.",
        "answerFr": "balayé",
        "hintFr": "Regarde ce qui précède le verbe. Repère notamment les auxiliaires.",
        "explanationFr": "Elle a balayé le sol. Le participe passé est employé avec un auxiliaire."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Elle veut chanter. Elle a chanté.",
        "Il vient pour jouer. Il a joué.",
        "Elle veut vendre. Elle a vendu.",
        "Il avait dansé. Il aura dansé.",
        "Il est parti. Il veut partir."
      ],
      "words": [
        {
          "lemma": "attraper",
          "form": "attraper"
        },
        {
          "lemma": "porter",
          "form": "porté"
        },
        {
          "lemma": "appeler",
          "form": "appeler"
        },
        {
          "lemma": "aider",
          "form": "aidé"
        },
        {
          "lemma": "fermer",
          "form": "fermer"
        },
        {
          "lemma": "balayer",
          "form": "balayé"
        }
      ]
    }
  }
];
