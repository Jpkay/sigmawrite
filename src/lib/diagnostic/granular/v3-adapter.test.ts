import {createWritingEvidence} from "./writing-evidence";
import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {adaptV3ForAssessment,rollUpV3Evidence,readingContextId} from "./v3-adapter";
import {assessSkills,selectProbe,type Observation} from "./engine";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const input={artifact:read("generated/french-taxonomy-v3.json"),bank:read("generated/diagnostic-bank-v3-draft.json")};
it("compiles exact v3 evidence contracts and excludes unreviewed drafts",()=>{
 const result=adaptV3ForAssessment(input);
 expect(result.skills).toHaveLength(257);
 // Twenty-five repaired inherited items require fresh approval (one answer key, twenty-four targeting/text repairs).
 expect(result.probes).toHaveLength(233);
 expect(result.unsupportedEvidenceItemKeys).toHaveLength(5);
 expect(result.unsupportedEvidenceItemKeys?.every(id=>!result.probes.some(p=>p.id===id))).toBe(true);
 expect(result.probes.some(i=>i.id==="local-conjugation-gap-v1:produire_passe_recent:controlled_production:foundation")).toBe(false);
 expect(result.probes.some(i=>i.id.startsWith("v3-evidence:"))).toBe(false);
 expect(result.skills.filter(s=>s.assessmentStage==="learning")).toHaveLength(18);
 for(const skill of result.skills)for(const prerequisite of skill.prerequisites)expect(result.skills.some(s=>s.id===prerequisite)).toBe(true);
});
it("rejects mutated taxonomy content even when the caller retains the release label",()=>{
 const changed=structuredClone(input);changed.artifact.taxonomy.nodes[0].labelFr="Changed";
 expect(()=>adaptV3ForAssessment(changed)).toThrow(/checksum/);
});
it("does not pool reception into production or certify single-occasion writing",()=>{
 const assessment=adaptV3ForAssessment(input);
 const target=assessment.skills.find(s=>s.assessmentStage==="learning")!;
 const mode=target.modes[0];
 const evidence:Observation[]=Array.from({length:3},(_,i)=>({itemId:`writing-${i}`,skillId:target.id,mode,contextId:`text-${i}`,occasionId:"same-lesson",unaided:true,correct:true,guessProbability:.05,activeSeconds:0}));
 const result=assessSkills(assessment.skills,evidence).find(r=>r.skillId===target.id)!;
 expect(result.resolved).toBe(false);
 const separate=evidence.map((o,i)=>({...o,occasionId:`lesson-${i}`,writingEvidence:createWritingEvidence({skillId:target.id,answer:`Les chevaux courent ${["vite","loin","ensemble"][i]}.`,connectedWriting:true,unaided:true,tokens:[{start:4,end:11,text:"chevaux",correct:true}]})}));
 expect(assessSkills(assessment.skills,separate).find(r=>r.skillId===target.id)?.resolved).toBe(true);
 const guided=separate.map(o=>({...o,unaided:false}));
 expect(assessSkills(assessment.skills,guided).find(r=>r.skillId===target.id)?.status).toBe("unknown");
 const map=rollUpV3Evidence(assessment,assessSkills(assessment.skills,[]));
 expect(map).toHaveLength(181);expect(map.every(n=>!n.confirmedMastery)).toBe(true);
});

it("defers independent production to learning instead of declaring a missing question bank",()=>{
 const assessment=adaptV3ForAssessment(input);
 const writing=assessment.skills.filter(s=>s.assessmentStage==="learning");
 expect(selectProbe(writing,[],[])).toMatchObject({kind:"provisional",reason:"later_evidence_required"});
});

it("requires distinct passages, not repeated questions or occasions on one text",()=>{
 const assessment=adaptV3ForAssessment(input),skill=assessment.skills.find(s=>s.nodeKey==="localiser_information_explicite")!;
 expect(skill.evidenceRequirements?.interpretation?.minimumContexts).toBe(3);
 const observations:Observation[]=Array.from({length:4},(_,index)=>({itemId:`reading-${index}`,skillId:skill.id,mode:"interpretation",correct:true,contextId:"passage:one",occasionId:`occasion-${index}`,guessProbability:.25,activeSeconds:30,unaided:true}));
 expect(assessSkills([skill],observations)[0].resolved).toBe(false);
 expect(assessSkills([skill],observations.map((o,index)=>({...o,contextId:`passage:${index}`,textType:index%2?"narrative":"informational"})))[0].status).toBe("mastered");
 const garden=assessment.probes.filter(p=>input.bank.items.find((entry:{itemKey:string})=>entry.itemKey===p.id)?.item.validatorConfig?.sourceTextKey==="garden");
 expect(garden.length).toBeGreaterThan(1);
 const entry=input.bank.items.find((entry:{item:{validatorConfig?:{sourceTextKey?:string}}})=>entry.item.validatorConfig?.sourceTextKey==="garden");
 expect(new Set(garden.map(p=>p.contextId))).toEqual(new Set([readingContextId(entry.item.validatorConfig,entry.item.promptFr)]));
});

it("uses passage content across renamed sources, question variants and whitespace",()=>{
 const entry=input.bank.items.find((entry:{item:{validatorConfig?:{sourceTextKey?:string}}})=>entry.item.validatorConfig?.sourceTextKey==="garden");
 const context=readingContextId(entry.item.validatorConfig,entry.item.promptFr);
 const renamed={...entry.item.validatorConfig,sourceTextKey:"renamed-copy"};
 const paragraphs=entry.item.promptFr.split("\n\n");paragraphs[paragraphs.length-1]="Une autre question sur le même texte ?";
 expect(readingContextId(renamed,paragraphs.join("\n\n"))).toBe(context);
 const source=paragraphs.slice(1,-1).join("\n\n");
 expect(readingContextId({...renamed,textualSupport:{passageText:source.normalize("NFD").replaceAll(" ","  ")}})).toBe(context);
 expect(readingContextId({...renamed,textualSupport:{passageText:"Un autre passage réellement distinct."}})).not.toBe(context);
 expect(()=>readingContextId(renamed,"Une consigne sans passage identifié.")).toThrow(/passage content/);
});
