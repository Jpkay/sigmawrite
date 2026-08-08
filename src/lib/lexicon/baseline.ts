import { createHash } from "node:crypto";
import { z } from "zod";
import { checksum, stableJson } from "../taxonomy/validate";

const sourceSchema = z.object({
  key: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  sourceKind: z.enum(["lexicon", "frequency", "morphology", "original"]).optional(),
  artifactUrl: z.string().url().optional(),
  retrievedAt: z.string().datetime().optional(),
  licenseIdentifier: z.string().min(1),
  licenseUrl: z.string().url().optional(),
  licenseTextChecksum: z.string().min(1).optional(),
  terms: z.string().min(1),
  permittedFields: z.array(z.string().min(1)).min(1).optional(),
  derivativeObligations: z.string().min(1).optional(),
  redistributionObligations: z.string().min(1).optional(),
  decisionNotes: z.string().min(1).optional(),
  commercialUseAllowed: z.literal(true),
  attribution: z.string().min(1),
});

export const baselineCorpusSchema = z.object({
  release: z.object({ key: z.string().min(1), version: z.string().min(1) }),
  source: sourceSchema,
  documents: z.array(z.object({
    id: z.string().min(1),
    textType: z.enum(["literary", "informational", "argumentative"]),
    split: z.enum(["build", "held_out"]),
    text: z.string().min(20),
  })).min(2),
  lemmaOverrides: z.record(z.string(), z.string()).default({}),
  partOfSpeech: z.record(z.string(), z.string()).default({}),
  properNouns: z.array(z.string()).default([]),
});

export type BaselineCorpus = z.infer<typeof baselineCorpusSchema>;

export type BaselineLexiconEntry = {
  id: string;
  lemma: string;
  normalizedLemma: string;
  partOfSpeech?: string;
  isProperNoun: boolean;
  forms: Array<{ id: string; surface: string; normalized: string; count: number }>;
  corpusCount: number;
  frequencyPerMillion: number;
};

export type BaselineLexiconArtifact = {
  schemaVersion: 1;
  release: BaselineCorpus["release"];
  source: BaselineCorpus["source"] & { checksum: string };
  entries: BaselineLexiconEntry[];
  report: {
    buildDocuments: number;
    buildTokens: number;
    heldOutDocuments: number;
    heldOutTokens: number;
    heldOutKnownTokens: number;
    heldOutCoverage: number;
    lemmaCount: number;
    formCount: number;
    properNounCount: number;
    unknownHeldOut: string[];
    morphologyFixtureCoverage: number;
  };
  manifest: {
    entriesChecksum: string;
    reportChecksum: string;
    contentChecksum: string;
  };
};

export function normalizeFrenchToken(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("fr")
    .replaceAll("’", "'")
    .replace(/^[\-'\s]+|[\-'\s]+$/g, "");
}

export function tokenizeFrench(text: string): string[] {
  return text.normalize("NFC").match(/[\p{L}]+(?:['’\-][\p{L}]+)*/gu) ?? [];
}

function inferredLemma(surface: string, overrides: Record<string, string>): string {
  const normalized = normalizeFrenchToken(surface);
  if (overrides[normalized]) return normalizeFrenchToken(overrides[normalized]);
  if (normalized.length > 4 && normalized.endsWith("es")) return normalized.slice(0, -2);
  if (normalized.length > 3 && normalized.endsWith("s") && !normalized.endsWith("us")) return normalized.slice(0, -1);
  if (normalized.length > 4 && normalized.endsWith("ées")) return `${normalized.slice(0, -3)}er`;
  if (normalized.length > 3 && normalized.endsWith("ée")) return `${normalized.slice(0, -2)}er`;
  return normalized;
}

export function stableUuid(namespace: string, value: string): string {
  const hex = createHash("sha256").update(`${namespace}:${value}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const joined = hex.join("");
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}

function coverage(tokens: string[], knownForms: Set<string>, properNouns: Set<string>) {
  const normalized = tokens.map(normalizeFrenchToken).filter(Boolean);
  const unknown = normalized.filter((token) => !knownForms.has(token) && !properNouns.has(token));
  return {
    total: normalized.length,
    known: normalized.length - unknown.length,
    ratio: normalized.length === 0 ? 1 : Number(((normalized.length - unknown.length) / normalized.length).toFixed(4)),
    unknown: [...new Set(unknown)].sort(),
  };
}

export function buildBaselineLexicon(input: unknown): BaselineLexiconArtifact {
  const corpus = baselineCorpusSchema.parse(input);
  const buildDocuments = corpus.documents.filter((document) => document.split === "build");
  const heldOutDocuments = corpus.documents.filter((document) => document.split === "held_out");
  const buildTokens = buildDocuments.flatMap((document) => tokenizeFrench(document.text));
  const formCounts = new Map<string, { surface: string; count: number }>();
  for (const surface of buildTokens) {
    const normalized = normalizeFrenchToken(surface);
    const current = formCounts.get(normalized);
    formCounts.set(normalized, { surface: current?.surface ?? surface, count: (current?.count ?? 0) + 1 });
  }
  const properNouns = new Set(corpus.properNouns.map(normalizeFrenchToken));
  const groups = new Map<string, BaselineLexiconEntry>();
  for (const [normalized, form] of [...formCounts.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const lemma = inferredLemma(normalized, corpus.lemmaOverrides);
    const entry = groups.get(lemma) ?? {
      id: stableUuid("sigmawrite-lexical-lemma", lemma),
      lemma,
      normalizedLemma: lemma,
      partOfSpeech: corpus.partOfSpeech[lemma],
      isProperNoun: properNouns.has(normalized) || properNouns.has(lemma),
      forms: [],
      corpusCount: 0,
      frequencyPerMillion: 0,
    };
    entry.forms.push({
      id: stableUuid("sigmawrite-lexical-form", `${lemma}:${normalized}`),
      surface: form.surface,
      normalized,
      count: form.count,
    });
    entry.corpusCount += form.count;
    groups.set(lemma, entry);
  }
  const entries = [...groups.values()]
    .map((entry) => ({
      ...entry,
      forms: [...entry.forms].sort((left, right) => left.normalized.localeCompare(right.normalized)),
      frequencyPerMillion: Number(((entry.corpusCount / buildTokens.length) * 1_000_000).toFixed(3)),
    }))
    .sort((left, right) => left.normalizedLemma.localeCompare(right.normalizedLemma));
  const knownForms = new Set(entries.flatMap((entry) => entry.forms.map((form) => form.normalized)));
  const heldOut = coverage(heldOutDocuments.flatMap((document) => tokenizeFrench(document.text)), knownForms, properNouns);
  const morphologyFixtures = Object.keys(corpus.lemmaOverrides);
  const resolvedFixtures = morphologyFixtures.filter((form) => groups.has(inferredLemma(form, corpus.lemmaOverrides))).length;
  const sourceChecksum = checksum({ source: corpus.source, documents: buildDocuments });
  const report = {
    buildDocuments: buildDocuments.length,
    buildTokens: buildTokens.length,
    heldOutDocuments: heldOutDocuments.length,
    heldOutTokens: heldOut.total,
    heldOutKnownTokens: heldOut.known,
    heldOutCoverage: heldOut.ratio,
    lemmaCount: entries.length,
    formCount: entries.reduce((sum, entry) => sum + entry.forms.length, 0),
    properNounCount: entries.filter((entry) => entry.isProperNoun).length,
    unknownHeldOut: heldOut.unknown,
    morphologyFixtureCoverage: morphologyFixtures.length === 0 ? 1 : Number((resolvedFixtures / morphologyFixtures.length).toFixed(4)),
  };
  const artifactWithoutManifest = {
    schemaVersion: 1 as const,
    release: corpus.release,
    source: { ...corpus.source, checksum: sourceChecksum },
    entries,
    report,
  };
  return {
    ...artifactWithoutManifest,
    manifest: {
      entriesChecksum: checksum(entries),
      reportChecksum: checksum(report),
      contentChecksum: checksum(artifactWithoutManifest),
    },
  };
}

export function verifyBaselineArtifact(artifact: BaselineLexiconArtifact): boolean {
  const { manifest, ...content } = artifact;
  return manifest.entriesChecksum === checksum(artifact.entries)
    && manifest.reportChecksum === checksum(artifact.report)
    && manifest.contentChecksum === checksum(content)
    && stableJson(artifact) === stableJson(JSON.parse(JSON.stringify(artifact)));
}
