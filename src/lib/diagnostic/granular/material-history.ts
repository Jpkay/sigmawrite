import {readingPassageText} from "./v3-adapter";
import {materialIdentity} from "./material-identity";
import type {AssessmentStore,AssessmentBundle,StoredSession} from "./service";
/** Positive exposure evidence can be used even when historical capture is
 * incomplete. Absence here never certifies novelty or complete history. */
export async function withKnownMaterialHistory(store:AssessmentStore,session:StoredSession,bundle:Pick<AssessmentBundle,"assessment"> & Partial<Pick<AssessmentBundle,"bank">>):Promise<StoredSession>{
 if(!store.knownMaterialKeys)return session;
 const skills=new Map(bundle.assessment.skills.map(skill=>[skill.id,skill]));
 const readingKeys=new Map<string,string[]>();
 for(const probe of bundle.assessment.probes){
  if(!probe.contextId.startsWith("passage-content:"))continue;
  const entry=bundle.bank?.items.find(entry=>entry.itemKey===probe.id);
  if(!entry||entry.sectionKey!=="reading_comprehension")throw Error("Reading history source unavailable");
  const key=materialIdentity("sentence",readingPassageText(entry.item.validatorConfig,entry.item.promptFr));
  readingKeys.set(key,[...new Set([...(readingKeys.get(key)??[]),probe.contextId])]);
 }
 const targets=[...new Set([...readingKeys.keys(),...bundle.assessment.probes.flatMap(probe=>{
  const rule=skills.get(probe.skillId)?.evidenceRequirements?.[probe.mode];
  return (probe.assessedMaterialKeys??probe.materialKeys??[]).filter(key=>key.startsWith("word:")?rule?.novelWordsRequired:key.startsWith("sentence:")?rule?.novelSentencesRequired:false);
 })])];
 if(!targets.length)return session;
 const known=await store.knownMaterialKeys(session.studentId,targets);
 if(known.some(key=>!targets.includes(key)))throw Error("Material history differs from requested targets");
 const previous=session.state.exposedMaterialKeys??[];
 const additions=known.filter(key=>!previous.includes(key));
 const previousReading=session.state.exposedReadingContexts??[];
 const readingAdditions=known.flatMap(key=>readingKeys.get(key)??[]).filter(context=>!previousReading.includes(context));
 if(!additions.length&&!readingAdditions.length)return session;
 return {...session,state:{...session.state,exposedMaterialKeys:[...new Set([...previous,...additions])],
  ...(readingAdditions.length?{exposedReadingContexts:[...new Set([...previousReading,...readingAdditions])]}:{})}};
}
