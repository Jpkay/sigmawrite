import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank} from "../item-bank";
import {assembleDraftBank} from "./assemble-drafts";
import {adaptV3ForAssessment} from "./v3-adapter";
import {PERSON_NUMBER_TEACHING} from "./person-number-teaching";
import {PERSON_NUMBER_DRAFTS,PERSON_NUMBER_LABELS} from "./person-number-drafts";
import {reviewPersonNumberPathways} from "./person-number-pathway-review";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json");
const expansion=read("generated/french-v3-person-number-expansion.json");
const {bank,annotations}=assembleDraftBank(base,artifact.taxonomy,[expansion]);
const assessment=adaptV3ForAssessment({artifact,bank});
it("keeps grammatical number distinct from reference and offers every grammatical combination",()=>{
 expect(PERSON_NUMBER_DRAFTS).toHaveLength(24);
 for(const label of PERSON_NUMBER_LABELS)expect(PERSON_NUMBER_DRAFTS.filter(draft=>draft.answer===label)).toHaveLength(4);
 for(const key of ["on-nous","collectif"])expect(PERSON_NUMBER_DRAFTS.find(draft=>draft.key===key)?.answer).toBe("3e personne du singulier");
 expect(PERSON_NUMBER_DRAFTS.find(draft=>draft.key==="vous-politesse")?.answer).toBe("2e personne du pluriel");
 expect(PERSON_NUMBER_DRAFTS.find(draft=>draft.key==="vous-moi")?.answer).toBe("1re personne du pluriel");
 for(const entry of expansion.items){
  expect(entry.item.choices).toHaveLength(6);
  expect(entry.reviewStatus).toBe("needs_human_review");
 }
 const eligible=validateCanonicalDiagnosticBank(bank,artifact.taxonomy).eligibleItemKeys;
 expect(eligible.some(key=>key.startsWith("v3-person-number:"))).toBe(false);
});
it("reserves disjoint checks, excludes taught sentences and never promotes the draft",()=>{
 const before=checksum({assessment,bank,annotations,lessons:PERSON_NUMBER_TEACHING});
 const row=reviewPersonNumberPathways(assessment,bank,artifact.taxonomy,annotations,PERSON_NUMBER_TEACHING).rows[0];
 expect(row).toMatchObject({skillId:"distinguer_personne_nombre::reading-receptive",unapprovedCandidates:24,distinctTargetSentences:24,excludedTeachingOverlapQuestionIds:[],proposedAllocationStatus:"allocated",releaseReady:false});
 expect(row.proposedInitialQuestions).toHaveLength(12);expect(row.proposedLaterQuestions).toHaveLength(12);
 expect(row.proposedLaterQuestions.some(id=>row.proposedInitialQuestions.includes(id))).toBe(false);
 expect(checksum({assessment,bank,annotations,lessons:PERSON_NUMBER_TEACHING})).toBe(before);
 const lessons=structuredClone(PERSON_NUMBER_TEACHING),sentence=PERSON_NUMBER_DRAFTS[0].sentence;
 lessons[0].steps.push({exampleFr:sentence,explanationFr:"Exemple montré dans ce test."});lessons[0].materialExposure!.sentences!.push(sentence);
 const after=reviewPersonNumberPathways(assessment,bank,artifact.taxonomy,annotations,lessons).rows[0];
 expect(after.excludedTeachingOverlapQuestionIds).toContain("v3-person-number:je-dessine");
 expect([...after.proposedInitialQuestions,...after.proposedLaterQuestions]).not.toContain("v3-person-number:je-dessine");
});
it("keeps every grammatical combination in both pools and exposes a missing category",()=>{
 const row=reviewPersonNumberPathways(assessment,bank,artifact.taxonomy,annotations,PERSON_NUMBER_TEACHING).rows[0];
 expect(row.groupBalance).toBe("balanced");
 expect(row.groupCoverage).toHaveLength(6);
 for(const group of row.groupCoverage??[])expect(group).toMatchObject({initial:2,later:2});
 const lessons=structuredClone(PERSON_NUMBER_TEACHING);
 for(const draft of PERSON_NUMBER_DRAFTS.filter(draft=>draft.answer==="2e personne du singulier")){
  lessons[0].steps.push({exampleFr:draft.sentence,explanationFr:"Exemple montré."});lessons[0].materialExposure!.sentences!.push(draft.sentence);
 }
 const missing=reviewPersonNumberPathways(assessment,bank,artifact.taxonomy,annotations,lessons).rows[0];
 expect(missing.proposedAllocationStatus).toBe("allocated");
 expect(missing.groupBalance).toBe("insufficient_group_coverage");
 expect(missing.groupCoverage?.find(group=>group.group==="2e personne du singulier")).toMatchObject({initial:0,later:0});
 expect(missing.excludedTeachingOverlapQuestionIds).toHaveLength(4);
});
