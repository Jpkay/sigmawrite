import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {buildV3Facets} from './facets';
import {applyFacetTargets} from './facet-adapter';
import {adaptV3ForAssessment} from './v3-adapter';
import {inspectAssessmentGraph} from './release-graph';
import {bindAssessmentRelease} from './release-binding';
import {checksum} from '@/lib/taxonomy/validate';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),bank=read('generated/diagnostic-bank-v3-draft.json');
const source=adaptV3ForAssessment({artifact,bank});
const legacy=applyFacetTargets(source,buildV3Facets(artifact.taxonomy),bank).assessment;
const refined=applyFacetTargets(source,buildV3Facets(artifact.taxonomy,{verbFamilyRecognition:true}),bank).assessment;
it('leaves default compilation and existing release evidence intact when the refinement is not selected',()=>{
 expect(legacy.skills).toHaveLength(542);expect(refined.skills).toHaveLength(544);
 expect(inspectAssessmentGraph(legacy.skills)).toBe(true);expect(inspectAssessmentGraph(refined.skills)).toBe(true);
 const old=read('docs/diagnostic/v3-scoped-review-candidate.json').assessment;const before=checksum(old);
 expect(inspectAssessmentGraph(old.skills)).toBe(true);expect(checksum(old)).toBe(before);
 expect(buildV3Facets(artifact.taxonomy).some(facet=>facet.nodeKey==='classer_famille_verbale')).toBe(false);
 const ids={taxonomyId:'taxonomy',bankId:'bank'};
 expect(bindAssessmentRelease(legacy,ids).checksum).not.toBe(bindAssessmentRelease(refined,ids).checksum);
});
it('refuses partial, invented or collapsed verb-family refinements',()=>{
 const family=refined.skills.filter(skill=>skill.nodeKey==='classer_famille_verbale');expect(family).toHaveLength(3);
 expect(inspectAssessmentGraph(refined.skills.filter(skill=>skill.id!==family[0].id))).toBe(false);
 const invented=structuredClone(refined.skills);invented.find(skill=>skill.id===family[0].id)!.facetKey='classer_famille_verbale::construction:invented';
 expect(inspectAssessmentGraph(invented)).toBe(false);
 expect(inspectAssessmentGraph([...refined.skills,legacy.skills.find(skill=>skill.nodeKey==='classer_famille_verbale')!])).toBe(false);
});
