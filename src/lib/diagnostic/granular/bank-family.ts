/** Each revision is a separate immutable bank; legacy v2 never enters this path. */
export function isFrenchGranularBankKey(key:string) {
 return /^french-diagnostic-bank-v3(?:-r[1-9][0-9]*)?$/.test(key) && key === key.trim();
}
