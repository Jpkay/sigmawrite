import {chromium} from "@playwright/test";
import {strict as assert} from "node:assert";
import {DIRECT_OBJECT_TEACHING} from "../../src/lib/diagnostic/granular/direct-object-teaching";
const browser=await chromium.launch({channel:"chrome",headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors:string[]=[],lesson=process.argv[2]?DIRECT_OBJECT_TEACHING.find(lesson=>lesson.id===process.argv[2])!:DIRECT_OBJECT_TEACHING[0];
 assert.ok(lesson,"Unknown direct-object lesson");
 page.on("pageerror",error=>errors.push(error.message));await page.goto("http://127.0.0.1:4179");
 await page.getByRole("button",{name:"Commencer",exact:true}).waitFor();
 await page.evaluate(lesson=>{
  localStorage.setItem("direct-object-teaching",lesson.id);
  localStorage.setItem("granular-ui-fixture",JSON.stringify({phase:"learning",paused:true,provisional:true,remainingSeconds:0,pendingItemId:null,results:[],priorities:[],sessionId:"11111111-1111-4111-8111-111111111111",revision:0,answeredCount:3,skippedCount:0,teaching:null,learningCheck:null,missingLearningActivityCount:0,deferredReviewCount:0,skillDetails:{},question:null,
   learningActivities:[{skillId:"direct-object",activityId:"fixture-lesson",kind:"instruction",action:"learn",titleFr:lesson.titleFr,href:"/student/diagnostic",estimatedMinutes:5,contentId:lesson.id}]}));
 },lesson);
 await page.reload();await page.getByRole("button",{name:"Commencer cette activité",exact:true}).click();
 await page.getByRole("heading",{name:lesson.learnerQuestionFr,exact:true}).waitFor();
 await page.getByRole("button",{name:"À moi d’essayer",exact:true}).click();
 assert.equal(await page.locator("textarea").count(),0);
 const selected=page.getByRole("radio",{name:lesson.practice[0].answerFr,exact:true});await selected.check();
 await page.getByRole("button",{name:"Un indice",exact:true}).click();assert.equal(await selected.isChecked(),true);
 for(const error of ["conservée","connexion"]){
  await page.getByRole("button",{name:"Vérifier ma réponse",exact:true}).click();await page.getByRole("alert").filter({hasText:error}).waitFor();assert.equal(await selected.isChecked(),true);
 }
 await page.screenshot({path:"/tmp/granular-direct-object-teaching-mobile.png",fullPage:true});
 for(const [index,exercise] of lesson.practice.entries()){
  if(index)await page.getByRole("radio",{name:exercise.answerFr,exact:true}).check();
  await page.getByRole("button",{name:"Vérifier ma réponse",exact:true}).click();await page.getByText("Oui, c’est ça !",{exact:true}).waitFor();
  await page.reload();await page.getByText("Oui, c’est ça !",{exact:true}).waitFor();
  await page.getByRole("button",{name:index+1===lesson.practice.length?"Terminer l’entraînement":"Exercice suivant",exact:true}).click();
  assert.equal(await page.locator('input[type="radio"]:checked').count(),0);
 }
 await page.getByRole("heading",{name:"Tes acquis et tes prochaines étapes",exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);assert.deepEqual(errors,[]);
 console.log("Direct-object teaching browser fixture passed: selections, hints, conflict/network retention, reload, completion, mobile width.");
}finally{await browser.close();}
