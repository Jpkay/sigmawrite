import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local", quiet: true });
process.env.AI_PROVIDER = process.env.REAL_AI_PROVIDER ?? "glm";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Staging Supabase service environment required");

const db = createClient(url, key, { auth: { persistSession: false } });
const { runGenerationPipeline } = await import("../src/lib/ai/pipeline.ts");
const { getAIProviderInfo } = await import("../src/lib/ai/index.ts");

const { data: prompt, error: promptError } = await db.from("prompt_versions")
  .select("prompt_key,version_number,prompt_text")
  .eq("prompt_key", "text_generation").eq("active", true).single();
if (promptError || !prompt) throw new Error("Active text prompt missing");

await db.from("ai_generation_jobs").update({
  status: "failed",
  error_message: "Stale resumable pilot generation was superseded",
  completed_at: new Date().toISOString(),
}).eq("job_type", "text_generation").eq("status", "running")
  .lt("created_at", new Date(Date.now() - 15 * 60_000).toISOString());

const topics: Record<string, string[]> = {
  football: ["Les centres de formation et l’école", "La physique d’un tir courbé"],
  music: ["Comment le rythme agit sur l’attention", "Les métiers invisibles d’un concert"],
  technology: ["Comment fonctionne un réseau sans fil", "Réparer plutôt que remplacer un téléphone"],
  environment: ["Les mangroves protègent les côtes", "Pourquoi les villes plantent des arbres"],
  space: ["Vivre à bord d’une station spatiale", "Comment observer une exoplanète"],
  food: ["La fermentation dans différentes cultures", "Le trajet d’un aliment jusqu’au marché"],
  travel: ["Pourquoi les langues changent aux frontières", "Le tourisme et la protection des sites"],
  african_history: ["Les routes commerciales du Sahel", "Les bibliothèques de Tombouctou"],
  medicine: ["Comment le sommeil aide la mémoire", "Pourquoi les microbes ne sont pas tous dangereux"],
  business: ["Comment une petite entreprise fixe ses prix", "L’économie circulaire crée de nouveaux métiers"],
};
const bands = ["Foundation 6A", "Secondary 7A", "Secondary 9A"];
const requests = Object.entries(topics).flatMap(([interest, list]) => bands.flatMap((band, bandIndex) =>
  list.map((topic, index) => ({
    language: "fr" as const,
    studentGrade: bandIndex === 0 ? 6 : bandIndex === 1 ? 7 : 9,
    targetReadingBand: band,
    topic,
    primaryInterest: interest,
    knowledgeDomains: [interest],
    targetConcepts: [],
    textType: (index % 2 ? "narrative_nonfiction" : "expository") as "expository" | "narrative_nonfiction",
    wordCountTarget: bandIndex === 0 ? 260 : bandIndex === 1 ? 380 : 440,
    maxAverageSentenceLength: bandIndex === 0 ? 15 : 20,
    maxNewAcademicWords: 8,
    targetVocabulary: [],
    targetSkills: ["literal_comprehension", "inference", "cause_consequence"],
    avoid: ["statistiques non sourcées", "stéréotypes", "publicité"],
    tone: "curious_explainer" as const,
  }))));

const requestKey = (request: { primaryInterest: string; topic: string; targetReadingBand: string }) =>
  `${request.primaryInterest}|${request.topic}|${request.targetReadingBand}`;

// A batch is intentionally resumable. Successful combinations are never paid
// for twice; failed jobs remain in the operational history and are retried.
const { data: completedJobs } = await db.from("ai_generation_jobs")
  .select("input_payload").eq("job_type", "text_generation").eq("status", "completed");
const completedKeys = new Set((completedJobs ?? []).flatMap((row) => {
  const payload = row.input_payload as { request?: { primaryInterest?: string; topic?: string; targetReadingBand?: string } } | null;
  const request = payload?.request;
  return request?.primaryInterest && request.topic && request.targetReadingBand
    ? [requestKey(request as { primaryInterest: string; topic: string; targetReadingBand: string })]
    : [];
}));
const pending = requests.filter((request) => !completedKeys.has(requestKey(request)));

const info = getAIProviderInfo();
let next = 0;
let completed = 0;
let failed = 0;
const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function worker() {
  while (true) {
    const index = next++;
    if (index >= pending.length) return;
    const request = pending[index];
    const started = Date.now();
    const { data: job, error } = await db.from("ai_generation_jobs").insert({
      job_type: "text_generation",
      status: "running",
      input_payload: {
        request,
        pilot_key: requestKey(request),
        prompt: { key: prompt.prompt_key, version: prompt.version_number },
        provider: info.provider,
        model: info.model,
      },
      provider: info.provider,
      model_id: info.model,
      prompt_key: prompt.prompt_key,
      prompt_version: prompt.version_number,
    }).select("id").single();
    if (error || !job) { failed += 1; continue; }

    try {
      let candidate: Awaited<ReturnType<typeof runGenerationPipeline>> | null = null;
      let lastError: unknown;
      for (let attempt = 1; attempt <= 3 && !candidate; attempt += 1) {
        try {
          candidate = await runGenerationPipeline(request, { systemPrompt: prompt.prompt_text });
        } catch (cause) {
          lastError = cause;
          if (attempt < 3) await pause(attempt * 8_000);
        }
      }
      if (!candidate) throw lastError ?? new Error("Generation failed");

      const { error: candidateError } = await db.from("ai_generated_candidates").insert({
        id: candidate.id,
        generation_job_id: job.id,
        candidate_type: "reading_text",
        payload: candidate,
        review_status: "needs_human_review",
      });
      if (candidateError) throw candidateError;
      await Promise.all([
        db.from("ai_scoring_results").insert({ candidate_id: candidate.id, score_payload: { difficulty: candidate.difficulty, question_difficulties: candidate.questionDifficulties, flags: candidate.flags } }),
        db.from("ai_moderation_results").insert({ candidate_id: candidate.id, moderation_payload: candidate.moderation, passed: candidate.moderation.passed }),
      ]);
      await db.from("ai_generation_jobs").update({
        status: "completed",
        output_payload: { candidate_id: candidate.id, review_status: "needs_human_review" },
        duration_ms: Date.now() - started,
        gate_outcomes: { schema_valid: true, moderation_passed: candidate.flags.moderationPassed, factual_review: candidate.flags.factualNeedsReview, difficulty_mismatch: candidate.flags.difficultyMismatch },
        completed_at: new Date().toISOString(),
      }).eq("id", job.id);
      completed += 1;
      console.log(`${completed}/${pending.length} ${request.primaryInterest.replace(/_/g, " ")} · ${request.targetReadingBand}`);
    } catch (cause) {
      await db.from("ai_generation_jobs").update({
        status: "failed",
        error_message: cause instanceof Error ? cause.message : "unknown",
        duration_ms: Date.now() - started,
        completed_at: new Date().toISOString(),
      }).eq("id", job.id);
      failed += 1;
    }
  }
}

const concurrency = Number(process.env.PILOT_GENERATION_CONCURRENCY ?? 1);
await Promise.all(Array.from({ length: concurrency }, () => worker()));
console.log(JSON.stringify({ ok: failed === 0, total: requests.length, alreadyCompleted: completedKeys.size, requestedNow: pending.length, completed, failed }));
