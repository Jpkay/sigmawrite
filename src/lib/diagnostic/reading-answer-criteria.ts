import type { ReadingRubric } from "@/lib/content/reading-rubric";

type ReadingAnswerCriteria = { rubric: ReadingRubric; alternatives: string[] };
const entry = (requiredIdeas: string[], alternative: string): ReadingAnswerCriteria => ({ rubric: { version: 1, requiredIdeas }, alternatives: [alternative] });

/** Criteria describe meaning, not keywords. The model answer is only one formulation. */
export const READING_ANSWER_CRITERIA: Record<string, ReadingAnswerCriteria> = {
  "reformuler_sans_copier:mangrove": entry([
    "Explique que les racines des mangroves protègent les jeunes poissons pendant leur croissance.",
    "Reformule avec tes propres mots : changer seulement la ponctuation ou un mot de la citation ne suffit pas.",
  ], "Les racines de ces arbres offrent aux petits poissons un endroit protégé pour se développer."),
  "reformuler_sans_copier:solar": entry([
    "Conserve le sens de la mesure : les achats d’électricité de l’école A ont diminué de 38 % sur une année.",
    "Reformule avec tes propres mots : changer seulement la ponctuation ou un mot de la citation ne suffit pas.",
  ], "Sur douze mois, l’école A a réduit de 38 % la quantité d’électricité achetée."),
  "reformuler_sans_copier:library": entry([
    "Explique que réunir les ressources papier et numériques répond mieux aux différents besoins des lecteurs.",
    "Reformule avec tes propres mots : changer seulement la ponctuation ou un mot de la citation ne suffit pas.",
  ], "Proposer à la fois des livres imprimés et des outils numériques satisfait mieux les besoins variés des lecteurs."),
  "organiser_resume_informatif:mangrove": entry([
    "Présente d’abord le problème : la destruction des mangroves a augmenté l’érosion.",
    "Relie ensuite ce problème à la solution : des habitants replantent et protègent les mangroves.",
  ], "L’érosion s’est aggravée après la destruction des mangroves ; pour y remédier, les habitants replantent ces arbres et protègent les parcelles."),
  "organiser_resume_informatif:solar": entry([
    "Présente le résultat principal : les panneaux solaires ont réduit les achats d’électricité de l’école A.",
    "Relie ce résultat à au moins une limite du texte : production variable avec la météo ou coût élevé de l’installation.",
  ], "L’école achète moins d’électricité grâce aux panneaux solaires, mais ceux-ci produisent moins pendant les périodes nuageuses."),
  "organiser_resume_informatif:bees": entry([
    "Présente le problème initial : le manque de fleurs en été fragilise les abeilles.",
    "Présente l’action menée pour y répondre : la ville crée des corridors fleuris.",
    "Indique le résultat observé ensuite : davantage d’espèces d’abeilles sont recensées le long des corridors.",
  ], "Pour aider les abeilles privées de fleurs en été, la ville a aménagé des passages fleuris où une plus grande diversité d’abeilles a ensuite été constatée."),
  "organiser_resume_narratif:garden": entry([
    "Présente le besoin initial de la classe : pouvoir observer les insectes étudiés en sciences.",
    "Relie l’action d’Aline et de la classe, créer un jardin, au résultat : les plantes commencent à pousser.",
  ], "La classe ayant besoin d’observer des insectes, Aline propose de créer un jardin qui finit par se couvrir de jeunes plantes."),
  "organiser_resume_narratif:notebook": entry([
    "Indique que Malik découvre un ancien carnet contenant des relevés de pluie.",
    "Explique qu’il le confie aux archives et participe à sa numérisation, permettant aux chercheurs d’utiliser les données.",
  ], "Après avoir trouvé de vieux relevés de pluie, Malik les remet aux archives et les numérise avec la bibliothécaire pour les rendre utiles aux scientifiques."),
  "organiser_resume_narratif:lighthouse": entry([
    "Présente le danger : un bateau approche de la côte pendant une tempête alors que le phare est éteint.",
    "Relie l’intervention d’Inès, qui rallume le phare, au dénouement : le bateau change de direction.",
  ], "Un navire approche dans la tempête alors que le phare ne fonctionne plus, mais Inès rétablit sa lumière et le bateau dévie sa route."),
  "comparer_points_de_vue:garden": entry([
    "Explique le point de vue positif d’Aline : le jardin est une réussite utile à la classe.",
    "Oppose ce point de vue à celui de l’élève imaginé dans la question, qui considérerait le jardin comme inutile.",
  ], "Aline est fière du jardin et le trouve utile pour apprendre, alors que l’autre élève n’y verrait aucun intérêt."),
  "comparer_points_de_vue:street": entry([
    "Explique que l’auteur soutient la rue piétonne avec une organisation adaptée.",
    "Oppose cette position à l’inquiétude des commerçants concernant la récupération ou le chargement des achats lourds.",
  ], "L’auteur souhaite une rue piétonne bien aménagée, tandis que les commerçants redoutent que leurs clients ne puissent plus emporter facilement leurs achats lourds."),
  "comparer_points_de_vue:library": entry([
    "Explique que l’auteur souhaite conserver ensemble les ressources papier et numériques.",
    "Oppose cette position à celle des responsables qui préfèrent le tout numérique pour gagner de la place.",
  ], "L’auteur veut garder les deux formats, mais certains responsables choisiraient uniquement le numérique afin de libérer de l’espace."),
  "relier_preuve_interpretation:school": entry([
    "Interprète la baisse des retards : commencer les cours plus tard peut aider les élèves à arriver à l’heure ; répéter le pourcentage seul ne suffit pas.",
  ], "La diminution des retards suggère qu’en décalant le début des cours, on facilite la ponctualité des élèves."),
  "relier_preuve_interpretation:street": entry([
    "Explique ce que la baisse du dioxyde d’azote signifie : limiter les voitures ou rendre la rue piétonne peut améliorer la qualité de l’air ou réduire la pollution ; répéter le chiffre seul ne suffit pas.",
  ], "La baisse de 22 % du dioxyde d’azote suggère que rendre la rue piétonne améliore la qualité de l’air."),
  "relier_preuve_interpretation:solar": entry([
    "Interprète la baisse des achats : les panneaux solaires peuvent réduire le recours à l’électricité du réseau ; ne te limite pas à répéter le chiffre.",
  ], "Ce résultat suggère que les panneaux rendent l’école moins dépendante de l’électricité achetée au réseau."),
};
