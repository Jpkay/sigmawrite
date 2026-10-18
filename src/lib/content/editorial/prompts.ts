import { z } from "zod";
import { LINE_EDITOR_RUBRIC } from "./ai-tells";
import type { EditorialBrief } from "./brief";
import { rubricAnchors, rubricPrompt, rubricScoresSchema } from "./rubric";
import type { StyleCard } from "./styles";
import { HERO_PLACEHOLDER, TENSE_LABELS, type GradeBand, type TenseKey } from "./types";
import { interestPhrase } from "@/lib/content/interests";

/**
 * Versioned prompts and structured outputs of every editorial role (H.10).
 * Bump PROMPT_VERSIONS when a prompt changes: runs record the version, and
 * the blind panel (H.12) is re-run per pipeline version.
 */
export const PROMPT_VERSIONS = {
  architect: "architect-1",
  author: "author-2",
  line_editor: "line-editor-1",
  reviewer_style: "reviewer-style-1",
  reviewer_targets: "reviewer-targets-1",
  reviewer_proof: "reviewer-proof-1",
  reviewer_safety: "reviewer-safety-1",
  reviewer_dictation: "reviewer-dictation-2",
  judge_pairwise: "judge-pairwise-1",
  editor_in_chief: "chief-1",
  auditor: "auditor-1",
  summarizer: "summarizer-1",
  practice_writer: "live-sentence-1",
} as const;

const AGE: Record<GradeBand, string> = { cm: "9 à 11 ans (CM1–CM2)", "6e-5e": "11 à 13 ans (6e–5e)", "4e-3e": "13 à 15 ans (4e–3e)", lycee: "15 à 18 ans (2de–Terminale)" };
const tenseList = (tenses: TenseKey[]) => tenses.map((t) => TENSE_LABELS[t]).join(", ");

// ───────────────────────── Output schemas ─────────────────────────

const tenseKey = z.enum(["present", "imparfait", "passe_compose", "futur_simple", "passe_simple", "conditionnel_present", "subjonctif_present", "imperatif_present", "plus_que_parfait"]);
// Models overshoot limits; long fields are trimmed and long lists capped instead of failing the whole call.
const txt = (max: number, min = 0) => z.string().min(min).transform((value) => value.trim().slice(0, max));
const list = <T extends z.ZodTypeAny>(item: T, max: number, min = 0) => z.array(item).min(min).transform((items) => items.slice(0, max));
const tenseKeys = (max: number) => z.array(z.string()).transform((items) => items.filter((t): t is z.infer<typeof tenseKey> => tenseKey.safeParse(t).success).slice(0, max));
const clamp = (min: number, max: number) => z.coerce.number().transform((n) => Math.min(max, Math.max(min, Math.round(n))));
const score = z.coerce.number().transform((n) => Math.min(5, Math.max(1, n)));

export const sagaOutlineSchema = z.object({
  title: txt(80, 2),
  logline: txt(500, 10),
  setting: txt(700, 10),
  heroRole: txt(400, 5),
  cast: list(z.object({ name: txt(40, 2), role: txt(200), trait: txt(240), voice: txt(240) }), 6, 2),
  stages: list(z.object({ chapter: z.coerce.number().int().min(1).max(10), beat: txt(500, 10), tension: clamp(1, 5) }), 10, 3),
  endings: list(z.object({ key: txt(20, 1), summary: txt(500, 10) }), 3, 2),
  tensePlan: list(z.object({ chapter: z.coerce.number().int().min(1).max(10), tenses: tenseKeys(2) }), 10),
  motifs: list(txt(200), 5).default([]),
  avoid: list(txt(240), 8).default([]),
});
export type SagaOutline = z.infer<typeof sagaOutlineSchema>;

export const tenseEvidenceSchema = z.object({ form: txt(60, 1), lemma: txt(40, 2), tense: z.string() });
const evidenceList = z.array(tenseEvidenceSchema).transform((items) => items.filter((e) => tenseKey.safeParse(e.tense).success).slice(0, 12) as Array<{ form: string; lemma: string; tense: z.infer<typeof tenseKey> }>);

export const authorOutputSchema = z.object({
  title: txt(90, 1),
  body: z.string().min(40),
  tenseEvidence: evidenceList.default([]),
  targetUsage: list(z.object({ lemma: z.string(), sentence: z.string() }), 10).default([]),
  choices: list(z.object({ label: txt(90, 3), intent: txt(300) }), 2).default([]),
  chapterSummary: txt(400).default(""),
  questions: list(z.object({
    questionText: z.string().min(5),
    questionType: z.enum(["literal", "vocabulary_in_context", "inference", "main_idea", "cause_consequence"]),
    choices: z.array(z.string().min(1)).length(3),
    correctAnswer: z.string().min(1),
    explanation: txt(400).default(""),
  }), 5).default([]),
  /** H.3: a short extra moment of the chapter, unlocked by a right first answer. Chapters only; gated in chapter-extras.ts. */
  bonusScene: txt(1500).default(""),
});
export type AuthorOutput = z.infer<typeof authorOutputSchema>;

export const lineEditOutputSchema = z.object({
  body: z.string().min(40),
  tenseEvidence: evidenceList.default([]),
  changes: list(txt(300), 20).default([]),
});
export type LineEditOutput = z.infer<typeof lineEditOutputSchema>;

export const styleReviewSchema = z.object({ rubric: rubricScoresSchema, strengths: list(txt(300), 5).default([]), notes: list(txt(400), 8).default([]) });
export const targetsReviewSchema = z.object({ naturalness: score, contextHelpsMeaning: z.boolean(), notes: list(txt(400), 6).default([]) });
export const proofReviewSchema = z.object({ languageScore: score, issues: list(z.object({ excerpt: txt(200), problem: txt(300), fix: txt(200) }), 12).default([]) });
export const safetyReviewSchema = z.object({ safe: z.boolean(), ageAppropriate: z.boolean(), concerns: list(txt(300), 6).default([]) });
export const dictationReviewSchema = z.object({ readAloudScore: score, ambiguousHomophones: list(txt(120), 8).default([]), tongueTwisters: list(txt(120), 8).default([]), segmentIssues: list(txt(200), 8).default([]), notes: list(txt(300), 6).default([]) });
export const pairwiseSchema = z.object({ winner: z.enum(["A", "B"]), margin: z.string().default("léger"), reasons: list(txt(300), 4).default([]) });
export const rewriteBriefSchema = z.object({ instructions: list(txt(400), 8, 1) });

// ───────────────────────── Shared blocks ─────────────────────────

export function styleBlock(style: StyleCard, band: GradeBand): string {
  const h = style.human;
  const m = style.measured;
  const measured = m ? `Mesures du corpus authentique (à respecter en proportion, pas au chiffre près) :
- phrases : ${m.sentenceLength.mean} mots en moyenne, variation ${m.sentenceLength.cv} (forte variation = mélange de phrases très courtes et longues) ;
- dialogue : environ ${Math.round(m.dialogueShare * 100)} % des mots ;
- narration : passé simple ${Math.round(m.narrativeTenses.passeSimple * 100)} %, imparfait ${Math.round(m.narrativeTenses.imparfait * 100)} %, présent ${Math.round(m.narrativeTenses.present * 100)} % ;
- ${m.punctuation.commaPerSentence} virgules par phrase, ${m.punctuation.exclamationPerSentence} point d'exclamation par phrase ;
- adresse directe au lecteur : ${m.readerAddressPer1000 > 5 ? "fréquente" : m.readerAddressPer1000 > 1.5 ? "occasionnelle" : "rare"}.` : "Pas de mesures : auteur décrit seulement par ses traits.";
  const excerpts = style.legal.textInPrompts && style.excerpts.length
    ? `Extraits authentiques (domaine public) pour te mettre l'oreille dans le ton. Ne recopie jamais une phrase ni un nom de personnage :\n${style.excerpts.slice(0, 2).map((e) => `« ${e.text} »`).join("\n")}`
    : "Aucun texte de cet auteur n'est fourni (droits) : n'en cite ni n'en imite aucune phrase, aucun personnage, aucun titre.";
  return `STYLE : à la manière de ${style.displayName} (${style.era}), adapté à des lecteurs de ${AGE[band]}.
Voix : ${h.voix}
Humour : ${h.humour}
Images : ${h.images}
Scènes typiques : ${h.scenesTypiques.join(" ; ")}
Rythme : ${h.rythme}
Procédés : ${h.procedes.join(" ; ")}
Ce que cet auteur ne fait jamais : ${h.jamais.join(" ; ")}
Adaptation jeunesse : ${h.adaptationJeunesse}
${measured}
${excerpts}`;
}

function heroRules(brief: EditorialBrief): string {
  if (!brief.hero) return "Pas de héros nommé : n'invente pas de prénom pour l'élève.";
  if (brief.narration === "tu") return `Le héros est l'élève lui-même, raconté à la deuxième personne (« tu »). N'invente jamais son prénom. Si un personnage l'appelle par son nom, écris exactement ${HERO_PLACEHOLDER}. Accords qui dépendent du genre du héros : {{m:forme masculine|f:forme féminine}} (ex. « tu es {{m:prêt|f:prête}} »).`;
  return `Le héros est l'élève, désigné uniquement par ${HERO_PLACEHOLDER} (jamais un prénom inventé). Accords qui dépendent de son genre : {{m:forme masculine|f:forme féminine}} (ex. « ${HERO_PLACEHOLDER} était {{m:épuisé|f:épuisée}} »).`;
}

function targetsBlock(brief: EditorialBrief): string {
  const lemmas = brief.targetLemmas.map((l) => `- « ${l.lemma} »${l.kind === "new" ? " (mot nouveau : le contexte doit laisser deviner son sens)" : " (mot déjà rencontré : réemploi naturel)"}${l.definition ? ` — sens visé : ${l.definition}` : ""}`).join("\n");
  return `MOTS CIBLES (chacun au moins une fois, sous n'importe quelle forme fléchie, sans le mettre en valeur ni le définir) :
${lemmas || "- aucun"}
TEMPS CIBLES : ${tenseList(brief.targetTenses)}. Emploie-les là où ils sont naturels dans le récit (au moins deux verbes par temps cible) et déclare-les dans tenseEvidence (forme exacte telle qu'écrite, infinitif, temps). Le conjugueur vérifiera chaque déclaration.`;
}

const SAFETY = `SÉCURITÉ ET RESPECT : public mineur. Pas de violence détaillée, pas de sang, pas de romance au-delà de l'amitié, pas d'alcool, de tabac ni de drogue, pas de peur durable. Pas de personnes réelles (joueurs, artistes, youtubeurs), pas de personnages, titres ou marques existants (mangas, jeux, clubs) : invente des équivalents crédibles. Aucun stéréotype de genre, d'origine ou de handicap. Aucune donnée personnelle, aucune école ou adresse réelle.`;

const UNIVERSE = (interests: string[]) => `UNIVERS DE L'ÉLÈVE : ${interests.map(interestPhrase).join(", ")}. C'est la raison pour laquelle l'élève lit : traite cet univers de l'intérieur, avec le vocabulaire juste et les détails qu'un vrai passionné reconnaîtrait (gestes, objets, sensations, codes), sans jamais l'expliquer comme un documentaire.`;

// ───────────────────────── Role prompts ─────────────────────────

export function architectPrompt(brief: EditorialBrief, style: StyleCard, chapterCount: number) {
  return {
    system: `Tu es architecte de sagas pour une maison d'édition jeunesse exigeante. Tu conçois une histoire à choix en ${chapterCount} chapitres dont l'élève est le héros. Chaque chapitre se termine par deux choix ; l'histoire garde une direction et mène à l'une de 2 ou 3 fins satisfaisantes, quel que soit le chemin.
${styleBlock(style, brief.gradeBand)}
${UNIVERSE(brief.interests)}
${SAFETY}
Les temps travaillés doivent suivre le programme de l'âge : ${tenseList(brief.targetTenses)} en priorité.
Le héros n'a pas de prénom dans le plan (c'est « le héros »). Les autres personnages ont des prénoms simples et crédibles (jamais Léa, Lucas, Emma, Léo, Tom, Luna, ni noms de fantasy génériques).
Sois concis : chaque champ tient en une ou deux phrases (le plan sert d'aide-mémoire à l'auteur, pas de texte littéraire ici).
Réponds uniquement en JSON : { "title", "logline", "setting", "heroRole", "cast": [{"name","role","trait","voice"}], "stages": [{"chapter","beat","tension"}] (un par chapitre, ${chapterCount} au total), "endings": [{"key","summary"}], "tensePlan": [{"chapter","tenses"}], "motifs": [objets ou images qui reviennent], "avoid": [pièges à éviter pour cette histoire] }. Les clés de temps sont : ${Object.keys(TENSE_LABELS).join(", ")}.`,
    user: JSON.stringify({ interests: brief.interests, age: AGE[brief.gradeBand], chapterCount, narration: brief.narration }),
  };
}

export type ChapterContext = {
  outline: SagaOutline | null;
  chapterIndex: number;
  chapterCount: number;
  storySoFar: string;
  previousChoice: string | null;
  bridge?: string | null;
};

export function authorPrompt(brief: EditorialBrief, style: StyleCard, context: ChapterContext | null) {
  const kindRules = brief.kind === "chapter"
    ? `CHAPITRE ${context?.chapterIndex ?? 1} sur ${context?.chapterCount ?? 8}. Il fait avancer l'étape prévue par le plan et tient compte du dernier choix de l'élève. ${context && context.chapterIndex >= context.chapterCount ? "C'est le DERNIER chapitre : il mène à l'une des fins du plan, sans choix ni cliffhanger (choices = [])." : "Il se termine sur un moment suspendu qui appelle exactement deux choix, réels et différents, tous deux compatibles avec le plan (choices : 2 éléments, label court à la 2e personne, intent = ce que ce choix entraîne)."} chapterSummary : deux phrases neutres pour la mémoire de la saga. questions : exactement 1 question de compréhension à 3 choix sur un fait que ce chapitre dit clairement (questionType literal ou cause_consequence), courte (une phrase finissant par « ? »), trois réponses courtes et nettement différentes, une seule bonne réponse recopiée exactement dans correctAnswer et formulée avec les mots du texte, explanation : une phrase courte et bienveillante, pour un lecteur de ${AGE[brief.gradeBand]}, qui dit où le texte le montre. bonusScene : une scène bonus de 3 à 5 phrases (40 à 100 mots), un moment en plus de ce chapitre (un détail, un personnage déjà présent, ce qui se passe ailleurs au même instant), agréable à lire mais pas nécessaire à l'intrigue ; même style, mêmes marqueurs de héros, aucun nouveau personnage nommé, aucune morale.`
    : brief.kind === "passage"
      ? "TEXTE DE LECTURE autonome (début, tension, fin ouverte ou chute), avec un titre. choices = [], bonusScene = ''. questions : 4 questions de compréhension à 3 choix (une littérale, une d'inférence, une de vocabulaire en contexte sur un mot cible, une de cause/conséquence), une seule bonne réponse recopiée exactement dans correctAnswer. chapterSummary = une phrase."
      : "DICTÉE : un texte court qui se lit bien à voix haute, phrases complètes et nettes, sans dialogue à tirets, sans noms propres difficiles, sans chiffres ni sigles, sans homophones ambigus non voulus ni enchaînements de sons difficiles. choices = [], questions = [], bonusScene = ''. chapterSummary = une phrase.";
  return {
    system: `Tu es un écrivain de littérature jeunesse française de tout premier plan. Tu écris un texte original qui pourrait figurer dans une anthologie publiée.
${styleBlock(style, brief.gradeBand)}
${UNIVERSE(brief.interests)}
${heroRules(brief)}
${targetsBlock(brief)}
LONGUEUR : ${brief.lengthWords.min} à ${brief.lengthWords.max} mots. LISIBILITÉ : phrases de ${brief.readabilityTarget.maxAverageSentenceWords} mots en moyenne au plus pour cet âge (la variation reste forte), aucune phrase au-delà de ${brief.readabilityTarget.maxSentenceWords} mots.
${kindRules}
${SAFETY}
${LINE_EDITOR_RUBRIC}
Typographie française : guillemets « », tiret cadratin pour les répliques en début de ligne, paragraphes séparés par une ligne vide.
Réponds uniquement en JSON : { "title", "body", "tenseEvidence": [{"form","lemma","tense"}], "targetUsage": [{"lemma","sentence"}], "choices": [{"label","intent"}], "chapterSummary", "questions": [{"questionText","questionType","choices","correctAnswer","explanation"}], "bonusScene" }.`,
    user: JSON.stringify({
      plan: context?.outline ?? null,
      étapeDuChapitre: context?.outline?.stages.find((s) => s.chapter === context.chapterIndex) ?? null,
      histoireJusquIci: context?.storySoFar || null,
      dernierChoixDeLEleve: context?.previousChoice ?? null,
      phraseDeRaccord: context?.bridge ?? null,
      motsCibles: brief.targetLemmas.map((l) => l.lemma),
      tempsCibles: brief.targetTenses,
    }),
  };
}

export function rewritePrompt(brief: EditorialBrief, style: StyleCard, context: ChapterContext | null, draft: AuthorOutput, instructions: string[]) {
  const base = authorPrompt(brief, style, context);
  return {
    system: `${base.system}\n\nTu reprends ton texte selon les consignes de l'éditeur en chef. Garde ce qui fonctionne ; corrige précisément ce qui est demandé ; ne raccourcis pas l'histoire.`,
    user: `${base.user}\n\nTEXTE ACTUEL (JSON) :\n${JSON.stringify(draft)}\n\nCONSIGNES DE RÉÉCRITURE :\n${instructions.map((i) => `- ${i}`).join("\n")}`,
  };
}

export function lineEditorPrompt(brief: EditorialBrief, style: StyleCard, draft: AuthorOutput, findings: string[]) {
  return {
    system: `Tu es correcteur et éditeur de ligne dans une grande maison d'édition jeunesse. Tu ne changes pas l'histoire : tu travailles la phrase. Tu traques les tics d'écriture artificielle, tu resserres, tu varies le rythme, tu remplaces chaque cliché par un détail concret propre à cette scène, et tu ramènes le texte vers la voix de ${style.displayName}.
${styleBlock(style, brief.gradeBand)}
${LINE_EDITOR_RUBRIC}
Contraintes intangibles : garde chaque mot cible (${brief.targetLemmas.map((l) => `« ${l.lemma} »`).join(", ") || "aucun"}) et les temps cibles (${tenseList(brief.targetTenses)}) ; garde exactement les marqueurs ${HERO_PLACEHOLDER} et {{m:…|f:…}} ; reste entre ${brief.lengthWords.min} et ${brief.lengthWords.max} mots ; phrases de ${brief.readabilityTarget.maxAverageSentenceWords} mots en moyenne au plus ; mêmes deux choix finaux implicites. Mets à jour tenseEvidence pour qu'elle corresponde exactement au texte final.
Réponds uniquement en JSON : { "body", "tenseEvidence": [{"form","lemma","tense"}], "changes": [ce que tu as changé et pourquoi, en bref] }.`,
    user: `Repérages automatiques à traiter en priorité :\n${findings.length ? findings.map((f) => `- ${f}`).join("\n") : "- aucun"}\n\nTEXTE :\n${draft.body}`,
  };
}

export function styleReviewerPrompt(brief: EditorialBrief, style: StyleCard, body: string) {
  return {
    system: `Tu es critique littéraire pour la jeunesse, très exigeant, et tu notes un texte destiné à des lecteurs de ${AGE[brief.gradeBand]}, écrit à la manière de ${style.displayName}.
${styleBlock(style, brief.gradeBand)}
${rubricPrompt()}
${rubricAnchors()}
Réponds uniquement en JSON : { "rubric": { "voice", "concreteness", "rhythm", "dialogue", "showDontTell", "surprise", "noMoralizing", "vocabulary", "language" }, "strengths": [..], "notes": [corrections précises et applicables, citant le passage] }.`,
    user: body,
  };
}

export function targetsReviewerPrompt(brief: EditorialBrief, body: string) {
  return {
    system: `Tu es didacticien du français. Tu vérifies si les mots cibles sont employés naturellement, dans un contexte qui aide un élève de ${AGE[brief.gradeBand]} à en comprendre le sens, sans effet « exercice ». Tu ne juges ni l'orthographe ni les temps (un programme le fait).
Mots cibles : ${brief.targetLemmas.map((l) => `« ${l.lemma} »${l.definition ? ` (${l.definition})` : ""}`).join(", ") || "aucun"}.
Réponds uniquement en JSON : { "naturalness": 1-5, "contextHelpsMeaning": true|false, "notes": [..] }.`,
    user: body,
  };
}

export function proofReviewerPrompt(body: string) {
  return {
    system: `Tu es correcteur d'édition. Relève toutes les fautes d'accord, de conjugaison, d'orthographe, de ponctuation et de typographie française dans ce texte. Ignore les marqueurs {{HEROS}} et {{m:…|f:…}}. Ne propose pas de changements de style.
Réponds uniquement en JSON : { "languageScore": 1-5, "issues": [{"excerpt","problem","fix"}] }.`,
    user: body,
  };
}

export function safetyReviewerPrompt(brief: EditorialBrief, body: string) {
  return {
    system: `Tu relis un texte pour des élèves de ${AGE[brief.gradeBand]} : sécurité, âge, stéréotypes, sensibilité. ${SAFETY}
Réponds uniquement en JSON : { "safe": true|false, "ageAppropriate": true|false, "concerns": [..] }.`,
    user: body,
  };
}

export function dictationReviewerPrompt(brief: EditorialBrief, segments: string[]) {
  return {
    system: `Tu es professeur de français et tu prépares une dictée pour des élèves de ${AGE[brief.gradeBand]}. Lis ces segments comme si tu les dictais à voix haute. Les homophones grammaticaux (a/à, et/est, son/sont, ou/où, ces/ses…), les accords et les terminaisons verbales muettes sont l'objet normal d'une dictée : ne les signale jamais. Signale seulement : les homophones lexicaux dont le sens ne peut pas se déduire du contexte entendu (ex. « vert / verre » sans indice), les enchaînements de sons vraiment difficiles à prononcer pour l'enseignant, les segments qui n'ont pas de sens entendus seuls, les mots trop rares pour l'âge, les liaisons trompeuses.
Réponds uniquement en JSON : { "readAloudScore": 1-5, "ambiguousHomophones": [..], "tongueTwisters": [..], "segmentIssues": [..], "notes": [..] }.`,
    user: segments.map((s, i) => `${i + 1}. ${s}`).join("\n"),
  };
}

export function pairwisePrompt(brief: EditorialBrief, style: StyleCard, a: string, b: string) {
  return {
    system: `Tu es directeur littéraire d'une collection jeunesse. Deux textes concourent pour la même commande (lecteurs de ${AGE[brief.gradeBand]}, à la manière de ${style.displayName}, univers : ${brief.interests.join(", ")}). Choisis celui que tu publierais. Critères, dans l'ordre : voix et fidélité au style, concret et surprise, rythme, absence de tics d'écriture artificielle, justesse pour l'âge.
${rubricPrompt()}
Réponds uniquement en JSON : { "winner": "A"|"B", "margin": "net"|"léger", "reasons": [..] }.`,
    user: `TEXTE A :\n${a}\n\nTEXTE B :\n${b}`,
  };
}

export function chiefRewritePrompt(notes: string[]) {
  return {
    system: `Tu es éditeur en chef. Tu reçois les notes de plusieurs relecteurs et des contrôles automatiques. Rédige au plus 6 consignes de réécriture précises, hiérarchisées, applicables en une seule passe par l'auteur. Les contrôles automatiques (mots cibles, temps, longueur, noms, grammaire) passent en premier. Ignore les notes contradictoires ou vagues.
Réponds uniquement en JSON : { "instructions": [..] }.`,
    user: notes.map((n) => `- ${n}`).join("\n"),
  };
}

export function auditorPrompt(brief: EditorialBrief, style: StyleCard, body: string) {
  const base = styleReviewerPrompt(brief, style, body);
  return { system: `${base.system}\nTu es l'auditeur indépendant de la qualité : sois plus sévère que les relecteurs habituels.`, user: base.user };
}
