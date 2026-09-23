import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {FRENCH_TEACHING_DRAFTS} from "./draft-teaching-catalogue";
import {featureLabel} from "./feature-labels";
import {teachingMaterialKeys} from "./material-annotations";
import {RESULT_GROUPS} from "./result-groups";
import type {EvidenceSkill} from "./v3-adapter";
import {revision45SkillCopy,revision45TeachingCopy} from "./revision-45-copy";

const skill=(nodeKey:string,labelFr:string):EvidenceSkill=>({id:`${nodeKey}::reading-receptive`,nodeKey,evidenceKey:"reading-receptive",labelFr,domain:"conjugation",branch:"conjugation",level:0,prerequisites:[],modes:["recognition"]});

it("replaces only the selected student-facing skill labels",()=>{
 const input=[skill("distinguer_personne_nombre","Identifier les traits de personne-nombre"),skill("identifier_sujet_verbe","Identifier le sujet du verbe"),skill("produire_futur_proche","Produire le futur proche — aller"),skill("choisir_auxiliaire_compose","Choisir l'auxiliaire d'un temps composé — Verbe pronominal"),skill("advanced_unchanged","Analyse avancée")];
 const output=revision45SkillCopy(input);
 expect(output.map(row=>row.labelFr)).toEqual(["Choisir la forme du verbe qui va avec le sujet","Repérer qui ou ce qui fait l’action","Écrire ce qui va se passer avec aller et un autre verbe — aller","Choisir avoir ou être pour conjuguer avec deux mots — avec se ou s’","Analyse avancée"]);
 expect(input.map(row=>row.labelFr)).toEqual(["Identifier les traits de personne-nombre","Identifier le sujet du verbe","Produire le futur proche — aller","Choisir l'auxiliaire d'un temps composé — Verbe pronominal","Analyse avancée"]);
});

it("rewrites selected authored lesson titles without changing their bindings",()=>{
 const input=[{id:"relative",nodeKey:"construction_subordonnee_relative",titleFr:"Repérer une proposition relative"},{id:"advanced",nodeKey:"advanced",titleFr:"Analyse avancée"}];
 expect(revision45TeachingCopy(input)).toEqual([{...input[0],titleFr:"Repérer les mots qui précisent un nom"},input[1]]);
 expect(input[0].titleFr).toBe("Repérer une proposition relative");
});

it("rewrites only known guided-practice prompts while preserving teaching answers and support",()=>{
 const output=revision45TeachingCopy(FRENCH_TEACHING_DRAFTS);
 const changedByNode:Record<string,number>={};
 const plainRecognitionIds=[...Array.from({length:6},(_,index)=>`past-recognition-guided-${index}`),...Array.from({length:6},(_,index)=>`subjonctif-recognition-guided-${index+1}`),"imparfait-guide-2","futur-simple-guide-2","present-foundation-3","present-foundation-6"];
 const allowedAnswerChanges=new Set(["canonical-recognition-guide-1","canonical-recognition-guide-3","canonical-recognition-guide-5","direct-object-guide-6","direct-object-guide-7","direct-object-guide-8",...plainRecognitionIds]);
 const allowedChoiceChanges=new Set(["canonical-recognition-guide-1","canonical-recognition-guide-3","canonical-recognition-guide-5","direct-object-guide-1","direct-object-guide-2","direct-object-guide-4","direct-object-guide-5","direct-object-guide-6","direct-object-guide-7","direct-object-guide-8",...plainRecognitionIds]);
 for(const [lessonIndex,lesson] of FRENCH_TEACHING_DRAFTS.entries()){
  const copied=output[lessonIndex];
  expect({facetKey:copied.facetKey,id:copied.id,mode:copied.mode,nodeKey:copied.nodeKey}).toEqual({facetKey:lesson.facetKey,id:lesson.id,mode:lesson.mode,nodeKey:lesson.nodeKey});
  expect(copied.steps).toEqual(lesson.steps);
  expect(copied.practice).toHaveLength(lesson.practice.length);
  for(const [practiceIndex,practice] of lesson.practice.entries()){
   const rewritten=copied.practice[practiceIndex];
   if(rewritten.promptFr!==practice.promptFr)changedByNode[lesson.nodeKey]=(changedByNode[lesson.nodeKey]??0)+1;
   expect({explanationFr:rewritten.explanationFr,hintFr:rewritten.hintFr}).toEqual({explanationFr:practice.explanationFr,hintFr:practice.hintFr});
   if(allowedAnswerChanges.has(practice.id))expect(rewritten.answerFr).not.toBe(practice.answerFr);
   else expect(rewritten.answerFr).toBe(practice.answerFr);
   if(allowedChoiceChanges.has(practice.id))expect(rewritten.choices).not.toEqual(practice.choices);
   else expect(rewritten.choices).toEqual(practice.choices);
   if(rewritten.choices){
    expect(new Set(rewritten.choices.map(choice=>choice.toLocaleLowerCase("fr"))).size).toBe(rewritten.choices.length);
    expect(rewritten.choices.filter(choice=>choice===rewritten.answerFr)).toHaveLength(1);
   }
  }
 }
 expect(changedByNode).toEqual({
  produire_passe_simple:108,
  produire_subjonctif_present_frequent:112,
  produire_plus_que_parfait:112,
  produire_conditionnel_present:112,
  produire_passe_compose:112,
  produire_imparfait:112,
  construction_pronom_sujet:6,
  reconnaitre_passe_compose:6,
  reconnaitre_plus_que_parfait:6,
  reconnaitre_conditionnel_present:6,
  reconnaitre_passe_simple:6,
  reconnaitre_subjonctif_present:6,
  reconnaitre_imparfait:6,
  reconnaitre_futur_simple:6,
  construction_phrase_canonique:10,
  reconnaitre_present_indicatif:6,
  reconnaitre_radical_terminaison:5,
  identifier_complement_direct:8,
  identifier_sujet_verbe:6,
 });
 expect(FRENCH_TEACHING_DRAFTS[0].practice[0].promptFr).not.toBe(output[0].practice[0].promptFr);
 for(const lesson of output)expect(()=>teachingMaterialKeys(lesson)).not.toThrow();
});

it("replaces the sixteen remaining school-name answers with observable descriptions",()=>{
 const ids=new Set([...Array.from({length:6},(_,index)=>`past-recognition-guided-${index}`),...Array.from({length:6},(_,index)=>`subjonctif-recognition-guided-${index+1}`),"imparfait-guide-2","futur-simple-guide-2","present-foundation-3","present-foundation-6"]);
 const practices=revision45TeachingCopy(FRENCH_TEACHING_DRAFTS).flatMap(lesson=>lesson.practice).filter(practice=>ids.has(practice.id));
 expect(practices).toHaveLength(16);
 const displayed=practices.flatMap(practice=>[practice.promptFr,practice.answerFr,...practice.choices??[]]).join(" ");
 expect(displayed).not.toMatch(/passé simple|\bimparfait\b|passé composé|présent de l’indicatif|futur simple|subjonctif|indicatif|conditionnel présent|\binfinitif\b/i);
 for(const practice of practices){
  expect(practice.promptFr).toContain("Quelle description correspond");
  expect(practice.choices?.filter(choice=>choice===practice.answerFr)).toHaveLength(1);
 }
});

it("removes the requested grammar labels without breaking multiple-choice answers",()=>{
 const output=revision45TeachingCopy(FRENCH_TEACHING_DRAFTS);
 const canonical=output.filter(lesson=>lesson.nodeKey==="construction_phrase_canonique").flatMap(lesson=>lesson.practice);
 const directObjects=output.filter(lesson=>lesson.nodeKey==="identifier_complement_direct").flatMap(lesson=>lesson.practice);
 expect(canonical.flatMap(practice=>[practice.promptFr,practice.answerFr,...practice.choices??[]]).join(" ")).not.toMatch(/\b(?:sujet|verbe|complément)\b/i);
 expect(directObjects.flatMap(practice=>[practice.promptFr,practice.answerFr,...practice.choices??[]]).join(" ")).not.toMatch(/\bCOD\b/i);
 expect(directObjects.filter(practice=>practice.id.endsWith("-6")||practice.id.endsWith("-7")||practice.id.endsWith("-8")).map(practice=>practice.answerFr)).toEqual(["Aucun","Aucun","Aucun"]);
 for(const practice of [...canonical,...directObjects])if(practice.choices)expect(practice.choices.filter(choice=>choice===practice.answerFr)).toHaveLength(1);
 const plainPromptNodes=new Set(["construction_phrase_canonique","identifier_complement_direct","identifier_sujet_verbe","reconnaitre_radical_terminaison","construction_pronom_sujet"]);
 const plainPrompts=output.filter(lesson=>plainPromptNodes.has(lesson.nodeKey)).flatMap(lesson=>lesson.practice.map(practice=>practice.promptFr)).join(" ");
 expect(plainPrompts).not.toMatch(/phrase canonique|\bCOD\b|groupe sujet|radical|terminaison|pronom sujet/i);
 const passeComposePrompts=output.filter(lesson=>lesson.nodeKey==="produire_passe_compose").flatMap(lesson=>lesson.practice.map(practice=>practice.promptFr));
 expect(passeComposePrompts.filter(prompt=>/La fin du mot doit aller avec « (?:il|elle|ils|elles) »\.$/.test(prompt))).toHaveLength(24);
 expect(passeComposePrompts.join(" ")).not.toMatch(/Sujet (?:masculin|féminin) (?:singulier|pluriel)/);
});

it("keeps every inserted model form away from the answers and choices it supports",()=>{
 const examples:Readonly<Record<string,readonly string[]>>={
  produire_subjonctif_present_frequent:["rêves"],
  produire_plus_que_parfait:["avait rêvé","était tombé"],
  produire_conditionnel_present:["rêverais"],
  produire_imparfait:["rêvais"],
  produire_passe_simple:["marcha"],
  produire_passe_compose:["a rêvé","est tombé"],
  reconnaitre_passe_compose:["a rêvé","est tombé"],
  reconnaitre_plus_que_parfait:["avait rêvé","était tombé"],
  reconnaitre_conditionnel_present:["rêverais","rêverions"],
  reconnaitre_imparfait:["rêvait"],
  reconnaitre_futur_simple:["chanteras"],
 };
 for(const lesson of FRENCH_TEACHING_DRAFTS){
  const modelForms=examples[lesson.nodeKey];
  if(!modelForms)continue;
  for(const practice of lesson.practice){
   const answers=[practice.answerFr,...practice.choices??[]].map(text=>text.toLocaleLowerCase("fr"));
   for(const model of modelForms)expect(answers.some(answer=>answer.includes(model))).toBe(false);
  }
 }
});

it("uses concrete labels in expanded student results",()=>{
 expect(featureLabel("direct-object-avoir")).toBe("Avec avoir : « Elle a sorti son cahier »");
 expect(featureLabel("no-direct-object-etre")).toBe("Avec être : « Elle est sortie »");
 expect(RESULT_GROUPS.find(group=>group.id==="conjugation")?.labelFr).toBe("Formes des verbes");
});

it("keeps the teaching rewrite behind the revision 45 release gate",()=>{
 const builder=readFileSync("scripts/build-parallel-review-candidate.mts","utf8");
 expect(builder).toContain("bankRevision!==undefined&&bankRevision>=45?revision45TeachingCopy(authoredTeachingContent):authoredTeachingContent");
});
