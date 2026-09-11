import {z} from "zod";
import type {Skill} from "./engine";
const ids=z.array(z.string().trim().min(1));
const schema=z.object({
 version:z.literal("french-granular-release-scope-v1"),
 assessmentSkillIds:ids.min(1),
 teachingSkillIds:ids,
 limitationFr:z.string().trim().min(1),
}).strict();
/** Availability only. Scope never edits the approved graph or evidence rules. */
export type ReleaseScope=z.infer<typeof schema>;
export function inspectReleaseScope(skills:readonly Skill[],raw:unknown){
 const scope=schema.parse(raw),known=new Map(skills.map(skill=>[skill.id,skill]));
 if(known.size!==skills.length)throw Error("Duplicate graph target in release scope");
 const assessment=new Set(scope.assessmentSkillIds),teaching=new Set(scope.teachingSkillIds);
 if(assessment.size!==scope.assessmentSkillIds.length||teaching.size!==scope.teachingSkillIds.length)throw Error("Duplicate release-scope target");
 for(const id of assessment){
  const skill=known.get(id);if(!skill)throw Error(`Unknown assessment-scope target: ${id}`);
  if(skill.prerequisites.some(prerequisite=>!assessment.has(prerequisite)))throw Error(`Assessment scope omits a prerequisite: ${id}`);
 }
 for(const id of teaching)if(!assessment.has(id))throw Error(`Teaching target outside assessment scope: ${id}`);
 return {scope,assessmentSkillIds:assessment,teachingSkillIds:teaching,
  deferredSkillIds:skills.filter(skill=>!assessment.has(skill.id)).map(skill=>skill.id)};
}
