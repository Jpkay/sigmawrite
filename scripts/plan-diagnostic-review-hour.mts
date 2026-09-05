import { readFileSync, writeFileSync } from "node:fs";
import type { FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";
import { PARTIAL_PUBLICATION_FLOORS } from "../src/lib/diagnostic/protocol";
import { validateCanonicalDiagnosticBank, type CanonicalDiagnosticBankArtifact } from "../src/lib/diagnostic/item-bank";

/**
 * Smallest set of pending diagnostic items whose approval makes every section
 * publishable in partial mode (roadmap 0.1, partial publication approved
 * 2026-09-05). Greedy per section: complete the cheapest nodes until two are
 * confirmable, then production items, node coverage and the item floor. The
 * result is verified by simulating the approvals through the validator and
 * written as a reviewer checklist.
 *
 *   npx tsx --tsconfig ./tsconfig.json scripts/plan-diagnostic-review-hour.mts [docs/pilot/review-hour-plan.md]
 */
const taxonomy = JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")) as FrenchTaxonomyV2Artifact;
const bank = JSON.parse(readFileSync("generated/diagnostic-bank-v2.json", "utf8")) as CanonicalDiagnosticBankArtifact;
type Entry = CanonicalDiagnosticBankArtifact["items"][number];
type EvidenceDef = { key: string; expectation: string; successCriteria: { minimumDistinctItems?: number; minimumDistinctTexts?: number } };
const nodeByKey = new Map(taxonomy.taxonomy.nodes.map((node) => [node.key, node as unknown as { evidence: EvidenceDef[] }]));
const approved = (entry: Entry) => entry.reviewStatus === "human_approved" || (entry.reviewStatus === "auto_approved" && entry.item.validatorType === "conjugator");
const pending = (entry: Entry) => entry.reviewStatus === "needs_human_review";

type Pick = { itemKey: string; nodeKey: string; evidenceKey: string; expectation: string; prompt: string; reason: string };
const plan: Record<string, Pick[]> = {};
for (const section of ["reading_comprehension", "grammar", "spelling", "conjugation"]) {
  const entries = bank.items.filter((entry) => entry.sectionKey === section);
  const picked = new Set<string>();
  const out: Pick[] = [];
  const pick = (entry: Entry, reason: string) => { if (!picked.has(entry.itemKey)) { picked.add(entry.itemKey); out.push({ itemKey: entry.itemKey, nodeKey: entry.item.nodeKey, evidenceKey: entry.evidenceKey, expectation: entry.evidenceExpectation, prompt: entry.item.promptFr, reason }); } };
  const isApproved = (entry: Entry) => approved(entry) || picked.has(entry.itemKey);

  const deficits = [...new Set(entries.map((entry) => entry.item.nodeKey))].map((nodeKey) => {
    const required = (nodeByKey.get(nodeKey)?.evidence ?? []).filter((evidence) => evidence.expectation !== "independent_production");
    let needed: Entry[] = []; let feasible = required.length > 0;
    for (const evidence of required) {
      const minimum = Math.max(2, Number(evidence.successCriteria.minimumDistinctItems ?? evidence.successCriteria.minimumDistinctTexts ?? 2));
      const have = entries.filter((entry) => entry.item.nodeKey === nodeKey && entry.evidenceKey === evidence.key && isApproved(entry)).length;
      const pool = entries.filter((entry) => entry.item.nodeKey === nodeKey && entry.evidenceKey === evidence.key && pending(entry));
      const gap = Math.max(0, minimum - have);
      if (gap > pool.length) feasible = false; else needed = needed.concat(pool.slice(0, gap));
    }
    return { nodeKey, feasible, needed };
  }).filter((deficit) => deficit.feasible).sort((a, b) => a.needed.length - b.needed.length);
  const confirmable = deficits.filter((deficit) => deficit.needed.length === 0).length;
  for (const deficit of deficits.filter((deficit) => deficit.needed.length > 0).slice(0, Math.max(0, 2 - confirmable))) {
    for (const entry of deficit.needed) pick(entry, `rend le nœud ${deficit.nodeKey} confirmable`);
  }
  const minimumProduction = section === "reading_comprehension" || section === "grammar" ? 2 : 4;
  let production = entries.filter((entry) => entry.evidenceExpectation !== "receptive" && isApproved(entry)).length;
  for (const entry of entries.filter((entry) => entry.evidenceExpectation !== "receptive" && pending(entry))) { if (production >= minimumProduction) break; pick(entry, "item de production"); production++; }
  const nodesWith = () => new Set(entries.filter(isApproved).map((entry) => entry.item.nodeKey)).size;
  for (const entry of entries.filter(pending).sort((a, b) => a.item.nodeKey.localeCompare(b.item.nodeKey))) {
    if (nodesWith() >= PARTIAL_PUBLICATION_FLOORS.minNodesWithItems) break;
    if (!entries.some((other) => other.item.nodeKey === entry.item.nodeKey && isApproved(other))) pick(entry, "nouveau nœud couvert");
  }
  for (const entry of entries.filter(pending)) { if (entries.filter(isApproved).length >= PARTIAL_PUBLICATION_FLOORS.minApprovedItems) break; pick(entry, "plancher d’items approuvés"); }
  plan[section] = out;
}

// Prove it: simulate the approvals and run the real validator.
const chosen = new Set(Object.values(plan).flat().map((entry) => entry.itemKey));
const simulated: CanonicalDiagnosticBankArtifact = {
  ...bank,
  items: bank.items.map((entry) => chosen.has(entry.itemKey)
    ? { ...entry, reviewStatus: "human_approved" as const, review: { reviewerProfileId: "simulation", reviewedAt: new Date().toISOString() } as Entry["review"] }
    : entry),
};
const result = validateCanonicalDiagnosticBank(simulated, taxonomy.taxonomy);
const sectionsReady = result.sections.every((section) => section.ready);
const total = chosen.size;

const output = process.argv[2] ?? "docs/pilot/review-hour-plan.md";
const lines: string[] = [
  `# Plan de relecture prioritaire — ${new Date().toISOString().slice(0, 10)}`,
  "",
  `${total} items à relire pour publier la banque diagnostique v2 en mode partiel (planchers : ${PARTIAL_PUBLICATION_FLOORS.minApprovedItems} items approuvés et ${PARTIAL_PUBLICATION_FLOORS.minNodesWithItems} nœuds par section, deux nœuds confirmables, items de production). Les ${result.pendingItemCount} autres items en attente continuent d’être relus après la mise en service ; ils ne sont jamais servis avant approbation.`,
  "",
  `Vérification par simulation : ${sectionsReady && result.valid ? "toutes les sections sont prêtes une fois ces items approuvés" : `INSUFFISANT — ${result.issues.join("; ")}`}.`,
  "",
  "Dans le portail `/admin/items/review`, traiter ces clés en premier. Une décision « rejeter » sur l’un d’eux impose de relancer ce script.",
  "",
];
for (const [section, picks] of Object.entries(plan)) {
  lines.push(`## ${section} — ${picks.length} item(s)`, "");
  if (picks.length === 0) { lines.push("Aucun : la section est déjà prête.", ""); continue; }
  lines.push("| Clé | Nœud | Preuve | Pourquoi | Énoncé |", "| --- | --- | --- | --- | --- |");
  for (const entry of picks) lines.push(`| \`${entry.itemKey}\` | ${entry.nodeKey} | ${entry.evidenceKey} (${entry.expectation}) | ${entry.reason} | ${entry.prompt.replace(/\|/gu, "\\|").slice(0, 140)} |`);
  lines.push("");
}
writeFileSync(output, `${lines.join("\n")}\n`);
console.log(JSON.stringify({ total, perSection: Object.fromEntries(Object.entries(plan).map(([key, value]) => [key, value.length])), simulatedValid: result.valid && sectionsReady, output }));
if (!(result.valid && sectionsReady)) process.exit(1);
