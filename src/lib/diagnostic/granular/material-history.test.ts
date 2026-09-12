import {readFileSync} from "node:fs";
import {readingContextId,readingPassageText} from "./v3-adapter";
import {learningSeenQuestionIds} from "./learning-exposure";
import {transitionSession} from "./session";
import {expect,it,vi} from "vitest";
import {withKnownMaterialHistory} from "./material-history";
import {materialIdentity} from "./material-identity";
import {selectProbe} from "./engine";
import {createSession} from "./session";
import type {AssessmentBundle,AssessmentStore,StoredSession} from "./service";
const old=materialIdentity("word","cheval"),fresh=materialIdentity("word","chat"),context=materialIdentity("word","voir");
function fixture(){
 const skill={id:"skill",nodeKey:"skill",evidenceKey:"production",labelFr:"Fixture",branch:"spelling",level:0,prerequisites:[],modes:["production" as const],evidenceRequirements:{production:{minimumItems:3,minimumContexts:2,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true,novelWordsRequired:true}}};
 const assessment={taxonomyChecksum:"test",bankChecksum:"test",skills:[skill],probes:[old,fresh].map((key,i)=>({id:`q${i}`,skillId:"skill",mode:"production" as const,contextId:`context${i}`,difficulty:.5,expectedSeconds:20,guessProbability:.05,materialKeys:[key,context],assessedMaterialKeys:[key]}))};
 const bundle:Pick<AssessmentBundle,"assessment">={assessment};
 const session:StoredSession={id:"session",studentId:"student-a",releaseId:"release",state:createSession({taxonomyId:"taxonomy",bankId:"bank",checksum:"test"})};
 const lookup=vi.fn(async()=>[old]);
 const store:AssessmentStore={load:async()=>session,release:async()=>null,save:async()=>true,knownMaterialKeys:lookup};
 return {bundle,session,lookup,store};
}
it("loads only relevant assessed targets for the owned student and avoids earlier-session material",async()=>{
 const f=fixture(),loaded=await withKnownMaterialHistory(f.store,f.session,f.bundle);
 expect(f.lookup).toHaveBeenCalledWith("student-a",[old,fresh]);
 expect(loaded.state.exposedMaterialKeys).toEqual([old]);
 expect(f.session.state.exposedMaterialKeys).toBeUndefined();
 expect(loaded.state.revision).toBe(0);
 expect(selectProbe(f.bundle.assessment.skills,f.bundle.assessment.probes,[],undefined,loaded.state.exposedMaterialKeys)).toMatchObject({kind:"question",item:{id:"q1"}});
});
it("does not infer complete history from an empty lookup",async()=>{
 const f=fixture();f.lookup.mockResolvedValueOnce([]);
 expect(await withKnownMaterialHistory(f.store,f.session,f.bundle)).toBe(f.session);
 expect(f.session.state.observations).toHaveLength(0);
});
it("rejects unrelated response keys and propagates database failures",async()=>{
 const f=fixture();f.lookup.mockResolvedValueOnce([context]);
 await expect(withKnownMaterialHistory(f.store,f.session,f.bundle)).rejects.toThrow(/requested targets/);
 f.lookup.mockRejectedValueOnce(new Error("history unavailable"));
 await expect(withKnownMaterialHistory(f.store,f.session,f.bundle)).rejects.toThrow("history unavailable");
});

it("carries passage exposure across releases despite changed question and source IDs",async()=>{
 const f=fixture(),bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8")) as AssessmentBundle["bank"];
 const template=bank.items.find(entry=>entry.sectionKey==="reading_comprehension")!;
 const entry=structuredClone(template);entry.itemKey="new-release-reading";
 entry.item.validatorConfig={...entry.item.validatorConfig,sourceTextKey:"renamed-source"};
 const passage=readingPassageText(entry.item.validatorConfig,entry.item.promptFr),key=materialIdentity("sentence",passage);
 const contextId=readingContextId(entry.item.validatorConfig,entry.item.promptFr);
 const reading={...f.bundle.assessment.probes[0],id:entry.itemKey,contextId,materialKeys:[],assessedMaterialKeys:[]};
 const assessment={...f.bundle.assessment,skills:f.bundle.assessment.skills.map(skill=>({...skill,evidenceRequirements:undefined})),probes:[reading,{...reading,id:"same-text-other-question"}]};
 bank.items=[entry,{...structuredClone(entry),itemKey:"same-text-other-question"}];
 f.lookup.mockResolvedValue([key]);
 const loaded=await withKnownMaterialHistory(f.store,f.session,{assessment,bank});
 expect(f.lookup).toHaveBeenCalledWith("student-a",[key]);
 expect(loaded.state.exposedReadingContexts).toEqual([contextId]);
 expect(learningSeenQuestionIds(loaded.state,assessment.probes)).toEqual(new Set([reading.id,"same-text-other-question"]));
 const next=transitionSession({state:loaded.state,release:{taxonomyId:"taxonomy",bankId:"bank",checksum:"test"},expectedRevision:0,event:{type:"resume",at:0},skills:assessment.skills,bank:assessment.probes});
 expect(next.pendingItemId).toBeNull();
 expect(next.phase).toBe("learning");
 const resumed=transitionSession({state:{...loaded.state,pendingItemId:reading.id},release:{taxonomyId:"taxonomy",bankId:"bank",checksum:"test"},expectedRevision:0,event:{type:"resume",at:0},skills:assessment.skills,bank:assessment.probes});
 expect(resumed.pendingItemId).toBe(reading.id);
 expect(resumed.phase).toBe("assessing");
 expect(f.session.state.exposedReadingContexts).toBeUndefined();
 await expect(withKnownMaterialHistory(f.store,f.session,{assessment})).rejects.toThrow(/source unavailable/);
});

it('excludes a recording heard in an earlier session even under a fresh written label',async()=>{
 const f=fixture(),audio=`audio:sha256:${'d'.repeat(64)}`;
 f.bundle.assessment.probes[0].materialKeys!.push(audio);f.bundle.assessment.probes[0].assessedMaterialKeys!.push(audio);
 f.lookup.mockResolvedValue([audio]);
 const loaded=await withKnownMaterialHistory(f.store,f.session,f.bundle);
 expect(f.lookup).toHaveBeenCalledWith('student-a',[old,audio,fresh]);
 expect(selectProbe(f.bundle.assessment.skills,f.bundle.assessment.probes,[],undefined,loaded.state.exposedMaterialKeys)).toMatchObject({kind:'question',item:{id:'q1'}});
 expect(loaded.state.observations).toHaveLength(0);
});
