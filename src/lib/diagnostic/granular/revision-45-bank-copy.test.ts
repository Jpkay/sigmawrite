import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "./draft-expansion-sources";
import {assembleDraftBank,type DraftExpansion} from "./assemble-drafts";

const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const base=read("generated/diagnostic-bank-v3-draft.json"),taxonomy=read("generated/french-taxonomy-v3.json").taxonomy;
const expansions=FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`) as DraftExpansion);
const r44=assembleDraftBank(base,taxonomy,expansions,{revision:44});
const r45=assembleDraftBank(base,taxonomy,expansions,{revision:45});
const item=(bank:typeof r44.bank,key:string)=>bank.items.find(entry=>entry.itemKey===key)!;
const annotation=(rows:typeof r44.annotations,key:string)=>rows.find(row=>row.itemKey===key)!;

function answerShape(entry:ReturnType<typeof item>){
 return {correctAnswer:entry.item.correctAnswer,acceptableAnswers:entry.item.acceptableAnswers,correctChoices:entry.item.choices?.map(choice=>choice.correct),validatorType:entry.item.validatorType,evidenceKey:entry.evidenceKey,evidenceExpectation:entry.evidenceExpectation};
}

it("leaves revision 44 source items and annotations immutable",()=>{
 const sourceItems=new Map(expansions.flatMap(expansion=>expansion.items).map(entry=>[entry.itemKey,entry]));
 const keys=["v3-subject-identification:camera","v3-reference-foundations:production:1","v3-canonical-sentence:recognition-1","v3-canonical-sentence:production-1","v3-conjugation-foundation:present-draw","v3-conjugation-foundation:segment-chantons","v3-direct-object:manga","v3-written-adjective:production-17","v3-completive-production:1","v3-agreement:additional-engine","v3-passive-production:10"];
 for(const key of keys){
  expect(item(r44.bank,key)).toEqual(sourceItems.get(key));
  expect(annotation(r44.annotations,key).itemChecksum).toBe(checksum(sourceItems.get(key)));
 }
 expect(item(r44.bank,"review-draft-v1:identifier_sujet_verbe:receptive:core").item.promptFr).toBe("Laquelle de ces phrases ne contient PAS de sujet inversé ?");
});

it("uses plain functional wording while preserving every answer and validator",()=>{
 const prefixes=["v3-subject-identification:","v3-reference-foundations:production:","v3-canonical-sentence:","v3-conjugation-foundation:present-","v3-conjugation-foundation:segment-","v3-direct-object:"];
 const keys=r45.bank.items.filter(entry=>prefixes.some(prefix=>entry.itemKey.startsWith(prefix))).filter(entry=>!entry.itemKey.startsWith("v3-reference-foundations:production:")||Number(entry.itemKey.split(":").at(-1))<=12).map(entry=>entry.itemKey);
 expect(keys).toHaveLength(96);
 for(const key of keys){
  expect(answerShape(item(r45.bank,key))).toEqual(answerShape(item(r44.bank,key)));
  expect(annotation(r45.annotations,key).itemChecksum).toBe(checksum(item(r45.bank,key)));
 }

 const subjects=r45.bank.items.filter(entry=>entry.itemKey.startsWith("v3-subject-identification:"));
 expect(subjects).toHaveLength(16);
 for(const entry of subjects)expect(`${entry.item.promptFr} ${entry.item.instructionsFr}`).not.toMatch(/\bsujet\b/i);
 expect(new Set(subjects.map(entry=>entry.item.promptFr.split("\n\n")[1]))).toEqual(new Set(["Dans cette phrase, quels mots disent qui ou ce qui fait l’action ? Choisis le groupe complet."]));
 const legacy=item(r45.bank,"review-draft-v1:identifier_sujet_verbe:receptive:core").item;
 expect(`${legacy.promptFr} ${legacy.choices?.map(choice=>choice.feedbackFr).join(" ")}`).not.toMatch(/\b(sujet|verbe)\b/i);

 const references=r45.bank.items.filter(entry=>/^v3-reference-foundations:production:(?:[1-9]|1[0-2])$/.test(entry.itemKey));
 expect(references).toHaveLength(12);
 for(const entry of references)expect(entry.item.promptFr).toContain("par il, elle, nous, vous, ils ou elles");

 const canonical=r45.bank.items.filter(entry=>entry.itemKey.startsWith("v3-canonical-sentence:"));
 expect(canonical).toHaveLength(32);
 for(const entry of canonical){
  expect(`${entry.item.promptFr} ${(entry.item.choices??[]).map(choice=>choice.text).join(" ")}`).not.toMatch(/\b(sujet|verbe|complément)\b/i);
  expect(entry.item.choices?.map(choice=>choice.text).join(" ")??"").not.toContain("» fait l’action");
  expect(JSON.stringify(entry.item.validatorConfig?.materialExposure)).not.toMatch(/\b(sujet|verbe|complément)\b/i);
 }
 expect(canonical.filter(entry=>entry.item.choices?.find(choice=>choice.correct)?.text==="Il manque un mot qui dit ce qui se passe.")).toHaveLength(4);

 const present=r45.bank.items.filter(entry=>entry.itemKey.startsWith("v3-conjugation-foundation:present-"));
 expect(present).toHaveLength(10);
 for(const entry of present)expect(entry.item.promptFr).toBe("Quelle phrase dit ce qui se passe maintenant ou d’habitude ?");
 const segments=r45.bank.items.filter(entry=>entry.itemKey.startsWith("v3-conjugation-foundation:segment-"));
 expect(segments).toHaveLength(10);
 for(const entry of segments)expect(`${entry.item.promptFr} ${JSON.stringify(entry.item.validatorConfig?.materialExposure)}`).not.toMatch(/radical|terminaison/i);

 const direct=r45.bank.items.filter(entry=>entry.itemKey.startsWith("v3-direct-object:"));
 expect(direct).toHaveLength(16);
 for(const entry of direct){
  expect(`${entry.item.promptFr} ${entry.item.choices?.map(choice=>choice.text).join(" ")}`).not.toMatch(/\bCOD\b|complément d’objet/i);
  expect(new Set(entry.item.choices?.map(choice=>choice.text)).size).toBe(4);
  const exposure=entry.item.validatorConfig?.materialExposure as {sentences:string[]};
  for(const choice of entry.item.choices??[])expect(exposure.sentences).toContain(choice.text);
 }
 expect(direct.filter(entry=>entry.item.choices?.find(choice=>choice.correct)?.text==="Aucun")).toHaveLength(4);
 expect(item(r45.bank,"v3-direct-object:indirect-only").item.promptFr).toContain("venir juste après « téléphone » sans « à »");
 expect(item(r45.bank,"v3-direct-object:indirect-only").item.choices?.map(choice=>choice.text)).toEqual(["Aucun","son cousin","Zoé","téléphone"]);
 expect(item(r45.bank,"v3-direct-object:sleep").item.choices?.map(choice=>choice.text)).toEqual(["Aucun","sa chambre","Le bébé","dort"]);
 expect(item(r45.bank,"v3-direct-object:provenance").item.choices?.map(choice=>choice.text)).toEqual(["Aucun","Bruxelles","Le car","arrive"]);
 expect(item(r45.bank,"v3-direct-object:attribute").item.promptFr).toContain("La musicienne fait-elle quelque chose à une autre personne ou à une chose ?");
});

it("hardens the additional selected prompts without changing their answers",()=>{
 const groups=[
  r45.bank.items.filter(entry=>/^v3-written-adjective:production-(?:17|18|19|20)$/.test(entry.itemKey)),
  r45.bank.items.filter(entry=>/^v3-completive-production:(?:1|10|11|12)$/.test(entry.itemKey)),
  r45.bank.items.filter(entry=>entry.itemKey.startsWith("v3-agreement:additional-")),
  r45.bank.items.filter(entry=>entry.itemKey==="v3-passive-production:10"),
 ];
 expect(groups.map(group=>group.length)).toEqual([4,4,24,1]);
 for(const entry of groups.flat()){
  expect(answerShape(entry)).toEqual(answerShape(item(r44.bank,entry.itemKey)));
  expect(annotation(r45.annotations,entry.itemKey).itemChecksum).toBe(checksum(entry));
 }
 expect(groups[0].every(entry=>!`${entry.item.promptFr} ${entry.item.instructionsFr}`.includes("adjectif"))).toBe(true);
 expect(groups[1].every(entry=>!entry.item.promptFr.includes("proposition"))).toBe(true);
 expect(groups[2].every(entry=>!entry.item.promptFr.includes("au présent"))).toBe(true);
 expect(groups[3][0].item.promptFr).not.toMatch(/voix passive|imparfait/i);
});
