/**
 * Deterministic French stylometry (roadmap H.8). Used by
 *  - scripts/build-style-cards.mts to measure the public-domain corpus;
 *  - the code checks of the editorial pipeline to compare a draft with the
 *    measured half of its style card.
 * No model is involved: the same text always gives the same profile.
 * Tense and part-of-speech measures are surface heuristics (no tagger); they
 * are comparable between texts, not linguistic ground truth.
 */

export const FUNCTION_WORDS = [
  "le", "la", "les", "l'", "un", "une", "des", "de", "d'", "du", "à", "au", "aux", "et", "ou", "mais", "donc", "ni", "car",
  "que", "qu'", "qui", "dont", "où", "ce", "c'", "cet", "cette", "ces", "son", "sa", "ses", "leur", "leurs", "mon", "ma", "mes",
  "il", "elle", "ils", "elles", "on", "je", "j'", "tu", "nous", "vous", "me", "m'", "te", "t'", "se", "s'", "lui", "y", "en",
  "ne", "n'", "pas", "plus", "point", "jamais", "rien", "très", "bien", "si", "comme", "pour", "par", "sur", "sous", "dans",
  "avec", "sans", "vers", "chez", "puis", "alors", "tout", "tous", "toute", "même", "aussi", "encore", "quand", "est",
  "était", "fut", "a", "avait", "eut", "fait", "dit", "peu", "trop", "là", "ici", "ainsi", "cela", "ça",
] as const;

export type MeasuredStyle = {
  words: number;
  sentences: number;
  sentenceLength: { mean: number; sd: number; cv: number; p90: number };
  paragraphLength: { mean: number; sd: number };
  dialogueShare: number;
  narrativeTenses: { passeSimple: number; imparfait: number; present: number; passeCompose: number; futur: number };
  adverbMentPer1000: number;
  adjectiveSuffixPer1000: number;
  lexicalRange: number;
  readerAddressPer1000: number;
  punctuation: {
    exclamationPerSentence: number;
    questionPerSentence: number;
    commaPerSentence: number;
    semicolonPer1000: number;
    colonPer1000: number;
    ellipsisPer1000: number;
    dashPer1000: number;
  };
  functionWords: Record<string, number>;
};

const ABBREVIATIONS = /\b(M|MM|Mme|Mmes|Mlle|Dr|St|Ste|etc|cf|p|ex|av|J\.-C)\.$/u;

export function tokenize(text: string): string[] {
  return (text.toLocaleLowerCase("fr").replace(/’/gu, "'").match(/[\p{L}]+'|[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu) ?? []);
}

/** Sentence split on . ! ? … followed by a space and an upper-case letter, a dash or a quote. */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const paragraph of text.split(/\n+/u)) {
    let buffer = "";
    const parts = paragraph.split(/(?<=[.!?…»])\s+(?=[—–«"\p{Lu}])/u);
    for (const part of parts) {
      buffer = buffer ? `${buffer} ${part}` : part;
      if (ABBREVIATIONS.test(buffer.trim())) continue;
      if (/[\p{L}\p{N}]/u.test(buffer)) out.push(buffer.trim());
      buffer = "";
    }
    if (buffer && /[\p{L}\p{N}]/u.test(buffer)) out.push(buffer.trim());
  }
  return out;
}

export function paragraphs(text: string): string[] {
  return text.split(/\n{2,}|\n(?=\s*[—–])/u).map((p) => p.trim()).filter(Boolean);
}

const isDialogueParagraph = (paragraph: string) => /^[—–-]\s?|^«/u.test(paragraph);

/** Splits text into narration and dialogue (dash-led paragraphs and «…» quotations). */
export function splitDialogue(text: string): { narration: string; dialogue: string } {
  const narration: string[] = [];
  const dialogue: string[] = [];
  for (const paragraph of paragraphs(text)) {
    if (isDialogueParagraph(paragraph)) { dialogue.push(paragraph); continue; }
    const quoted = paragraph.match(/«[^»]*»/gu) ?? [];
    dialogue.push(...quoted);
    narration.push(paragraph.replace(/«[^»]*»/gu, " "));
  }
  return { narration: narration.join("\n\n"), dialogue: dialogue.join("\n\n") };
}

const PS_ENDINGS = /(?:èrent|irent|urent|inrent|âmes|îmes|ûmes|âtes|îtes|ûtes)$/u;
const PS_3S = new Set(["fut", "eut", "fit", "dit", "vit", "prit", "mit", "vint", "tint", "sut", "put", "dut", "crut", "parut", "mourut", "naquit", "voulut", "reçut", "ouvrit", "sortit", "partit", "répondit", "reprit", "devint", "revint", "comprit", "connut", "lut", "courut", "sentit", "entendit", "attendit", "descendit", "rendit", "perdit", "assit", "écrivit", "conduisit", "dormit", "apprit", "ajouta", "s'écria", "s'arrêta", "poursuivit", "finit", "saisit", "suivit", "vécut", "disparut", "apparut", "aperçut", "reconnut", "battit", "servit", "tendit"]);
const NOT_PS_A = new Set(["voilà", "déjà", "cela", "sera", "aura", "fera", "ira", "viendra", "pourra", "voudra", "faudra", "saura", "devra", "verra", "la", "va", "a", "ça", "là", "là-bas", "y", "deçà", "delà", "voila", "holà"]);
const SUBJECTS = new Set(["il", "elle", "on", "ils", "elles", "je", "j'", "tu", "nous", "vous", "qui"]);
const PRESENT_IRREGULAR = new Set(["est", "sont", "a", "ont", "va", "vont", "fait", "font", "dit", "disent", "peut", "peuvent", "veut", "veulent", "voit", "voient", "vient", "viennent", "prend", "prennent", "sait", "savent", "doit", "doivent", "suis", "es", "ai", "as", "vais", "vas", "fais", "dis", "peux", "veux", "sommes", "êtes", "avons", "avez", "faisons", "faites"]);
const AUX = new Set(["ai", "as", "a", "avons", "avez", "ont", "suis", "es", "est", "sommes", "êtes", "sont"]);
const PARTICIPLE = /(?:é|ée|és|ées|i|ie|is|ies|u|ue|us|ues|it|ert|erte|ort|eint|aint|oint)$/u;
const MENT_NOUNS = new Set(["moment", "comment", "jugement", "logement", "sentiment", "mouvement", "bâtiment", "vêtement", "instrument", "appartement", "gouvernement", "événement", "évènement", "élément", "monument", "argument", "document", "traitement", "changement", "commencement", "testament", "serment", "régiment", "ment", "aliment", "tourment", "firmament", "parlement", "département", "compartiment", "fragment", "ornement", "segment", "sacrement", "châtiment", "dénouement", "raisonnement", "rassemblement", "étonnement", "isolement", "frottement", "grondement", "roulement", "battement", "hurlement", "gémissement", "craquement", "tremblement", "froissement", "aboiement", "agrément", "logement", "paiement", "supplément", "tempérament", "enseignement", "équipement", "amusement", "emplacement", "avertissement", "établissement", "divertissement", "rugissement", "jument", "piment", "ciment", "froment", "clément", "véhément", "dément"]);
const ADJECTIVE_SUFFIX = /(?:eux|euse|euses|ique|iques|able|ables|ible|ibles|if|ive|ifs|ives|al|ale|aux|ales|elle|elles|ain|aine|aines|ant|ante|ants|antes|ent|ente|ents|entes|eur|euse|âtre|esque)$/u;
const ADJ_EXCLUDE = new Set(["eux", "deux", "mieux", "lieux", "yeux", "cieux", "jeux", "feux", "cheveux", "neveux", "dieux", "vœux", "aux", "chevaux", "travaux", "animaux", "journaux", "oiseaux", "elle", "elles", "celle", "celles", "quelle", "laquelle", "nouvelles", "demain", "main", "pain", "train", "matin", "enfant", "enfants", "avant", "devant", "pendant", "cependant", "maintenant", "tant", "autant", "quant", "comment", "souvent", "dent", "dents", "argent", "vent", "cent", "gens", "moment", "sent", "ment", "fleur", "fleurs", "cœur", "heure", "peur", "sœur", "monsieur", "seigneur", "honneur", "bonheur", "malheur", "leur", "leurs", "chaleur", "couleur", "odeur", "douleur", "hauteur", "musique", "fabrique", "boutique", "chambre", "table", "diable", "sable", "fable", "étable", "cheval", "journal", "animal", "général", "capital", "signal", "canal", "bal", "mal", "val", "lui"]);
const READER_ADDRESS = new Set(["vous", "votre", "vos", "tu", "te", "toi", "ton", "ta", "tes", "lecteur", "lecteurs", "lectrice", "voyez-vous", "figurez-vous"]);

const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const sd = (values: number[]) => {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - 1));
};
const round = (value: number, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
const percentile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
};

/** Moving-average type-token ratio: vocabulary range independent of text length. */
export function mattr(tokens: string[], window = 100): number {
  const words = tokens.filter((token) => !token.endsWith("'"));
  if (words.length === 0) return 0;
  if (words.length <= window) return new Set(words).size / words.length;
  const counts = new Map<string, number>();
  for (let i = 0; i < window; i += 1) counts.set(words[i], (counts.get(words[i]) ?? 0) + 1);
  let total = counts.size / window;
  let windows = 1;
  for (let i = window; i < words.length; i += 1) {
    const out = words[i - window];
    const left = (counts.get(out) ?? 1) - 1;
    if (left === 0) counts.delete(out); else counts.set(out, left);
    counts.set(words[i], (counts.get(words[i]) ?? 0) + 1);
    total += counts.size / window;
    windows += 1;
  }
  return total / windows;
}

export function narrativeTenseCounts(narration: string) {
  const tokens = tokenize(narration);
  const counts = { passeSimple: 0, imparfait: 0, present: 0, passeCompose: 0, futur: 0 };
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const previous = tokens[i - 1] ?? "";
    const next = tokens[i + 1] ?? "";
    if (PS_ENDINGS.test(token) || PS_3S.has(token)) { counts.passeSimple += 1; continue; }
    if (SUBJECTS.has(previous) && token.length >= 4 && /a$/u.test(token) && !/ra$/u.test(token) && !NOT_PS_A.has(token)) { counts.passeSimple += 1; continue; }
    if (/^[\p{L}]{2,}(?:ait|aient)$/u.test(token) || ["étions", "étiez", "avions", "aviez"].includes(token)) {
      if (!["fait", "parfait", "souhait", "attrait", "portrait", "trait", "extrait", "retrait", "lait", "bienfait", "forfait", "plait"].includes(token)) { counts.imparfait += 1; continue; }
    }
    if (/(?:erai|eras|era|erons|erez|eront|irai|iras|ira|irons|irez|iront)$/u.test(token) && SUBJECTS.has(previous)) { counts.futur += 1; continue; }
    if (AUX.has(token) && SUBJECTS.has(previous) && PARTICIPLE.test(next) && next.length > 2) { counts.passeCompose += 1; i += 1; continue; }
    if (SUBJECTS.has(previous) && (PRESENT_IRREGULAR.has(token) || (/(?:e|es|ent)$/u.test(token) && token.length >= 3 && !["une", "elle", "elles", "ce", "se", "me", "te", "le", "ne", "que", "de"].includes(token)))) counts.present += 1;
  }
  return counts;
}

export function measureStyle(text: string): MeasuredStyle {
  const normalized = text.normalize("NFC").replace(/’/gu, "'");
  const tokens = tokenize(normalized);
  const wordTokens = tokens.filter((token) => !token.endsWith("'") || token.length > 1);
  const words = wordTokens.length || 1;
  const sentences = splitSentences(normalized);
  const sentenceLengths = sentences.map((sentence) => tokenize(sentence).length).filter((n) => n > 0);
  const paragraphLengths = paragraphs(normalized).map((p) => tokenize(p).length).filter((n) => n > 0);
  const { narration, dialogue } = splitDialogue(normalized);
  const dialogueWords = tokenize(dialogue).length;
  const tenseCounts = narrativeTenseCounts(narration);
  const tenseTotal = Object.values(tenseCounts).reduce((a, b) => a + b, 0) || 1;
  const narrationTokens = tokenize(narration);
  const per1000 = (n: number) => round((n / words) * 1000, 3);
  const adverbs = wordTokens.filter((t) => t.length > 5 && t.endsWith("ment") && !MENT_NOUNS.has(t)).length;
  const adjectives = wordTokens.filter((t) => t.length > 3 && ADJECTIVE_SUFFIX.test(t) && !ADJ_EXCLUDE.has(t)).length;
  const sentenceCount = sentences.length || 1;
  const functionWords: Record<string, number> = {};
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  for (const word of FUNCTION_WORDS) functionWords[word] = round(((counts.get(word) ?? 0) / words) * 1000, 3);
  const m = mean(sentenceLengths);
  return {
    words,
    sentences: sentences.length,
    sentenceLength: { mean: round(m, 2), sd: round(sd(sentenceLengths), 2), cv: round(m ? sd(sentenceLengths) / m : 0, 3), p90: percentile(sentenceLengths, 0.9) },
    paragraphLength: { mean: round(mean(paragraphLengths), 2), sd: round(sd(paragraphLengths), 2) },
    dialogueShare: round(dialogueWords / words, 3),
    narrativeTenses: {
      passeSimple: round(tenseCounts.passeSimple / tenseTotal, 3),
      imparfait: round(tenseCounts.imparfait / tenseTotal, 3),
      present: round(tenseCounts.present / tenseTotal, 3),
      passeCompose: round(tenseCounts.passeCompose / tenseTotal, 3),
      futur: round(tenseCounts.futur / tenseTotal, 3),
    },
    adverbMentPer1000: per1000(adverbs),
    adjectiveSuffixPer1000: per1000(adjectives),
    lexicalRange: round(mattr(wordTokens), 3),
    readerAddressPer1000: round((narrationTokens.filter((t) => READER_ADDRESS.has(t)).length / words) * 1000, 3),
    punctuation: {
      exclamationPerSentence: round((normalized.match(/!/gu) ?? []).length / sentenceCount, 3),
      questionPerSentence: round((normalized.match(/\?/gu) ?? []).length / sentenceCount, 3),
      commaPerSentence: round((normalized.match(/,/gu) ?? []).length / sentenceCount, 3),
      semicolonPer1000: per1000((normalized.match(/;/gu) ?? []).length),
      colonPer1000: per1000((normalized.match(/:/gu) ?? []).length),
      ellipsisPer1000: per1000((normalized.match(/…|\.\.\./gu) ?? []).length),
      dashPer1000: per1000((normalized.match(/\s[—–]\s/gu) ?? []).length),
    },
    functionWords,
  };
}

export type DeltaBasis = { words: string[]; mean: Record<string, number>; sd: Record<string, number> };

/** Mean and SD of each function-word frequency over a set of profiles (Burrows). */
export function buildDeltaBasis(profiles: MeasuredStyle[], words: readonly string[] = FUNCTION_WORDS): DeltaBasis {
  const basis: DeltaBasis = { words: [...words], mean: {}, sd: {} };
  for (const word of words) {
    const values = profiles.map((profile) => profile.functionWords[word] ?? 0);
    basis.mean[word] = round(mean(values), 4);
    basis.sd[word] = round(Math.max(sd(values), 0.05), 4);
  }
  return basis;
}

/** Burrows' Delta: mean absolute difference of z-scored function-word frequencies. Lower = closer. */
export function burrowsDelta(a: Record<string, number>, b: Record<string, number>, basis: DeltaBasis): number {
  let total = 0;
  for (const word of basis.words) {
    const z = (value: number) => (value - basis.mean[word]) / basis.sd[word];
    total += Math.abs(z(a[word] ?? 0) - z(b[word] ?? 0));
  }
  return total / basis.words.length;
}

/** Averages several measured profiles into one card profile (function words and scalar features). */
export function averageProfiles(profiles: MeasuredStyle[]): MeasuredStyle {
  if (profiles.length === 0) throw new Error("averageProfiles needs at least one profile");
  const avg = (pick: (profile: MeasuredStyle) => number, digits = 3) => round(mean(profiles.map(pick)), digits);
  const functionWords: Record<string, number> = {};
  for (const word of FUNCTION_WORDS) functionWords[word] = avg((p) => p.functionWords[word] ?? 0);
  return {
    words: profiles.reduce((a, p) => a + p.words, 0),
    sentences: profiles.reduce((a, p) => a + p.sentences, 0),
    sentenceLength: { mean: avg((p) => p.sentenceLength.mean, 2), sd: avg((p) => p.sentenceLength.sd, 2), cv: avg((p) => p.sentenceLength.cv), p90: avg((p) => p.sentenceLength.p90, 1) },
    paragraphLength: { mean: avg((p) => p.paragraphLength.mean, 2), sd: avg((p) => p.paragraphLength.sd, 2) },
    dialogueShare: avg((p) => p.dialogueShare),
    narrativeTenses: {
      passeSimple: avg((p) => p.narrativeTenses.passeSimple),
      imparfait: avg((p) => p.narrativeTenses.imparfait),
      present: avg((p) => p.narrativeTenses.present),
      passeCompose: avg((p) => p.narrativeTenses.passeCompose),
      futur: avg((p) => p.narrativeTenses.futur),
    },
    adverbMentPer1000: avg((p) => p.adverbMentPer1000),
    adjectiveSuffixPer1000: avg((p) => p.adjectiveSuffixPer1000),
    lexicalRange: avg((p) => p.lexicalRange),
    readerAddressPer1000: avg((p) => p.readerAddressPer1000),
    punctuation: {
      exclamationPerSentence: avg((p) => p.punctuation.exclamationPerSentence),
      questionPerSentence: avg((p) => p.punctuation.questionPerSentence),
      commaPerSentence: avg((p) => p.punctuation.commaPerSentence),
      semicolonPer1000: avg((p) => p.punctuation.semicolonPer1000),
      colonPer1000: avg((p) => p.punctuation.colonPer1000),
      ellipsisPer1000: avg((p) => p.punctuation.ellipsisPer1000),
      dashPer1000: avg((p) => p.punctuation.dashPer1000),
    },
    functionWords,
  };
}

export type StyleFit = { score: number; deviations: Array<{ feature: string; draft: number; card: number; note: string }> };

/**
 * Compares a short draft with a card's measured profile on the features that
 * survive short texts (sentence rhythm, dialogue share, narrative tense,
 * punctuation habits). Children's adaptations are allowed shorter sentences:
 * the target mean is capped by the grade band. Returns 0..1 (1 = close).
 */
export function styleFit(draft: MeasuredStyle, card: MeasuredStyle, options: { maxSentenceMean?: number } = {}): StyleFit {
  const deviations: StyleFit["deviations"] = [];
  const targetMean = Math.min(card.sentenceLength.mean, options.maxSentenceMean ?? Infinity);
  const checks: Array<[string, number, number, number, string]> = [
    ["sentenceLength.mean", draft.sentenceLength.mean, targetMean, Math.max(4, targetMean * 0.35), "longueur moyenne des phrases"],
    ["sentenceLength.cv", draft.sentenceLength.cv, card.sentenceLength.cv, 0.25, "variation de longueur des phrases"],
    ["dialogueShare", draft.dialogueShare, card.dialogueShare, 0.25, "part de dialogue"],
    ["narrativeTenses.passeSimple", draft.narrativeTenses.passeSimple, card.narrativeTenses.passeSimple, 0.3, "part du passé simple dans la narration"],
    ["narrativeTenses.present", draft.narrativeTenses.present, card.narrativeTenses.present, 0.3, "part du présent dans la narration"],
    ["punctuation.commaPerSentence", draft.punctuation.commaPerSentence, card.punctuation.commaPerSentence, Math.max(0.8, card.punctuation.commaPerSentence * 0.6), "virgules par phrase"],
  ];
  let total = 0;
  for (const [feature, value, target, tolerance, note] of checks) {
    const distance = Math.min(1, Math.abs(value - target) / tolerance);
    total += 1 - distance;
    if (distance >= 0.75) deviations.push({ feature, draft: round(value, 3), card: round(target, 3), note });
  }
  return { score: round(total / checks.length, 3), deviations };
}

/** Surface features z-scored alongside function words for author attribution. */
export function surfaceFeatures(profile: MeasuredStyle): Record<string, number> {
  return {
    "sentence.mean": profile.sentenceLength.mean,
    "sentence.cv": profile.sentenceLength.cv,
    "paragraph.mean": profile.paragraphLength.mean,
    dialogue: profile.dialogueShare,
    "tense.ps": profile.narrativeTenses.passeSimple,
    "tense.imp": profile.narrativeTenses.imparfait,
    "tense.pres": profile.narrativeTenses.present,
    adverbs: profile.adverbMentPer1000,
    adjectives: profile.adjectiveSuffixPer1000,
    range: profile.lexicalRange,
    address: profile.readerAddressPer1000,
    commas: profile.punctuation.commaPerSentence,
    semicolons: profile.punctuation.semicolonPer1000,
    exclamations: profile.punctuation.exclamationPerSentence,
    questions: profile.punctuation.questionPerSentence,
  };
}

export type AttributionBasis = { delta: DeltaBasis; surface: { mean: Record<string, number>; sd: Record<string, number> } };

export function buildAttributionBasis(profiles: MeasuredStyle[]): AttributionBasis {
  const surface = { mean: {} as Record<string, number>, sd: {} as Record<string, number> };
  const vectors = profiles.map(surfaceFeatures);
  for (const key of Object.keys(vectors[0] ?? {})) {
    const values = vectors.map((v) => v[key]);
    surface.mean[key] = round(mean(values), 4);
    surface.sd[key] = round(Math.max(sd(values), 1e-3), 4);
  }
  return { delta: buildDeltaBasis(profiles), surface };
}

/** Delta on function words plus z-distance on surface features (weight 0.35). Lower = closer. */
export function attributionDistance(a: MeasuredStyle, b: MeasuredStyle, basis: AttributionBasis): number {
  const delta = burrowsDelta(a.functionWords, b.functionWords, basis.delta);
  const va = surfaceFeatures(a);
  const vb = surfaceFeatures(b);
  const keys = Object.keys(basis.surface.mean);
  const surface = keys.reduce((total, key) => total + Math.abs((va[key] - vb[key]) / basis.surface.sd[key]), 0) / (keys.length || 1);
  return delta + 0.35 * surface;
}
