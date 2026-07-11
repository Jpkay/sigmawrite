import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentCandidate } from "@/lib/ai/pipeline";
import type { DifficultyBand, ReviewStatus, TextType } from "@/lib/types";
import type { SeedText } from "@/lib/content/types";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { paragraphsFromText } from "@/lib/content/text-format";
import { createClient } from "@/lib/supabase/server";

type CandidateRow = {
  id: string;
  payload: unknown;
  review_status: ReviewStatus;
  approved_text_version_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PersistedCandidate = ContentCandidate & {
  approvedTextVersionId: string | null;
  updatedAt: string;
};

export type ContentLibraryItem = {
  id: string;
  textId: string;
  slug: string;
  title: string;
  body: string;
  primaryInterest: string | null;
  textType: string | null;
  difficultyBand: string | null;
  overallDifficulty: number | null;
  reviewStatus: ReviewStatus;
  versionNumber: number;
  questionCount: number;
  createdAt: string;
};

export type ContentDashboardCounts = {
  pending: number;
  flagged: number;
  approved: number;
  benchmarks: number;
};

function candidateFromRow(row: CandidateRow): PersistedCandidate {
  const payload = row.payload as ContentCandidate;
  return {
    ...payload,
    id: row.id,
    createdAt: row.created_at,
    reviewStatus: row.review_status,
    approvedTextVersionId: row.approved_text_version_id,
    updatedAt: row.updated_at,
  };
}

export async function getContentCandidates(
  client?: SupabaseClient
): Promise<PersistedCandidate[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("ai_generated_candidates")
    .select("id,payload,review_status,approved_text_version_id,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as CandidateRow[]).map(candidateFromRow);
}

export async function getContentCandidate(
  candidateId: string,
  client?: SupabaseClient
): Promise<PersistedCandidate> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("ai_generated_candidates")
    .select("id,payload,review_status,approved_text_version_id,created_at,updated_at")
    .eq("id", candidateId)
    .single();
  if (error || !data) throw new Error("Candidat introuvable.");
  return candidateFromRow(data as CandidateRow);
}

export async function getContentLibrary(
  client?: SupabaseClient
): Promise<ContentLibraryItem[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("text_versions")
    .select("id,text_id,title,body,text_type,difficulty_band,overall_difficulty,review_status,version_number,created_at,texts!inner(slug,primary_interest,status)")
    .in("review_status", ["human_approved", "benchmark_locked"])
    .eq("texts.status", "active")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Array<{
    id: string; text_id: string; title: string; body: string; text_type: string | null;
    difficulty_band: string | null; overall_difficulty: number | string | null;
    review_status: ReviewStatus; version_number: number; created_at: string;
    texts: { slug: string | null; primary_interest: string | null; status: string };
  }>;
  const ids = rows.map((row) => row.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: questions, error: questionError } = await supabase
      .from("questions").select("text_version_id").in("text_version_id", ids);
    if (questionError) throw new Error(questionError.message);
    for (const row of questions ?? []) {
      const id = row.text_version_id as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return rows.map((row) => ({
    id: row.id,
    textId: row.text_id,
    slug: row.texts.slug ?? row.text_id,
    title: row.title,
    body: row.body,
    primaryInterest: row.texts.primary_interest,
    textType: row.text_type,
    difficultyBand: row.difficulty_band,
    overallDifficulty: row.overall_difficulty == null ? null : Number(row.overall_difficulty),
    reviewStatus: row.review_status,
    versionNumber: row.version_number,
    questionCount: counts.get(row.id) ?? 0,
    createdAt: row.created_at,
  }));
}

export async function getContentDashboardCounts(
  client?: SupabaseClient
): Promise<ContentDashboardCounts> {
  const supabase = client ?? (await createClient());
  const [candidates, library] = await Promise.all([
    getContentCandidates(supabase),
    getContentLibrary(supabase),
  ]);
  return {
    pending: candidates.filter((row) => ["draft", "needs_human_review"].includes(row.reviewStatus)).length,
    flagged: candidates.filter((row) => !row.flags.moderationPassed).length,
    approved: library.length,
    benchmarks: library.filter((row) => row.reviewStatus === "benchmark_locked").length,
  };
}

export async function getContentTextDetail(textId: string, client?: SupabaseClient) {
  const library = await getContentLibrary(client);
  return library.find((row) => row.textId === textId || row.id === textId) ?? null;
}

function asQuestionType(value: string): SeedText["questions"][number]["type"] {
  return value as SeedText["questions"][number]["type"];
}

function asTextType(value: string | null): TextType {
  return (value ?? "expository") as TextType;
}

function asDifficultyBand(value: string | null): DifficultyBand {
  return (value ?? "Secondary 7A") as DifficultyBand;
}

/** Loads an immutable, approved reading contract. Seed texts remain a keyless fallback. */
export async function getPublishedReadingText(
  textKey: string,
  client?: SupabaseClient
): Promise<SeedText | null> {
  const supabase = client ?? (await createClient());
  const seed = SEED_TEXT_BY_ID[textKey];
  let { data: textRow } = await supabase
    .from("texts")
    .select("id,slug,primary_interest,primary_domain_id")
    .eq("slug", textKey)
    .eq("status", "active")
    .maybeSingle();
  if (!textRow && zUuid(textKey)) {
    const result = await supabase.from("texts")
      .select("id,slug,primary_interest,primary_domain_id")
      .eq("id", textKey).eq("status", "active").maybeSingle();
    textRow = result.data;
  }
  if (!textRow) return seed ?? null;
  const { data: version, error } = await supabase
    .from("text_versions")
    .select("id,title,body,word_count,text_type,difficulty_band")
    .eq("text_id", textRow.id)
    .in("review_status", ["human_approved", "benchmark_locked"])
    .order("version_number", { ascending: false })
    .limit(1)
    .single();
  if (error || !version) return seed ?? null;
  const [{ data: questionRows }, { data: vocabRows }, { data: domain }] = await Promise.all([
    supabase.from("questions").select("id,question_key,question_text,question_type,rubric,question_choices(id,choice_index,choice_text,is_correct)").eq("text_version_id", version.id).order("created_at"),
    supabase.from("text_vocabulary").select("vocabulary_items(display_word,definition_fr)").eq("text_version_id", version.id),
    textRow.primary_domain_id
      ? supabase.from("knowledge_domains").select("key").eq("id", textRow.primary_domain_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const questions = (questionRows ?? []).map((row) => {
    const choices = [...((row.question_choices ?? []) as Array<{ choice_index: number | null; choice_text: string; is_correct: boolean }>)]
      .sort((a, b) => (a.choice_index ?? 0) - (b.choice_index ?? 0));
    const rubric = (row.rubric && typeof row.rubric === "object" ? row.rubric : {}) as Record<string, unknown>;
    return {
      id: (row.question_key as string | null) ?? (row.id as string),
      type: asQuestionType(row.question_type as string),
      skillKey: typeof rubric.skill_key === "string" ? rubric.skill_key : row.question_type as string,
      prompt: row.question_text as string,
      choices: choices.map((choice) => choice.choice_text),
      correctIndex: Math.max(0, choices.findIndex((choice) => choice.is_correct)),
      explanationFr: typeof rubric.explanation_fr === "string"
        ? rubric.explanation_fr
        : "La réponse correcte s'appuie directement sur le texte.",
    };
  });
  const targetVocabulary = (vocabRows ?? []).flatMap((row) => {
    const item = row.vocabulary_items as unknown as { display_word: string; definition_fr: string | null } | null;
    return item ? [{ word: item.display_word, definitionFr: item.definition_fr ?? "Mot important du texte." }] : [];
  });
  const concepts = targetVocabulary.slice(0, 3).map((item) => item.word);
  return {
    id: (textRow.slug as string | null) ?? (textRow.id as string),
    title: version.title as string,
    primaryInterest: (textRow.primary_interest as string | null) ?? "general",
    primaryDomain: (domain as { key?: string } | null)?.key ?? "general",
    concepts,
    textType: asTextType(version.text_type as string | null),
    difficultyBand: asDifficultyBand(version.difficulty_band as string | null),
    wordCount: (version.word_count as number | null) ?? (version.body as string).split(/\s+/).length,
    body: paragraphsFromText(version.body as string),
    targetVocabulary,
    questions,
    summaryPrompt: "Résume le texte en 2 ou 3 phrases en gardant l'idée principale.",
    retrievalPrompt: concepts.length
      ? `Avec tes mots, explique la notion « ${concepts[0]} ».`
      : "Quelle idée importante retiens-tu de ce texte ?",
  };
}

function zUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function recommendPublishedTextKey(
  interests: string[],
  client?: SupabaseClient
): Promise<string> {
  const library = await getContentLibrary(client);
  const match = library.find((row) => row.primaryInterest && interests.includes(row.primaryInterest));
  return (match ?? library[0])?.slug ?? Object.keys(SEED_TEXT_BY_ID)[0];
}
