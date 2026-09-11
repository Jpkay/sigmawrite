import type { Mode, Skill, SkillResult } from "./engine";
export type Priority = {
  skillId: string;
  action: "verify" | "learn" | "consolidate";
  modes: Mode[];
  reason: "unverified_foundation" | "provisional_gap" | "demonstrated_gap" | "mixed_evidence" | "insufficient_evidence";
};

/** The first activities are justified by node evidence; they are not a global level. */
export function buildGranularPriorities(skills: readonly Skill[], results: readonly SkillResult[], limit = 5): Priority[] {
  const byId = new Map(skills.map(s => [s.id,s]));
  const evidence = new Map(results.map(r => [r.skillId,r]));
  const emitted = new Set<string>(), visiting = new Set<string>();
  const priorities: Priority[] = [];
  const visit = (skill: Skill, foundation = false) => {
    if (emitted.has(skill.id) || priorities.length >= limit) return;
    if (visiting.has(skill.id)) throw new Error("Cyclic learning prerequisites");
    const result = evidence.get(skill.id);
    if (result?.status === "mastered" && result.resolved) return;
    visiting.add(skill.id);
    for (const id of skill.prerequisites) {
      const prerequisite = byId.get(id);
      if (!prerequisite) throw new Error(`Missing prerequisite ${id}`);
      visit(prerequisite,true);
    }
    visiting.delete(skill.id);
    if (priorities.length >= limit) return;
    emitted.add(skill.id);
    const unconfirmed = !result?.resolved;
    const provisionalGap=unconfirmed&&result?.modes.some(mode=>mode.provisionalGap===true&&mode.probability<=.2);
    priorities.push({ skillId: skill.id,
      action: provisionalGap ? "learn" : unconfirmed ? "verify" : result.status === "missing" ? "learn" : "consolidate",
      modes: skill.modes.filter(mode => {
        const observed = result?.modes.find(m => m.mode === mode);
        return provisionalGap?observed?.provisionalGap===true&&observed.probability<=.2:!observed?.confirmed || observed.probability < .85;
      }),
      reason: provisionalGap ? "provisional_gap" : unconfirmed ? foundation ? "unverified_foundation" : "insufficient_evidence"
        : result.status === "missing" ? "demonstrated_gap" : "mixed_evidence",
    });
  };
  const rank = (id: string) => {
    const result = evidence.get(id);
    return result?.resolved && result.status === "missing" || result?.modes.some(mode=>mode.provisionalGap===true&&mode.probability<=.2) ? 0
      : result?.resolved && result.status === "fragile" ? 1 : 2;
  };
  for (const skill of [...skills].sort((a,b) => rank(a.id)-rank(b.id) || a.level-b.level || a.id.localeCompare(b.id))) visit(skill);
  return priorities;
}
