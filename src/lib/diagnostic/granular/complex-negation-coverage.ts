import type {CanonicalDiagnosticBankItem} from '../item-bank';
import type {Skill,Probe} from './engine';
export const COMPLEX_NEGATION_FEATURES=['plus','jamais','rien','personne','guere'].map(key=>`complex-negation:${key}`);

/** Opt-in authored format. Earlier banks keep their original requirements. */
export function complexNegationFeature(entry:CanonicalDiagnosticBankItem):string|undefined{
 if(entry.promptFamily!=='complex-negation-meaning')return;
 const key=entry.item.validatorConfig?.complexNegationFeature;
 if(entry.item.nodeKey!=='construction_negation_complexe'||entry.evidenceKey!=='reading-analysis'||entry.item.responseType!=='mcq'||typeof key!=='string'||!['plus','jamais','rien','personne','guere','simple','restriction'].includes(key))throw Error('Invalid complex-negation coverage metadata');
 if(key==='simple'||key==='restriction')return;
 return `complex-negation:${key}`;
}

export function applyComplexNegationCoverage(skills:Skill[],probes:readonly Probe[]){
 for(const skill of skills){
  const selected=probes.filter(p=>p.skillId===skill.id&&p.evidenceFeatures?.some(f=>COMPLEX_NEGATION_FEATURES.includes(f)));
  if(!selected.length)continue;
  if(selected.some(p=>p.mode!=='recognition'))throw Error('Complex-negation recognition metadata used for another mode');
  const rule=skill.evidenceRequirements?.recognition;if(!rule)throw Error('Missing approved complex-negation requirements');
  // Each meaning needs its own observations. Preserve accuracy, counterexample,
  // occasion and all other requirements inherited from the approved node.
  const requirements=new Map((rule.featureRequirements??[]).map(r=>[r.feature,{...r}]));
  for(const feature of COMPLEX_NEGATION_FEATURES){
   const previous=requirements.get(feature);
   requirements.set(feature,{feature,minimumItems:Math.max(4,previous?.minimumItems??0),minimumContexts:Math.max(4,previous?.minimumContexts??0)});
  }
  rule.featureRequirements=[...requirements.values()];
 }
}
