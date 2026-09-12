import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {featureLabel} from './feature-labels';
import type {Skill} from './engine';
it('gives every prepared feature a readable label and never displays an internal key',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
 const features=new Set((candidate.assessment.skills as Skill[]).flatMap(skill=>Object.values(skill.evidenceRequirements??{}).flatMap(rule=>rule?.featureRequirements?.map(f=>f.feature)??[])));
 expect(features.size).toBeGreaterThan(0);
 for(const feature of features){expect(featureLabel(feature)).toBeTruthy();expect(featureLabel(feature)).not.toBe(feature);}
 expect(featureLabel('unlabelled-feature')).toBeUndefined();
});
