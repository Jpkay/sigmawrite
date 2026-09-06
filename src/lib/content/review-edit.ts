import { z } from "zod";

export const reviewEditSchema = z.object({
  id: z.string().uuid(),
  promptFr: z.string().trim().min(5).max(4000),
  correctAnswer: z.string().trim().max(1000).nullable(),
  choices: z.array(z.object({ id: z.string().uuid(), text: z.string().trim().min(1).max(2000), correct: z.boolean(), feedbackFr: z.string().trim().max(2000).nullable() })).max(20),
}).superRefine((value, ctx) => {
  if (new Set(value.choices.map((choice) => choice.id)).size !== value.choices.length) ctx.addIssue({ code: "custom", message: "Chaque proposition doit être unique." });
  if (value.choices.length && value.choices.filter((choice) => choice.correct).length !== 1) ctx.addIssue({ code: "custom", message: "Sélectionnez une seule bonne réponse." });
  if (new Set(value.choices.map((choice) => choice.text.toLocaleLowerCase("fr"))).size !== value.choices.length) ctx.addIssue({ code: "custom", message: "Les propositions doivent être différentes." });
});
