import {beforeEach,expect,it,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
const f=vi.hoisted(()=>({plan:vi.fn(),speech:vi.fn(),store:vi.fn(),updates:[] as Record<string,unknown>[],filters:[] as unknown[][],changed:false}));
vi.mock('@/lib/ai',()=>({getAIProvider:()=>({synthesizeSpeechPlan:f.plan,synthesizeSpeech:f.speech})}));
vi.mock('./immutable-audio-storage',()=>({storeImmutableDictationAudio:f.store}));
import {renderPendingDictationAudio} from './audio';
import {resolveDictationAudioAssets} from './audio-manifest';
const id='11111111-1111-4111-8111-111111111111';
const segments=[{text:'Les chevaux arrivent.',audioPath:'legacy/segment-00.mp3'}];
const db={storage:{getBucket:async()=>({data:{id:'dictation-audio'}})},from:()=>{
 let update:Record<string,unknown>|null=null;
 const q={select:()=>q,eq:(...args:unknown[])=>{f.filters.push(args);return q;},in:()=>q,order:()=>q,update:(value:Record<string,unknown>)=>{update=value;f.updates.push(value);return q;},limit:async()=>({data:[{id,key:'horses',segments,audio_status:'pending',updated_at:'before'}],error:null}),maybeSingle:async()=>({data:update?.audio_status==='rendering'?{id,updated_at:'claimed'}:f.changed?null:{id},error:null}),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve(resolve({error:null}))};return q;
}} as unknown as SupabaseClient;
beforeEach(()=>{vi.clearAllMocks();f.updates=[];f.filters=[];f.changed=false;const speech={audio:new Uint8Array([1,2,3]),mimeType:'audio/wav',provider:'fixture',model:'fixture',voice:'fr'};f.plan.mockResolvedValue(speech);f.speech.mockResolvedValue(speech);f.store.mockResolvedValue(undefined);});
it('publishes segment and full provenance only after immutable storage succeeds',async()=>{
 expect(await renderPendingDictationAudio(db)).toEqual({rendered:1,failed:0,considered:1});
 expect(f.store).toHaveBeenCalledTimes(2);
 const ready=f.updates.find(u=>u.audio_status==='ready')!;
 const assets=resolveDictationAudioAssets({id,key:'horses',segments:ready.segments as typeof segments,audioManifest:ready.audio_manifest});
 expect(assets.manifest?.assets).toHaveLength(2);expect(assets.fullPath).toMatch(/\.wav$/);
 expect(assets.manifest?.assets[0].speechPlan).toEqual(f.plan.mock.calls[0][0]);
 expect(f.filters).toContainEqual(['updated_at','before']);expect(f.filters).toContainEqual(['updated_at','claimed']);
});
it('does not publish a ready record after upload failure',async()=>{
 f.store.mockRejectedValue(Error('storage unavailable'));
 expect((await renderPendingDictationAudio(db)).failed).toBe(1);
 expect(f.updates.some(u=>u.audio_status==='ready')).toBe(false);
});
it('does not count a concurrent content edit as a successful render',async()=>{
 f.changed=true;expect(await renderPendingDictationAudio(db)).toMatchObject({rendered:0,failed:1});
 expect(f.updates.at(-1)).toMatchObject({audio_status:'failed',audio_error:'Dictation changed while audio was rendering'});
 expect(f.filters.slice(-3)).toEqual([['id',id],['updated_at','claimed'],['audio_status','rendering']]);
});
it('keeps historical playback explicit and rejects stale new manifests',async()=>{
 expect(resolveDictationAudioAssets({id,key:'horses',segments})).toEqual({manifest:null,segmentPaths:['legacy/segment-00.mp3'],fullPath:'horses/full.mp3'});
 await renderPendingDictationAudio(db);const ready=f.updates.find(u=>u.audio_status==='ready')!;
 expect(()=>resolveDictationAudioAssets({id,key:'horses',segments:[{...segments[0],text:'Un autre texte.'}],audioManifest:ready.audio_manifest})).toThrow('source changed');
});

it('can restrict an operator run to one explicit dictation',async()=>{
 await renderPendingDictationAudio(db,{dictationId:id,limit:1});expect(f.filters[0]).toEqual(['review_status','human_approved']);expect(f.filters[1]).toEqual(['id',id]);
});
