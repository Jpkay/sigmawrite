import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {contrastingErrorKeys} from "./contrasting-errors";
import {assessSkills,type Observation,type Probe} from "./engine";
import {allocateQuestionPools} from "./question-pools";
import type {EvidenceSkill,V3Assessment} from "./v3-adapter";
import type {CanonicalDiagnosticBankArtifact} from "../item-bank";
const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8")) as CanonicalDiagnosticBankArtifact;
const source=bank.items.find(entry=>entry.item.choices?.length===4)!.item;
const annotated=()=>({...structuredClone(source),validatorConfig:{contrastingErrors:source.choices!.filter(c=>!c.correct).map(c=>({errorKey:"same-family",incorrectChoiceFr:c.text}))}});
it("counts reviewed error families rather than distractor count",()=>{
 expect(contrastingErrorKeys(source)).toEqual([]);
 expect(contrastingErrorKeys(annotated())).toEqual(["same-family"]);
 const item=annotated();item.validatorConfig.contrastingErrors[1].errorKey="another-family";
 expect(contrastingErrorKeys(item)).toHaveLength(2);
});
it("rejects invented options, correct choices and repeated labels on the same option",()=>{
 const invented=annotated();invented.validatorConfig.contrastingErrors[0].incorrectChoiceFr="Not an option";
 expect(()=>contrastingErrorKeys(invented)).toThrow();
 const correct=annotated();correct.validatorConfig.contrastingErrors[0].incorrectChoiceFr=source.choices!.find(c=>c.correct)!.text;
 expect(()=>contrastingErrorKeys(correct)).toThrow();
 const duplicate=annotated();duplicate.validatorConfig.contrastingErrors.push({...duplicate.validatorConfig.contrastingErrors[0],errorKey:"invented-second-label"});
 expect(()=>contrastingErrorKeys(duplicate)).toThrow();
});
const skill:EvidenceSkill={id:"spelling",nodeKey:"spelling",evidenceKey:"recognition",labelFr:"Orthographe",branch:"spelling",level:0,prerequisites:[],modes:["recognition"],evidenceRequirements:{recognition:{minimumItems:3,minimumContexts:2,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true,minimumContrastingErrors:2}}};
const answers:Observation[]=Array.from({length:4},(_,i)=>({itemId:`q${i}`,skillId:skill.id,mode:"recognition",contextId:`word${i}`,correct:true,guessProbability:.25,activeSeconds:15,unaided:true,contrastingErrorKeys:["one-error-family"]}));
it("requires distinct contrasts in consistent evidence and does not reuse a prior failure as proof of mastery",()=>{
 expect(assessSkills([skill],answers)[0].resolved).toBe(false);
 const varied=answers.map((o,i)=>({...o,contrastingErrorKeys:[i%2?"one-error-family":"another-error-family"]}));
 expect(assessSkills([skill],varied)[0].status).toBe("mastered");
 const failedBefore={...answers[0],itemId:"failed",correct:false,contrastingErrorKeys:["another-error-family"]};
 expect(assessSkills([skill],[failedBefore,...answers])[0].resolved).toBe(false);
});
it("requires contrasts in each separate question pool",()=>{
 const probes:Probe[]=Array.from({length:8},(_,i)=>({id:`q${i}`,skillId:skill.id,mode:"recognition",contextId:`word${i}`,difficulty:.5,expectedSeconds:15,guessProbability:.25,contrastingErrorKeys:[i===0?"other":"same"]}));
 const assessment:V3Assessment={taxonomyChecksum:"test",bankChecksum:"test",skills:[skill],probes};
 expect(allocateQuestionPools(assessment).ready).toBe(false);
 probes[4].contrastingErrorKeys=["other"];
 expect(allocateQuestionPools(assessment).ready).toBe(true);
});
