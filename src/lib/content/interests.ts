/**
 * Interest catalogue (PRD §7, Layer 2). Students enter through an interest;
 * the product routes them toward academic knowledge (Layer 3). `transfer`
 * lists the domains an interest opens onto.
 */
export type Interest = {
  key: string;
  labelFr: string;
  emoji: string;
  transfer: string[];
};

export const INTERESTS: Interest[] = [
  { key: "football", labelFr: "Football", emoji: "⚽", transfer: ["geography", "economics", "biology"] },
  { key: "basketball", labelFr: "Basketball", emoji: "🏀", transfer: ["physics", "health", "economics"] },
  { key: "music", labelFr: "Musique", emoji: "🎵", transfer: ["physics", "culture", "history"] },
  { key: "fashion", labelFr: "Mode", emoji: "👗", transfer: ["science", "economics", "environment"] },
  { key: "gaming", labelFr: "Jeux vidéo", emoji: "🎮", transfer: ["psychology", "technology", "media_literacy"] },
  { key: "cars", labelFr: "Voitures", emoji: "🚗", transfer: ["physics", "environment", "technology"] },
  { key: "medicine", labelFr: "Médecine", emoji: "🩺", transfer: ["biology", "health", "science"] },
  { key: "animals", labelFr: "Animaux", emoji: "🐾", transfer: ["biology", "environment", "science"] },
  { key: "beauty", labelFr: "Beauté", emoji: "💄", transfer: ["science", "economics", "media_literacy"] },
  { key: "business", labelFr: "Entreprise", emoji: "💼", transfer: ["economics", "society", "media_literacy"] },
  { key: "money", labelFr: "Argent", emoji: "💰", transfer: ["economics", "society", "psychology"] },
  { key: "mystery", labelFr: "Crime et mystère", emoji: "🔎", transfer: ["law_ethics", "psychology", "society"] },
  { key: "technology", labelFr: "Technologie", emoji: "💻", transfer: ["technology", "media_literacy", "physics"] },
  { key: "social_media", labelFr: "Réseaux sociaux", emoji: "📱", transfer: ["media_literacy", "psychology", "economics"] },
  { key: "psychology", labelFr: "Psychologie", emoji: "🧠", transfer: ["psychology", "health", "society"] },
  { key: "politics", labelFr: "Politique", emoji: "🏛️", transfer: ["society", "history", "law_ethics"] },
  { key: "history", labelFr: "Histoire", emoji: "📜", transfer: ["history", "geography", "society"] },
  { key: "environment", labelFr: "Environnement", emoji: "🌍", transfer: ["environment", "science", "geography"] },
  { key: "space", labelFr: "Espace", emoji: "🚀", transfer: ["physics", "science", "technology"] },
  { key: "food", labelFr: "Cuisine", emoji: "🍲", transfer: ["biology", "geography", "culture"] },
  { key: "travel", labelFr: "Voyage", emoji: "✈️", transfer: ["geography", "culture", "history"] },
  { key: "african_history", labelFr: "Histoire africaine", emoji: "🌍", transfer: ["history", "geography", "society"] },
  { key: "celebrities", labelFr: "Célébrités", emoji: "⭐", transfer: ["media_literacy", "culture", "psychology"] },
];

export const INTEREST_BY_KEY: Record<string, Interest> = Object.fromEntries(
  INTERESTS.map((i) => [i.key, i])
);
