import {chromium} from "@playwright/test";
import {strict as assert} from "node:assert";
const browser=await chromium.launch({channel:"chrome",headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors:string[]=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://127.0.0.1:4179");
 await page.getByRole("button",{name:"Commencer",exact:true}).waitFor();
 await page.evaluate(()=>{
  const question={id:"reading-first",promptFr:"Lis le texte.\n\nLina serre son manteau. Le vent siffle sous la porte. Son sac est bleu.\n\nPourquoi Lina serre-t-elle son manteau ?",instructionsFr:null,responseType:"mcq",choices:[{id:"cold",text:"Elle a froid."},{id:"bag",text:"Elle cherche son sac."}],supportChoices:[{id:"11111111-1111-4111-8111-111111111111",text:"Le vent siffle sous la porte."},{id:"22222222-2222-4222-8222-222222222222",text:"Son sac est bleu."}]};
  const state={phase:"assessing",paused:false,provisional:true,remainingSeconds:2000,pendingItemId:question.id,results:[],priorities:[],sessionId:"11111111-1111-4111-8111-111111111111",revision:0,answeredCount:0,teaching:null,learningCheck:null,learningActivities:[],missingLearningActivityCount:0,skillDetails:{},question};
  localStorage.setItem("granular-ui-fixture",JSON.stringify(state));
 });
 await page.reload();
 const submit=page.getByRole("button",{name:"Valider",exact:true});
 await page.getByRole("radio",{name:"Elle a froid.",exact:true}).check();
 assert.equal(await submit.isDisabled(),true);
 await page.getByRole("radio",{name:"Le vent siffle sous la porte.",exact:true}).check();
 assert.equal(await submit.isEnabled(),true);
 await page.reload();await submit.waitFor();
 assert.equal(await page.getByRole("radio",{name:"Elle a froid.",exact:true}).isChecked(),true);
 assert.equal(await page.getByRole("radio",{name:"Le vent siffle sous la porte.",exact:true}).isChecked(),true);
 await submit.click();await page.getByRole("alert").filter({hasText:"conservée"}).waitFor();
 assert.equal(await page.getByRole("radio",{name:"Elle a froid.",exact:true}).isChecked(),true);
 assert.equal(await page.getByRole("radio",{name:"Le vent siffle sous la porte.",exact:true}).isChecked(),true);
 await submit.click();await page.getByRole("alert").filter({hasText:"connexion"}).waitFor();
 assert.equal(await page.getByRole("radio",{name:"Le vent siffle sous la porte.",exact:true}).isChecked(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:"/tmp/granular-reading-support-mobile.png",fullPage:true});
 await submit.click();await page.getByText("Question 2",{exact:true}).waitFor();
 assert.equal(await page.locator('input[type="radio"]:checked').count(),0);
 assert.equal(await submit.isDisabled(),true);
 const sent=await page.evaluate(()=>JSON.parse(localStorage.getItem("reading-submitted")!));
 assert.equal(sent.answer,"cold");assert.equal(sent.supportChoiceId,"11111111-1111-4111-8111-111111111111");
 await page.reload();await page.getByText("Question 2",{exact:true}).waitFor();
 assert.equal(await page.locator('input[type="radio"]:checked').count(),0);
 assert.deepEqual(errors,[]);
 console.log("Reading UI fixture passed: both parts required, unsent answer/support reload, conflict/network retention, submitted payload, new-question reset, refresh and mobile width. Uses fixture backend.");
}finally{await browser.close();}
