import type {Probe} from "./engine";
const key=(probe:Probe)=>JSON.stringify([probe.skillId,probe.mode,probe.samplingCategory]);
/** Exposure counts guide variety, never grading or mastery. Deduplicate known
 * question IDs and derive scope from the pinned bank, not observation metadata. */
export function categoryExposurePriority(bank:readonly Probe[],seenIds:Iterable<string>):(probe:Probe)=>number{
 const seen=new Set(seenIds),counts=new Map<string,number>();
 for(const probe of bank){
  if(!probe.samplingCategory||!seen.has(probe.id))continue;
  const category=key(probe);counts.set(category,(counts.get(category)??0)+1);
 }
 return probe=>probe.samplingCategory?(counts.get(key(probe))??0):0;
}
