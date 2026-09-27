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
  { key: "manga", labelFr: "Mangas", emoji: "📚", transfer: ["culture", "history", "society"] },
  { key: "anime", labelFr: "Animés", emoji: "✨", transfer: ["culture", "technology", "media_literacy"] },
  { key: "comics", labelFr: "BD et comics", emoji: "💬", transfer: ["culture", "history", "media_literacy"] },
  { key: "movies_series", labelFr: "Films et séries", emoji: "🎬", transfer: ["culture", "history", "media_literacy"] },
  { key: "books", labelFr: "Romans et histoires", emoji: "📖", transfer: ["culture", "history", "psychology"] },
  { key: "football", labelFr: "Football", emoji: "⚽", transfer: ["geography", "economics", "biology"] },
  { key: "basketball", labelFr: "Basketball", emoji: "🏀", transfer: ["physics", "health", "economics"] },
  { key: "volleyball", labelFr: "Volley", emoji: "🏐", transfer: ["physics", "health", "society"] },
  { key: "martial_arts", labelFr: "Sports de combat", emoji: "🥋", transfer: ["health", "physics", "culture"] },
  { key: "skating", labelFr: "Skate et roller", emoji: "🛹", transfer: ["physics", "health", "culture"] },
  { key: "dance", labelFr: "Danse", emoji: "💃", transfer: ["culture", "health", "history"] },
  { key: "music", labelFr: "Musique", emoji: "🎵", transfer: ["physics", "culture", "history"] },
  { key: "fashion", labelFr: "Mode", emoji: "👗", transfer: ["science", "economics", "environment"] },
  { key: "gaming", labelFr: "Jeux vidéo", emoji: "🎮", transfer: ["psychology", "technology", "media_literacy"] },
  { key: "esports", labelFr: "Compétitions de jeux vidéo", emoji: "🏆", transfer: ["technology", "psychology", "economics"] },
  { key: "board_games", labelFr: "Jeux de société et échecs", emoji: "🎲", transfer: ["psychology", "culture", "history"] },
  { key: "drawing", labelFr: "Dessin et illustration", emoji: "🎨", transfer: ["culture", "history", "technology"] },
  { key: "photo_video", labelFr: "Photo et création de vidéos", emoji: "📷", transfer: ["technology", "physics", "media_literacy"] },
  { key: "diy", labelFr: "Bricolage et créations", emoji: "🛠️", transfer: ["technology", "physics", "environment"] },
  { key: "science", labelFr: "Sciences et expériences", emoji: "🧪", transfer: ["science", "physics", "biology"] },
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
