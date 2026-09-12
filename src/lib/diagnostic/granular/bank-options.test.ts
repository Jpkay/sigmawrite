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
