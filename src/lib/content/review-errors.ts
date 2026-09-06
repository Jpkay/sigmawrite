/** Expected review errors cross the server-action boundary as plain data. */
export function reviewErrorMessage(message: string): string {
  if (message.includes("duplicate_diagnostic_prompt")) return "Un exercice identique existe déjà pour cette compétence. Modifiez cet exercice ou signalez le doublon.";
  if (message.includes("immutable")) return "Cet exercice appartient à une version déjà publiée et ne peut plus être modifié.";
  if (message.includes("item_assignment_not_found") || message.includes("reviewer_access_denied")) return "Cet exercice ne vous est plus attribué. Actualisez votre file de relecture.";
  if (message.includes("item_not_reviewable") || message.includes("submitted_review_cannot_be_revised")) return "Cet exercice n’est plus en attente de relecture. Actualisez votre file.";
  return "La décision n’a pas pu être enregistrée. Réessayez dans un instant.";
}
