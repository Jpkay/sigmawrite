import {checksum} from "../../src/lib/taxonomy/validate";
import {WRITING_EVALUATOR_VERSION} from "../../src/lib/diagnostic/granular/writing-evaluator";
/** Summarize synthetic coverage, never certify a pedagogical release. */
import {readFileSync,writeFileSync} from "node:fs";
import {FRENCH_TAXONOMY_V3_CANDIDATE} from "../../src/lib/taxonomy/french-v3";
const read=(file:string)=>JSON.parse(readFileSync(`docs/diagnostic/writing/${file}`,"utf8"));
const inputs=[
 {cases:read("evaluator-counterexample-cases.json"),report:read("evaluator-counterexample-report.json")},
 {cases:read("evaluator-scoped-cases.json"),report:read("evaluator-scoped-opportunity-report.json")},
 {cases:read("evaluator-adversarial-cases.json"),report:read("evaluator-adversarial-report.json")},
 {cases:read("evaluator-target-cases.json"),report:read("evaluator-target-report.json")},
];
const rows=FRENCH_TAXONOMY_V3_CANDIDATE.nodes.filter(node=>node.evidence.some(e=>e.expectation==="independent_production")).map(node=>{
 const cases=inputs.flatMap(input=>input.cases.filter((c:{node:string})=>c.node===node.key).map((c:{id:string;expect:string})=>{
  const result=input.report.results.find((r:{id:string})=>r.id===c.id);
  const sourceBound=result?.caseChecksum===checksum(c);
  const opportunityChecked=c.expectedOpportunities!==undefined;
  const opportunityMatched=opportunityChecked?result?.evidenceMatched===true:null;
  const currentEvaluator=result?.result?.evaluator?.version===WRITING_EVALUATOR_VERSION;
  return {id:c.id,expected:c.expect,observed:result?.observed??"not_run",sourceBound,currentEvaluator,opportunityChecked,opportunityMatched,matched:Boolean(sourceBound&&currentEvaluator&&result.expected===c.expect&&result.observed===c.expect&&(!opportunityChecked||opportunityMatched)),model:input.report.model};
 }));
 return {nodeKey:node.key,labelFr:node.labelFr,cases,missingExpectedOutcomes:["correct","incorrect","unresolved"].filter(outcome=>!cases.some(c=>c.expected===outcome&&c.matched)),
  nextAction:cases.length?"add_counterexamples_and_independent_review":"define_target_rubric_and_add_cases"};
});
const report={status:"synthetic_coverage_only_not_calibrated",scope:"Source-bound counterexamples, scoped, adversarial and expanded target datasets using the current evaluator; excludes stale results, initial smoke and repeated runs",targetCount:rows.length,
 targetsWithCases:rows.filter(row=>row.cases.length).length,targetsWithAllOutcomeTypes:rows.filter(row=>!row.missingExpectedOutcomes.length).length,targets:rows};
writeFileSync("docs/diagnostic/writing/calibration-coverage.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({targets:report.targetCount,targetsWithCases:report.targetsWithCases,targetsWithAllOutcomeTypes:report.targetsWithAllOutcomeTypes}));
