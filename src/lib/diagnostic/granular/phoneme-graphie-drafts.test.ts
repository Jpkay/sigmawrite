import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {expect,it} from 'vitest';
import {PHONEME_GRAPHIE_DRAFTS as drafts,PHONEME_GRAPHIE_TEACHING_WORDS as teaching} from './phoneme-graphie-drafts';
const manifest=JSON.parse(readFileSync('generated/french-phoneme-graphie-audio-draft.json','utf8'));
it('uses distinct words and sound groups in recognition and production',()=>{
 expect(drafts).toHaveLength(64);expect(new Set(drafts.map(d=>d.word)).size).toBe(64);
 for(const mode of ['recognition','production'])for(const group of ['ch','ou','gn','f'])expect(drafts.filter(d=>d.mode===mode&&d.group===group)).toHaveLength(8);
 for(const row of drafts)expect(row.masked.replace('___',row.group)).toBe(row.word);
 expect(teaching.some(([word])=>drafts.some(d=>d.word===word))).toBe(false);
});
it('has exact versioned audio bytes without homophone reuse across teaching and assessment',()=>{
 expect(manifest.assets).toHaveLength(72);
 expect(manifest.assets.map((row:{word:string})=>row.word).sort()).toEqual([...drafts.map(row=>row.word),...teaching.map(([word])=>word)].sort());
 const hashes=new Set<string>();
 for(const row of manifest.assets){
  expect(row.speechText).toBe(`Le mot est : ${row.word}.`);
  expect(row.decodeVerified).toBe(true);
  const bytes=readFileSync(`public/diagnostic-audio/${row.audioStimulus.sha256.slice(7)}.mp3`);
  expect(`sha256:${createHash('sha256').update(bytes).digest('hex')}`).toBe(row.audioStimulus.sha256);
  expect(row.status).toBe('draft_requires_pronunciation_review');expect(row.audioStimulus.locale).toBe('fr-FR');
  expect(row.audioStimulus.durationMs).toBeGreaterThan(100);expect(row.audioStimulus.durationMs).toBeLessThan(10000);
  expect(hashes.has(row.audioStimulus.sha256),`Duplicate spoken stimulus: ${row.word}`).toBe(false);hashes.add(row.audioStimulus.sha256);
 }
});
