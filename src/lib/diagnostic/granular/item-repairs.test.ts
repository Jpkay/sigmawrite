import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {repairDraftItems,type DraftItemRepair} from "./draft-corrections";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const source=read("generated/diagnostic-bank-v3-candidate.json") as CanonicalDiagnosticBankArtifact;
const draft=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const repairs=read("docs/diagnostic/v3-item-repairs.json") as DraftItemRepair[];

it("rebuilds all held questions with fresh gates but no inherited release approval",()=>{
 expect(repairs).toHaveLength(24);
 const validation=validateCanonicalDiagnosticBank(draft,read("generated/french-taxonomy-v3.json").taxonomy);
 expect(validation.issues).toEqual([]);
 for(const repair of repairs){
  const item=draft.items.find(i=>i.itemKey===repair.itemKey)!;
  expect(item.reviewStatus).toBe("needs_human_review");
  expect(item.review).toBeUndefined();
  expect(item.qcGates.gate3_ensemble.agrees).toBe(false);
  expect(validation.eligibleItemKeys).not.toContain(repair.itemKey);
  expect(item.item).toEqual(repair.replacement);
 }
});
it("invalidates old gate results, preserves source data and rejects stale or retargeted repairs",()=>{
 const before=JSON.stringify(source);
 const updated=repairDraftItems(source,repairs);
 expect(JSON.stringify(source)).toBe(before);
 expect(updated.items.find(i=>i.itemKey===repairs[0].itemKey)?.qcGates.gate2_answer_key.ok).toBe(false);
 expect(()=>repairDraftItems(updated,repairs)).toThrow(/Stale/);
 const changed=structuredClone(repairs);
 changed[0].replacement.nodeKey="resoudre_pronom_sujet";
 expect(()=>repairDraftItems(source,changed)).toThrow(/target/);
 expect(()=>repairDraftItems(source,[...repairs,repairs[0]])).toThrow(/Duplicate/);
});
it("replaces the subject-pronoun answer with a genuine object-pronoun contrast",()=>{
 const item=draft.items.find(i=>i.itemKey==="local-reading-v1:resoudre_pronom_objet:receptive:core")!.item;
 expect(item.promptFr).toContain('les jardiniers les évitent');
 expect(item.choices?.find(c=>c.correct)?.text).toBe("les pesticides");
 expect(item.choices?.find(c=>c.text==="les jardiniers")?.correct).toBe(false);
 expect(item.correctAnswer).toBeUndefined();
});

it("repairs relative-pronoun instructions and rejects invalid elisions using the actual validator",async()=>{
 const {validateAnswer}=await import("@/lib/linguistic/validator");
 const {questionAssessedMaterialKeys}=await import("./material-annotations");
 for(const tier of ["foundation","core","stretch"]){
  const entry=draft.items.find(entry=>entry.itemKey===`review-draft-v1:construction_pronom_relatif:controlled_production:${tier}`)!;
  const item=entry.item,spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig};
  expect((await validateAnswer(item.correctAnswer!,spec)).pass).toBe(true);
  expect((await validateAnswer(tier==="core"?"Voici la lettre qu' j'ai reçue hier.":"qu'",spec)).pass).toBe(false);
  expect(questionAssessedMaterialKeys(item)).toHaveLength(1);
  expect(entry.reviewStatus).toBe("needs_human_review");
  if(tier==="stretch"){
   expect(item.promptFr).toContain("Écris seulement le pronom manquant");
   expect(item.promptFr).not.toContain("« que »");
   expect(item.promptFr).not.toContain("souligné");
  }
 }
});

it("elicits both determiner and noun agreement without adjective or lexical-spelling distractors",async()=>{
 const {validateAnswer}=await import("@/lib/linguistic/validator");
 const {contrastingErrorKeys}=await import("./contrasting-errors");
 const {questionAssessedMaterialKeys}=await import("./material-annotations");
 const {materialIdentity}=await import("./material-identity");
 const cases=[
  ["foundation","des arbres",["arbres","un arbres","des arbre","les arbres"]],
  ["core","des messieurs",["messieurs","un messieurs","des monsieur","les messieurs"]],
  ["stretch","les chats",["chats","le chats","les chat","des chats"]],
 ] as const;
 for(const [tier,answer,incorrect] of cases){
  const item=draft.items.find(entry=>entry.itemKey===`review-draft-v1:accorder_determinant_nom_ecrit:controlled_production:${tier}`)!.item;
  const spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig};
  expect((await validateAnswer(answer,spec)).pass).toBe(true);
  for(const response of incorrect)expect((await validateAnswer(response,spec)).pass).toBe(false);
  expect(item.promptFr).toContain("Écris le déterminant et le nom");
 }
 for(const [tier,lemma] of [["foundation","maison"],["core","idée"],["stretch","histoire"]]){
  const item=draft.items.find(entry=>entry.itemKey===`local-spelling-gap-v1:accorder_determinant_nom_ecrit:receptive:${tier}`)!.item;
  expect(item.choices?.filter(choice=>choice.correct)).toHaveLength(1);
  expect(contrastingErrorKeys(item)).toHaveLength(2);
  expect(questionAssessedMaterialKeys(item)).toEqual([materialIdentity("word",lemma)]);
 }
});

it("keeps regular morphology targets regular and makes formerly ambiguous recognition tasks explicit",async()=>{
 const {validateAnswer}=await import("@/lib/linguistic/validator");
 const {questionMaterialKeys}=await import("./material-annotations");
 const get=(suffix:string)=>draft.items.find(entry=>entry.itemKey.endsWith(suffix))!.item;
 for(const [suffix,answer,wrong] of [
  ["marquer_pluriel_nom_regulier:controlled_production:stretch","jardins","animal"],
  ["former_feminin_adjectif_regulier:controlled_production:core","grande","belles"],
 ]){
  const item=get(suffix),spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig};
  expect((await validateAnswer(answer,spec)).pass).toBe(true);expect((await validateAnswer(wrong,spec)).pass).toBe(false);
  expect(questionMaterialKeys(item).length).toBeGreaterThan(0);
 }
 const feminine=get("former_feminin_adjectif_regulier:receptive:stretch");
 expect(feminine.promptFr).toContain("féminin singulier");expect(feminine.choices?.find(c=>c.correct)?.text).toBe("verte");
 expect(feminine.choices?.some(c=>c.feedbackFr?.includes("frères"))).toBe(false);
 const demonstrative=get("distinguer_homophones_ces_ses:receptive:stretch");
 expect(demonstrative.promptFr).toContain("déterminant démonstratif");expect(demonstrative.choices?.find(c=>c.correct)?.text).toBe("ces");
 const dance=get("orthographier_nasale_an_en:receptive:stretch");expect(dance.promptFr).toContain("musique");expect(dance.promptFr).not.toContain("correctement orthographié");
 const feminineEvidence=get("justifier_lettre_finale_muette:receptive:core");expect(feminineEvidence.promptFr).toContain("féminin singulier");
 for(const item of [feminine,demonstrative,dance,feminineEvidence])expect(questionMaterialKeys(item).length).toBeGreaterThan(0);
});
