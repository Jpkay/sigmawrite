import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {SkillFeatureResults} from './skill-feature-results';
import type {SkillResult} from '@/lib/diagnostic/granular/engine';
const result:SkillResult={skillId:'test',status:'uncertain',evidence:'direct',resolved:false,modes:[{mode:'recognition',probability:.5,distinctItems:8,distinctContexts:8,distinctOccasions:1,accuracy:.5,confirmed:false,featureEvidence:[{feature:'complex-negation:plus',distinctItems:4,correctItems:4},{feature:'complex-negation:rien',distinctItems:4,correctItems:0},{feature:'complex-negation:personne',distinctItems:0,correctItems:0}]}]};
it('distinguishes untested details from incorrect answers without claiming mastery',()=>{
 const html=renderToStaticMarkup(React.createElement(SkillFeatureResults,{result}));
 expect(html).toContain('Ne…plus');expect(html).toContain('4 réponses réussies sur 4');
 expect(html).toContain('Ne…rien');expect(html).toContain('0 réponses réussies sur 4');
 expect(html).toContain('Ne…personne');expect(html).toContain('Pas encore vérifié');
 expect(html).not.toContain('Bien acquis');expect(html).not.toContain('complex-negation:');
});
it('preserves legacy results without features and hides unlabelled internal keys',()=>{
 expect(renderToStaticMarkup(React.createElement(SkillFeatureResults,{result:{...result,modes:result.modes.map(m=>({...m,featureEvidence:undefined}))}}))).toBe('');
 expect(renderToStaticMarkup(React.createElement(SkillFeatureResults,{result:{...result,modes:result.modes.map(m=>({...m,featureEvidence:[{feature:'private-internal-key',distinctItems:3,correctItems:2}]}))}}))).toBe('');
});
