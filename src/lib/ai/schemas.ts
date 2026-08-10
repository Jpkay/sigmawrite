import { z } from "zod";

/**
 * Zod schemas for the AI content pipeline (PRD §H, §17).
 * Every AI output MUST be validated against these before use — the
 * deterministic scorer and moderation run on validated data only.
 */

export const generateTextInputSchema = z.object({
  language: z.literal("fr"),
  studentGrade: z.number().int().min(4).max(12),
  targetReadingBand: z.string(),
  topic: z.string().min(1),
  primaryInterest: z.string().min(1),
  knowledgeDomains: z.array(z.string()),
  targetConcepts: z.array(z.string()),
  textType: z.enum([
    "expository",
    "argumentative",
    "biography",
    "narrative_nonfiction",
  ]),
  wordCountTarget: z.number().int().min(150).max(1500),
  maxAverageSentenceLength: z.number().int().min(6).max(40),
  maxNewAcademicWords: z.number().int().min(0).max(40),
  targetVocabulary: z.array(z.string()),
  supportedVocabulary: z.array(z.string()).optional(),
  concretelyExplainedDefinitionWords: z.array(z.string()).optional(),
  targetSkills: z.array(z.string()),
  avoid: z.array(z.string()),
  tone: z.enum(["respectful_teen", "neutral_academic", "curious_explainer"]),
});
export type GenerateTextInput = z.infer<typeof generateTextInputSchema>;

export const generatedQuestionSchema = z.object({
  questionText: z.string().min(1),
  questionType: z.enum([
    "literal",
    "vocabulary_in_context",
    "inference",
    "main_idea",
    "cause_consequence",
    "compare_contrast",
    "evidence_selection",
    "summary",
    "transfer",
  ]),
  answerFormat: z.enum(["multiple_choice", "short_answer", "written_summary"]),
  studentInstruction: z.string().min(1).default("Réponds brièvement avec tes mots en t’appuyant sur le texte."),
  choices: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  acceptedConcepts: z.array(z.string().min(1)).default([]),
  modelAnswer: z.string().min(1).optional(),
  scoringCriteria: z.array(z.object({
    label: z.string().min(1),
    conceptIds: z.array(z.string().min(1)).min(1),
    points: z.number().positive(),
  })).default([]),
  rubric: z.string().optional(),
  skillIds: z.array(z.string()),
  difficulty: z.number().min(0).max(100),
}).superRefine((question, context) => {
  if (question.answerFormat !== "short_answer") return;
  if (!question.acceptedConcepts.length) context.addIssue({ code: "custom", path: ["acceptedConcepts"], message: "Une réponse courte exige des concepts acceptés." });
  if (!question.modelAnswer) context.addIssue({ code: "custom", path: ["modelAnswer"], message: "Une réponse courte exige une réponse modèle." });
  if (!question.scoringCriteria.length) context.addIssue({ code: "custom", path: ["scoringCriteria"], message: "Une réponse courte exige des critères de notation." });
});
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export const generatedTextCandidateSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  estimatedReadingBand: z.string(),
  targetVocabulary: z.array(
    z.object({
      word: z.string(),
      definitionFr: z.string(),
      examplesFr: z.array(z.string().min(12)).min(2),
      grade: z.number().int().min(4).max(12).default(7),
      status: z.enum(["new", "review", "maintenance"]).default("new"),
      evidence: z.object({
        exposures: z.number().int().nonnegative().default(0),
        helpLookups: z.number().int().nonnegative().default(0),
        successfulTypedRetrievals: z.number().int().nonnegative().default(0),
      }).default({ exposures: 0, helpLookups: 0, successfulTypedRetrievals: 0 }),
      plannedReuse: z.array(z.string().min(1)).min(1).default(["Révision espacée dans un futur texte lié au même thème."]),
    })
  ),
  knowledgeConcepts: z.array(z.string()),
  skillsPracticed: z.array(z.string()),
  questions: z.array(generatedQuestionSchema),
  safetyNotes: z.array(z.string()),
  factualClaims: z.array(
    z.object({
      claim: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
      needsHumanReview: z.boolean(),
    })
  ),
});
export type GeneratedTextCandidate = z.infer<typeof generatedTextCandidateSchema>;

export const generateQuestionInputSchema = z.object({
  textBody: z.string().min(1),
  targetSkills: z.array(z.string()),
  questionCount: z.number().int().min(1).max(20),
  targetReadingBand: z.string(),
});
export type GenerateQuestionInput = z.infer<typeof generateQuestionInputSchema>;

export const scoreSummaryInputSchema = z.object({
  textBody: z.string().min(1),
  studentSummary: z.string(),
  rubric: z.string().optional(),
});
export type ScoreSummaryInput = z.infer<typeof scoreSummaryInputSchema>;

export const summaryScoreSchema = z.object({
  score: z.number().min(0).max(100),
  contentScore: z.number().min(0).max(100).optional(),
  structureScore: z.number().min(0).max(100).optional(),
  languageScore: z.number().min(0).max(100).optional(),
  capturedMainIdea: z.boolean(),
  keptCauseEffect: z.boolean(),
  omittedDetails: z.boolean(),
  feedbackFr: z.string(),
});
export type SummaryScore = z.infer<typeof summaryScoreSchema>;

export const tagTextInputSchema = z.object({ textBody: z.string().min(1) });
export type TagTextInput = z.infer<typeof tagTextInputSchema>;

export const textTagResultSchema = z.object({
  suggestedDomains: z.array(z.string()),
  suggestedConcepts: z.array(z.string()),
  suggestedSkills: z.array(z.string()),
  suggestedVocabulary: z.array(z.string()),
});
export type TextTagResult = z.infer<typeof textTagResultSchema>;

export const moderationInputSchema = z.object({
  content: z.string(),
  context: z.enum(["student_input", "generated_content"]),
});
export type ModerationInput = z.infer<typeof moderationInputSchema>;

export const moderationResultSchema = z.object({
  passed: z.boolean(),
  flaggedCategories: z.array(z.string()),
  needsHumanReview: z.boolean(),
});
export type ModerationResult = z.infer<typeof moderationResultSchema>;

export const embeddingInputSchema = z.object({ text: z.string().min(1) });
export type EmbeddingInput = z.infer<typeof embeddingInputSchema>;
