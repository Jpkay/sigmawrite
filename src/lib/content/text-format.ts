export function paragraphsFromText(value: string): string[] {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\\r\\n|\\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
