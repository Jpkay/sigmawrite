import { sanitizeStudentTopic } from "@/lib/safety/topic";

export type ConceptRisk = "low" | "medium" | "high";
export type ContentConcept = { key:string; labelFr:string; descriptionFr:string; domain:string; aliases:string[]; prerequisiteKeys:string[]; typicalFamiliarity:number; risk:ConceptRisk; sourceRequirement:"none"|"trusted_evergreen"|"current_primary_sources"; interestKeys:string[] };

export const CONTENT_CONCEPTS: ContentConcept[] = [
  {key:"migration_humaine",labelFr:"Migration humaine",descriptionFr:"Déplacement durable ou temporaire de personnes entre lieux.",domain:"geography",aliases:["migration","migrer","diaspora","immigration","émigration"],prerequisiteKeys:["lieu_et_territoire"],typicalFamiliarity:.45,risk:"medium",sourceRequirement:"trusted_evergreen",interestKeys:["football","travel","history"]},
  {key:"lieu_et_territoire",labelFr:"Lieu et territoire",descriptionFr:"Espace géographique nommé, habité, organisé ou parcouru.",domain:"geography",aliases:["lieu","territoire","région","pays","ville"],prerequisiteKeys:[],typicalFamiliarity:.75,risk:"low",sourceRequirement:"none",interestKeys:["travel","environment","football"]},
  {key:"attention_numerique",labelFr:"Attention numérique",descriptionFr:"Mécanismes par lesquels une interface sollicite et retient l'attention.",domain:"media_literacy",aliases:["réseaux sociaux","notification","écran","algorithme","attention"],prerequisiteKeys:["information_et_source"],typicalFamiliarity:.6,risk:"low",sourceRequirement:"none",interestKeys:["social_media","gaming","technology"]},
  {key:"information_et_source",labelFr:"Information et source",descriptionFr:"Distinction entre une affirmation, son origine et les éléments qui la soutiennent.",domain:"media_literacy",aliases:["information","source","preuve","média","article"],prerequisiteKeys:[],typicalFamiliarity:.55,risk:"low",sourceRequirement:"none",interestKeys:["social_media","politics","technology"]},
  {key:"cycle_eau",labelFr:"Cycle de l'eau",descriptionFr:"Circulation de l'eau entre atmosphère, sols, cours d'eau et océans.",domain:"science",aliases:["cycle de l'eau","pluie","évaporation","rivière"],prerequisiteKeys:["changement_et_cycle"],typicalFamiliarity:.6,risk:"low",sourceRequirement:"trusted_evergreen",interestKeys:["environment","science","travel"]},
  {key:"changement_et_cycle",labelFr:"Changement et cycle",descriptionFr:"Transformation répétée dont certaines étapes ramènent à un état comparable.",domain:"science",aliases:["cycle","transformation","changement","étape"],prerequisiteKeys:[],typicalFamiliarity:.65,risk:"low",sourceRequirement:"none",interestKeys:["environment","science"]},
  {key:"ecosysteme",labelFr:"Écosystème",descriptionFr:"Ensemble d'êtres vivants et de conditions physiques en interaction.",domain:"biology",aliases:["écosystème","biodiversité","habitat","espèce","nature"],prerequisiteKeys:["interaction_cause_effet"],typicalFamiliarity:.5,risk:"low",sourceRequirement:"trusted_evergreen",interestKeys:["animals","environment"]},
  {key:"interaction_cause_effet",labelFr:"Interaction et causalité",descriptionFr:"Relation limitée par laquelle un facteur contribue à un changement observable.",domain:"science",aliases:["cause","effet","conséquence","interaction"],prerequisiteKeys:[],typicalFamiliarity:.6,risk:"low",sourceRequirement:"none",interestKeys:["science","psychology"]},
  {key:"budget_personnel",labelFr:"Budget personnel",descriptionFr:"Organisation de ressources limitées entre dépenses, épargne et priorités.",domain:"economics",aliases:["budget","argent","épargne","dépense","prix"],prerequisiteKeys:[],typicalFamiliarity:.45,risk:"medium",sourceRequirement:"trusted_evergreen",interestKeys:["money","business"]},
  {key:"sante_prevention",labelFr:"Santé et prévention",descriptionFr:"Mesures générales visant à réduire un risque pour la santé sans diagnostic individuel.",domain:"health",aliases:["santé","médecine","maladie","prévention","traitement"],prerequisiteKeys:["information_et_source"],typicalFamiliarity:.45,risk:"high",sourceRequirement:"current_primary_sources",interestKeys:["medicine","health"]},
  {key:"election_democratique",labelFr:"Élection démocratique",descriptionFr:"Processus institutionnel par lequel des électeurs choisissent des représentants ou une option.",domain:"society",aliases:["élection","vote","président","parlement","démocratie"],prerequisiteKeys:["institution_publique"],typicalFamiliarity:.45,risk:"high",sourceRequirement:"current_primary_sources",interestKeys:["politics","history"]},
  {key:"institution_publique",labelFr:"Institution publique",descriptionFr:"Organisation établie par des règles publiques pour exercer une fonction collective.",domain:"society",aliases:["institution","gouvernement","administration","loi"],prerequisiteKeys:[],typicalFamiliarity:.5,risk:"medium",sourceRequirement:"trusted_evergreen",interestKeys:["politics","history","law_ethics"]},
];

export type TopicConceptResolution={safeTopic:string;conceptKeys:string[];conceptsToExplain:string[];risk:ConceptRisk;sourceRequirement:ContentConcept["sourceRequirement"]};
const riskRank:Record<ConceptRisk,number>={low:1,medium:2,high:3};
const sourceRank:Record<ContentConcept["sourceRequirement"],number>={none:1,trusted_evergreen:2,current_primary_sources:3};

export function resolveTopicConcepts(topic:string,familiarity:Record<string,number>={}):TopicConceptResolution{
  const sanitized=sanitizeStudentTopic(topic); if(!sanitized.allowed)throw new Error(`unsafe_topic:${sanitized.reason}`);
  const normalized=sanitized.value.toLocaleLowerCase("fr");
  const matched=CONTENT_CONCEPTS.filter(c=>c.aliases.some(a=>normalized.includes(a)));
  const conceptsToExplain=matched.filter(c=>(familiarity[c.key]??c.typicalFamiliarity)<.7).map(c=>c.key);
  const risk=matched.reduce<ConceptRisk>((v,c)=>riskRank[c.risk]>riskRank[v]?c.risk:v,"low");
  const sourceRequirement=matched.reduce<ContentConcept["sourceRequirement"]>((v,c)=>sourceRank[c.sourceRequirement]>sourceRank[v]?c.sourceRequirement:v,"none");
  return{safeTopic:sanitized.value,conceptKeys:matched.map(c=>c.key),conceptsToExplain,risk,sourceRequirement};
}

export function conceptPrerequisiteClosure(keys:string[]):string[]{const byKey=new Map(CONTENT_CONCEPTS.map(c=>[c.key,c]));const found=new Set<string>();const visit=(key:string)=>{for(const prerequisite of byKey.get(key)?.prerequisiteKeys??[]){if(found.has(prerequisite))continue;found.add(prerequisite);visit(prerequisite);}};keys.forEach(visit);return[...found].sort();}

