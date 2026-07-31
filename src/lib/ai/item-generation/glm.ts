/**
 * GLM 5.2 (via Cloudflare) item generator + judge (Roadmap Phase 9, D7).
 *
 * Implements the provider-agnostic ItemGenerator / ItemJudge interfaces using an
 * OpenAI-compatible endpoint. The generator proposes items; every item is still
 * forced through the 6 QC gates (pipeline.ts), so the model is never trusted for
 * correctness — Gate 0 recomputes conjugations, Gate 2 verifies answer keys.
 */

import type { GeneratedItem, ItemGenSpec } from "./schemas";
import type { ItemGenerator, ItemJudge } from "./generator";
import { chatComplete, extractJson, type ChatConfig } from "./openai-compatible";

const SYSTEM_PROMPT = `Tu es un concepteur d'exercices de français pour des élèves du secondaire (6e–Terminale). Tu produis des items d'évaluation précis, alignés sur une compétence atomique donnée.

Règles STRICTES :
- Réponds UNIQUEMENT par un tableau JSON d'items, sans texte autour.
- Chaque item suit ce schéma :
  {
    "nodeKey": string,            // la compétence ciblée (fournie)
    "strand": string,             // le brin (fourni)
    "modality": "reading"|"writing"|"listening"|"speaking"|"grammar_analysis"|"dictee",
    "learnerMode": "native"|"fsl"|"heritage"|"allophone"|"immersion"|"shared",
    "responseType": "mcq"|"short_answer"|"cloze"|"transform",
    "promptFr": string,           // l'énoncé en français
    "correctAnswer": string,      // pour short_answer/cloze/transform
    "acceptableAnswers": string[],
    "validatorType": "exact"|"regex"|"conjugator",
    "validatorConfig": object,    // pour conjugator: {verb, tense, person, gender?, codBefore?}
    "choices": [ {"text": string, "correct": boolean, "misconceptionKey"?: string, "feedbackFr"?: string} ],
    "cefrLevel": "A1"|"A2"|"B1"|"B2"|"C1"|"C2",
    "difficulty": number          // 0–100
  }
- Pour la conjugaison, mets validatorType="conjugator" et fournis validatorConfig {verb, tense (present|imparfait|passe_compose|futur_simple|futur_proche|conditionnel_present|subjonctif_present|imperatif_present|plus_que_parfait), person (1s|2s|3s|1p|2p|3p)}. NE T'INQUIÈTE PAS de la forme exacte : elle sera recalculée de façon déterministe.
- N'utilise "conjugator" QUE pour les temps listés ci-dessus et pour un verbe fréquent dont tu es sûr (l'impératif n'existe qu'aux personnes 2s, 1p, 2p). Pour le passé simple ou d'autres périphrases, utilise un QCM ou une réponse exacte qui passera obligatoirement en revue humaine.
- Pour un QCM, exactement UNE bonne réponse.
- Pour une preuve "controlled_production", exige une réponse réellement produite (short_answer, cloze ou transform), jamais un simple QCM.
- Pour la compréhension écrite, inclus dans promptFr un court passage original et toutes les informations nécessaires. Aucune question ne doit dépendre d'un texte absent.
- Pour l'orthographe productive, donne un contexte ou un indice qui ne révèle jamais la graphie attendue. N'annonce pas une dictée sans ressource audio.
- Respecte exactement requestedPromptFamilies et requestedDifficultyTiers, dans l'ordre fourni. Foundation, core et stretch doivent modifier la complexité réelle, pas seulement le nombre "difficulty".
- N'utilise jamais rubric ou llm_assisted pour ces items diagnostiques.
- N'utilise jamais agreement ou grammalecte : le diagnostic en direct doit rester validable sans service externe.
- Chaque contexte doit être nouveau, autosuffisant, sans citation ni extrait protégé.
- "misconceptionKey" : utilise UNIQUEMENT une clé de la liste fournie dans le message. Si aucune ne correspond, OMETS complètement le champ (n'invente jamais de clé).
- Français correct et naturel. Énoncés courts et clairs, adaptés au niveau CEFR indiqué.`;

function userPrompt(spec: ItemGenSpec): string {
  return [
    `Compétence (nodeKey): ${spec.nodeKey}`,
    `Libellé: ${spec.labelFr}`,
    `Brin (strand): ${spec.strand}`,
    spec.cefrLevel ? `Niveau CEFR cible: ${spec.cefrLevel}` : "",
    `Modalité: ${spec.modality} · Profil: ${spec.learnerMode}`,
    spec.misconceptionKeys?.length
      ? `Misconceptions disponibles pour les distracteurs: ${spec.misconceptionKeys.join(", ")}`
      : "",
    spec.hint ? `Indice de génération: ${JSON.stringify(spec.hint)}` : "",
    `Génère ${spec.count} item(s) variés pour cette compétence. Réponds par un tableau JSON.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export class GlmItemGenerator implements ItemGenerator {
  constructor(private readonly cfg: ChatConfig = {}) {}

  async generateItems(spec: ItemGenSpec): Promise<GeneratedItem[]> {
    const content = await chatComplete(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(spec) },
      ],
      { temperature: 0.7, jsonMode: false, ...this.cfg }
    );
    const parsed = extractJson(content);
    const arr = Array.isArray(parsed)
      ? parsed
      : (parsed as { items?: unknown[] }).items ?? [parsed];
    // Boundary cast: the pipeline's Gate 1 re-validates every item with Zod.
    return arr as GeneratedItem[];
  }
}

const JUDGE_SYSTEM = `Tu es un correcteur expert de français. On te donne un item d'évaluation. Évalue s'il est VALIDE : français correct, énoncé clair, clé de réponse juste, et (pour un QCM) exactement une bonne réponse réellement correcte. Réponds UNIQUEMENT par un JSON : {"valid": boolean, "confidence": number (0–1), "note": string}.`;

export class GlmItemJudge implements ItemJudge {
  constructor(private readonly cfg: ChatConfig = {}) {}

  async judge(item: GeneratedItem) {
    const content = await chatComplete(
      [
        { role: "system", content: JUDGE_SYSTEM },
        { role: "user", content: JSON.stringify(item) },
      ],
      { temperature: 0, jsonMode: false, ...this.cfg }
    );
    const v = extractJson(content) as { valid?: boolean; confidence?: number; note?: string };
    return {
      valid: v.valid === true,
      confidence: typeof v.confidence === "number" ? v.confidence : 0,
      note: v.note,
    };
  }
}
