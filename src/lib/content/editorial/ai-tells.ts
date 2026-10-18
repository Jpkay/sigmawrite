/**
 * AI-tells checker for French children's prose (roadmap H.9).
 *
 * Deterministic part: phrase list, writing habits and measured signals.
 * Rubric part: LINE_EDITOR_RUBRIC, given to the line editor and the style
 * reviewer. The phrase list is meant to grow from editors' notes (H.15):
 * add an entry to AI_TELL_PHRASES with a short reason.
 *
 * Score: 0 (reads human) … 100 (full of tells). Thresholds live in
 * AI_TELL_THRESHOLDS and were calibrated on src/lib/content/editorial/fixtures.
 */
import { mattr, paragraphs, splitDialogue, splitSentences, tokenize } from "./stylometry";

export type AiTellFinding = { code: string; label: string; weight: number; evidence: string[] };
export type AiTellReport = {
  score: number;
  findings: AiTellFinding[];
  metrics: { words: number; sentenceCv: number; lexicalRange: number; repetition: number; clicheShare: number };
};

const UNICODE_BOUNDARY = "(?:(?<=[\\p{L}\\p{N}])(?![\\p{L}\\p{N}])|(?<![\\p{L}\\p{N}])(?=[\\p{L}\\p{N}]))";
/** JavaScript's \b is ASCII-only ("où", "été" break it); rebuild patterns with a Unicode word boundary. */
export function unicodeWordBoundaries(pattern: RegExp): RegExp {
  const flags = pattern.flags.includes("u") ? pattern.flags : `${pattern.flags}u`;
  return new RegExp(pattern.source.replace(/\\b/gu, UNICODE_BOUNDARY), flags);
}

type Phrase = { pattern: RegExp; label: string; weight: number; allowPer300?: number };

/** Phrases to avoid. `allowPer300`: occurrences tolerated per 300 words before it counts. */
export const AI_TELL_PHRASES: Phrase[] = [
  { pattern: /\bsoudain(?:ement)?\b/giu, label: "« Soudain » répété", weight: 4, allowPer300: 1 },
  { pattern: /\bau c(?:œ|oe)ur (?:de|du|des)\b/giu, label: "« Au cœur de »", weight: 5 },
  { pattern: /\bdans un monde où\b/giu, label: "« Dans un monde où »", weight: 8 },
  { pattern: /\bun (?:subtil )?mélange de\b/giu, label: "« un mélange de »", weight: 5 },
  { pattern: /\bune (?:danse|symphonie|cacophonie|tapisserie|ballet|kaléidoscope) d[e']/giu, label: "métaphore toute faite (danse, symphonie, tapisserie de…)", weight: 6 },
  { pattern: /\b(?:un|le) ballet d[e']/giu, label: "« un ballet de »", weight: 5 },
  { pattern: /\btémoignage (?:de|du|des)\b/giu, label: "« témoignage de »", weight: 5 },
  { pattern: /\bplong(?:er|ea|eait|é|ée|eant)s? dans\b/giu, label: "« plonger dans »", weight: 3, allowPer300: 1 },
  { pattern: /\bpalpitante?s?\b/giu, label: "« palpitant »", weight: 5 },
  { pattern: /\bmurmur(?:a|èrent|ait|aient|ant)\b/giu, label: "« murmura » répété", weight: 3, allowPer300: 1 },
  { pattern: /\bchuchot(?:a|èrent|ait|ant)\b/giu, label: "« chuchota » répété", weight: 3, allowPer300: 1 },
  { pattern: /\bun frisson (?:lui )?(?:parcour|travers)/giu, label: "« un frisson parcourut… »", weight: 5 },
  { pattern: /\ble c(?:œ|oe)ur battant\b/giu, label: "« le cœur battant »", weight: 4 },
  { pattern: /\b(?:une|d'une) lueur d[e'] ?(?:espoir|détermination|malice|curiosité)/giu, label: "« une lueur d'espoir / de détermination »", weight: 6 },
  { pattern: /\bcomme si le temps s'était arrêté\b/giu, label: "« comme si le temps s'était arrêté »", weight: 7 },
  { pattern: /\b(?:prit|prend|prenant) une (?:profonde|grande) inspiration\b/giu, label: "« prit une profonde inspiration »", weight: 5 },
  { pattern: /\bses yeux (?:brillaient|pétillaient|s'illuminèrent|scintillaient)\b/giu, label: "« ses yeux brillaient / pétillaient »", weight: 4 },
  { pattern: /\b(?:aventure|journée|expérience) inoubliable\b/giu, label: "« aventure inoubliable »", weight: 6 },
  { pattern: /\bune (?:étrange|drôle de) sensation\b/giu, label: "« une étrange sensation »", weight: 4 },
  { pattern: /\bc'est alors que\b/giu, label: "« C'est alors que »", weight: 2, allowPer300: 1 },
  { pattern: /\bprête? à relever (?:le|ce|tous les) défis?\b/giu, label: "« prêt à relever le défi »", weight: 6 },
  { pattern: /\b(?:plus forts?|plus fortes?) ensemble\b/giu, label: "« plus forts ensemble »", weight: 6 },
  { pattern: /\b(?:quelque chose de|une touche de) (?:magique|spécial)\b/giu, label: "« quelque chose de magique »", weight: 5 },
  { pattern: /\b(?:scintill|étincel|chatoy|irradi)\w*/giu, label: "lumière décorative (scintiller, étinceler…)", weight: 2, allowPer300: 1 },
  { pattern: /\benvelopp(?:a|ait|é|ée|és|ées|ant)\b/giu, label: "« enveloppé de »", weight: 2, allowPer300: 1 },
  { pattern: /\bvibrante?s?\b/giu, label: "« vibrant »", weight: 3 },
  { pattern: /\bun sourire aux lèvres\b/giu, label: "« un sourire aux lèvres »", weight: 4 },
  { pattern: /\ble silence (?:était|devint) (?:assourdissant|pesant)\b/giu, label: "« silence assourdissant / pesant »", weight: 5 },
  { pattern: /\b(?:résonn(?:a|ait|èrent|aient))\b/giu, label: "« résonna » décoratif", weight: 2, allowPer300: 1 },
  { pattern: /\bn'avait jamais (?:rien )?vu (?:une telle|un tel|pareil)\b/giu, label: "« n'avait jamais vu une telle… »", weight: 4 },
  { pattern: /\bdéterminée?s?\b/giu, label: "« déterminé »", weight: 3, allowPer300: 1 },
  { pattern: /\b(?:une|l') aventure (?:extraordinaire|incroyable|fantastique|épique)\b/giu, label: "« une aventure extraordinaire »", weight: 5 },
  { pattern: /\b(?:mystérieu(?:x|se|ses))\b/giu, label: "« mystérieux » répété", weight: 2, allowPer300: 1 },
  { pattern: /\bil était une fois,? dans un\b/giu, label: "ouverture générique", weight: 3 },
  { pattern: /\b(?:n'|ne )(?:était|est|étaient|sont|avait|a) (?:plus|pas)(?: seulement)? [^.;:!?]{1,50}[,:] ?(?:mais|c'était|il|elle|ils|elles)\b/giu, label: "antithèse « ce n'était pas X, mais Y »", weight: 4, allowPer300: 1 },
  { pattern: /\bet non (?:plus|pas) comme\b/giu, label: "« et non plus comme »", weight: 4 },
  { pattern: /\b(?:son|mon|ton|leur|le) c(?:œ|oe)ur (?:cognait|battait|bondit|se serra|s'emball|manqua|tambourin)\w*/giu, label: "cœur qui bat / cogne", weight: 3 },
  { pattern: /\b(?:le ventre|la gorge|l'estomac) (?:noué|serré|nouée|serrée)\b|\ble ventre serré\b/giu, label: "ventre / gorge noués", weight: 3 },
  { pattern: /\ben retenant son souffle\b|\bretint son souffle\b/giu, label: "« retint son souffle »", weight: 3 },
  { pattern: /\b(?:comprit|compris|réalisa|réalisé) (?:alors )?qu(?:e|')/giu, label: "« il comprit que »", weight: 4 },
  { pattern: /\btrop [\p{L}]+, trop [\p{L}]+/giu, label: "parallélisme « trop X, trop Y »", weight: 3 },
  { pattern: /\bpour la première fois de (?:sa|ma|ta) vie\b|\bsans même s'en rendre compte\b/giu, label: "formule de bascule", weight: 4 },
  { pattern: /\bs'élan(?:ça|çait|cèrent)\b/giu, label: "« s'élança »", weight: 2, allowPer300: 1 },
];

/** Overused generated names (Léa/Lucas everywhere) and made-up fantasy names. */
export const OVERUSED_NAMES = new Set(["léa", "lucas", "emma", "tom", "max", "lily", "zoé", "luna", "chloé", "nathan", "inès", "théo", "léo", "elara", "lyra", "aria", "kael", "zéphyr", "orion", "nova", "sylas", "thorne", "elio", "aurora", "selene", "séléné", "eldric", "zara", "kaïa", "mira", "lumina", "astra"]);

const SENSORY = unicodeWordBoundaries(/\b(?:odeur|sent(?:ait|ir|it)|parfum|goût|salé|sucré|amer|âcre|rugueu|lisse|gluant|poisseu|collant|humide|mouillé|tiède|glacé|brûlant|froid|chaud|poussière|boue|graisse|sueur|craqu|grinç|claqu|crépit|siffl|bourdonn|ronfl|gronde|cliquet|piqu|râp|frott|chatouill|pâteu|croustill|fum[ée])\w*/giu);
const NAMED_EMOTION = unicodeWordBoundaries(/\b(?:se sent(?:ait|it|ant)|ressent(?:it|ait)|éprouv(?:a|ait)|un sentiment d[e']|une vague d[e']|submergée? par|envahie? par|rempli(?:e)? d[e'] ?(?:joie|fierté|tristesse|peur|colère|espoir))/giu);
const EMOTION_WORD = unicodeWordBoundaries(/\b(?:heureu(?:x|se)|triste|joie|fierté|tristesse|excitée?|excitation|nerveu(?:x|se)|anxieu(?:x|se)|soulagée?|soulagement|émerveillée?|émerveillement|ravie?)\b/giu);
const MORAL_END = unicodeWordBoundaries(/(?:comprit|compris|comprend|apprit|appris|savait (?:désormais|maintenant)|réalis(?:a|é)) (?:que|qu')|\bla (?:vraie|véritable) (?:richesse|force|magie|valeur)|\bl'(?:amitié|important|essentiel)\b.{0,40}\b(?:c'est|était|reste)|\bn'oublierai(?:t|ent)? jamais\b|\bplus forts? ensemble\b|\bleçon\b/iu);
const TIDY_END = unicodeWordBoundaries(/\bce (?:soir|jour|matin)-là\b|\bavait grandi\b|\bbien mieux\b|\bpour toujours\b|\bne faisait que commencer\b|\bcommençait à peine\b|\bplus jamais (?:la|le) même\b|\bles plus (?:beaux|belles|grands|grandes) [^.]{0,40}\b(?:sont|ne sont)\b/iu);
const TRIAD = unicodeWordBoundaries(/\b[\p{L}'-]+(?: [\p{L}'-]+){0,2}, [\p{L}'-]+(?: [\p{L}'-]+){0,2},? et [\p{L}'-]+/gu);
const ADJ = "(?:[\\p{L}]+(?:eux|euse|euses|ant|ante|ants|antes|é|ée|és|ées|if|ive|ifs|ives|ique|iques|ble|bles|al|ale|ales|ux|ent|ente|ents|entes|eur|elle|elles))";
const ADJ_PAIR = unicodeWordBoundaries(new RegExp(`\\b${ADJ} et ${ADJ}\\b`, "gu"));

export const AI_TELL_THRESHOLDS = {
  /** Live chapters with a score at or above this go back to the line editor; a second failure falls back. */
  live: 20,
  /** Library texts must stay below this (stricter). */
  library: 12,
};

const cvOf = (values: number[]) => {
  if (values.length < 2) return 1;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1));
  return mean ? sd / mean : 0;
};

export function checkAiTells(text: string): AiTellReport {
  const normalized = text.normalize("NFC").replace(/’/gu, "'");
  const tokens = tokenize(normalized).filter((t) => !t.endsWith("'"));
  const words = Math.max(tokens.length, 1);
  const per100 = (n: number) => (n / words) * 100;
  const scale300 = Math.max(1, words / 300);
  const findings: AiTellFinding[] = [];
  const add = (code: string, label: string, weight: number, evidence: string[]) => { if (weight > 0) findings.push({ code, label, weight: Math.round(weight * 10) / 10, evidence: evidence.slice(0, 4) }); };

  // 1. Phrases.
  let clicheHits = 0;
  for (const phrase of AI_TELL_PHRASES) {
    const hits = normalized.match(unicodeWordBoundaries(phrase.pattern)) ?? [];
    const excess = hits.length - Math.floor((phrase.allowPer300 ?? 0) * scale300);
    if (excess > 0) {
      clicheHits += excess;
      add(`phrase:${phrase.label}`, phrase.label, phrase.weight * excess, hits);
    }
  }

  const sentences = splitSentences(normalized);
  const sentenceLengths = sentences.map((s) => tokenize(s).length).filter((n) => n > 0);
  const sentenceCv = cvOf(sentenceLengths);
  const paras = paragraphs(normalized);
  const { narration, dialogue } = splitDialogue(normalized);

  // 2. Habits.
  const triads = normalized.match(TRIAD) ?? [];
  if (per100(triads.length) > 1.2) add("habit:triads", "listes de trois partout", 3 * (triads.length - Math.floor(words / 100)), triads);

  const ending = sentences.slice(-2).join(" ");
  if (MORAL_END.test(ending)) add("habit:moral", "morale ou leçon finale", 14, [ending.slice(0, 160)]);
  else if (TIDY_END.test(sentences.slice(-3).join(" "))) add("habit:tidy_ending", "fin trop bouclée (« ce soir-là… », « il avait grandi »)", 8, [ending.slice(0, 160)]);

  const named = narration.match(NAMED_EMOTION) ?? [];
  const emotionWords = narration.match(EMOTION_WORD) ?? [];
  const emotionRate = per100(named.length * 2 + emotionWords.length);
  if (emotionRate > 1.2) add("habit:named_emotions", "émotions nommées au lieu d'être montrées", 4 * (emotionRate - 1.2) + 4, [...named, ...emotionWords]);

  const narrationLengths = splitSentences(narration).map((s) => tokenize(s).length).filter((n) => n > 0);
  const narrationCv = cvOf(narrationLengths);
  if (narrationLengths.length >= 8 && narrationCv < 0.38) add("habit:uniform_sentences", "phrases toutes de la même longueur", (0.38 - narrationCv) * 60 + 4, [`variation ${narrationCv.toFixed(2)}`]);

  const narrativeParas = paras.filter((p) => !/^[—–«-]/u.test(p));
  if (narrativeParas.length >= 4) {
    const punchy = narrativeParas.filter((p) => {
      const s = splitSentences(p);
      const last = s[s.length - 1] ?? "";
      return s.length >= 2 && tokenize(last).length <= 7;
    });
    if (punchy.length / narrativeParas.length > 0.6) add("habit:punchlines", "chaque paragraphe finit sur une formule", 6, punchy.map((p) => splitSentences(p).slice(-1)[0] ?? ""));
    const oneLiners = narrativeParas.filter((p) => tokenize(p).length <= 6);
    if (oneLiners.length >= 2) add("habit:one_liners", "paragraphes d'une ligne pour faire effet", 3 * oneLiners.length, oneLiners);
    const paraCv = cvOf(narrativeParas.map((p) => tokenize(p).length));
    if (paraCv < 0.22) add("habit:balanced_paragraphs", "paragraphes trop réguliers", 5, [`variation ${paraCv.toFixed(2)}`]);
  }

  const pairs = normalized.match(ADJ_PAIR) ?? [];
  if (per100(pairs.length) > 0.6) add("habit:adjective_pairs", "adjectifs par paires", 3 * pairs.length, pairs);

  const lines = paragraphs(dialogue).filter((p) => /^[—–-]/u.test(p));
  if (lines.length >= 4) {
    const lineCv = cvOf(lines.map((l) => tokenize(l).length));
    if (lineCv < 0.3) add("habit:symmetric_dialogue", "dialogue trop net et symétrique", 6, lines.slice(0, 3));
  }

  const sensory = normalized.match(SENSORY) ?? [];
  if (words >= 120 && per100(sensory.length) < 0.4) add("habit:no_senses", "aucun détail sensoriel concret", sensory.length === 0 ? 6 : 3, [`${sensory.length} détail(s) sensoriel(s)`]);

  const names = (normalized.match(/(?<![\p{L}])\p{Lu}[\p{Ll}éèêëïîôûç]+(?![\p{L}])/gu) ?? []).filter((n) => OVERUSED_NAMES.has(n.toLocaleLowerCase("fr")));
  if (names.length) add("habit:overused_names", "prénoms surutilisés ou fantasy générique", 6 + new Set(names).size * 2, [...new Set(names)]);

  const incises = narration.match(/\s[—–]\s/gu) ?? [];
  if (per100(incises.length) > 1) add("habit:dashes", "trop de tirets d'incise", 2 * (incises.length - Math.floor(words / 100)), [`${incises.length} tirets`]);
  const semicolons = normalized.match(/;/gu) ?? [];
  if (per100(semicolons.length) > 2) add("habit:semicolons", "trop de points-virgules", semicolons.length - Math.floor((2 * words) / 100), [`${semicolons.length} points-virgules`]);

  // 3. Measured signals.
  const contentWords = tokens.filter((t) => t.length >= 5);
  const counts = new Map<string, number>();
  for (const t of contentWords) counts.set(t, (counts.get(t) ?? 0) + 1);
  const repeated = [...counts.entries()].filter(([, n]) => n >= Math.max(3, Math.ceil(words / 90)));
  const repetition = contentWords.length ? repeated.reduce((a, [, n]) => a + n, 0) / contentWords.length : 0;
  if (repetition > 0.12) add("measure:repetition", "mots répétés", (repetition - 0.12) * 60, repeated.map(([w]) => w));
  const range = mattr(tokens);
  if (words >= 150 && range < 0.62) add("measure:lexical_range", "vocabulaire peu varié", (0.62 - range) * 80, [`MATTR ${range.toFixed(2)}`]);

  const raw = findings.reduce((a, f) => a + f.weight, 0);
  // Normalise by length so a long text is not punished for being long.
  const score = Math.min(100, Math.round(raw / Math.max(1, Math.sqrt(words / 250))));
  return {
    score,
    findings: findings.sort((a, b) => b.weight - a.weight),
    metrics: { words, sentenceCv: Number(sentenceCv.toFixed(3)), lexicalRange: Number(range.toFixed(3)), repetition: Number(repetition.toFixed(3)), clicheShare: Number((clicheHits / Math.max(1, sentences.length)).toFixed(3)) },
  };
}

/** Rubric given to the line editor and the style reviewer (French, used verbatim in prompts). */
export const LINE_EDITOR_RUBRIC = `Grille anti-tics d'écriture artificielle (à appliquer phrase par phrase) :
1. Formules usées interdites : « Soudain » (une fois au plus), « Au cœur de », « Dans un monde où », « un mélange de », « une danse / symphonie / tapisserie de », « témoignage de », « plonger dans », « palpitant », « un frisson parcourut », « le cœur battant », « une lueur d'espoir », « prit une profonde inspiration », « ses yeux brillaient », « aventure inoubliable », « prêt à relever le défi », « plus forts ensemble », « quelque chose de magique ». Remplace-les par un détail précis propre à cette scène.
2. Pas de listes de trois réflexes (« courageux, malin et généreux »). Une seule chose bien choisie vaut mieux que trois.
3. Pas de morale finale, pas de « il comprit que… », pas de leçon sur l'amitié ou le courage. La fin s'arrête sur une image, un geste ou une réplique.
4. Montre les émotions par des gestes, des objets, des sensations ; ne les nomme pas (« il était triste », « une vague de joie »).
5. Varie la longueur des phrases : des très courtes, des longues, au rythme de l'action et du style de l'auteur.
6. Ne termine pas chaque paragraphe par une formule frappante. Les paragraphes ne sont pas tous de la même taille.
7. Pas d'adjectifs par paires (« sombre et silencieux »). Un adjectif juste, ou un verbe plus fort.
8. Dialogue vivant : répliques de longueurs inégales, interruptions, sous-entendus ; pas d'échanges symétriques où chacun explique ce qu'il ressent. « dit-il » suffit, ou rien.
9. Au moins deux détails sensoriels concrets et inattendus (odeur, texture, bruit, température), propres à l'univers de l'élève.
10. Prénoms : jamais Léa, Lucas, Emma, Tom, Luna… ni noms de fantasy inventés (Elara, Kael…). Choisis des prénoms français ou du monde, simples et crédibles, ou des surnoms.
11. Peu de tirets d'incise et de points-virgules (sauf si le style de l'auteur les réclame).`;
