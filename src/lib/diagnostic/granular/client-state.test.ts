import {expect,it} from "vitest";
import {reconcileAssessmentResponse,type AssessmentView} from "./client-state";
const view={sessionId:"session",revision:1,question:{id:"question"}} as AssessmentView;
it("preserves a written response after a revision conflict on the same question",()=>{
 expect(reconcileAssessmentResponse(view,"Une réponse personnelle",{conflict:true,view:{...view,revision:2}})).toMatchObject({draft:"Une réponse personnelle",error:expect.stringContaining("conservée")});
});
it("cannot carry a previous answer into another question",()=>{
 expect(reconcileAssessmentResponse(view,"ancienne",{view:{...view,revision:2,question:{...view.question!,id:"next"}}}).draft).toBe("");
});
it("ignores out-of-order responses",()=>{
 expect(reconcileAssessmentResponse({...view,revision:3},"réponse",{view})).toMatchObject({view:{revision:3},draft:"réponse"});
});
it("keeps the response after a network or grading error",()=>{
 expect(reconcileAssessmentResponse(view,"réponse",{error:"Réessaie"})).toMatchObject({view,draft:"réponse",error:"Réessaie"});
});
it("preserves a learning-check draft on conflict but clears it when that check ends",()=>{
 const learning={...view,question:null,learningCheck:{id:"check-1",activityId:"activity",question:view.question}} as AssessmentView;
 expect(reconcileAssessmentResponse(learning,"réponse",{conflict:true,view:{...learning,revision:2}}).draft).toBe("réponse");
 expect(reconcileAssessmentResponse(learning,"réponse",{view:{...learning,revision:2,learningCheck:null}}).draft).toBe("");
 expect(reconcileAssessmentResponse(learning,"réponse",{view:{...learning,revision:2,learningCheck:{...learning.learningCheck!,id:"check-2"}}}).draft).toBe("");
});
it("keeps guided drafts across hints and conflicts, but clears them for feedback, another exercise or another lesson",()=>{
 const teaching={activityId:"activity",contentId:"lesson",titleFr:"Titre",learnerQuestionFr:"Question",phase:"practice" as const,steps:[],takeawayFr:"Repère",boundaryFr:"Limite",exerciseIndex:0,totalExercises:2,
  exercise:{id:"exercise-1",promptFr:"Réécris",hintFr:null,feedback:null}};
 const guided={...view,question:null,teaching};
 expect(reconcileAssessmentResponse(guided,"ma phrase",{view:{...guided,revision:2,teaching:{...teaching,exercise:{...teaching.exercise,hintFr:"Un indice"}}}}).draft).toBe("ma phrase");
 expect(reconcileAssessmentResponse(guided,"ma phrase",{conflict:true,view:{...guided,revision:2}}).draft).toBe("ma phrase");
 expect(reconcileAssessmentResponse(guided,"ma phrase",{view:{...guided,revision:2,teaching:{...teaching,exercise:{...teaching.exercise,feedback:{answer:"ma phrase",correct:false,answerFr:"La phrase",explanationFr:"Pourquoi"}}}}}).draft).toBe("");
 expect(reconcileAssessmentResponse(guided,"ma phrase",{view:{...guided,revision:2,teaching:{...teaching,exercise:{...teaching.exercise,id:"exercise-2"}}}}).draft).toBe("");
 expect(reconcileAssessmentResponse(guided,"ma phrase",{view:{...guided,revision:2,teaching:{...teaching,contentId:"other-lesson"}}}).draft).toBe("");
});
it("restores the first writing draft on reload and preserves ongoing revisions",()=>{
 const learning={...view,question:null,learningCheck:{id:"revision-check",activityId:"writing",question:view.question,firstDraft:"Mon premier texte.",revisionRequired:true}} as AssessmentView;
 expect(reconcileAssessmentResponse(null,"",{view:learning}).draft).toBe("Mon premier texte.");
 expect(reconcileAssessmentResponse(learning,"Mon texte amélioré.",{view:{...learning,revision:2}}).draft).toBe("Mon texte amélioré.");
});

it("drops an in-memory answer when the session changes even if the question ID is reused",()=>{
 expect(reconcileAssessmentResponse(view,"private draft",{view:{...view,sessionId:"another-session"},conflict:true})).toMatchObject({draft:"",error:null});
});
