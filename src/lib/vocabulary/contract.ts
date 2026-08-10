const FRENCH_FUNCTION_WORDS = new Set([
  "a", "au", "aux", "avec", "ce", "ces", "cette", "comme", "d", "dans", "de", "des", "du", "elle", "en", "est", "et", "il", "la", "le", "les", "leur", "leurs", "lui", "mais", "ne", "ou", "par", "pas", "plus", "pour", "qu", "que", "qui", "se", "son", "sur", "un", "une",
]);

const normalize = (value: string) => value
  .toLocaleLowerCase("fr")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zœæ'-]/g, "");

export type VocabularyDefinition = {
  word: string;
  definitionFr: string;
  examplesFr: string[];
};

export type DefinitionIssue = {
  code: "circular_definition" | "too_few_examples" | "unfamiliar_definition_word";
  word?: string;
  message: string;
};

export function definitionWords(definition: string): string[] {
  return definition.split(/\s+/).map(normalize).filter((word) => word.length > 1 && !FRENCH_FUNCTION_WORDS.has(word));
}

export function validateVocabularyDefinition(
  entry: VocabularyDefinition,
  options: { supportedVocabulary?: Iterable<string>; concretelyExplainedWords?: Iterable<string> } = {},
): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];
  const target = normalize(entry.word);
  const words = definitionWords(entry.definitionFr);
  if (words.includes(target)) {
    issues.push({ code: "circular_definition", message: `La définition de « ${entry.word} » réutilise le mot à expliquer.` });
  }
  if (entry.examplesFr.filter((example) => example.trim().length >= 12).length < 2) {
    issues.push({ code: "too_few_examples", message: `Ajoutez au moins deux exemples concrets et contextualisés pour « ${entry.word} ».` });
  }
  if (options.supportedVocabulary) {
    const supported = new Set([...options.supportedVocabulary].map(normalize));
    const explained = new Set([...options.concretelyExplainedWords ?? []].map(normalize));
    for (const word of new Set(words)) {
      if (word === target || supported.has(word) || explained.has(word) || word.length <= 5) continue;
      issues.push({
        code: "unfamiliar_definition_word",
        word,
        message: `Le mot « ${word} » dépasse le vocabulaire soutenu et n’est pas expliqué concrètement.`,
      });
    }
  }
  return issues;
}

export function validateVocabularySet(
  entries: VocabularyDefinition[],
  supportedVocabulary: Iterable<string>,
): Array<{ target: string; issues: DefinitionIssue[] }> {
  const explainedTargets = entries.map((entry) => entry.word);
  return entries.map((entry) => ({
    target: entry.word,
    issues: validateVocabularyDefinition(entry, {
      supportedVocabulary,
      concretelyExplainedWords: explainedTargets.filter((word) => normalize(word) !== normalize(entry.word)),
    }),
  })).filter((result) => result.issues.length > 0);
}
