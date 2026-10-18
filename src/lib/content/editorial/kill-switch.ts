/**
 * Live-generation switches (roadmap F.4 and H.15). Only automatic mechanisms
 * or the admin/teacher switch stop live texts; people never block content.
 *  - global switch (platform admin) and per-class switch (teacher / admin);
 *  - automatic quality switch: an alert moves live generation to library texts;
 *  - provider not configured: library/fallback content (fail closed, no crash).
 */

export type EditorialSettings = { liveEnabled: boolean; liveMode: "live" | "library_only"; autoSwitchReason: string | null };
export type LiveDecision = { live: boolean; reason: "ok" | "global_off" | "class_off" | "quality_auto_switch" | "provider_unconfigured" | "flag_off" };

export function resolveLiveGeneration(input: { settings: EditorialSettings | null; classSwitches: boolean[]; providerConfigured: boolean; flagEnabled: boolean }): LiveDecision {
  if (!input.flagEnabled) return { live: false, reason: "flag_off" };
  if (!input.providerConfigured) return { live: false, reason: "provider_unconfigured" };
  const settings = input.settings ?? { liveEnabled: true, liveMode: "live", autoSwitchReason: null };
  if (!settings.liveEnabled) return { live: false, reason: "global_off" };
  if (settings.liveMode === "library_only") return { live: false, reason: "quality_auto_switch" };
  // A student in several classes: any class that turned live generation off wins.
  if (input.classSwitches.some((enabled) => enabled === false)) return { live: false, reason: "class_off" };
  return { live: true, reason: "ok" };
}

/** STORY_LIVE_GENERATION defaults OFF: live AI chapters for minors need an explicit opt-in per environment. */
export function liveFlagEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.STORY_LIVE_GENERATION === "true";
}
