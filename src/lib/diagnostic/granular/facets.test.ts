import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {buildV3Facets,conjugationFacet,participleAgreementFacet} from "./facets";
import {adaptV3ForAssessment,rollUpV3Evidence} from "./v3-adapter";
import {applyFacetTargets} from "./facet-adapter";
import {assessSkills} from "./engine";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const base=adaptV3ForAssessment({artifact,bank}),facets=buildV3Facets(artifact.taxonomy);
it("preserves the approved reading node meanings when refining passage genre",()=>{
 const genres=(node:string)=>facets.filter(f=>f.nodeKey===node).map(f=>f.value);
 expect(genres("identifier_these_argument")).toEqual(["argumentative"]);
 expect(genres("inferer_motivation_personnage")).toEqual(["narrative"]);
 expect(genres("inferer_hypothese_informationnelle")).toEqual(["informational"]);
 expect(genres("localiser_information_explicite")).toEqual(["narrative","informational","argumentative"]);
 for(const key of ["reconnaitre_structure_cause_consequence","reconnaitre_structure_comparaison","reconnaitre_structure_probleme_solution"])
  expect(genres(key)).toEqual(["informational"]);
 for(const key of ["distinguer_fait_opinion","evaluer_pertinence_preuve"])
  expect(genres(key)).toEqual(["argumentative"]);
});
it("maps computed agreement to the precise elicited feature, without crediting siblings",()=>{
 const compiled=applyFacetTargets(base,facets,bank).assessment;
 const probes=compiled.probes.filter(p=>p.id.startsWith("computed-conjugation-v1:accorder_participe_etre:"));
 expect(probes).toHaveLength(3);
 expect(probes.map(p=>p.skillId.split("::").at(-1)).sort()).toEqual(["construction:both","construction:feminine","construction:plural"]);
 const cod=compiled.probes.filter(p=>p.id.startsWith("computed-conjugation-v1:accorder_participe_avoir_cod:"));
 expect(cod).toHaveLength(3);
 expect(cod.every(p=>p.skillId.endsWith("::construction:preceding"))).toBe(true);
 expect(participleAgreementFacet("accorder_participe_avoir_cod",{tense:"passe_compose"})).toBeNull();
 expect(participleAgreementFacet("accorder_participe_avoir_cod",{tense:"passe_compose",codBefore:{gender:"m",number:"s"}})).toBeNull();
 expect(participleAgreementFacet("accorder_participe_etre",{tense:"passe_compose",verb:"manger",person:"3p",gender:"f"})).toBeNull();
});
it("anchors refinements in v3 across all four diagnostic domains",()=>{
 const nodes=new Map(artifact.taxonomy.nodes.map((n:{key:string;strand:string})=>[n.key,n.strand]));
 expect(facets.every(f=>nodes.has(f.nodeKey))).toBe(true);
 expect(new Set(facets.map(f=>nodes.get(f.nodeKey))).size).toBe(5);
 expect(facets.filter(f=>f.dimension==="verb").some(f=>f.value==="vouloir")).toBe(true);
 expect(facets.some(f=>f.dimension==="pattern")).toBe(true);
});
it("does not certify siblings or a broad parent from a single verb",()=>{
 const compiled=applyFacetTargets(base,facets,bank).assessment;
 const node=compiled.skills.find(s=>s.facetKey==="produire_present_indicatif::verb:être")!;
 const observations=Array.from({length:3},(_,i)=>({itemId:`probe-${i}`,skillId:node.id,mode:node.modes[0],contextId:`person-${i}`,occasionId:`occasion-${i}`,correct:true,unaided:true,guessProbability:.05,activeSeconds:20}));
 const results=assessSkills(compiled.skills,observations);
 expect(results.find(r=>r.skillId===node.id)?.status).toBe("mastered");
 expect(results.filter(r=>r.skillId!==node.id).every(r=>r.status==="unknown")).toBe(true);
 expect(rollUpV3Evidence(compiled,results).find(n=>n.nodeKey===node.nodeKey)?.confirmedMastery).toBe(false);
});
it("requires multiple verbs before confirming a regular pattern",()=>{
 const compiled=applyFacetTargets(base,facets,bank).assessment;
 const node=compiled.skills.find(s=>s.facetKey==="produire_present_indicatif::pattern:regular_er")!;
 const observations=Array.from({length:3},(_,i)=>({itemId:`probe-${i}`,skillId:node.id,mode:node.modes[0],contextId:"verb:parler",occasionId:`occasion-${i}`,correct:true,unaided:true,guessProbability:.05,activeSeconds:20}));
 expect(assessSkills(compiled.skills,observations).find(r=>r.skillId===node.id)?.resolved).toBe(false);
});
it("rejects stale annotations and cannot infer a tense or verb from arbitrary prompt text",()=>{
 expect(conjugationFacet("produire_imparfait",{verb:"être",tense:"present"})).toBeNull();
 expect(conjugationFacet("produire_present_indicatif",{verb:"inventer",tense:"present"})).toBeNull();
 expect(()=>applyFacetTargets(base,facets,bank,[{itemKey:bank.items[0].itemKey,itemChecksum:"stale",facetKey:facets[0].key,contextKey:"context"}])).toThrow(/Stale/);
 const result=applyFacetTargets(base,facets,bank);
 expect(result.unassignedItemKeys.length).toBeGreaterThan(0);
 expect(result.assessment.probes.every(p=>!result.unassignedItemKeys.includes(p.id))).toBe(true);
});

it("pins facet interpretation alongside bank and taxonomy",async()=>{
 const {bindAssessmentRelease}=await import("./release-binding");
 const first=applyFacetTargets(base,facets,bank).assessment;
 const changed=structuredClone(facets);changed[0].labelFr+=" (revised)";
 const second=applyFacetTargets(base,changed,bank).assessment;
 const ids={taxonomyId:"v3",bankId:"bank-v3"};
 expect(bindAssessmentRelease(first,ids).checksum).not.toBe(bindAssessmentRelease(second,ids).checksum);
 const changedRules=structuredClone(base);
 const target=changedRules.skills.find(s=>s.evidenceRequirements?.production)!;
 target.evidenceRequirements!.production!.minimumItems++;
 const third=applyFacetTargets(changedRules,facets,bank).assessment;
 expect(bindAssessmentRelease(first,ids).checksum).not.toBe(bindAssessmentRelease(third,ids).checksum);
});
