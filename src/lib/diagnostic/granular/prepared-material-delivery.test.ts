import {expect,it,vi} from 'vitest';
import {capturePreparedMaterialDelivery} from './covered-material-delivery';
const owner='owner';
const presentation={studentId:owner,presentationId:'presentation',sourceChecksum:'sha256:source',materialKeys:['word:one']};
const store=()=>({recordMaterialPresentation:vi.fn(async()=>{}),recordDeliveredText:vi.fn(async()=>{}),recordCoveredMaterialDelivery:vi.fn(async()=>{})});
it('submits prepared identities and text as one operation under an explicit contract',async()=>{
 const f=store();await capturePreparedMaterialDelivery(f,owner,'test:review',{title:'La correction'},[presentation],'trusted-contract');
 expect(f.recordCoveredMaterialDelivery).toHaveBeenCalledWith(expect.objectContaining({studentId:owner,textFragments:['La correction'],contractKey:'trusted-contract',presentations:[{presentationId:'presentation',sourceChecksum:'sha256:source',materialKeys:['word:one']}]}));
 expect(f.recordMaterialPresentation).not.toHaveBeenCalled();expect(f.recordDeliveredText).not.toHaveBeenCalled();
});
it('rejects a mixed-owner batch before any write, including ordinary capture',async()=>{
 for(const key of [undefined,'trusted-contract']){
  const f=store();await expect(capturePreparedMaterialDelivery(f,owner,'test:review',{text:'Correction'},[presentation,{...presentation,studentId:'other'}],key)).rejects.toThrow('owner mismatch');
  expect(f.recordMaterialPresentation).not.toHaveBeenCalled();expect(f.recordDeliveredText).not.toHaveBeenCalled();expect(f.recordCoveredMaterialDelivery).not.toHaveBeenCalled();
 }
});
it('never falls back to partial writes when the requested atomic operation fails',async()=>{
 const f=store();f.recordCoveredMaterialDelivery.mockRejectedValue(Error('atomic failure'));
 await expect(capturePreparedMaterialDelivery(f,owner,'test:review',{text:'Correction'},[presentation],'trusted-contract')).rejects.toThrow('atomic failure');
 expect(f.recordMaterialPresentation).not.toHaveBeenCalled();expect(f.recordDeliveredText).not.toHaveBeenCalled();
 await expect(capturePreparedMaterialDelivery({...f,recordCoveredMaterialDelivery:undefined},owner,'test:review',{text:'Correction'},[],'trusted-contract')).rejects.toThrow('unavailable');
});
it('supports covered interface-only text without inventing a question presentation',async()=>{
 const f=store();await capturePreparedMaterialDelivery(f,owner,'test:shell',{text:'Reprendre'},[],'trusted-contract');
 expect(f.recordCoveredMaterialDelivery).toHaveBeenCalledWith(expect.objectContaining({presentations:[],textFragments:['Reprendre']}));
});
