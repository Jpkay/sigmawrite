const label = (value: string | null | undefined, labels: Record<string, string>, fallback = "Autre") =>
  value == null || value === "" ? "—" : labels[value] ?? fallback;

export const jobNameLabel = (value: string) => label(value, {
  retrieval_due: "Rappels de révision",
  data_retention: "Conservation des données",
  weekly_parent_reports: "Rapports hebdomadaires aux parents",
  psychometrics: "Analyse psychométrique",
  french_automation_monitoring: "Suivi des automatisations de français",
}, "Tâche planifiée");

export const statusLabel = (value: string | null | undefined) => label(value, {
  pending: "En attente",
  queued: "En file d’attente",
  assigned: "À commencer",
  draft: "Brouillon",
  running: "En cours",
  processing: "Traitement en cours",
  active: "Actif",
  completed: "Terminée",
  submitted: "Validée",
  failed: "Échec",
  cancelled: "Annulée",
  deactivated: "Désactivé",
  invited: "Invitation envoyée",
}, "Statut non reconnu");

export const reviewWorkflowLabel = (value: string | null | undefined) => label(value, {
  generated: "Généré",
  ready_for_review: "Prêt à évaluer",
  in_review: "En cours d’évaluation",
  review_complete: "Évaluation terminée",
  needs_revision: "Révision nécessaire",
  approved: "Approuvé",
  rejected: "Rejeté",
  published: "Publié",
  retired: "Retiré",
}, "État éditorial non reconnu");

export const agreementLabel = (value: string | null | undefined) => label(value, {
  unanimous: "Accord unanime",
  strong_agreement: "Accord fort",
  mixed: "Avis partagés",
  high_disagreement: "Désaccord important",
}, "Accord non classé");

export const reviewDecisionLabel = (value: string | null | undefined) => label(value, {
  approve: "Approuver",
  approve_minor: "Approuver avec changements mineurs",
  needs_revision: "À réviser",
  reject: "Rejeter",
}, "Décision non renseignée");

export const questionOutcomeLabel = (value: string | null | undefined) => label(value, {
  correct_clear: "Correcte et claire",
  minor_issue: "Problème mineur",
  ambiguous: "Ambiguë",
  incorrect: "Incorrecte",
}, "Avis non renseigné");

export const textTypeLabel = (value: string | null | undefined) => label(value, {
  expository: "Texte explicatif",
  explanatory: "Texte explicatif",
  biography: "Biographie",
  argumentative: "Texte argumentatif",
  narrative: "Récit",
  narrative_nonfiction: "Récit documentaire",
  informational: "Texte informatif",
  literary: "Texte littéraire",
  source_based: "Texte fondé sur des sources",
}, "Autre type de texte");

export const reviewStatusLabel = (value: string | null | undefined) => label(value, {
  draft: "Brouillon",
  auto_approved: "Approuvé automatiquement",
  needs_human_review: "Évaluation humaine requise",
  human_approved: "Approuvé par un évaluateur",
  rejected: "Rejeté",
  retired: "Retiré",
  benchmark_locked: "Référence verrouillée",
}, "Statut d’évaluation non reconnu");

export const responseTypeLabel = (value: string | null | undefined) => label(value, {
  multiple_choice: "Choix multiple",
  short_answer: "Réponse courte",
  written_summary: "Résumé écrit",
  free_text: "Réponse libre",
}, "Autre format de réponse");

export const validatorTypeLabel = (value: string | null | undefined) => label(value, {
  exact: "Réponse exacte",
  normalized_exact: "Réponse exacte normalisée",
  multiple_choice: "Choix multiple",
  keyword: "Mots-clés",
  semantic: "Validation sémantique",
  agreement: "Accord grammatical",
  grammalecte: "Contrôle grammatical",
  conjugation: "Conjugaison",
}, "Autre validation");

export const aiJobTypeLabel = (value: string | null | undefined) => label(value, {
  text_generation: "Génération de texte",
  item_generation: "Génération d’exercices",
}, "Tâche d’intelligence artificielle");

export const qualityGateLabel = (value: string) => label(value, {
  schema_valid: "Format valide",
  moderation_passed: "Modération réussie",
  factual_review: "Vérification factuelle requise",
  sensitive_domain: "Domaine sensible",
  difficulty_mismatch: "Difficulté hors cible",
}, "Contrôle qualité");

export const booleanLabel = (value: unknown) => value === true ? "Oui" : value === false ? "Non" : String(value);
