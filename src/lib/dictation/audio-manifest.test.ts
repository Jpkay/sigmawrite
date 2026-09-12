import {expect,it} from 'vitest';
import {buildDictationAudioManifest,describeDictationAudio,validateDictationAudioManifest,verifyDictationAudioBytes} from './audio-manifest';
import {checksum} from '@/lib/taxonomy/validate';
const id='11111111-1111-4111-8111-111111111111';
const speech={audio:new Uint8Array([1,2,3]),mimeType:'audio/wav',provider:'fixture',model:'fixture',voice:'fr'};
const source=['Les chevaux arrivent.','Ils sont prêts.'];
function fixture(){
 const assets=source.map((text,index)=>describeDictationAudio({role:'segment',index,sourceText:text,speechPlan:[{kind:'text',text},{kind:'silence',seconds:.5}],speed:.85,speech}));
 assets.push(describeDictationAudio({role:'full',index:0,sourceText:source.join(' '),speechPlan:[{kind:'text',text:source.join(' ')}],speed:.9,speech}));
 return buildDictationAudioManifest(id,assets,source);
}
it('preserves exact source, speech instructions, format and renderer provenance',()=>{
 const manifest=fixture();expect(validateDictationAudioManifest(manifest,id,source)).toEqual(manifest);
 expect(manifest.assets[0]).toMatchObject({sourceText:source[0],speed:.85,mimeType:'audio/wav',provider:'fixture'});
 expect(manifest.assets[0].speechPlan[1]).toEqual({kind:'silence',seconds:.5});
 expect(manifest.assets[0].path).toMatch(/^immutable\/[a-f0-9]{64}\.wav$/);
 verifyDictationAudioBytes(manifest.assets[0],speech.audio);
});
it('rejects changed bytes even when length is unchanged',()=>{
 expect(()=>verifyDictationAudioBytes(fixture().assets[0],new Uint8Array([1,2,4]))).toThrow('bytes changed');
});
it('rejects another dictation record, changed text and reordered source',()=>{
 const m=fixture();expect(()=>validateDictationAudioManifest(m,'22222222-2222-4222-8222-222222222222',source)).toThrow();
 expect(()=>validateDictationAudioManifest(m,id,['Les chevaux arrivent !',source[1]])).toThrow('source changed');
 expect(()=>validateDictationAudioManifest(m,id,[...source].reverse())).toThrow('source changed');
});
it('rejects missing files and mutable paths even with recomputed metadata checksum',()=>{
 for(const mutate of [(m:ReturnType<typeof fixture>)=>{m.assets.pop();},(m:ReturnType<typeof fixture>)=>{m.assets[0].path='horses/segment-00.wav';}]){
  const m=fixture();mutate(m);const {checksum:_ignored,...content}=m;m.checksum=checksum(content);
  expect(()=>validateDictationAudioManifest(m,id,source)).toThrow();
 }
});
it('rejects altered speech provenance and empty or unsupported audio',()=>{
 const m=fixture();m.assets[0].speechPlan=[{kind:'text',text:'Autre phrase.'}];expect(()=>validateDictationAudioManifest(m,id,source)).toThrow('manifest changed');
 for(const changed of [{...speech,audio:new Uint8Array()},{...speech,mimeType:'text/plain'}])expect(()=>describeDictationAudio({role:'segment',index:0,sourceText:source[0],speechPlan:[{kind:'text',text:source[0]}],speed:1,speech:changed})).toThrow();
});
