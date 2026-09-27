/** Existing results remain the default when the new runtime is activated. */
export function selectGranularRuntime(input:{enabled:boolean;hasLegacyResult:boolean;hasGranularSession:boolean;restart:boolean}) {
 return input.enabled && (input.hasGranularSession || input.restart || !input.hasLegacyResult);
}
