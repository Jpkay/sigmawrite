import {chromium} from "@playwright/test";
import {strict as assert} from "node:assert";
const browser=await chromium.launch({channel:"chrome",headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors:string[]=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://127.0.0.1:4179");
 await page.getByRole("button",{name:"Commencer",exact:true}).click();
 const answer=page.getByLabel("Ta réponse",{exact:true}),skip=page.getByRole("button",{name:"Je ne sais pas",exact:true});
 await answer.fill("brouillon");await skip.click();
 await page.getByRole("alert").filter({hasText:"connexion"}).waitFor();assert.equal(await answer.inputValue(),"brouillon");
 await skip.click();await page.getByRole("alert").filter({hasText:"conservée"}).waitFor();assert.equal(await answer.inputValue(),"brouillon");
 await skip.click();await page.getByText("Question passée. Ce point reste à vérifier.",{exact:true}).waitFor();assert.equal(await answer.inputValue(),"");
 const command=await page.evaluate(()=>JSON.parse(localStorage.getItem("skip-submitted")!));
 assert.deepEqual(Object.keys(command).sort(),["itemId","revision","sessionId","type"]);
 assert.equal(command.type,"skip");
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("granular-ui-fixture")!).skippedCount),1);
 // Empty answers can still be skipped; the submit button remains disabled.
 assert.equal(await page.getByRole("button",{name:"Valider",exact:true}).isDisabled(),true);
 await skip.click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem("granular-ui-fixture")!).skippedCount===2);
 await page.getByRole("heading",{name:"Question 3",exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:"/tmp/granular-skip-mobile.png",fullPage:true});
 console.log("Skip browser checks passed: empty response, retry, conflict, cleared draft and mobile layout.");
}finally{await browser.close();}
