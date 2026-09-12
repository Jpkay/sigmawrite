import type {CanonicalDiagnosticBankItem} from '../item-bank';
import type {Skill,Probe} from './engine';
export const WRITTEN_SYLLABLE_FEATURES=['simple','double_consonant','consonant_group'].map(pattern=>`written-syllable:${pattern}`);
/** This contract only applies to the versioned written-segmentation format. */
export function writtenSyllableFeature(entry:CanonicalDiagnosticBankItem):string|undefined{
 if(entry.promptFamily!=='written-syllable-segmentation')return;
 const feature=`written-syllable:${entry.item.validatorConfig?.writtenSyllablePattern}`;
 if(entry.item.nodeKey!=='segmenter_syllabes_ecrites'||!['reading-receptive','writing-controlled-production'].includes(entry.evidenceKey)||!WRITTEN_SYLLABLE_FEATURES.includes(feature))throw Error('Invalid written syllable coverage metadata');
 return feature;
}
export function applyWrittenSyllableCoverage(skills:Skill[],probes:readonly Probe[]){
 for(const skill of skills){
  if(!probes.some(p=>p.skillId===skill.id&&p.evidenceFeatures?.some(f=>WRITTEN_SYLLABLE_FEATURES.includes(f))))continue;
  for(const mode of skill.modes){
   const rule=skill.evidenceRequirements?.[mode];if(!rule)throw Error('Missing approved syllable requirements');
   rule.featureRequirements=[...(rule.featureRequirements??[]),...WRITTEN_SYLLABLE_FEATURES.map(feature=>({feature,minimumItems:4,minimumContexts:4}))];
  }
 }
}
