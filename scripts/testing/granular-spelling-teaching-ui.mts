import {chromium} from "@playwright/test";
import {strict as assert} from "node:assert";
import {SPELLING_TEACHING} from "../../src/lib/diagnostic/granular/spelling-teaching";
const lesson=SPELLING_TEACHING.find(lesson=>lesson.id==="spelling-m-before-mbp")!;
const browser=await chromium.launch({channel:"chrome",headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors:string[]=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://127.0.0.1:4179");await page.getByRole("button",{name:"Commencer",exact:true}).click();
 await page.waitForFunction(()=>localStorage.getItem("granular-ui-fixture")!==null);
 await page.evaluate(()=>{
  const view=JSON.parse(localStorage.getItem("granular-ui-fixture")!);
  view.phase="learning";view.paused=true;view.question=null;view.pendingItemId=null;
  view.learningActivities=[{skillId:"nasal",activityId:"fixture-lesson",kind:"instruction",action:"learn",titleFr:"Choisir n ou m dans un mot",href:"/student/diagnostic",estimatedMinutes:5,contentId:"spelling-m-before-mbp"}];
  localStorage.setItem("granular-ui-fixture",JSON.stringify(view));localStorage.setItem("nasal-teaching","1");
  localStorage.setItem("teaching-conflict","1");localStorage.setItem("teaching-network","1");
 });
 await page.reload();await page.getByRole("button",{name:"Commencer cette activité",exact:true}).click();
 await page.getByRole("heading",{name:lesson.titleFr,exact:true}).waitFor();
 await page.getByText(lesson.boundaryFr,{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:"/tmp/granular-spelling-lesson-mobile.png",fullPage:true});
 await page.getByRole("button",{name:"À moi d’essayer",exact:true}).click();
 for(const [index,exercise] of lesson.practice.entries()){
  await page.getByText(exercise.promptFr,{exact:true}).waitFor();
  if(index===0)await page.getByRole("button",{name:"Un indice",exact:true}).click();
  // An intentional overapplication on the exception must show a correction.
  await page.getByLabel("Ta réponse",{exact:true}).fill(index===7?"bombonnière":exercise.answerFr);
  await page.getByRole("button",{name:"Vérifier ma réponse",exact:true}).click();
  await page.getByText(index===7?"Regarde la correction.":"Oui, c’est ça !",{exact:true}).waitFor();
  await page.getByText(exercise.explanationFr,{exact:true}).waitFor();
  if(index===7){await page.reload();await page.getByText(exercise.explanationFr,{exact:true}).waitFor();}
  await page.getByRole("button",{name:index===7?"Terminer l’entraînement":"Exercice suivant",exact:true}).click();
 }
 await page.getByRole("status").filter({hasText:"Ton entraînement est enregistré"}).waitFor();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("granular-ui-fixture")!));
 assert.equal(state.teaching,null);assert.deepEqual(state.results,[]);
 assert.deepEqual(errors,[]);
 console.log("Spelling lesson browser fixture passed: eight exercises, hint, exception correction, reload, completion, unchanged mastery and mobile layout. Backend remains a fixture.");
}finally{await browser.close();}
