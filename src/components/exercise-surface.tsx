"use client";

import { shuffleChoices } from "@/lib/content/choice-order";
import { ExercisePrompt } from "@/components/exercise-prompt";
import { AccentTextarea } from "@/components/accent-textarea";
import { ErrorHuntWidget, JustifiedWidget, OrderingWidget, RewriteWidget, shuffledOrder } from "@/components/exercise-widgets";

export type ExerciseSurfaceItem = {
  id: string; promptFr: string; instructionsFr?: string | null; responseType: string;
  choiceOrderSeed?: string;
  validatorConfig?: Record<string, unknown> | null;
  choices: { id: string; text: string }[];
};

/** Shared learner controls. This component never records an attempt. */
export function ExerciseSurface({ item, choice, answer, order, rule, setChoice, setAnswer, setOrder, setRule, disabled = false }: {
  item: ExerciseSurfaceItem; choice: string | null; answer: string; order: string[]; rule: string;
  setChoice: (value: string) => void; setAnswer: (value: string) => void;
  setOrder: (value: string[]) => void; setRule: (value: string) => void; disabled?: boolean;
}) {
  const choices = shuffleChoices(item.choices, item.choiceOrderSeed ?? `exercise:${item.id}`);
  return (
      <div className="border-y border-border py-7">
        <ExercisePrompt promptFr={item.promptFr} instructionsFr={item.instructionsFr} />
        {item.responseType === "error_hunt" ? <ErrorHuntWidget sentence={item.promptFr} value={answer} onChange={setAnswer} disabled={disabled} />
          : item.responseType === "ordering" ? <OrderingWidget order={order.length ? order : shuffledOrder(((item.validatorConfig?.tokens as string[] | undefined) ?? []), item.id)} onChange={(next) => { setOrder(next); setAnswer(next.join(" ")); }} disabled={disabled} />
          : item.responseType === "justified" ? <JustifiedWidget choices={choices} rules={shuffleChoices((item.validatorConfig?.rules as { key: string; label: string }[] | undefined) ?? [], `rules:${item.id}`)} choice={choice} rule={rule} onChoice={setChoice} onRule={(key) => { setRule(key); setAnswer(key); }} disabled={disabled} />
          : item.responseType === "combine" || (item.responseType === "transform" && Array.isArray(item.validatorConfig?.sources)) ? <RewriteWidget sources={item.responseType === "combine" ? ((item.validatorConfig?.sentences as string[] | undefined) ?? []) : ((item.validatorConfig?.sources as string[] | undefined) ?? [])} value={answer} onChange={setAnswer} disabled={disabled} placeholder={item.responseType === "combine" ? "Une seule phrase qui garde toutes les informations." : "Réécris la phrase en suivant la consigne."} />
          : item.choices.length ? <div role="radiogroup" aria-label="Choix de réponse" className="mt-6 grid gap-3">{choices.map((option) => <button type="button" role="radio" aria-checked={choice === option.id} key={option.id} disabled={disabled} onClick={() => setChoice(option.id)} className={`min-h-12 rounded-lg border px-4 py-3 text-left text-base transition-colors ${choice === option.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>{option.text}</button>)}</div> : <AccentTextarea aria-label="Ta réponse" disabled={disabled} value={answer} onChange={setAnswer} rows={3} autoCapitalize="none" autoCorrect="off" className="mt-6 w-full rounded-lg border border-input bg-background p-4 text-base" />}
      </div>
  );
}
