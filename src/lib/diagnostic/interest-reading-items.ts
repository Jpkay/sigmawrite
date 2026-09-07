import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";

/** Fictional, self-contained situations: no outside subject knowledge is assessed. */
export const INTEREST_READING_PASSAGES = [
  {
    key: "football", label: "Football",
    text: "Dans ce récit fictif, l’équipe de football de Nora perd souvent le ballon parce que ses joueurs se parlent peu. Nora propose de consacrer dix minutes de chaque entraînement à des passes accompagnées d’un appel du prénom du partenaire. Elle note les pertes de balle pendant les petits matchs. Après quatre séances, leur nombre passe de vingt à douze par match.\n\nNora souhaite garder cet exercice, car elle trouve la circulation du ballon plus facile. Sami préférerait utiliser ces dix minutes pour tirer au but : il juge les passes répétées ennuyeuses. L’entraîneuse propose d’alterner les deux activités. Elle précise que les adversaires n’étaient pas les mêmes à chaque match ; les notes de Nora sont encourageantes, mais ne prouvent pas que cet exercice explique à lui seul le progrès.",
    problem: "L’équipe perd souvent le ballon parce que les joueurs communiquent peu.",
    action: "Nora met en place un exercice de passes où les joueurs appellent leur partenaire.",
    result: "Les pertes de balle passent de vingt à douze par match.",
    paraphrase: "L’équipe ne perd plus que douze ballons par rencontre, contre vingt auparavant.",
    viewpoints: "Nora veut poursuivre les passes avec communication, tandis que Sami préfère travailler les tirs.",
    interpretation: "Ces résultats suggèrent que mieux communiquer pendant les passes peut aider l’équipe à conserver le ballon.",
  },
  {
    key: "music", label: "Musique",
    text: "Dans ce récit fictif, le groupe de musique de Lina prépare une fête au collège. Les musiciens ont du mal à commencer ensemble. Lina enregistre une répétition et relève six départs décalés. Elle propose ensuite qu’un membre donne quatre pulsations régulières avant chaque morceau. Après plusieurs essais, le groupe enregistre de nouveau sa répétition. Il ne compte plus que deux départs décalés.\n\nLina souhaite conserver ce signal commun. Yanis préfère commencer directement, car le compte lui semble casser la spontanéité. Ils décident d’utiliser le signal pendant les répétitions et d’en discuter avant le concert. Leur professeur les invite à rester prudents : le groupe connaissait aussi mieux les morceaux lors du second enregistrement.",
    problem: "Les musiciens n’arrivent pas à commencer les morceaux ensemble.",
    action: "Lina propose de donner quatre pulsations communes avant chaque morceau.",
    result: "Le nombre de départs décalés passe de six à deux.",
    paraphrase: "On ne relève plus que deux débuts mal synchronisés, contre six au départ.",
    viewpoints: "Lina souhaite un signal commun, tandis que Yanis préfère un départ spontané sans compter.",
    interpretation: "Cette diminution suggère qu’un signal partagé peut aider les musiciens à démarrer ensemble.",
  },
  {
    key: "gaming", label: "Jeux vidéo",
    text: "Dans ce récit fictif, Amine et ses amis testent un jeu coopératif qu’ils ont créé au club informatique. Leur équipe échoue souvent parce que deux joueurs cherchent le même objet pendant que personne ne surveille la porte. Amine propose de répartir les rôles avant chaque partie. Sur la première série de dix essais, ils terminent trois missions ; dans la série suivante, avec les rôles répartis, ils en terminent sept.\n\nAmine veut garder cette organisation pour mieux coopérer. Zoé préfère choisir librement son rôle en cours de partie, afin de varier les expériences. Le club propose de changer les rôles entre les parties. Comme les joueurs connaissent mieux le jeu au fil des essais, ils ne peuvent pas attribuer toute leur progression à la répartition des rôles.",
    problem: "Les joueurs échouent parce que certaines tâches sont faites en double et d’autres oubliées.",
    action: "Amine propose de répartir les rôles avant la partie.",
    result: "Les missions réussies passent de trois à sept sur dix essais.",
    paraphrase: "Sur dix parties, le groupe atteint son objectif sept fois au lieu de trois.",
    viewpoints: "Amine préfère des rôles prévus pour coopérer, alors que Zoé souhaite rester libre de changer pendant le jeu.",
    interpretation: "La progression suggère que répartir les tâches peut aider une équipe à réussir des missions communes.",
  },
  {
    key: "animals", label: "Animaux",
    text: "Dans ce récit fictif, le club nature d’Aya observe les oiseaux depuis la fenêtre de la bibliothèque. Les élèves font tellement de bruit que les oiseaux s’éloignent souvent avant qu’ils puissent les dessiner. Aya propose de communiquer par gestes pendant les observations. Lors de la première matinée, ils dessinent deux oiseaux ; une semaine plus tard, avec la nouvelle règle, ils en dessinent cinq.\n\nAya souhaite garder cette règle pour observer sans déranger. Malo préfère pouvoir poser ses questions à voix haute dès qu’il en a une. Les élèves proposent de réserver un moment de discussion après l’observation. La responsable rappelle que la météo et le nombre d’oiseaux présents ont aussi changé entre les deux matinées.",
    problem: "Le bruit des élèves fait partir les oiseaux avant qu’ils puissent les observer.",
    action: "Aya propose de communiquer par gestes pendant l’observation.",
    result: "Les élèves dessinent cinq oiseaux au lieu de deux.",
    paraphrase: "Le groupe parvient à représenter cinq oiseaux, contre seulement deux lors de la première matinée.",
    viewpoints: "Aya veut observer en silence, tandis que Malo souhaite poser immédiatement ses questions à voix haute.",
    interpretation: "Cette observation suggère que faire moins de bruit peut faciliter l’observation des oiseaux.",
  },
  {
    key: "space", label: "Espace",
    text: "Dans ce récit fictif, le club d’astronomie de Sofia organise une soirée pour apprendre à reconnaître des constellations sur une carte du ciel. Les débutants se perdent parmi les nombreux signes. Sofia crée une fiche qui montre trois repères à chercher dans l’ordre. Avant de recevoir la fiche, quatre participants sur dix retrouvent la constellation demandée ; avec la fiche, ils sont huit.\n\nSofia souhaite distribuer cette aide à la prochaine séance. Idriss préfère laisser chacun explorer librement la carte, pour le plaisir de chercher. Ils proposent de rendre la fiche facultative. La responsable précise que les participants avaient déjà vu la carte une première fois : la fiche n’est pas forcément la seule raison de leurs progrès.",
    problem: "Les débutants ont du mal à se repérer sur la carte du ciel.",
    action: "Sofia crée une fiche présentant trois repères dans un ordre précis.",
    result: "Huit participants sur dix retrouvent la constellation, contre quatre auparavant.",
    paraphrase: "La recherche aboutit pour huit personnes sur dix, alors qu’elle n’avait réussi que pour quatre au début.",
    viewpoints: "Sofia veut proposer une fiche pour guider les débutants, tandis qu’Idriss préfère une exploration libre.",
    interpretation: "Ce résultat suggère que des repères ordonnés peuvent aider les débutants à lire une carte du ciel.",
  },
  {
    key: "food", label: "Cuisine",
    text: "Dans ce récit fictif, Karim prépare des galettes avec son groupe de cuisine. La recette est écrite dans un long paragraphe et plusieurs élèves oublient une étape. Karim la transforme en une liste numérotée que chacun peut cocher. Lors du premier essai, le groupe oublie quatre étapes au total ; au second, avec la liste, il n’en oublie qu’une.\n\nKarim souhaite conserver ce format pour les prochaines recettes. Léa préfère un texte continu qui explique les gestes et leurs raisons. Le groupe propose d’ajouter de courtes explications sous les étapes numérotées. Leur animateur rappelle qu’ils connaissaient aussi mieux la recette lors du second essai.",
    problem: "Les élèves oublient des étapes dans une recette présentée en un long paragraphe.",
    action: "Karim transforme la recette en liste numérotée à cocher.",
    result: "Le nombre d’étapes oubliées passe de quatre à une.",
    paraphrase: "Le groupe ne saute plus qu’une étape, contre quatre pendant le premier essai.",
    viewpoints: "Karim préfère une liste d’étapes à cocher, tandis que Léa souhaite un texte qui explique les gestes.",
    interpretation: "Cette diminution suggère qu’une liste numérotée peut aider à suivre toutes les étapes d’une recette.",
  },
] as const;

export function buildInterestReadingItems(): Array<{ key: string; item: GeneratedItem }> {
  return INTEREST_READING_PASSAGES.flatMap((passage) => {
    const tasks = [
      { node: "reformuler_sans_copier", question: `Reformule avec tes mots : « ${passage.result} »`, answer: passage.paraphrase, ideas: [`Conserve cette information : ${passage.result}`, "Reformule avec tes propres mots, sans simplement recopier la citation."] },
      { node: "organiser_resume_informatif", question: "Résume en une phrase le problème rencontré et la solution proposée.", answer: `${passage.problem.replace(/\.$/u, "")} ; ${passage.action.charAt(0).toLocaleLowerCase("fr") + passage.action.slice(1)}`, ideas: [`Présente le problème : ${passage.problem}`, `Explique la solution : ${passage.action}`] },
      { node: "organiser_resume_narratif", question: "Résume le récit en une phrase reliant la situation, l’action et le résultat.", answer: `${passage.problem.replace(/\.$/u, "")} ; ${passage.action.replace(/\.$/u, "")} ; ${passage.result}`, ideas: [passage.problem, passage.action, passage.result] },
      { node: "comparer_points_de_vue", question: "Compare les deux points de vue exprimés à propos de la nouvelle méthode.", answer: passage.viewpoints, ideas: [`Compare les deux positions en les attribuant aux bonnes personnes : ${passage.viewpoints}`] },
      { node: "relier_preuve_interpretation", question: `Que suggère ce résultat sur l’utilité de la méthode proposée : « ${passage.result} » ?`, answer: passage.interpretation, ideas: [`Interprète le résultat au-delà du chiffre : ${passage.interpretation}`] },
    ];
    return tasks.map((task) => ({ key: `interest-reading-v1:${passage.key}:${task.node}`, item: {
      nodeKey: task.node, strand: "comprehension_ecrite", modality: "writing", learnerMode: "shared", responseType: "short_answer", validatorType: "exact", difficulty: 50,
      promptFr: `Lis le texte.\n\n${passage.text}\n\n${task.question}`, instructionsFr: "Réponds avec tes mots en t’appuyant sur le texte.", correctAnswer: task.answer, acceptableAnswers: [],
      validatorConfig: { interestKeys: [passage.key], interestLabelFr: passage.label, contentFamily: "interest-reading-v1", readingRubric: { version: 1, requiredIdeas: task.ideas } },
    } }));
  });
}
