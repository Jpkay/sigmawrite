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
    "validatorType": "exact"|"regex"|"conjugator"|"agreement"|"grammalecte",
    "validatorConfig": object,    // pour conjugator: {verb, tense, person, gender?, codBefore?}
    "choices": [ {"text": string, "correct": boolean, "misconceptionKey"?: string, "feedbackFr"?: string} ],
    "cefrLevel": "A1"|"A2"|"B1"|"B2"|"C1"|"C2",
    "difficulty": number          // 0–100
  }
- Pour la conjugaison, mets validatorType="conjugator" et fournis validatorConfig {verb, tense (present|imparfait|passe_compose), person (1s|2s|3s|1p|2p|3p)}. NE T'INQUIÈTE PAS de la forme exacte : elle sera recalculée de façon déterministe.
- Pour un QCM, exactement UNE bonne réponse. Étiquette les distracteurs plausibles avec une "misconceptionKey" de la liste fournie quand c'est pertinent.
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
