export function stripAuthoringVariantPrefix(prompt: string): string {
  return prompt.replace(/^Cas\s+[1-3]\s*[—–-]\s*/u, "");
}

export function formatNativeGradeRange(levelMin: string | null, levelMax: string | null): string | null {
  if (!levelMin && !levelMax) return null;
  const label = (level: string) => level === "2" ? "2de" : `${level}e`;
  const minimum = levelMin ?? levelMax;
  const maximum = levelMax ?? levelMin;
  if (!minimum || !maximum) return null;
  return minimum === maximum ? label(minimum) : `${label(minimum)}–${label(maximum)}`;
}

export function formatFrameworkRange(levelMin: string | null, levelMax: string | null): string | null {
  if (!levelMin && !levelMax) return null;
  const minimum = levelMin ?? levelMax;
  const maximum = levelMax ?? levelMin;
  if (!minimum || !maximum) return null;
  return minimum === maximum ? minimum : `${minimum}–${maximum}`;
}
