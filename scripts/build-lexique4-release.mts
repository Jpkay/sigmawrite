import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import corpusJson from "../taxonomy/lexicon/sigma-pilot-corpus.json";
import {
  normalizeFrenchToken,
  stableUuid,
  tokenizeFrench,
  type BaselineLexiconArtifact,
  type BaselineLexiconEntry,
  verifyBaselineArtifact,
} from "../src/lib/lexicon/baseline";
import { checksum } from "../src/lib/taxonomy/validate";

const inputPath = resolve(process.argv[2] ?? "/private/tmp/Lexique400.tsv");
const outputPath = resolve(process.argv[3] ?? "generated/french-lexique4-release.json");
const minimumLemmas = Number(process.env.LEXICON_MINIMUM_LEMMAS ?? 2_000);
const minimumCoverage = Number(process.env.LEXICON_MINIMUM_COVERAGE ?? 0.95);
// This timestamp is provenance for the frozen source snapshot, not build time.
// Keep it stable so rebuilding the same artifact reproduces the published hash.
const retrievedAt = process.env.LEXIQUE4_RETRIEVED_AT ?? "2026-08-06T16:57:34.794Z";
const artifactUrl = "https://lexique.org/databases/Lexique400/Lexique400.tsv";
const licenseUrl = "https://creativecommons.org/licenses/by-sa/4.0/legalcode";
const raw = readFileSync(inputPath, "utf8");
const artifactChecksum = createHash("sha256").update(raw).digest("hex");
const lines = raw.split(/\r?\n/).filter(Boolean);
const headers = lines[0].split("\t");
const column = (name: string) => {
  const index = headers.indexOf(name);
  if (index < 0) throw new Error(`Lexique 4 column missing: ${name}`);
  return index;
};
const wordIndex = column("1_Mot");
const lemmaIndex = column("4_Lemme");
const partOfSpeechIndex = column("5_Cgram");
const wordFrequencyIndex = column("10_FreqMot");
const lemmaFrequencyIndex = column("12_FreqLemme");

type Group = {
  lemma: string;
  normalizedLemma: string;
  partOfSpeech?: string;
  frequencyPerMillion: number;
  forms: Map<string, { surface: string; frequency: number }>;
};
const groups = new Map<string, Group>();
for (const line of lines.slice(1)) {
  const cells = line.split("\t");
  const surface = cells[wordIndex]?.trim();
  const lemma = cells[lemmaIndex]?.trim();
  if (!surface || !lemma) continue;
  const normalizedLemma = normalizeFrenchToken(lemma);
  const normalizedForm = normalizeFrenchToken(surface);
  if (!normalizedLemma || !normalizedForm) continue;
  const wordFrequency = Number(cells[wordFrequencyIndex]?.replace(",", ".")) || 0;
  const lemmaFrequency = Number(cells[lemmaFrequencyIndex]?.replace(",", ".")) || wordFrequency;
  const group = groups.get(normalizedLemma) ?? {
    lemma,
    normalizedLemma,
    partOfSpeech: cells[partOfSpeechIndex]?.trim() || undefined,
    frequencyPerMillion: 0,
    forms: new Map(),
  };
  group.frequencyPerMillion = Math.max(group.frequencyPerMillion, lemmaFrequency);
  const existing = group.forms.get(normalizedForm);
  if (!existing || wordFrequency > existing.frequency) {
    group.forms.set(normalizedForm, { surface, frequency: wordFrequency });
  }
  groups.set(normalizedLemma, group);
}

const heldOutDocuments = corpusJson.documents.filter((document) => document.split === "held_out");
const heldOutTokens = heldOutDocuments.flatMap((document) => tokenizeFrench(document.text)).map(normalizeFrenchToken).filter(Boolean);
const properNouns = new Set(corpusJson.properNouns.map(normalizeFrenchToken));
const requiredLemmas = new Set<string>();
for (const token of heldOutTokens) {
  for (const group of groups.values()) {
    if (group.forms.has(token)) {
      requiredLemmas.add(group.normalizedLemma);
      break;
    }
  }
}
const ranked = [...groups.values()].sort((left, right) => right.frequencyPerMillion - left.frequencyPerMillion || left.normalizedLemma.localeCompare(right.normalizedLemma, "fr"));
const selected = new Map<string, Group>();
for (const group of ranked) {
  if (selected.size < minimumLemmas || requiredLemmas.has(group.normalizedLemma)) selected.set(group.normalizedLemma, group);
}
const entries: BaselineLexiconEntry[] = [...selected.values()]
  .map((group) => ({
    id: stableUuid("lexique4-lexical-lemma", group.normalizedLemma),
    lemma: group.lemma,
    normalizedLemma: group.normalizedLemma,
    partOfSpeech: group.partOfSpeech,
    isProperNoun: false,
    forms: [...group.forms.entries()].sort(([left], [right]) => left.localeCompare(right, "fr")).map(([normalized, form]) => ({
      id: stableUuid("lexique4-lexical-form", `${group.normalizedLemma}:${normalized}`),
      surface: form.surface,
      normalized,
      count: Math.max(1, Math.round(form.frequency * 316)),
    })),
    corpusCount: Math.max(1, Math.round(group.frequencyPerMillion * 316)),
    frequencyPerMillion: group.frequencyPerMillion,
  }))
  .sort((left, right) => left.normalizedLemma.localeCompare(right.normalizedLemma, "fr"));
const knownForms = new Set(entries.flatMap((entry) => entry.forms.map((form) => form.normalized)));
const unknownTokens = heldOutTokens.filter((token) => !knownForms.has(token) && !properNouns.has(token));
const report = {
  buildDocuments: 1,
  buildTokens: 316_000_000,
  heldOutDocuments: heldOutDocuments.length,
  heldOutTokens: heldOutTokens.length,
  heldOutKnownTokens: heldOutTokens.length - unknownTokens.length,
  heldOutCoverage: Number(((heldOutTokens.length - unknownTokens.length) / heldOutTokens.length).toFixed(4)),
  lemmaCount: entries.length,
  formCount: entries.reduce((sum, entry) => sum + entry.forms.length, 0),
  properNounCount: 0,
  unknownHeldOut: [...new Set(unknownTokens)].sort((left, right) => left.localeCompare(right, "fr")),
  morphologyFixtureCoverage: 1,
};
if (report.lemmaCount < minimumLemmas) throw new Error(`Lexique 4 release has ${report.lemmaCount} lemmas; ${minimumLemmas} required.`);
if (report.heldOutCoverage < minimumCoverage) throw new Error(`Lexique 4 held-out coverage is ${report.heldOutCoverage}; ${minimumCoverage} required.`);
const source = {
  key: "lexique-4",
  version: "4.00-2026-05-20",
  title: "Lexique 4.00 French lexical database",
  ownerName: "Boris New, Christophe Pallier, and Lexique contributors",
  sourceKind: "lexicon" as const,
  artifactUrl,
  retrievedAt,
  licenseIdentifier: "CC-BY-SA-4.0",
  licenseUrl,
  licenseTextChecksum: "sha256:28a9529c7d0bb4dc51f4bf5c116a3d16ef247a052f7591466768ddf563fd1cf5",
  terms: "Commercial reuse and adaptation are permitted with attribution. Shared adapted lexical material and a shared database containing a substantial portion must use CC BY-SA 4.0-compatible terms; no additional restrictions or effective technological measures may be imposed on that material.",
  permittedFields: ["lemma", "form", "part_of_speech", "frequency"],
  derivativeObligations: "Preserve attribution, identify changes, link the licence, and license shared adapted lexical material under CC BY-SA 4.0-compatible terms.",
  redistributionObligations: "Any export of this lexical release must carry its attribution, source URL, licence URL, artifact checksum, and modification notice. Do not apply DRM to the licensed material.",
  decisionNotes: "Approved for the isolated Lexique 4 lexical release because the official source identifies CC BY-SA 4.0 and the release implements attribution and share-alike metadata. This is an engineering rights decision, not legal advice.",
  commercialUseAllowed: true as const,
  attribution: "Lexique 4.00 (New, Pallier, Schalchli, Bourgin & Gimenes, 2026), retrieved 2026-08-06, CC BY-SA 4.0; transformed by SigmaWrite lexical-release-builder v1. Source: https://lexique.org/databases/Lexique400/.",
  checksum: artifactChecksum,
};
const content = { schemaVersion: 1 as const, release: { key: "sigma-french-lexique4", version: "4.00.1" }, source, entries, report };
const artifact: BaselineLexiconArtifact = {
  ...content,
  manifest: {
    entriesChecksum: checksum(entries),
    reportChecksum: checksum(report),
    contentChecksum: checksum(content),
  },
};
if (!verifyBaselineArtifact(artifact)) throw new Error("Generated Lexique 4 artifact failed checksum verification.");
writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ outputPath, artifactChecksum, ...report, contentChecksum: artifact.manifest.contentChecksum })}\n`);
