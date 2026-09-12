import {VERB_FAMILY_RECOGNITION_FACETS} from './verb-family-recognition-facets';
import {PRESENT_SPELLING_TRANSFER} from "./present-spelling-transfer";
import type {TaxonomyCandidate} from "@/lib/taxonomy/validate";
import type {FeatureRequirement} from "./engine";
/** Facets refine an approved competency; they never replace its identity or inherit mastery. */
export type AssessmentFacet={key:string;nodeKey:string;labelFr:string;dimension:string;value:string};
const SPELLING_FEATURE="spelling-adjustment";
export function patternFeatureRequirements(facet:AssessmentFacet):FeatureRequirement[]{
 if(facet.nodeKey==="choisir_auxiliaire_compose"&&facet.dimension==="construction"&&facet.value==="transitivity")return ["direct-object-avoir","no-direct-object-etre"].map(feature=>({feature,minimumItems:2,minimumContexts:2}));
 return facet.dimension==="pattern"&&["spelling_ger","spelling_cer"].includes(facet.value)&&["produire_present_indicatif","produire_imparfait","produire_passe_simple","produire_imperatif"].includes(facet.nodeKey)
  ?[{feature:SPELLING_FEATURE,minimumItems:3,minimumContexts:2}]:[];
}
export function conjugationEvidenceFeatures(nodeKey:string,config:Record<string,unknown>):string[]{
 const facet=conjugationFacet(nodeKey,config);
 if(!facet||![/::pattern:spelling_ger$/,/::pattern:spelling_cer$/].some(pattern=>pattern.test(facet)))return [];
 const person=String(config.person),tense=String(config.tense);
 const distinguishing=(tense==="present"||tense==="imperatif_present")?person==="1p"
  :tense==="imparfait"?["1s","2s","3s","3p"].includes(person)
  :tense==="passe_simple"?["1s","2s","3s","1p","2p"].includes(person):false;
 return distinguishing?[SPELLING_FEATURE]:[];
}
const VERBS=["être","avoir","aller","faire","prendre","venir","partir","sortir","dire","voir","pouvoir","vouloir","savoir","devoir"] as const;
const TENSE_NODES:Record<string,string>={present:"produire_present_indicatif",imparfait:"produire_imparfait",futur_proche:"produire_futur_proche",passe_recent:"produire_passe_recent",passe_compose:"produire_passe_compose",futur_simple:"produire_futur_simple",plus_que_parfait:"produire_plus_que_parfait",conditionnel_present:"produire_conditionnel_present",subjonctif_present:"produire_subjonctif_present_frequent",imperatif_present:"produire_imperatif",passe_simple:"produire_passe_simple"};
const PATTERN_VERBS:Record<string,readonly string[]>={regular_er:["parler","aimer","donner","jouer","regarder","chanter","travailler"],regular_ir:["finir","choisir","réussir","grandir"],spelling_ger:["manger","nager","voyager"],spelling_cer:["commencer","lancer","avancer"]};
const PATTERN_LABELS:Record<string,string>={regular_er:"Verbes réguliers en -er",regular_ir:"Verbes en -ir comme finir",spelling_ger:"Verbes en -ger",spelling_cer:"Verbes en -cer"};
/** The authoring inventory is derived from the same versioned facet definitions. */
export function conjugationAuthoringCases(){
 return Object.entries(TENSE_NODES).flatMap(([tense,nodeKey])=>[
  ...VERBS.filter(verb=>!(tense==="imperatif_present"&&verb==="pouvoir")).map(verb=>({tense,nodeKey,verb,facetKey:`${nodeKey}::verb:${verb}`})),
  ...Object.entries(PATTERN_VERBS).flatMap(([pattern,verbs])=>verbs.map(verb=>({tense,nodeKey,verb,facetKey:`${nodeKey}::pattern:${pattern}`}))),
 ]);
}
const SPLITS:Record<string,readonly [string,string][]>={
 produire_pronom_cod:[["le","le"],["la","la"],["les","les"],["elision","l’ devant une voyelle"]],
 produire_pronom_coi_personne:[["lui","lui : une personne"],["leur","leur : plusieurs personnes"]],
 produire_pronoms_y_en:[["y_place","y : un lieu"],["y_thing","y : à + une chose"],["en_origin","en : une origine"],["en_quantity","en : une quantité"],["en_thing","en : de + une chose"]],
 placer_pronom_complement:[["finite","Avant le verbe conjugué"],["infinitive","Avant l’infinitif"],["negative","Dans une phrase négative"],["imperative","À l’impératif affirmatif"]],
 ordonner_doubles_pronoms:[["declarative","Dans une phrase déclarative"],["negative","Dans une phrase négative"],["imperative","À l’impératif affirmatif"]],
 construction_accord_sujet_verbe:[["adjacent","Sujet proche du verbe"],["separated","Sujet éloigné du verbe"],["inverted","Sujet placé après le verbe"],["coordinated","Plusieurs sujets coordonnés"]],
 accorder_sujet_verbe_ecrit:[["adjacent","Sujet proche du verbe"],["separated","Sujet éloigné du verbe"],["inverted","Sujet placé après le verbe"],["coordinated","Plusieurs sujets coordonnés"]],
 choisir_auxiliaire_compose:[["avoir","Choisir avoir"],["etre","Choisir être"],["transitivity","Verbe changeant d’auxiliaire selon son emploi"],["pronominal","Verbe pronominal"]],
 former_participe_passe:[["er","Participes en -é"],["ir","Participes en -i"],["irregular","Participes irréguliers"]],
 accorder_participe_etre:[["feminine","Accord au féminin"],["plural","Accord au pluriel"],["both","Accord en genre et en nombre"]],
 accorder_participe_avoir_cod:[["preceding","COD placé avant"],["following","COD placé après"],["absent","Absence de COD"]],
 accorder_participe_cod_antepose:[["pronoun","COD repris par un pronom"],["relative","COD repris par que"]],
 former_pluriel_noms_al_aux:[["regular","Transformation -al → -aux"],["exceptions","Exceptions en -als"]],
 former_pluriel_noms_au_eu:[["au","Noms en -au"],["eu","Noms en -eu"],["exceptions","Exceptions en -s"]],
 choisir_e_accent_aigu_grave:[["acute","Choisir é"],["grave","Choisir è"],["none","Choisir e sans accent"]],
 orthographier_g_ge_gu:[["soft","Maintenir le son doux avec ge"],["hard","Maintenir le son dur avec gu"]],
};
export function buildV3Facets(taxonomy:TaxonomyCandidate,options:{verbFamilyRecognition?:boolean}={}):AssessmentFacet[]{
 const nodes=new Map(taxonomy.nodes.map(n=>[n.key,n]));const facets:AssessmentFacet[]=[];
 const add=(nodeKey:string,dimension:string,value:string,labelFr:string)=>{
  if(!nodes.has(nodeKey))throw Error(`Facet parent absent from approved graph: ${nodeKey}`);
  facets.push({key:`${nodeKey}::${dimension}:${value}`,nodeKey,dimension,value,labelFr});
 };
 for(const [tense,nodeKey] of Object.entries(TENSE_NODES)){
  for(const verb of VERBS){
   // Pouvoir has no ordinary imperative paradigm to assess.
   if(tense==="imperatif_present"&&verb==="pouvoir")continue;
   add(nodeKey,"verb",verb,`Conjuguer ${verb}`);
  }
  for(const [pattern,label] of Object.entries(PATTERN_LABELS))add(nodeKey,"pattern",pattern,label);
 }
 for(const [node,values] of Object.entries(SPLITS))for(const [value,label] of values)add(node,"construction",value,label);
 // Reading operations are already separate v3 nodes. Text genre is an additional
 // transfer distinction; an inference in a story does not certify an explanatory text.
 const genreForPrefix:Record<string,string>={literary:"narrative",informational:"informational",argumentative:"argumentative"};
 for(const node of taxonomy.nodes.filter(n=>n.strand==="comprehension_ecrite"))for(const [genre,label] of [["narrative","Récit bref"],["informational","Texte informatif bref"],["argumentative","Texte argumentatif bref"]] as const){
  // Respect explicit genre constraints in the approved node's meaning. Generic
  // operations may transfer across genres but need independent evidence in each.
  const declared=node.evidence.map(e=>e.key.split("-")[0]);
  if(declared.some(prefix=>prefix!=="all"&&!genreForPrefix[prefix]))throw Error(`Unknown approved reading scope: ${node.key}`);
  if(!declared.includes("all")&&!declared.some(prefix=>genreForPrefix[prefix]===genre))continue;
  add(node.key,"text_type",genre,label);
 }
 if(options.verbFamilyRecognition)for(const facet of VERB_FAMILY_RECOGNITION_FACETS)add(facet.nodeKey,facet.dimension,facet.value,facet.labelFr);
 return facets;
}
/** Only structured conjugator metadata can support automatic facet assignment. */
export function conjugationFacet(nodeKey:string,config:Record<string,unknown>):string|null{
 const verb=String(config.verb??"").toLocaleLowerCase("fr");
 if(TENSE_NODES[String(config.tense)]!==nodeKey)return null;
 if((VERBS as readonly string[]).includes(verb))return String(config.tense)==="imperatif_present"&&verb==="pouvoir"?null:`${nodeKey}::verb:${verb}`;
 // Extra authored transfer contexts refine existing present-tense facets only.
 // They do not generate or approve forms at other tenses.
 const pattern=Object.entries(PATTERN_VERBS).find(([,verbs])=>verbs.includes(verb))?.[0]
  ??(config.tense==="present"?PRESENT_SPELLING_TRANSFER.find(row=>row.verb===verb)?.family:undefined);
 return pattern?`${nodeKey}::pattern:${pattern}`:null;
}

/** Computed agreement questions expose the grammatical feature being elicited.
 * No absence/position claim is inferred from missing metadata.
 */
export function participleAgreementFacet(nodeKey:string,config:Record<string,unknown>):string|null{
 if(config.tense!=="passe_compose")return null;
 if(nodeKey==="accorder_participe_etre"){
  if(!["aller","venir","partir","sortir"].includes(String(config.verb)))return null;
  if(!["1s","2s","3s","1p","2p","3p"].includes(String(config.person)))return null;
  if(config.gender!=="f"&&config.gender!=="m")return null;
  const feminine=config.gender==="f",plural=String(config.person).endsWith("p");
  const feature=feminine&&plural?"both":feminine?"feminine":plural?"plural":null;
  return feature?`${nodeKey}::construction:${feature}`:null;
 }
 if(nodeKey==="accorder_participe_avoir_cod"){
  // These audited transitive verbs use avoir and have a visible regular agreement.
  if(!["manger","écouter","finir"].includes(String(config.verb)))return null;
  const cod=config.codBefore as {gender?:unknown;number?:unknown}|undefined;
  if(!cod||!["m","f"].includes(String(cod.gender))||!["s","p"].includes(String(cod.number)))return null;
  // Masculine singular has no visible agreement contrast.
  return cod.gender==="f"||cod.number==="p"?`${nodeKey}::construction:preceding`:null;
 }
 return null;
}
