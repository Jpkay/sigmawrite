import {readFileSync,writeFileSync} from "node:fs";
import {buildQuestionRepairReview} from "../src/lib/diagnostic/granular/question-repair-review";
import type {GeneratedItem} from "../src/lib/ai/item-generation/schemas";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const report=buildQuestionRepairReview({source:read("generated/diagnostic-bank-v3-candidate.json"),draft:read("generated/diagnostic-bank-v3-draft.json"),taxonomy:read("generated/french-taxonomy-v3.json").taxonomy,corrections:read("docs/diagnostic/v3-answer-corrections.json"),repairs:read("docs/diagnostic/v3-item-repairs.json")});
const show=(item:GeneratedItem)=>[
 item.promptFr,item.instructionsFr??"",
 ...(item.choices??[]).map(choice=>`- ${choice.text} [${choice.correct?"correct":"incorrect"}]${choice.feedbackFr?` : ${choice.feedbackFr}`:""}`),
 item.correctAnswer===undefined?"":`Expected answer: ${item.correctAnswer}`,
 `Accepted alternatives: ${item.acceptableAnswers?.join(" / ")||"none"}`,
].filter(Boolean).join("\n\n");
const markdown=["# French question repair review","",
 `${report.summary.questions} changed questions across ${report.summary.targets} approved evidence targets. All are pending review. Historical approvals do not approve these replacements.`,"",
 "Review each pair for correct answers, valid alternatives, clear instructions and exact skill fit. Check whether supplied cues narrow what success demonstrates. Also review material annotations, distractor explanations, difficulty and guessing estimates. These are local review candidates, not a publication decision.","",
 `Packet checksum: ${report.checksum}`,"",
 ...report.rows.flatMap(row=>[
  `## ${row.questionId}`,"",`Target: ${row.target.labelFr} (${row.target.nodeKey}, ${row.target.evidence.key})`,"",row.target.descriptionFr,"",
  `Approved evidence action: ${row.target.evidence.actionFr}`,"",`Reason for change: ${row.reason}`,"",
  "### Before","",show(row.before),"","### Proposed replacement","",show(row.after),"",
  `Material status: ${row.material.annotationStatus}. Difficulty: ${row.metrics.difficulty}; guessing estimate: ${row.metrics.guessProbability}. These require review and calibration.`,"",
  `Source checksum: ${row.sourceChecksum}`,"",`Revised checksum: ${row.revisedChecksum}`,"",
 ]),
 "The companion JSON preserves full question content, approved evidence criteria, material identities, error categories and required reviews. Missing annotations are explicit; present annotations do not prove independent evidence. No decisions or reviewer identities are generated.","",
 "Reproduce with npx tsx scripts/build-question-repair-review.mts; append --check to verify without writing.","",
].join("\n");
for(const [path,value] of [["docs/diagnostic/v3-question-repair-review.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-question-repair-review.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==value)throw Error(`Stale repair packet: ${path}`);}else writeFileSync(path,value);
}
console.log(JSON.stringify(report.summary));
