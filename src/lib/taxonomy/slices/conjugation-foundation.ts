import type { TaxonomyCandidate } from "../validate";

type Expectation = "receptive" | "controlled_production" | "independent_production";
type Modality = "reading" | "writing";

const sourceKey = "sigma-original-taxonomy";

const levels: Record<string, { native: string; fsl: string }> = {
  foundation: { native: "6", fsl: "A1" },
  present: { native: "6", fsl: "A1" },
  near_future: { native: "6", fsl: "A1" },
  recent_past: { native: "6", fsl: "A1" },
  composed_past: { native: "6", fsl: "A2" },
  imperfect: { native: "6", fsl: "A2" },
  contrast: { native: "5", fsl: "B1" },
  simple_past: { native: "6", fsl: "B1" },
  future: { native: "6", fsl: "A2" },
  pluperfect: { native: "5", fsl: "B1" },
  conditional: { native: "5", fsl: "A2" },
  subjunctive: { native: "4", fsl: "B1" },
  imperative: { native: "6", fsl: "A1" },
  nonfinite: { native: "6", fsl: "A1" },
  sequencing: { native: "4", fsl: "B2" },
};

function node(
  key: string,
  labelFr: string,
  descriptionFr: string,
  family: keyof typeof levels,
  expectation: Expectation,
  modality: Modality,
  atomicityLevel = 4,
): TaxonomyCandidate["nodes"][number] {
  const nativeFramework = levels[family].native;
  const fslFramework = levels[family].fsl;
  return {
    key,
    strand: "conjugaison",
    nodeType: "linguistic",
    labelFr,
    descriptionFr,
    atomicityLevel,
    evidence: [{
      key: `${modality}-${expectation.replaceAll("_", "-")}`,
      actionFr: expectation === "receptive"
        ? `Identifier ou interpréter correctement : ${labelFr.toLocaleLowerCase("fr")}.`
        : `Produire correctement dans des exemples nouveaux : ${labelFr.toLocaleLowerCase("fr")}.`,
      modality,
      expectation,
      successCriteria: {
        minimumAccuracy: expectation === "independent_production" ? 0.75 : 0.8,
        minimumDistinctItems: 3,
        minimumOccasions: 2,
        unaidedTransferRequired: expectation === "independent_production",
      },
    }],
    sourceKeys: [sourceKey],
    mappings: [
      {
        learnerMode: "french_first_language",
        framework: "native_grade",
        levelMin: nativeFramework,
        levelMax: nativeFramework,
        status: "provisional",
        sourceKey,
      },
      {
        learnerMode: "french_second_language",
        framework: "cefr",
        levelMin: fslFramework,
        levelMax: fslFramework,
        status: "provisional",
        sourceKey,
      },
    ],
  };
}

export const CONJUGATION_FOUNDATION_NODES: TaxonomyCandidate["nodes"] = [
  node("identifier_sujet_verbe", "Identifier le sujet du verbe", "Repérer le donneur de personne et de nombre d'un verbe conjugué.", "foundation", "receptive", "reading"),
  node("distinguer_personne_nombre", "Identifier les traits de personne-nombre", "Associer un sujet grammatical à une personne et à un nombre précis.", "foundation", "receptive", "reading"),
  node("reconnaitre_radical_terminaison", "Segmenter une forme verbale", "Segmenter une forme verbale simple en radical et terminaison observable.", "foundation", "receptive", "reading"),
  node("classer_famille_verbale", "Classer une famille verbale", "Reconnaître les régularités utiles des verbes en -er, en -ir et des verbes irréguliers fréquents.", "foundation", "receptive", "reading"),
  node("reconnaitre_auxiliaire", "Reconnaître un auxiliaire", "Identifier avoir ou être comme auxiliaire dans une forme composée.", "foundation", "receptive", "reading"),
  node("choisir_auxiliaire_compose", "Choisir l'auxiliaire d'un temps composé", "Sélectionner avoir ou être pour produire une forme composée courante.", "composed_past", "controlled_production", "writing"),
  node("former_participe_passe", "Former un participe passé", "Produire le participe passé régulier ou irrégulier d'un verbe fréquent.", "composed_past", "controlled_production", "writing"),
  node("accorder_participe_etre", "Accorder le participe passé avec être", "Réaliser l'accord du participe passé avec le sujet après l'auxiliaire être.", "composed_past", "controlled_production", "writing"),
  node("accorder_participe_avoir_cod", "Accorder le participe passé avec un COD antéposé", "Réaliser l'accord avec le complément direct placé avant une forme construite avec avoir.", "contrast", "controlled_production", "writing", 5),
  node("interpreter_marqueur_temporel", "Interpréter un marqueur temporel", "Relier un marqueur de temps à l'ordre ou au repérage des événements.", "foundation", "receptive", "reading"),

  node("reconnaitre_present_indicatif", "Reconnaître le présent de l'indicatif", "Identifier une forme au présent dans une phrase écrite sans en inférer automatiquement l'usage.", "present", "receptive", "reading"),
  node("produire_present_indicatif", "Produire le présent de l'indicatif", "Conjuguer des verbes fréquents au présent avec un sujet explicite.", "present", "controlled_production", "writing"),
  node("interpreter_usages_present", "Interpréter les usages du présent", "Distinguer notamment présent d'énonciation, habitude et vérité générale en contexte.", "present", "receptive", "reading"),

  node("reconnaitre_futur_proche", "Reconnaître le futur proche", "Identifier la périphrase aller au présent suivie d'un infinitif.", "near_future", "receptive", "reading"),
  node("produire_futur_proche", "Produire le futur proche", "Former une projection proche ou planifiée avec aller et l'infinitif.", "near_future", "controlled_production", "writing"),
  node("interpreter_futur_proche", "Interpréter la valeur du futur proche", "Relier la périphrase à une intention, une prévision ou un événement imminent selon le contexte.", "near_future", "receptive", "reading"),

  node("reconnaitre_passe_recent", "Reconnaître le passé récent", "Identifier la périphrase venir de suivie d'un infinitif.", "recent_past", "receptive", "reading"),
  node("produire_passe_recent", "Produire le passé récent", "Former une action tout juste accomplie avec venir de et l'infinitif.", "recent_past", "controlled_production", "writing"),
  node("interpreter_passe_recent", "Interpréter la valeur du passé récent", "Relier la périphrase à un événement proche du moment de repère.", "recent_past", "receptive", "reading"),

  node("reconnaitre_passe_compose", "Reconnaître le passé composé", "Identifier auxiliaire et participe comme une forme verbale composée.", "composed_past", "receptive", "reading"),
  node("produire_passe_compose", "Produire le passé composé", "Former le passé composé de verbes fréquents avec le sujet fourni.", "composed_past", "controlled_production", "writing"),
  node("interpreter_passe_compose", "Interpréter la valeur du passé composé", "Repérer un événement borné ou accompli dans un contexte narratif courant.", "composed_past", "receptive", "reading"),

  node("reconnaitre_imparfait", "Reconnaître l'imparfait", "Identifier une forme à l'imparfait dans une phrase ou un passage.", "imperfect", "receptive", "reading"),
  node("produire_imparfait", "Produire l'imparfait", "Former l'imparfait de verbes fréquents à partir d'un sujet fourni.", "imperfect", "controlled_production", "writing"),
  node("interpreter_imparfait", "Interpréter les valeurs de l'imparfait", "Repérer notamment arrière-plan, description, habitude ou action en cours selon le contexte.", "imperfect", "receptive", "reading"),
  node("contraster_pc_imparfait", "Contraster les temps du récit", "Choisir ou expliquer le passé composé ou l'imparfait qui organise événement et arrière-plan dans un récit.", "contrast", "receptive", "reading", 5),
  node("produire_contraste_pc_imparfait", "Produire le contraste passé composé-imparfait", "Organiser événements et arrière-plan avec les deux temps dans un paragraphe nouveau.", "contrast", "independent_production", "writing", 5),

  node("reconnaitre_passe_simple", "Reconnaître le passé simple", "Identifier les formes littéraires fréquentes du passé simple en lecture.", "simple_past", "receptive", "reading"),
  node("interpreter_passe_simple", "Interpréter la valeur narrative du passé simple", "Relier le passé simple à l'avancée des événements dans un récit littéraire.", "simple_past", "receptive", "reading"),

  node("reconnaitre_futur_simple", "Reconnaître le futur simple", "Identifier une forme du futur simple et son sujet.", "future", "receptive", "reading"),
  node("produire_futur_simple", "Produire le futur simple", "Former le futur simple de verbes fréquents avec un sujet fourni.", "future", "controlled_production", "writing"),
  node("interpreter_futur_simple", "Interpréter les valeurs du futur simple", "Relier la forme à une projection, prévision ou promesse selon le contexte.", "future", "receptive", "reading"),

  node("reconnaitre_plus_que_parfait", "Reconnaître le plus-que-parfait", "Identifier l'auxiliaire à l'imparfait suivi d'un participe passé.", "pluperfect", "receptive", "reading"),
  node("produire_plus_que_parfait", "Produire le plus-que-parfait", "Former le plus-que-parfait d'un verbe fréquent avec un sujet fourni.", "pluperfect", "controlled_production", "writing"),
  node("interpreter_anteriorite_passee", "Interpréter l'antériorité passée", "Situer un événement antérieur à un autre repère déjà passé.", "pluperfect", "receptive", "reading"),

  node("reconnaitre_conditionnel_present", "Reconnaître le conditionnel présent", "Identifier une forme du conditionnel présent dans son contexte.", "conditional", "receptive", "reading"),
  node("produire_conditionnel_present", "Produire le conditionnel présent", "Former le conditionnel présent de verbes fréquents avec un sujet fourni.", "conditional", "controlled_production", "writing"),
  node("interpreter_conditionnel_present", "Interpréter les valeurs du conditionnel présent", "Distinguer hypothèse, atténuation et information non confirmée selon le contexte.", "conditional", "receptive", "reading"),

  node("reconnaitre_subjonctif_present", "Reconnaître le subjonctif présent", "Identifier une forme du subjonctif présent après un déclencheur fréquent.", "subjunctive", "receptive", "reading"),
  node("produire_subjonctif_present_frequent", "Produire un subjonctif présent fréquent", "Former un verbe fréquent au subjonctif dans une construction explicitement fournie.", "subjunctive", "controlled_production", "writing"),
  node("interpreter_declencheur_subjonctif", "Interpréter un déclencheur du subjonctif", "Relier une construction fréquente à la nécessité du mode sans généralisation abusive.", "subjunctive", "receptive", "reading"),

  node("reconnaitre_imperatif", "Reconnaître l'impératif", "Identifier une forme impérative et son destinataire implicite.", "imperative", "receptive", "reading"),
  node("produire_imperatif", "Produire l'impératif", "Former une consigne affirmative ou négative avec un verbe fréquent.", "imperative", "controlled_production", "writing"),
  node("interpreter_valeur_imperatif", "Interpréter la valeur de l'impératif", "Distinguer ordre, conseil, instruction et invitation selon le contexte.", "imperative", "receptive", "reading"),

  node("distinguer_infinitif_participe", "Distinguer infinitif/participe passé", "Identifier la fonction d'une forme non finie, notamment dans les finales en -er et -é.", "nonfinite", "receptive", "reading"),
  node("employer_forme_non_finie", "Employer une forme verbale non finie", "Choisir un infinitif ou un participe dans une construction contrôlée.", "nonfinite", "controlled_production", "writing"),
  node("interpreter_sequence_temporelle", "Interpréter une séquence temporelle", "Reconstruire l'ordre des événements à partir des temps et marqueurs d'un passage.", "sequencing", "receptive", "reading", 5),
  node("produire_sequence_temporelle", "Produire une séquence temporelle cohérente", "Maintenir des repères et relations temporelles cohérents dans un texte connecté.", "sequencing", "independent_production", "writing", 5),
];

const edge = (
  source: string,
  target: string,
  prerequisiteClass: "hard" | "soft" = "hard",
  rationale = "La compétence source fournit une opération nécessaire à la compétence cible.",
): TaxonomyCandidate["edges"][number] => ({ source, target, type: "prerequisite", prerequisiteClass, rationale, sourceKey });

export const CONJUGATION_FOUNDATION_EDGES: TaxonomyCandidate["edges"] = [
  edge("identifier_sujet_verbe", "distinguer_personne_nombre"),
  edge("distinguer_personne_nombre", "produire_present_indicatif"),
  edge("reconnaitre_radical_terminaison", "produire_present_indicatif"),
  edge("classer_famille_verbale", "produire_present_indicatif", "soft"),
  edge("produire_present_indicatif", "produire_futur_proche"),
  edge("produire_present_indicatif", "produire_passe_recent"),
  edge("reconnaitre_auxiliaire", "choisir_auxiliaire_compose"),
  edge("reconnaitre_auxiliaire", "reconnaitre_passe_compose"),
  edge("choisir_auxiliaire_compose", "produire_passe_compose"),
  edge("former_participe_passe", "produire_passe_compose"),
  edge("produire_present_indicatif", "produire_imparfait"),
  edge("reconnaitre_imparfait", "interpreter_imparfait"),
  edge("reconnaitre_passe_compose", "interpreter_passe_compose"),
  edge("interpreter_imparfait", "contraster_pc_imparfait"),
  edge("interpreter_passe_compose", "contraster_pc_imparfait"),
  edge("interpreter_marqueur_temporel", "contraster_pc_imparfait", "soft"),
  edge("produire_passe_compose", "produire_contraste_pc_imparfait"),
  edge("produire_imparfait", "produire_contraste_pc_imparfait"),
  edge("contraster_pc_imparfait", "produire_contraste_pc_imparfait"),
  edge("reconnaitre_passe_simple", "interpreter_passe_simple"),
  edge("reconnaitre_futur_simple", "interpreter_futur_simple"),
  edge("reconnaitre_auxiliaire", "reconnaitre_plus_que_parfait"),
  edge("produire_imparfait", "produire_plus_que_parfait"),
  edge("former_participe_passe", "produire_plus_que_parfait"),
  edge("reconnaitre_plus_que_parfait", "interpreter_anteriorite_passee"),
  edge("interpreter_marqueur_temporel", "interpreter_anteriorite_passee"),
  edge("reconnaitre_conditionnel_present", "interpreter_conditionnel_present"),
  edge("produire_futur_simple", "produire_conditionnel_present", "soft", "Les deux paradigmes partagent fréquemment un radical, sans relation de maîtrise obligatoire."),
  edge("reconnaitre_subjonctif_present", "interpreter_declencheur_subjonctif"),
  edge("interpreter_declencheur_subjonctif", "produire_subjonctif_present_frequent"),
  edge("reconnaitre_imperatif", "interpreter_valeur_imperatif"),
  edge("produire_present_indicatif", "produire_imperatif", "soft"),
  edge("distinguer_infinitif_participe", "employer_forme_non_finie"),
  edge("interpreter_passe_compose", "interpreter_sequence_temporelle"),
  edge("interpreter_imparfait", "interpreter_sequence_temporelle"),
  edge("interpreter_anteriorite_passee", "interpreter_sequence_temporelle"),
  edge("produire_contraste_pc_imparfait", "produire_sequence_temporelle"),
  edge("produire_plus_que_parfait", "produire_sequence_temporelle"),
  edge("interpreter_sequence_temporelle", "produire_sequence_temporelle"),
];

export const CONJUGATION_MISCONCEPTIONS = [
  { key: "tense_form_equals_use", labelFr: "Confondre forme et valeur", nodeKeys: ["reconnaitre_imparfait", "interpreter_imparfait"] },
  { key: "pc_always_recent", labelFr: "Réduire le passé composé à un passé récent", nodeKeys: ["interpreter_passe_compose", "reconnaitre_passe_recent"] },
  { key: "imparfait_always_long", labelFr: "Choisir l'imparfait selon la durée seule", nodeKeys: ["contraster_pc_imparfait"] },
  { key: "auxiliary_etre_all_motion", labelFr: "Employer être avec tout verbe de mouvement", nodeKeys: ["choisir_auxiliaire_compose"] },
  { key: "past_participle_agrees_subject", labelFr: "Toujours accorder le participe avec le sujet", nodeKeys: ["accorder_participe_avoir_cod", "accorder_participe_etre"] },
  { key: "conditionnel_future", labelFr: "Confondre conditionnel et futur", nodeKeys: ["reconnaitre_conditionnel_present", "reconnaitre_futur_simple"] },
  { key: "subjunctive_after_que", labelFr: "Employer le subjonctif après tout que", nodeKeys: ["interpreter_declencheur_subjonctif"] },
] as const;

export const CONJUGATION_ASSESSMENT_TEMPLATES = [
  { key: "tense-recognition", expectation: "receptive", responseType: "mcq", requiresNovelContext: true },
  { key: "controlled-form", expectation: "controlled_production", responseType: "cloze", requiresNovelContext: true },
  { key: "meaning-in-context", expectation: "receptive", responseType: "evidence_choice", requiresNovelContext: true },
  { key: "chronology-ordering", expectation: "receptive", responseType: "ordering", requiresNovelContext: true },
  { key: "connected-production", expectation: "independent_production", responseType: "written", requiresNovelContext: true },
] as const;

export const CONJUGATION_FOUNDATION_CANDIDATE: TaxonomyCandidate = {
  release: { key: "conjugation-foundation-v1", version: "0.1.0", ontologyVersion: "1.0.0" },
  sources: [{ key: sourceKey, version: "1.0.0", rightsStatus: "importable", checksum: "sha256:original-authoring-source" }],
  nodes: CONJUGATION_FOUNDATION_NODES,
  edges: CONJUGATION_FOUNDATION_EDGES,
};
