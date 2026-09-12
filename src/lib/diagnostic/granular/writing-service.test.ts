import {readFileSync} from "node:fs";
import {expect,it,vi} from "vitest";
import {runLearningCheckCommand,type WritingEvaluator} from "./learning-service";
import {createSession} from "./session";
import {bindAssessmentRelease} from "./release-binding";
import {publicAssessmentView,type AssessmentBundle,type AssessmentStore,type StoredSession} from "./service";
import {checksum} from "@/lib/taxonomy/validate";
function fixture(){
 const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8"));
 const entry=bank.items.find((entry:{item:{responseType:string}})=>entry.item.responseType!=="mcq");
 const skill={id:"writing",nodeKey:entry.item.nodeKey,evidenceKey:entry.evidenceKey,labelFr:"Écriture",branch:"spelling",level:0,prerequisites:[],modes:["independent_production" as const],assessmentStage:"learning" as const,evidenceRequirements:{independent_production:{minimumItems:2,minimumContexts:2,minimumOccasions:2,minimumAccuracy:.75,minimumEligibleTokens:8,unaidedRequired:true}}};
 const bundle:AssessmentBundle={bank,taxonomyId:"taxonomy",bankId:"bank",assessment:{taxonomyChecksum:"fixture",bankChecksum:"fixture",skills:[skill],probes:[{id:entry.itemKey,skillId:skill.id,mode:"independent_production",contextId:"writing-context",difficulty:.5,expectedSeconds:120,guessProbability:.05,usage:"learning"}]}};
 const checkId="22222222-2222-4222-8222-222222222222";
 let stored:StoredSession={id:"11111111-1111-4111-8111-111111111111",studentId:"student-a",releaseId:"release",state:{...createSession(bindAssessmentRelease(bundle.assessment,bundle)),phase:"learning",completionReason:"time_budget",learningCheck:{id:checkId,activityId:"writing-check",itemId:entry.itemKey,occasionId:"day-1"}}};
 const save=vi.fn<AssessmentStore["save"]>(async(student,id,revision,state)=>{if(student!==stored.studentId||id!==stored.id||revision!==stored.state.revision)return false;stored={...stored,state:JSON.parse(JSON.stringify(state))};return true;});
 const store:AssessmentStore={load:async(student,id)=>student===stored.studentId&&id===stored.id?structuredClone(stored):null,release:async()=>bundle,save};
 const command={type:"answer_check",sessionId:stored.id,revision:0,checkId,answer:"Les chevaux courent."};
 const evaluator=vi.fn<WritingEvaluator>(async()=>({connectedWriting:true,tokens:[{start:4,end:11,text:"chevaux",correct:true},{start:12,end:19,text:"courent",correct:false}]}));
 return {store,bundle,command,evaluator,save,get:()=>stored};
}
it("saves writing evidence bound to the submitted text, skill and server occasion",async()=>{
 const f=fixture();await runLearningCheckCommand(f.store,"student-a",f.command,Date.now,f.evaluator);
 expect(f.evaluator).toHaveBeenCalledWith(expect.objectContaining({answer:f.command.answer,skillId:"writing"}));
 expect(f.get().state.refinements[0]).toMatchObject({correct:false,occasionId:"day-1",writingEvidence:{skillId:"writing",responseChecksum:checksum(f.command.answer),eligibleTokens:2,correctTokens:1}});
 expect(f.get().state.learningCheck).toBeNull();
 expect(f.get().state.refinements[0].writingEvidence?.responseText).toBe(f.command.answer);
 const view=JSON.stringify(publicAssessmentView(f.get(),f.bundle));
 expect(view).not.toContain("responseText");expect(view).not.toContain("responseChecksum");
 expect(view).not.toContain("eligibleTokens");
});
it("preserves the active response when evaluation is unavailable or unassessable",async()=>{
 const f=fixture();expect(await runLearningCheckCommand(f.store,"student-a",f.command)).toHaveProperty("error");
 f.evaluator.mockResolvedValue({connectedWriting:false,tokens:[]});
 expect(await runLearningCheckCommand(f.store,"student-a",f.command,Date.now,f.evaluator)).toHaveProperty("error");
 expect(f.save).not.toHaveBeenCalled();expect(f.get().state.learningCheck).not.toBeNull();
});
it("rejects browser judgments, wrong ownership and malformed evaluator spans before saving",async()=>{
 const f=fixture();
 expect(await runLearningCheckCommand(f.store,"student-a",{...f.command,writingEvidence:{eligibleTokens:100}},Date.now,f.evaluator)).toHaveProperty("error");
 expect(await runLearningCheckCommand(f.store,"student-b",f.command,Date.now,f.evaluator)).toHaveProperty("error");
 expect(f.evaluator).not.toHaveBeenCalled();
 f.evaluator.mockResolvedValue({connectedWriting:true,tokens:[{start:4,end:11,text:"invalid",correct:true}]});
 await expect(runLearningCheckCommand(f.store,"student-a",f.command,Date.now,f.evaluator)).rejects.toThrow(/span/);
 expect(f.save).not.toHaveBeenCalled();
});
it("saves an immutable first draft before reviewing the second version",async()=>{
 const f=fixture();f.bundle.assessment.skills[0].nodeKey="reviser_orthographe_lexicale_paragraphe";
 await runLearningCheckCommand(f.store,"student-a",f.command,Date.now,f.evaluator);
 expect(f.evaluator).not.toHaveBeenCalled();expect(f.get().state.refinements).toHaveLength(0);
 expect(f.get().state.learningCheck?.firstDraft).toBe(f.command.answer);
 const afterDraft=publicAssessmentView(f.get(),f.bundle);
 expect(afterDraft.learningCheck).toMatchObject({revisionRequired:true,firstDraft:f.command.answer});
 const final={...f.command,revision:f.get().state.revision,answer:"Les chevaux courent vite."};
 expect(await runLearningCheckCommand(f.store,"student-a",final,Date.now,f.evaluator)).toHaveProperty("error");
 expect(f.get().state.learningCheck?.firstDraft).toBe(f.command.answer);
 f.evaluator.mockResolvedValue({connectedWriting:true,revisionReviewed:true,tokens:[{start:4,end:11,text:"chevaux",correct:true}]});
 await runLearningCheckCommand(f.store,"student-a",final,Date.now,f.evaluator);
 expect(f.evaluator).toHaveBeenLastCalledWith(expect.objectContaining({answer:final.answer,firstDraft:f.command.answer}));
 expect(f.get().state.refinements[0].writingEvidence).toMatchObject({firstDraft:f.command.answer,responseText:final.answer,revisionReviewed:true});
});

it('keeps the active check and all evidence unchanged on a retryable provider failure',async()=>{
 const {WritingAssessmentError}=await import('./writing-error');
 const f=fixture(),before=structuredClone(f.get());
 f.evaluator.mockRejectedValue(new WritingAssessmentError(Error('provider response')));
 const result=await runLearningCheckCommand(f.store,'student-a',f.command,Date.now,f.evaluator);
 expect(result).toMatchObject({error:expect.stringContaining('Aucun résultat')});
 expect(f.save).not.toHaveBeenCalled();expect(f.get()).toEqual(before);
 expect(JSON.stringify(result)).not.toContain('provider response');
});
