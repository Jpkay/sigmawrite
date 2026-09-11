import {expect,it} from "vitest";
import {ASSESSMENT_DRAFT_KEY,persistAssessmentDraft,restoreAssessmentDraft} from "./assessment-draft-cache";
import type {AssessmentView} from "./client-state";
const view=()=>({sessionId:"session",phase:"assessing",paused:false,question:{id:"q",responseType:"mcq",choices:[{id:"a",text:"A"},{id:"b",text:"B"}],supportChoices:[{id:"s",text:"Support"}]},learningCheck:null,teaching:null}) as AssessmentView;
function storage(){const entries=new Map<string,string>();return {getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>{entries.set(key,value);},removeItem:(key:string)=>{entries.delete(key);}};}
it("restores a reading answer and support choice through a pause and rejects stale IDs",()=>{
 const cache=storage(),current=view();persistAssessmentDraft(current,"b","s",cache);current.paused=true;current.question!.choices.reverse();
 expect(restoreAssessmentDraft(current,cache)).toEqual({draft:"b",supportChoiceId:"s"});
 current.question!.supportChoices=[{id:"new",text:"Support"}];expect(restoreAssessmentDraft(current,cache)).toBeNull();
 current.question!.supportChoices=[{id:"s",text:"Support"}];current.question!.choices=[];expect(restoreAssessmentDraft(current,cache)).toBeNull();
});
it("does not leak drafts between sessions, questions or independently issued checks",()=>{
 const cache=storage(),current=view();persistAssessmentDraft(current,"a",null,cache);
 for(const other of [{...current,sessionId:"other"},{...current,question:{...current.question!,id:"other"}},{...current,phase:"learning",learningCheck:{id:"check",question:current.question,firstDraft:null,revisionRequired:false}}] as AssessmentView[])expect(restoreAssessmentDraft(other,cache)).toBeNull();
 const checking={...current,phase:"learning",question:null,learningCheck:{id:"check-1",question:current.question,firstDraft:null,revisionRequired:false}} as AssessmentView;
 persistAssessmentDraft(checking,"a",null,cache);checking.learningCheck!.id="check-2";expect(restoreAssessmentDraft(checking,cache)).toBeNull();
});
it("keeps an edited writing revision separate from an unsent first draft",()=>{
 const cache=storage(),current=view();current.question!.responseType="short_answer";current.question!.supportChoices=null;
 const checking={...current,phase:"learning",question:null,learningCheck:{id:"writing",question:current.question,firstDraft:null,revisionRequired:true}} as AssessmentView;
 persistAssessmentDraft(checking,"Ma première version.",null,cache);
 checking.learningCheck!.firstDraft="Ma première version.";expect(restoreAssessmentDraft(checking,cache)).toBeNull();
 persistAssessmentDraft(checking,"Ma version relue et améliorée.",null,cache);
 expect(restoreAssessmentDraft(checking,cache)?.draft).toBe("Ma version relue et améliorée.");
 persistAssessmentDraft({...checking,learningCheck:null},"",null,cache);expect(cache.getItem(ASSESSMENT_DRAFT_KEY)).toBeNull();
});
it("supports a support-only selection and handles empty, malformed or unavailable storage",()=>{
 const cache=storage();persistAssessmentDraft(view(),"","s",cache);expect(restoreAssessmentDraft(view(),cache)).toEqual({draft:"",supportChoiceId:"s"});
 persistAssessmentDraft(view(),"",null,cache);expect(cache.getItem(ASSESSMENT_DRAFT_KEY)).toBeNull();
 cache.setItem(ASSESSMENT_DRAFT_KEY,"broken");expect(restoreAssessmentDraft(view(),cache)).toBeNull();
 const denied={getItem:()=>{throw Error("denied");},setItem:()=>{throw Error("denied");},removeItem:()=>{throw Error("denied");}};
 expect(()=>persistAssessmentDraft(view(),"a",null,denied)).not.toThrow();expect(restoreAssessmentDraft(view(),denied)).toBeNull();
});
