import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {QUESTION_DETAIL_READING_DRAFTS} from './question-detail-reading-drafts';
import {readTextualSupport} from './textual-support';
import {validateCanonicalDiagnosticBank} from '../item-bank';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('covers all three existing text-type distinctions with short, separate contexts',()=>{
 expect(new Set(QUESTION_DETAIL_READING_DRAFTS.map(d=>d.passage)).size).toBe(36);
 for(const genre of ['narrative','informational','argumentative'])expect(QUESTION_DETAIL_READING_DRAFTS.filter(d=>d.genre===genre)).toHaveLength(12);
 for(const d of QUESTION_DETAIL_READING_DRAFTS){expect(d.passage.split(/\s+/).length).toBeLessThan(65);expect(d.passage).toContain(d.support);expect(new Set([d.answer,...d.distractors]).size).toBe(4);expect(d.otherSpans).toHaveLength(2);for(const span of d.otherSpans){expect(d.passage).toContain(span);expect(span).not.toBe(d.support);}expect(JSON.stringify(d)).not.toContain('—');}
 expect(QUESTION_DETAIL_READING_DRAFTS.some(d=>d.passage.startsWith(d.support))).toBe(true);
 expect(QUESTION_DETAIL_READING_DRAFTS.some(d=>!d.passage.startsWith(d.support))).toBe(true);
});
it('retains pending review and binds answer plus exact text support to the approved skill',()=>{
 const expansion=read('generated/french-v3-question-detail-reading-expansion.json');
 const base=read('generated/diagnostic-bank-v3-draft.json'),taxonomy=read('generated/french-taxonomy-v3.json').taxonomy;
 const bank={...base,items:[...base.items,...expansion.items]};delete bank.manifest;
 expect(validateCanonicalDiagnosticBank(bank,taxonomy).issues).toEqual([]);
 for(const entry of expansion.items){expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.item.nodeKey).toBe('associer_information_question');expect(entry.evidenceKey).toBe('all-receptive');expect(entry.review).toBeUndefined();expect(readTextualSupport(entry.item)).toBeTruthy();}
 const existing=read('generated/diagnostic-bank-v3-consolidated-draft.json');
 expect(existing.items.some((i:{itemKey:string})=>i.itemKey.startsWith('v3-question-detail-reading:'))).toBe(false);
});
