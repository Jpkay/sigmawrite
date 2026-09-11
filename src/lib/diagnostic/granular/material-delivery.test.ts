import {readingContextId,readingPassageText} from "./v3-adapter";
import {readFileSync} from "node:fs";
import {expect,it,vi} from "vitest";
import {recordMaterialDelivery,type MaterialDeliveryStore} from "./material-delivery";
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
