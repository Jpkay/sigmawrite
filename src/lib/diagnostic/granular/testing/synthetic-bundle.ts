/** INTEGRATION FIXTURE ONLY, in memory or a disposable local test database.
 * The synthetic approval fields below
 * exercise normal runtime validation. They are not pedagogical review records
 * and must never be imported into any hosted project or product content release. */
import type {buildFrenchTaxonomyV3} from "@/lib/taxonomy/french-v3";
import {generatedItemSchema} from "@/lib/ai/item-generation/schemas";
import {sectionForStrand} from "../../protocol";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../../item-bank";
import {adaptV3ForAssessment} from "../v3-adapter";
import {allocateQuestionPools,inspectQuestionPools} from "../question-pools";
import {inspectReleaseBank} from "../release-bank";
import {teachingContentChecksum,validatePublishedTeaching,type PublishedTeachingContent} from "../teaching-content";
import type {AssessmentBundle} from "../service";
const reviewer="00000000-0000-4000-8000-000000000099",reviewedAt="2026-09-11T00:00:00Z";
export function buildSyntheticIntegrationBundle(artifact:ReturnType<typeof buildFrenchTaxonomyV3>,ids:{taxonomyId:string;bankId:string}):AssessmentBundle{
 const items:CanonicalDiagnosticBankItem[]=[];
 for(const node of artifact.taxonomy.nodes)for(const evidence of node.evidence){
  const criteria=evidence.successCriteria,reading=node.strand==="comprehension_ecrite",mcq=evidence.expectation==="receptive";
  const count=Math.max(4,Number(criteria.minimumDistinctItems??criteria.minimumDistinctTexts??3))*2+4;
  for(let index=0;index<count;index++){
   const token=`fixture-${node.key}-${evidence.key}-${index}`,sentence=`Le repère de ce texte de test est ${token}.`,second="Ce document ne sert pas à enseigner le français.",third="Il sert uniquement à vérifier le logiciel.";
   const passage=`${sentence} ${second} ${third}`;
   const prefix=evidence.key.split("-")[0],genre=prefix==="literary"?"literary":prefix==="informational"?"informational":prefix==="argumentative"?"argumentative":["literary","informational","argumentative"][index%3];
   const choices=mcq?[{text:"fixture",correct:true},...[1,2,3].map(n=>({text:`Autre réponse de test ${n}`,correct:false}))]:undefined;
   const item=generatedItemSchema.parse({nodeKey:node.key,strand:node.strand,modality:mcq?(evidence.modality==="multimodal"?"reading":evidence.modality):"writing",learnerMode:"shared",responseType:mcq?"mcq":"short_answer",promptFr:`TEST UNIQUEMENT : ${token}\n\n${passage}\n\nRéponds « fixture » pour cet essai logiciel.`,correctAnswer:"fixture",acceptableAnswers:[],validatorType:"exact",difficulty:50,choices,
    validatorConfig:{materialExposure:{words:[{lemma:token,form:token}],sentences:[sentence]},
     ...(reading?{sourceTextKey:token,sourceTextType:genre,textualSupport:{passageText:passage,choices:[{quoteFr:sentence,correct:true},{quoteFr:second,correct:false},{quoteFr:third,correct:false}]}}:{}),
     ...(criteria.negativeExamplesRequired?{negativeExample:{excerptFr:sentence,rationaleFr:"Synthetic annotation for integration only."}}:{}),
     ...(criteria.minimumContrastingErrors?{contrastingErrors:choices?.filter(c=>!c.correct).map((c,i)=>({errorKey:`fixture-error-${i}`,incorrectChoiceFr:c.text}))}:{}),
     ...(evidence.expectation==="independent_production"?{writingRubric:{version:1,nodeKey:node.key,criteria:[{id:"fixture-only",descriptionFr:"Synthetic test scope; not an educator-approved rubric."}],exclusionsFr:[]}}:{})}});
   items.push({itemKey:token,item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0])!,promptFamily:`synthetic-integration-${index%2}`,difficultyTier:index%2?"foundation":"stretch",reviewStatus:"human_approved",review:{reviewerProfileId:reviewer,reviewedAt},qcGates:{gate0_computed:{applied:false},gate1_schema:true,gate1_invariants:{ok:true,violations:[]},gate2_answer_key:{ok:true},gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}});
  }
 }
 const bank:CanonicalDiagnosticBankArtifact={schemaVersion:1,bank:{key:"synthetic-integration-only",version:"test-only"},taxonomy:{releaseKey:"french-taxonomy-v3",releaseVersion:"3.0.0",checksum:artifact.manifest.contentChecksum},generatedAt:reviewedAt,items};
 const validation=validateCanonicalDiagnosticBank(bank,artifact.taxonomy);if(validation.issues.length)throw Error(`Invalid synthetic bank: ${validation.issues.slice(0,5).join("; ")}`);bank.manifest=validation.manifest;
 const allocation=allocateQuestionPools(adaptV3ForAssessment({artifact,bank}));
 if(!allocation.ready||!inspectQuestionPools(allocation.assessment).ok)throw Error(`Synthetic pools incomplete: ${allocation.coverage.filter(row=>row.status!=="allocated").map(row=>row.skillId).join(", ")}`);
 const bundle:AssessmentBundle={...ids,bank,assessment:allocation.assessment,activities:[],teachingContent:[]};
 for(const skill of bundle.assessment.skills){
  const lesson:PublishedTeachingContent={id:`synthetic-lesson:${skill.id}`,nodeKey:skill.nodeKey,mode:skill.modes[0],status:"published",titleFr:`TEST : ${skill.labelFr}`,learnerQuestionFr:"Comment fonctionne cet essai logiciel ?",steps:[{exampleFr:"Réponse de test : fixture.",explanationFr:"Ceci vérifie le parcours technique, pas un apprentissage."}],takeawayFr:"Cet exemple est réservé aux tests.",boundaryFr:"Ce contenu ne doit pas être publié pour des élèves.",practice:[{id:`synthetic-practice:${skill.id}`,promptFr:"TEST : écris fixture.",answerFr:"fixture",hintFr:"Écris le mot fixture.",explanationFr:"La réponse permet seulement de vérifier l’enregistrement."}],assessmentExposureIds:[],review:{reviewerId:reviewer,reviewedAt,contentChecksum:"",exposureMappingReviewed:true}};
  lesson.review.contentChecksum=teachingContentChecksum(lesson);bundle.teachingContent!.push(lesson);
  bundle.activities!.push({id:`teach:${skill.id}`,nodeKey:skill.nodeKey,mode:skill.modes[0],kind:"instruction",status:"published",titleFr:lesson.titleFr,href:"/student/diagnostic",contentId:lesson.id},{id:`check:${skill.id}`,nodeKey:skill.nodeKey,mode:skill.modes[0],kind:"independent_check",status:"published",titleFr:`TEST : ${skill.labelFr}`,href:"/student/diagnostic",probeIds:bundle.assessment.probes.filter(probe=>probe.skillId===skill.id&&probe.usage==="learning").map(probe=>probe.id)});
 }
 validatePublishedTeaching(bundle.assessment,bundle.teachingContent!);
 if(!inspectReleaseBank(bundle))throw Error("Synthetic bundle fails the normal release-bank guard");
 return bundle;
}
