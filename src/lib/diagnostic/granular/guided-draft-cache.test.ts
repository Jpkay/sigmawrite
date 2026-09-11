import {expect,it} from "vitest";
import {GUIDED_DRAFT_KEY,persistGuidedDraft,restoreGuidedDraft} from "./guided-draft-cache";
import type {AssessmentView} from "./client-state";
const view=()=>({sessionId:"student-session",teaching:{phase:"practice",contentId:"lesson",exercise:{id:"exercise",choices:[{id:"choice-a",text:"A"},{id:"choice-b",text:"B"}],feedback:null}}}) as AssessmentView;
function storage(){const entries=new Map<string,string>();return {getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>{entries.set(key,value);},removeItem:(key:string)=>{entries.delete(key);}};}
it("restores only the current guided choice across reload and choice reordering",()=>{
 const cache=storage(),current=view();persistGuidedDraft(current,"choice-b",cache);
 current.teaching!.exercise!.choices!.reverse();expect(restoreGuidedDraft(current,cache)).toBe("choice-b");
 for(const field of ["session","lesson","exercise"]){const other=view();if(field==="session")other.sessionId="other";if(field==="lesson")other.teaching!.contentId="other";if(field==="exercise")other.teaching!.exercise!.id="other";expect(restoreGuidedDraft(other,cache)).toBeNull();}
 current.teaching!.exercise!.choices=[{id:"replacement",text:"B"}];expect(restoreGuidedDraft(current,cache)).toBeNull();
});
it("clears submitted or abandoned drafts and does not restore stale feedback",()=>{
 const cache=storage(),current=view();persistGuidedDraft(current,"choice-a",cache);
 current.teaching!.exercise!.feedback={answer:"A",correct:true,answerFr:"A",explanationFr:"Feedback"};
 expect(restoreGuidedDraft(current,cache)).toBeNull();persistGuidedDraft(current,"choice-a",cache);expect(cache.getItem(GUIDED_DRAFT_KEY)).toBeNull();
 persistGuidedDraft(view(),"choice-b",cache);persistGuidedDraft({...view(),teaching:null},"",cache);expect(cache.getItem(GUIDED_DRAFT_KEY)).toBeNull();
});
it("supports typed practice without exposing the draft to another exercise",()=>{
 const cache=storage(),current=view();delete current.teaching!.exercise!.choices;
 persistGuidedDraft(current,"Nous en avons trois.",cache);expect(restoreGuidedDraft(current,cache)).toBe("Nous en avons trois.");
 persistGuidedDraft(current,"",cache);expect(restoreGuidedDraft(current,cache)).toBeNull();
 persistGuidedDraft(current,"x".repeat(1001),cache);expect(restoreGuidedDraft(current,cache)).toBeNull();
});
it("tolerates malformed and unavailable browser storage",()=>{
 const cache=storage();cache.setItem(GUIDED_DRAFT_KEY,"not-json");expect(restoreGuidedDraft(view(),cache)).toBeNull();
 const blocked={getItem:()=>{throw Error("denied");},setItem:()=>{throw Error("denied");},removeItem:()=>{throw Error("denied");}};
 expect(restoreGuidedDraft(view(),blocked)).toBeNull();expect(()=>persistGuidedDraft(view(),"choice-a",blocked)).not.toThrow();
});
