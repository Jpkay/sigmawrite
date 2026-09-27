import {readFileSync,writeFileSync} from "node:fs";
import {checksum} from "../src/lib/taxonomy/validate";
import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {FACET_PREREQUISITE_RULES} from "../src/lib/diagnostic/granular/facet-prerequisites";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const base=adaptV3ForAssessment({artifact,bank}),facets=buildV3Facets(artifact.taxonomy),refined=applyFacetTargets(base,facets,bank).assessment;
const rows=refined.skills.flatMap(target=>{
 const parent=base.skills.find(s=>s.nodeKey===target.nodeKey&&s.evidenceKey===target.evidenceKey)!;
 return parent.prerequisites.map(priorId=>{
  const prior=base.skills.find(s=>s.id===priorId)!;
  const alternatives=refined.skills.filter(s=>s.nodeKey===prior.nodeKey&&s.evidenceKey===prior.evidenceKey);
  const selected=alternatives.filter(s=>target.prerequisites.includes(s.id));
  if(!selected.length)throw Error(`Lost approved parent prerequisite: ${target.id} ${priorId}`);
  const construction=FACET_PREREQUISITE_RULES.find(rule=>target.facetKey&&rule.targetNodeKey===target.nodeKey&&rule.sourceNodeKey===prior.nodeKey);
  const requiresScopeReview=selected.length>1&&selected.some(s=>s.facetKey);
  return {targetId:target.id,targetNodeKey:target.nodeKey,labelFr:target.labelFr,approvedSourceId:priorId,
   sourceNodeKey:prior.nodeKey,availableRefinements:alternatives.length,selectedIds:selected.map(s=>s.id),
   mapping:construction?"construction_support_verb":!alternatives.some(s=>s.facetKey)?"unrefined_parent":selected.length<alternatives.length?"matching_facet":"all_refinements",
   rationaleFr:construction?.rationaleFr??null,requiresScopeReview};
 });
});
const flagged=rows.filter(row=>row.requiresScopeReview);
const groups=[...new Set(flagged.map(row=>`${row.sourceNodeKey}|${row.targetNodeKey}`))].map(key=>{
 const group=flagged.filter(row=>`${row.sourceNodeKey}|${row.targetNodeKey}`===key),first=group[0];
 return {sourceNodeKey:first.sourceNodeKey,targetNodeKey:first.targetNodeKey,affectedTargets:new Set(group.map(row=>row.targetId)).size,maximumRequiredRefinements:Math.max(...group.map(row=>row.selectedIds.length))};
}).sort((a,b)=>b.affectedTargets*b.maximumRequiredRefinements-a.affectedTargets*a.maximumRequiredRefinements);
const content={version:"french-v3-prerequisite-audit-v1",status:"draft_scope_review_required",taxonomyChecksum:base.taxonomyChecksum,facetChecksum:refined.facetChecksum,
 rules:FACET_PREREQUISITE_RULES,summary:{targets:refined.skills.length,compiledEdges:refined.skills.reduce((n,s)=>n+s.prerequisites.length,0),parentEvidenceMappings:rows.length,targetsRequiringScopeReview:new Set(flagged.map(row=>row.targetId)).size,flaggedParentMappings:flagged.length},
 limitation:"All-refinement mappings are review candidates, not automatically incorrect. Preserve approved parent edges; validate the necessary finer scope before changing it. This audit does not approve or publish anything.",groups,rows};
const report={...content,checksum:checksum(content)};
const markdown=`# French prerequisite refinement audit\n\nUses the approved French v3 graph. No Allotey dependencies.\n\n${content.summary.targets} targets; ${content.summary.compiledEdges} compiled prerequisite edges. ${content.summary.targetsRequiringScopeReview} targets inherit multiple finer prerequisites that need a scope review. This is a review queue, not a list of proven errors.\n\nNear-future production now depends on present-tense aller, and recent-past production on present-tense venir. The approved parent edges remain intact.\n\n| Approved source | Target | Affected targets | Maximum finer prerequisites per source evidence |\n| --- | --- | ---: | ---: |\n${groups.map(row=>`| ${row.sourceNodeKey} | ${row.targetNodeKey} | ${row.affectedTargets} | ${row.maximumRequiredRefinements} |`).join("\n")}\n\nFor each row, determine which finer prerequisites are necessary for the target, retain the approved parent relationship, and validate the resulting pathway with uneven student profiles. Full target IDs and selected prerequisites are in the JSON companion. Broad prerequisite expansion must not be mistaken for confirmed pedagogical necessity.\n`;
for(const [path,text] of [["docs/diagnostic/v3-prerequisite-audit.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-prerequisite-audit.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==text)throw Error(`Stale prerequisite audit: ${path}`);}else writeFileSync(path,text);
}
console.log(JSON.stringify(content.summary));
