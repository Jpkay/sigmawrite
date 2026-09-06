/** Server-owned exercise context; never derived from a learner's answer. */
export type AssessmentContext = {
  nodeKey?: string;
  promptFr?: string | null;
  instructionsFr?: string | null;
  modality?: string;
  responseType?: string;
};

export type AssessmentRow = {
  competency_nodes?: unknown;
  prompt_fr?: string | null;
  instructions_fr?: string | null;
  modality?: string;
  response_type?: string;
};

export function assessmentFromRow(item: AssessmentRow): AssessmentContext {
  const relation = Array.isArray(item.competency_nodes) ? item.competency_nodes[0] : item.competency_nodes;
  const node = relation as { key?: string } | null | undefined;
  return { nodeKey: node?.key, promptFr: item.prompt_fr, instructionsFr: item.instructions_fr, modality: item.modality, responseType: item.response_type };
}

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");
const punctuationNode = /(?:^|_)(?:ponctuation|ponctuer|guillemets?|virgules?|apostrophe|abreviations?|trait_d_union|trait_union|discours_direct|dialogue|point_final|point_interrogation|point_exclamation|points_suspension|phrase_interrogative|phrase_exclamative)(?:_|$)/u;
const punctuationTask = /\b(?:ponctu\w*|guillemet\w*|virgule\w*|apostrophe\w*|abreviation\w*|discours direct|trait d.union|point (?:final|d.interrogation|d.exclamation)|points de suspension)\b|\b(?:ajoute|place|mets|ecris|choisis|termine|complete)[^.!?]{0,60}\b(?:un|le|des) point\b|\bpoint[^.!?]{0,30}\b(?:fin|terminer)\b/u;

/** Only the final full stop may be omitted; other punctuation remains graded. */
export function allowsMissingFinalPeriod(assessment?: AssessmentContext, config?: Record<string, unknown>): boolean {
  if (assessment?.modality === "dictee" || assessment?.modality === "dictation") return false;
  if (assessment?.responseType === "mcq" || assessment?.responseType === "justified" || assessment?.responseType === "error_hunt") return false;
  // The old blanket instruction does not make punctuation the assessed skill.
  const instructions = fold(assessment?.instructionsFr ?? "").replace("ecris une phrase complete avec la ponctuation demandee.", "");
  if (punctuationNode.test(fold(assessment?.nodeKey ?? "")) || punctuationTask.test(`${fold(assessment?.promptFr ?? "")} ${instructions}`)) return false;
  const policy = config?.punctuationPolicy;
  if (policy !== undefined) return policy === "optional_final_period";
  // Missing context remains strict; real review/practice/diagnostic callers
  // supply the competency and prompt, including for newly authored exercises.
  return Boolean(assessment?.nodeKey && assessment?.promptFr);
}

export function withOptionalFinalPeriod(answer: string, assessment?: AssessmentContext, config?: Record<string, unknown>): string | null {
  const text = answer.trim();
  if (!allowsMissingFinalPeriod(assessment, config) || !/\p{L}/u.test(text) || /[.!?…,:;]$/u.test(text)) return null;
  return `${text}.`;
}

export const OPTIONAL_PERIOD_FEEDBACK = "Le point final n’est pas évalué ici.";
