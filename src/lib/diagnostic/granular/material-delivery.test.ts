import {captureAssessmentDelivery,type CoveredMaterialDeliveryStore} from './covered-material-delivery';
import {readingContextId,readingPassageText} from "./v3-adapter";
import {readFileSync} from "node:fs";
import {expect,it,vi} from "vitest";
import {recordMaterialDelivery,type MaterialDeliveryStore} from "./material-delivery";
import {readQuestionMaterialReceipt} from './question-material-receipt';
import type {MaterialReceipt} from './material-receipt';
import {annotatedMaterialKeys} from "./material-annotations";
import {materialIdentity} from "./material-identity";
import {createSession} from "./session";
import {PRONOUN_PLACEMENT_TEACHING} from "./pronoun-teaching";
import type {AssessmentBundle,StoredSession} from "./service";
import type {CanonicalDiagnosticBankArtifact} from "../item-bank";
import {teachingContentChecksum,type PublishedTeachingContent} from "./teaching-content";
function fixture(){
 const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8")) as CanonicalDiagnosticBankArtifact;
 const entry=bank.items[0];
 entry.item.validatorConfig={...entry.item.validatorConfig,materialExposure:{sentences:[entry.item.promptFr]}};
 const lesson:PublishedTeachingContent={...structuredClone(PRONOUN_PLACEMENT_TEACHING[0]),status:"published",assessmentExposureIds:[],
  materialExposure:{sentences:[PRONOUN_PLACEMENT_TEACHING[0].steps[0].exampleFr]},
  review:{reviewerId:"fixture",reviewedAt:"2026-09-10T00:00:00Z",contentChecksum:"",exposureMappingReviewed:true}};
 lesson.review.contentChecksum=teachingContentChecksum(lesson);
 const bundle:AssessmentBundle={bank,taxonomyId:"taxonomy",bankId:"bank",assessment:{taxonomyChecksum:"test",bankChecksum:"test",skills:[],probes:[{id:entry.itemKey,skillId:"fixture",mode:"production",contextId:"fixture",difficulty:.5,expectedSeconds:20,guessProbability:.05}]},teachingContent:[lesson]};
 const session:StoredSession={id:"session",studentId:"student-a",releaseId:"release",state:createSession({taxonomyId:"taxonomy",bankId:"bank",checksum:"test"})};
 const record=vi.fn(async()=>{});
 const store:MaterialDeliveryStore={load:async(student,id)=>student===session.studentId&&id===session.id?session:null,release:async()=>bundle,save:async()=>true,recordMaterialPresentation:record};
 const view={sessionId:session.id,question:{id:entry.itemKey},learningCheck:null,teaching:null};
 return {entry,lesson,bundle,session,store,record,view};
}
it("anchors annotations in source content and preserves reviewed lemma identities",()=>{
 expect(annotatedMaterialKeys({words:[{lemma:"cheval",form:"chevaux"}]},["Les chevaux courent."])).toEqual([materialIdentity("word","cheval")]);
 expect(()=>annotatedMaterialKeys({words:[{lemma:"cheval",form:"chats"}]},["Les chevaux courent."])).toThrow(/anchored/);
 expect(()=>annotatedMaterialKeys({sentences:[]},["texte"])).toThrow(/size/);
});
it("records initial and follow-up delivery with the same stable question identity on retry",async()=>{
 const f=fixture();
 await recordMaterialDelivery(f.store,"student-a",{view:f.view});
 await recordMaterialDelivery(f.store,"student-a",{view:{...f.view,question:null,learningCheck:{id:"check",question:f.view.question}}});
 expect(f.record).toHaveBeenCalledTimes(2);
 expect(f.record.mock.calls[0]).toEqual(f.record.mock.calls[1]);
 expect(f.record).toHaveBeenCalledWith(expect.objectContaining({studentId:"student-a",materialKeys:[materialIdentity("sentence",f.entry.item.promptFr)]}));
});
it("records the lesson's reviewed material before returning its view",async()=>{
 const f=fixture();
 await recordMaterialDelivery(f.store,"student-a",{view:{...f.view,question:null,teaching:{contentId:f.lesson.id}}});
 expect(f.record).toHaveBeenCalledWith(expect.objectContaining({sourceChecksum:teachingContentChecksum(f.lesson),materialKeys:[materialIdentity("sentence",f.lesson.steps[0].exampleFr)]}));
});
it("withholds delivery on persistence failure and refuses missing or other-student sources",async()=>{
 const f=fixture();f.record.mockRejectedValueOnce(new Error("database unavailable"));
 await expect(recordMaterialDelivery(f.store,"student-a",{view:f.view})).rejects.toThrow("database unavailable");
 await expect(recordMaterialDelivery(f.store,"student-b",{view:f.view})).rejects.toThrow(/session unavailable/);
 await expect(recordMaterialDelivery(f.store,"student-a",{view:{...f.view,question:{id:"unknown"}}})).rejects.toThrow(/question unavailable/);
});
it("does not fabricate material keys for unannotated content or error-only responses",async()=>{
 const f=fixture();delete f.entry.item.validatorConfig!.materialExposure;
 await recordMaterialDelivery(f.store,"student-a",{view:f.view});
 await recordMaterialDelivery(f.store,"student-a",{error:"not available"});
 expect(f.record).not.toHaveBeenCalled();
});
it("records contextual material even when it is excluded from the assessed subset",()=>{
 const annotation={words:[{lemma:"cheval",form:"chevaux"},{lemma:"voir",form:"voit"}],assessed:{words:["cheval"]}};
 expect(annotatedMaterialKeys(annotation,["Elle voit les chevaux."])).toEqual([materialIdentity("word","cheval"),materialIdentity("word","voir")].sort());
 expect(()=>annotatedMaterialKeys({...annotation,assessed:{words:["chien"]}},["Elle voit les chevaux."])).toThrow(/included/);
});

it("records whole reading passages even without optional annotations and keeps retries stable",async()=>{
 const f=fixture(),entry=f.bundle.bank.items.find(entry=>entry.sectionKey==="reading_comprehension")!;
 delete entry.item.validatorConfig!.materialExposure;
 f.bundle.assessment.probes=[{...f.bundle.assessment.probes[0],id:entry.itemKey,contextId:readingContextId(entry.item.validatorConfig,entry.item.promptFr)}];
 const result={view:{...f.view,question:{id:entry.itemKey}}};
 await recordMaterialDelivery(f.store,"student-a",result);
 await recordMaterialDelivery(f.store,"student-a",result);
 expect(f.record).toHaveBeenCalledTimes(2);
 expect(f.record.mock.calls[0]).toEqual(f.record.mock.calls[1]);
 expect(f.record).toHaveBeenCalledWith(expect.objectContaining({studentId:"student-a",materialKeys:[materialIdentity("sentence",readingPassageText(entry.item.validatorConfig,entry.item.promptFr))]}));
});

it('records an explicitly annotated passage once, preserving first and prior exposure on retry',async()=>{
 for(const previouslySeen of [false,true]){
  const f=fixture(),entry=f.bundle.bank.items.find(e=>e.sectionKey==='reading_comprehension')!;
  const passage=readingPassageText(entry.item.validatorConfig,entry.item.promptFr),key=materialIdentity('sentence',passage);
  entry.item.validatorConfig={...entry.item.validatorConfig,materialExposure:{sentences:[passage],assessed:{sentences:[passage]}}};
  f.bundle.assessment.probes=[{...f.bundle.assessment.probes[0],id:entry.itemKey,contextId:readingContextId(entry.item.validatorConfig,entry.item.promptFr)}];
  const known=new Set(previouslySeen?[key]:[]),receipts=new Map<string,MaterialReceipt>();
  f.store.recordMaterialPresentation=async input=>{
   if(receipts.has(input.presentationId))return;
   receipts.set(input.presentationId,{firstRecordedKeys:input.materialKeys.filter(k=>!known.has(k)),previouslySeenKeys:input.materialKeys.filter(k=>known.has(k))});
   input.materialKeys.forEach(k=>known.add(k));
  };
  f.store.loadMaterialReceipt=async input=>receipts.get(input.presentationId)??null;
  f.store.materialHistoryComplete=async()=>true;
  const result={view:{...f.view,question:{id:entry.itemKey}}};
  await recordMaterialDelivery(f.store,'student-a',result);
  await recordMaterialDelivery(f.store,'student-a',result);
  expect(receipts.size).toBe(1);
  const receipt=await readQuestionMaterialReceipt(f.store,f.session,f.bundle,entry.itemKey);
  expect(receipt?.firstRecordedKeys).toEqual(previouslySeen?[]:[key]);
  expect(receipt?.previouslySeenKeys).toEqual(previouslySeen?[key]:[]);
  expect(receipt?.assessedMaterialKeys).toEqual([key]);
 }
});

it("does not reload a bank or write receipts for a start screen without exposed material",async()=>{
 const f=fixture();f.store.load=vi.fn(async()=>{throw Error("Unexpected session load");});f.store.release=vi.fn(async()=>{throw Error("Unexpected bank load");});
 await recordMaterialDelivery(f.store,"student-a",{view:{sessionId:"session",question:null,learningCheck:null,teaching:null}});
 expect(f.store.load).not.toHaveBeenCalled();expect(f.store.release).not.toHaveBeenCalled();expect(f.record).not.toHaveBeenCalled();
});
it("still records material carried by a paused response",async()=>{
 const f=fixture();await recordMaterialDelivery(f.store,"student-a",{view:{...f.view,paused:true}});
 expect(f.record).toHaveBeenCalledTimes(1);
});
it('excludes earlier journaled material from a new receipt without modifying historical records',async()=>{
 const f=fixture(),key=materialIdentity('sentence',f.entry.item.promptFr);
 const receipt={firstRecordedKeys:[key],previouslySeenKeys:[]};
 f.store.loadMaterialReceipt=async()=>receipt;
 f.store.materialHistoryComplete=async()=>true;
 f.store.loadPriorDeliveryText=async()=>({complete:true,rows:[{boundary:'legacy:reading-text',payloadChecksum:'sha256:earlier',textFragments:[f.entry.item.promptFr]}]});
 const result=await readQuestionMaterialReceipt(f.store,f.session,f.bundle,f.entry.itemKey);
 expect(result).toMatchObject({firstRecordedKeys:[],previouslySeenKeys:[key],priorJournalMatches:[{materialKey:key,boundary:'legacy:reading-text',payloadChecksum:'sha256:earlier'}]});
 expect(receipt).toEqual({firstRecordedKeys:[key],previouslySeenKeys:[]});
 expect(f.record).not.toHaveBeenCalled();
});
it('does not certify novelty when the prior journal scan is incomplete',async()=>{
 const f=fixture(),key=materialIdentity('sentence',f.entry.item.promptFr);
 f.store.loadMaterialReceipt=async()=>({firstRecordedKeys:[key],previouslySeenKeys:[]});
 f.store.materialHistoryComplete=async()=>true;
 f.store.loadPriorDeliveryText=async()=>({complete:false,rows:[]});
 expect((await readQuestionMaterialReceipt(f.store,f.session,f.bundle,f.entry.itemKey))?.historyComplete).toBe(false);
});

it('validates every delivered source before writing any presentation',async()=>{
 const f=fixture();
 await expect(recordMaterialDelivery(f.store,'student-a',{view:{...f.view,teaching:{contentId:'missing-lesson'}}})).rejects.toThrow('lesson unavailable');
 expect(f.record).not.toHaveBeenCalled();
});
it('batches receipt identities and the whole final payload in one covered write',async()=>{
 const f=fixture(),covered=vi.fn(async()=>{}),journal=vi.fn(async()=>{});
 const store:CoveredMaterialDeliveryStore={...f.store,recordCoveredMaterialDelivery:covered,recordDeliveredText:journal};
 const payload={view:{...f.view,teaching:{contentId:f.lesson.id}},studentState:{title:'Le sujet du verbe'}};
 await captureAssessmentDelivery(store,'student-a','granular:teaching',payload,'test-contract');
 await captureAssessmentDelivery(store,'student-a','granular:teaching',payload,'test-contract');
 expect(covered).toHaveBeenCalledTimes(2);
 expect(covered.mock.calls[0]).toEqual(covered.mock.calls[1]);
 expect(covered).toHaveBeenCalledWith(expect.objectContaining({studentId:'student-a',contractKey:'test-contract',textFragments:expect.arrayContaining(['Le sujet du verbe']),presentations:expect.arrayContaining([expect.objectContaining({sourceChecksum:teachingContentChecksum(f.lesson)})])}));
 expect(f.record).not.toHaveBeenCalled();expect(journal).not.toHaveBeenCalled();
});
it('never downgrades a failed or unavailable covered write to ordinary capture',async()=>{
 const f=fixture(),journal=vi.fn(async()=>{}),covered=vi.fn(async()=>{throw Error('contract disabled');});
 const store:CoveredMaterialDeliveryStore={...f.store,recordDeliveredText:journal,recordCoveredMaterialDelivery:covered};
 await expect(captureAssessmentDelivery(store,'student-a','granular:start',{view:f.view},'test-contract')).rejects.toThrow('contract disabled');
 await expect(captureAssessmentDelivery({...store,recordCoveredMaterialDelivery:undefined},'student-a','granular:start',{view:f.view},'test-contract')).rejects.toThrow('unavailable');
 expect(f.record).not.toHaveBeenCalled();expect(journal).not.toHaveBeenCalled();
});
it('journals results-only payloads atomically without inventing presentations',async()=>{
 const f=fixture(),covered=vi.fn(async()=>{});
 await captureAssessmentDelivery({...f.store,recordCoveredMaterialDelivery:covered},'student-a','granular:start',{view:{sessionId:'session',question:null},title:'Tes progrès'},'test-contract');
 expect(covered).toHaveBeenCalledWith(expect.objectContaining({presentations:[],textFragments:expect.arrayContaining(['Tes progrès'])}));
 expect(f.record).not.toHaveBeenCalled();
});
