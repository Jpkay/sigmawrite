/** Necessary simulation checks only. Synthetic truth and sufficient evidence in
 * one sitting do not establish calibrated mastery or actual student validity. */
export function inspectProfileDiscrimination(
 targets:readonly {skillId:string;branch:string;expectedKnown:boolean}[],
 sampled:readonly {skillId:string;withinOccasionResolved:boolean}[],
 requireSameBranch=false,
){
 const resolved=new Set(sampled.filter(row=>row.withinOccasionResolved).map(row=>row.skillId));
 const known=targets.filter(target=>target.expectedKnown),weak=targets.filter(target=>!target.expectedKnown);
 const knownWithEvidence=known.filter(target=>resolved.has(target.skillId)),weakWithEvidence=weak.filter(target=>resolved.has(target.skillId));
 const boundaries=[...new Set(knownWithEvidence.map(target=>target.branch))].filter(branch=>weakWithEvidence.some(target=>target.branch===branch));
 return {
  requiredKnownTargets:known.length,requiredWeakTargets:weak.length,
  knownTargetsWithEvidence:knownWithEvidence.map(target=>target.skillId),weakTargetsWithEvidence:weakWithEvidence.map(target=>target.skillId),
  knownTargetsUnresolved:known.filter(target=>!resolved.has(target.skillId)).map(target=>target.skillId),weakTargetsUnresolved:weak.filter(target=>!resolved.has(target.skillId)).map(target=>target.skillId),
  sameBranchBoundaries:boundaries,requireSameBranch,
  passed:knownWithEvidence.length>0&&weakWithEvidence.length>0&&(!requireSameBranch||boundaries.length>0),
 };
}
