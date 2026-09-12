import {AGREEMENT_TEACHING} from "./agreement-teaching";
import type {TargetTeachingContent} from "./teaching-content";

export const SUBJECT_VERB_RECOGNITION_DRAFTS = [
  {
    "key": "adjacent-1",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La couturière ___ une manche.",
    "lemma": "raccourcir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa couturière ___ une manche.",
    "answer": "raccourcit",
    "distractors": [
      "raccourcissent",
      "raccourcissez"
    ],
    "forms": [
      "raccourcit",
      "raccourcissent",
      "raccourcissez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La couturière ». La forme attendue est « raccourcit »."
  },
  {
    "key": "adjacent-2",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les agriculteurs ___ les tomates.",
    "lemma": "récolter",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes agriculteurs ___ les tomates.",
    "answer": "récoltent",
    "distractors": [
      "récolte",
      "récoltez"
    ],
    "forms": [
      "récoltent",
      "récolte",
      "récoltez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les agriculteurs ». La forme attendue est « récoltent »."
  },
  {
    "key": "adjacent-3",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le libraire ___ les nouveautés.",
    "lemma": "présenter",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe libraire ___ les nouveautés.",
    "answer": "présente",
    "distractors": [
      "présentent",
      "présentez"
    ],
    "forms": [
      "présente",
      "présentent",
      "présentez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le libraire ». La forme attendue est « présente »."
  },
  {
    "key": "adjacent-4",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les hirondelles ___ le toit.",
    "lemma": "frôler",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes hirondelles ___ le toit.",
    "answer": "frôlent",
    "distractors": [
      "frôle",
      "frôlez"
    ],
    "forms": [
      "frôlent",
      "frôle",
      "frôlez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les hirondelles ». La forme attendue est « frôlent »."
  },
  {
    "key": "adjacent-5",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La jardinière ___ les roses.",
    "lemma": "arroser",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa jardinière ___ les roses.",
    "answer": "arrose",
    "distractors": [
      "arrosent",
      "arrosez"
    ],
    "forms": [
      "arrose",
      "arrosent",
      "arrosez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La jardinière ». La forme attendue est « arrose »."
  },
  {
    "key": "adjacent-6",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les élèves ___ le problème.",
    "lemma": "résoudre",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes élèves ___ le problème.",
    "answer": "résolvent",
    "distractors": [
      "résout",
      "résolvez"
    ],
    "forms": [
      "résolvent",
      "résout",
      "résolvez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les élèves ». La forme attendue est « résolvent »."
  },
  {
    "key": "adjacent-7",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le gardien ___ les visiteurs.",
    "lemma": "accueillir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe gardien ___ les visiteurs.",
    "answer": "accueille",
    "distractors": [
      "accueillent",
      "accueillez"
    ],
    "forms": [
      "accueille",
      "accueillent",
      "accueillez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le gardien ». La forme attendue est « accueille »."
  },
  {
    "key": "adjacent-8",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les renards ___ dans leur terrier.",
    "lemma": "rentrer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes renards ___ dans leur terrier.",
    "answer": "rentrent",
    "distractors": [
      "rentre",
      "rentrez"
    ],
    "forms": [
      "rentrent",
      "rentre",
      "rentrez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les renards ». La forme attendue est « rentrent »."
  },
  {
    "key": "adjacent-9",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le vendeur ___ les bocaux.",
    "lemma": "remplir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe vendeur ___ les bocaux.",
    "answer": "remplit",
    "distractors": [
      "remplissent",
      "remplissez"
    ],
    "forms": [
      "remplit",
      "remplissent",
      "remplissez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le vendeur ». La forme attendue est « remplit »."
  },
  {
    "key": "adjacent-10",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les passantes ___ la place.",
    "lemma": "traverser",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes passantes ___ la place.",
    "answer": "traversent",
    "distractors": [
      "traverse",
      "traversez"
    ],
    "forms": [
      "traversent",
      "traverse",
      "traversez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les passantes ». La forme attendue est « traversent »."
  },
  {
    "key": "adjacent-11",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La bénévole ___ un colis.",
    "lemma": "recevoir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa bénévole ___ un colis.",
    "answer": "reçoit",
    "distractors": [
      "reçoivent",
      "recevez"
    ],
    "forms": [
      "reçoit",
      "reçoivent",
      "recevez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La bénévole ». La forme attendue est « reçoit »."
  },
  {
    "key": "adjacent-12",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les ouvrières ___ la charpente.",
    "lemma": "assembler",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes ouvrières ___ la charpente.",
    "answer": "assemblent",
    "distractors": [
      "assemble",
      "assemblez"
    ],
    "forms": [
      "assemblent",
      "assemble",
      "assemblez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les ouvrières ». La forme attendue est « assemblent »."
  },
  {
    "key": "adjacent-13",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le mécanicien ___ la panne.",
    "lemma": "repérer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe mécanicien ___ la panne.",
    "answer": "repère",
    "distractors": [
      "repèrent",
      "repérez"
    ],
    "forms": [
      "repère",
      "repèrent",
      "repérez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le mécanicien ». La forme attendue est « repère »."
  },
  {
    "key": "adjacent-14",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les spectateurs ___ les acrobates.",
    "lemma": "applaudir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes spectateurs ___ les acrobates.",
    "answer": "applaudissent",
    "distractors": [
      "applaudit",
      "applaudissez"
    ],
    "forms": [
      "applaudissent",
      "applaudit",
      "applaudissez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les spectateurs ». La forme attendue est « applaudissent »."
  },
  {
    "key": "adjacent-15",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le cuisinier ___ les ingrédients.",
    "lemma": "peser",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe cuisinier ___ les ingrédients.",
    "answer": "pèse",
    "distractors": [
      "pèsent",
      "pesez"
    ],
    "forms": [
      "pèse",
      "pèsent",
      "pesez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le cuisinier ». La forme attendue est « pèse »."
  },
  {
    "key": "adjacent-16",
    "construction": "adjacent",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les amis ___ leurs nouvelles.",
    "lemma": "échanger",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes amis ___ leurs nouvelles.",
    "answer": "échangent",
    "distractors": [
      "échange",
      "échangez"
    ],
    "forms": [
      "échangent",
      "échange",
      "échangez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les amis ». La forme attendue est « échangent »."
  },
  {
    "key": "separated-1",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le parfum des roses ___ la terrasse.",
    "lemma": "embaumer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe parfum des roses ___ la terrasse.",
    "answer": "embaume",
    "distractors": [
      "embaument",
      "embaumez"
    ],
    "forms": [
      "embaume",
      "embaument",
      "embaumez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le parfum des roses ». La forme attendue est « embaume »."
  },
  {
    "key": "separated-2",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les élèves de cette classe ___ un album.",
    "lemma": "illustrer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes élèves de cette classe ___ un album.",
    "answer": "illustrent",
    "distractors": [
      "illustre",
      "illustrez"
    ],
    "forms": [
      "illustrent",
      "illustre",
      "illustrez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les élèves de cette classe ». La forme attendue est « illustrent »."
  },
  {
    "key": "separated-3",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La tante des jumeaux ___ une histoire.",
    "lemma": "raconter",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa tante des jumeaux ___ une histoire.",
    "answer": "raconte",
    "distractors": [
      "racontent",
      "racontez"
    ],
    "forms": [
      "raconte",
      "racontent",
      "racontez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La tante des jumeaux ». La forme attendue est « raconte »."
  },
  {
    "key": "separated-4",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les tableaux du peintre ___ une foule.",
    "lemma": "attirer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes tableaux du peintre ___ une foule.",
    "answer": "attirent",
    "distractors": [
      "attire",
      "attirez"
    ],
    "forms": [
      "attirent",
      "attire",
      "attirez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les tableaux du peintre ». La forme attendue est « attirent »."
  },
  {
    "key": "separated-5",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le guide, devant les ruines, ___ les fouilles.",
    "lemma": "expliquer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe guide, devant les ruines, ___ les fouilles.",
    "answer": "explique",
    "distractors": [
      "expliquent",
      "expliquez"
    ],
    "forms": [
      "explique",
      "expliquent",
      "expliquez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le guide ». La forme attendue est « explique »."
  },
  {
    "key": "separated-6",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les vagues de la mer ___ les rochers.",
    "lemma": "frapper",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes vagues de la mer ___ les rochers.",
    "answer": "frappent",
    "distractors": [
      "frappe",
      "frappez"
    ],
    "forms": [
      "frappent",
      "frappe",
      "frappez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les vagues de la mer ». La forme attendue est « frappent »."
  },
  {
    "key": "separated-7",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le capitaine des équipes ___ la décision.",
    "lemma": "annoncer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe capitaine des équipes ___ la décision.",
    "answer": "annonce",
    "distractors": [
      "annoncent",
      "annoncez"
    ],
    "forms": [
      "annonce",
      "annoncent",
      "annoncez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le capitaine des équipes ». La forme attendue est « annonce »."
  },
  {
    "key": "separated-8",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les graines de cette plante ___ rapidement.",
    "lemma": "germer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes graines de cette plante ___ rapidement.",
    "answer": "germent",
    "distractors": [
      "germe",
      "germez"
    ],
    "forms": [
      "germent",
      "germe",
      "germez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les graines de cette plante ». La forme attendue est « germent »."
  },
  {
    "key": "separated-9",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La sœur des voisins ___ un vélo.",
    "lemma": "réparer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa sœur des voisins ___ un vélo.",
    "answer": "répare",
    "distractors": [
      "réparent",
      "réparez"
    ],
    "forms": [
      "répare",
      "réparent",
      "réparez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La sœur des voisins ». La forme attendue est « répare »."
  },
  {
    "key": "separated-10",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les ombres de la forêt ___ les enfants.",
    "lemma": "effrayer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes ombres de la forêt ___ les enfants.",
    "answer": "effraient",
    "distractors": [
      "effraie",
      "effrayez"
    ],
    "forms": [
      "effraient",
      "effraie",
      "effrayez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les ombres de la forêt ». La forme attendue est « effraient »."
  },
  {
    "key": "separated-11",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le responsable des visiteurs ___ une chanson.",
    "lemma": "écouter",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe responsable des visiteurs ___ une chanson.",
    "answer": "écoute",
    "distractors": [
      "écoutent",
      "écoutez"
    ],
    "forms": [
      "écoute",
      "écoutent",
      "écoutez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le responsable des visiteurs ». Responsable commande le singulier : écoute."
  },
  {
    "key": "separated-12",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les portes du garage ___ facilement.",
    "lemma": "glisser",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes portes du garage ___ facilement.",
    "answer": "glissent",
    "distractors": [
      "glisse",
      "glissez"
    ],
    "forms": [
      "glissent",
      "glisse",
      "glissez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les portes du garage ». La forme attendue est « glissent »."
  },
  {
    "key": "separated-13",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La reine des abeilles ___ dans la ruche.",
    "lemma": "pondre",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa reine des abeilles ___ dans la ruche.",
    "answer": "pond",
    "distractors": [
      "pondent",
      "pondez"
    ],
    "forms": [
      "pond",
      "pondent",
      "pondez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La reine des abeilles ». La forme attendue est « pond »."
  },
  {
    "key": "separated-14",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les feuilles du cahier ___ sous les doigts.",
    "lemma": "craquer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes feuilles du cahier ___ sous les doigts.",
    "answer": "craquent",
    "distractors": [
      "craque",
      "craquez"
    ],
    "forms": [
      "craquent",
      "craque",
      "craquez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les feuilles du cahier ». La forme attendue est « craquent »."
  },
  {
    "key": "separated-15",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le propriétaire des terres ___ du blé.",
    "lemma": "cultiver",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe propriétaire des terres ___ du blé.",
    "answer": "cultive",
    "distractors": [
      "cultivent",
      "cultivez"
    ],
    "forms": [
      "cultive",
      "cultivent",
      "cultivez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le propriétaire des terres ». La forme attendue est « cultive »."
  },
  {
    "key": "separated-16",
    "construction": "separated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Les joueurs de ce club ___ le trophée.",
    "lemma": "remporter",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLes joueurs de ce club ___ le trophée.",
    "answer": "remportent",
    "distractors": [
      "remporte",
      "remportez"
    ],
    "forms": [
      "remportent",
      "remporte",
      "remportez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Les joueurs de ce club ». La forme attendue est « remportent »."
  },
  {
    "key": "inverted-1",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Au bord des routes ___ une herbe haute.",
    "lemma": "grandir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nAu bord des routes ___ une herbe haute.",
    "answer": "grandit",
    "distractors": [
      "grandissent",
      "grandissez"
    ],
    "forms": [
      "grandit",
      "grandissent",
      "grandissez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « une herbe haute ». La forme attendue est « grandit »."
  },
  {
    "key": "inverted-2",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Dans le bassin ___ deux dauphins.",
    "lemma": "nager",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nDans le bassin ___ deux dauphins.",
    "answer": "nagent",
    "distractors": [
      "nage",
      "nagez"
    ],
    "forms": [
      "nagent",
      "nage",
      "nagez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « deux dauphins ». La forme attendue est « nagent »."
  },
  {
    "key": "inverted-3",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Derrière les maisons ___ un potager.",
    "lemma": "subsister",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nDerrière les maisons ___ un potager.",
    "answer": "subsiste",
    "distractors": [
      "subsistent",
      "subsistez"
    ],
    "forms": [
      "subsiste",
      "subsistent",
      "subsistez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « un potager ». La forme attendue est « subsiste »."
  },
  {
    "key": "inverted-4",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Sur le mur ___ les lézards.",
    "lemma": "grimper",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nSur le mur ___ les lézards.",
    "answer": "grimpent",
    "distractors": [
      "grimpe",
      "grimpez"
    ],
    "forms": [
      "grimpent",
      "grimpe",
      "grimpez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « les lézards ». La forme attendue est « grimpent »."
  },
  {
    "key": "inverted-5",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "De ces haut-parleurs ___ une musique douce.",
    "lemma": "sortir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nDe ces haut-parleurs ___ une musique douce.",
    "answer": "sort",
    "distractors": [
      "sortent",
      "sortez"
    ],
    "forms": [
      "sort",
      "sortent",
      "sortez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « une musique douce ». La forme attendue est « sort »."
  },
  {
    "key": "inverted-6",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Dans le grenier ___ des souris.",
    "lemma": "trotter",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nDans le grenier ___ des souris.",
    "answer": "trottent",
    "distractors": [
      "trotte",
      "trottez"
    ],
    "forms": [
      "trottent",
      "trotte",
      "trottez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « des souris ». La forme attendue est « trottent »."
  },
  {
    "key": "inverted-7",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Sous les pieds ___ le parquet.",
    "lemma": "grincer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nSous les pieds ___ le parquet.",
    "answer": "grince",
    "distractors": [
      "grincent",
      "grincez"
    ],
    "forms": [
      "grince",
      "grincent",
      "grincez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « le parquet ». La forme attendue est « grince »."
  },
  {
    "key": "inverted-8",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Au pied du pommier ___ les paniers.",
    "lemma": "reposer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nAu pied du pommier ___ les paniers.",
    "answer": "reposent",
    "distractors": [
      "repose",
      "reposez"
    ],
    "forms": [
      "reposent",
      "repose",
      "reposez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « les paniers ». La forme attendue est « reposent »."
  },
  {
    "key": "inverted-9",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Au-dessus des vallées ___ un aigle.",
    "lemma": "planer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nAu-dessus des vallées ___ un aigle.",
    "answer": "plane",
    "distractors": [
      "planent",
      "planez"
    ],
    "forms": [
      "plane",
      "planent",
      "planez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « un aigle ». La forme attendue est « plane »."
  },
  {
    "key": "inverted-10",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Dans la cuisine ___ des cris.",
    "lemma": "retentir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nDans la cuisine ___ des cris.",
    "answer": "retentissent",
    "distractors": [
      "retentit",
      "retentissez"
    ],
    "forms": [
      "retentissent",
      "retentit",
      "retentissez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « des cris ». La forme attendue est « retentissent »."
  },
  {
    "key": "inverted-11",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Au bout des couloirs ___ une bougie.",
    "lemma": "vaciller",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nAu bout des couloirs ___ une bougie.",
    "answer": "vacille",
    "distractors": [
      "vacillent",
      "vacillez"
    ],
    "forms": [
      "vacille",
      "vacillent",
      "vacillez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « une bougie ». La forme attendue est « vacille »."
  },
  {
    "key": "inverted-12",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Dans la cour ___ les recrues.",
    "lemma": "défiler",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nDans la cour ___ les recrues.",
    "answer": "défilent",
    "distractors": [
      "défile",
      "défilez"
    ],
    "forms": [
      "défilent",
      "défile",
      "défilez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « les recrues ». La forme attendue est « défilent »."
  },
  {
    "key": "inverted-13",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Sous les arcades ___ un violoniste.",
    "lemma": "jouer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nSous les arcades ___ un violoniste.",
    "answer": "joue",
    "distractors": [
      "jouent",
      "jouez"
    ],
    "forms": [
      "joue",
      "jouent",
      "jouez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « un violoniste ». La forme attendue est « joue »."
  },
  {
    "key": "inverted-14",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Dans le verger ___ les fruits.",
    "lemma": "mûrir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nDans le verger ___ les fruits.",
    "answer": "mûrissent",
    "distractors": [
      "mûrit",
      "mûrissez"
    ],
    "forms": [
      "mûrissent",
      "mûrit",
      "mûrissez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « les fruits ». La forme attendue est « mûrissent »."
  },
  {
    "key": "inverted-15",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Devant les grilles ___ un chien.",
    "lemma": "aboyer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nDevant les grilles ___ un chien.",
    "answer": "aboie",
    "distractors": [
      "aboient",
      "aboyez"
    ],
    "forms": [
      "aboie",
      "aboient",
      "aboyez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « un chien ». La forme attendue est « aboie »."
  },
  {
    "key": "inverted-16",
    "construction": "inverted",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Sur cette île ___ des tortues.",
    "lemma": "vivre",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nSur cette île ___ des tortues.",
    "answer": "vivent",
    "distractors": [
      "vit",
      "vivez"
    ],
    "forms": [
      "vivent",
      "vit",
      "vivez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « des tortues ». La forme attendue est « vivent »."
  },
  {
    "key": "coordinated-1",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La maire et le directeur ___ la salle.",
    "lemma": "inaugurer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa maire et le directeur ___ la salle.",
    "answer": "inaugurent",
    "distractors": [
      "inaugure",
      "inaugurez"
    ],
    "forms": [
      "inaugurent",
      "inaugure",
      "inaugurez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La maire et le directeur ». La forme attendue est « inaugurent »."
  },
  {
    "key": "coordinated-2",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le père et la fille ___ la table.",
    "lemma": "dresser",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe père et la fille ___ la table.",
    "answer": "dressent",
    "distractors": [
      "dresse",
      "dressez"
    ],
    "forms": [
      "dressent",
      "dresse",
      "dressez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le père et la fille ». La forme attendue est « dressent »."
  },
  {
    "key": "coordinated-3",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le boulanger et la boulangère ___ la pâte.",
    "lemma": "pétrir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe boulanger et la boulangère ___ la pâte.",
    "answer": "pétrissent",
    "distractors": [
      "pétrit",
      "pétrissez"
    ],
    "forms": [
      "pétrissent",
      "pétrit",
      "pétrissez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le boulanger et la boulangère ». La forme attendue est « pétrissent »."
  },
  {
    "key": "coordinated-4",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le médecin et l’infirmière ___ le patient.",
    "lemma": "examiner",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe médecin et l’infirmière ___ le patient.",
    "answer": "examinent",
    "distractors": [
      "examine",
      "examinez"
    ],
    "forms": [
      "examinent",
      "examine",
      "examinez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le médecin et l’infirmière ». La forme attendue est « examinent »."
  },
  {
    "key": "coordinated-5",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La pluie et la neige ___ les pistes.",
    "lemma": "recouvrir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa pluie et la neige ___ les pistes.",
    "answer": "recouvrent",
    "distractors": [
      "recouvre",
      "recouvrez"
    ],
    "forms": [
      "recouvrent",
      "recouvre",
      "recouvrez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La pluie et la neige ». La forme attendue est « recouvrent »."
  },
  {
    "key": "coordinated-6",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le rat et la souris ___ le carton.",
    "lemma": "ronger",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe rat et la souris ___ le carton.",
    "answer": "rongent",
    "distractors": [
      "ronge",
      "rongez"
    ],
    "forms": [
      "rongent",
      "ronge",
      "rongez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le rat et la souris ». La forme attendue est « rongent »."
  },
  {
    "key": "coordinated-7",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le frère et la sœur ___ une émission.",
    "lemma": "regarder",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe frère et la sœur ___ une émission.",
    "answer": "regardent",
    "distractors": [
      "regarde",
      "regardez"
    ],
    "forms": [
      "regardent",
      "regarde",
      "regardez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le frère et la sœur ». La forme attendue est « regardent »."
  },
  {
    "key": "coordinated-8",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le jardinier et son aide ___ les haies.",
    "lemma": "tailler",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe jardinier et son aide ___ les haies.",
    "answer": "taillent",
    "distractors": [
      "taille",
      "taillez"
    ],
    "forms": [
      "taillent",
      "taille",
      "taillez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le jardinier et son aide ». La forme attendue est « taillent »."
  },
  {
    "key": "coordinated-9",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le tissu et le papier ___ facilement.",
    "lemma": "brûler",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe tissu et le papier ___ facilement.",
    "answer": "brûlent",
    "distractors": [
      "brûle",
      "brûlez"
    ],
    "forms": [
      "brûlent",
      "brûle",
      "brûlez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le tissu et le papier ». La forme attendue est « brûlent »."
  },
  {
    "key": "coordinated-10",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le nageur et la nageuse ___ le bassin.",
    "lemma": "rejoindre",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe nageur et la nageuse ___ le bassin.",
    "answer": "rejoignent",
    "distractors": [
      "rejoint",
      "rejoignez"
    ],
    "forms": [
      "rejoignent",
      "rejoint",
      "rejoignez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le nageur et la nageuse ». La forme attendue est « rejoignent »."
  },
  {
    "key": "coordinated-11",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La trompette et le tambour ___ le silence.",
    "lemma": "rompre",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa trompette et le tambour ___ le silence.",
    "answer": "rompent",
    "distractors": [
      "rompt",
      "rompez"
    ],
    "forms": [
      "rompent",
      "rompt",
      "rompez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La trompette et le tambour ». La forme attendue est « rompent »."
  },
  {
    "key": "coordinated-12",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La voisine et son fils ___ des crêpes.",
    "lemma": "vendre",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa voisine et son fils ___ des crêpes.",
    "answer": "vendent",
    "distractors": [
      "vend",
      "vendez"
    ],
    "forms": [
      "vendent",
      "vend",
      "vendez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La voisine et son fils ». La forme attendue est « vendent »."
  },
  {
    "key": "coordinated-13",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le couteau et les ciseaux ___ le carton.",
    "lemma": "découper",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe couteau et les ciseaux ___ le carton.",
    "answer": "découpent",
    "distractors": [
      "découpe",
      "découpez"
    ],
    "forms": [
      "découpent",
      "découpe",
      "découpez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le couteau et les ciseaux ». La forme attendue est « découpent »."
  },
  {
    "key": "coordinated-14",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La robe et le manteau ___ sur un cintre.",
    "lemma": "pendre",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa robe et le manteau ___ sur un cintre.",
    "answer": "pendent",
    "distractors": [
      "pend",
      "pendez"
    ],
    "forms": [
      "pendent",
      "pend",
      "pendez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La robe et le manteau ». La forme attendue est « pendent »."
  },
  {
    "key": "coordinated-15",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "La championne et son entraîneur ___ leur joie.",
    "lemma": "exprimer",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLa championne et son entraîneur ___ leur joie.",
    "answer": "expriment",
    "distractors": [
      "exprime",
      "exprimez"
    ],
    "forms": [
      "expriment",
      "exprime",
      "exprimez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « La championne et son entraîneur ». La forme attendue est « expriment »."
  },
  {
    "key": "coordinated-16",
    "construction": "coordinated",
    "nodeKey": "accorder_sujet_verbe_ecrit",
    "mode": "recognition",
    "source": "Le chien et le chiot ___ la barrière.",
    "lemma": "franchir",
    "prompt": "Choisis le verbe correctement accordé au présent.\n\nLe chien et le chiot ___ la barrière.",
    "answer": "franchissent",
    "distractors": [
      "franchit",
      "franchissez"
    ],
    "forms": [
      "franchissent",
      "franchit",
      "franchissez"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-person"
    ],
    "reason": "Le sujet est « Le chien et le chiot ». La forme attendue est « franchissent »."
  }
] as const;

const guidedContrasts = [
 ["aspirent","aspirez"],["visite","visitez"],["éclairent","éclairez"],["tremble","tremblez"],
 ["roulent","roulez"],["bouge","bougez"],["accordent","accordez"],["rouille","rouillez"],
 ["patientent","patientez"],["brille","brillez"],["débutent","débutez"],["scintille","scintillez"],
 ["fabrique","fabriquez"],["éclaire","éclairez"],["reste","restez"],["invente","inventez"],
];
/** Recognition teaching uses the same explicit explanations as production;
 * guided choices are assistance and never independent mastery evidence. */
export const SUBJECT_VERB_RECOGNITION_TEACHING:readonly TargetTeachingContent[]=AGREEMENT_TEACHING.map((lesson,index)=>({
 ...lesson,id:lesson.id+":recognition",mode:"recognition",
 practice:lesson.practice.map((exercise,i)=>({...exercise,id:exercise.id+":recognition",
  promptFr:exercise.promptFr.replace("Complète avec", "Choisis la forme de").replace("Écris seulement le verbe.","Choisis une réponse."),
  choices:[exercise.answerFr,...guidedContrasts[index*4+i]],
 })),
}));
