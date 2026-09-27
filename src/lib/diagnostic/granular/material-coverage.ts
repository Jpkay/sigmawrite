import type {CanonicalDiagnosticBankItem} from "../item-bank";
import {questionAssessedMaterialKeys} from "./material-annotations";

/** Authoring queue only: an anchored identity is not proof of novelty, complete
 * exposure history, semantic independence or pedagogical approval. */
export function inspectQuestionMaterialCoverage(
  entries: readonly CanonicalDiagnosticBankItem[],
  rule?: {novelWordsRequired?: boolean; novelSentencesRequired?: boolean},
) {
  if(new Set(entries.map(entry=>entry.itemKey)).size!==entries.length)throw Error("Duplicate material coverage question");
  const rows=entries.map(entry=>({id:entry.itemKey,keys:questionAssessedMaterialKeys(entry.item)}));
  const requiredKinds=(["word","sentence"] as const).filter(kind=>kind==="word"?rule?.novelWordsRequired:rule?.novelSentencesRequired);
  return {
    questions:rows.length,
    withoutExplicitAssessedIdentity:rows.filter(row=>!row.keys.length).map(row=>row.id),
    missingRequiredIdentities:requiredKinds.map(kind=>({kind,questionIds:rows.filter(row=>!row.keys.some(key=>key.startsWith(`${kind}:`))).map(row=>row.id)})),
  };
}
