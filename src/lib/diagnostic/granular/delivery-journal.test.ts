import {expect,it,vi} from 'vitest';
import {deliveredTextFragments,journalMaterialDelivery} from './delivery-journal';
it('captures exact nested question, option, correction, hint and student-state strings without guessing identities',()=>{
 const payload={view:{question:{promptFr:'Les chevaux courent.',choices:[{text:'chevaux'}]},feedback:{answer:'courent',hint:'Observe le sujet.'}},studentState:{lesson:{title:'Le verbe'}}};
 expect(deliveredTextFragments(payload)).toEqual(['Le verbe','Les chevaux courent.','Observe le sujet.','chevaux','courent'].sort());
 expect(deliveredTextFragments(payload)).not.toContain('cheval');
});
it('keeps text stable across clock ticks, retries and JSON property ordering',()=>{
 expect(deliveredTextFragments({text:'École',nested:['École','ecole'],remaining:10})).toEqual(deliveredTextFragments({remaining:9,nested:['ecole','École'],text:'École'}));
});
it('journals before returning and propagates storage failures without changing the payload',async()=>{
 const payload={prompt:'Termine la phrase.'},snapshot=structuredClone(payload);
 const recordDeliveredText=vi.fn().mockRejectedValue(Error('unavailable'));
 await expect(journalMaterialDelivery({recordDeliveredText},'student','granular:diagnostic',payload)).rejects.toThrow('unavailable');
 expect(recordDeliveredText).toHaveBeenCalledWith({studentId:'student',boundary:'granular:diagnostic',payloadChecksum:expect.stringMatching(/^sha256:/),textFragments:['Termine la phrase.']});
 expect(payload).toEqual(snapshot);
});
it('rejects cycles, unsupported objects and excessive payloads',()=>{
 const circular:{child?:unknown}={};circular.child=circular;
 for(const payload of [circular,{date:new Date()},{fn:()=>0},{text:'x'.repeat(2_000_001)}])expect(()=>deliveredTextFragments(payload)).toThrow();
});
it('does not retain signed transport URLs or pretend they capture spoken content',()=>{
 expect(deliveredTextFragments({audioUrl:'https://storage.example/audio?token=private',href:'/audio?token=private',other:'https://storage.example/file?token=private',prompt:'Écoute le mot.'})).toEqual(['Écoute le mot.']);
});
