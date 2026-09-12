import {expect,it} from 'vitest';
import {allocateTeachingQuestionPools} from './teaching-question-pools';
import {allocateQuestionPools,inspectQuestionPools} from './question-pools';
import {SUBJONCTIF_PRODUCTION_TEACHING} from './subjonctif-production-teaching';
import {teachingMaterialKeys} from './material-annotations';
import type {V3Assessment} from './v3-adapter';
const lesson=SUBJONCTIF_PRODUCTION_TEACHING[0];
function fixture(fresh=8):V3Assessment{
 const taught=teachingMaterialKeys(lesson)[0];
 return {taxonomyChecksum:'tax',bankChecksum:'bank',facetChecksum:'facet',skills:[{id:'skill',nodeKey:lesson.nodeKey,facetKey:lesson.facetKey,evidenceKey:'production',labelFr:'Skill',branch:'branch',level:0,modes:['production'],prerequisites:[],evidenceRequirements:{production:{minimumItems:3,minimumContexts:1,minimumOccasions:2,minimumAccuracy:.8,unaidedRequired:true}}}],probes:Array.from({length:8+fresh},(_,i)=>({id:`q-${String(i).padStart(2,'0')}`,skillId:'skill',mode:'production',contextId:'verb',difficulty:.5,expectedSeconds:20,guessProbability:.05,materialKeys:[i<8?taught:`sentence:sha256:${String(i).padStart(64,'0')}`],assessedMaterialKeys:[i<8?taught:`sentence:sha256:${String(i).padStart(64,'0')}`]}))};
}
it('reserves enough untaught questions in both stages without changing the source contract',()=>{
 const source=fixture(),before=JSON.stringify(source);
 const result=allocateTeachingQuestionPools(source,[lesson]);
 expect(result.teachingPoolRepairs).toHaveLength(1);
 expect(result.ready).toBe(true);
 expect(inspectQuestionPools(result.assessment)).toEqual({ok:true,issues:[]});
 expect(result.assessment.probes).toHaveLength(8);
 expect(result.assessment.skills).toEqual(source.skills);
 for(const phase of ['initial','learning'])expect(result.assessment.probes.filter(p=>p.usage===phase).length).toBeGreaterThanOrEqual(3);
 expect(JSON.stringify(source)).toBe(before);
});
it('retains the original incomplete teaching partition when too few untaught questions exist',()=>{
 const source=fixture(4),original=allocateQuestionPools(source);
 const result=allocateTeachingQuestionPools(source,[lesson]);
 expect(result.teachingPoolRepairs).toEqual([]);
 expect(result.assessment).toEqual(original.assessment);
});
it('preserves already suitable assignments and leaves unrelated targets alone',()=>{
 const source=fixture();source.probes=source.probes.slice(8);
 expect(allocateTeachingQuestionPools(source,[lesson]).assessment).toEqual(allocateQuestionPools(source).assessment);
 expect(allocateTeachingQuestionPools(fixture(),[]).assessment).toEqual(allocateQuestionPools(fixture()).assessment);
});
