import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { frontierForStudent } from "@/lib/diagnostic/live";
import {
  layoutStudentGraphNodes,
  selectPersonalizedNodeIds,
  type StudentGraphView,
} from "@/lib/graph/presentation";

const STAGING_PROJECT_REF = "pwztnrirtrnicywvdbpz";
const PRODUCTION_PROJECT_REF = "tkasvcccucpsbjywgdyl";

loadEnv({ path: process.env.GRAPH_SMOKE_ENV_FILE ?? ".env.local", quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || (!serviceRoleKey && !anonKey)) {
  throw new Error("A Supabase URL and either a service role or anonymous key are required for the read-only graph smoke check.");
}

const hostname = new URL(url).hostname;
const projectRef = hostname === "localhost" || hostname === "127.0.0.1"
  ? "local"
  : hostname.split(".")[0];
const expectedProjectRef = process.env.GRAPH_SMOKE_EXPECTED_PROJECT_REF ?? STAGING_PROJECT_REF;

if (projectRef === PRODUCTION_PROJECT_REF) {
  throw new Error("Refusing to run the graph smoke check against production.");
}
if (projectRef !== "local" && projectRef !== expectedProjectRef) {
  throw new Error("Refusing to run against an unnamed remote project. Set GRAPH_SMOKE_EXPECTED_PROJECT_REF explicitly.");
}

const db = createClient(url, serviceRoleKey || anonKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const accessMode = serviceRoleKey ? "service-read" : "signed-in-student";
if (!serviceRoleKey) {
  const { error: authError } = await db.auth.signInWithPassword({
    email: process.env.GRAPH_SMOKE_STUDENT_EMAIL ?? "demo.eleve@reading-to-learn.test",
    password: process.env.GRAPH_SMOKE_STUDENT_PASSWORD ?? "Demo-2026-Strong!",
  });
  if (authError) throw new Error(`Unable to start the demo student smoke session: ${authError.message}`);
}

type RunCandidate = {
  id: string;
  student_id: string;
  is_pilot: boolean;
};

const { data: completedRows, error: completedError } = await db.from("diagnostic_runs")
  .select("id,student_id,is_pilot")
  .eq("status", "completed")
  .order("completed_at", { ascending: false })
  .limit(100);
if (completedError) throw new Error(`Unable to inspect completed diagnostic runs: ${completedError.message}`);

const completed = (completedRows ?? []) as RunCandidate[];
const selectedStudentIds = new Set<string>();
const cases: Array<{ kind: "standard-completed" | "pilot-completed" | "legacy"; studentId: string; runId?: string }> = [];

for (const [kind, candidate] of [
  ["standard-completed", completed.find((run) => !run.is_pilot)],
  ["pilot-completed", completed.find((run) => run.is_pilot)],
] as const) {
  if (!candidate || selectedStudentIds.has(candidate.student_id)) continue;
  selectedStudentIds.add(candidate.student_id);
  cases.push({ kind, studentId: candidate.student_id, runId: candidate.id });
}

const { data: studentRows, error: studentError } = await db.from("students").select("id").limit(100);
if (studentError) throw new Error(`Unable to inspect graph candidates: ${studentError.message}`);
const legacyCandidate = (studentRows ?? []).find((student) => !selectedStudentIds.has(student.id as string))
  ?? studentRows?.[0];
if (legacyCandidate) {
  cases.push({ kind: "legacy", studentId: legacyCandidate.id as string });
}
if (!cases.length) {
  throw new Error("No student records are available for a graph smoke check.");
}

const summaries = [];
for (const candidate of cases) {
  const result = await frontierForStudent(
    candidate.studentId,
    db,
    candidate.runId ? { runId: candidate.runId } : { runId: null, releaseId: null },
  );
  const summary = validateGraphView(result.graphView);
  summaries.push({ kind: candidate.kind, ...summary });
}

if (!summaries.some((summary) => summary.nodes > 0)) {
  throw new Error("Graph smoke check found no approved competency nodes in any candidate view.");
}

console.log(JSON.stringify({
  ok: true,
  environment: projectRef === "local" ? "local" : "staging",
  accessMode,
  cases: summaries,
  coverage: {
    completedRun: summaries.some((summary) => summary.kind.endsWith("completed")),
    pilotRun: summaries.some((summary) => summary.kind === "pilot-completed"),
    legacyFallback: summaries.some((summary) => summary.kind === "legacy"),
    activePath: summaries.some((summary) => summary.pathSteps > 0),
  },
}, null, 2));

function validateGraphView(view: StudentGraphView) {
  const nodeIds = new Set(view.nodes.map((node) => node.id));
  assert(nodeIds.size === view.nodes.length, "Graph contains duplicate nodes.");
  assert(view.meta.nodeCount === view.nodes.length, "Node metadata count is inconsistent.");
  assert(view.meta.edgeCount === view.edges.length, "Edge metadata count is inconsistent.");
  assert(view.meta.readyCount === view.nodes.filter((node) => node.isReadyToLearn).length, "Ready metadata count is inconsistent.");
  assert(view.meta.pathStepCount === view.nodes.filter((node) => node.path).length, "Path metadata count is inconsistent.");

  const edgeIds = new Set<string>();
  for (const edge of view.edges) {
    assert(!edgeIds.has(edge.id), "Graph contains duplicate edges.");
    edgeIds.add(edge.id);
    assert(nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId), "Graph contains a dangling edge.");
  }

  const pathPositions = new Set<number>();
  for (const node of view.nodes) {
    assert(Number.isFinite(node.masteryProbability) && node.masteryProbability >= 0 && node.masteryProbability <= 1, "Mastery probability is invalid.");
    assert(Number.isFinite(node.uncertainty) && node.uncertainty >= 0 && node.uncertainty <= 1, "Uncertainty is invalid.");
    assert(Number.isInteger(node.evidenceCount) && node.evidenceCount >= 0, "Evidence count is invalid.");
    assert(node.blockedBy.every((nodeId) => nodeIds.has(nodeId)), "Graph contains a dangling blocker.");
    if (node.path) {
      assert(Number.isInteger(node.path.position) && node.path.position > 0, "Path position is invalid.");
      assert(!pathPositions.has(node.path.position), "Path contains duplicate positions.");
      pathPositions.add(node.path.position);
    }
  }

  const selected = selectPersonalizedNodeIds(view);
  assert(selected.size <= 24, "Personalized graph exceeds its node budget.");
  assert([...selected].every((nodeId) => nodeIds.has(nodeId)), "Personalized graph selected an unknown node.");
  if (view.nodes.length) assert(selected.size > 0, "Non-empty graph produced an empty personalized view.");

  const positions = layoutStudentGraphNodes(view.nodes.filter((node) => selected.has(node.id)));
  assert(Object.keys(positions).length === selected.size, "Graph layout omitted a selected node.");
  assert(Object.values(positions).every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)), "Graph layout contains an invalid coordinate.");

  return {
    nodes: view.nodes.length,
    edges: view.edges.length,
    ready: view.meta.readyCount,
    pathSteps: view.meta.pathStepCount,
    personalizedNodes: selected.size,
    hardPrerequisites: view.edges.filter((edge) => edge.prerequisiteClass === "hard").length,
    softPrerequisites: view.edges.filter((edge) => edge.prerequisiteClass === "soft").length,
    unknownPrerequisites: view.edges.filter((edge) => edge.prerequisiteClass === "unknown").length,
  };
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
