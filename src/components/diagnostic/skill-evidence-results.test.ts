import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {assessSkills,type Skill,type Observation} from '@/lib/diagnostic/granular/engine';
import {SkillEvidenceResults} from './skill-evidence-results';
import {skillEvidenceDisplay} from '@/lib/diagnostic/granular/skill-evidence-display';
import {DIAGNOSTIC_COPY} from './diagnostic-copy';
const skill:Skill={id:'one',branch:'verb',level:1,prerequisites:[],modes:['recognition']};
const observations:Observation[]=[true,true,false].map((correct,index)=>({skillId:'one',itemId:String(index),mode:'recognition',correct,contextId:String(index),guessProbability:.25,activeSeconds:10,unaided:true}));
it('distinguishes mixed responses from success without changing an uncertain mastery result',()=>{
 const result=assessSkills([skill],observations)[0];expect(result.status).toBe('uncertain');
 const html=renderToStaticMarkup(React.createElement(SkillEvidenceResults,{result}));
 expect(html).toContain('2 réponses réussies sur 3.');expect(html).toContain('il faudra parfois d’autres questions');expect(html).not.toContain('%');
 const successful=assessSkills([skill],observations.map(o=>({...o,correct:true})))[0];expect(skillEvidenceDisplay(successful,DIAGNOSTIC_COPY.mode)[0]).toContain('3 réponses réussies sur 3.');
});
it('counts neither assisted answers nor repeated copies as additional evidence',()=>{
 const result=assessSkills([skill],[...observations,observations[0],{...observations[0],itemId:'assisted',unaided:false}])[0];expect(skillEvidenceDisplay(result,DIAGNOSTIC_COPY.mode)[0]).toContain('2 réponses réussies sur 3.');
});
it('does not turn untested points or writing-token accuracy into correct answer counts',()=>{
 const result=assessSkills([skill],[])[0];expect(renderToStaticMarkup(React.createElement(SkillEvidenceResults,{result}))).toBe('');
 result.modes=[{mode:'independent_production',accuracy:.8,distinctItems:5,distinctContexts:5,distinctOccasions:1,probability:.8,confirmed:false}];expect(skillEvidenceDisplay(result,DIAGNOSTIC_COPY.mode)).toEqual([]);
});
