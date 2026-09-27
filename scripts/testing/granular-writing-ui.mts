import {chromium} from "@playwright/test";
import {strict as assert} from "node:assert";
const browser=await chromium.launch({channel:"chrome",headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors:string[]=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://127.0.0.1:4179");
 await page.getByRole("button",{name:"Commencer",exact:true}).waitFor();
 await page.evaluate(()=>{
  const state={phase:"learning",paused:true,provisional:true,remainingSeconds:0,pendingItemId:null,
   results:[{skillId:"writing",status:"unknown",resolved:false,evidence:"untested",modes:[{mode:"independent_production",probability:.5,distinctItems:0,distinctContexts:0,distinctOccasions:0,accuracy:0,confirmed:false}]}],
   priorities:[],sessionId:"11111111-1111-4111-8111-111111111111",revision:0,answeredCount:0,teaching:null,
   learningCheck:{id:"22222222-2222-4222-8222-222222222222",activityId:"revision",firstDraft:null,revisionRequired:true,
    question:{id:"writing-1",promptFr:"Raconte une découverte. Relis ensuite ton texte et améliore-le si nécessaire.",instructionsFr:null,responseType:"short_answer",choices:[],supportChoices:null}},
   learningActivities:[],missingLearningActivityCount:0,skillDetails:{writing:{labelFr:"Réviser un texte",nodeKey:"reviser_orthographe_lexicale_paragraphe",domain:"spelling",mode:"independent_production"}},question:null};
  localStorage.setItem("granular-ui-fixture",JSON.stringify(state));
 });
 await page.reload();
 const answer=page.getByLabel("Ta réponse",{exact:true});
 const first="Les cheveaux courent près du lac. Je les regarde.";
 await answer.fill(first);
 await page.reload();await answer.waitFor();assert.equal(await answer.inputValue(),first);
 await page.getByRole("button",{name:"Enregistrer ma première version",exact:true}).click();
 const submit=page.getByRole("button",{name:"Envoyer ma version relue",exact:true});
 await submit.waitFor();
 assert.equal(await answer.inputValue(),first);
 let state=await page.evaluate(()=>JSON.parse(localStorage.getItem("granular-ui-fixture")!));
 assert.equal(state.results[0].status,"unknown");assert.equal(state.results[0].modes[0].distinctItems,0);
 assert.equal(await page.getByText("Ta réponse est enregistrée et ton bilan a été mis à jour.",{exact:true}).count(),0);
 await page.reload();await submit.waitFor();assert.equal(await answer.inputValue(),first);
 const final="Les chevaux courent près du lac. Je les regarde.";
 await answer.fill(final);
 await page.reload();await submit.waitFor();assert.equal(await answer.inputValue(),final);
 await submit.click();await page.getByRole("alert").filter({hasText:"conservée"}).waitFor();
 assert.equal(await answer.inputValue(),final);
 await submit.click();await page.getByRole("alert").filter({hasText:"connexion"}).waitFor();
 assert.equal(await answer.inputValue(),final);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:"/tmp/granular-writing-revision-mobile.png",fullPage:true});
 await submit.click();
 await page.getByRole("heading",{name:"Tes acquis et tes prochaines étapes"}).waitFor();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("writing-fixture-submitted")!));
 assert.deepEqual(saved,{firstDraft:first,answer:final});
 state=await page.evaluate(()=>JSON.parse(localStorage.getItem("granular-ui-fixture")!));
 assert.equal(state.learningCheck,null);assert.deepEqual(errors,[]);
 console.log("Writing UI fixture passed: unsent first draft and edited revision reload, no interim mastery, reload recovery, revision conflict/network retention, both versions submitted and mobile width. Fixture backend, not live evaluator.");
}finally{await browser.close();}
