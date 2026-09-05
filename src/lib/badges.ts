/**
 * Badge catalogue (roadmap 6.8): every badge is earned by a verifiable
 * learning milestone. None rewards time on the app.
 */
export type BadgeKey =
  | "premiere_competence" | "cinq_competences" | "quinze_competences" | "quatre_domaines"
  | "dictee_sans_faute" | "cinq_dictees" | "premiere_production" | "trois_productions"
  | "serie_sept" | "serie_trente" | "cent_revisions" | "premier_bilan";

export type BadgeDefinition = { key: BadgeKey; label: string; description: string; emoji: string };

export const BADGES: BadgeDefinition[] = [
  { key: "premiere_competence", label: "Première compétence", description: "Une compétence sécurisée sans aide.", emoji: "🌱" },
  { key: "cinq_competences", label: "Cinq compétences", description: "Cinq compétences sécurisées.", emoji: "🌿" },
  { key: "quinze_competences", label: "Quinze compétences", description: "Quinze compétences sécurisées.", emoji: "🌳" },
  { key: "quatre_domaines", label: "Quatre domaines", description: "Au moins une compétence sécurisée en lecture, grammaire, orthographe et conjugaison.", emoji: "🧭" },
  { key: "dictee_sans_faute", label: "Sans faute", description: "Une dictée sans aucune erreur.", emoji: "✒️" },
  { key: "cinq_dictees", label: "Cinq dictées", description: "Cinq dictées terminées.", emoji: "📝" },
  { key: "premiere_production", label: "Première production", description: "Un texte libre qui démontre la compétence visée.", emoji: "📜" },
  { key: "trois_productions", label: "Trois productions", description: "Trois textes libres réussis.", emoji: "📚" },
  { key: "serie_sept", label: "Sept jours", description: "Objectif quotidien atteint sept jours de suite.", emoji: "🔥" },
  { key: "serie_trente", label: "Trente jours", description: "Objectif quotidien atteint trente jours de suite.", emoji: "☄️" },
  { key: "cent_revisions", label: "Cent révisions", description: "Cent cartes ou mots révisés.", emoji: "🧠" },
  { key: "premier_bilan", label: "Premier bilan", description: "Un bilan hebdomadaire avec au moins quatre jours actifs.", emoji: "📈" },
];

export const BADGE_BY_KEY = new Map(BADGES.map((badge) => [badge.key, badge]));

export type BadgeFacts = {
  masteredNodes: number;
  masteredStrands: number;
  cleanDictations: number;
  dictations: number;
  demonstratedProductions: number;
  streak: number;
  reviews: number;
  activeDaysThisWeek: number;
};

/** Pure milestone check so awarding is testable without a database. */
export function earnedBadges(facts: BadgeFacts): BadgeKey[] {
  const keys: BadgeKey[] = [];
  if (facts.masteredNodes >= 1) keys.push("premiere_competence");
  if (facts.masteredNodes >= 5) keys.push("cinq_competences");
  if (facts.masteredNodes >= 15) keys.push("quinze_competences");
  if (facts.masteredStrands >= 4) keys.push("quatre_domaines");
  if (facts.cleanDictations >= 1) keys.push("dictee_sans_faute");
  if (facts.dictations >= 5) keys.push("cinq_dictees");
  if (facts.demonstratedProductions >= 1) keys.push("premiere_production");
  if (facts.demonstratedProductions >= 3) keys.push("trois_productions");
  if (facts.streak >= 7) keys.push("serie_sept");
  if (facts.streak >= 30) keys.push("serie_trente");
  if (facts.reviews >= 100) keys.push("cent_revisions");
  if (facts.activeDaysThisWeek >= 4) keys.push("premier_bilan");
  return keys;
}
