/**
 * Public-domain corpus preparation for the style library (roadmap H.7/H.8).
 * Pure functions: the fetch script downloads, these clean and cut.
 */

const START = /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\n/iu;
const END = /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/iu;

/** Removes the Gutenberg licence wrapper, editorial notes and typographic artefacts. */
export function cleanGutenbergText(raw: string, options: { startMarker?: string; endMarker?: string } = {}): string {
  let text = raw.replace(/\r\n?/gu, "\n").normalize("NFC");
  const start = text.search(START);
  if (start >= 0) text = text.slice(start).replace(START, "");
  const end = text.search(END);
  if (end >= 0) text = text.slice(0, end);
  if (options.startMarker) {
    const index = text.indexOf(options.startMarker);
    if (index < 0) throw new Error(`start marker not found: ${options.startMarker}`);
    text = text.slice(index);
  }
  if (options.endMarker) {
    const index = text.indexOf(options.endMarker);
    if (index < 0) throw new Error(`end marker not found: ${options.endMarker}`);
    text = text.slice(0, index);
  }
  return text
    .replace(/\[(?:Illustration|Note|Footnote)[^\]]*\]/giu, "")
    .replace(/\[\d+\]/gu, "")
    .replace(/_([^_]+)_/gu, "$1")
    .replace(/^[ \t]*-{3,}[ \t]*$/gmu, "")
    .replace(/^[ \t]*--[ \t]*/gmu, "— ")
    .replace(/[ \t]*--[ \t]*/gu, " — ")
    .replace(/[ \t]+$/gmu, "")
    .split(/\n{2,}/u)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/gu, " ").trim())
    .filter((paragraph) => paragraph.length > 0 && !paragraph.startsWith("["))
    .filter((paragraph) => !/version électronique|orthographe a été conservée|ponctuation n'a pas été modifiée|^au lecteur$/iu.test(paragraph))
    // Headings, tables of contents and transcriber notes are not prose.
    .filter((paragraph) => !(paragraph === paragraph.toLocaleUpperCase("fr") && paragraph.length < 120))
    .filter((paragraph) => !/^(table des matières|chapitre [ivxlc\d]+\.?$|produced by|end of)/iu.test(paragraph))
    .join("\n\n");
}

export function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;
}

/** Splits prose into consecutive chunks of about `size` words on paragraph boundaries. */
export function chunkByWords(text: string, size: number): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let count = 0;
  for (const paragraph of text.split(/\n{2,}/u)) {
    current.push(paragraph);
    count += wordCount(paragraph);
    if (count >= size) {
      chunks.push(current.join("\n\n"));
      current = [];
      count = 0;
    }
  }
  if (count >= size / 2) chunks.push(current.join("\n\n"));
  return chunks;
}

/** Word n-grams (lower-cased) used by the copying gate. */
export function wordNgrams(text: string, n: number): Set<string> {
  const words = (text.toLocaleLowerCase("fr").match(/[\p{L}\p{N}]+/gu) ?? []);
  const grams = new Set<string>();
  for (let index = 0; index + n <= words.length; index += 1) grams.add(words.slice(index, index + n).join(" "));
  return grams;
}
