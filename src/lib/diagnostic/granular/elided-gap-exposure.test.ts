import {expect,it} from 'vitest';
import {annotatedMaterialKeys} from './material-annotations';
import {materialIdentity} from './material-identity';
it('retains stored keys and adds the shared subject-gap identity',()=>{
 const sentence='J’___ au cinéma.';
 const keys=annotatedMaterialKeys({elidedGapAliases:true,sentences:[sentence]},[sentence]);
 expect(keys).toContain(materialIdentity('sentence',sentence));
 expect(keys).toContain(materialIdentity('sentence','Je ___ au cinéma.'));
 expect(annotatedMaterialKeys({elidedGapAliases:true,sentences:["J'___ au cinéma."]},["J'___ au cinéma."])).toEqual(keys);
});
it('does not alias complete sentences or excuse unanchored source material',()=>{
 const sentence='J’étais au cinéma.';
 expect(annotatedMaterialKeys({elidedGapAliases:true,sentences:[sentence]},[sentence])).toEqual([materialIdentity('sentence',sentence)]);
 expect(()=>annotatedMaterialKeys({elidedGapAliases:true,sentences:['Je ___ au cinéma.']},['J’___ au cinéma.'])).toThrow('not anchored');
});

it('preserves the exact legacy key set when the release did not opt in',()=>{
 const sentence='J’___ au cinéma.';
 expect(annotatedMaterialKeys({sentences:[sentence]},[sentence])).toEqual([materialIdentity('sentence',sentence)]);
});
