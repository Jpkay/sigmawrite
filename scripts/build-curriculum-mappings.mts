import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

/**
 * Builds generated/curriculum-mappings-v1.json (roadmap 4.1): every taxonomy
 * node mapped to the French programmes (cycle 3 BO 17 avril 2025, cycle 4 BO
 * 5 mars 2026), the 6e national evaluation domains and the Brevet skills.
 * Rules are keyed on node key patterns so the mapping is reproducible and
 * reviewable; run with --check to verify the committed file.
 */

type Node = { key: string; strand: string; labelFr: string; mappings: { framework: string; levelMin: string; levelMax: string }[] };
type Mapping = { nodeKey: string; framework: "cycle3" | "cycle4" | "eval6e" | "brevet"; code: string; labelFr: string; source: string };

const SOURCES = {
  cycle3: "BO n°16 du 17 avril 2025 — programme de français du cycle 3",
  cycle4: "BO du 5 mars 2026 — programme de français du cycle 4",
  eval6e: "DEPP — évaluations nationales de début de 6e (2025)",
  brevet: "DNB — épreuve de français (compréhension, grammaire, dictée, rédaction)",
};

const C3 = {
  verbe: ["C3-EDL-VERBE", "Observer le fonctionnement du verbe et l’orthographier"],
  mots: ["C3-EDL-MOTS", "Acquérir la structure, le sens et l’orthographe des mots"],
  accords: ["C3-EDL-ACCORDS", "Maîtriser la forme des mots en lien avec la syntaxe"],
  phrase: ["C3-EDL-PHRASE", "Identifier les constituants d’une phrase simple, se repérer dans la phrase complexe"],
  oralEcrit: ["C3-EDL-ORAL-ECRIT", "Maîtriser les relations entre l’oral et l’écrit"],
  lire: ["C3-LIRE-COMPRENDRE", "Comprendre un texte littéraire et l’interpréter ; comprendre des textes, des documents et des images"],
  lireControle: ["C3-LIRE-CONTROLE", "Contrôler sa compréhension, être un lecteur autonome"],
  ecrire: ["C3-ECRIRE", "Écrire à la main de manière fluide et efficace ; produire des écrits variés ; réécrire"],
} as const;

const C4 = {
  verbe: ["C4-EDL-VERBE", "Maîtriser le fonctionnement du verbe et son orthographe"],
  mots: ["C4-EDL-MOTS", "Maîtriser la structure, le sens et l’orthographe des mots"],
  accords: ["C4-EDL-ACCORDS", "Maîtriser les accords dans le groupe nominal, sujet-verbe et du participe passé"],
  phrase: ["C4-EDL-PHRASE", "Analyser la phrase simple et complexe ; maîtriser les subordonnées"],
  discours: ["C4-EDL-DISCOURS", "Construire les notions permettant l’analyse et l’élaboration des textes et des discours"],
  lire: ["C4-LIRE", "Lire des textes variés ; élaborer une interprétation de textes littéraires"],
  lireArgu: ["C4-LIRE-ARGU", "Lire des textes non littéraires, des images et des documents composites ; identifier l’argumentation"],
  ecrire: ["C4-ECRIRE", "Exploiter les principales fonctions de l’écrit ; adopter des stratégies et des procédures d’écriture efficaces"],
} as const;

const E6 = {
  langue: ["E6-EDL", "Étude de la langue : orthographe et grammaire"],
  vocab: ["E6-VOCAB", "Vocabulaire"],
  comprehension: ["E6-COMPREHENSION", "Compréhension de l’écrit"],
} as const;

const B = {
  grammaire: ["DNB-GRAMMAIRE", "Grammaire et compétences linguistiques (/50 avec la compréhension)"],
  comprehension: ["DNB-COMPREHENSION", "Compréhension et compétences d’interprétation"],
  dictee: ["DNB-DICTEE", "Dictée (/10)"],
  redaction: ["DNB-REDACTION", "Rédaction (/40)"],
} as const;

type Ref = readonly [string, string];
const rule = (test: (key: string) => boolean, cycle3: Ref | null, cycle4: Ref, eval6e: Ref | null, brevet: Ref[]) => ({ test, cycle3, cycle4, eval6e, brevet });

const RULES: Record<string, ReturnType<typeof rule>[]> = {
  conjugaison: [
    rule((k) => /participe|infinitif|forme_non_finie/u.test(k), C3.verbe, C4.accords, E6.langue, [B.grammaire, B.dictee]),
    rule((k) => /contraste|sequence_temporelle|interpreter/u.test(k), C3.verbe, C4.discours, E6.langue, [B.grammaire, B.redaction]),
    rule(() => true, C3.verbe, C4.verbe, E6.langue, [B.grammaire, B.dictee]),
  ],
  orthographe_grammaticale: [
    rule((k) => /homophones/u.test(k), C3.oralEcrit, C4.accords, E6.langue, [B.dictee, B.grammaire]),
    rule(() => true, C3.accords, C4.accords, E6.langue, [B.dictee, B.grammaire]),
  ],
  orthographe_lexicale: [
    rule((k) => /syllabes|phoneme|nasale|o_au_eau|k_c_qu|g_ge_gu|s_ss_c|m_devant/u.test(k), C3.oralEcrit, C4.mots, E6.langue, [B.dictee]),
    rule(() => true, C3.mots, C4.mots, E6.langue, [B.dictee]),
  ],
  grammaire_syntaxe: [
    rule((k) => /pronom|cod|coi|y_en|participe_cod/u.test(k), C3.accords, C4.accords, E6.langue, [B.grammaire, B.dictee]),
    rule((k) => /relation_|discours|point_de_vue|progression|chaine/u.test(k), null, C4.discours, E6.comprehension, [B.grammaire, B.redaction]),
    rule(() => true, C3.phrase, C4.phrase, E6.langue, [B.grammaire]),
  ],
  comprehension_ecrite: [
    rule((k) => /deduire_mot|sens_polysemique/u.test(k), C3.mots, C4.mots, E6.vocab, [B.comprehension]),
    rule((k) => /these|argument|preuve|fait_opinion|contre_argument|position_auteur/u.test(k), null, C4.lireArgu, E6.comprehension, [B.comprehension, B.redaction]),
    rule((k) => /resume|reformuler|selectionner/u.test(k), C3.ecrire, C4.ecrire, E6.comprehension, [B.redaction, B.comprehension]),
    rule((k) => /inferer|point_de_vue|tonalite/u.test(k), C3.lireControle, C4.lire, E6.comprehension, [B.comprehension]),
    rule(() => true, C3.lire, C4.lire, E6.comprehension, [B.comprehension]),
  ],
};

const taxonomy = JSON.parse(readFileSync("generated/french-taxonomy-v3.json", "utf8")) as { release: { key?: string; version?: string }; taxonomy: { nodes: Node[] } };
const mappings: Mapping[] = [];
for (const node of taxonomy.taxonomy.nodes) {
  const rules = RULES[node.strand] ?? [];
  const match = rules.find((entry) => entry.test(node.key));
  if (!match) throw new Error(`No curriculum rule for ${node.key}`);
  const grade = node.mappings.find((m) => m.framework === "native_grade");
  const minGrade = Number(grade?.levelMin ?? 6);
  // Cycle 3 = CM1–6e (grades 4–6); cycle 4 = 5e–3e (grades 7–9). A node first met in cycle 3 carries both.
  if (match.cycle3 && minGrade <= 6) mappings.push({ nodeKey: node.key, framework: "cycle3", code: match.cycle3[0], labelFr: match.cycle3[1], source: SOURCES.cycle3 });
  mappings.push({ nodeKey: node.key, framework: "cycle4", code: match.cycle4[0], labelFr: match.cycle4[1], source: SOURCES.cycle4 });
  if (match.eval6e && minGrade <= 6) mappings.push({ nodeKey: node.key, framework: "eval6e", code: match.eval6e[0], labelFr: match.eval6e[1], source: SOURCES.eval6e });
  for (const skill of match.brevet) mappings.push({ nodeKey: node.key, framework: "brevet", code: skill[0], labelFr: skill[1], source: SOURCES.brevet });
}

const covered = new Set(mappings.filter((m) => m.framework === "cycle3" || m.framework === "cycle4").map((m) => m.nodeKey));
for (const node of taxonomy.taxonomy.nodes) if (!covered.has(node.key)) throw new Error(`Node without programme attendu: ${node.key}`);

const body = { schemaVersion: 1, taxonomyRelease: taxonomy.release, generatedBy: "scripts/build-curriculum-mappings.mts", sources: SOURCES, mappings };
const checksum = `sha256:${createHash("sha256").update(JSON.stringify(body)).digest("hex")}`;
const output = { ...body, checksum };
const path = "generated/curriculum-mappings-v1.json";
if (process.argv.includes("--check")) {
  const existing = JSON.parse(readFileSync(path, "utf8")) as { checksum?: string };
  if (existing.checksum !== checksum) { console.error(`Curriculum mappings drifted: committed ${existing.checksum} vs rebuilt ${checksum}`); process.exit(1); }
  console.log(JSON.stringify({ ok: true, checksum, nodes: covered.size, mappings: mappings.length }));
} else {
  writeFileSync(path, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, checksum, nodes: covered.size, mappings: mappings.length }));
}
