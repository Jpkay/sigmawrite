import type {TargetTeachingContent} from "./teaching-content";

/** Context interpretation drafts, pending review. */
export const NARRATIVE_TIME_DRAFTS = [
  {
    "key": "anteriority-1",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "Nora a retrouvé le billet qu’elle avait acheté la veille.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "l’achat du billet, puis la découverte du billet",
    "distractors": [
      "la découverte du billet, puis l’achat du billet",
      "l’achat du billet et la découverte du billet commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "Nora a retrouvé le billet qu’elle avait acheté la veille."
    ],
    "reason": "Le passage situe l’achat du billet avant la découverte du billet. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-2",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "Le gardien avait fermé la grille. Nous sommes arrivés devant le parc.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "la fermeture de la grille, puis notre arrivée au parc",
    "distractors": [
      "notre arrivée au parc, puis la fermeture de la grille",
      "la fermeture de la grille et notre arrivée au parc commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "Le gardien avait fermé la grille. Nous sommes arrivés devant le parc."
    ],
    "reason": "Le passage situe la fermeture de la grille avant notre arrivée au parc. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-3",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "J’ai reconnu la chanson que mon frère m’avait fait écouter.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "l’écoute proposée par mon frère, puis la reconnaissance de la chanson",
    "distractors": [
      "la reconnaissance de la chanson, puis l’écoute proposée par mon frère",
      "l’écoute proposée par mon frère et la reconnaissance de la chanson commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "J’ai reconnu la chanson que mon frère m’avait fait écouter."
    ],
    "reason": "Le passage situe l’écoute proposée par mon frère avant la reconnaissance de la chanson. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-4",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "Quand le soleil s’est levé, les pêcheurs avaient déjà quitté le port.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "le départ des pêcheurs, puis le lever du soleil",
    "distractors": [
      "le lever du soleil, puis le départ des pêcheurs",
      "le départ des pêcheurs et le lever du soleil commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "Quand le soleil s’est levé, les pêcheurs avaient déjà quitté le port."
    ],
    "reason": "Le passage situe le départ des pêcheurs avant le lever du soleil. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-5",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "Mila a présenté le dessin qu’elle avait terminé chez elle.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "la fin du dessin, puis la présentation du dessin",
    "distractors": [
      "la présentation du dessin, puis la fin du dessin",
      "la fin du dessin et la présentation du dessin commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "Mila a présenté le dessin qu’elle avait terminé chez elle."
    ],
    "reason": "Le passage situe la fin du dessin avant la présentation du dessin. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-6",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "Le camion est reparti. Les employés avaient chargé les caisses.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "le chargement des caisses, puis le départ du camion",
    "distractors": [
      "le départ du camion, puis le chargement des caisses",
      "le chargement des caisses et le départ du camion commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "Le camion est reparti. Les employés avaient chargé les caisses."
    ],
    "reason": "Le passage situe le chargement des caisses avant le départ du camion. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-7",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "Nous avions réservé nos places. Le jour suivant, nous sommes entrés dans la salle.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "la réservation des places, puis notre entrée dans la salle",
    "distractors": [
      "notre entrée dans la salle, puis la réservation des places",
      "la réservation des places et notre entrée dans la salle commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "Nous avions réservé nos places. Le jour suivant, nous sommes entrés dans la salle."
    ],
    "reason": "Le passage situe la réservation des places avant notre entrée dans la salle. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-8",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "Le photographe a imprimé les images qu’il avait prises au lever du jour.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "la prise des images, puis leur impression",
    "distractors": [
      "leur impression, puis la prise des images",
      "la prise des images et leur impression commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "Le photographe a imprimé les images qu’il avait prises au lever du jour."
    ],
    "reason": "Le passage situe la prise des images avant leur impression. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-9",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "La pluie avait cessé lorsque les randonneurs ont repris leur marche.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "la fin de la pluie, puis la reprise de la marche",
    "distractors": [
      "la reprise de la marche, puis la fin de la pluie",
      "la fin de la pluie et la reprise de la marche commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "La pluie avait cessé lorsque les randonneurs ont repris leur marche."
    ],
    "reason": "Le passage situe la fin de la pluie avant la reprise de la marche. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-10",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "Sara a rendu le roman. Elle l’avait lu pendant les vacances.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "la lecture du roman, puis le retour du roman",
    "distractors": [
      "le retour du roman, puis la lecture du roman",
      "la lecture du roman et le retour du roman commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "Sara a rendu le roman. Elle l’avait lu pendant les vacances."
    ],
    "reason": "Le passage situe la lecture du roman avant le retour du roman. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-11",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "Les visiteurs ont admiré les statues que les artistes avaient installées.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "l’installation des statues, puis l’admiration des visiteurs",
    "distractors": [
      "l’admiration des visiteurs, puis l’installation des statues",
      "l’installation des statues et l’admiration des visiteurs commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "Les visiteurs ont admiré les statues que les artistes avaient installées."
    ],
    "reason": "Le passage situe l’installation des statues avant l’admiration des visiteurs. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "anteriority-12",
    "nodeKey": "interpreter_anteriorite_passee",
    "prompt": "Le repas était prêt : la cuisinière avait préparé tous les plats avant midi.\n\nQuel ordre des événements le passage indique-t-il ?",
    "answer": "la préparation des plats, puis le moment où le repas était prêt",
    "distractors": [
      "le moment où le repas était prêt, puis la préparation des plats",
      "la préparation des plats et le moment où le repas était prêt commencent nécessairement au même instant"
    ],
    "assessedTexts": [
      "Le repas était prêt : la cuisinière avait préparé tous les plats avant midi."
    ],
    "reason": "Le passage situe la préparation des plats avant le moment où le repas était prêt. Le plus-que-parfait signale l’événement antérieur."
  },
  {
    "key": "markers-1",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "Le guide a quitté le refuge. Auparavant, il avait vérifié la carte.\n\nQue signifie ici « Auparavant » ?",
    "answer": "La vérification précède le départ",
    "distractors": [
      "La vérification suit le départ",
      "La vérification a forcément lieu pendant le départ"
    ],
    "assessedTexts": [
      "Le guide a quitté le refuge. Auparavant, il avait vérifié la carte."
    ],
    "reason": "Dans ce contexte, « Auparavant » indique ceci : la vérification précède le départ."
  },
  {
    "key": "markers-2",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "Nous avons planté les graines. Ensuite, nous les avons arrosées.\n\nQue signifie ici « Ensuite » ?",
    "answer": "L’arrosage suit la plantation",
    "distractors": [
      "L’arrosage précède la plantation",
      "Les deux actions sont présentées comme simultanées"
    ],
    "assessedTexts": [
      "Nous avons planté les graines. Ensuite, nous les avons arrosées."
    ],
    "reason": "Dans ce contexte, « Ensuite » indique ceci : l’arrosage suit la plantation."
  },
  {
    "key": "markers-3",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "Pendant que Lina balayait, son frère rangeait les chaises.\n\nQue signifie ici « Pendant que » ?",
    "answer": "Les deux actions se déroulent au moins en partie en même temps",
    "distractors": [
      "Le rangement est forcément terminé avant le balayage",
      "Le rangement commence nécessairement le lendemain"
    ],
    "assessedTexts": [
      "Pendant que Lina balayait, son frère rangeait les chaises."
    ],
    "reason": "Dans ce contexte, « Pendant que » indique ceci : les deux actions se déroulent au moins en partie en même temps."
  },
  {
    "key": "markers-4",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "La projection aura lieu samedi. La veille, les bénévoles installeront l’écran.\n\nQue signifie ici « La veille » ?",
    "answer": "L’écran sera installé le vendredi",
    "distractors": [
      "L’écran sera installé le dimanche",
      "L’écran sera installé une semaine après"
    ],
    "assessedTexts": [
      "La projection aura lieu samedi. La veille, les bénévoles installeront l’écran."
    ],
    "reason": "Dans ce contexte, « La veille » indique ceci : l’écran sera installé le vendredi."
  },
  {
    "key": "markers-5",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "Le tournoi a eu lieu mardi. Le lendemain, nous avons rangé la salle.\n\nQue signifie ici « Le lendemain » ?",
    "answer": "Le rangement a eu lieu le mercredi",
    "distractors": [
      "Le rangement a eu lieu le lundi",
      "Le rangement a eu lieu le mardi précédent"
    ],
    "assessedTexts": [
      "Le tournoi a eu lieu mardi. Le lendemain, nous avons rangé la salle."
    ],
    "reason": "Dans ce contexte, « Le lendemain » indique ceci : le rangement a eu lieu le mercredi."
  },
  {
    "key": "markers-6",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "À partir de lundi, le club accueillera les nouveaux membres.\n\nQue signifie ici « À partir de lundi » ?",
    "answer": "Lundi marque le début de cet accueil",
    "distractors": [
      "Lundi marque nécessairement sa fin",
      "L’accueil est uniquement situé avant lundi"
    ],
    "assessedTexts": [
      "À partir de lundi, le club accueillera les nouveaux membres."
    ],
    "reason": "Dans ce contexte, « À partir de lundi » indique ceci : lundi marque le début de cet accueil."
  },
  {
    "key": "markers-7",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "La bibliothèque restera fermée jusqu’à jeudi inclus.\n\nQue signifie ici « Jusqu’à jeudi inclus » ?",
    "answer": "La fermeture comprend la journée de jeudi",
    "distractors": [
      "La bibliothèque ouvrira forcément jeudi matin",
      "La fermeture commence nécessairement jeudi soir"
    ],
    "assessedTexts": [
      "La bibliothèque restera fermée jusqu’à jeudi inclus."
    ],
    "reason": "Dans ce contexte, « Jusqu’à jeudi inclus » indique ceci : la fermeture comprend la journée de jeudi."
  },
  {
    "key": "markers-8",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "Deux heures après le départ de Léa, Hugo est arrivé.\n\nQue signifie ici « Deux heures après » ?",
    "answer": "L’arrivée de Hugo suit de deux heures le départ de Léa",
    "distractors": [
      "Hugo arrive deux heures avant le départ",
      "Les deux événements sont simultanés"
    ],
    "assessedTexts": [
      "Deux heures après le départ de Léa, Hugo est arrivé."
    ],
    "reason": "Dans ce contexte, « Deux heures après » indique ceci : l’arrivée de Hugo suit de deux heures le départ de Léa."
  },
  {
    "key": "markers-9",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "Avant de traverser, le piéton a regardé des deux côtés.\n\nQue signifie ici « Avant de » ?",
    "answer": "Le regard précède la traversée",
    "distractors": [
      "Le regard suit la traversée",
      "Les deux actions commencent forcément ensemble"
    ],
    "assessedTexts": [
      "Avant de traverser, le piéton a regardé des deux côtés."
    ],
    "reason": "Dans ce contexte, « Avant de » indique ceci : le regard précède la traversée."
  },
  {
    "key": "markers-10",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "La salle était calme. Soudain, une cloche a retenti.\n\nQue signifie ici « Soudain » ?",
    "answer": "La sonnerie survient brusquement dans la situation décrite",
    "distractors": [
      "La cloche sonnait habituellement chaque année",
      "La sonnerie est présentée comme un projet lointain"
    ],
    "assessedTexts": [
      "La salle était calme. Soudain, une cloche a retenti."
    ],
    "reason": "Dans ce contexte, « Soudain » indique ceci : la sonnerie survient brusquement dans la situation décrite."
  },
  {
    "key": "markers-11",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "En attendant le train, nous avons lu le panneau des horaires.\n\nQue signifie ici « En attendant » ?",
    "answer": "La lecture a lieu pendant l’attente",
    "distractors": [
      "La lecture a forcément lieu après le trajet",
      "La lecture précède nécessairement toute attente"
    ],
    "assessedTexts": [
      "En attendant le train, nous avons lu le panneau des horaires."
    ],
    "reason": "Dans ce contexte, « En attendant » indique ceci : la lecture a lieu pendant l’attente."
  },
  {
    "key": "markers-12",
    "nodeKey": "interpreter_marqueur_temporel",
    "prompt": "Depuis mardi, le portail est fermé.\n\nQue signifie ici « Depuis mardi » ?",
    "answer": "La fermeture a commencé mardi et continue au moment décrit",
    "distractors": [
      "La fermeture s’est obligatoirement terminée mardi",
      "La fermeture est uniquement prévue pour mardi prochain"
    ],
    "assessedTexts": [
      "Depuis mardi, le portail est fermé."
    ],
    "reason": "Dans ce contexte, « Depuis mardi » indique ceci : la fermeture a commencé mardi et continue au moment décrit."
  },
  {
    "key": "contrast-1",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "Le jardin était silencieux. Un merle a poussé un cri.\n\nComment le récit utilise-t-il « était silencieux » et « a poussé » ?",
    "answer": "« était silencieux » présente le cadre, une habitude ou une action en cours ; « a poussé » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« était silencieux » présente un événement accompli ; « a poussé » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "Le jardin était silencieux. Un merle a poussé un cri."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-2",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "Nous préparions les pancartes quand la directrice est entrée.\n\nComment le récit utilise-t-il « préparions » et « est entrée » ?",
    "answer": "« préparions » présente le cadre, une habitude ou une action en cours ; « est entrée » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« préparions » présente un événement accompli ; « est entrée » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "Nous préparions les pancartes quand la directrice est entrée."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-3",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "Le couloir semblait vide. Une silhouette a traversé la lumière.\n\nComment le récit utilise-t-il « semblait » et « a traversé » ?",
    "answer": "« semblait » présente le cadre, une habitude ou une action en cours ; « a traversé » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« semblait » présente un événement accompli ; « a traversé » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "Le couloir semblait vide. Une silhouette a traversé la lumière."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-4",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "Je cherchais mes lunettes lorsque tu as appelé.\n\nComment le récit utilise-t-il « cherchais » et « as appelé » ?",
    "answer": "« cherchais » présente le cadre, une habitude ou une action en cours ; « as appelé » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« cherchais » présente un événement accompli ; « as appelé » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "Je cherchais mes lunettes lorsque tu as appelé."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-5",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "La neige tombait. Les enfants ont construit un abri pendant deux heures.\n\nComment le récit utilise-t-il « tombait » et « ont construit » ?",
    "answer": "« tombait » présente le cadre, une habitude ou une action en cours ; « ont construit » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« tombait » présente un événement accompli ; « ont construit » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "La neige tombait. Les enfants ont construit un abri pendant deux heures."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-6",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "L’atelier était froid. Nous avons travaillé toute la matinée.\n\nComment le récit utilise-t-il « était froid » et « avons travaillé » ?",
    "answer": "« était froid » présente le cadre, une habitude ou une action en cours ; « avons travaillé » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« était froid » présente un événement accompli ; « avons travaillé » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "L’atelier était froid. Nous avons travaillé toute la matinée."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-7",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "Le chemin paraissait interminable. Nous avons marché pendant trois heures.\n\nComment le récit utilise-t-il « paraissait » et « avons marché » ?",
    "answer": "« paraissait » présente le cadre, une habitude ou une action en cours ; « avons marché » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« paraissait » présente un événement accompli ; « avons marché » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "Le chemin paraissait interminable. Nous avons marché pendant trois heures."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-8",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "Les outils étaient prêts. L’artisan a réparé la table pendant tout l’après-midi.\n\nComment le récit utilise-t-il « étaient prêts » et « a réparé » ?",
    "answer": "« étaient prêts » présente le cadre, une habitude ou une action en cours ; « a réparé » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« étaient prêts » présente un événement accompli ; « a réparé » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "Les outils étaient prêts. L’artisan a réparé la table pendant tout l’après-midi."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-9",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "Chaque soir, Léo lisait au salon. Hier, il a terminé son roman.\n\nComment le récit utilise-t-il « lisait » et « a terminé » ?",
    "answer": "« lisait » présente le cadre, une habitude ou une action en cours ; « a terminé » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« lisait » présente un événement accompli ; « a terminé » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "Chaque soir, Léo lisait au salon. Hier, il a terminé son roman."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-10",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "Autrefois, nous passions souvent par ce tunnel. Un jour, nous avons choisi une autre route.\n\nComment le récit utilise-t-il « passions » et « avons choisi » ?",
    "answer": "« passions » présente le cadre, une habitude ou une action en cours ; « avons choisi » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« passions » présente un événement accompli ; « avons choisi » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "Autrefois, nous passions souvent par ce tunnel. Un jour, nous avons choisi une autre route."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-11",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "Tous les étés, elle visitait ses cousins. L’été dernier, elle a voyagé ailleurs.\n\nComment le récit utilise-t-il « visitait » et « a voyagé » ?",
    "answer": "« visitait » présente le cadre, une habitude ou une action en cours ; « a voyagé » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« visitait » présente un événement accompli ; « a voyagé » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "Tous les étés, elle visitait ses cousins. L’été dernier, elle a voyagé ailleurs."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "contrast-12",
    "nodeKey": "contraster_pc_imparfait",
    "prompt": "D’habitude, ils jouaient dehors après l’école. Mardi, ils ont préparé un gâteau.\n\nComment le récit utilise-t-il « jouaient » et « ont préparé » ?",
    "answer": "« jouaient » présente le cadre, une habitude ou une action en cours ; « ont préparé » présente un événement accompli ou une période délimitée",
    "distractors": [
      "« jouaient » présente un événement accompli ; « ont préparé » donne seulement le cadre",
      "Les deux formes annoncent des projets pour l’avenir"
    ],
    "assessedTexts": [
      "D’habitude, ils jouaient dehors après l’école. Mardi, ils ont préparé un gâteau."
    ],
    "reason": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
  },
  {
    "key": "sequence-1",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "Jade a accroché le cadre. Elle l’avait acheté le matin. Ensuite, elle a appelé son amie.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "acheter le cadre → accrocher le cadre → appeler son amie",
    "distractors": [
      "accrocher le cadre → acheter le cadre → appeler son amie",
      "appeler son amie → accrocher le cadre → acheter le cadre"
    ],
    "assessedTexts": [
      "Jade a accroché le cadre. Elle l’avait acheté le matin. Ensuite, elle a appelé son amie."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : acheter le cadre, puis accrocher le cadre, puis appeler son amie."
  },
  {
    "key": "sequence-2",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "Le bateau a quitté le quai. Auparavant, les passagers étaient montés. Enfin, le capitaine a annoncé la destination.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "monter dans le bateau → quitter le quai → annoncer la destination",
    "distractors": [
      "quitter le quai → monter dans le bateau → annoncer la destination",
      "annoncer la destination → quitter le quai → monter dans le bateau"
    ],
    "assessedTexts": [
      "Le bateau a quitté le quai. Auparavant, les passagers étaient montés. Enfin, le capitaine a annoncé la destination."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : monter dans le bateau, puis quitter le quai, puis annoncer la destination."
  },
  {
    "key": "sequence-3",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "Nous avions préparé la pâte. Après l’avoir versée, nous avons enfourné le plat.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "préparer la pâte → verser la pâte → enfourner le plat",
    "distractors": [
      "verser la pâte → préparer la pâte → enfourner le plat",
      "enfourner le plat → verser la pâte → préparer la pâte"
    ],
    "assessedTexts": [
      "Nous avions préparé la pâte. Après l’avoir versée, nous avons enfourné le plat."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : préparer la pâte, puis verser la pâte, puis enfourner le plat."
  },
  {
    "key": "sequence-4",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "La joueuse a reçu une médaille. Elle avait gagné la finale. Puis elle a posé pour une photo.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "gagner la finale → recevoir une médaille → poser pour une photo",
    "distractors": [
      "recevoir une médaille → gagner la finale → poser pour une photo",
      "poser pour une photo → recevoir une médaille → gagner la finale"
    ],
    "assessedTexts": [
      "La joueuse a reçu une médaille. Elle avait gagné la finale. Puis elle a posé pour une photo."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : gagner la finale, puis recevoir une médaille, puis poser pour une photo."
  },
  {
    "key": "sequence-5",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "Sami a ouvert la lettre, puis il l’a lue. Le facteur l’avait déposée plus tôt.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "déposer la lettre → ouvrir la lettre → lire la lettre",
    "distractors": [
      "ouvrir la lettre → déposer la lettre → lire la lettre",
      "lire la lettre → ouvrir la lettre → déposer la lettre"
    ],
    "assessedTexts": [
      "Sami a ouvert la lettre, puis il l’a lue. Le facteur l’avait déposée plus tôt."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : déposer la lettre, puis ouvrir la lettre, puis lire la lettre."
  },
  {
    "key": "sequence-6",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "Le film a commencé après l’installation du public. Les spectateurs avaient acheté leurs billets avant d’entrer.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "acheter les billets → s’installer dans la salle → commencer le film",
    "distractors": [
      "s’installer dans la salle → acheter les billets → commencer le film",
      "commencer le film → s’installer dans la salle → acheter les billets"
    ],
    "assessedTexts": [
      "Le film a commencé après l’installation du public. Les spectateurs avaient acheté leurs billets avant d’entrer."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : acheter les billets, puis s’installer dans la salle, puis commencer le film."
  },
  {
    "key": "sequence-7",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "Nina a planté les fleurs. La veille, elle avait préparé la terre. Le lendemain de la plantation, elle a arrosé.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "préparer la terre → planter les fleurs → arroser les fleurs",
    "distractors": [
      "planter les fleurs → préparer la terre → arroser les fleurs",
      "arroser les fleurs → planter les fleurs → préparer la terre"
    ],
    "assessedTexts": [
      "Nina a planté les fleurs. La veille, elle avait préparé la terre. Le lendemain de la plantation, elle a arrosé."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : préparer la terre, puis planter les fleurs, puis arroser les fleurs."
  },
  {
    "key": "sequence-8",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "Après avoir choisi une photo, je l’ai imprimée. Je l’ai ensuite placée dans un album.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "choisir une photo → imprimer la photo → placer la photo dans un album",
    "distractors": [
      "imprimer la photo → choisir une photo → placer la photo dans un album",
      "placer la photo dans un album → imprimer la photo → choisir une photo"
    ],
    "assessedTexts": [
      "Après avoir choisi une photo, je l’ai imprimée. Je l’ai ensuite placée dans un album."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : choisir une photo, puis imprimer la photo, puis placer la photo dans un album."
  },
  {
    "key": "sequence-9",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "Les ouvriers ont posé le toit. Ils avaient monté les murs. Enfin, ils ont installé la cheminée.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "monter les murs → poser le toit → installer la cheminée",
    "distractors": [
      "poser le toit → monter les murs → installer la cheminée",
      "installer la cheminée → poser le toit → monter les murs"
    ],
    "assessedTexts": [
      "Les ouvriers ont posé le toit. Ils avaient monté les murs. Enfin, ils ont installé la cheminée."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : monter les murs, puis poser le toit, puis installer la cheminée."
  },
  {
    "key": "sequence-10",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "La chanteuse a salué le public, puis elle a quitté la scène. Elle avait terminé sa chanson juste avant le salut.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "terminer la chanson → saluer le public → quitter la scène",
    "distractors": [
      "saluer le public → terminer la chanson → quitter la scène",
      "quitter la scène → saluer le public → terminer la chanson"
    ],
    "assessedTexts": [
      "La chanteuse a salué le public, puis elle a quitté la scène. Elle avait terminé sa chanson juste avant le salut."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : terminer la chanson, puis saluer le public, puis quitter la scène."
  },
  {
    "key": "sequence-11",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "Le train est arrivé après notre entrée en gare. Nous sommes ensuite montés à bord.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "notre entrée en gare → l’arrivée du train → notre montée à bord",
    "distractors": [
      "l’arrivée du train → notre entrée en gare → notre montée à bord",
      "notre montée à bord → l’arrivée du train → notre entrée en gare"
    ],
    "assessedTexts": [
      "Le train est arrivé après notre entrée en gare. Nous sommes ensuite montés à bord."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : notre entrée en gare, puis l’arrivée du train, puis notre montée à bord."
  },
  {
    "key": "sequence-12",
    "nodeKey": "interpreter_sequence_temporelle",
    "prompt": "La lampe a été réparée mercredi. Elle était tombée mardi. Jeudi, nous l’avons remise sur le bureau.\n\nQuelle suite respecte la chronologie indiquée ?",
    "answer": "la chute de la lampe → la réparation de la lampe → le retour de la lampe sur le bureau",
    "distractors": [
      "la réparation de la lampe → la chute de la lampe → le retour de la lampe sur le bureau",
      "le retour de la lampe sur le bureau → la réparation de la lampe → la chute de la lampe"
    ],
    "assessedTexts": [
      "La lampe a été réparée mercredi. Elle était tombée mardi. Jeudi, nous l’avons remise sur le bureau."
    ],
    "reason": "Les temps et les marqueurs donnent cet ordre : la chute de la lampe, puis la réparation de la lampe, puis le retour de la lampe sur le bureau."
  }
] as const;

export const NARRATIVE_TIME_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:narrative-time:anteriority",
    "nodeKey": "interpreter_anteriorite_passee",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Repérer ce qui était déjà arrivé",
    "learnerQuestionFr": "Quel événement précède le moment passé du récit ?",
    "steps": [
      {
        "exampleFr": "Le film a commencé. Nous avions acheté nos billets en ligne.",
        "explanationFr": "L’achat précède le début du film, même s’il est raconté après. Avions acheté est au plus-que-parfait."
      },
      {
        "exampleFr": "Quand l’alarme a sonné, le veilleur avait terminé sa ronde.",
        "explanationFr": "Repère d’abord le moment passé : l’alarme. Puis place la ronde avant ce moment."
      },
      {
        "exampleFr": "La neige avait fondu. Les enfants sont sortis.",
        "explanationFr": "Avait fondu présente un événement déjà accompli quand les enfants sortent."
      }
    ],
    "takeawayFr": "Repère le moment du récit, puis utilise les temps et les mots de liaison pour situer les événements.",
    "boundaryFr": "L’ordre des phrases n’est pas toujours l’ordre des événements. Le plus-que-parfait situe une action avant un repère passé ; il ne donne pas nécessairement une date précise.",
    "practice": [
      {
        "id": "narrative-time-guided:anteriority:1",
        "promptFr": "J’ai utilisé la clé que tu m’avais confiée.\n\nQuel ordre des événements le passage indique-t-il ?",
        "choices": [
          "le prêt de la clé, puis son utilisation",
          "son utilisation, puis le prêt de la clé",
          "le prêt de la clé et son utilisation commencent nécessairement au même instant"
        ],
        "answerFr": "le prêt de la clé, puis son utilisation",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Le passage situe le prêt de la clé avant son utilisation. Le plus-que-parfait signale l’événement antérieur."
      },
      {
        "id": "narrative-time-guided:anteriority:2",
        "promptFr": "Le vent avait emporté le chapeau. Léa est sortie pour le chercher.\n\nQuel ordre des événements le passage indique-t-il ?",
        "choices": [
          "la perte du chapeau, puis la sortie de Léa",
          "la sortie de Léa, puis la perte du chapeau",
          "la perte du chapeau et la sortie de Léa commencent nécessairement au même instant"
        ],
        "answerFr": "la perte du chapeau, puis la sortie de Léa",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Le passage situe la perte du chapeau avant la sortie de Léa. Le plus-que-parfait signale l’événement antérieur."
      },
      {
        "id": "narrative-time-guided:anteriority:3",
        "promptFr": "Nous avons ouvert la boîte que les enfants avaient décorée.\n\nQuel ordre des événements le passage indique-t-il ?",
        "choices": [
          "la décoration de la boîte, puis son ouverture",
          "son ouverture, puis la décoration de la boîte",
          "la décoration de la boîte et son ouverture commencent nécessairement au même instant"
        ],
        "answerFr": "la décoration de la boîte, puis son ouverture",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Le passage situe la décoration de la boîte avant son ouverture. Le plus-que-parfait signale l’événement antérieur."
      },
      {
        "id": "narrative-time-guided:anteriority:4",
        "promptFr": "Quand le groupe a commencé à chanter, le technicien avait réglé les micros.\n\nQuel ordre des événements le passage indique-t-il ?",
        "choices": [
          "le réglage des micros, puis le début du chant",
          "le début du chant, puis le réglage des micros",
          "le réglage des micros et le début du chant commencent nécessairement au même instant"
        ],
        "answerFr": "le réglage des micros, puis le début du chant",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Le passage situe le réglage des micros avant le début du chant. Le plus-que-parfait signale l’événement antérieur."
      },
      {
        "id": "narrative-time-guided:anteriority:5",
        "promptFr": "Ali avait appris l’adresse. Il a ensuite guidé ses amis.\n\nQuel ordre des événements le passage indique-t-il ?",
        "choices": [
          "l’apprentissage de l’adresse, puis le guidage des amis",
          "le guidage des amis, puis l’apprentissage de l’adresse",
          "l’apprentissage de l’adresse et le guidage des amis commencent nécessairement au même instant"
        ],
        "answerFr": "l’apprentissage de l’adresse, puis le guidage des amis",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Le passage situe l’apprentissage de l’adresse avant le guidage des amis. Le plus-que-parfait signale l’événement antérieur."
      },
      {
        "id": "narrative-time-guided:anteriority:6",
        "promptFr": "Elle a envoyé la lettre qu’elle avait rédigée le matin.\n\nQuel ordre des événements le passage indique-t-il ?",
        "choices": [
          "la rédaction de la lettre, puis son envoi",
          "son envoi, puis la rédaction de la lettre",
          "la rédaction de la lettre et son envoi commencent nécessairement au même instant"
        ],
        "answerFr": "la rédaction de la lettre, puis son envoi",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Le passage situe la rédaction de la lettre avant son envoi. Le plus-que-parfait signale l’événement antérieur."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Le film a commencé. Nous avions acheté nos billets en ligne.",
        "Quand l’alarme a sonné, le veilleur avait terminé sa ronde.",
        "La neige avait fondu. Les enfants sont sortis.",
        "J’ai utilisé la clé que tu m’avais confiée.",
        "Le vent avait emporté le chapeau. Léa est sortie pour le chercher.",
        "Nous avons ouvert la boîte que les enfants avaient décorée.",
        "Quand le groupe a commencé à chanter, le technicien avait réglé les micros.",
        "Ali avait appris l’adresse. Il a ensuite guidé ses amis.",
        "Elle a envoyé la lettre qu’elle avait rédigée le matin."
      ]
    }
  },
  {
    "id": "french-v3-teaching:narrative-time:markers",
    "nodeKey": "interpreter_marqueur_temporel",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Lire les mots qui situent les actions",
    "learnerQuestionFr": "Que m’apprennent avant, ensuite, pendant ou depuis ?",
    "steps": [
      {
        "exampleFr": "Le spectacle est prévu jeudi. La veille, nous répéterons.",
        "explanationFr": "La veille signifie le jour précédent. Le repère est jeudi : la répétition est donc mercredi."
      },
      {
        "exampleFr": "Avant de cuisiner, je lave les légumes. Ensuite, je les coupe.",
        "explanationFr": "Avant place le lavage avant la cuisine. Ensuite place la découpe après le lavage dans cette suite."
      },
      {
        "exampleFr": "Pendant que tu lis, je prépare le goûter.",
        "explanationFr": "Pendant que indique que les actions se déroulent au moins en partie en même temps."
      }
    ],
    "takeawayFr": "Repère le moment du récit, puis utilise les temps et les mots de liaison pour situer les événements.",
    "boundaryFr": "Certains marqueurs situent un événement par rapport à un autre, pas par rapport à aujourd’hui. La veille d’un samedi est un vendredi, quel que soit le jour où tu lis.",
    "practice": [
      {
        "id": "narrative-time-guided:markers:1",
        "promptFr": "Le repas aura lieu dimanche. La veille, nous préparerons les tables.\n\nQue signifie ici « La veille » ?",
        "choices": [
          "Les tables seront préparées le samedi",
          "Les tables seront préparées le lundi",
          "Les tables seront préparées après le repas"
        ],
        "answerFr": "Les tables seront préparées le samedi",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Dans ce contexte, « La veille » indique ceci : les tables seront préparées le samedi."
      },
      {
        "id": "narrative-time-guided:markers:2",
        "promptFr": "Aya a dessiné le plan. Puis elle a choisi les matériaux.\n\nQue signifie ici « Puis » ?",
        "choices": [
          "Le choix des matériaux suit le dessin du plan",
          "Le choix précède le dessin",
          "Les deux commencent nécessairement au même instant"
        ],
        "answerFr": "Le choix des matériaux suit le dessin du plan",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Dans ce contexte, « Puis » indique ceci : le choix des matériaux suit le dessin du plan."
      },
      {
        "id": "narrative-time-guided:markers:3",
        "promptFr": "Pendant que Max collait les affiches, Nina distribuait les invitations.\n\nQue signifie ici « Pendant que » ?",
        "choices": [
          "Les deux actions se déroulent au moins en partie en même temps",
          "La distribution a forcément lieu le lendemain",
          "Le collage suit obligatoirement la distribution"
        ],
        "answerFr": "Les deux actions se déroulent au moins en partie en même temps",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Dans ce contexte, « Pendant que » indique ceci : les deux actions se déroulent au moins en partie en même temps."
      },
      {
        "id": "narrative-time-guided:markers:4",
        "promptFr": "Le stage s’est terminé vendredi. Le lendemain, nous avons pris le train.\n\nQue signifie ici « Le lendemain » ?",
        "choices": [
          "Le trajet a eu lieu le samedi",
          "Le trajet a eu lieu le jeudi",
          "Le trajet a eu lieu un mois avant"
        ],
        "answerFr": "Le trajet a eu lieu le samedi",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Dans ce contexte, « Le lendemain » indique ceci : le trajet a eu lieu le samedi."
      },
      {
        "id": "narrative-time-guided:markers:5",
        "promptFr": "Avant de partir, elle a éteint la lumière.\n\nQue signifie ici « Avant de » ?",
        "choices": [
          "Elle éteint la lumière avant son départ",
          "Elle l’éteint après son départ",
          "Elle annonce une habitude sans ordre indiqué"
        ],
        "answerFr": "Elle éteint la lumière avant son départ",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Dans ce contexte, « Avant de » indique ceci : elle éteint la lumière avant son départ."
      },
      {
        "id": "narrative-time-guided:markers:6",
        "promptFr": "Depuis ce matin, la neige tombe.\n\nQue signifie ici « Depuis ce matin » ?",
        "choices": [
          "La neige a commencé à tomber ce matin et tombe encore au moment décrit",
          "La neige s’est forcément arrêtée ce matin",
          "La neige commencera seulement demain"
        ],
        "answerFr": "La neige a commencé à tomber ce matin et tombe encore au moment décrit",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Dans ce contexte, « Depuis ce matin » indique ceci : la neige a commencé à tomber ce matin et tombe encore au moment décrit."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Le spectacle est prévu jeudi. La veille, nous répéterons.",
        "Avant de cuisiner, je lave les légumes. Ensuite, je les coupe.",
        "Pendant que tu lis, je prépare le goûter.",
        "Le repas aura lieu dimanche. La veille, nous préparerons les tables.",
        "Aya a dessiné le plan. Puis elle a choisi les matériaux.",
        "Pendant que Max collait les affiches, Nina distribuait les invitations.",
        "Le stage s’est terminé vendredi. Le lendemain, nous avons pris le train.",
        "Avant de partir, elle a éteint la lumière.",
        "Depuis ce matin, la neige tombe."
      ]
    }
  },
  {
    "id": "french-v3-teaching:narrative-time:contrast",
    "nodeKey": "contraster_pc_imparfait",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Distinguer le cadre et les événements du récit",
    "learnerQuestionFr": "Pourquoi le récit emploie-t-il deux temps différents ?",
    "steps": [
      {
        "exampleFr": "La rue était déserte. Une voiture a surgi.",
        "explanationFr": "Était installe le cadre. A surgi présente un événement qui survient dans ce cadre."
      },
      {
        "exampleFr": "Il faisait chaud. Nous avons attendu pendant quatre heures.",
        "explanationFr": "L’attente dure quatre heures, mais elle est présentée comme une période délimitée et terminée au passé composé."
      },
      {
        "exampleFr": "Tous les jours, elle courait près du canal. Hier, elle a changé de parcours.",
        "explanationFr": "Courait présente une habitude. A changé raconte ici un événement particulier."
      }
    ],
    "takeawayFr": "Repère le moment du récit, puis utilise les temps et les mots de liaison pour situer les événements.",
    "boundaryFr": "Le passé composé peut présenter une période longue mais délimitée. L’imparfait peut décrire une situation brève : la durée seule ne détermine pas le choix.",
    "practice": [
      {
        "id": "narrative-time-guided:contrast:1",
        "promptFr": "La classe était calme. Une porte a claqué.\n\nComment le récit utilise-t-il « était calme » et « a claqué » ?",
        "choices": [
          "« était calme » présente le cadre, une habitude ou une action en cours ; « a claqué » présente un événement accompli ou une période délimitée",
          "« était calme » présente un événement accompli ; « a claqué » donne seulement le cadre",
          "Les deux formes annoncent des projets pour l’avenir"
        ],
        "answerFr": "« était calme » présente le cadre, une habitude ou une action en cours ; « a claqué » présente un événement accompli ou une période délimitée",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
      },
      {
        "id": "narrative-time-guided:contrast:2",
        "promptFr": "Tu recopiais le texte quand la sonnerie a retenti.\n\nComment le récit utilise-t-il « recopiais » et « a retenti » ?",
        "choices": [
          "« recopiais » présente le cadre, une habitude ou une action en cours ; « a retenti » présente un événement accompli ou une période délimitée",
          "« recopiais » présente un événement accompli ; « a retenti » donne seulement le cadre",
          "Les deux formes annoncent des projets pour l’avenir"
        ],
        "answerFr": "« recopiais » présente le cadre, une habitude ou une action en cours ; « a retenti » présente un événement accompli ou une période délimitée",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
      },
      {
        "id": "narrative-time-guided:contrast:3",
        "promptFr": "Le vent soufflait. Nous avons attendu une heure dans le hall.\n\nComment le récit utilise-t-il « soufflait » et « avons attendu » ?",
        "choices": [
          "« soufflait » présente le cadre, une habitude ou une action en cours ; « avons attendu » présente un événement accompli ou une période délimitée",
          "« soufflait » présente un événement accompli ; « avons attendu » donne seulement le cadre",
          "Les deux formes annoncent des projets pour l’avenir"
        ],
        "answerFr": "« soufflait » présente le cadre, une habitude ou une action en cours ; « avons attendu » présente un événement accompli ou une période délimitée",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
      },
      {
        "id": "narrative-time-guided:contrast:4",
        "promptFr": "La salle était lumineuse. Les bénévoles ont peint les murs pendant deux jours.\n\nComment le récit utilise-t-il « était lumineuse » et « ont peint » ?",
        "choices": [
          "« était lumineuse » présente le cadre, une habitude ou une action en cours ; « ont peint » présente un événement accompli ou une période délimitée",
          "« était lumineuse » présente un événement accompli ; « ont peint » donne seulement le cadre",
          "Les deux formes annoncent des projets pour l’avenir"
        ],
        "answerFr": "« était lumineuse » présente le cadre, une habitude ou une action en cours ; « ont peint » présente un événement accompli ou une période délimitée",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
      },
      {
        "id": "narrative-time-guided:contrast:5",
        "promptFr": "Chaque matin, elle nourrissait les poules. Vendredi, elle a oublié.\n\nComment le récit utilise-t-il « nourrissait » et « a oublié » ?",
        "choices": [
          "« nourrissait » présente le cadre, une habitude ou une action en cours ; « a oublié » présente un événement accompli ou une période délimitée",
          "« nourrissait » présente un événement accompli ; « a oublié » donne seulement le cadre",
          "Les deux formes annoncent des projets pour l’avenir"
        ],
        "answerFr": "« nourrissait » présente le cadre, une habitude ou une action en cours ; « a oublié » présente un événement accompli ou une période délimitée",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
      },
      {
        "id": "narrative-time-guided:contrast:6",
        "promptFr": "Chaque semaine, nous répétions ensemble. Hier, nous avons donné notre premier concert.\n\nComment le récit utilise-t-il « répétions » et « avons donné » ?",
        "choices": [
          "« répétions » présente le cadre, une habitude ou une action en cours ; « avons donné » présente un événement accompli ou une période délimitée",
          "« répétions » présente un événement accompli ; « avons donné » donne seulement le cadre",
          "Les deux formes annoncent des projets pour l’avenir"
        ],
        "answerFr": "« répétions » présente le cadre, une habitude ou une action en cours ; « avons donné » présente un événement accompli ou une période délimitée",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "L’imparfait présente ici la situation ou la répétition. Le passé composé présente l’événement particulier ou la période délimitée."
      }
    ],
    "materialExposure": {
      "sentences": [
        "La rue était déserte. Une voiture a surgi.",
        "Il faisait chaud. Nous avons attendu pendant quatre heures.",
        "Tous les jours, elle courait près du canal. Hier, elle a changé de parcours.",
        "La classe était calme. Une porte a claqué.",
        "Tu recopiais le texte quand la sonnerie a retenti.",
        "Le vent soufflait. Nous avons attendu une heure dans le hall.",
        "La salle était lumineuse. Les bénévoles ont peint les murs pendant deux jours.",
        "Chaque matin, elle nourrissait les poules. Vendredi, elle a oublié.",
        "Chaque semaine, nous répétions ensemble. Hier, nous avons donné notre premier concert."
      ]
    }
  },
  {
    "id": "french-v3-teaching:narrative-time:sequence",
    "nodeKey": "interpreter_sequence_temporelle",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Reconstruire la chronologie d’un petit récit",
    "learnerQuestionFr": "Dans quel ordre les événements se sont-ils réellement produits ?",
    "steps": [
      {
        "exampleFr": "Emma a envoyé le colis. Elle l’avait emballé chez elle. Puis elle est rentrée.",
        "explanationFr": "L’ordre du récit diffère de celui des actions : emballer, envoyer, rentrer. Avait emballé situe la première action avant l’envoi."
      },
      {
        "exampleFr": "Après avoir lavé le tissu, nous l’avons séché, puis découpé.",
        "explanationFr": "Combine les marqueurs et les verbes : le lavage précède le séchage, qui précède la découpe."
      },
      {
        "exampleFr": "Pendant que Léa écrit, Max dessine.",
        "explanationFr": "Ici, les actions se déroulent en même temps. Le texte ne permet pas de dire que l’une se termine avant le début de l’autre."
      }
    ],
    "takeawayFr": "Repère le moment du récit, puis utilise les temps et les mots de liaison pour situer les événements.",
    "boundaryFr": "Un récit peut présenter des actions simultanées ou laisser un ordre incertain. N’invente pas un ordre précis si les temps et les indices ne le permettent pas.",
    "practice": [
      {
        "id": "narrative-time-guided:sequence:1",
        "promptFr": "Lina a fermé son sac. Elle avait rangé son carnet. Puis elle est sortie.\n\nQuelle suite respecte la chronologie indiquée ?",
        "choices": [
          "ranger le carnet → fermer le sac → sortir",
          "fermer le sac → ranger le carnet → sortir",
          "sortir → fermer le sac → ranger le carnet"
        ],
        "answerFr": "ranger le carnet → fermer le sac → sortir",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Les temps et les marqueurs donnent cet ordre : ranger le carnet, puis fermer le sac, puis sortir."
      },
      {
        "id": "narrative-time-guided:sequence:2",
        "promptFr": "Nous avons servi le thé après avoir rempli les tasses. L’eau avait bouilli auparavant.\n\nQuelle suite respecte la chronologie indiquée ?",
        "choices": [
          "faire bouillir l’eau → remplir les tasses → servir le thé",
          "remplir les tasses → faire bouillir l’eau → servir le thé",
          "servir le thé → remplir les tasses → faire bouillir l’eau"
        ],
        "answerFr": "faire bouillir l’eau → remplir les tasses → servir le thé",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Les temps et les marqueurs donnent cet ordre : faire bouillir l’eau, puis remplir les tasses, puis servir le thé."
      },
      {
        "id": "narrative-time-guided:sequence:3",
        "promptFr": "Le groupe a salué les visiteurs. Il avait terminé sa danse. Ensuite, il a quitté la place.\n\nQuelle suite respecte la chronologie indiquée ?",
        "choices": [
          "terminer la danse → saluer les visiteurs → quitter la place",
          "saluer les visiteurs → terminer la danse → quitter la place",
          "quitter la place → saluer les visiteurs → terminer la danse"
        ],
        "answerFr": "terminer la danse → saluer les visiteurs → quitter la place",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Les temps et les marqueurs donnent cet ordre : terminer la danse, puis saluer les visiteurs, puis quitter la place."
      },
      {
        "id": "narrative-time-guided:sequence:4",
        "promptFr": "J’ai rangé les photos lundi. Je les avais reçues dimanche. Mardi, j’ai montré l’album.\n\nQuelle suite respecte la chronologie indiquée ?",
        "choices": [
          "recevoir les photos → ranger les photos → montrer l’album",
          "ranger les photos → recevoir les photos → montrer l’album",
          "montrer l’album → ranger les photos → recevoir les photos"
        ],
        "answerFr": "recevoir les photos → ranger les photos → montrer l’album",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Les temps et les marqueurs donnent cet ordre : recevoir les photos, puis ranger les photos, puis montrer l’album."
      },
      {
        "id": "narrative-time-guided:sequence:5",
        "promptFr": "Elle a allumé le four après avoir préparé le plat. Elle a ensuite lancé le minuteur.\n\nQuelle suite respecte la chronologie indiquée ?",
        "choices": [
          "préparer le plat → allumer le four → lancer le minuteur",
          "allumer le four → préparer le plat → lancer le minuteur",
          "lancer le minuteur → allumer le four → préparer le plat"
        ],
        "answerFr": "préparer le plat → allumer le four → lancer le minuteur",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Les temps et les marqueurs donnent cet ordre : préparer le plat, puis allumer le four, puis lancer le minuteur."
      },
      {
        "id": "narrative-time-guided:sequence:6",
        "promptFr": "Les invités sont repartis. Ils avaient partagé le repas. Nous avons ensuite nettoyé la table.\n\nQuelle suite respecte la chronologie indiquée ?",
        "choices": [
          "partager le repas → repartir pour les invités → nettoyer la table",
          "repartir pour les invités → partager le repas → nettoyer la table",
          "nettoyer la table → repartir pour les invités → partager le repas"
        ],
        "answerFr": "partager le repas → repartir pour les invités → nettoyer la table",
        "hintFr": "Ne confonds pas l’ordre des phrases avec celui des événements.",
        "explanationFr": "Les temps et les marqueurs donnent cet ordre : partager le repas, puis repartir pour les invités, puis nettoyer la table."
      }
    ],
    "materialExposure": {
      "sentences": [
        "Emma a envoyé le colis. Elle l’avait emballé chez elle. Puis elle est rentrée.",
        "Après avoir lavé le tissu, nous l’avons séché, puis découpé.",
        "Pendant que Léa écrit, Max dessine.",
        "Lina a fermé son sac. Elle avait rangé son carnet. Puis elle est sortie.",
        "Nous avons servi le thé après avoir rempli les tasses. L’eau avait bouilli auparavant.",
        "Le groupe a salué les visiteurs. Il avait terminé sa danse. Ensuite, il a quitté la place.",
        "J’ai rangé les photos lundi. Je les avais reçues dimanche. Mardi, j’ai montré l’album.",
        "Elle a allumé le four après avoir préparé le plat. Elle a ensuite lancé le minuteur.",
        "Les invités sont repartis. Ils avaient partagé le repas. Nous avons ensuite nettoyé la table."
      ]
    }
  }
];
