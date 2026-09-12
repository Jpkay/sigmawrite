import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {checksum} from '@/lib/taxonomy/validate';
import {questionMaterialKeys} from './material-annotations';
import {diagnosticItemSurfaceIdentity,type CanonicalDiagnosticBankItem} from '../item-bank';
import {FRENCH_DRAFT_EXPANSION_SOURCES} from './draft-expansion-sources';
import {VERB_FAMILY_RECOGNITION_DRAFTS} from './verb-family-recognition-drafts';
const artifact=JSON.parse(readFileSync('generated/french-v3-verb-family-recognition-expansion.json','utf8'));
const items=artifact.items as CanonicalDiagnosticBankItem[];
it('keeps later-release recognition drafts out of the frozen release and preserves honest review status',()=>{
 expect(FRENCH_DRAFT_EXPANSION_SOURCES as readonly string[]).not.toContain('verb-family-recognition');
 const {checksum:recorded,...content}=artifact;expect(checksum(content)).toBe(recorded);
 expect(items).toHaveLength(24);
 for(const item of items){expect(item.reviewStatus).toBe('needs_human_review');expect(item.qcGates.verdict).toBe('needs_human_review');expect(item.evidenceExpectation).toBe('receptive');expect(item.evidenceKey).toBe('reading-receptive');expect(item.item.nodeKey).toBe('classer_famille_verbale');}
});
it('includes contrasting patterns and exposes the irregular form that distinguishes aller from the er model',()=>{
 for(const family of ['er','ir','other'])expect(VERB_FAMILY_RECOGNITION_DRAFTS.filter(d=>d.family===family)).toHaveLength(8);
 const aller=items.find(item=>item.itemKey.endsWith(':aller'))!;
 expect(aller.item.promptFr).toContain('je vais');expect(aller.item.promptFr).toContain('nous allons');
 expect(aller.item.choices?.find(choice=>choice.correct)?.text).toBe('Une autre famille de verbes');
 const partir=items.find(item=>item.itemKey.endsWith(':partir'))!;
 expect(partir.item.promptFr).toContain('nous partons');expect(partir.item.choices?.find(choice=>choice.correct)?.text).toBe('Une autre famille de verbes');
 const grandir=items.find(item=>item.itemKey.endsWith(':grandir'))!;
 expect(grandir.item.choices?.find(choice=>choice.correct)?.text).toContain('Comme finir');
});
it('does not quiz category exemplars, duplicate visible items or invent unanchored word exposure',()=>{
 expect(new Set(items.map(item=>diagnosticItemSurfaceIdentity(item.item))).size).toBe(items.length);
 for(const item of items){
  const infinitive=item.itemKey.split(':').at(-1)!;
  expect(item.item.choices?.filter(choice=>choice.correct)).toHaveLength(1);
  for(const choice of item.item.choices??[])expect(choice.text).not.toContain(infinitive);
  expect(questionMaterialKeys(item.item).length).toBeGreaterThan(0);
 }
});
