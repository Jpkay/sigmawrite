import { writeFileSync } from "node:fs";
import { buildInterestReadingItems } from "../src/lib/diagnostic/interest-reading-items";
import { stableUuid } from "../src/lib/lexicon/baseline";
import { runGates } from "../src/lib/ai/item-generation/pipeline";
const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
let sql = `begin;\n-- Practice-only drafts. They are never added to diagnostic memberships and must\n-- pass the normal reviewer approval before a student can receive them.\n`;
const items = buildInterestReadingItems();
for (const { key, item } of items) {
  const gate = await runGates(item, { knownNodeKeys: new Set(items.map(({ item }) => item.nodeKey)), knownMisconceptionKeys: new Set() });
  if (!gate.gates.gate1_invariants.ok || !gate.gates.gate2_answer_key.ok) throw new Error(`Invalid item ${key}`);
  sql += `\ninsert into public.competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,generation_model,prompt_version,qc_gates,review_status)\nselect ${quote(stableUuid("sigmawrite-interest-practice", key))}::uuid,n.id,'comprehension_ecrite','writing','shared','short_answer',${quote(item.promptFr)},${quote(item.instructionsFr!)},${quote(item.correctAnswer!)},'{}'::text[],'exact',${quote(JSON.stringify(item.validatorConfig))}::jsonb,50,'ai','curated-interest-reading-v1','taxonomy-v3-practice-v1',${quote(JSON.stringify(gate.gates))}::jsonb,'needs_human_review'\nfrom public.competency_nodes n where n.key=${quote(item.nodeKey)}\non conflict(id) do nothing;\n`;
}
sql += `\n-- Existing reviewed material also participates in interest-aware practice selection.\nupdate public.competency_items set validator_config=coalesce(validator_config,'{}'::jsonb) || jsonb_build_object('interestKeys',case validator_config->>'sourceTextKey'\n when 'garden' then '["environment","animals"]'::jsonb\n when 'notebook' then '["history","mystery"]'::jsonb\n when 'lighthouse' then '["travel","mystery"]'::jsonb\n when 'mangrove' then '["environment","animals"]'::jsonb\n when 'solar' then '["technology","environment"]'::jsonb\n when 'bees' then '["animals","environment"]'::jsonb\n when 'school' then '["psychology"]'::jsonb\n when 'street' then '["cars","environment","politics"]'::jsonb\n when 'library' then '["technology"]'::jsonb end)\nwhere prompt_version='diagnostic-bank-v2' and prompt_fr like 'Lis le texte.%'\n and validator_config->>'sourceTextKey' in ('garden','notebook','lighthouse','mangrove','solar','bees','school','street','library')\n and not(validator_config ? 'interestKeys');\ncommit;\n`;
writeFileSync("supabase/migrations/0133_themed_reading_practice.sql", sql);
console.log(`Built ${items.length} reviewable practice drafts.`);
