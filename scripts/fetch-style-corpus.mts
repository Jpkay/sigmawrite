/**
 * Downloads the public-domain style corpus listed in content/styles/sources.json
 * (roadmap H.7/H.8) into a local cache that is NOT committed.
 *
 *   npx tsx scripts/fetch-style-corpus.mts [cacheDir]
 *
 * Then run scripts/build-style-cards.mts with the same cache directory.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { cleanGutenbergText } from "../src/lib/content/editorial/corpus";

type Source = { author: string; gutenbergId: number; title: string; startMarker?: string; endMarker?: string };
const sources = (JSON.parse(readFileSync(resolve("content/styles/sources.json"), "utf8")) as { sources: Source[] }).sources;
const cacheDir = resolve(process.argv[2] ?? process.env.STYLE_CORPUS_DIR ?? join(tmpdir(), "plume-style-corpus"));
mkdirSync(cacheDir, { recursive: true });

for (const source of sources) {
  const rawPath = join(cacheDir, `${source.gutenbergId}.raw.txt`);
  if (!existsSync(rawPath)) {
    const response = await fetch(`https://www.gutenberg.org/cache/epub/${source.gutenbergId}/pg${source.gutenbergId}.txt`);
    if (!response.ok) throw new Error(`download failed for ${source.gutenbergId}: ${response.status}`);
    writeFileSync(rawPath, await response.text());
  }
  const raw = readFileSync(rawPath, "utf8");
  if (!/Language:\s*French/iu.test(raw)) throw new Error(`${source.gutenbergId} is not declared as French`);
  const cleaned = cleanGutenbergText(raw, source);
  writeFileSync(join(cacheDir, `${source.author}-${source.gutenbergId}.txt`), cleaned);
  console.log(`${source.author}\t${source.gutenbergId}\t${cleaned.length} chars\t${source.title}`);
}
console.log(`cache: ${cacheDir}`);
