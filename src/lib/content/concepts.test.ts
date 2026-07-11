import{describe,expect,it}from"vitest";import{CONTENT_CONCEPTS,conceptPrerequisiteClosure,resolveTopicConcepts}from"./concepts";
describe("content concept and topic model",()=>{
it("maps one topic to several background concepts, not language competencies",()=>{const r=resolveTopicConcepts("Comment les élections sont présentées sur les réseaux sociaux ?");expect(r.conceptKeys).toEqual(expect.arrayContaining(["election_democratique","attention_numerique"]));expect(r.conceptKeys.some(k=>k.includes("conjug")||k.includes("lecture"))).toBe(false);expect(r.risk).toBe("high");expect(r.sourceRequirement).toBe("current_primary_sources");});
it("lists concepts that must be explained from familiarity",()=>{const r=resolveTopicConcepts("Comprendre le cycle de l'eau",{cycle_eau:.2});expect(r.conceptsToExplain).toContain("cycle_eau");expect(conceptPrerequisiteClosure(r.conceptKeys)).toContain("changement_et_cycle");});
it("has risk and source policy for every concept",()=>{expect(CONTENT_CONCEPTS.every(c=>c.risk&&c.sourceRequirement)).toBe(true);expect(CONTENT_CONCEPTS.filter(c=>c.risk==="high").every(c=>c.sourceRequirement==="current_primary_sources")).toBe(true);});
});

