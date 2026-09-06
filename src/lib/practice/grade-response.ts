import { validateAnswer } from "@/lib/linguistic/validator";
import { LanguageToolChecker } from "@/lib/linguistic/languagetool";
import type { ValidatorType } from "@/lib/linguistic/types";

export type GradingItem = {
  response_type: string; validator_type: string; validator_config: Record<string, unknown> | null;
  correct_answer: string | null; acceptable_answers: string[];
};
export async function gradePracticeResponse(item: GradingItem, choices: { id: string; is_correct: boolean; feedback_fr: string | null }[], data: { selectedChoiceId?: string; answerText?: string }) {
  let correct = false; let feedbackFr: string | null = null;
  const responseType = item.response_type as string;
  const validatorConfig = (item.validator_config ?? {}) as Record<string, unknown>;
  if (responseType === "justified") {
    // Both halves are required: the right form and the rule that proves it (roadmap 2.3).
    const selected = choices.find((choice) => choice.id === data.selectedChoiceId); if (!selected) throw new Error("Choix invalide.");
    const ruleKey = String(validatorConfig.ruleKey ?? ""); const chosenRule = (data.answerText ?? "").trim();
    const formCorrect = selected.is_correct; const ruleCorrect = chosenRule.length > 0 && chosenRule === ruleKey;
    correct = formCorrect && ruleCorrect;
    const rules = (validatorConfig.rules as { key: string; label: string }[] | undefined) ?? [];
    const ruleLabel = rules.find((rule) => rule.key === ruleKey)?.label ?? ruleKey;
    feedbackFr = correct ? (selected.feedback_fr ?? `Bonne forme et bonne justification : ${ruleLabel}.`) : !formCorrect ? (selected.feedback_fr ?? "La forme choisie n’est pas la bonne.") : `La forme est juste, mais la règle qui la justifie est : ${ruleLabel}.`;
  }
  else if (data.selectedChoiceId) { const selected = choices.find((choice) => choice.id === data.selectedChoiceId); if (!selected) throw new Error("Choix invalide."); correct = selected.is_correct; feedbackFr = selected.feedback_fr; }
  else if (responseType === "error_hunt") {
    const target = String(item.correct_answer ?? "");
    // Position-aware when the key lists "index:word" (a sentence may repeat the word); otherwise compare the word.
    const indexedKeys = (item.acceptable_answers as string[]).filter((entry) => /^\d+:/u.test(entry));
    const given = (data.answerText ?? "").trim();
    correct = indexedKeys.length > 0
      ? indexedKeys.some((entry) => entry.split(":")[0] === given.split(":")[0] && normalizeAnswerWord(entry) === normalizeAnswerWord(given))
      : normalizeAnswerWord(given) === normalizeAnswerWord(target);
    feedbackFr = correct ? String(validatorConfig.correctionFr ?? "C’est bien ce mot qui était mal écrit.") : `Le mot fautif était « ${target} ». ${String(validatorConfig.correctionFr ?? "")}`.trim();
  }
  else if (responseType === "combine") {
    // Sentence combining (roadmap 2.4): any listed merge, or a clean single sentence that keeps every content word.
    const validation = await validateAnswer(data.answerText ?? "", { validatorType: "exact", config: { ignorePunctuation: true }, correctAnswer: item.correct_answer as string | undefined, acceptableAnswers: item.acceptable_answers as string[] });
    correct = validation.pass;
    if (!correct) {
      const sentences = (validatorConfig.sentences as string[] | undefined) ?? [];
      const contentWords = sentences.flatMap((sentence) => sentence.toLocaleLowerCase("fr").match(/[\p{L}’']{4,}/gu) ?? []).map((word) => word.replace(/^[a-zçdjlmnst]’/u, ""));
      const answer = (data.answerText ?? "").toLocaleLowerCase("fr");
      const coversContent = contentWords.every((word) => answer.includes(word));
      const singleSentence = (data.answerText ?? "").trim().split(/[.!?]\s+/u).filter(Boolean).length === 1;
      if (coversContent && singleSentence) {
        try { const check = await new LanguageToolChecker().check(data.answerText ?? "", { language: "fr", level: "picky" }); correct = check.matches.length === 0; feedbackFr = correct ? "Phrase unique, complète et correcte." : `Une phrase unique, mais ${check.matches.length} erreur(s) de langue : ${check.matches[0]?.message ?? ""}`; }
        catch { feedbackFr = "La vérification grammaticale est indisponible ; seules les combinaisons attendues sont acceptées pour l’instant."; }
      } else feedbackFr = !singleSentence ? "Il faut une seule phrase." : "Ta phrase oublie une information des phrases de départ.";
    } else feedbackFr = "Phrase bien combinée.";
  }
  else { const validatorType=item.validator_type as ValidatorType; const grammarChecker=validatorType==="agreement"||validatorType==="grammalecte"?new LanguageToolChecker():undefined; const validation = await validateAnswer(data.answerText ?? "", { validatorType, config: item.validator_config as Record<string, unknown> | undefined, correctAnswer: item.correct_answer as string | undefined, acceptableAnswers: item.acceptable_answers as string[] },{grammarChecker}); correct = validation.pass; feedbackFr = validation.reason ?? null; }
  return { correct, feedbackFr };
}

const normalizeAnswerWord = (word: string) => word.normalize("NFC").trim().replace(/^\d+:/u, "").replace(/[.,;:!?«»"()\[\]…]/gu, "").toLocaleLowerCase("fr");
