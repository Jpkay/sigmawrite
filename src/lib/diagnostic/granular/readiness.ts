import { DEFAULT_POLICY, type Mode, type Policy, type Probe, type Skill } from "./engine";
export type ReviewedProbe = Probe & { reviewStatus: "draft" | "approved" | "rejected" };
export type CoverageIssue = { skillId: string; mode?: Mode; reason: "missing_items" | "missing_contexts" | "missing_learning_activity" | "missing_prerequisite" | "cycle" };

/** A large overall bank must never conceal missing coverage for individual skills. */
export function assessGranularReadiness(
  skills: readonly Skill[], bank: readonly ReviewedProbe[], learningSkillIds: ReadonlySet<string>, policy: Policy = DEFAULT_POLICY,
) {
  const issues: CoverageIssue[] = [];
  const ids = new Set(skills.map(s => s.id));
  if (ids.size !== skills.length || new Set(bank.map(i => i.id)).size !== bank.length) throw new Error("Duplicate skill or item ID");
  for (const item of bank) {
    const skill = skills.find(s => s.id === item.skillId);
    if (!skill || !skill.modes.includes(item.mode)) throw new Error(`Invalid item target: ${item.id}`);
    if (!item.contextId || !Number.isFinite(item.expectedSeconds) || item.expectedSeconds <= 0 || !Number.isFinite(item.guessProbability) || item.guessProbability <= 0 || item.guessProbability >= 1) {
      throw new Error(`Invalid item metadata: ${item.id}`);
    }
  }
  const approved = bank.filter(i => i.reviewStatus === "approved");
  for (const skill of skills) {
    if (!skill.modes.length) throw new Error(`Skill has no assessment modes: ${skill.id}`);
    for (const mode of skill.modes) {
      const items = approved.filter(i => i.skillId === skill.id && i.mode === mode);
      // Reserve another full confirmation set for contradictions and later verification.
      if (items.length < 2 * policy.minimumItemsPerMode) issues.push({ skillId: skill.id, mode, reason: "missing_items" });
      if (new Set(items.map(i => i.contextId)).size < 2 * policy.minimumContextsPerMode) issues.push({ skillId: skill.id, mode, reason: "missing_contexts" });
    }
    if (!learningSkillIds.has(skill.id)) issues.push({ skillId: skill.id, reason: "missing_learning_activity" });
    if (skill.prerequisites.some(id => !ids.has(id))) issues.push({ skillId: skill.id, reason: "missing_prerequisite" });
  }
  const visited = new Set<string>(), visiting = new Set<string>();
  const byId = new Map(skills.map(s => [s.id, s]));
  const walk = (id: string) => {
    if (visiting.has(id)) { issues.push({ skillId: id, reason: "cycle" }); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) walk(prerequisite);
    visiting.delete(id); visited.add(id);
  };
  for (const skill of skills) walk(skill.id);
  return { ready: skills.length > 0 && issues.length === 0, skillCount: skills.length, approvedItemCount: approved.length, issues };
}
