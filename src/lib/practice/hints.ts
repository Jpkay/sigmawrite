/**
 * Deterministic metalinguistic hint ladder (gap-analysis Phase 3).
 *
 * The corrective-feedback research ordering is: prompt (let the learner
 * self-correct) → metalinguistic clue → explicit correction last. Prompts and
 * clues beat recasts for retention (Lyster & Saito 2010; Li 2010), and an AI
 * tutor must never lead with the answer. Hints are derived deterministically
 * from the node and the item's validator config — the live practice loop
 * stays validable without any external service, like the diagnostic.
 *
 * Level 1 — orientation prompt: what skill this exercise works, re-read cue.
 * Level 2 — metalinguistic clue: tense/person decomposition for conjugation,
 *           elimination strategy for MCQ, structural cue otherwise.
 * The explicit correction (level 3) stays where it already lives: the
 * validator's feedback after a wrong submission.
 */

const TENSE_LABEL_FR: Record<string, string> = {
  present: "présent",
  imparfait: "imparfait",
  passe_compose: "passé composé",
  plus_que_parfait: "plus-que-parfait",
  futur_simple: "futur simple",
  futur_proche: "futur proche",
  conditionnel_present: "conditionnel présent",
  subjonctif_present: "subjonctif présent",
  imperatif_present: "impératif présent",
};

const TENSE_TIP_FR: Record<string, string> = {
  present: "Retrouve d’abord le radical, puis la terminaison qui va avec la personne.",
  imparfait: "Pars de la forme « nous » au présent : son radical donne l’imparfait.",
  passe_compose: "Choisis d’abord l’auxiliaire (avoir ou être) au présent, puis forme le participe passé.",
  plus_que_parfait: "C’est l’auxiliaire à l’imparfait + le participe passé.",
  futur_simple: "Le radical du futur garde presque toujours l’infinitif, et la terminaison commence après le « r ».",
  futur_proche: "C’est « aller » au présent + l’infinitif du verbe.",
  conditionnel_present: "Prends le radical du futur et ajoute les terminaisons de l’imparfait.",
  subjonctif_present: "Pars de la forme « ils » au présent : son radical donne le subjonctif.",
  imperatif_present: "C’est la forme du présent, sans le sujet — et sans « s » final pour les verbes en -er à « tu ».",
};

const PERSON_LABEL_FR: Record<string, string> = {
  "1s": "je", "2s": "tu", "3s": "il/elle", "1p": "nous", "2p": "vous", "3p": "ils/elles",
};

const PRONOUN_TIP_FR: Record<string, string> = {
  direct_objects: "Cherche le complément sans préposition, puis vérifie son genre et son nombre : le, la, l’ ou les.",
  indirect_people: "Compte les destinataires, sans regarder leur genre : une personne donne lui ; plusieurs donnent leur.",
  direct_or_indirect: "Regarde la construction du verbe : quelqu’un sans préposition donne le/la/les ; à quelqu’un donne lui/leur.",
  y_and_en: "Repère la préposition : à, dans ou sur une chose mène souvent à y ; de ou une quantité mène à en.",
  position_and_agreement: "Place le pronom avant l’auxiliaire. Fais l’accord seulement si le pronom est COD, jamais parce que lui désigne une femme.",
  double_pronouns: "Avant le verbe, place le/la/les avant lui/leur. À l’impératif affirmatif, pense aux traits d’union.",
};

export type HintSource = {
  nodeLabel: string;
  nodeDescription: string | null;
  validatorType: string;
  validatorConfig: Record<string, unknown> | null;
  choiceCount: number;
};

/** Ordered hints for one exercise (never reveals the answer). */
export function buildHintLadder(source: HintSource): string[] {
  const orientation = source.nodeDescription
    ? `Cette étape travaille : ${source.nodeLabel}. ${source.nodeDescription}`
    : `Cette étape travaille : ${source.nodeLabel}. Relis la consigne en pensant à cette notion.`;

  let clue: string;
  const config = source.validatorConfig ?? {};
  const verb = typeof config.verb === "string" ? config.verb : null;
  const tense = typeof config.tense === "string" ? config.tense : null;
  const person = typeof config.person === "string" ? config.person : null;
  const practiceModule = typeof config.practiceModule === "string" ? config.practiceModule : null;

  if (practiceModule && PRONOUN_TIP_FR[practiceModule]) {
    clue = PRONOUN_TIP_FR[practiceModule];
  } else if (source.validatorType === "conjugator" && verb && tense) {
    const tenseLabel = TENSE_LABEL_FR[tense] ?? tense;
    const personLabel = person ? PERSON_LABEL_FR[person] ?? person : null;
    const target = personLabel
      ? `Conjugue « ${verb} » au ${tenseLabel} avec « ${personLabel} ».`
      : `Conjugue « ${verb} » au ${tenseLabel}.`;
    const tip = TENSE_TIP_FR[tense] ?? "Décompose : radical, puis terminaison.";
    clue = `${target} ${tip}`;
  } else {
    const family=`${source.nodeLabel} ${source.nodeDescription??""}`.toLocaleLowerCase("fr");
    if(/accord|genre|nombre/.test(family))clue="Repère le donneur d’accord, puis reporte séparément le genre et le nombre sur le mot qui reçoit l’accord.";
    else if(/homophone|orthograph/.test(family))clue="Remplace mentalement le mot par une forme-test de la même famille grammaticale, puis vérifie si la phrase garde son sens.";
    else if(/infér|implicite|compréhension/.test(family))clue="Relève un indice précis du texte, relie-le à ce que tu sais, puis choisis seulement la conclusion que les deux autorisent.";
    else if(/résum|idée principale/.test(family))clue="Formule l’idée commune aux informations importantes; écarte l’exemple isolé et le détail qui ne change pas le message.";
    else if(/connecteur|cause|conséquence|opposition/.test(family))clue="Nomme la relation logique entre les deux propositions avant de choisir le mot qui l’exprime.";
    else if(source.choiceCount>1)clue=`Élimine d’abord les réponses qui ne respectent pas la règle (${source.nodeLabel}), puis compare celles qui restent.`;
    else clue="Décompose la phrase : trouve le verbe, son sujet, et vérifie leur accord avant d’écrire ta réponse.";
  }

  return [orientation, clue];
}
