import {expect,it} from 'vitest';
import {granularBankOptions} from '../../../../scripts/lib/granular-bank-options';
it('requires explicit unambiguous revision input before building or publishing',()=>{
 expect(granularBankOptions(['check'])).toEqual({});
 expect(granularBankOptions(['publish','release-r2','--bank-revision','2'])).toEqual({revision:2});
 for(const args of [['--bank-revision'],['--bank-revision','0'],['--bank-revision','01'],['--bank-revision','1.5'],['--bank-revision','2','--bank-revision','3'],['--bank-revision','9007199254740992']])expect(()=>granularBankOptions(args)).toThrow(/positive integer/);
});
