import {readFileSync,writeFileSync} from "node:fs";
import {checksum} from "../src/lib/taxonomy/validate";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
import {auditDeterminerProfile} from "../src/lib/diagnostic/granular/testing/determiner-profile-audit";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json");
const {bank}=assembleDraftBank(base,artifact.taxonomy,[read("generated/french-v3-determiner-agreement-expansion.json"),read("generated/french-v3-determiner-production-expansion.json")]);
const profiles=[{name:"Recognizes agreement, struggles to correct",recognition:true,production:false},{name:"Corrects agreement, struggles with supplied analysis",recognition:false,production:true}].map(profile=>({...profile,...auditDeterminerProfile(artifact,bank,profile.recognition,profile.production)}));
const content={version:"determiner-profile-audit-v1",status:"synthetic_routing_evidence_only",profiles};
const markdown=`# Uneven determiner profiles: routing audit

These are simulations using actual draft questions, their guessing estimates and the approved graph's evidence/prerequisite rules. They are not student observations, pedagogical calibration or a production release. The scenario is restricted to one competency's recognition and production targets. Its duration is not evidence about the full 35-minute diagnostic.

Prerequisite evidence and complete novelty history are assumed synthetically. No draft questions or activity bindings are promoted in stored artifacts. Both simulated students have successful independent checks on fresh reserved questions over two later occasions.

| Profile | Initial questions | Active seconds in this module | First teaching | Result after fresh checks |
| --- | ---: | ---: | --- | --- |
${profiles.map(profile=>`| ${profile.name} | ${profile.selected.length} | ${profile.activeSeconds} | ${profile.activities.filter(activity=>activity.kind==="instruction").map(activity=>activity.titleFr).join(", ")} | ${profile.afterFreshChecks.results.map(result=>`${result.skillId.split("::")[1]}: ${result.status}`).join("; ")} |`).join("\n")}

In the first sitting, the stronger mode remains unconfirmed because only one occasion was observed. Consistent errors can lead to teaching for the weaker mode without pretending the gap is fully confirmed. Removing the synthetic prerequisite evidence blocks that teaching. Later independent success updates only the reassessed mode; the stronger mode's prior result remains unchanged and still needs confirmation.

The JSON includes selected/reserved question IDs, mode-level probabilities, evidence counts, recommended activity IDs and source checksums. It does not prove that these drafts are valid, that learners improve after the lesson, or that the system distinguishes every finer construction within this competency.

Reproduce: npx tsx scripts/audit-determiner-profiles.mts. Append --check to verify without writing.
`;
for(const [path,text] of [["docs/diagnostic/v3-determiner-profile-audit.json",JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n"],["docs/diagnostic/v3-determiner-profile-audit.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==text)throw Error(`Stale audit: ${path}`);}else writeFileSync(path,text);
}
console.log(JSON.stringify(profiles.map(profile=>({profile:profile.name,questions:profile.selected.length,seconds:profile.activeSeconds,lesson:profile.activities.filter(activity=>activity.kind==="instruction").map(activity=>activity.contentId)}))));
