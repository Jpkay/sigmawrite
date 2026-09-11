import {expect,it} from "vitest";
import {inspectProfileDiscrimination} from "./profile-discrimination";
const targets=[{skillId:"a-present",branch:"verb-a",expectedKnown:true},{skillId:"a-past",branch:"verb-a",expectedKnown:false},{skillId:"b-present",branch:"verb-b",expectedKnown:false}];
it("does not pass from merely visiting targets or from strong evidence outside the declared contrast",()=>{
 const sampled=[{skillId:"a-present",withinOccasionResolved:true},{skillId:"a-past",withinOccasionResolved:false},{skillId:"unrelated",withinOccasionResolved:true}];
 const result=inspectProfileDiscrimination(targets,sampled);
 expect(result.passed).toBe(false);expect(result.weakTargetsUnresolved).toEqual(["a-past","b-present"]);
 expect(inspectProfileDiscrimination(targets,[...sampled,{skillId:"b-present",withinOccasionResolved:true}]).passed).toBe(true);
});
it("requires a same-verb contrast for a tense-boundary claim, and does not hide other unresolved targets",()=>{
 const sampled=[{skillId:"a-present",withinOccasionResolved:true},{skillId:"b-present",withinOccasionResolved:true}];
 expect(inspectProfileDiscrimination(targets,sampled,true).passed).toBe(false);
 const result=inspectProfileDiscrimination(targets,[{skillId:"a-present",withinOccasionResolved:true},{skillId:"a-past",withinOccasionResolved:true}],true);
 expect(result.passed).toBe(true);expect(result.sameBranchBoundaries).toEqual(["verb-a"]);expect(result.weakTargetsUnresolved).toEqual(["b-present"]);
 expect(inspectProfileDiscrimination([],[],true).passed).toBe(false);
});
