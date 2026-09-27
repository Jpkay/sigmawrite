import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {readAudioStimulus,publicAudioQuestionFields} from './audio-stimulus';
import {canonicalProbeMetrics} from './probe-metrics';
import {publicQuestion,type AssessmentBundle} from './service';
import {assertDiagnosticAudioAssets} from '../../../../scripts/lib/diagnostic-audio-assets';
import type {CanonicalDiagnosticBankArtifact} from '../item-bank';
const bank=JSON.parse(readFileSync('generated/diagnostic-bank-v3-draft.json','utf8')) as CanonicalDiagnosticBankArtifact;
const entry=bank.items.find(e=>e.sectionKey!=='reading_comprehension')!;
const audio={sha256:`sha256:${'a'.repeat(64)}`,durationMs:2200,locale:'fr-FR',format:'mp3'};
const item=(value:unknown)=>({...entry.item,validatorConfig:{...entry.item.validatorConfig,audioStimulus:value}});
it('rejects transcript-bearing, remote or malformed audio metadata',()=>{
 for(const invalid of [null,{}, {...audio,transcript:'secret answer'}, {...audio,url:'https://example.com/word.mp3'}, {...audio,sha256:'../answer'}, {...audio,durationMs:0}, {...audio,durationMs:60001}, {...audio,locale:'en-US'}])expect(()=>readAudioStimulus(item(invalid))).toThrow();
 expect(publicAudioQuestionFields(entry.item)).toEqual({});
});
it('only projects opaque audio paths and budgets listening time',()=>{
 const withAudio=item(audio);
 const bundle:AssessmentBundle={bank:{...bank,items:[{...entry,item:withAudio}]},assessment:JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8')).assessment,taxonomyId:'fixture',bankId:'fixture'};
 const q=publicQuestion('session',entry.itemKey,bundle)!;
 expect(q.audio).toEqual({src:`/diagnostic-audio/${'a'.repeat(64)}.mp3`,mimeType:'audio/mpeg'});
 expect(q).not.toHaveProperty('validatorConfig');expect(q).not.toHaveProperty('correctAnswer');
 expect(canonicalProbeMetrics({...entry,item:withAudio}).expectedSeconds).toBe(canonicalProbeMetrics(entry).expectedSeconds+3);
});
it('requires the exact audio bytes before publication',()=>{
 const dir=mkdtempSync(join(tmpdir(),'diagnostic-audio-'));
 try{
  mkdirSync(join(dir,'diagnostic-audio'));
  const bytes=Buffer.alloc(256,1),hash=createHash('sha256').update(bytes).digest('hex');
  const asset=join(dir,'diagnostic-audio',`${hash}.mp3`);
  const b={...bank,items:[{...entry,item:item({...audio,sha256:`sha256:${hash}`})}]};
  expect(()=>assertDiagnosticAudioAssets(b,dir)).toThrow();
  const teaching=[{steps:[{exampleFr:"Modèle",explanationFr:"Écoute.",audioStimulus:{...audio,sha256:`sha256:${hash}`} as import("./audio-stimulus").AudioStimulus}],practice:[]}];
  expect(()=>assertDiagnosticAudioAssets({...bank,items:[]},dir,teaching)).toThrow();
  writeFileSync(asset,bytes);expect(assertDiagnosticAudioAssets(b,dir)).toEqual({verifiedAudioAssets:1});
  expect(assertDiagnosticAudioAssets({...bank,items:[]},dir,teaching)).toEqual({verifiedAudioAssets:1});
  writeFileSync(asset,Buffer.alloc(256,2));expect(()=>assertDiagnosticAudioAssets(b,dir)).toThrow(/mismatch/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

it('records exact audio identity even when written target annotations differ',async()=>{
 const {questionMaterialKeys,questionAssessedMaterialKeys}=await import('./material-annotations');
 const first={...item(audio),validatorConfig:{audioStimulus:audio}};
 const second={...first,promptFr:'Une autre consigne pour le même enregistrement.'};
 const key=`audio:${audio.sha256}`;
 expect(questionMaterialKeys(first)).toEqual([key]);
 expect(questionAssessedMaterialKeys(second)).toEqual([key]);
 expect(questionMaterialKeys(entry.item)).not.toContain(key);
});
