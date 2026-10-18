import { config as loadEnv } from "dotenv";
import { getAIProvider, getAIProviderInfo } from "@/lib/ai";
import { gradeExplanation } from "@/lib/vocabulary/session/explain";
import { judgeFromProvider } from "@/lib/vocabulary/session/explain-judge";
import { GOLDEN_CASES, GOLDEN_REFERENCES } from "@/lib/vocabulary/session/explain-golden.fixture";

/**
 * Offline check of "Explique avec tes mots" (roadmap 2026-10 D.5) against the
 * 60-definition golden set, with the configured model behind the provider
 * layer. Acceptance: ≥ 90 % graded like a teacher, and no right answer ever
 * graded wrong. Read-only (no database).
 *
 *   npx tsx --tsconfig ./tsconfig.json scripts/eval-word-explanations.mts
 */
loadEnv({ path: ".env.local", quiet: true });
const info = getAIProviderInfo();
const judge = info.provider === "mock" ? null : judgeFromProvider(getAIProvider());
let exact = 0, unfair = 0, uncertain = 0;
for (const entry of GOLDEN_CASES) {
  const grade = await gradeExplanation(entry.answer, GOLDEN_REFERENCES[entry.word], judge);
  if (grade.verdict === entry.expected) exact++;
  else if (grade.verdict === "uncertain") uncertain++;
  if (entry.expected !== "wrong" && grade.verdict === "wrong") unfair++;
  if (grade.verdict !== entry.expected) console.log(`${entry.word} | ${entry.answer} | attendu ${entry.expected} | obtenu ${grade.verdict} (${grade.source})`);
}
console.log(`\nProvider: ${info.provider} ${info.model ?? ""}`);
console.log(`Exact: ${exact}/${GOLDEN_CASES.length} (${Math.round((exact / GOLDEN_CASES.length) * 100)} %) · uncertain → QCM: ${uncertain} · right answers graded wrong: ${unfair}`);
if (exact / GOLDEN_CASES.length < 0.9 || unfair > 0) process.exitCode = 1;
