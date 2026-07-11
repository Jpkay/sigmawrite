export const CONSENT_VERSION = "consent-v1";
export const PRIVACY_POLICY_VERSION = "privacy-v1";

export function ageOnDate(dateOfBirth: string, at: Date): number {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  let age = at.getUTCFullYear() - year;
  const monthDelta = at.getUTCMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && at.getUTCDate() < day)) age -= 1;
  return age;
}

export function canSelfConsent(dateOfBirth: string | null, at = new Date()): boolean {
  return !!dateOfBirth && ageOnDate(dateOfBirth, at) >= 15;
}
