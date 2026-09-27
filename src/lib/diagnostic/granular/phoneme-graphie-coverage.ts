import {readAudioStimulus} from './audio-stimulus';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
import type {Skill,Probe} from './engine';
export const PHONEME_GRAPHIE_FEATURES=['ch','ou','gn','f'].map(group=>`phoneme-graphie:${group}`);
/** Source-bound to this explicit auditory format. Older banks remain unchanged. */
export function phonemeGraphieFeature(entry:CanonicalDiagnosticBankItem):string|undefined{
 if(entry.promptFamily!=='heard-word-missing-grapheme')return;
 const group=entry.item.validatorConfig?.phonemeGraphieGroup;
 if(entry.item.nodeKey!=='associer_phoneme_graphie_frequente'||!['reading-receptive','writing-controlled-production'].includes(entry.evidenceKey)||!readAudioStimulus(entry.item)||!['ch','ou','gn','f'].includes(String(group)))throw Error('Invalid auditory grapheme coverage metadata');
 return `phoneme-graphie:${group}`;
}
/** Each sound group requires independent evidence, not pooled success elsewhere.
 * Four correct 4-way contrasts fall below the existing 1% guessing limit.
 * Approved graph requirements (including occasions and novelty) still apply. */
export function applyPhonemeGraphieCoverage(skills:Skill[],probes:readonly Probe[]){
 for(const skill of skills){
  if(!probes.some(p=>p.skillId===skill.id&&p.evidenceFeatures?.some(f=>PHONEME_GRAPHIE_FEATURES.includes(f))))continue;
  for(const mode of skill.modes){
   const rule=skill.evidenceRequirements?.[mode];
   if(!rule)throw Error('Missing approved auditory evidence requirements');
   rule.featureRequirements=[...(rule.featureRequirements??[]),...PHONEME_GRAPHIE_FEATURES.map(feature=>({feature,minimumItems:4,minimumContexts:4}))];
  }
 }
}
