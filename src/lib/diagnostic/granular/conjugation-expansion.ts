import {conjugate,type Person,type Tense} from "@/lib/linguistic/conjugation";
import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {runGates} from "@/lib/ai/item-generation/pipeline";
import type {GeneratedItem} from "@/lib/ai/item-generation/schemas";
import {diagnosticItemSurfaceIdentity,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../item-bank";
import {conjugationAuthoringCases,conjugationEvidenceFeatures} from "./facets";
import type {FacetAnnotation} from "./facet-adapter";
import {questionMaterialKeys} from "./material-annotations";
import {PRESENT_APPLICATION_CONTEXTS} from "./present-application-contexts";

const LABELS:Record<string,string>={present:"présent de l’indicatif",imparfait:"imparfait",futur_proche:"futur proche",passe_recent:"passé récent",passe_compose:"passé composé",futur_simple:"futur simple",plus_que_parfait:"plus-que-parfait",conditionnel_present:"conditionnel présent",subjonctif_present:"subjonctif présent",imperatif_present:"impératif présent",passe_simple:"passé simple"};
const SUBJECTS:Array<{person:Person;gender:"m"|"f";subject:string}>=[
 {person:"1s",gender:"m",subject:"je"},{person:"2s",gender:"m",subject:"tu"},{person:"3s",gender:"m",subject:"il"},{person:"3s",gender:"f",subject:"elle"},
 {person:"1p",gender:"m",subject:"nous"},{person:"2p",gender:"m",subject:"vous"},{person:"3p",gender:"m",subject:"ils"},{person:"3p",gender:"f",subject:"elles"},
];
const PRESENT_SPELLING_CONTEXTS:readonly [string,string][]=[
 ["manger","Nous ___ une soupe après la randonnée."],
 ["manger","Nous ___ les fruits du jardin."],
 ["nager","Nous ___ près du ponton."],
 ["nager","Nous ___ trois longueurs avant de sortir."],
 ["voyager","Nous ___ avec une petite valise."],
 ["voyager","Nous ___ en groupe pendant les vacances."],
 ["commencer","Nous ___ la répétition après le goûter."],
 ["commencer","Nous ___ une nouvelle partie."],
 ["lancer","Nous ___ le cerf-volant face au vent."],
 ["lancer","Nous ___ le ballon vers le panier."],
 ["avancer","Nous ___ de deux cases sur le plateau."],
 ["avancer","Nous ___ lentement dans le couloir."],
];

/** Authored form-production coverage, not approval or proof of contextual use. */
export async function expandConjugationDraft(bank:CanonicalDiagnosticBankArtifact,taxonomy:TaxonomyCandidate){
 const items:CanonicalDiagnosticBankItem[]=[],annotations:FacetAnnotation[]=[],skipped:Array<{key:string;reason:string}>=[];
 const surfaces=new Set(bank.items.map(e=>`${e.item.nodeKey}:${diagnosticItemSurfaceIdentity(e.item)}`));
 const context={knownNodeKeys:new Set(taxonomy.nodes.map(n=>n.key)),knownMisconceptionKeys:new Set<string>()};
 for(const target of conjugationAuthoringCases()){
  const node=taxonomy.nodes.find(n=>n.key===target.nodeKey);
  const evidence=node?.evidence.find(e=>e.expectation==="controlled_production"&&e.modality==="writing");
  if(!node||!evidence)throw Error(`Missing approved production target: ${target.nodeKey}`);
  const imperative=target.tense==="imperatif_present";
  const subjects=imperative?SUBJECTS.filter(s=>["2s","1p","2p"].includes(s.person)&&s.gender==="m"):SUBJECTS;
  for(const subject of subjects)for(const negative of imperative?[false,true]:[false]){
   const key=`v3-granular-forms:${target.nodeKey}:${target.verb}:${subject.person}:${subject.gender}:${negative?"negative":"affirmative"}`;
   const form=conjugate(target.verb,target.tense as Tense,subject.person,{gender:subject.gender});
   const answer=negative?`${/^[aeiouyàâéèêëîïôùûüœ]/i.test(form)?"n’":"ne "}${form} pas`:form;
   const compound=["passe_compose","plus_que_parfait"].includes(target.tense);
   const agreementHint=compound&&["1s","2s","1p","2p"].includes(subject.person)?` Le sujet désigne ${subject.person.endsWith("p")?"plusieurs garçons":"un garçon"}.`:"";
   const instructions=imperative?"Écris la consigne sans pronom sujet. N’ajoute pas d’autres mots.":`Écris seulement le verbe ou le groupe verbal, sans le sujet.${agreementHint}`;
   const prompt=imperative?`Écris « ${target.verb} » à l’impératif présent ${negative?"négatif (ne… pas)":"affirmatif"}, à la ${subject.person==="2s"?"2e personne du singulier":subject.person==="1p"?"1re personne du pluriel":"2e personne du pluriel"}.`:
    `Sujet : « ${subject.subject} ». Verbe : « ${target.verb} ». Temps demandé : ${LABELS[target.tense]}. Quelle forme faut-il écrire ?`;
   const raw:GeneratedItem={nodeKey:node.key,strand:"conjugaison",modality:"writing",learnerMode:"shared",responseType:"short_answer",promptFr:prompt,instructionsFr:instructions,correctAnswer:answer,
    acceptableAnswers:negative&&answer.includes("’")?[answer.replaceAll("’","'")]:[],validatorType:negative?"exact":"conjugator",validatorConfig:{verb:target.verb,tense:target.tense,person:subject.person,gender:subject.gender,
     materialExposure:{words:[{lemma:target.verb,form:target.verb}],assessed:{words:[target.verb]}}},difficulty:50};
   const surface=`${node.key}:${diagnosticItemSurfaceIdentity(raw)}`;
   if(surfaces.has(surface)){skipped.push({key,reason:"Existing student-facing surface"});continue;}surfaces.add(surface);
   const checked=await runGates(raw,context);
   if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Conjugation draft rejected: ${key}`);
   const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"conjugation",promptFamily:negative?"negative-command":"controlled-form",difficultyTier:"core",
    reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
   questionMaterialKeys(entry.item);
   items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),facetKey:target.facetKey,contextKey:`verb:${target.verb}`,evidenceFeatures:conjugationEvidenceFeatures(node.key,raw.validatorConfig??{})});
  }
 }
 // Both independent pools need several actual -geons/-çons demonstrations.
 // More unchanged endings or gender variants cannot fill that feature gap.
 const sentenceCases=[
  ...PRESENT_SPELLING_CONTEXTS.map(([verb,sentence],index)=>({verb,sentence,person:"1p" as Person,key:`v3-granular-forms:present-spelling-context:${verb}:${index}`})),
  ...PRESENT_APPLICATION_CONTEXTS.map(([verb,person,sentence],index)=>({verb,person,sentence,key:`v3-granular-forms:present-application-context:${verb}:${person}:${index}`})),
 ];
 for(const {verb,person,sentence,key} of sentenceCases){
  const target=conjugationAuthoringCases().find(target=>target.tense==="present"&&target.verb===verb)!;
  const node=taxonomy.nodes.find(node=>node.key===target.nodeKey)!;
  const evidence=node.evidence.find(evidence=>evidence.expectation==="controlled_production"&&evidence.modality==="writing")!;
  const answer=conjugate(verb,"present",person);
  const completedSentence=sentence.replace("___",answer);
  // An individual-verb target necessarily revisits the same lemma. Identify
  // the sentence application separately, while retaining the lemma as exposure.
  // Include the completed correction so a taught answer cannot evade overlap
  // detection merely because the question itself contains a blank.
  const individualVerb=target.facetKey.includes("::verb:");
  const raw:GeneratedItem={nodeKey:node.key,strand:"conjugaison",modality:"writing",learnerMode:"shared",responseType:"short_answer",
   promptFr:`Complète la phrase avec ${verb} au présent de l’indicatif : ${sentence}`,
   instructionsFr:"Écris seulement le verbe manquant.",correctAnswer:answer,acceptableAnswers:[],validatorType:"conjugator",
   validatorConfig:{verb,tense:"present",person,gender:"m",...(individualVerb?{sentenceApplication:sentence}:{}),materialExposure:{words:[{lemma:verb,form:verb}],sentences:individualVerb?[sentence,completedSentence]:[sentence],...(individualVerb?{assessed:{sentences:[sentence,completedSentence]}}:{})}},difficulty:50};
  const surface=`${node.key}:${diagnosticItemSurfaceIdentity(raw)}`;
  if(surfaces.has(surface)){skipped.push({key,reason:"Existing student-facing surface"});continue;}surfaces.add(surface);
  const checked=await runGates(raw,context);
  if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Context draft rejected: ${key}`);
  const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,
   sectionKey:"conjugation",promptFamily:"sentence-form-application",difficultyTier:"core",reviewStatus:"needs_human_review",
   qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
  // Keep the conservative verb context grouping; a second sentence about one
  // verb must not manufacture a second verb context for pattern confirmation.
  items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),facetKey:target.facetKey,contextKey:`verb:${verb}`,
   evidenceFeatures:conjugationEvidenceFeatures(node.key,raw.validatorConfig??{})});
 }
 return {items,annotations,skipped};
}
