import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {PRONOUN_PLACEMENT_TEACHING} from "./pronoun-teaching";
import {validateTeachingTargets} from "./teaching-content";
import {adaptV3ForAssessment} from "./v3-adapter";
import {buildV3Facets} from "./facets";
import {applyFacetTargets} from "./facet-adapter";

const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const assessment=applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank).assessment;

it("maps the placement lessons to real v3 production targets without publishing or sharing check identities",()=>{
  expect(()=>validateTeachingTargets(assessment,PRONOUN_PLACEMENT_TEACHING)).not.toThrow();
  expect(PRONOUN_PLACEMENT_TEACHING.every(lesson=>lesson.status==="draft_requires_review")).toBe(true);
  const initialProbe=assessment.probes[0];
  const overlapping=structuredClone(PRONOUN_PLACEMENT_TEACHING);
  overlapping[0].practice[0].id=initialProbe.id;
  expect(()=>validateTeachingTargets(assessment,overlapping)).toThrow(/overlaps/);
});

it("rejects a broad or wrong-mode binding instead of borrowing a nearby lesson",()=>{
  const broad=structuredClone(PRONOUN_PLACEMENT_TEACHING);
  broad[0].facetKey="placer_pronom_complement";
  expect(()=>validateTeachingTargets(assessment,broad)).toThrow(/exact assessment target/);
  const wrongMode=structuredClone(PRONOUN_PLACEMENT_TEACHING);
  wrongMode[0].mode="independent_production";
  expect(()=>validateTeachingTargets(assessment,wrongMode)).toThrow(/exact assessment target/);
});

it("maps reading lessons to interpretation and rejects malformed choice lists",async()=>{
 const {READING_TEACHING}=await import("./reading-teaching");
 expect(()=>validateTeachingTargets(assessment,READING_TEACHING)).not.toThrow();
 expect(READING_TEACHING.every(lesson=>lesson.status==="draft_requires_review"&&lesson.mode==="interpretation")).toBe(true);
 for(const choices of [["One"],["Same"," same "],["Wrong","Also wrong"],["",READING_TEACHING[0].practice[0].answerFr]]){
  const broken=structuredClone(READING_TEACHING);broken[0].practice[0].choices=choices;
  expect(()=>validateTeachingTargets(assessment,broken)).toThrow(/Invalid guided answer choices/);
 }
});

it("rejects released instruction outside the pinned teaching scope",async()=>{
 const {validatePublishedTeaching}=await import("./teaching-content");
 const lesson={...PRONOUN_PLACEMENT_TEACHING[0],status:"published_pending_review" as const,assessmentExposureIds:[]};
 const scoped={...assessment,releaseScope:{version:"french-granular-release-scope-v1" as const,assessmentSkillIds:assessment.skills.map(s=>s.id),teachingSkillIds:[],limitationFr:"Les leçons sont ajoutées progressivement."}};
 expect(()=>validatePublishedTeaching(scoped,[lesson])).toThrow(/outside release scope/);
});
