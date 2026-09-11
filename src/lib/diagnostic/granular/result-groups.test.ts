import {expect,it} from "vitest";
import {groupAssessmentResults,type ResultDetail} from "./result-groups";
import type {SkillResult} from "./engine";
const result=(skillId:string,status:SkillResult["status"]):SkillResult=>({skillId,status,resolved:status==="mastered"||status==="missing",evidence:status==="unknown"?"untested":"direct",modes:[]});
const details:Record<string,ResultDetail>={
 lexical:{labelFr:"Choisir les accents",domain:"spelling",samplingGroup:"orthographe_lexicale",mode:"production"},
 agreement:{labelFr:"Accorder le verbe",domain:"spelling",samplingGroup:"orthographe_grammaticale",mode:"production"},
 pending:{labelFr:"Autre règle",domain:"spelling",samplingGroup:"orthographe_lexicale",mode:"recognition"},
 legacy:{labelFr:"Ancien résultat",domain:"spelling",mode:"production"},
};
it("shows opposite spelling outcomes in separate sections without changing evidence",()=>{
 const input=[result("pending","unknown"),result("agreement","missing"),result("lexical","mastered")];
 const snapshot=structuredClone(input),groups=groupAssessmentResults(input,details);
 expect(groups.map(group=>group.labelFr)).toEqual(["Orthographe des mots","Accords et homophones"]);
 expect(groups[0].results.map(row=>row.result.skillId)).toEqual(["lexical","pending"]);
 expect(groups[1].results[0].result.status).toBe("missing");
 expect(input).toEqual(snapshot);
 expect(groups.flatMap(group=>group.results.map(row=>row.result))).toEqual([input[2],input[0],input[1]]);
});
it("keeps historical spelling and unknown metadata visible without inventing a strand",()=>{
 const groups=groupAssessmentResults([result("legacy","uncertain"),result("missing-metadata","unknown")],details);
 expect(groups.map(group=>group.labelFr)).toEqual(["Orthographe","Autres points"]);
 expect(groups.flatMap(group=>group.results)).toHaveLength(2);
 expect(groupAssessmentResults([],details)).toEqual([]);
});
