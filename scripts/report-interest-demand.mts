/**
 * Roadmap E.1: which interests do students pick, and which have content?
 * Read-only. Prints student_interests counts per interest (and per group)
 * next to published content counts per interest × age band, so the team can
 * decide which interests to keep and which to merge into their group.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/report-interest-demand.mts [--json]
 *
 * Point it at a local or staging database; it never writes.
 */
import { createClient } from "@supabase/supabase-js";
import { INTERESTS, INTEREST_GROUPS } from "../src/lib/content/interests";
import { INTEREST_AGE_BANDS, PRACTICE_SKILL_FAMILY_KEYS, COVERAGE_GRADES, evaluateInterestCoverage } from "../src/lib/content/interest-coverage";
import { loadInterestCoverageCounts, loadInterestDemand } from "../src/lib/content/interest-coverage-load";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const [demand, counts] = await Promise.all([loadInterestDemand(db), loadInterestCoverageCounts(db)]);
const coverage = evaluateInterestCoverage(counts, { demand });
const uncovered = new Map(coverage.uncovered.map((row) => [row.interest, row]));

const rows = INTERESTS.map((interest) => ({
  interest: interest.key,
  group: interest.group,
  students: demand[interest.key] ?? 0,
  ...Object.fromEntries(INTEREST_AGE_BANDS.map((band) => [`passages_${band}`, counts.passages[interest.key]?.[band] ?? 0])),
  practice: PRACTICE_SKILL_FAMILY_KEYS.reduce((total, family) => total + (counts.practice[interest.key]?.[family] ?? 0), 0),
  dictations: COVERAGE_GRADES.reduce((total, grade) => total + (counts.dictations[interest.key]?.[grade] ?? 0), 0),
  missingItems: uncovered.get(interest.key)?.missingItems ?? 0,
})).sort((a, b) => b.students - a.students || a.interest.localeCompare(b.interest));

const groups = INTEREST_GROUPS.map((group) => {
  const members = rows.filter((row) => row.group === group.key);
  return {
    group: group.key,
    students: members.reduce((total, row) => total + row.students, 0),
    passages: members.reduce((total, row) => total + INTEREST_AGE_BANDS.reduce((sum, band) => sum + Number(row[`passages_${band}` as keyof typeof row] ?? 0), 0), 0),
    members: members.map((row) => row.interest).join(","),
  };
}).sort((a, b) => b.students - a.students);

const unknown = Object.keys(demand).filter((interest) => !INTERESTS.some((item) => item.key === interest));

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ rows, groups, unknownInterestKeys: unknown, dictationTagsAvailable: counts.dictationTagsAvailable }, null, 2));
} else {
  console.log("Interest demand vs. content (E.1)\n");
  console.table(rows);
  console.log("\nBy group\n");
  console.table(groups);
  if (unknown.length) console.log(`\nStored interest keys not in the catalogue: ${unknown.join(", ")}`);
  if (!counts.dictationTagsAvailable) console.log("\nDictée interest tags (roadmap G.1) are not in this database yet: dictée counts are 0.");
}
