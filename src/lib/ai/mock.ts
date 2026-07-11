import type { AIProvider } from "./provider";
import {
  generatedTextCandidateSchema,
  type GenerateTextInput,
  type GeneratedTextCandidate,
  type GenerateQuestionInput,
  type GeneratedQuestion,
  type ScoreSummaryInput,
  type SummaryScore,
  type TagTextInput,
  type TextTagResult,
  type ModerationInput,
  type ModerationResult,
  type EmbeddingInput,
} from "./schemas";

/**
 * Deterministic, key-free AI provider for local dev and tests.
 * Returns shape-valid placeholder content so the whole pipeline
 * (validate → score → moderate → review) can be exercised offline.
 */
export class MockAIProvider implements AIProvider {
  async generateText(input: GenerateTextInput): Promise<GeneratedTextCandidate> {
    const candidate: GeneratedTextCandidate = {
      title: `[mock] ${input.topic}`,
      body:
        `Ceci est un texte de démonstration sur le thème « ${input.topic} ». ` +
        `Il a été produit par le fournisseur d'IA simulé pour le développement local. ` +
        `Le contenu réel sera généré puis validé, noté et modéré avant d'être assignable.`,
      estimatedReadingBand: input.targetReadingBand,
      targetVocabulary: input.targetVocabulary.slice(0, 5).map((word) => ({
        word,
        definitionFr: `Définition simulée de « ${word} ».`,
        exampleSentenceFr: `Voici une phrase d'exemple avec « ${word} ».`,
      })),
      knowledgeConcepts: input.targetConcepts,
      skillsPracticed: input.targetSkills,
      questions: await this.generateQuestions({
        textBody: input.topic,
        targetSkills: input.targetSkills,
        questionCount: 3,
        targetReadingBand: input.targetReadingBand,
      }),
      safetyNotes: ["mock: no moderation performed"],
      factualClaims: [],
    };
    // Self-validate so the mock can never drift from the contract.
    return generatedTextCandidateSchema.parse(candidate);
  }

  async generateQuestions(
    input: GenerateQuestionInput
  ): Promise<GeneratedQuestion[]> {
    return Array.from({ length: input.questionCount }, (_, i) => ({
      questionText: `[mock] Question ${i + 1} ?`,
      questionType: "literal" as const,
      answerFormat: "multiple_choice" as const,
      choices: ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
      correctAnswer: "Réponse A",
      skillIds: input.targetSkills.slice(0, 1),
      difficulty: 50,
    }));
  }

  async scoreSummary(input: ScoreSummaryInput): Promise<SummaryScore> {
    const ok = input.studentSummary.trim().length > 20;
    return {
      score: ok ? 80 : 40,
      contentScore: ok ? 80 : 40,
      structureScore: ok ? 80 : 40,
      languageScore: ok ? 80 : 40,
      capturedMainIdea: ok,
      keptCauseEffect: ok,
      omittedDetails: ok,
      feedbackFr: ok
        ? "Bon résumé (évaluation simulée)."
        : "Résumé trop court (évaluation simulée).",
    };
  }

  async tagText(_input: TagTextInput): Promise<TextTagResult> {
    void _input;
    return {
      suggestedDomains: [],
      suggestedConcepts: [],
      suggestedSkills: [],
      suggestedVocabulary: [],
    };
  }

  async moderate(_input: ModerationInput): Promise<ModerationResult> {
    void _input;
    return { passed: true, flaggedCategories: [], needsHumanReview: false };
  }

  async embed(_input: EmbeddingInput): Promise<number[]> {
    void _input;
    // 1536-dim zero vector matching OpenAI text-embedding-3-small.
    return new Array(1536).fill(0);
  }
}
