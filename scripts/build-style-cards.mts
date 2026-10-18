/**
 * Builds the measured half of every public-domain style card (roadmap H.8).
 *
 *   npx tsx scripts/fetch-style-corpus.mts <cacheDir>
 *   npx tsx scripts/build-style-cards.mts <cacheDir>
 *
 * Output (committed):
 *   content/styles/index.json            measured profiles, Delta basis, verbatim excerpts, validation
 *   content/styles/corpus/<author>.txt   two held-out ~1500-word samples per author (public domain)
 *
 * Held-out samples are never used to build the card. The validation section
 * records whether each held-out sample lands closest to its own author.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chunkByWords, wordCount } from "../src/lib/content/editorial/corpus";
import { attributionDistance, averageProfiles, buildAttributionBasis, measureStyle, type MeasuredStyle } from "../src/lib/content/editorial/stylometry";

type Source = { author: string; gutenbergId: number; title: string };
const sources = (JSON.parse(readFileSync(resolve("content/styles/sources.json"), "utf8")) as { sources: Source[] }).sources;
const cacheDir = resolve(process.argv[2] ?? process.env.STYLE_CORPUS_DIR ?? join(tmpdir(), "plume-style-corpus"));
const CHUNK = 1500;
const files = readdirSync(cacheDir);

const authors = [...new Set(sources.map((s) => s.author))];
const training = new Map<string, MeasuredStyle[]>();
const heldOut = new Map<string, string[]>();
const excerpts = new Map<string, Array<{ text: string; source: string; gutenbergId: number }>>();

for (const author of authors) {
  const own = sources.filter((s) => s.author === author);
  const chunks: Array<{ text: string; source: Source }> = [];
  for (const source of own) {
    const file = files.find((name) => name === `${author}-${source.gutenbergId}.txt`);
    if (!file) throw new Error(`missing cached text for ${author} ${source.gutenbergId}; run fetch-style-corpus first`);
    const text = readFileSync(join(cacheDir, file), "utf8");
    for (const chunk of chunkByWords(text, CHUNK)) chunks.push({ text: chunk, source });
  }
  if (chunks.length < 4) throw new Error(`${author}: not enough text (${chunks.length} chunks)`);
  // Deterministic hold-out: chunks at one third and two thirds of the corpus.
  const holdIndexes = new Set([Math.floor(chunks.length / 3), Math.floor((2 * chunks.length) / 3)]);
  heldOut.set(author, chunks.filter((_, index) => holdIndexes.has(index)).map((c) => c.text));
  const train = chunks.filter((_, index) => !holdIndexes.has(index));
  training.set(author, train.map((c) => measureStyle(c.text)));
  // Verbatim excerpts: narrative paragraphs of 60–150 words, evenly spaced, from training text only.
  const candidates = train.flatMap((c) => c.text.split(/\n{2,}/u).map((p) => ({ p, source: c.source })))
    .filter(({ p }) => { const n = wordCount(p); return n >= 60 && n <= 150 && !/^[—–«]/u.test(p) && /[.!?»]$/u.test(p); });
  const picked = [0.2, 0.5, 0.8].map((f) => candidates[Math.floor(f * (candidates.length - 1))]).filter(Boolean);
  excerpts.set(author, picked.map(({ p, source }) => ({ text: p, source: source.title, gutenbergId: source.gutenbergId })));
}

const allTraining = [...training.values()].flat();
const basis = buildAttributionBasis(allTraining);
const cards: Record<string, { measured: MeasuredStyle; excerpts: unknown[]; sources: Source[]; corpusWords: number }> = {};
for (const author of authors) {
  const measured = averageProfiles(training.get(author)!);
  cards[author] = { measured, excerpts: excerpts.get(author)!, sources: sources.filter((s) => s.author === author), corpusWords: measured.words };
}

// Validation: each held-out sample must land closest to its own author.
const results: Array<{ author: string; sample: number; nearest: string; delta: number; ownDelta: number }> = [];
for (const author of authors) {
  heldOut.get(author)!.forEach((sample, index) => {
    const profile = measureStyle(sample);
    const ranked = authors.map((other) => ({ other, delta: attributionDistance(profile, cards[other].measured, basis) })).sort((a, b) => a.delta - b.delta);
    results.push({ author, sample: index, nearest: ranked[0].other, delta: Number(ranked[0].delta.toFixed(3)), ownDelta: Number(ranked.find((r) => r.other === author)!.delta.toFixed(3)) });
  });
}
const correct = results.filter((r) => r.nearest === r.author).length;

for (const author of authors) writeFileSync(resolve(`content/styles/corpus/${author}.txt`), `${heldOut.get(author)!.join("\n\n=====\n\n")}\n`);
writeFileSync(resolve("content/styles/index.json"), `${JSON.stringify({
  schemaVersion: 1,
  method: "stylometry-v1: Burrows' Delta on function words + 0.35 × z-distance on surface features (src/lib/content/editorial/stylometry.ts)",
  chunkWords: CHUNK,
  basis,
  cards,
  validation: { heldOutSamples: results.length, correct, accuracy: Number((correct / results.length).toFixed(3)), results },
}, null, 1)}\n`);
console.log(`held-out accuracy ${correct}/${results.length}`);
for (const r of results.filter((x) => x.nearest !== x.author)) console.log(`  miss: ${r.author}#${r.sample} → ${r.nearest} (${r.delta} vs own ${r.ownDelta})`);
