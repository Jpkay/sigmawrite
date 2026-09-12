import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {selectedDraftExpansionSources,selectedTeachingDrafts} from '../../../../scripts/lib/granular-authoring-selection';
import {FRENCH_DRAFT_EXPANSION_SOURCES} from './draft-expansion-sources';
import {FRENCH_TEACHING_DRAFTS} from './draft-teaching-catalogue';
import {assembleDraftBank} from './assemble-drafts';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
it('keeps default sources identical and selects the three matching lessons only with the explicit option',()=>{
 expect(selectedDraftExpansionSources([])).toBe(FRENCH_DRAFT_EXPANSION_SOURCES);
 expect(selectedTeachingDrafts([])).toBe(FRENCH_TEACHING_DRAFTS);
 const args=['--bank-revision','36','--verb-family-recognition'];
 expect(selectedDraftExpansionSources(args)).toContain('verb-family-recognition-faceted');
 expect(selectedTeachingDrafts(args).filter(lesson=>lesson.nodeKey==='classer_famille_verbale').map(lesson=>lesson.facetKey).sort()).toEqual(['er','ir','other'].map(value=>`classer_famille_verbale::construction:${value}`));
});
it('requires matching explicit facet metadata while leaving every question pending review',()=>{
 const base=read('generated/diagnostic-bank-v3-draft.json'),taxonomy=read('generated/french-taxonomy-v3.json').taxonomy;
 const expansion=read('generated/french-v3-verb-family-recognition-faceted-expansion.json');
 const result=assembleDraftBank(base,taxonomy,[expansion],{revision:36,verbFamilyRecognition:true});
 expect(result.bank.items.length).toBe(base.items.length+36);
 expect(new Set(result.annotations.map(row=>row.facetKey)).size).toBe(3);
 expect(result.bank.items.slice(base.items.length).every(item=>item.reviewStatus==='needs_human_review')).toBe(true);
 expect(()=>assembleDraftBank(base,taxonomy,[expansion],{revision:35,verbFamilyRecognition:true})).toThrow();
 expect(()=>assembleDraftBank(base,taxonomy,[expansion],{revision:36})).toThrow(/another competency/);
 expect(()=>assembleDraftBank(base,taxonomy,[read('generated/french-v3-verb-family-recognition-expansion.json')],{revision:36,verbFamilyRecognition:true})).toThrow(/collapsed parent/);
});
