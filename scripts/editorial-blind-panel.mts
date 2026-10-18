/**
 * Blind panel tool (roadmap H.12). Humans do the reading; this only prepares and scores.
 *
 * Export (mix generated chapters with reference texts, anonymised):
 *   npx tsx scripts/editorial-blind-panel.mts export --panel <key> --generated <file.json> [--references <file.json>] --out <dir>
 *     generated: JSON array of { text, origin } (e.g. chapters exported from story_chapters, or smoke output)
 *     references: JSON array of { text, origin } from published children's books (licensed for internal reading);
 *                 defaults to the public-domain held-out samples in content/styles/corpus (trimmed to ~300 words).
 *   Writes <dir>/panel-sheet.md (texts for raters), <dir>/scores-template.csv, <dir>/panel-key.json (keep private).
 *
 * Import (score the panel):
 *   npx tsx scripts/editorial-blind-panel.mts score --key <dir>/panel-key.json --scores <filled.csv>
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildPanel, PANEL_SHEET_HEADER, parsePanelSheet, scorePanel, type PanelKey, type PanelSource } from "../src/lib/content/editorial/panel";

const [command] = process.argv.slice(2);
const arg = (name: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };
const trim = (text: string, words = 300) => { const out: string[] = []; let n = 0; for (const p of text.split(/\n{2,}/u)) { out.push(p); n += p.split(/\s+/u).length; if (n >= words) break; } return out.join("\n\n"); };

if (command === "export") {
  const panel = arg("panel") ?? `panel-${new Date().toISOString().slice(0, 10)}`;
  const generated = (JSON.parse(readFileSync(resolve(arg("generated") ?? ""), "utf8")) as Array<{ text: string; origin: string }>).map((g) => ({ ...g, isGenerated: true }));
  const references: PanelSource[] = arg("references")
    ? (JSON.parse(readFileSync(resolve(arg("references")!), "utf8")) as Array<{ text: string; origin: string }>).map((r) => ({ ...r, isGenerated: false }))
    : readdirSync("content/styles/corpus").filter((f) => f.endsWith(".txt")).slice(0, generated.length).map((f) => ({ text: trim(readFileSync(join("content/styles/corpus", f), "utf8").split("\n\n=====\n\n")[0]), origin: `domaine public: ${f}`, isGenerated: false }));
  const { items, key } = buildPanel([...generated, ...references], panel);
  const out = resolve(arg("out") ?? `panel-${panel}`);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "panel-sheet.md"), `# Lecture à l'aveugle — ${panel}\n\nNotez chaque texte de 1 à 5 (et la grille si possible), puis indiquez si vous pensez qu'il a été écrit par une IA (oui/non).\n\n${items.map((i) => `## ${i.code}\n\n${i.text}\n`).join("\n")}`);
  writeFileSync(join(out, "scores-template.csv"), `${PANEL_SHEET_HEADER.join(";")}\n${items.map((i) => `${i.code};;;${PANEL_SHEET_HEADER.slice(3).map(() => "").join(";")}`).join("\n")}\n`);
  writeFileSync(join(out, "panel-key.json"), JSON.stringify({ panel, key }, null, 1));
  console.log(`${items.length} textes (${generated.length} générés) → ${out}`);
} else if (command === "score") {
  const { key } = JSON.parse(readFileSync(resolve(arg("key") ?? ""), "utf8")) as { key: PanelKey[] };
  const result = scorePanel(parsePanelSheet(readFileSync(resolve(arg("scores") ?? ""), "utf8")), key);
  console.log(JSON.stringify(result, null, 1));
  console.log(result.passed ? "PASS: generated ≥ 4/5 and detection ≤ 60%" : "NOT PASSED (does not block any student story; improve prompts / style cards and rerun)");
} else {
  console.log("usage: editorial-blind-panel.mts export|score …");
}
