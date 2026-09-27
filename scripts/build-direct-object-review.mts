import {readFileSync,writeFileSync} from "node:fs";
import {DIRECT_OBJECT_DRAFTS} from "../src/lib/diagnostic/granular/direct-object-drafts";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {allocateQuestionPools} from "../src/lib/diagnostic/granular/question-pools";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import {checksum} from "../src/lib/taxonomy/validate";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json"),expansion=read("generated/french-v3-direct-object-expansion.json");
const {bank}=assembleDraftBank(base,artifact.taxonomy,[expansion]);
const assessment=adaptV3ForAssessment({artifact,bank});
// Nonpublishing capacity preview; these questions are still unapproved.
const preview={...assessment,probes:expansion.items.map((entry:typeof bank.items[number])=>{
 const skill=assessment.skills.find(skill=>skill.nodeKey===entry.item.nodeKey&&skill.evidenceKey===entry.evidenceKey)!;
 return {id:entry.itemKey,skillId:skill.id,mode:skill.modes[0],contextId:`recognition-context:${entry.itemKey}`,...canonicalProbeMetrics(entry)};
})};
const allocation=allocateQuestionPools(preview);
const coverage=allocation.coverage.filter(row=>DIRECT_OBJECT_DRAFTS.some(draft=>row.skillId.startsWith(`${draft.nodeKey}::`)));
if(coverage.length!==1)throw Error("Direct-object target mismatch");
const text=`# Identification du complément direct : questions à revoir

Statut : 16 brouillons, aucune approbation ni activation. Identification et choix d’une analyse fournie; aucune explication rédigée par l’élève ni production autonome n’est évaluée.

| Cible | Initial / ultérieur | Capacité candidate |
| --- | --- | --- |
${coverage.map(row=>`| ${row.skillId} | ${row.initialItems} / ${row.learningItems} | ${row.status} |`).join("\n")}

Les choix sont mélangés par l’interface. La répartition candidate conserve les règles du graphe, y compris plusieurs occasions. Elle ne prouve ni la validité pédagogique ni l’absence de recoupements avec les leçons. La capacité calculée ne garantit pas un équilibre entre phrases avec et sans COD dans chaque réserve. Vérifier cette répartition, les distracteurs, les indices de réponse, le niveau lexical et la variété des constructions avant toute approbation.

Empreinte des questions : ${checksum(expansion.items)}

${DIRECT_OBJECT_DRAFTS.map(draft=>`## ${draft.key}

Répartition candidate : ${allocation.assessment.probes.find(probe=>probe.id===`v3-direct-object:${draft.key}`)?.usage ?? "non allouée"}.

${draft.prompt}

${[draft.answer,...draft.distractors].map(choice=>`- ${choice}`).join("\n")}

Réponse : ${draft.answer}

Justification pour la revue : ${draft.reason}`).join("\n\n")}
`;
const path="docs/diagnostic/v3-direct-object-review.md";
if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==text)throw Error("Stale direct-object review");}else writeFileSync(path,text);
console.log(JSON.stringify(coverage));
