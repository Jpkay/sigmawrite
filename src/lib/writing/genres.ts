/**
 * Writing genres by grade (roadmap 5.1), following the collège progression:
 * narration in 6e/5e, description and letter in 5e/4e, argumentation in
 * 4e/3e. Length bands grow with the grade so a 3e student is not capped at
 * a hundred words.
 */
export type WritingGenre = "recit" | "description" | "lettre" | "argumentation" | "resume";

export type GenreSpec = { genre: WritingGenre; label: string; minimumWords: number; maximumWords: number; brief: string };

const GENRES: Record<WritingGenre, Omit<GenreSpec, "genre">> = {
  recit: { label: "Récit", minimumWords: 60, maximumWords: 120, brief: "Raconte un moment précis avec un début, un événement et une fin. Choisis un narrateur et garde-le." },
  description: { label: "Description", minimumWords: 70, maximumWords: 140, brief: "Décris un lieu ou un personnage en organisant les détails (du général au particulier) et en variant les verbes." },
  lettre: { label: "Lettre", minimumWords: 80, maximumWords: 160, brief: "Écris une lettre avec une formule d’ouverture, un corps organisé en paragraphes et une formule de clôture adaptée au destinataire." },
  argumentation: { label: "Argumentation", minimumWords: 100, maximumWords: 180, brief: "Défends une position en deux arguments développés, chacun appuyé par un exemple, puis conclus." },
  resume: { label: "Résumé", minimumWords: 50, maximumWords: 100, brief: "Reformule l’essentiel avec tes mots, sans recopier, en gardant l’ordre des idées." },
};

/** Genres offered at a grade (4 = CM1 … 9 = 3e). */
export function genresForGrade(grade: number): WritingGenre[] {
  if (grade <= 6) return ["recit", "description", "resume"];
  if (grade === 7) return ["recit", "description", "lettre", "resume"];
  if (grade === 8) return ["recit", "lettre", "argumentation", "resume"];
  return ["argumentation", "lettre", "recit", "resume"];
}

export function genreSpec(genre: WritingGenre): GenreSpec {
  return { genre, ...GENRES[genre] };
}

export function isWritingGenre(value: string): value is WritingGenre {
  return value in GENRES;
}

/** Task prompt that keeps the node's verb-form target while framing the genre. */
export function genrePrompt(genre: WritingGenre, nodeKey: string, nodeLabel: string): string {
  const spec = GENRES[genre];
  const target = nodeLabel.toLocaleLowerCase("fr");
  const constraint = nodeKey === "employer_pronoms_complements_en_contexte"
    ? "Emploie correctement au moins deux pronoms compléments différents (lui, leur, le, la, les, y, en)."
    : `Emploie au moins deux formes verbales différentes qui démontrent : ${target}.`;
  const frame = genre === "recit" ? "Raconte, à la première ou à la troisième personne, un moment où quelque chose change."
    : genre === "description" ? "Décris un lieu que tu connais bien à un moment précis de la journée."
      : genre === "lettre" ? "Écris à une personne réelle ou imaginaire pour lui raconter ou lui demander quelque chose."
        : genre === "argumentation" ? "Prends position sur une question de ta vie de collégien (le téléphone en classe, les devoirs, le sport obligatoire…)."
          : "Résume un texte que tu as lu récemment.";
  return `${spec.label} de ${spec.minimumWords} à ${spec.maximumWords} mots. ${frame} ${spec.brief} ${constraint} Écris sans modèle ni indice.`;
}
