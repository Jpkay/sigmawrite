import {chromium} from "@playwright/test";
import {strict as assert} from "node:assert";
const browser=await chromium.launch({channel:"chrome",headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors:string[]=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://127.0.0.1:4179");
 await page.getByRole("button",{name:"Commencer",exact:true}).click();
 await page.evaluate(()=>{
  const view=JSON.parse(localStorage.getItem("granular-ui-fixture")!);
  const targets=[{id:"words",label:"Choisir les accents",group:"orthographe_lexicale",status:"mastered"},{id:"agreement",label:"Accorder le sujet et le verbe",group:"orthographe_grammaticale",status:"missing"},{id:"pending",label:"Écrire les consonnes doubles",group:"orthographe_lexicale",status:"unknown"}];
  view.phase="learning";view.paused=true;view.question=null;view.pendingItemId=null;
  view.results=targets.map(target=>({skillId:target.id,status:target.status,resolved:target.status!=="unknown",evidence:target.status==="unknown"?"untested":"direct",modes:[{mode:"production",probability:target.status==="mastered"?.9:.1,distinctItems:target.status==="unknown"?0:4,distinctContexts:4,distinctOccasions:2,accuracy:target.status==="mastered"?1:0,confirmed:target.status!=="unknown"}]}));
  view.skillDetails=Object.fromEntries(targets.map(target=>[target.id,{labelFr:target.label,nodeKey:target.id,domain:"spelling",samplingGroup:target.group,mode:"production"}]));
  localStorage.setItem("granular-ui-fixture",JSON.stringify(view));
 });
 await page.reload();
 await page.getByRole("heading",{name:"Ton bilan détaillé"}).waitFor();
 assert.equal(await page.locator("details").count(),2);
 const lexical=page.locator("details").filter({has:page.locator("summary",{hasText:"Orthographe des mots"})});
 const grammar=page.locator("details").filter({has:page.locator("summary",{hasText:"Accords et homophones"})});
 await lexical.locator("summary").focus();await page.keyboard.press("Enter");
 await lexical.getByText("Choisir les accents",{exact:true}).waitFor();
 assert.match(await lexical.innerText(),/Bien acquis/);assert.match(await lexical.innerText(),/Pas encore vérifié/);
 assert.doesNotMatch(await lexical.innerText(),/Accorder le sujet/);
 await grammar.locator("summary").click();assert.match(await grammar.innerText(),/À travailler/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 await page.screenshot({path:"/tmp/granular-results-mobile.png",fullPage:true});
 await page.reload();await lexical.locator("summary").click();await lexical.getByText("Choisir les accents",{exact:true}).waitFor();
 // Older records lack strand metadata and must remain visible after upgrading.
 await page.evaluate(()=>{const view=JSON.parse(localStorage.getItem("granular-ui-fixture")!);for(const detail of Object.values(view.skillDetails) as Array<{samplingGroup?:string}>)delete detail.samplingGroup;localStorage.setItem("granular-ui-fixture",JSON.stringify(view));});
 await page.reload();assert.equal(await page.locator("details").count(),1);
 await page.locator("summary").getByText("Orthographe",{exact:true}).click();assert.equal(await page.locator("details li").count(),3);
 assert.deepEqual(errors,[]);
 console.log("Results browser checks passed: separate spelling strands, opposite outcomes, unresolved skills, keyboard, refresh, legacy metadata and mobile layout.");
}finally{await browser.close();}
