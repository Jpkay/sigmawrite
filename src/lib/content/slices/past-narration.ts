/**
 * Past-narration & agreement — the first production vertical slice (Roadmap
 * Phase 11). This is the human-anchored skeleton: ~30 atomic competencies across
 * grammaire / conjugaison / orthographe grammaticale / expression, wired by
 * prerequisite edges. It is the cross-strand proof of the whole thesis — the
 * accord-du-participe-passé node sits downstream of tense, agreement, AND COD
 * identification, so a single failure there is diagnosed to its true root.
 *
 * Authoring model: a human anchors this skeleton (nodes + edges); the LLM then
 * generates the item *volume* against it, machine-verified by Gate 0/2. The graph
 * is validated by Gate 1 (cycle-free, monotone) in past-narration.test.ts.
 *
 * Keys are stable; the seed script resolves them to uuids at insert time.
 */

import type { CefrLevel, EdgeType, Strand } from "@/lib/graph/types";

export type SeedNode = {
  key: string;
  strand: Strand;
  labelFr: string;
  descriptionFr: string;
  nativeGradeMin: number;
  nativeGradeMax: number;
  cefrMin: CefrLevel;
  cefrMax: CefrLevel;
  atomicityLevel: number;
  requiresWriting?: boolean;
  requiresListening?: boolean;
  requiresSpeaking?: boolean;
  requiresReading?: boolean;
};

export type SeedEdge = {
  source: string; // prerequisite key
  target: string; // dependent key
  edgeType: EdgeType;
  strength?: number;
};

export type SeedMisconception = {
  key: string;
  labelFr: string;
  descriptionFr: string;
  strand: Strand;
  primaryNodeKey: string;
  signature: Record<string, unknown>;
};

// ───────────────────────────────── Nodes ───────────────────────────────────

export const NODES: SeedNode[] = [
  // Grammaire / syntaxe — the structural foundations.
  { key: "classes_de_mots", strand: "grammaire_syntaxe", labelFr: "Les classes de mots", descriptionFr: "Distinguer nom, verbe, adjectif, déterminant.", nativeGradeMin: 6, nativeGradeMax: 7, cefrMin: "A1", cefrMax: "A2", atomicityLevel: 2 },
  { key: "groupe_nominal", strand: "grammaire_syntaxe", labelFr: "Le groupe nominal", descriptionFr: "Repérer le noyau du groupe nominal et ses expansions.", nativeGradeMin: 6, nativeGradeMax: 7, cefrMin: "A1", cefrMax: "A2", atomicityLevel: 3 },
  { key: "notion_verbe", strand: "grammaire_syntaxe", labelFr: "La notion de verbe", descriptionFr: "Identifier le verbe conjugué dans la phrase.", nativeGradeMin: 6, nativeGradeMax: 7, cefrMin: "A1", cefrMax: "A2", atomicityLevel: 3 },
  { key: "fonction_sujet", strand: "grammaire_syntaxe", labelFr: "La fonction sujet", descriptionFr: "Trouver le sujet du verbe (qui fait l'action ?).", nativeGradeMin: 6, nativeGradeMax: 7, cefrMin: "A1", cefrMax: "A2", atomicityLevel: 3 },
  { key: "cod_identification", strand: "grammaire_syntaxe", labelFr: "Le complément d'objet direct (COD)", descriptionFr: "Identifier le COD (le verbe + quoi ? qui ?).", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 4 },
  { key: "coi_identification", strand: "grammaire_syntaxe", labelFr: "Le complément d'objet indirect (COI)", descriptionFr: "Identifier le COI (verbe + à/de qui ? à/de quoi ?).", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "B1", cefrMax: "B1", atomicityLevel: 4 },
  { key: "cod_coi_distinction", strand: "grammaire_syntaxe", labelFr: "Distinguer COD et COI", descriptionFr: "Choisir entre COD et COI selon la construction du verbe.", nativeGradeMin: 8, nativeGradeMax: 9, cefrMin: "B1", cefrMax: "B1", atomicityLevel: 4 },
  { key: "pronom_personnel_cod", strand: "grammaire_syntaxe", labelFr: "Les pronoms COD (le, la, les)", descriptionFr: "Remplacer un COD par le pronom qui convient.", nativeGradeMin: 8, nativeGradeMax: 9, cefrMin: "B1", cefrMax: "B1", atomicityLevel: 4 },
  { key: "pronom_relatif_que", strand: "grammaire_syntaxe", labelFr: "Le pronom relatif « que »", descriptionFr: "« que » reprend un nom et occupe la fonction COD.", nativeGradeMin: 8, nativeGradeMax: 9, cefrMin: "B1", cefrMax: "B2", atomicityLevel: 4 },

  // Conjugaison — the verbal morphology spine.
  { key: "radical_terminaison", strand: "conjugaison", labelFr: "Radical et terminaison", descriptionFr: "Découper un verbe en radical + terminaison.", nativeGradeMin: 6, nativeGradeMax: 7, cefrMin: "A1", cefrMax: "A2", atomicityLevel: 3 },
  { key: "groupes_verbes", strand: "conjugaison", labelFr: "Les groupes de verbes", descriptionFr: "Classer un verbe (1er, 2e, 3e groupe).", nativeGradeMin: 6, nativeGradeMax: 7, cefrMin: "A1", cefrMax: "A2", atomicityLevel: 3 },
  { key: "present_indicatif", strand: "conjugaison", labelFr: "Le présent de l'indicatif", descriptionFr: "Conjuguer au présent (base des autres temps).", nativeGradeMin: 6, nativeGradeMax: 7, cefrMin: "A1", cefrMax: "A2", atomicityLevel: 3 },
  { key: "imparfait_formation", strand: "conjugaison", labelFr: "L'imparfait", descriptionFr: "Former l'imparfait à partir du radical du « nous » au présent.", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 3 },
  { key: "participe_passe_formation", strand: "conjugaison", labelFr: "Le participe passé", descriptionFr: "Former le participe passé (é, i, irréguliers).", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 3 },
  { key: "auxiliaire_choix", strand: "conjugaison", labelFr: "Choisir l'auxiliaire (avoir / être)", descriptionFr: "Décider entre avoir et être au passé composé.", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 4 },
  { key: "passe_compose_avoir", strand: "conjugaison", labelFr: "Le passé composé avec « avoir »", descriptionFr: "Conjuguer au passé composé avec l'auxiliaire avoir.", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 4 },
  { key: "passe_compose_etre", strand: "conjugaison", labelFr: "Le passé composé avec « être »", descriptionFr: "Conjuguer au passé composé avec l'auxiliaire être.", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 4 },
  { key: "pc_vs_imparfait", strand: "conjugaison", labelFr: "Passé composé vs imparfait", descriptionFr: "Choisir le temps selon l'aspect (action vs arrière-plan).", nativeGradeMin: 8, nativeGradeMax: 9, cefrMin: "B1", cefrMax: "B2", atomicityLevel: 5 },
  { key: "plus_que_parfait", strand: "conjugaison", labelFr: "Le plus-que-parfait", descriptionFr: "Exprimer l'antériorité dans le récit au passé.", nativeGradeMin: 8, nativeGradeMax: 10, cefrMin: "B1", cefrMax: "B2", atomicityLevel: 4 },
  { key: "concordance_temps_recit", strand: "conjugaison", labelFr: "La concordance des temps au passé", descriptionFr: "Articuler PC, imparfait et plus-que-parfait dans un récit.", nativeGradeMin: 9, nativeGradeMax: 11, cefrMin: "B2", cefrMax: "B2", atomicityLevel: 5 },

  // Orthographe grammaticale — spelling driven by grammar.
  { key: "accord_genre_nombre", strand: "orthographe_grammaticale", labelFr: "L'accord en genre et en nombre", descriptionFr: "Accorder déterminant, nom, adjectif dans le groupe nominal.", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 3 },
  { key: "accord_sujet_verbe", strand: "orthographe_grammaticale", labelFr: "L'accord sujet-verbe", descriptionFr: "Accorder le verbe avec son sujet.", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 3 },
  { key: "accord_pp_etre", strand: "orthographe_grammaticale", labelFr: "Accord du participe passé avec « être »", descriptionFr: "Accorder le participe passé avec le sujet (auxiliaire être).", nativeGradeMin: 8, nativeGradeMax: 9, cefrMin: "B1", cefrMax: "B1", atomicityLevel: 5 },
  { key: "accord_pp_avoir_cod", strand: "orthographe_grammaticale", labelFr: "Accord du participe passé avec « avoir »", descriptionFr: "Accorder le participe passé avec le COD placé avant l'auxiliaire avoir.", nativeGradeMin: 9, nativeGradeMax: 11, cefrMin: "B2", cefrMax: "B2", atomicityLevel: 5 },
  { key: "terminaison_er_e_ez", strand: "orthographe_grammaticale", labelFr: "Les terminaisons -er / -é / -ez", descriptionFr: "Distinguer infinitif, participe passé et 2e personne du pluriel.", nativeGradeMin: 8, nativeGradeMax: 9, cefrMin: "B1", cefrMax: "B1", atomicityLevel: 4 },
  { key: "homophone_a_a", strand: "orthographe_grammaticale", labelFr: "Homophones a / à", descriptionFr: "Distinguer « a » (verbe avoir) et « à » (préposition).", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "A2", cefrMax: "A2", atomicityLevel: 4 },
  { key: "homophone_et_est", strand: "orthographe_grammaticale", labelFr: "Homophones et / est", descriptionFr: "Distinguer « et » (conjonction) et « est » (verbe être).", nativeGradeMin: 7, nativeGradeMax: 8, cefrMin: "A2", cefrMax: "A2", atomicityLevel: 4 },

  // Expression & comprehension — where the slice pays off communicatively.
  { key: "narration_passe", strand: "expression_ecrite", labelFr: "Écrire un récit au passé", descriptionFr: "Rédiger un court récit cohérent au passé.", nativeGradeMin: 8, nativeGradeMax: 10, cefrMin: "B1", cefrMax: "B2", atomicityLevel: 5, requiresWriting: true },
  { key: "recit_oral_passe", strand: "production_orale", labelFr: "Raconter à l'oral au passé", descriptionFr: "Raconter spontanément un événement passé.", nativeGradeMin: 7, nativeGradeMax: 9, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 4, requiresSpeaking: true },
  { key: "comprehension_recit_passe", strand: "comprehension_ecrite", labelFr: "Comprendre un récit au passé", descriptionFr: "Repérer la chronologie et les temps dans un texte au passé.", nativeGradeMin: 7, nativeGradeMax: 9, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 4, requiresReading: true },
  { key: "ecoute_recit_passe", strand: "comprehension_orale", labelFr: "Écouter un récit au passé", descriptionFr: "Comprendre un court récit oral au passé.", nativeGradeMin: 7, nativeGradeMax: 9, cefrMin: "A2", cefrMax: "B1", atomicityLevel: 4, requiresListening: true },
];

// ──────────────────────────── Prerequisite edges ───────────────────────────

const P = (source: string, target: string): SeedEdge => ({ source, target, edgeType: "prerequisite" });

export const EDGES: SeedEdge[] = [
  // Foundations
  P("classes_de_mots", "notion_verbe"),
  P("classes_de_mots", "groupe_nominal"),
  P("classes_de_mots", "fonction_sujet"),
  P("notion_verbe", "fonction_sujet"),
  P("groupe_nominal", "accord_genre_nombre"),
  P("fonction_sujet", "accord_sujet_verbe"),
  P("notion_verbe", "accord_sujet_verbe"),

  // COD / pronouns / relative
  P("fonction_sujet", "cod_identification"),
  P("cod_identification", "coi_identification"),
  P("cod_identification", "cod_coi_distinction"),
  P("coi_identification", "cod_coi_distinction"),
  P("cod_identification", "pronom_personnel_cod"),
  P("cod_identification", "pronom_relatif_que"),

  // Conjugaison spine
  P("notion_verbe", "radical_terminaison"),
  P("radical_terminaison", "groupes_verbes"),
  P("groupes_verbes", "present_indicatif"),
  P("present_indicatif", "imparfait_formation"),
  P("present_indicatif", "participe_passe_formation"),
  P("participe_passe_formation", "auxiliaire_choix"),
  P("present_indicatif", "passe_compose_avoir"),
  P("auxiliaire_choix", "passe_compose_avoir"),
  P("auxiliaire_choix", "passe_compose_etre"),
  P("participe_passe_formation", "passe_compose_avoir"),
  P("participe_passe_formation", "passe_compose_etre"),

  // Tense contrast & sequencing
  P("passe_compose_avoir", "pc_vs_imparfait"),
  P("passe_compose_etre", "pc_vs_imparfait"),
  P("imparfait_formation", "pc_vs_imparfait"),
  P("passe_compose_avoir", "plus_que_parfait"),
  P("imparfait_formation", "plus_que_parfait"),
  P("pc_vs_imparfait", "concordance_temps_recit"),
  P("plus_que_parfait", "concordance_temps_recit"),

  // Past-participle agreement — the cross-strand convergence
  P("passe_compose_etre", "accord_pp_etre"),
  P("accord_genre_nombre", "accord_pp_etre"),
  P("fonction_sujet", "accord_pp_etre"),
  P("passe_compose_avoir", "accord_pp_avoir_cod"),
  P("accord_genre_nombre", "accord_pp_avoir_cod"),
  P("cod_identification", "accord_pp_avoir_cod"),
  P("pronom_personnel_cod", "accord_pp_avoir_cod"),
  P("pronom_relatif_que", "accord_pp_avoir_cod"),

  // Homophones & -er/-é/-ez (orthographe driven by tense)
  P("present_indicatif", "homophone_a_a"),
  P("present_indicatif", "homophone_et_est"),
  P("present_indicatif", "terminaison_er_e_ez"),
  P("participe_passe_formation", "terminaison_er_e_ez"),

  // Communicative payoff
  P("pc_vs_imparfait", "narration_passe"),
  P("accord_pp_etre", "narration_passe"),
  P("accord_sujet_verbe", "narration_passe"),
  P("passe_compose_avoir", "recit_oral_passe"),
  P("passe_compose_etre", "recit_oral_passe"),
  P("passe_compose_avoir", "comprehension_recit_passe"),
  P("imparfait_formation", "comprehension_recit_passe"),
  P("passe_compose_avoir", "ecoute_recit_passe"),
  P("imparfait_formation", "ecoute_recit_passe"),
];

// ─────────────────────────────── Misconceptions ────────────────────────────

export const MISCONCEPTIONS: SeedMisconception[] = [
  { key: "present_for_past", labelFr: "Présent à la place du passé", descriptionFr: "Emploie le présent là où le passé est attendu (« Hier je vais »).", strand: "conjugaison", primaryNodeKey: "passe_compose_avoir", signature: { pattern: "present_instead_of_past", example: "Hier, je vais au cinéma." } },
  { key: "wrong_auxiliary", labelFr: "Mauvais auxiliaire", descriptionFr: "Utilise avoir au lieu d'être (ou l'inverse) au passé composé.", strand: "conjugaison", primaryNodeKey: "auxiliaire_choix", signature: { pattern: "avoir_for_etre", example: "J'ai allé à l'école." } },
  { key: "no_pp_agreement_etre", labelFr: "Participe passé non accordé (être)", descriptionFr: "N'accorde pas le participe avec le sujet (auxiliaire être).", strand: "orthographe_grammaticale", primaryNodeKey: "accord_pp_etre", signature: { pattern: "missing_etre_agreement", example: "Elle est allé au marché." } },
  { key: "overgen_pp_agreement_avoir", labelFr: "Accord abusif avec avoir", descriptionFr: "Accorde le participe avec un COD placé après l'auxiliaire avoir.", strand: "orthographe_grammaticale", primaryNodeKey: "accord_pp_avoir_cod", signature: { pattern: "agreement_without_preceding_cod", example: "J'ai mangée une pomme." } },
  { key: "pc_imparfait_confusion", labelFr: "Confusion passé composé / imparfait", descriptionFr: "Choisit le mauvais temps pour l'aspect visé.", strand: "conjugaison", primaryNodeKey: "pc_vs_imparfait", signature: { pattern: "aspect_confusion", example: "Quand je suis petit, j'ai joué dehors." } },
  { key: "er_e_confusion", labelFr: "Confusion -er / -é", descriptionFr: "Confond infinitif et participe passé (« j'ai manger »).", strand: "orthographe_grammaticale", primaryNodeKey: "terminaison_er_e_ez", signature: { pattern: "infinitive_for_participle", example: "J'ai manger une pomme." } },
];

export const PAST_NARRATION_SLICE = { NODES, EDGES, MISCONCEPTIONS } as const;
