import {readFileSync,writeFileSync} from "node:fs";
import {checksum} from "../src/lib/taxonomy/validate";
import {lessonForPracticeNode} from "../src/lib/practice/lessons";
import {pronounLessonForNode} from "../src/lib/grammar/pronouns";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json");
const snapshotPath="generated/french-v3-legacy-teaching-source.json";
if(process.argv.includes("--refresh")){
 const {config}=await import("dotenv");config({path:".env.local",quiet:true});
 const {createClient}=await import("@supabase/supabase-js");
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error("Content source configuration unavailable");
 const db=createClient(url,key,{auth:{persistSession:false}});
 const keys=artifact.taxonomy.nodes.map((node:{key:string})=>node.key);
 const {data:nodes,error}=await db.from("competency_nodes").select("id,key,label_fr,description_fr,strand").in("key",keys).order("key");
 if(error)throw Error(error.message);
 const {data:lessons,error:lessonError}=await db.from("competency_lessons").select("node_id,explanation_fr,pattern_fr,examples_fr,exceptions_fr,review_status,version,updated_at").in("node_id",nodes.map(node=>node.id)).order("node_id");
 if(lessonError)throw Error(lessonError.message);
 // Curriculum content only: no learner records, auth identities or secrets.
 const source={version:"french-v3-legacy-teaching-source-v1",capturedAt:new Date().toISOString(),taxonomyChecksum:artifact.manifest.contentChecksum,nodes,lessons};
 writeFileSync(snapshotPath,JSON.stringify({...source,checksum:checksum(source)},null,2)+"\n");
}
const {checksum:sourceChecksum,...source}=read(snapshotPath);
if(checksum(source)!==sourceChecksum||source.taxonomyChecksum!==artifact.manifest.contentChecksum)throw Error("Stale or invalid teaching source");
const approvedKeys=new Set<string>(artifact.taxonomy.nodes.map((node:{key:string})=>node.key));
const capturedKeys=new Set<string>(source.nodes.map((node:{key:string})=>node.key));
if(source.nodes.length!==approvedKeys.size||capturedKeys.size!==approvedKeys.size||[...approvedKeys].some(key=>!capturedKeys.has(key)))throw Error("Teaching snapshot is missing or duplicates approved nodes");
const capturedIds=new Set<string>(source.nodes.map((node:{id:string})=>node.id));
if(source.lessons.some((lesson:{node_id:string})=>!capturedIds.has(lesson.node_id))||new Set(source.lessons.map((lesson:{node_id:string})=>lesson.node_id)).size!==source.lessons.length)throw Error("Invalid teaching snapshot lesson ownership");
const delivery=read("docs/diagnostic/v3-delivery-matrix.json");
const genericPattern="Observe le repère → explique ton choix → applique-le dans une phrase nouvelle.";
const rows=artifact.taxonomy.nodes.map((node:{key:string;labelFr:string;descriptionFr:string;strand:string})=>{
 const stored=source.nodes.find((row:{key:string})=>row.key===node.key);
 const record=stored?source.lessons.find((row:{node_id:string})=>row.node_id===stored.id):undefined;
 const approved=record&&["auto_approved","human_approved"].includes(record.review_status)?{
  explanation:record.explanation_fr,pattern:record.pattern_fr,examples:record.examples_fr,exceptions:record.exceptions_fr,
 }:undefined;
 // Mirror the actual practice route's override precedence and live node text.
 const practiceNode={key:node.key,label:stored?.label_fr??node.labelFr,description:stored?.description_fr??node.descriptionFr,strand:stored?.strand??node.strand};
 const lesson=lessonForPracticeNode(practiceNode,approved);
 const sourceKind=practiceNode.strand==="conjugaison"?"bundled_conjugation":pronounLessonForNode(node.key,practiceNode.label)?"bundled_pronoun":approved?"database_lesson":"taxonomy_fallback";
 const placeholder=lesson.pattern===genericPattern;
 const {eyebrow,family,...body}=lesson;void eyebrow;void family;
 const targets=delivery.rows.filter((row:{nodeKey:string})=>row.nodeKey===node.key);
 return {nodeKey:node.key,labelFr:node.labelFr,strand:node.strand,sourceKind,storedReviewStatus:record?.review_status??null,
  storedVersion:record?.version??null,renderedContentChecksum:checksum(body),content:body,
  classification:placeholder?"generic_instruction_card":"specific_content_requires_scope_review",
  reason:placeholder?"Uses the exact generic instruction pattern seeded by migration 0091 or the taxonomy fallback":"Specific content exists, but its examples and scope have not been accepted for each granular target",
  assessmentTargetIds:targets.map((row:{skillId:string})=>row.skillId),targetsWithNewTeachingDraft:targets.filter((row:{teachingDrafts:unknown[]})=>row.teachingDrafts.length).map((row:{skillId:string})=>row.skillId),
  nextAction:placeholder?"replace_generic_card_with_target_teaching":"review_scope_then_add_exact_guided_practice",
  reuseApproved:false};
});
const groups=[...new Set(rows.map((row:{renderedContentChecksum:string})=>row.renderedContentChecksum))].map(hash=>({contentChecksum:hash,nodeKeys:rows.filter((row:{renderedContentChecksum:string})=>row.renderedContentChecksum===hash).map((row:{nodeKey:string})=>row.nodeKey)}));
const summary={approvedNodes:rows.length,storedLessons:source.lessons.length,genericCards:rows.filter((row:{classification:string})=>row.classification==="generic_instruction_card").length,specificContentCandidates:rows.filter((row:{classification:string})=>row.classification!=="generic_instruction_card").length,sharedContentGroups:groups.filter(group=>group.nodeKeys.length>1).length,approvedReuseBindings:0};
const report={version:"french-v3-teaching-reuse-audit-v1",status:"scope_review_required",sourceCapturedAt:source.capturedAt,sourceChecksum,taxonomyChecksum:artifact.manifest.contentChecksum,deliveryChecksum:delivery.checksum,summary,sharedContent:groups.filter(group=>group.nodeKeys.length>1),rows};
const markdown=`# Existing French teaching reuse audit

Read-only content snapshot: ${source.capturedAt}. No review status, database content or student record was changed.

${summary.approvedNodes} approved graph nodes; ${summary.storedLessons} stored lesson records. The actual practice renderer provides ${summary.genericCards} generic instruction cards and ${summary.specificContentCandidates} specific-content candidates. There are ${summary.sharedContentGroups} groups where several nodes display identical substantive content. No granular reuse binding is approved by this audit.

A stored auto_approved or human_approved status is not evidence of exact scope for a new granular target. Bundled conjugation and pronoun templates take precedence over stored lessons in the current renderer. Generic cards are identified by the exact fallback pattern; other content remains a review candidate, not a proven suitable lesson.

| Approved node | Rendered source | Existing content | Next action |
| --- | --- | --- | --- |
${rows.map((row:{nodeKey:string;sourceKind:string;classification:string;nextAction:string})=>`| ${row.nodeKey} | ${row.sourceKind} | ${row.classification} | ${row.nextAction} |`).join("\n")}

The companion JSON contains the rendered explanations/examples, source checksums, shared-template groups and all related diagnostic target IDs. Review these candidates before authoring replacements. Existing broad examples cannot automatically satisfy finer verb, construction, genre or evidence-mode requirements.

Refresh the read-only content snapshot with npx tsx scripts/audit-v3-teaching-reuse.mts --refresh. Regenerate offline without that flag; append --check to verify the report against its captured sources.
`;
for(const [path,value] of [["docs/diagnostic/v3-teaching-reuse-audit.json",JSON.stringify({...report,checksum:checksum(report)},null,2)+"\n"],["docs/diagnostic/v3-teaching-reuse-audit.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==value)throw Error(`Stale reuse audit: ${path}`);}else writeFileSync(path,value);
}
console.log(JSON.stringify(summary));
