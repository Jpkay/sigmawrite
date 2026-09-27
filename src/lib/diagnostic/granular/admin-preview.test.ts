import {afterEach,describe,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {newPreviewState,signPreviewState,verifyPreviewState,PreviewAssessmentStore} from './admin-preview';
import {createSession} from './session';
import type {AssessmentBundle} from './service';

const release={taxonomyId:'taxonomy',bankId:'bank',checksum:'checksum'};
afterEach(()=>vi.unstubAllEnvs());
describe('isolated admin diagnostic state',()=>{
 it('rejects tampering, other admins, and expired tokens',()=>{
  vi.stubEnv('DIAGNOSTIC_TEST_SIGNING_SECRET','x'.repeat(40));
  const state=newPreviewState('admin-1','release-1',createSession(release),1000);
  const token=signPreviewState(state);
  expect(verifyPreviewState(token,'admin-1',1001)).toEqual(state);
  expect(()=>verifyPreviewState(token,'admin-2',1001)).toThrow();
  expect(()=>verifyPreviewState(token,'admin-1',state.expiresAt)).toThrow();
  expect(()=>verifyPreviewState(`z${token.slice(1)}`,'admin-1',1001)).toThrow();
 });
 it('only changes its request-local session and reads the release',async()=>{
  const initial=newPreviewState('admin-1','release-1',createSession(release),1000).session;
  const read=vi.fn(async()=>({assessment:{}} as AssessmentBundle));
  const store=new PreviewAssessmentStore(initial,read);
  expect(await store.load('admin-2',initial.id)).toBeNull();
  expect(await store.release('release-1')).toEqual({assessment:{}});
  expect(read).toHaveBeenCalledWith('release-1');
  const changed={...initial.state,revision:1};
  expect(await store.save('admin-1',initial.id,0,changed)).toBe(true);
  expect(await store.save('admin-1',initial.id,0,changed)).toBe(false);
  expect((await store.load('admin-1',initial.id))?.state.revision).toBe(1);
 });
});
