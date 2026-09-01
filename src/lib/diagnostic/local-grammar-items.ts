import { runGates } from "@/lib/ai/item-generation/pipeline";
import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import {
  DIAGNOSTIC_DIFFICULTY_TIERS,
  diagnosticDifficultyForTier,
  diagnosticPromptFamilies,
} from "./item-authoring";
import type { CanonicalDiagnosticBankItem } from "./item-bank";

type GrammarExample = {
  receptivePrompt: string;
  receptiveAnswer: string;
  receptiveDistractors: readonly [string, string];
  productionPrompt: string;
  productionAnswer: string;
  acceptableAnswers?: readonly string[];
};

const EXAMPLES: Readonly<Record<string, readonly [GrammarExample, GrammarExample, GrammarExample]>> = {
  construction_phrase_canonique: [
    grammar("Quelle phrase suit l’ordre sujet-verbe-complément ?", "Lina prépare le repas.", ["Prépare Lina le repas.", "Le repas Lina prépare."], "Remets dans l’ordre canonique : « le repas / prépare / Lina ».", "Lina prépare le repas."),
    grammar("Quelle phrase présente clairement un sujet suivi de son verbe ?", "Les élèves lisent le texte.", ["Lisent le texte les élèves.", "Le texte les élèves lisent."], "Remets dans l’ordre canonique : « observent / les oiseaux / les enfants ».", "Les enfants observent les oiseaux."),
    grammar("Quelle phrase a une construction canonique ?", "Mon frère range sa chambre.", ["Sa chambre range mon frère.", "Range mon frère sa chambre."], "Réécris dans l’ordre sujet-verbe-complément : « une solution / propose / la chercheuse ».", "La chercheuse propose une solution."),
  ],
  construction_coordination: [
    grammar("Quelle phrase contient deux propositions coordonnées ?", "Maya écrit et Paul relit.", ["Maya écrit pour relire.", "Maya écrit que Paul relit."], "Réunis avec « et » : « Maya écrit. Paul relit. »", "Maya écrit et Paul relit."),
    grammar("Dans quelle phrase « mais » coordonne-t-il deux idées ?", "Il est fatigué, mais il continue.", ["Il continue malgré la fatigue.", "Il continue parce qu’il est motivé."], "Réunis avec « mais » : « Le trajet est long. Il reste agréable. »", "Le trajet est long, mais il reste agréable."),
    grammar("Quelle phrase utilise une coordination avec « ou » ?", "Tu viens avec nous ou tu restes ici.", ["Si tu viens, préviens-nous.", "Tu restes ici pour travailler."], "Réunis avec « ou » : « Nous partons maintenant. Nous attendons demain. »", "Nous partons maintenant ou nous attendons demain."),
  ],
  construction_subordonnee_relative: [
    grammar("Quelle phrase contient une subordonnée relative ?", "Le livre que tu lis appartient à Mina.", ["Tu lis ce livre parce qu’il est court.", "Tu lis que le livre est court."], "Réunis avec « qui » : « Le voisin sourit. Le voisin arrose les fleurs. »", "Le voisin qui arrose les fleurs sourit."),
    grammar("Dans quelle phrase « dont » introduit-il une relative ?", "Voici l’article dont je t’ai parlé.", ["Je parle de cet article parce qu’il est utile.", "Je dis que cet article est utile."], "Réunis avec « que » : « Nous visitons une maison. Mon grand-père a construit cette maison. »", "Nous visitons la maison que mon grand-père a construite."),
    grammar("Quelle phrase contient une relative introduite par « où » ?", "La ville où je suis né se trouve au nord.", ["Je suis né quand mes parents vivaient au nord.", "Je sais que cette ville se trouve au nord."], "Réunis avec « où » : « Cette salle est calme. Nous travaillons dans cette salle. »", "La salle où nous travaillons est calme."),
  ],
  construction_subordonnee_completive: [
    grammar("Quelle phrase contient une subordonnée complétive introduite par « que » ?", "Je pense que le train arrivera tôt.", ["Le train qui arrive est rapide.", "Quand le train arrive, nous partons."], "Complète avec une proposition en « que » : « Nous savons … » Utilise « le musée ferme à dix-huit heures ».", "Nous savons que le musée ferme à dix-huit heures."),
    grammar("Dans quelle phrase la proposition en « que » complète-t-elle le verbe principal ?", "Elle affirme que le résultat est exact.", ["Le résultat qu’elle annonce est exact.", "Elle parle du résultat exact."], "Réunis : « Il explique. La route est fermée. » Utilise « que ».", "Il explique que la route est fermée."),
    grammar("Quelle phrase contient une complétive ?", "Les chercheurs constatent que la température augmente.", ["Les chercheurs qui mesurent la température arrivent.", "La température augmente pendant l’été."], "Transforme en une phrase avec complétive : « Nous remarquons ceci : les feuilles jaunissent. »", "Nous remarquons que les feuilles jaunissent."),
  ],
  construction_subordonnee_circonstancielle: [
    grammar("Quelle phrase contient une subordonnée circonstancielle de temps ?", "Quand la cloche sonne, les élèves sortent.", ["La cloche que tu entends sonne.", "Les élèves entendent la cloche."], "Réunis avec « quand » : « La pluie cesse. Nous sortons. »", "Quand la pluie cesse, nous sortons."),
    grammar("Quelle phrase contient une subordonnée circonstancielle de cause ?", "Nous restons dedans parce qu’il pleut.", ["La pluie qui tombe est forte.", "Nous observons la pluie."], "Réunis avec « parce que » : « Le match est reporté. Le terrain est inondé. »", "Le match est reporté parce que le terrain est inondé."),
    grammar("Quelle phrase contient une subordonnée circonstancielle de condition ?", "Si tu révises, tu progresseras.", ["Tu révises ce chapitre difficile.", "Le chapitre que tu révises est difficile."], "Réunis avec « si » : « Vous suivez le plan. Vous trouverez la sortie. »", "Si vous suivez le plan, vous trouverez la sortie."),
  ],
  construction_voix_passive: [
    grammar("Quelle phrase est à la voix passive ?", "Le pont est réparé par les ouvriers.", ["Les ouvriers réparent le pont.", "Le pont nécessite une réparation."], "Mets au passif : « Les élèves présentent le projet. »", "Le projet est présenté par les élèves."),
    grammar("Quelle phrase présente le résultat d’une action au passif ?", "Les résultats seront annoncés par le jury.", ["Le jury annoncera les résultats.", "L’annonce du jury arrive demain."], "Mets au passif : « Le vent a renversé l’arbre. »", "L’arbre a été renversé par le vent."),
    grammar("Quelle phrase est construite au passif ?", "Cette œuvre a été peinte par Sonia Delaunay.", ["Sonia Delaunay a peint cette œuvre.", "Cette œuvre de Sonia Delaunay est célèbre."], "Mets au passif : « Une équipe internationale conduit l’étude. »", "L’étude est conduite par une équipe internationale."),
  ],
  construction_nominalisation: [
    grammar("Quelle formulation nominalise l’action « décider » ?", "La décision du conseil", ["Le conseil décide", "Le conseil qui décide"], "Nominalise : « Le conseil décide de fermer la route. » Commence par « La décision ».", "La décision du conseil de fermer la route."),
    grammar("Quelle expression contient une nominalisation de « construire » ?", "La construction du pont", ["Ils construisent le pont", "Le pont qu’ils construisent"], "Transforme « On construit une école » en groupe nominal commençant par « La construction ».", "La construction d’une école."),
    grammar("Quelle expression nominalise le verbe « analyser » ?", "L’analyse des données", ["Analyser les données", "Les données analysées"], "Nominalise « Les scientifiques analysent les données » avec le nom « analyse ».", "L’analyse des données par les scientifiques."),
  ],
  construction_pronom_sujet: [
    grammar("Dans « Nora ferme la fenêtre. Elle a froid. », qui « elle » désigne-t-il ?", "Nora", ["la fenêtre", "le froid"], "Remplace « Nora » par un pronom sujet : « Nora ferme la fenêtre. »", "Elle ferme la fenêtre."),
    grammar("Dans « Les bateaux arrivent. Ils entrent au port. », que reprend « ils » ?", "Les bateaux", ["le port", "l’arrivée"], "Remplace « Les bateaux » par un pronom sujet : « Les bateaux entrent au port. »", "Ils entrent au port."),
    grammar("Dans « Le musée ouvre tôt. Il accueille une classe. », que reprend « il » ?", "Le musée", ["une classe", "l’heure"], "Évite la répétition avec un pronom sujet : « Le musée ouvre tôt. Le musée accueille une classe. »", "Le musée ouvre tôt. Il accueille une classe."),
  ],
  construction_reprise_demonstrative: [
    grammar("Dans « La ville interdit les voitures au centre. Cette décision réduit le bruit. », que reprend « cette décision » ?", "l’interdiction des voitures au centre", ["la ville", "le bruit"], "Évite la répétition avec « cette décision » : « Le conseil ferme la rue. La fermeture de la rue surprend les habitants. »", "Le conseil ferme la rue. Cette décision surprend les habitants."),
    grammar("Dans « Le laboratoire publie ses résultats. Cela confirme l’hypothèse. », que reprend « cela » ?", "la publication des résultats", ["le laboratoire", "l’hypothèse seule"], "Réunis avec « cela » : « Le niveau de l’eau baisse. Cette baisse inquiète les habitants. »", "Le niveau de l’eau baisse. Cela inquiète les habitants."),
    grammar("Dans « Les élèves ont nettoyé la cour. Ce geste a été applaudi. », que reprend « ce geste » ?", "le nettoyage de la cour", ["les élèves", "les applaudissements"], "Évite la répétition avec « ce geste » : « Lina aide un camarade. L’aide de Lina est appréciée. »", "Lina aide un camarade. Ce geste est apprécié."),
  ],
  construction_chaine_reference: [
    grammar("Dans « Awa prend le dossier. Elle le remet au directeur. », quel enchaînement est correct ?", "elle = Awa ; le = le dossier", ["elle = le dossier ; le = Awa", "elle = le directeur ; le = Awa"], "Réécris sans répéter « Malik » et « le rapport » : « Malik lit le rapport. Malik corrige le rapport. »", "Malik lit le rapport. Il le corrige."),
    grammar("Dans « Le chien suit Léa. Celle-ci lui donne de l’eau. », qui est « celle-ci » ?", "Léa", ["le chien", "l’eau"], "Évite les répétitions : « Sara voit les enfants. Sara parle aux enfants. »", "Sara voit les enfants. Elle leur parle."),
    grammar("Dans « Les chercheurs observent les oiseaux. Ils les photographient. », que reprennent les pronoms ?", "ils = les chercheurs ; les = les oiseaux", ["ils = les oiseaux ; les = les chercheurs", "ils = les photographies ; les = les chercheurs"], "Réécris avec des pronoms : « Les guides accueillent les visiteurs. Les guides accompagnent les visiteurs. »", "Les guides accueillent les visiteurs. Ils les accompagnent."),
  ],
  construction_chaine_lexicale: [
    grammar("Quelle série forme une chaîne lexicale cohérente sur la mer ?", "vague, bateau, port", ["vague, cahier, montagne", "bateau, règle, forêt"], "Remplace la répétition dans « Le médecin examine le malade. Le médecin propose un traitement. » par un terme de la même chaîne lexicale.", "Le médecin examine le malade. Le praticien propose un traitement."),
    grammar("Quelle série appartient au champ lexical de l’école ?", "classe, élève, tableau", ["classe, rivière, moteur", "élève, nuage, cuisine"], "Complète la chaîne lexicale « forêt, arbre, feuille » avec un mot cohérent.", "branche"),
    grammar("Quelle phrase maintient une chaîne lexicale sur la météo ?", "Le vent se lève et de gros nuages annoncent l’orage.", ["Le vent se lève et la bibliothèque ferme.", "Les nuages arrivent et le moteur démarre."], "Remplace la répétition dans « Le bateau quitte le port. Le bateau affronte les vagues. » par un terme maritime proche.", "Le bateau quitte le port. L’embarcation affronte les vagues."),
  ],
  construction_negation_simple: [
    grammar("Quelle phrase contient une négation simple ?", "Lina ne vient pas ce soir.", ["Lina vient ce soir.", "Lina vient-elle ce soir ?"], "Mets à la forme négative : « Il comprend la consigne. »", "Il ne comprend pas la consigne."),
    grammar("Quelle phrase nie l’action de partir ?", "Nous ne partons pas demain.", ["Nous partons demain.", "Partons-nous demain ?"], "Mets à la forme négative : « Elles regardent le film. »", "Elles ne regardent pas le film."),
    grammar("Quelle phrase contient « ne…pas » correctement placé ?", "Tu n’oublies pas ton carnet.", ["Tu ne pas oublies ton carnet.", "Tu oublies ne ton carnet pas."], "Mets à la forme négative : « Vous avez terminé. »", "Vous n’avez pas terminé."),
  ],
  construction_negation_complexe: [
    grammar("Quelle phrase signifie que l’action ne se produit à aucun moment ?", "Il ne voyage jamais seul.", ["Il ne voyage pas toujours seul.", "Il voyage parfois seul."], "Remplace « ne…pas » par « ne…jamais » : « Elle ne téléphone pas. »", "Elle ne téléphone jamais."),
    grammar("Quelle phrase indique qu’une action a cessé ?", "Nous ne travaillons plus ici.", ["Nous ne travaillons jamais ici.", "Nous travaillons encore ici."], "Transforme avec « ne…plus » : « Il habite encore à Kigali. »", "Il n’habite plus à Kigali."),
    grammar("Quelle phrase nie toute quantité ?", "Je n’ai aucun doute.", ["J’ai quelques doutes.", "Je n’ai pas tous les doutes."], "Transforme avec « ne…rien » : « Elle voit quelque chose. »", "Elle ne voit rien."),
  ],
  construction_portee_negation: [
    grammar("Que nie la phrase « Tous les élèves ne sont pas arrivés » dans l’interprétation partielle ?", "certains élèves ne sont pas arrivés", ["aucun élève n’est arrivé", "tous les élèves sont arrivés"], "Reformule « Tous les livres ne sont pas disponibles » pour rendre la négation partielle explicite.", "Certains livres ne sont pas disponibles."),
    grammar("Dans « Léa ne mange pas seulement des fruits », que signifie la négation ?", "elle mange aussi autre chose", ["elle ne mange aucun fruit", "elle mange uniquement des fruits"], "Reformule « Il ne lit pas uniquement des romans » en rendant le sens explicite.", "Il lit aussi autre chose que des romans."),
    grammar("Que nie précisément « Ce n’est pas Paul qui a appelé » ?", "l’identité de la personne qui a appelé", ["le fait qu’un appel a eu lieu", "tous les appels de Paul"], "Reformule « Ce n’est pas mardi que nous partons » en indiquant clairement la portée.", "Nous partons un autre jour que mardi."),
  ],
  relation_cause: relation("cause", "parce que", [
    ["La route est fermée", "un arbre est tombé"], ["Le match est annulé", "le terrain est inondé"], ["Mina prend un parapluie", "il pleut"],
  ]),
  relation_consequence: relation("conséquence", "donc", [
    ["Le sol est gelé", "la route est glissante"], ["L’équipe s’est entraînée", "elle progresse"], ["La rivière déborde", "le parc ferme"],
  ]),
  relation_contraste: relation("contraste", "mais", [
    ["Le trajet est long", "il est agréable"], ["La pièce est petite", "elle est lumineuse"], ["Le problème paraît simple", "il demande du temps"],
  ]),
  relation_concession: relation("concession", "bien que", [
    ["il soit fatigué", "Noé termine son travail"], ["la pluie tombe", "la course continue"], ["le sujet soit complexe", "le texte reste clair"],
  ]),
  relation_chronologie: relation("chronologie", "puis", [
    ["Lina ouvre le dossier", "elle lit la première page"], ["Le soleil se lève", "la ville s’anime"], ["Nous préparons le matériel", "nous commençons l’expérience"],
  ]),
  relation_addition: relation("addition", "de plus", [
    ["Le musée est gratuit", "il ouvre tard le vendredi"], ["Cette méthode est rapide", "elle est précise"], ["Le sentier est balisé", "il offre une belle vue"],
  ]),
  relation_exemple_reformulation: relation("exemple ou reformulation", "par exemple", [
    ["Plusieurs fruits sont riches en vitamine C", "l’orange et le kiwi"], ["Certains transports sont doux", "le vélo et la marche"], ["Des gestes réduisent les déchets", "réutiliser un sac"],
  ]),
  relation_condition: relation("condition", "si", [
    ["tu suis la carte", "tu trouveras le refuge"], ["nous économisons l’eau", "les réserves dureront"], ["vous vérifiez les données", "le résultat sera fiable"],
  ]),
  relation_but: relation("but", "afin que", [
    ["Nous parlons doucement", "le bébé puisse dormir"], ["Elle annote le texte", "ses élèves repèrent les idées"], ["Ils protègent la rive", "la végétation se développe"],
  ]),
  construction_discours_direct: [
    grammar("Quelle phrase rapporte directement les paroles de Lina ?", "Lina dit : « Je viendrai demain. »", ["Lina dit qu’elle viendra demain.", "Selon Lina, une venue est prévue."], "Mets au discours direct : « Paul affirme qu’il a terminé. »", "Paul affirme : « J’ai terminé. »"),
    grammar("Quelle phrase utilise correctement les guillemets du discours direct ?", "« Nous sommes prêts », annoncent les élèves.", ["Les élèves annoncent qu’ils sont prêts.", "Nous sommes prêts annoncent les élèves."], "Mets au discours direct : « Sara demande si le bus arrive. »", "Sara demande : « Le bus arrive-t-il ? »"),
    grammar("Quelle phrase contient une réplique au discours direct ?", "Le guide répond : « Le musée ferme à dix-huit heures. »", ["Le guide répond que le musée ferme à dix-huit heures.", "La réponse du guide concerne le musée."], "Transforme au discours direct : « Le guide explique que la salle est fermée. »", "Le guide explique : « La salle est fermée. »"),
  ],
  construction_discours_indirect: [
    grammar("Quelle phrase rapporte indirectement les paroles « Je suis prêt » de Malik ?", "Malik dit qu’il est prêt.", ["Malik dit : « Je suis prêt. »", "Malik est prêt à parler."], "Mets au discours indirect : « Aïcha dit : “Je pars demain.” »", "Aïcha dit qu’elle part demain."),
    grammar("Quelle phrase est au discours indirect ?", "Le témoin explique qu’il n’a rien vu.", ["Le témoin explique : « Je n’ai rien vu. »", "Le témoin, sans rien voir, explique."], "Mets au discours indirect : « Les élèves annoncent : “Nous avons fini.” »", "Les élèves annoncent qu’ils ont fini."),
    grammar("Quelle phrase transforme correctement la question « Viendras-tu ? » au discours indirect ?", "Elle demande si tu viendras.", ["Elle demande : « Viendras-tu ? »", "Elle demande que tu viendras."], "Mets au discours indirect : « Le professeur demande : “Avez-vous compris ?” »", "Le professeur demande si nous avons compris."),
  ],
  construction_point_de_vue_narratif: [
    grammar("Quel extrait adopte un point de vue interne ?", "Je sentais mon cœur battre et j’ignorais ce qui m’attendait.", ["La caméra montre la rue entière sans entrer dans les pensées.", "Tous les personnages et leurs pensées sont décrits."], "Réécris du point de vue interne de Léa : « Léa entre dans la salle. La salle est sombre. »", "J’entre dans la salle. Elle me paraît sombre."),
    grammar("Quel extrait adopte un narrateur externe ?", "L’homme traverse la place, pose son sac et s’assoit.", ["Je crains qu’il ne me voie.", "Il pense à son enfance et sa voisine regrette son départ."], "Réécris avec un narrateur externe : « Je tremble en ouvrant la lettre. »", "Elle tremble en ouvrant la lettre."),
    grammar("Quel extrait adopte un point de vue omniscient ?", "Mina espère gagner, tandis que Paul, sans le lui dire, prévoit déjà son départ.", ["Je ne sais pas ce que Paul prépare.", "Paul ferme la porte et marche dans le couloir."], "Réécris en révélant les pensées des deux personnages : « Mina sourit. Paul regarde la sortie. »", "Mina espère rester, mais Paul pense déjà à partir."),
  ],
  construction_progression_thematique: [
    grammar("Quel enchaînement conserve le même thème ?", "Le baobab pousse lentement. Cet arbre peut vivre très longtemps.", ["Le baobab pousse lentement. Les océans couvrent la Terre.", "Le baobab pousse lentement. Demain sera mardi."], "Ajoute une phrase qui reprend le thème « le volcan » : « Le volcan domine la vallée. »", "Le volcan domine la vallée. Cette montagne libère parfois de la fumée."),
    grammar("Quel enchaînement fait progresser l’information du connu vers le nouveau ?", "Une nouvelle bibliothèque ouvre. Ce bâtiment accueillera aussi des ateliers.", ["Une bibliothèque ouvre. Les dauphins vivent en groupe.", "Une bibliothèque ouvre. Hier était lundi."], "Poursuis en reprenant « une nouvelle piste cyclable » par un groupe démonstratif.", "Une nouvelle piste cyclable traverse le quartier. Cet aménagement sécurise les déplacements."),
    grammar("Quel paragraphe présente une progression thématique cohérente ?", "La rivière alimente le lac. Ce lac fournit ensuite de l’eau aux villages voisins.", ["La rivière alimente le lac. Les romans policiers sont populaires.", "La rivière alimente le lac. Une guitare possède six cordes."], "Relie les informations en reprenant « des panneaux solaires » comme thème de la deuxième phrase.", "Des panneaux solaires couvrent le toit. Ces équipements produisent de l’électricité."),
  ],
};

export const LOCAL_GRAMMAR_ITEM_PREFIX = "local-grammar-v1";

export async function buildLocalGrammarDraftItems(
  taxonomy: TaxonomyCandidate,
): Promise<CanonicalDiagnosticBankItem[]> {
  const nodeByKey = new Map(taxonomy.nodes.map((node) => [node.key, node]));
  const knownNodeKeys = new Set(nodeByKey.keys());
  const items: CanonicalDiagnosticBankItem[] = [];

  for (const [nodeKey, examples] of Object.entries(EXAMPLES)) {
    const node = nodeByKey.get(nodeKey);
    if (!node || node.strand !== "grammaire_syntaxe") {
      throw new Error(`Local grammar node is absent or incompatible: ${nodeKey}`);
    }
    for (const expectation of ["receptive", "controlled_production"] as const) {
      const evidence = node.evidence.find((candidate) => candidate.expectation === expectation);
      if (!evidence) throw new Error(`Local grammar evidence is absent: ${nodeKey}:${expectation}`);
      for (let index = 0; index < examples.length; index += 1) {
        const sample = examples[index];
        const tier = DIAGNOSTIC_DIFFICULTY_TIERS[index];
        const raw: GeneratedItem = expectation === "receptive"
          ? {
              nodeKey,
              strand: node.strand,
              modality: "grammar_analysis",
              learnerMode: "shared",
              responseType: "mcq",
              promptFr: sample.receptivePrompt,
              acceptableAnswers: [],
              validatorType: "exact",
              choices: [
                { text: sample.receptiveAnswer, correct: true },
                ...sample.receptiveDistractors.map((text) => ({ text, correct: false })),
              ],
              difficulty: diagnosticDifficultyForTier(tier),
            }
          : {
              nodeKey,
              strand: node.strand,
              modality: "writing",
              learnerMode: "shared",
              responseType: index === 0 ? "short_answer" : index === 1 ? "cloze" : "transform",
              promptFr: sample.productionPrompt,
              instructionsFr: "Écris une phrase complète avec la ponctuation demandée.",
              correctAnswer: sample.productionAnswer,
              acceptableAnswers: [...(sample.acceptableAnswers ?? [])],
              validatorType: "exact",
              difficulty: diagnosticDifficultyForTier(tier),
            };
        const gated = await runGates(raw, { knownNodeKeys, knownMisconceptionKeys: new Set() });
        if (!gated.item || gated.gates.verdict === "rejected"
          || !gated.gates.gate1_invariants.ok || !gated.gates.gate2_answer_key.ok) {
          throw new Error(`Local grammar item failed hard QC: ${nodeKey}:${expectation}:${tier}`);
        }
        items.push({
          itemKey: [LOCAL_GRAMMAR_ITEM_PREFIX, nodeKey, expectation, tier].join(":"),
          item: gated.item,
          evidenceKey: evidence.key,
          evidenceExpectation: expectation,
          sectionKey: "grammar",
          promptFamily: diagnosticPromptFamilies("grammar", expectation)[index],
          difficultyTier: tier,
          qcGates: gated.gates,
          reviewStatus: "needs_human_review",
        });
      }
    }
  }

  return items;
}

function grammar(
  receptivePrompt: string,
  receptiveAnswer: string,
  receptiveDistractors: readonly [string, string],
  productionPrompt: string,
  productionAnswer: string,
  acceptableAnswers?: readonly string[],
): GrammarExample {
  return { receptivePrompt, receptiveAnswer, receptiveDistractors, productionPrompt, productionAnswer, acceptableAnswers };
}

function relation(
  relationLabel: string,
  connector: string,
  pairs: readonly [readonly [string, string], readonly [string, string], readonly [string, string]],
): readonly [GrammarExample, GrammarExample, GrammarExample] {
  return pairs.map(([first, second]) => grammar(
    `Quelle relation exprime « ${first} ; ${second} » lorsqu’on les relie avec « ${connector} » ?`,
    relationLabel,
    relationLabel === "cause" ? ["conséquence", "contraste"] : ["cause", "contraste"],
    `Relie avec « ${connector} » : « ${first}. ${capitalize(second)}. »`,
    `${first} ${connector} ${second}.`,
  )) as unknown as readonly [GrammarExample, GrammarExample, GrammarExample];
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
