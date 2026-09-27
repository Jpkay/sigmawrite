import { readFileSync, writeFileSync } from "node:fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { stableUuid } from "../src/lib/lexicon/baseline";
import { checksum } from "../src/lib/taxonomy/validate";
import type { TaxonomyCandidate } from "../src/lib/taxonomy/validate";
import type { CanonicalDiagnosticBankArtifact } from "../src/lib/diagnostic/item-bank";
import { buildV3Coverage, type LiveItemInventory, type LiveDiagnosticReview } from "../src/lib/diagnostic/granular/v3-coverage";
import { supportsIndependentProductionNode } from "../src/lib/linguistic/independent-production";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const previous = read("generated/french-taxonomy-v2.json");
const target = read("generated/french-taxonomy-v3.json");
const bank = read("generated/diagnostic-bank-v2.json") as CanonicalDiagnosticBankArtifact;
let liveItems: LiveItemInventory[] | undefined;
let liveDiagnosticReviews: LiveDiagnosticReview[] | undefined;
if (process.argv.includes("--live")) {
  config({ path: ".env.local", quiet: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw Error("Live inventory requires configured Supabase credentials");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: nodes, error } = await db.from("competency_nodes").select("id,key");
  if (error) throw Error(error.message);
  const keys = new Map(nodes.map(n => [n.id, n.key]));
  liveItems = [];
  const storedItems = new Map<string, Record<string, unknown>>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from("competency_items").select("id,primary_node_id,review_status,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,qc_gates").order("id").range(offset, offset + 999);
    if (error) throw Error(error.message);
    for (const row of data) storedItems.set(row.id, row);
    for (const row of data) liveItems.push({ nodeKey: keys.get(row.primary_node_id) ?? "unmapped", reviewStatus: row.review_status, responseType: row.response_type });
    if (data.length < 1000) break;
  }
  const choices = new Map<string, Array<{ text: string; correct: boolean; position: number }>>();
  for (let offset=0;;offset+=1000) {
    const {data,error}=await db.from("competency_item_choices").select("id,item_id,choice_text,is_correct,position").order("id").range(offset,offset+999);
    if(error) throw Error(error.message);
    for(const row of data) { const list=choices.get(row.item_id)??[]; list.push({text:row.choice_text,correct:row.is_correct,position:row.position}); choices.set(row.item_id,list); }
    if(data.length<1000) break;
  }
  liveDiagnosticReviews = bank.items.map(entry => {
    const id=stableUuid("sigmawrite-diagnostic-item", `${bank.bank.key}:${entry.itemKey}`);
    const stored=storedItems.get(id);
    if(!stored) return {itemKey:entry.itemKey,eligible:false,unchanged:false};
    const item=entry.item;
    const local={node:item.nodeKey,response:item.responseType,prompt:item.promptFr,instructions:item.instructionsFr??null,answer:item.correctAnswer??null,acceptable:item.acceptableAnswers??[],validator:item.validatorType,config:item.validatorConfig??null,choices:(item.choices??[]).map(c=>({text:c.text,correct:c.correct}))};
    const remote={node:keys.get(String(stored.primary_node_id)),response:stored.response_type,prompt:stored.prompt_fr,instructions:stored.instructions_fr??null,answer:stored.correct_answer??null,acceptable:stored.acceptable_answers??[],validator:stored.validator_type,config:stored.validator_config??null,choices:(choices.get(id)??[]).sort((a,b)=>a.position-b.position).map(({text,correct})=>({text,correct}))};
    const gates=stored.qc_gates as {gate0_computed?:{applied?:boolean}} | null;
    return {itemKey:entry.itemKey,unchanged:checksum(local)===checksum(remote),eligible:stored.review_status==="human_approved"||(stored.review_status==="auto_approved"&&stored.validator_type==="conjugator"&&gates?.gate0_computed?.applied===true)};
  });
}
const taxonomy = target.taxonomy as TaxonomyCandidate;
const rows = buildV3Coverage({ previous: previous.taxonomy, target: taxonomy, bank, liveItems, liveDiagnosticReviews,
  independentProductionKeys: new Set(taxonomy.nodes.filter(n => supportsIndependentProductionNode(n.key)).map(n => n.key)) });
const report = {
  generatedAt: new Date().toISOString(), target: { key: target.release.key, checksum: target.manifest.contentChecksum },
  previous: { key: previous.release.key, checksum: previous.manifest.contentChecksum },
  sources: { diagnosticReviews: liveDiagnosticReviews ? "Fresh live statuses; eligibility counted only for unchanged question and grading content" : "Canonical v2 artifact", practiceInventory: liveItems ? "Fresh read-only live inventory; counts are candidates, not proof of evidence compatibility" : "Not queried" },
  summary: { nodes: rows.length, evidenceDefinitions: rows.reduce((s,r) => s+r.evidence.length,0), newNodes: rows.filter(r=>!r.previousNodeExists).length,
    changedEvidenceMappings: rows.flatMap(r=>r.evidence).filter(e=>e.compatibility==="requires_mapping_review").length,
    missingApprovedItemSlots: rows.flatMap(r=>r.evidence).reduce((s,e)=>s+(e.missingApprovedItems??0),0),
    livePracticeItems: liveItems?.length ?? null, liveDiagnosticUnchanged: liveDiagnosticReviews?.filter(r=>r.unchanged).length ?? null, liveDiagnosticApprovedUnchanged: liveDiagnosticReviews?.filter(r=>r.unchanged&&r.eligible).length ?? null }, rows,
};
writeFileSync("docs/diagnostic/v3-coverage-matrix.json", JSON.stringify(report, null, 2)+"\n");
const md = ["# French v3 diagnostic coverage matrix", "", `Generated: ${report.generatedAt}`, "", "Baseline: approved French v3. Counts identify work; they do not authorize publication.", "", "| Competency | Evidence | Compatible approved v2 / required | Live approved practice candidates | Next actions |", "|---|---|---|---|---|"];
for (const row of rows) for (const e of row.evidence) md.push(`| ${row.labelFr} (${row.key}) | ${e.expectation} | ${e.approvedCompatibleLiveItems ?? e.approvedCompatibleArtifactItems} / ${e.requiredDistinct} | ${e.approvedLivePracticeCandidates ?? (e.independentProductionSupported ? "Dedicated writing activity" : "Unverified")} | ${row.actions.join(", ")} |`);
writeFileSync("docs/diagnostic/v3-coverage-matrix.md", md.join("\n")+"\n");
console.log(JSON.stringify(report.summary,null,2));
