/** Expected evaluation failures are shown without exposing provider responses. */
export class WritingAssessmentError extends Error {
  constructor(cause: unknown) {
    super("Ce texte n’a pas pu être évalué avec assez de certitude. Aucun résultat n’a été enregistré. Réessaie.", { cause });
    this.name = "WritingAssessmentError";
  }
}
