export const PRONOUN_PRACTICE_NODE_KEY = "construction_pronom_objet";

export const PRONOUN_MODULE_KEYS = [
  "direct_objects",
  "indirect_people",
  "direct_or_indirect",
  "y_and_en",
  "position_and_agreement",
  "double_pronouns",
] as const;

export type PronounModuleKey = typeof PRONOUN_MODULE_KEYS[number];

export type PronounLesson = {
  family: string;
  eyebrow: string;
  explanation: string;
  pattern: string;
  examples: string[];
  exceptions: string[];
};

const MODULES: Record<PronounModuleKey, Omit<PronounLesson, "eyebrow">> = {
  direct_objects: {
    family: "Pronoms COD",
    explanation: "Un COD suit le verbe sans préposition. Remplace-le par le, la, l’ ou les selon son genre et son nombre.",
    pattern: "masculin singulier → le · féminin singulier → la · voyelle → l’ · pluriel → les",
    examples: ["Je vois Nora. → Je la vois.", "Nous invitons les voisins. → Nous les invitons."],
    exceptions: ["Le et la deviennent l’ devant une voyelle : je l’invite.", "Le pronom se place normalement avant le verbe conjugué."],
  },
  indirect_people: {
    family: "Lui ou leur",
    explanation: "Quand le verbe se construit avec à + une personne, emploie lui au singulier et leur au pluriel. Le genre ne change rien.",
    pattern: "à une personne, homme ou femme → lui · à plusieurs personnes → leur",
    examples: ["Il parle à sa mère. → Il lui parle.", "Il écrit à ses parents. → Il leur écrit."],
    exceptions: ["Lui peut reprendre un homme ou une femme.", "Leur ne prend jamais de s lorsqu’il est pronom : il leur parle."],
  },
  direct_or_indirect: {
    family: "COD ou COI",
    explanation: "Observe la construction du verbe. Sans préposition, choisis le, la ou les ; avec à + personne, choisis lui ou leur.",
    pattern: "voir quelqu’un → le/la/les · parler à quelqu’un → lui/leur",
    examples: ["Je vois ma sœur. → Je la vois.", "Je réponds à ma sœur. → Je lui réponds."],
    exceptions: ["La personne n’impose pas lui : écouter quelqu’un donne je l’écoute.", "Apprends chaque verbe avec sa construction."],
  },
  y_and_en: {
    family: "Y et en",
    explanation: "Y reprend souvent un lieu ou à + une chose. En reprend de + une chose ou une quantité.",
    pattern: "à/dans/sur + chose ou lieu → y · de + chose ou quantité → en",
    examples: ["Elle va au marché. → Elle y va.", "Il parle de son projet. → Il en parle."],
    exceptions: ["Pour une personne, on dit souvent penser à elle ou parler d’elle.", "Avec une quantité, garde le nombre : j’en veux trois."],
  },
  position_and_agreement: {
    family: "Place et accord",
    explanation: "Dans un temps composé, le pronom vient avant l’auxiliaire. Un COD placé avant peut commander l’accord ; lui et leur, qui sont COI, ne le commandent pas.",
    pattern: "COD + auxiliaire + participe accordé · lui/leur + auxiliaire + participe inchangé",
    examples: ["Nora ? Je l’ai vue.", "Nora ? Je lui ai parlé."],
    exceptions: ["L’accord dépend de la fonction COD, pas du fait que le pronom désigne une femme.", "Il lui a dit reste inchangé pour un homme comme pour une femme."],
  },
  double_pronouns: {
    family: "Deux pronoms",
    explanation: "Quand deux compléments deviennent pronoms, le COD le, la ou les se place avant lui ou leur.",
    pattern: "sujet + le/la/les + lui/leur + verbe",
    examples: ["Il donne le livre à Nora. → Il le lui donne.", "Il montre les clés aux voisins. → Il les leur montre."],
    exceptions: ["À l’impératif affirmatif : donne-le-lui.", "À l’impératif négatif, l’ordre habituel revient : ne le lui donne pas."],
  },
};

const NODE_MODULE: Record<string, PronounModuleKey> = {
  identifier_complement_direct: "direct_objects",
  produire_pronom_cod: "direct_objects",
  produire_pronom_coi_personne: "indirect_people",
  distinguer_pronom_cod_coi: "direct_or_indirect",
  produire_pronoms_y_en: "y_and_en",
  placer_pronom_complement: "position_and_agreement",
  accorder_participe_cod_antepose: "position_and_agreement",
  ordonner_doubles_pronoms: "double_pronouns",
  construction_pronom_objet: "direct_or_indirect",
};

export function pronounLessonForNode(nodeKey: string, nodeLabel: string): PronounLesson | null {
  const moduleKey = NODE_MODULE[nodeKey];
  if (!moduleKey) return null;
  const lesson = MODULES[moduleKey];
  return { ...lesson, eyebrow: `Leçon express · ${nodeLabel} · ${lesson.family}` };
}

export function indirectPersonPronoun(number: "singular" | "plural", gender: "masculine" | "feminine") {
  void gender;
  return number === "singular" ? "lui" : "leur";
}

export const PRONOUN_LESSON_MODULES = Object.values(MODULES);
