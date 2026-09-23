import {mkdtemp,readFile,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe,expect,it,vi} from "vitest";

import {
  JevClient,buildJevState,extractInstructionItems,reportCsv,routeProbabilities,runJevAudit,
  type InstructionAuditItem,
} from "./jev-instruction-audit";

const baseItem:InstructionAuditItem={
  id:"legacy-v2-artifact:item-1",source:"legacy-v2-artifact",sourcePath:"bank.json",sourceStatus:"legacy artifact",
  surface:"diagnostic_item",parentId:"item-1",skillKey:"reading",
  exactSourceText:{promptFr:"Lis le texte.\n\nUn ornithorynque nage.\n\nQue fait l’animal ?"},
  auditSegments:["Lis le texte.","Que fait l’animal ?"],
  separationNote:"recognized_reading",
  excludedContent:{kind:"reading_passage",paragraphs:["Un ornithorynque nage."]},
};

describe("Jev instruction audit extraction",()=>{
  it("keeps exact source text and excludes reading-passage vocabulary from the audited state",async()=>{
    const root=await mkdtemp(join(tmpdir(),"jev-audit-"));
    await writeFile(join(root,"bank.json"),"{}");
    await writeFile(join(root,"catalogue.json"),"{}");
    // The exported paths are fixed, so create only the source selected for this fixture.
    await import("node:fs/promises").then(({mkdir})=>mkdir(join(root,"generated"),{recursive:true}));
    await writeFile(join(root,"generated/diagnostic-bank-v2.json"),JSON.stringify({items:[{itemKey:"reading-1",item:{nodeKey:"literal",promptFr:baseItem.exactSourceText.promptFr,instructionsFr:"Choisis une réponse."}}]}));
    const [item]=await extractInstructionItems(root,["legacy-v2-artifact"]);
    expect(item.exactSourceText.promptFr).toBe(baseItem.exactSourceText.promptFr);
    expect(item.auditSegments).toEqual(["Lis le texte.","Que fait l’animal ?","Choisis une réponse."]);
    expect(item.excludedContent).toEqual({kind:"reading_passage",paragraphs:["Un ornithorynque nage."]});
    expect(JSON.stringify(buildJevState(item))).not.toContain("ornithorynque");
  });

  it("labels every teaching exercise as draft and retains stable lesson/exercise IDs",async()=>{
    const root=await mkdtemp(join(tmpdir(),"jev-audit-"));
    const path=join(root,"docs/diagnostic");
    await import("node:fs/promises").then(({mkdir})=>mkdir(path,{recursive:true}));
    await writeFile(join(path,"v3-teaching-review-catalogue.json"),JSON.stringify({status:"draft_requires_review",rows:[{lessonId:"lesson-a",nodeKey:"node-a",content:{practice:[{id:"exercise-a",promptFr:"Transforme la phrase.\n\nLina lit."}]}}]}));
    const [item]=await extractInstructionItems(root,["draft-v3-teaching"]);
    expect(item).toMatchObject({id:"draft-v3-teaching:lesson-a:exercise-a",parentId:"lesson-a",sourceStatus:expect.stringContaining("Draft")});
    expect(item.auditSegments).toEqual(["Transforme la phrase."]);
    expect(item.excludedContent?.paragraphs).toEqual(["Lina lit."]);
    expect(item.separationNote).toBe("recognized_task_split");
  });

  it("keeps the trailing direction and excludes preceding task material in a recognized two-paragraph prompt",async()=>{
    const root=await mkdtemp(join(tmpdir(),"jev-audit-"));
    const generated=join(root,"generated");
    await import("node:fs/promises").then(({mkdir})=>mkdir(generated,{recursive:true}));
    const prompt="Elle a compris la consigne.\n\nDans cette phrase, « compris » est-il un infinitif ou un participe passé ?";
    await writeFile(join(generated,"diagnostic-bank-v2.json"),JSON.stringify({items:[{itemKey:"grammar-1",item:{promptFr:prompt}}]}));
    const [item]=await extractInstructionItems(root,["legacy-v2-artifact"]);
    expect(item.auditSegments).toEqual(["Dans cette phrase, « … » est-il un infinitif ou un participe passé ?"]);
    expect(item.separationNote).toBe("recognized_task_split");
    expect(item.excludedContent?.paragraphs).toEqual(["Elle a compris la consigne."]);
    expect(item.exactSourceText.promptFr).toBe(prompt);
  });

  it("retains the complete one-paragraph writing direction while abstracting quoted task values",async()=>{
    const root=await mkdtemp(join(tmpdir(),"jev-audit-"));
    const generated=join(root,"generated");
    await import("node:fs/promises").then(({mkdir})=>mkdir(generated,{recursive:true}));
    const prompt="Sujet : « tu ». Verbe : « être ». Temps demandé : présent de l’indicatif. Quelle forme faut-il écrire ?";
    await writeFile(join(generated,"diagnostic-bank-v2.json"),JSON.stringify({items:[{itemKey:"writing-1",item:{promptFr:prompt}}]}));
    const [item]=await extractInstructionItems(root,["legacy-v2-artifact"]);
    expect(item.auditSegments).toEqual(["Sujet : « … ». Verbe : « … ». Temps demandé : présent de l’indicatif. Quelle forme faut-il écrire ?"]);
    expect(item.exactSourceText.promptFr).toBe(prompt);
  });

  it("never hides quoted or parenthesized grammar concepts from Jev",async()=>{
    const root=await mkdtemp(join(tmpdir(),"jev-audit-"));
    const generated=join(root,"generated");
    await import("node:fs/promises").then(({mkdir})=>mkdir(generated,{recursive:true}));
    const prompt="Choisis le « sujet » au temps demandé (présent de l’indicatif), puis écris « finir ».";
    await writeFile(join(generated,"diagnostic-bank-v2.json"),JSON.stringify({items:[{itemKey:"concept-1",item:{promptFr:prompt}}]}));
    const [item]=await extractInstructionItems(root,["legacy-v2-artifact"]);
    expect(item.auditSegments).toEqual(["Choisis le « sujet » au temps demandé (présent de l’indicatif), puis écris « … »."]);
  });

  it("removes inline blank task material but keeps the grammar requirement and trailing response direction",async()=>{
    const root=await mkdtemp(join(tmpdir(),"jev-audit-"));
    const generated=join(root,"generated");
    await import("node:fs/promises").then(({mkdir})=>mkdir(generated,{recursive:true}));
    const prompts=[
      "Complète avec être au passé simple : Ce jour-là, je ___ choisi pour guider le groupe. Écris seulement le verbe.",
      "Complète avec être au passé simple : Tu ___ le premier à apercevoir le refuge. Écris seulement le verbe.",
    ];
    await writeFile(join(generated,"diagnostic-bank-v2.json"),JSON.stringify({items:prompts.map((promptFr,index)=>({itemKey:`blank-${index}`,item:{promptFr}}))}));
    const items=await extractInstructionItems(root,["legacy-v2-artifact"]);
    expect(items[0].auditSegments).toEqual(["Complète avec être au passé simple :","Écris seulement le verbe."]);
    expect(items[1].auditSegments).toEqual(items[0].auditSegments);
    expect(items[0].excludedContent?.paragraphs).toEqual(["Ce jour-là, je ___ choisi pour guider le groupe."]);
  });

  it("excludes a blank-containing task paragraph when a separate direction is present",async()=>{
    const root=await mkdtemp(join(tmpdir(),"jev-audit-"));
    const generated=join(root,"generated");
    await import("node:fs/promises").then(({mkdir})=>mkdir(generated,{recursive:true}));
    const prompt="Hier, Lina ___ partie tôt (passé composé).\n\nChoisis entre avoir et être.";
    await writeFile(join(generated,"diagnostic-bank-v2.json"),JSON.stringify({items:[{itemKey:"paragraph-blank",item:{promptFr:prompt}}]}));
    const [item]=await extractInstructionItems(root,["legacy-v2-artifact"]);
    expect(item.auditSegments).toEqual(["(passé composé)","Choisis entre avoir et être."]);
    expect(item.excludedContent?.paragraphs).toEqual(["Hier, Lina ___ partie tôt (passé composé)."]);
    expect(item.exactSourceText.promptFr).toBe(prompt);
  });

  it("retains the action prefix when the blank paragraph also contains the direction",async()=>{
    const root=await mkdtemp(join(tmpdir(),"jev-audit-"));
    const generated=join(root,"generated");
    await import("node:fs/promises").then(({mkdir})=>mkdir(generated,{recursive:true}));
    const prompt="Complète au présent : Nous ___ ce travail aujourd’hui. (finir)\n\nÉcris seulement la forme verbale.";
    await writeFile(join(generated,"diagnostic-bank-v2.json"),JSON.stringify({items:[{itemKey:"paragraph-direction-blank",item:{promptFr:prompt}}]}));
    const [item]=await extractInstructionItems(root,["legacy-v2-artifact"]);
    expect(item.auditSegments).toEqual(["Complète au présent :","Écris seulement la forme verbale."]);
    expect(item.excludedContent?.paragraphs).toEqual(["Nous ___ ce travail aujourd’hui. (finir)"]);
  });
});

describe("Jev instruction audit evaluation",()=>{
  it("routes only the stored probabilities with conservative review and rewrite bands",()=>{
    expect(routeProbabilities({actionIsClear:.95,requiresUnexplainedGrammarJargon:.1,incidentalVocabularyIsBarrier:.05}).route).toBe("pass");
    expect(routeProbabilities({actionIsClear:.55,requiresUnexplainedGrammarJargon:.1,incidentalVocabularyIsBarrier:.05}).route).toBe("review");
    expect(routeProbabilities({actionIsClear:.9,requiresUnexplainedGrammarJargon:.8,incidentalVocabularyIsBarrier:.05}).route).toBe("likely_rewrite");
  });

  it("sends all three narrow questions in one documented System One request",async()=>{
    const fetchImpl=vi.fn(async(_url:string|URL|Request,init?:RequestInit)=>{
      const body=JSON.parse(String(init?.body));
      expect(Object.keys(body.questions)).toEqual(["action_is_clear","requires_unexplained_grammar_jargon","incidental_vocabulary_is_barrier"]);
      expect(body.state.direction_or_question_wording).toEqual(baseItem.auditSegments);
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer secret-key");
      return new Response(JSON.stringify({model:"jev-1.13.0",answers:{action_is_clear:{type:"noul",noul:.91},requires_unexplained_grammar_jargon:{type:"noul",noul:.12},incidental_vocabulary_is_barrier:{type:"noul",noul:.08}},usage:{input_tokens:10,output_tokens:3}}),{status:200,headers:{"content-type":"application/json"}});
    }) as typeof fetch;
    const result=await new JevClient({apiKey:"secret-key",fetchImpl}).evaluate(baseItem);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({model:"jev-1.13.0",route:"pass",probabilities:{actionIsClear:.91}});
  });

  it("resumes from its cache without a second Jev request and exports every probability",async()=>{
    const root=await mkdtemp(join(tmpdir(),"jev-audit-cache-"));
    const fetchImpl=vi.fn(async()=>new Response(JSON.stringify({model:"jev-1.13.0",answers:{action_is_clear:{type:"noul",noul:.5},requires_unexplained_grammar_jargon:{type:"noul",noul:.2},incidental_vocabulary_is_barrier:{type:"noul",noul:.1}},usage:{input_tokens:4,output_tokens:1}}),{status:200})) as typeof fetch;
    const client=new JevClient({apiKey:"secret",fetchImpl});
    const cachePath=join(root,"cache.json");
    const duplicate={...baseItem,id:"active-v2:item-2",parentId:"item-2"};
    const first=await runJevAudit({items:[baseItem,duplicate],client,cachePath,concurrency:2});
    const second=await runJevAudit({items:[baseItem,duplicate],client,cachePath,concurrency:2});
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(second.get(baseItem.id)).toEqual(first.get(baseItem.id));
    expect(first.get(duplicate.id)).toEqual(first.get(baseItem.id));
    const csv=reportCsv([{item:baseItem,result:first.get(baseItem.id)!}]);
    expect(csv).toContain("action_is_clear_probability");
    expect(csv).toContain("requires_unexplained_grammar_jargon_probability");
    expect(csv).toContain("incidental_vocabulary_is_barrier_probability");
    expect(JSON.parse(await readFile(cachePath,"utf8")).entries).toBeTruthy();
  });
});
