import type { CanonicalDiagnosticBankItem } from "../item-bank";

const LABEL_DESCRIPTION: Readonly<Record<string, string>> = {
  "subjonctif présent":
    "La forme employée après « que » pour exprimer ici une nécessité, un souhait, un doute ou un but.",
  "indicatif présent":
    "La forme qui dit ici ce qui se passe maintenant ou souvent, comme « je chante ».",
  présent:
    "La forme qui dit ce qui se passe maintenant ou souvent, comme « je chante ».",
  "indicatif imparfait":
    "La forme qui décrit ici une situation passée en cours ou habituelle.",
  imparfait:
    "La forme qui décrit une situation passée en cours ou habituelle, comme « je chantais ».",
  "subjonctif passé":
    "La forme avec « avoir » ou « être » après « que » pour présenter une action déjà accomplie.",
  "passé simple":
    "La forme en un seul mot employée surtout dans les récits écrits pour une action terminée.",
  "passé composé":
    "La forme avec « avoir » ou « être » suivie d’un autre verbe pour raconter une action terminée.",
  "impératif présent":
    "La forme qui donne directement une consigne, sans sujet écrit.",
  "indicatif futur simple":
    "La forme en un seul mot qui annonce ce qui se passera.",
  infinitif: "La forme de départ du verbe, comme « finir ».",
  "participe passé":
    "La forme employée après « avoir » ou « être », comme « fini ».",
  impératif: "La forme qui donne directement une consigne.",
  "futur proche":
    "Une forme d’« aller » suivie d’un autre verbe pour annoncer ce qui va se passer.",
  "passé récent":
    "Une forme de « venir », puis « de » ou « d’ », et un autre verbe pour dire ce qui vient d’arriver.",
};

function normalizedLabel(text: string): string {
  return text
    .normalize("NFC")
    .trim()
    .replace(/[.?!]+$/u, "")
    .toLocaleLowerCase("fr")
    .replace(/^(?:le |la |l[’'])/u, "");
}

function numberedKey(key: string, prefix: string, max: number): boolean {
  const match = new RegExp(
    `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)$`,
  ).exec(key);
  return Boolean(match && Number(match[1]) >= 1 && Number(match[1]) <= max);
}

function contextBeforeQuestion(prompt: string): string {
  const index = prompt.indexOf("\n\n");
  return index < 0 ? "" : `${prompt.slice(0, index)}\n\n`;
}

function lastQuotedText(prompt: string): string {
  const matches = [...prompt.matchAll(/« ([^»]+) »/gu)];
  if (!matches.length)
    throw Error("Revision 45 copy drift: expected a quoted verb form");
  return matches.at(-1)![1];
}

function deepReplace(
  value: unknown,
  replacements: ReadonlyMap<string, string>,
): unknown {
  if (typeof value === "string") return replacements.get(value) ?? value;
  if (Array.isArray(value))
    return value.map((entry) => deepReplace(entry, replacements));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        deepReplace(entry, replacements),
      ]),
    );
  return value;
}

function rewrite(
  entry: CanonicalDiagnosticBankItem,
  promptFr: string,
  choiceDescription = false,
): CanonicalDiagnosticBankItem {
  const originalChoices = entry.item.choices ?? [];
  if (
    entry.item.responseType === "mcq" &&
    originalChoices.filter((choice) => choice.correct).length !== 1
  )
    throw Error(
      `Revision 45 copy drift: ${entry.itemKey} needs one correct choice`,
    );
  const replacements = new Map<string, string>([
    [entry.item.promptFr, promptFr],
  ]);
  const choices = choiceDescription
    ? originalChoices.map((choice) => {
        const description = LABEL_DESCRIPTION[normalizedLabel(choice.text)];
        if (!description)
          throw Error(
            `Revision 45 copy drift: unknown label ${choice.text} in ${entry.itemKey}`,
          );
        replacements.set(choice.text, description);
        return { ...choice, text: description };
      })
    : originalChoices.map((choice) => ({ ...choice }));
  const item = structuredClone(entry.item);
  item.promptFr = promptFr;
  if (originalChoices.length) item.choices = choices;
  if (item.correctAnswer && replacements.has(item.correctAnswer))
    item.correctAnswer = replacements.get(item.correctAnswer)!;
  item.acceptableAnswers = item.acceptableAnswers.map(
    (answer) => replacements.get(answer) ?? answer,
  );
  if (item.validatorConfig)
    item.validatorConfig = deepReplace(
      item.validatorConfig,
      replacements,
    ) as Record<string, unknown>;
  return { ...entry, item };
}

function expectPrompt(
  entry: CanonicalDiagnosticBankItem,
  pattern: RegExp,
): void {
  if (entry.item.responseType !== "mcq" || !pattern.test(entry.item.promptFr))
    throw Error(`Revision 45 copy drift: unexpected ${entry.itemKey}`);
}

function examplePrompt(
  entry: CanonicalDiagnosticBankItem,
  example: string,
): CanonicalDiagnosticBankItem {
  return rewrite(
    entry,
    `${contextBeforeQuestion(entry.item.promptFr)}Quelle réponse a un verbe construit comme « ${example} » ?`,
  );
}

function descriptionPrompt(
  entry: CanonicalDiagnosticBankItem,
  providedForm?: string,
): CanonicalDiagnosticBankItem {
  const form = providedForm ?? lastQuotedText(entry.item.promptFr);
  return rewrite(
    entry,
    `${contextBeforeQuestion(entry.item.promptFr)}Quelle description correspond à « ${form} » dans cette phrase ?`,
    true,
  );
}

function replaceFeedback(
  entry: CanonicalDiagnosticBankItem,
  feedbackByChoice: Readonly<Record<string, string>>,
): CanonicalDiagnosticBankItem {
  const choices = entry.item.choices ?? [];
  if (
    choices.length !== Object.keys(feedbackByChoice).length ||
    choices.some((choice) => !feedbackByChoice[choice.text])
  )
    throw Error(
      `Revision 45 copy drift: unexpected choices in ${entry.itemKey}`,
    );
  return {
    ...entry,
    item: {
      ...entry.item,
      choices: choices.map((choice) => ({
        ...choice,
        feedbackFr: feedbackByChoice[choice.text],
      })),
    },
  };
}

/**
 * Student-facing r45 copy only. Callers must guard this overlay by bank revision;
 * historical bank artifacts and source expansions stay immutable.
 */
export function rewriteRevision45TenseItem(
  entry: CanonicalDiagnosticBankItem,
): CanonicalDiagnosticBankItem {
  const { itemKey, item } = entry;

  if (itemKey.startsWith("v3-present-spelling-transfer:")) {
    if (
      item.validatorType !== "conjugator" ||
      item.validatorConfig?.tense !== "present"
    )
      throw Error(`Revision 45 copy drift: unexpected ${itemKey}`);
    const match =
      /^Complète avec (.+) au présent de l[’']indicatif : (.+)$/u.exec(
        item.promptFr,
      );
    if (!match) throw Error(`Revision 45 copy drift: unexpected ${itemKey}`);
    return rewrite(
      entry,
      `Complète la phrase avec « ${match[1]} » pour dire ce qui se passe maintenant ou souvent : ${match[2]}`,
    );
  }

  if (itemKey.startsWith("v3-futur-proche-production:")) {
    if (
      item.validatorType !== "conjugator" ||
      item.validatorConfig?.tense !== "futur_proche"
    )
      throw Error(`Revision 45 copy drift: unexpected ${itemKey}`);
    const match = /^Complète avec (.+) au futur proche : (.+)$/u.exec(
      item.promptFr,
    );
    if (!match) throw Error(`Revision 45 copy drift: unexpected ${itemKey}`);
    return rewrite(
      entry,
      `Écris une forme d’« aller », puis le verbe « ${match[1]} », pour annoncer ce qui va se passer : ${match[2]}`,
    );
  }

  if (
    item.nodeKey === "reconnaitre_imparfait" &&
    itemKey.startsWith("v3-tense-recognition:imparfait-")
  ) {
    expectPrompt(entry, /imparfait/u);
    return examplePrompt(entry, "je chantais");
  }
  if (
    item.nodeKey === "reconnaitre_futur_simple" &&
    (itemKey.startsWith("v3-tense-recognition:futur_simple-") ||
      itemKey.startsWith("local-conjugation-gap-v1:reconnaitre_futur_simple:"))
  ) {
    expectPrompt(entry, /futur simple/u);
    return examplePrompt(entry, "je chanterai");
  }
  if (
    item.nodeKey === "reconnaitre_conditionnel_present" &&
    (itemKey.startsWith("v3-tense-recognition:conditionnel-form-") ||
      itemKey.startsWith(
        "local-conjugation-gap-v1:reconnaitre_conditionnel_present:",
      ))
  ) {
    expectPrompt(entry, /conditionnel présent/u);
    return examplePrompt(entry, "je chanterais");
  }
  if (
    item.nodeKey === "reconnaitre_passe_compose" &&
    (itemKey.startsWith("v3-tense-recognition:passe-compose-form-") ||
      itemKey === "review-draft-v1:reconnaitre_passe_compose:receptive:core")
  ) {
    expectPrompt(entry, /passé composé/u);
    if (itemKey === "review-draft-v1:reconnaitre_passe_compose:receptive:core")
      return replaceFeedback(
        rewrite(
          entry,
          "Quelle phrase écrit correctement « aller » pour « elle » ? Modèle : « elle est arrivée ».",
        ),
        {
          "Elle est allé à la plage.": "Avec « elle », on écrit « allée ».",
          "Elle est allée à la plage.":
            "Oui : avec « elle », on écrit « allée ».",
          "Elle a allée à la plage.":
            "Pour « aller », on écrit ici « elle est allée ».",
          "Elle est allez à la plage.":
            "Après « est », on écrit ici « allée ».",
        },
      );
    return examplePrompt(entry, "j’ai chanté");
  }
  if (
    item.nodeKey === "reconnaitre_plus_que_parfait" &&
    (itemKey.startsWith("v3-tense-recognition:plus-que-parfait-form-") ||
      itemKey ===
        "review-draft-v1:reconnaitre_plus_que_parfait:receptive:foundation")
  ) {
    expectPrompt(entry, /plus-que-parfait/u);
    const rewritten = examplePrompt(entry, "j’avais chanté");
    if (
      itemKey ===
      "review-draft-v1:reconnaitre_plus_que_parfait:receptive:foundation"
    )
      return replaceFeedback(rewritten, {
        "Elle avait déjà lu ce livre avant le cours.":
          "Oui : « avait lu » suit le modèle « j’avais chanté ».",
        "Elle a déjà lu ce livre avant le cours.":
          "« a lu » suit le modèle « j’ai chanté ».",
        "Elle lisait déjà ce livre avant le cours.":
          "« lisait » est construit en un seul mot, comme « je chantais ».",
        "Elle lira déjà ce livre avant le cours.":
          "« lira » est construit en un seul mot, comme « je chanterai ».",
      });
    return rewritten;
  }
  if (
    item.nodeKey === "reconnaitre_futur_proche" &&
    itemKey.startsWith("v3-tense-recognition:future-")
  ) {
    if (itemKey === "v3-tense-recognition:future-name") {
      if (
        item.responseType !== "mcq" ||
        item.promptFr !==
          "Le gardien va éteindre les lumières.\n\nComment appelle-t-on la construction va éteindre ?" ||
        !(item.choices ?? []).some(
          (choice) => normalizedLabel(choice.text) === "futur proche",
        )
      )
        throw Error(`Revision 45 copy drift: unexpected ${itemKey}`);
      return descriptionPrompt(entry, "va éteindre");
    }
    expectPrompt(entry, /futur proche/u);
    return rewrite(
      entry,
      `${contextBeforeQuestion(item.promptFr)}Quelle réponse suit le même modèle de verbes que « je vais chanter » ?`,
    );
  }
  const recentKeys = new Set([
    "recent-station",
    "recent-find",
    "recent-apostrophe",
    "recent-provenance",
    "recent-name",
    "recent-place",
  ]);
  if (
    item.nodeKey === "reconnaitre_passe_recent" &&
    itemKey.startsWith("v3-tense-recognition:") &&
    recentKeys.has(itemKey.slice("v3-tense-recognition:".length))
  ) {
    if (itemKey === "v3-tense-recognition:recent-name") {
      if (
        item.responseType !== "mcq" ||
        item.promptFr !==
          "Vous venez de recevoir une carte.\n\nComment appelle-t-on venez de recevoir ?" ||
        !(item.choices ?? []).some(
          (choice) => normalizedLabel(choice.text) === "passé récent",
        )
      )
        throw Error(`Revision 45 copy drift: unexpected ${itemKey}`);
      return descriptionPrompt(entry, "venez de recevoir");
    }
    expectPrompt(entry, /passé récent/u);
    if (itemKey === "v3-tense-recognition:recent-place")
      return rewrite(
        entry,
        "Quelle phrase dit d’où viennent les colis, au lieu de dire ce qu’ils viennent de faire ?",
      );
    return rewrite(
      entry,
      `${contextBeforeQuestion(item.promptFr)}Quelle réponse suit le même modèle de verbes que « je viens de chanter » ?`,
    );
  }
  if (
    item.nodeKey === "reconnaitre_subjonctif_present" &&
    numberedKey(itemKey, "v3-tense-recognition:subjonctif-recognition-", 24)
  ) {
    expectPrompt(entry, /mode et à quel temps/u);
    return descriptionPrompt(entry);
  }
  if (
    item.nodeKey === "reconnaitre_passe_simple" &&
    numberedKey(itemKey, "v3-past-tense-foundations:recognition-", 24)
  ) {
    expectPrompt(entry, /À quel temps/u);
    return descriptionPrompt(entry);
  }
  if (
    item.nodeKey === "reconnaitre_imperatif" &&
    numberedKey(itemKey, "v3-imperatif-recognition:imperatif-recognition-", 24)
  ) {
    expectPrompt(entry, /Quelle est la forme/u);
    return descriptionPrompt(entry);
  }
  const infinitiveParticiple =
    itemKey ===
      "local-conjugation-gap-v1:distinguer_infinitif_participe:receptive:stretch" ||
    numberedKey(itemKey, "v3-infinitive-participle:concept-", 24);
  if (
    item.nodeKey === "distinguer_infinitif_participe" &&
    infinitiveParticiple
  ) {
    if (
      item.responseType !== "mcq" ||
      !(item.choices ?? []).some((choice) =>
        /infinitif|participe passé/u.test(choice.text),
      )
    )
      throw Error(`Revision 45 copy drift: unexpected ${itemKey}`);
    return descriptionPrompt(entry);
  }
  return entry;
}
