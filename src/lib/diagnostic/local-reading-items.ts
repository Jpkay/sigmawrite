import { runGates } from "@/lib/ai/item-generation/pipeline";
import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import {
  DIAGNOSTIC_DIFFICULTY_TIERS,
  diagnosticDifficultyForTier,
  diagnosticPromptFamilies,
} from "./item-authoring";
import type { CanonicalDiagnosticBankItem, DiagnosticEvidenceExpectation } from "./item-bank";

const PASSAGES = {
  garden: `À l’école de Nyamata, Aline trouvait la cour trop grise. Elle proposa un jardin parce que sa classe avait du mal à observer les insectes étudiés en sciences. Le lundi, les élèves dessinèrent un plan. Le mardi, leurs familles apportèrent des graines. Le mercredi, la classe planta des haricots et des fleurs. Comme Paul avait oublié l’arrosoir, Aline resta après les cours pour chercher de l’eau. Deux semaines plus tard, de jeunes pousses couvraient le carré de terre. « Ce petit jardin change déjà notre cour », dit-elle avec fierté.`,
  notebook: `En rangeant une étagère de la bibliothèque, Malik découvrit un vieux carnet portant le nom de Samuel Kabera. Les pages contenaient des mesures de pluie relevées quarante ans plus tôt. Malik aurait aimé garder sa découverte, mais la bibliothécaire lui expliqua que ces données pouvaient servir aux chercheurs. Il remit donc le carnet aux archives, le service qui conserve les documents anciens. La semaine suivante, ils le numérisèrent ensemble. Cette décision permit à une équipe scientifique de comparer les pluies d’autrefois avec celles d’aujourd’hui. Malik comprit alors que partager sa trouvaille était plus utile que la conserver pour lui seul.`,
  lighthouse: `La tempête avait effacé l’horizon lorsque Inès vit la lampe du vieux phare s’éteindre. Un bateau approchait encore de la côte. Malgré le vent qui secouait les vitres, elle prit une batterie de secours et gravit l’escalier. Chaque marche grinçait sous ses pieds, et Inès sentait son cœur battre plus vite. Au sommet, ses mains tremblaient, mais elle raccorda la batterie. Une lumière blanche traversa enfin la pluie. Au loin, le bateau changea de direction. Inès s’assit contre le mur, soulagée, tandis que le grondement des vagues semblait déjà moins menaçant.`,
  mangrove: `Les mangroves sont des forêts qui poussent entre la terre et la mer. Leurs racines forment une véritable nurserie : un abri où grandissent de nombreux jeunes poissons. Elles ralentissent aussi les vagues et protègent les villages côtiers.

Dans plusieurs régions, des mangroves ont été coupées pour construire des routes. Sans leurs racines, l’érosion a augmenté et certaines espèces ont disparu. Des habitants replantent maintenant des arbres locaux et interdisent le passage des véhicules sur les jeunes parcelles.

Après cinq ans, les zones restaurées abritent davantage de poissons et perdent moins de sol pendant les tempêtes. La reforestation ne remplace toutefois pas immédiatement une forêt ancienne : elle demande un suivi de longue durée.`,
  solar: `Une étude a comparé trois écoles de taille semblable. L’école A a installé des panneaux solaires sur son toit ; les écoles B et C utilisent encore uniquement le réseau électrique. En un an, l’école A a acheté 38 % d’électricité en moins. Sa production baisse cependant pendant les semaines très nuageuses, car l’énergie solaire est intermittente : elle n’est pas disponible de façon constante.

Selon la directrice, les panneaux rendent aussi les cours de sciences plus concrets. Les factures montrent une économie réelle, mais l’installation initiale reste coûteuse. Le rapport recommande donc d’évaluer l’ensoleillement et l’état de chaque toit avant de généraliser le projet.`,
  bees: `Dans certains quartiers, les abeilles trouvent beaucoup de fleurs au printemps, puis presque plus rien en été. Cette rupture réduit leur nourriture et fragilise les colonies.

La ville de Musanze a créé des « corridors fleuris » : des bandes de plantes locales reliant les parcs, les écoles et les jardins privés. Les jardiniers choisissent des espèces qui fleurissent à des périodes différentes. Ils évitent aussi les pesticides près de ces passages.

Deux ans après le début du projet, les observateurs comptent davantage d’espèces d’abeilles le long des corridors. Les scientifiques précisent que le climat influence également les populations ; les fleurs ne sont donc pas l’unique explication.`,
  school: `Les collèges devraient commencer les cours à 8 h 45 plutôt qu’à 8 h. Les adolescents ont naturellement tendance à s’endormir plus tard, et un départ matinal réduit souvent leur sommeil. Dans une étude menée auprès de 600 élèves, les retards ont diminué de 18 % après le changement d’horaire, tandis que la concentration déclarée a progressé.

Des entraîneurs craignent toutefois que les activités sportives finissent trop tard. Cette objection est sérieuse, mais les établissements peuvent raccourcir la pause de midi ou mieux coordonner les transports. À mes yeux, un essai d’un trimestre permettrait de mesurer les effets avant toute décision définitive.`,
  street: `La rue du Marché devrait devenir piétonne le samedi. Lors de trois journées d’essai, la concentration de dioxyde d’azote a baissé de 22 % et le nombre de passants a augmenté. Les familles disposaient de plus d’espace, et les cafés ont installé des tables dehors.

Certains commerçants affirment que leurs clients ne pourront plus charger des achats lourds. La ville doit répondre à cette difficulté en créant une zone de retrait à proximité. Ce contre-argument ne justifie pas l’abandon du projet ; il montre plutôt qu’une rue piétonne doit être soigneusement organisée.`,
  library: `Une bibliothèque scolaire ne devrait devenir ni entièrement numérique ni exclusivement imprimée. Les livres papier facilitent la lecture prolongée et restent accessibles sans appareil. Les ressources numériques, elles, permettent une recherche rapide et offrent des fonctions d’agrandissement utiles.

Dans une enquête locale, 64 % des élèves ont demandé de conserver les deux formats. Certains responsables préfèrent le tout numérique pour gagner de la place, mais une panne ou un manque d’équipement peut alors bloquer l’accès. Une collection hybride répond donc mieux à la diversité des usages.`,
} as const;

const PASSAGE_TYPES: Readonly<Record<keyof typeof PASSAGES, "literary" | "informational" | "argumentative">> = {
  garden: "literary", notebook: "literary", lighthouse: "literary",
  mangrove: "informational", solar: "informational", bees: "informational",
  school: "argumentative", street: "argumentative", library: "argumentative",
};

type PassageKey = keyof typeof PASSAGES;
type Seed = {
  passage: PassageKey;
  question: string;
  answer: string;
  distractors?: readonly [string, string];
};
type Plan = {
  nodeKey: string;
  expectation: Exclude<DiagnosticEvidenceExpectation, "independent_production">;
  seeds: readonly [Seed, Seed, Seed];
};

const PLANS: readonly Plan[] = [
  receptive("localiser_information_explicite", [
    s("garden", "Quel jour les familles ont-elles apporté des graines ?", "le mardi", ["le lundi", "le mercredi"]),
    s("solar", "De combien l’école A a-t-elle réduit ses achats d’électricité ?", "38 %", ["18 %", "64 %"]),
    s("street", "Quel jour la rue du Marché serait-elle piétonne ?", "le samedi", ["le dimanche", "tous les jours"]),
  ]),
  receptive("associer_information_question", [
    s("notebook", "Quelle information répond à la question « Pourquoi le carnet intéresse-t-il les chercheurs ? »", "Il contient d’anciennes mesures de pluie.", ["Il raconte la vie de Malik.", "Il contient une carte au trésor."]),
    s("bees", "Quelle information répond à « Comment les corridors nourrissent-ils les abeilles plus longtemps ? »", "Les plantes choisies fleurissent à des périodes différentes.", ["Les routes sont élargies.", "Les ruches sont déplacées chaque semaine."]),
    s("library", "Quelle information répond à « Pourquoi garder des livres papier ? »", "Ils restent accessibles sans appareil.", ["Ils permettent une recherche automatique.", "Ils prennent moins de place."]),
  ]),
  receptive("ordonner_evenements_explicites", [
    s("garden", "Quel ordre respecte le texte ?", "dessiner le plan → apporter les graines → planter", ["planter → dessiner → apporter", "apporter → planter → dessiner"]),
    s("notebook", "Quel ordre respecte le récit ?", "découvrir le carnet → le remettre aux archives → le numériser", ["numériser → découvrir → remettre", "remettre → découvrir → numériser"]),
    s("mangrove", "Quel ordre respecte l’évolution décrite ?", "couper les mangroves → constater davantage d’érosion → replanter", ["replanter → couper → constater", "constater → replanter → couper"]),
  ]),
  receptive("resoudre_pronom_sujet", [
    s("garden", "Dans « Elle proposa un jardin », qui est « elle » ?", "Aline", ["la classe", "la cour"]),
    s("notebook", "Dans « Il remit donc le carnet », qui est « il » ?", "Malik", ["Samuel Kabera", "le carnet"]),
    s("bees", "Dans « Ils évitent aussi les pesticides », qui est « ils » ?", "les jardiniers", ["les pesticides", "les corridors"]),
  ]),
  receptive("resoudre_pronom_objet", [
    s("notebook", "Dans « ils le numérisèrent », que reprend « le » ?", "le carnet", ["Malik", "le nom"]),
    s("bees", "Dans « Ils évitent aussi les pesticides », qui est « ils » ?", "les jardiniers", ["les pesticides", "les corridors"]),
    s("library", "Dans « les conserver », que peut reprendre « les » dans le raisonnement ?", "les deux formats", ["les appareils", "les pannes"]),
  ]),
  receptive("resoudre_demonstratif", [
    s("notebook", "Que reprend « Cette décision » ?", "remettre le carnet aux archives", ["garder le carnet", "mesurer la pluie"]),
    s("school", "Que reprend « Cette objection » ?", "la crainte que le sport finisse trop tard", ["la baisse des retards", "le changement biologique des adolescents"]),
    s("street", "Que reprend « Cette difficulté » ?", "charger des achats lourds sans accès direct en voiture", ["mesurer la pollution", "installer des tables"]),
  ]),
  receptive("suivre_chaine_lexicale", [
    s("mangrove", "Quelle série appartient à la chaîne lexicale du littoral ?", "mer, vagues, villages côtiers", ["route, étude, école", "poissons, facture, appareil"]),
    s("solar", "Quelle série construit la chaîne lexicale de l’énergie ?", "panneaux, électricité, production", ["toit, élèves, semaines", "directrice, rapport, école"]),
    s("garden", "Quelle série maintient le thème du jardin ?", "graines, terre, pousses", ["cour, famille, sciences", "lundi, Paul, fierté"]),
  ]),
  receptive("deduire_mot_definition_locale", [
    s("mangrove", "Que signifie « nurserie » d’après la définition locale ?", "un abri où grandissent de jeunes poissons", ["une route côtière", "une forêt très ancienne"]),
    s("solar", "Que signifie « intermittente » d’après le texte ?", "qui n’est pas disponible de façon constante", ["qui ne coûte rien", "qui fonctionne uniquement la nuit"]),
    s("notebook", "Que sont les « archives » d’après la définition locale ?", "le service qui conserve les documents anciens", ["une équipe qui mesure la pluie", "une étagère réservée aux romans"]),
  ]),
  receptive("deduire_mot_exemple_contraste", [
    s("solar", "Le contraste avec les semaines nuageuses aide à comprendre que « production » désigne ici…", "l’électricité produite par les panneaux", ["les devoirs des élèves", "la construction du toit"]),
    s("library", "Le contraste entre papier et numérique montre que « hybride » signifie…", "qui combine les deux formats", ["qui supprime les livres", "qui utilise un seul appareil"]),
    s("street", "Le contraste avec l’abandon du projet montre que « organiser » signifie ici…", "prévoir des solutions pratiques", ["interdire tout commerce", "mesurer seulement la pollution"]),
  ]),
  receptive("deduire_mot_morphologie", [
    s("mangrove", "Le préfixe re- aide à comprendre que « reforestation » signifie…", "planter de nouveau une forêt", ["couper toute la forêt", "mesurer la mer"]),
    s("solar", "Le suffixe -ment dans « ensoleillement » renvoie ici…", "au fait de recevoir du soleil", ["à une panne électrique", "à un toit trop lourd"]),
    s("notebook", "Le suffixe -iser aide à comprendre que « numériser » signifie…", "transformer le carnet en document numérique", ["mesurer la pluie à nouveau", "effacer le nom du carnet"]),
  ]),
  receptive("choisir_sens_polysemique", [
    s("solar", "Dans « le réseau électrique », quel sens a « réseau » ?", "système de distribution de l’électricité", ["filet pour attraper des poissons", "groupe d’amis en ligne seulement"]),
    s("street", "Dans « zone de retrait », quel sens a « retrait » ?", "endroit où récupérer des achats", ["départ définitif d’une personne", "diminution d’une mesure"]),
    s("library", "Dans « fonctions d’agrandissement », quel sens a « fonction » ?", "capacité offerte par un outil", ["métier exercé", "cérémonie officielle"]),
  ]),
  receptive("identifier_idee_phrase", [
    s("mangrove", "Quelle idée résume la phrase sur les racines des mangroves ?", "Elles abritent les jeunes poissons.", ["Elles empêchent toute vague.", "Elles construisent les routes."]),
    s("solar", "Quelle idée exprime la phrase sur les semaines nuageuses ?", "La production solaire varie avec la météo.", ["Les écoles ferment quand il pleut.", "Les panneaux produisent davantage la nuit."]),
    s("library", "Quelle idée exprime la phrase sur les pannes ?", "Le tout numérique peut limiter l’accès.", ["Le papier tombe souvent en panne.", "Tous les élèves possèdent un appareil."]),
  ]),
  receptive("identifier_idee_paragraphe", [
    s("mangrove", "Quelle est l’idée principale du deuxième paragraphe ?", "La destruction des mangroves cause des dégâts, et des habitants les restaurent.", ["Les poissons vivent tous en haute mer.", "Les routes protègent les racines."]),
    s("bees", "Quelle est l’idée principale du deuxième paragraphe ?", "La ville relie des espaces fleuris et adapte leur entretien.", ["Les abeilles disparaissent uniquement en hiver.", "Les pesticides sont utilisés davantage."]),
    s("school", "Quelle est l’idée principale du deuxième paragraphe ?", "L’objection sportive peut être traitée pendant une période d’essai.", ["Le sport doit être supprimé.", "Les cours commencent déjà à neuf heures."]),
  ]),
  receptive("identifier_idee_globale", [
    s("mangrove", "Quelle est l’idée principale du texte ?", "Restaurer les mangroves protège la vie marine et les côtes, mais demande du temps.", ["Il faut construire plus de routes côtières.", "Les jeunes poissons détruisent les forêts."]),
    s("solar", "Quelle est l’idée principale du texte ?", "Les panneaux peuvent réduire les achats d’électricité, sous certaines conditions.", ["Toutes les écoles doivent immédiatement quitter le réseau.", "Les panneaux fonctionnent mieux sans soleil."]),
    s("library", "Quelle est l’idée principale du texte ?", "Une bibliothèque hybride répond mieux à des besoins variés.", ["Il faut supprimer tous les livres papier.", "Les ressources numériques sont toujours inutilisables."]),
  ]),
  receptive("reconnaitre_structure_chronologique", [
    s("garden", "Quel indice montre une organisation chronologique ?", "le lundi, le mardi, le mercredi", ["parce que", "toutefois"]),
    s("notebook", "Quelle série de repères organise le récit ?", "découverte, semaine suivante, utilisation scientifique", ["cause, opposition, définition", "thèse, raison, contre-argument"]),
    s("mangrove", "Quel enchaînement chronologique organise le dernier bilan ?", "coupe ancienne, restauration, résultats après cinq ans", ["résultats, coupe, définition", "comparaison de trois écoles"]),
  ]),
  receptive("reconnaitre_structure_cause_consequence", [
    s("mangrove", "Quelle relation structure le deuxième paragraphe ?", "coupe des mangroves → érosion et disparition d’espèces", ["comparaison de deux écoles", "suite de portraits"]),
    s("solar", "Quelle relation relie les nuages et la production ?", "les nuages causent une baisse de production", ["la production cause les nuages", "les deux faits sont sans lien"]),
    s("bees", "Quelle relation relie la rupture de floraison et les colonies ?", "le manque de nourriture fragilise les colonies", ["les colonies arrêtent le printemps", "les fleurs sont causées par les pesticides"]),
  ]),
  receptive("reconnaitre_structure_comparaison", [
    s("solar", "Quels éléments le premier paragraphe compare-t-il ?", "l’école A équipée et les écoles B et C non équipées", ["trois espèces d’abeilles", "deux récits de tempête"]),
    s("library", "Quels formats le texte compare-t-il ?", "papier et numérique", ["matin et soir", "ville et campagne"]),
    s("school", "Quelle comparaison soutient l’argument ?", "la situation avant et après le changement d’horaire", ["deux types de livres", "deux espèces de plantes"]),
  ]),
  receptive("reconnaitre_structure_probleme_solution", [
    s("bees", "Quel couple problème-solution correspond au texte ?", "manque de fleurs en été → corridors fleuris", ["trop de pluie → panneaux solaires", "manque de livres → rue piétonne"]),
    s("mangrove", "Quel problème reçoit une solution dans le texte ?", "érosion après la coupe → replantation et protection", ["trop de poissons → nouvelles routes", "pluie ancienne → numérisation"]),
    s("street", "Quelle solution répond au problème des achats lourds ?", "une zone de retrait proche", ["fermer tous les commerces", "supprimer les mesures de pollution"]),
  ]),
  receptive("identifier_role_paragraphe", [
    s("mangrove", "Quel rôle joue le dernier paragraphe ?", "présenter les résultats et une limite de la restauration", ["définir uniquement le mot mangrove", "raconter l’enfance d’un chercheur"]),
    s("solar", "Quel rôle joue le deuxième paragraphe ?", "nuancer les avantages et formuler une recommandation", ["donner la liste des élèves", "raconter une panne précise"]),
    s("school", "Quel rôle joue le deuxième paragraphe ?", "répondre à un contre-argument et proposer un essai", ["présenter la thèse pour la première fois seulement", "définir le sommeil"]),
  ]),
  receptive("inferer_cause_locale", [
    s("garden", "Pourquoi Aline reste-t-elle après les cours ?", "Paul a oublié l’arrosoir et il faut chercher de l’eau.", ["Elle veut éviter de planter.", "La cour est déjà couverte de fleurs."]),
    s("lighthouse", "Pourquoi Inès monte-t-elle dans le phare ?", "La lampe est éteinte alors qu’un bateau approche.", ["Elle veut observer le lever du soleil.", "Elle cherche un carnet ancien."]),
    s("bees", "Pourquoi choisir des plantes qui fleurissent à des moments différents ?", "Pour offrir de la nourriture sur une plus longue période.", ["Pour empêcher toute pluie.", "Pour attirer davantage de voitures."]),
  ]),
  receptive("inferer_consequence_locale", [
    s("notebook", "Quelle conséquence probable a la numérisation du carnet ?", "Les données deviennent plus faciles à consulter sans abîmer l’original.", ["Les mesures de pluie disparaissent.", "Malik peut cacher le carnet."]),
    s("solar", "Que se passera-t-il probablement pendant une longue période nuageuse ?", "L’école achètera davantage d’électricité au réseau.", ["Les panneaux produiront davantage.", "Le toit deviendra une mangrove."]),
    s("street", "Quelle conséquence la zone de retrait devrait-elle avoir ?", "Les achats lourds resteront récupérables près de la rue.", ["La pollution augmentera forcément de 22 %.", "Tous les cafés fermeront."]),
  ]),
  receptive("inferer_chronologie_implicite", [
    s("lighthouse", "Qu’a fait Inès juste avant que la lumière reparaisse ?", "Elle a raccordé la batterie.", ["Elle s’est assise contre le mur.", "Elle a vu le bateau changer de direction."]),
    s("notebook", "Quel événement a nécessairement eu lieu avant l’étude scientifique ?", "Le carnet a été remis aux archives et numérisé.", ["Malik a gardé le carnet chez lui.", "Les chercheurs ont supprimé les données."]),
    s("mangrove", "Qu’est-ce qui a nécessairement précédé les résultats observés après cinq ans ?", "Les habitants ont replanté et protégé les jeunes parcelles.", ["Les véhicules ont traversé davantage les parcelles.", "La forêt ancienne s’est reformée instantanément."]),
  ]),
  receptive("inferer_motivation_personnage", [
    s("garden", "Pourquoi Aline propose-t-elle le jardin ?", "Pour permettre à la classe d’observer les insectes.", ["Pour supprimer le cours de sciences.", "Pour empêcher les familles de venir."]),
    s("notebook", "Pourquoi Malik remet-il finalement le carnet aux archives ?", "Il comprend que les données peuvent être utiles à d’autres.", ["Il pense que le carnet est vide.", "Il veut détruire les mesures."]),
    s("lighthouse", "Qu’est-ce qui pousse surtout Inès à agir malgré sa peur ?", "Le bateau approche alors que la lampe est éteinte.", ["Elle veut entendre les marches grincer.", "Elle souhaite arrêter la pluie."]),
  ]),
  receptive("inferer_hypothese_informationnelle", [
    s("mangrove", "Quelle conclusion prudente les résultats permettent-ils ?", "La restauration améliore certains indicateurs sans recréer immédiatement une forêt ancienne.", ["Cinq ans suffisent toujours pour tout restaurer.", "Les mangroves n’influencent pas l’érosion."]),
    s("solar", "Quelle conclusion est la mieux soutenue ?", "Le solaire peut réduire les achats, mais son intérêt dépend du site.", ["Tous les toits conviennent forcément.", "Les nuages augmentent la production."]),
    s("bees", "Quelle conclusion respecte la réserve des scientifiques ?", "Les corridors semblent aider, mais le climat peut aussi influencer les abeilles.", ["Les fleurs expliquent absolument toute variation.", "Les corridors ont réduit toutes les espèces."]),
  ]),
  receptive("selectionner_elements_resume", [
    s("mangrove", "Quels éléments sont essentiels dans un résumé ?", "rôle des mangroves, dégâts de leur coupe, restauration et résultats", ["nom de chaque village et couleur des poissons", "uniquement la définition de nurserie"]),
    s("solar", "Quels éléments sont essentiels dans un résumé ?", "baisse des achats, intermittence, coût initial et recommandation", ["uniquement l’opinion de la directrice", "la liste imaginaire de tous les élèves"]),
    s("school", "Quels éléments sont essentiels dans un résumé ?", "thèse, données sur retards et concentration, objection sportive et essai proposé", ["seulement l’heure actuelle", "uniquement les transports"]),
  ]),
  production("reformuler_sans_copier", [
    s("mangrove", "Reformule sans copier : « Leurs racines forment un abri où grandissent de nombreux jeunes poissons. »", "Les jeunes poissons se développent à l’abri des racines des mangroves."),
    s("solar", "Reformule sans copier : « En un an, l’école A a acheté 38 % d’électricité en moins. »", "Après une année, les achats d’électricité de l’école A avaient diminué de 38 %."),
    s("library", "Reformule sans copier : « Une collection hybride répond donc mieux à la diversité des usages. »", "Combiner papier et numérique convient davantage aux différents besoins."),
  ]),
  production("organiser_resume_informatif", [
    s("mangrove", "Rédige une phrase de résumé qui présente d’abord le problème puis la solution.", "La coupe des mangroves a aggravé l’érosion, alors des habitants replantent et protègent ces forêts côtières."),
    s("solar", "Rédige une phrase de résumé reliant le résultat principal à sa limite.", "Les panneaux ont réduit les achats d’électricité de l’école A, mais leur production varie avec la météo et leur installation coûte cher."),
    s("bees", "Rédige une phrase de résumé organisée en problème, action et résultat.", "Le manque estival de fleurs fragilisait les abeilles ; la ville a créé des corridors fleuris, le long desquels davantage d’espèces ont ensuite été observées."),
  ]),
  production("organiser_resume_narratif", [
    s("garden", "Résume le récit en une phrase respectant situation, action et résultat.", "Pour aider sa classe à observer les insectes, Aline organise un jardin scolaire qui se couvre de pousses deux semaines plus tard."),
    s("notebook", "Résume le récit en une phrase respectant découverte, décision et conséquence.", "Malik découvre un ancien carnet de pluie, le confie aux archives puis le numérise, ce qui permet aux chercheurs d’utiliser ses données."),
    s("lighthouse", "Résume le récit en une phrase respectant danger, action et dénouement.", "Alors qu’un bateau approche pendant la tempête, Inès rallume courageusement le phare et le navire change de direction."),
  ]),
  receptive("identifier_point_de_vue", [
    s("garden", "Quel point de vue domine dans ce récit ?", "externe avec accès limité aux actions d’Aline", ["narrateur à la première personne", "discours scientifique sans personnage"]),
    s("school", "Quel point de vue porte l’affirmation finale « À mes yeux » ?", "celui de l’auteur favorable à un essai", ["celui d’un entraîneur opposé à tout changement", "celui des 600 élèves pris individuellement"]),
    s("lighthouse", "Quel indice rapproche le récit du point de vue interne d’Inès ?", "le texte décrit son cœur qui bat et ses mains qui tremblent", ["le texte donne les pensées de tous les marins", "le texte ne décrit que la météo"]),
  ]),
  production("comparer_points_de_vue", [
    s("garden", "Compare en une phrase le point de vue d’Aline, fière du jardin, à celui d’un élève qui le jugerait inutile.", "Aline voit le jardin comme une réussite utile aux sciences, tandis que l’autre élève le considérerait comme un effort sans intérêt."),
    s("street", "Compare le point de vue de l’auteur à celui des commerçants opposés au projet.", "L’auteur soutient la rue piétonne si elle est organisée, tandis que certains commerçants craignent surtout les difficultés de chargement."),
    s("library", "Compare le point de vue de l’auteur à celui des responsables favorables au tout numérique.", "L’auteur défend une collection hybride, alors que certains responsables privilégient le numérique pour gagner de la place."),
  ]),
  receptive("interpreter_tonalite_litteraire", [
    s("lighthouse", "Quelle tonalité domine avant que la lampe se rallume ?", "tendue et inquiétante", ["comique", "indifférente"]),
    s("garden", "Quelle tonalité domine dans la dernière phrase ?", "fière et optimiste", ["tragique", "menaçante"]),
    s("notebook", "Quelle tonalité accompagne la conclusion de Malik ?", "réfléchie et positive", ["furieuse", "moqueuse"]),
  ]),
  receptive("identifier_position_auteur", [
    s("school", "Quelle position défend l’auteur ?", "tester un début des cours à 8 h 45", ["supprimer les cours du matin", "interdire toutes les activités sportives"]),
    s("street", "Quelle position défend l’auteur ?", "rendre la rue piétonne le samedi avec une organisation adaptée", ["fermer définitivement tous les commerces", "abandonner tout essai piéton"]),
    s("library", "Quelle position défend l’auteur ?", "conserver à la fois papier et numérique", ["passer immédiatement au tout numérique", "supprimer toutes les ressources numériques"]),
  ]),
  receptive("distinguer_fait_opinion", [
    s("solar", "Quelle affirmation est un fait mesuré dans le texte ?", "L’école A a acheté 38 % d’électricité en moins.", ["Les panneaux sont la plus belle invention possible.", "Toutes les écoles devraient aimer les panneaux."]),
    s("street", "Quelle affirmation est une opinion ?", "La rue devrait devenir piétonne le samedi.", ["Le dioxyde d’azote a baissé de 22 % pendant les essais.", "Trois journées d’essai ont eu lieu."]),
    s("library", "Quelle affirmation repose sur une enquête chiffrée ?", "64 % des élèves souhaitent conserver les deux formats.", ["Le papier est toujours plus agréable.", "Le numérique est forcément supérieur."]),
  ]),
  receptive("identifier_these_argument", [
    s("school", "Quelle est la thèse du texte ?", "Les collèges devraient commencer à 8 h 45.", ["Les adolescents ne doivent plus dormir.", "Les activités sportives doivent disparaître."]),
    s("street", "Quelle est la thèse du texte ?", "La rue du Marché devrait être piétonne le samedi.", ["Les commerces doivent tous fermer.", "La pollution n’existe pas dans la rue."]),
    s("library", "Quelle est la thèse du texte ?", "La bibliothèque devrait rester hybride.", ["Tous les livres papier doivent disparaître.", "Aucun appareil ne doit entrer à l’école."]),
  ]),
  receptive("identifier_raison_argument", [
    s("school", "Quelle raison soutient le changement d’horaire ?", "Un départ trop matinal réduit souvent le sommeil des adolescents.", ["Les adolescents n’ont jamais d’activités.", "Les transports ne circulent qu’à midi."]),
    s("street", "Quelle raison soutient la rue piétonne ?", "Les essais ont réduit la pollution et attiré davantage de passants.", ["Tous les clients possèdent une voiture.", "Les cafés refusent les tables extérieures."]),
    s("library", "Quelle raison soutient une collection hybride ?", "Les deux formats répondent à des besoins différents.", ["Le papier effectue des recherches automatiques.", "Le numérique fonctionne sans appareil."]),
  ]),
  receptive("evaluer_pertinence_preuve", [
    s("school", "Quelle preuve est la plus pertinente pour évaluer l’effet d’un horaire plus tardif ?", "la baisse des retards et l’évolution de la concentration après le changement", ["la couleur des salles de classe", "le menu de la cantine"]),
    s("street", "Quelle donnée soutient directement l’argument environnemental ?", "la baisse de 22 % du dioxyde d’azote", ["le nombre de tables des cafés", "la couleur des panneaux routiers"]),
    s("library", "Quelle preuve soutient le besoin de deux formats ?", "64 % des élèves demandent leur maintien conjoint", ["la date de construction de l’école", "la taille du bureau du responsable"]),
  ]),
  receptive("reconnaitre_contre_argument", [
    s("school", "Quel contre-argument est présenté ?", "Les activités sportives pourraient finir trop tard.", ["Les élèves dorment trop longtemps à midi.", "Les études n’utilisent aucun élève."]),
    s("street", "Quel contre-argument est présenté ?", "Les clients auront du mal à charger des achats lourds.", ["La pollution a baissé pendant les essais.", "Les familles ont davantage d’espace."]),
    s("library", "Quel contre-argument au modèle hybride est mentionné ?", "Le tout numérique permettrait de gagner de la place.", ["Les livres papier fonctionnent sans appareil.", "Les fonctions d’agrandissement sont utiles."]),
  ]),
  receptive("localiser_span_preuve", [
    s("school", "Quel passage sert de preuve chiffrée ?", "« les retards ont diminué de 18 % »", ["« les adolescents ont tendance à s’endormir plus tard »", "« un essai d’un trimestre »"]),
    s("street", "Quel passage sert de preuve sur la qualité de l’air ?", "« la concentration de dioxyde d’azote a baissé de 22 % »", ["« les familles disposaient de plus d’espace »", "« une zone de retrait »"]),
    s("solar", "Quel passage sert de preuve sur l’effet des panneaux ?", "« l’école A a acheté 38 % d’électricité en moins »", ["« la directrice »", "« les semaines très nuageuses »"]),
  ]),
  production("relier_preuve_interpretation", [
    s("school", "Relie la preuve « les retards ont diminué de 18 % » à l’interprétation qu’elle soutient.", "Cette baisse suggère qu’un horaire plus tardif aide davantage d’élèves à arriver à l’heure."),
    s("street", "Relie la preuve « le dioxyde d’azote a baissé de 22 % » à l’interprétation qu’elle soutient.", "Cette mesure indique que limiter les voitures peut améliorer la qualité de l’air dans la rue."),
    s("solar", "Relie la preuve « l’école A a acheté 38 % d’électricité en moins » à l’interprétation qu’elle soutient.", "Cette baisse indique que les panneaux peuvent réduire la quantité d’électricité achetée au réseau."),
  ]),
  receptive("distinguer_preuve_connaissance_externe", [
    s("school", "Quelle affirmation vient directement du texte plutôt que d’une connaissance externe ?", "Les retards ont diminué de 18 % dans l’étude citée.", ["Tous les adolescents du monde dorment exactement neuf heures.", "Les écoles d’un autre pays commencent à dix heures."]),
    s("street", "Quelle information est une preuve fournie par le texte ?", "Le dioxyde d’azote a baissé pendant les journées d’essai.", ["Toutes les rues piétonnes du monde réussissent.", "Les voitures électriques n’émettent jamais rien."]),
    s("solar", "Quelle affirmation est explicitement étayée par le texte ?", "L’école équipée a acheté 38 % d’électricité en moins en un an.", ["Tous les toits conviennent aux panneaux.", "Les panneaux fonctionnent sans soleil."]),
  ]),
] as const;

export const LOCAL_READING_ITEM_PREFIX = "local-reading-v1";

export async function buildLocalReadingDraftItems(
  taxonomy: TaxonomyCandidate,
): Promise<CanonicalDiagnosticBankItem[]> {
  const nodeByKey = new Map(taxonomy.nodes.map((node) => [node.key, node]));
  const knownNodeKeys = new Set(nodeByKey.keys());
  const items: CanonicalDiagnosticBankItem[] = [];
  for (const plan of PLANS) {
    const node = nodeByKey.get(plan.nodeKey);
    if (!node || node.strand !== "comprehension_ecrite") throw new Error(`Reading node is absent: ${plan.nodeKey}`);
    const evidence = node.evidence.find((candidate) => candidate.expectation === plan.expectation);
    if (!evidence) throw new Error(`Reading evidence is absent: ${plan.nodeKey}:${plan.expectation}`);
    for (let index = 0; index < plan.seeds.length; index += 1) {
      const seed = plan.seeds[index];
      const tier = DIAGNOSTIC_DIFFICULTY_TIERS[index];
      const promptFr = `Lis le texte.\n\n${PASSAGES[seed.passage]}\n\n${seed.question}`;
      const raw: GeneratedItem = plan.expectation === "receptive"
        ? {
            nodeKey: node.key, strand: node.strand, modality: "reading", learnerMode: "shared",
            responseType: "mcq", promptFr, acceptableAnswers: [], validatorType: "exact",
            validatorConfig: { sourceTextKey: seed.passage, sourceTextType: PASSAGE_TYPES[seed.passage] },
            choices: [{ text: seed.answer, correct: true }, ...(seed.distractors ?? []).map((text) => ({ text, correct: false }))],
            difficulty: diagnosticDifficultyForTier(tier),
          }
        : {
            nodeKey: node.key, strand: node.strand, modality: "writing", learnerMode: "shared",
            responseType: index === 0 ? "short_answer" : index === 1 ? "cloze" : "transform",
            promptFr, instructionsFr: "Réponds en une phrase complète en t’appuyant uniquement sur le texte.",
            correctAnswer: seed.answer, acceptableAnswers: [], validatorType: "exact",
            validatorConfig: { sourceTextKey: seed.passage, sourceTextType: PASSAGE_TYPES[seed.passage] },
            difficulty: diagnosticDifficultyForTier(tier),
          };
      const gated = await runGates(raw, { knownNodeKeys, knownMisconceptionKeys: new Set() });
      if (!gated.item || gated.gates.verdict === "rejected"
        || !gated.gates.gate1_invariants.ok || !gated.gates.gate2_answer_key.ok) {
        throw new Error(`Reading item failed hard QC: ${plan.nodeKey}:${plan.expectation}:${tier}`);
      }
      items.push({
        itemKey: [LOCAL_READING_ITEM_PREFIX, plan.nodeKey, plan.expectation, tier].join(":"),
        item: gated.item, evidenceKey: evidence.key, evidenceExpectation: plan.expectation,
        sectionKey: "reading_comprehension", promptFamily: diagnosticPromptFamilies("reading_comprehension", plan.expectation)[index],
        difficultyTier: tier, qcGates: gated.gates, reviewStatus: "needs_human_review",
      });
    }
  }
  return items;
}

function s(
  passage: PassageKey,
  question: string,
  answer: string,
  distractors?: readonly [string, string],
): Seed {
  return { passage, question, answer, distractors };
}

function receptive(
  nodeKey: string,
  seeds: readonly [Seed, Seed, Seed],
): Plan {
  return { nodeKey, expectation: "receptive", seeds };
}

function production(
  nodeKey: string,
  seeds: readonly [Seed, Seed, Seed],
): Plan {
  return { nodeKey, expectation: "controlled_production", seeds };
}
