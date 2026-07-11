export function vocabularyDifficultyFromFrequency(frequency: number) {
  if (frequency >= 100) return 15;
  if (frequency >= 30) return 30;
  if (frequency >= 10) return 45;
  if (frequency >= 3) return 60;
  if (frequency >= 1) return 75;
  return 90;
}
