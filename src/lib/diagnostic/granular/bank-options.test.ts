import {expect,it} from 'vitest';
import {granularBankOptions} from '../../../../scripts/lib/granular-bank-options';
it('requires explicit unambiguous revision input before building or publishing',()=>{
 expect(granularBankOptions(['check'])).toEqual({});
 expect(granularBankOptions(['publish','release-r2','--bank-revision','2'])).toEqual({revision:2});
 for(const args of [['--bank-revision'],['--bank-revision','0'],['--bank-revision','01'],['--bank-revision','1.5'],['--bank-revision','2','--bank-revision','3'],['--bank-revision','9007199254740992']])expect(()=>granularBankOptions(args)).toThrow(/positive integer/);
});
it('requires a new explicit revision for verb-pattern recognition',()=>{
 expect(granularBankOptions(['--bank-revision','36','--verb-family-recognition'])).toEqual({revision:36,verbFamilyRecognition:true});
 for(const args of [['--verb-family-recognition'],['--bank-revision','35','--verb-family-recognition'],['--bank-revision','36','--verb-family-recognition','--verb-family-recognition']])expect(()=>granularBankOptions(args)).toThrow();
 expect(granularBankOptions(['--bank-revision','36'])).toEqual({revision:36});
});
it('requires a new revision and retains the preceding refinement for agreement additions',()=>{
 const args=['--bank-revision','37','--verb-family-recognition','--etre-participle-agreement'];
 expect(granularBankOptions(args)).toEqual({revision:37,verbFamilyRecognition:true,etreParticipleAgreement:true});
 for(const invalid of [['--etre-participle-agreement'],['--bank-revision','36','--verb-family-recognition','--etre-participle-agreement'],['--bank-revision','37','--etre-participle-agreement'],[...args,'--etre-participle-agreement']])expect(()=>granularBankOptions(invalid)).toThrow();
});
it('requires revision 42 and the complete preceding chain for cause relations',()=>{
 const args=['--bank-revision','42','--verb-family-recognition','--etre-participle-agreement','--question-detail-reading','--local-definition-reading','--avoir-participle-agreement','--causal-reading-genres','--cause-relation-family'];
 expect(granularBankOptions(args)).toEqual({revision:42,verbFamilyRecognition:true,etreParticipleAgreement:true,questionDetailReading:true,localDefinitionReading:true,avoirParticipleAgreement:true,causalReadingGenres:true,causeRelationFamily:true});
 for(const invalid of [['--cause-relation-family'],args.map(value=>value==='42'?'41':value),args.filter(value=>value!=='--causal-reading-genres'),[...args,'--cause-relation-family']])expect(()=>granularBankOptions(invalid)).toThrow(/Cause relation|Duplicate cause relation/);
 const r41=args.filter(value=>value!=='--cause-relation-family').map(value=>value==='42'?'41':value);
 expect(granularBankOptions(r41)).toEqual({revision:41,verbFamilyRecognition:true,etreParticipleAgreement:true,questionDetailReading:true,localDefinitionReading:true,avoirParticipleAgreement:true,causalReadingGenres:true});
});
it('requires revision 43 and the complete cause chain for passe recent modal forms',()=>{
 const args=['--bank-revision','43','--verb-family-recognition','--etre-participle-agreement','--question-detail-reading','--local-definition-reading','--avoir-participle-agreement','--causal-reading-genres','--cause-relation-family','--passe-recent-modal-family'];
 expect(granularBankOptions(args)).toEqual({revision:43,verbFamilyRecognition:true,etreParticipleAgreement:true,questionDetailReading:true,localDefinitionReading:true,avoirParticipleAgreement:true,causalReadingGenres:true,causeRelationFamily:true,passeRecentModalFamily:true});
 for(const invalid of [['--passe-recent-modal-family'],args.map(value=>value==='43'?'42':value),args.filter(value=>value!=='--cause-relation-family'),[...args,'--passe-recent-modal-family']])expect(()=>granularBankOptions(invalid)).toThrow(/Passe recent|Duplicate passe recent/);
 const r42=args.filter(value=>value!=='--passe-recent-modal-family').map(value=>value==='43'?'42':value);
 expect(granularBankOptions(r42)).toEqual({revision:42,verbFamilyRecognition:true,etreParticipleAgreement:true,questionDetailReading:true,localDefinitionReading:true,avoirParticipleAgreement:true,causalReadingGenres:true,causeRelationFamily:true});
});
