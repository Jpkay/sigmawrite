import {readFileSync,writeFileSync} from "node:fs";
import {Y_EN_DRAFTS} from "../src/lib/diagnostic/granular/y-en-drafts";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {allocateQuestionPools} from "../src/lib/diagnostic/granular/question-pools";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import {questionMaterialKeys,questionAssessedMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {checksum} from "../src/lib/taxonomy/validate";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json"),expansion=read("generated/french-v3-y-en-expansion.json");
const {bank,annotations}=assembleDraftBank(base,artifact.taxonomy,[expansion]);
const assessment=applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank,annotations).assessment;
const preview={...assessment,probes:annotations.map(annotation=>{
 const entry=bank.items.find(item=>item.itemKey===annotation.itemKey)!;
 const skill=assessment.skills.find(skill=>skill.facetKey===annotation.facetKey)!;
 return {id:entry.itemKey,skillId:skill.id,mode:skill.modes[0],contextId:questionAssessedMaterialKeys(entry.item).join("|"),...canonicalProbeMetrics(entry),materialKeys:questionMaterialKeys(entry.item),assessedMaterialKeys:questionAssessedMaterialKeys(entry.item)};
})};
const allocation=allocateQuestionPools(preview),coverage=allocation.coverage.filter(row=>row.skillId.startsWith("produire_pronoms_y_en::"));
if(coverage.length!==5)throw Error("Missing y/en target");
const text=`# Employer y et en : dossier de revue

90 brouillons, 18 par distinction proposée sous le nœud approuvé produire_pronoms_y_en. Les distinctions fines ne deviennent pas approuvées par cet assemblage. Aucune publication.

| Cible | Initial / ultérieur | Capacité candidate |
| --- | --- | --- |
${coverage.map(row=>`| ${row.skillId} | ${row.initialItems} / ${row.learningItems} | ${row.status} |`).join("\n")}

La consigne demande explicitement y ou en, pour ne pas rejeter des reformulations valides avec cela. L’élève réécrit la phrase entière. La transformation évalue aussi le placement, l’élision et, pour certaines quantités, le maintien du nombre. Une erreur n’isole donc pas nécessairement le choix du pronom. Le plancher de hasard de 1/2 est un modèle conservateur conditionnel au choix y/en, pas une mesure calibrée de réussite d’une phrase entière. Il exige au moins sept réponses correctes par réserve pour le seul critère de hasard. Les autres critères du graphe restent applicables.

Vérifier chaque analyse, les variantes de réponse acceptables, le naturel des phrases de provenance, la portée des distinctions, la progression et l’indépendance des exemples. Les formulations sont originales. Les exercices ne certifient pas la production libre, les référents humains, l’impératif ou l’accord aux temps composés. Il manque encore les leçons exactes et la revue de leur recoupement avec ces questions.

Référence pour les lieux avec y : [Ministère de l’Immigration du Québec, fiche apprenant](https://referencesfrancisation.immigration-quebec.gouv.qc.ca/moodle_ref/pluginfile.php/497488/mod_resource/content/2/22_apprenant.pdf). Une référence grammaticale ne constitue pas une approbation des items.

Empreinte : ${checksum(expansion.items)}

${Y_EN_DRAFTS.map(draft=>`## ${draft.key}

Cible : ${draft.construction}.

${draft.sentence}

Groupe à remplacer : ${draft.target}.

Réponse proposée : ${draft.answer}

Analyse : ${draft.reason}`).join("\n\n")}
`;
const path="docs/diagnostic/v3-y-en-review.md";
if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==text)throw Error("Stale y/en review");}else writeFileSync(path,text);
console.log(JSON.stringify(coverage));
