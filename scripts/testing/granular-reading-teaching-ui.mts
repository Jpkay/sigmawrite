import {teachingChoices} from "../../src/lib/diagnostic/granular/teaching-choices";
import {chromium} from "@playwright/test";
import {strict as assert} from "node:assert";
import {READING_TEACHING} from "../../src/lib/diagnostic/granular/reading-teaching";
const browser=await chromium.launch({channel:"chrome",headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors:string[]=[],lesson=process.argv[2]?READING_TEACHING.find(lesson=>lesson.id===process.argv[2])!:READING_TEACHING[0];
 assert.ok(lesson,"Unknown reading lesson");
 page.on("pageerror",error=>errors.push(error.message));await page.goto("http://127.0.0.1:4179");
 await page.getByRole("button",{name:"Commencer",exact:true}).waitFor();
 await page.evaluate(lesson=>{
  localStorage.setItem("reading-teaching",lesson.id);
  localStorage.setItem("granular-ui-fixture",JSON.stringify({phase:"learning",paused:true,provisional:true,remainingSeconds:0,pendingItemId:null,results:[],priorities:[],sessionId:"11111111-1111-4111-8111-111111111111",revision:0,answeredCount:3,skippedCount:0,teaching:null,learningCheck:null,missingLearningActivityCount:0,deferredReviewCount:0,skillDetails:{},question:null,
   learningActivities:[{skillId:"reading",activityId:"fixture-lesson",kind:"instruction",action:"learn",titleFr:lesson.titleFr,href:"/student/diagnostic",estimatedMinutes:5,contentId:lesson.id}]}));
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
 await page.screenshot({path:"/tmp/granular-reading-teaching-mobile.png",fullPage:true});
 for(const [index,exercise] of lesson.practice.entries()){
  const expectedOrder=teachingChoices("11111111-1111-4111-8111-111111111111",lesson.id,exercise)!.map(choice=>choice.text);
  assert.deepEqual((await page.locator("fieldset label").allTextContents()).map(text=>text.trim()),expectedOrder);
  if(index)await page.getByRole("radio",{name:exercise.answerFr,exact:true}).check();
  await page.reload();
  await page.getByRole("radio",{name:exercise.answerFr,exact:true}).waitFor();
  assert.deepEqual((await page.locator("fieldset label").allTextContents()).map(text=>text.trim()),expectedOrder);
  assert.equal(await page.getByRole("radio",{name:exercise.answerFr,exact:true}).isChecked(),true);
  await page.getByRole("button",{name:"Vérifier ma réponse",exact:true}).click();await page.getByText("Oui, c’est ça !",{exact:true}).waitFor();
  await page.reload();await page.getByText("Oui, c’est ça !",{exact:true}).waitFor();
  await page.getByRole("button",{name:index+1===lesson.practice.length?"Terminer l’entraînement":"Exercice suivant",exact:true}).click();
  assert.equal(await page.locator('input[type="radio"]:checked').count(),0);
 }
 await page.getByRole("heading",{name:"Tes acquis et tes prochaines étapes",exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);assert.deepEqual(errors,[]);
 console.log("Reading teaching browser fixture passed: production choice-order parity, selections, hints, conflict/network retention, stable reload order, completion, mobile width.");
}finally{await browser.close();}
