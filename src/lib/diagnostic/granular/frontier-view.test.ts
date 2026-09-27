import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {createSession} from './session';
import {granularFrontierView} from './frontier-view';
import type {AssessmentBundle,StoredSession} from './service';
it('projects separate targets and prerequisite links without exposing the pending question or mutating the session',()=>{
 const bank=JSON.parse(readFileSync('generated/diagnostic-bank-v3-draft.json','utf8')) as AssessmentBundle['bank'];
 bank.items=bank.items.slice(0,1);bank.items[0].item.promptFr='PRIVATE UNANSWERED QUESTION';
 const base={nodeKey:'same-node',labelFr:'Employer le présent',branch:'conjugation',level:1,evidenceKey:'fixture'};
 const bundle:AssessmentBundle={taxonomyId:'taxonomy',bankId:'bank',bank,assessment:{taxonomyChecksum:'taxonomy',bankChecksum:'bank',skills:[
  {...base,id:'recognition',modes:['recognition'],prerequisites:[]},
  {...base,id:'production',modes:['production'],prerequisites:['recognition']},
 ],probes:[]}};
 const session:StoredSession={id:'session',studentId:'owner',releaseId:'pinned-release',state:createSession({taxonomyId:'taxonomy',bankId:'bank',checksum:'fixture'})};
 session.state.pendingItemId=bank.items[0].itemKey;
 const before=structuredClone(session);
 const result=granularFrontierView(session,bundle);
 expect(session).toEqual(before);expect(result.releaseId).toBe('pinned-release');
 expect(result.nodes).toHaveLength(2);expect(result.nodes[1].prerequisites).toEqual(['recognition']);
 expect(result.nodes.map(node=>node.result.status)).toEqual(['unknown','unknown']);
 expect(result.nodes.map(node=>node.result.modes[0].mode)).toEqual(['recognition','production']);
 expect(result).not.toHaveProperty('question');expect(result).not.toHaveProperty('teaching');expect(result).not.toHaveProperty('learningCheck');
 expect(JSON.stringify(result)).not.toContain('PRIVATE UNANSWERED QUESTION');expect(result.activities).toEqual([]);
});
