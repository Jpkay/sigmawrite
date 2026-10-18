/**
 * Interest catalogue (PRD §7, Layer 2). Students enter through an interest;
 * the product routes them toward academic knowledge (Layer 3). `transfer`
 * lists the domains an interest opens onto.
 *
 * Roadmap E.1: every one of the 38 interest keys stays selectable (stored
 * choices must keep validating), but each belongs to a broader group. When an
 * exact interest has no content yet, matching falls back to the same group,
 * then to the group's `near` neighbours, and never silently to "anything".
 */
export const INTEREST_GROUPS = [
  { key: "manga_bd", labelFr: "Mangas, animés et BD", phraseFr: "les mangas et la BD", near: ["stories", "creation"] },
  { key: "stories", labelFr: "Films, séries et histoires", phraseFr: "les films et les histoires", near: ["manga_bd", "history_world"] },
  { key: "sports", labelFr: "Sports", phraseFr: "le sport", near: ["music_dance", "games"] },
  { key: "music_dance", labelFr: "Musique et danse", phraseFr: "la musique et la danse", near: ["media_people", "sports"] },
  { key: "fashion_style", labelFr: "Mode et style", phraseFr: "la mode", near: ["creation", "media_people"] },
  { key: "games", labelFr: "Jeux", phraseFr: "les jeux", near: ["tech", "manga_bd"] },
  { key: "creation", labelFr: "Création et bricolage", phraseFr: "la création", near: ["fashion_style", "tech"] },
  { key: "sciences", labelFr: "Sciences", phraseFr: "les sciences", near: ["nature", "tech"] },
  { key: "tech", labelFr: "Technologie et machines", phraseFr: "la technologie", near: ["sciences", "games"] },
  { key: "nature", labelFr: "Nature et animaux", phraseFr: "la nature", near: ["sciences", "food_travel"] },
  { key: "history_world", labelFr: "Histoire et société", phraseFr: "l’histoire", near: ["stories", "food_travel"] },
  { key: "food_travel", labelFr: "Cuisine et voyages", phraseFr: "la cuisine et les voyages", near: ["nature", "history_world"] },
  { key: "money_business", labelFr: "Argent et entreprise", phraseFr: "l’argent et l’entreprise", near: ["media_people", "tech"] },
  { key: "media_people", labelFr: "Réseaux et célébrités", phraseFr: "les réseaux et les célébrités", near: ["music_dance", "money_business"] },
] as const satisfies ReadonlyArray<{ key: string; labelFr: string; phraseFr: string; near: readonly string[] }>;

export type InterestGroupKey = (typeof INTEREST_GROUPS)[number]["key"];
export type InterestGroup = (typeof INTEREST_GROUPS)[number];

export type Interest = {
  key: string;
  labelFr: string;
  emoji: string;
  transfer: string[];
  /** Parent group used when this exact interest has no content yet (E.1). */
  group: InterestGroupKey;
  /** Short French noun phrase with its article: "le foot", "les mangas". */
  phraseFr: string;
};

export const INTERESTS: Interest[] = [
  { key: "manga", labelFr: "Mangas", emoji: "📚", transfer: ["culture", "history", "society"] , group: "manga_bd", phraseFr: "les mangas" },
  { key: "anime", labelFr: "Animés", emoji: "✨", transfer: ["culture", "technology", "media_literacy"] , group: "manga_bd", phraseFr: "les animés" },
  { key: "comics", labelFr: "BD et comics", emoji: "💬", transfer: ["culture", "history", "media_literacy"] , group: "manga_bd", phraseFr: "la BD et les comics" },
  { key: "movies_series", labelFr: "Films et séries", emoji: "🎬", transfer: ["culture", "history", "media_literacy"] , group: "stories", phraseFr: "les films et les séries" },
  { key: "books", labelFr: "Romans et histoires", emoji: "📖", transfer: ["culture", "history", "psychology"] , group: "stories", phraseFr: "les romans" },
  { key: "football", labelFr: "Football", emoji: "⚽", transfer: ["geography", "economics", "biology"] , group: "sports", phraseFr: "le foot" },
  { key: "basketball", labelFr: "Basketball", emoji: "🏀", transfer: ["physics", "health", "economics"] , group: "sports", phraseFr: "le basket" },
  { key: "volleyball", labelFr: "Volley", emoji: "🏐", transfer: ["physics", "health", "society"] , group: "sports", phraseFr: "le volley" },
  { key: "martial_arts", labelFr: "Sports de combat", emoji: "🥋", transfer: ["health", "physics", "culture"] , group: "sports", phraseFr: "les sports de combat" },
  { key: "skating", labelFr: "Skate et roller", emoji: "🛹", transfer: ["physics", "health", "culture"] , group: "sports", phraseFr: "le skate et le roller" },
  { key: "dance", labelFr: "Danse", emoji: "💃", transfer: ["culture", "health", "history"] , group: "music_dance", phraseFr: "la danse" },
  { key: "music", labelFr: "Musique", emoji: "🎵", transfer: ["physics", "culture", "history"] , group: "music_dance", phraseFr: "la musique" },
  { key: "fashion", labelFr: "Mode", emoji: "👗", transfer: ["science", "economics", "environment"] , group: "fashion_style", phraseFr: "la mode" },
  { key: "gaming", labelFr: "Jeux vidéo", emoji: "🎮", transfer: ["psychology", "technology", "media_literacy"] , group: "games", phraseFr: "les jeux vidéo" },
  { key: "esports", labelFr: "Compétitions de jeux vidéo", emoji: "🏆", transfer: ["technology", "psychology", "economics"] , group: "games", phraseFr: "l’e-sport" },
  { key: "board_games", labelFr: "Jeux de société et échecs", emoji: "🎲", transfer: ["psychology", "culture", "history"] , group: "games", phraseFr: "les jeux de société" },
  { key: "drawing", labelFr: "Dessin et illustration", emoji: "🎨", transfer: ["culture", "history", "technology"] , group: "creation", phraseFr: "le dessin" },
  { key: "photo_video", labelFr: "Photo et création de vidéos", emoji: "📷", transfer: ["technology", "physics", "media_literacy"] , group: "creation", phraseFr: "la photo et la vidéo" },
  { key: "diy", labelFr: "Bricolage et créations", emoji: "🛠️", transfer: ["technology", "physics", "environment"] , group: "creation", phraseFr: "le bricolage" },
  { key: "science", labelFr: "Sciences et expériences", emoji: "🧪", transfer: ["science", "physics", "biology"] , group: "sciences", phraseFr: "les sciences" },
  { key: "cars", labelFr: "Voitures", emoji: "🚗", transfer: ["physics", "environment", "technology"] , group: "tech", phraseFr: "les voitures" },
  { key: "medicine", labelFr: "Médecine", emoji: "🩺", transfer: ["biology", "health", "science"] , group: "sciences", phraseFr: "la médecine" },
  { key: "animals", labelFr: "Animaux", emoji: "🐾", transfer: ["biology", "environment", "science"] , group: "nature", phraseFr: "les animaux" },
  { key: "beauty", labelFr: "Beauté", emoji: "💄", transfer: ["science", "economics", "media_literacy"] , group: "fashion_style", phraseFr: "la beauté" },
  { key: "business", labelFr: "Entreprise", emoji: "💼", transfer: ["economics", "society", "media_literacy"] , group: "money_business", phraseFr: "l’entreprise" },
  { key: "money", labelFr: "Argent", emoji: "💰", transfer: ["economics", "society", "psychology"] , group: "money_business", phraseFr: "l’argent" },
  { key: "mystery", labelFr: "Crime et mystère", emoji: "🔎", transfer: ["law_ethics", "psychology", "society"] , group: "stories", phraseFr: "les enquêtes" },
  { key: "technology", labelFr: "Technologie", emoji: "💻", transfer: ["technology", "media_literacy", "physics"] , group: "tech", phraseFr: "la technologie" },
  { key: "social_media", labelFr: "Réseaux sociaux", emoji: "📱", transfer: ["media_literacy", "psychology", "economics"] , group: "media_people", phraseFr: "les réseaux sociaux" },
  { key: "psychology", labelFr: "Psychologie", emoji: "🧠", transfer: ["psychology", "health", "society"] , group: "sciences", phraseFr: "la psychologie" },
  { key: "politics", labelFr: "Politique", emoji: "🏛️", transfer: ["society", "history", "law_ethics"] , group: "history_world", phraseFr: "la politique" },
  { key: "history", labelFr: "Histoire", emoji: "📜", transfer: ["history", "geography", "society"] , group: "history_world", phraseFr: "l’histoire" },
  { key: "environment", labelFr: "Environnement", emoji: "🌍", transfer: ["environment", "science", "geography"] , group: "nature", phraseFr: "l’environnement" },
  { key: "space", labelFr: "Espace", emoji: "🚀", transfer: ["physics", "science", "technology"] , group: "sciences", phraseFr: "l’espace" },
  { key: "food", labelFr: "Cuisine", emoji: "🍲", transfer: ["biology", "geography", "culture"] , group: "food_travel", phraseFr: "la cuisine" },
  { key: "travel", labelFr: "Voyage", emoji: "✈️", transfer: ["geography", "culture", "history"] , group: "food_travel", phraseFr: "les voyages" },
  { key: "african_history", labelFr: "Histoire africaine", emoji: "🌍", transfer: ["history", "geography", "society"] , group: "history_world", phraseFr: "l’histoire africaine" },
  { key: "celebrities", labelFr: "Célébrités", emoji: "⭐", transfer: ["media_literacy", "culture", "psychology"] , group: "media_people", phraseFr: "les célébrités" },
];

export const INTEREST_BY_KEY: Record<string, Interest> = Object.fromEntries(
  INTERESTS.map((i) => [i.key, i])
);

export const INTEREST_GROUP_BY_KEY: Record<string, InterestGroup> = Object.fromEntries(
  INTEREST_GROUPS.map((group) => [group.key, group])
);

/** Interest keys of a group, in catalogue order. */
export function interestsInGroup(group: string): string[] {
  return INTERESTS.filter((interest) => interest.group === group).map((interest) => interest.key);
}

/** Parent group of an interest key (an unknown key has none). */
export function interestGroupOf(key: string | null | undefined): InterestGroupKey | null {
  return key ? INTEREST_BY_KEY[key]?.group ?? null : null;
}

/** "le foot", "les mangas"… falls back to a lower-cased label for unknown keys. */
export function interestPhrase(key: string): string {
  return INTEREST_BY_KEY[key]?.phraseFr ?? INTEREST_GROUP_BY_KEY[key]?.phraseFr ?? key.replace(/_/g, " ");
}
