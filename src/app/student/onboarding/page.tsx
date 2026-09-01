"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INTERESTS } from "@/lib/content/interests";
import { hasStudentBackend, replaceStudentState, saveOnboarding, useStudentState } from "@/lib/student-store";
import { selectInterests } from "@/lib/actions/student";
import { track } from "@/lib/analytics";

const BACKGROUNDS: { key: string; label: string }[] = [
  { key: "native", label: "Français langue maternelle / de scolarisation" },
  { key: "bilingual", label: "Bilingue" },
  { key: "french_second_language", label: "Français langue seconde" },
  { key: "returning_learner", label: "Je reprends après une pause" },
  { key: "struggling_reader", label: "J'ai des difficultés en lecture" },
  { key: "not_sure", label: "Je ne sais pas trop" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const studentState = useStudentState();
  const [step, setStep] = useState(0);
  const [gradeOverride, setGradeOverride] = useState<number | null>(null);
  const [background, setBackground] = useState("native");
  const [studentType, setStudentType] = useState("french_first_language");
  const [homeLanguage, setHomeLanguage] = useState("français");
  const [exposure, setExposure] = useState("home");
  const [goalType, setGoalType] = useState("catch_up");
  const [cefrTarget, setCefrTarget] = useState("B1");
  const [interests, setInterests] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const authoritativeGrade = hasStudentBackend && studentState.grade != null;
  const usesCefr = ["french_second_language", "allophone", "immersion"].includes(studentType);
  const grade = gradeOverride ?? studentState.grade ?? 7;

  function toggleInterest(key: string) {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function finish() {
    setPending(true);
    setError("");
    try {
      if (hasStudentBackend) {
        const state = await selectInterests({
          grade,
          frenchBackground: background,
          interests,
          studentType,
          homeLanguage,
          exposure,
          goalType,
          ...(usesCefr ? { targetLevel: cefrTarget } : {}),
        });
        replaceStudentState(state);
      } else saveOnboarding({ grade, frenchBackground: background, interests });
      track("onboarding_completed", { student_type: studentType, goal_type: goalType });
      router.push("/student/diagnostic");
    } catch {
      setError("Ton profil n'a pas pu être enregistré. Réessaie.");
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Bienvenue 👋"
        description="Quelques questions pour préparer ton profil de français et ton diagnostic de départ."
      />

      {step === 0 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="onboarding-grade" className="mb-1.5 block text-sm font-medium">Ta classe</label>
            <select
              id="onboarding-grade"
              value={grade ?? ""}
              onChange={(e) => setGradeOverride(Number(e.target.value))}
              disabled={(hasStudentBackend && !studentState.hydrated) || authoritativeGrade}
              className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value={5}>5e année (CM2)</option>
              <option value={6}>6e</option>
              <option value={7}>5e (Grade 7)</option>
              <option value={8}>4e (Grade 8)</option>
              <option value={9}>3e (Grade 9)</option>
              <option value={10}>2nde (Grade 10)</option>
              <option value={11}>1re (Grade 11)</option>
              <option value={12}>Terminale (Grade 12)</option>
            </select>
            {authoritativeGrade && <p className="mt-2 text-xs text-muted-foreground">Niveau transmis par ta classe. Ton établissement peut le corriger si nécessaire.</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Ton parcours en français
              <select value={studentType} onChange={(e) => setStudentType(e.target.value)} className="mt-1 h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm">
                <option className="bg-zinc-950" value="french_first_language">Français langue première</option><option className="bg-zinc-950" value="heritage">Français familial / héritage</option><option className="bg-zinc-950" value="immersion">Immersion</option><option className="bg-zinc-950" value="allophone">Une autre langue à la maison</option><option className="bg-zinc-950" value="french_second_language">Français langue seconde</option><option className="bg-zinc-950" value="bilingual">Bilingue</option>
              </select>
            </label>
            <label className="block text-sm font-medium">Langue parlée à la maison<input value={homeLanguage} onChange={(e) => setHomeLanguage(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></label>
            <label className="block text-sm font-medium">Exposition au français<select value={exposure} onChange={(e) => setExposure(e.target.value)} className="mt-1 h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm"><option className="bg-zinc-950" value="home">À la maison</option><option className="bg-zinc-950" value="school">À l’école</option><option className="bg-zinc-950" value="class_only">Seulement en cours</option><option className="bg-zinc-950" value="immersion">En immersion</option><option className="bg-zinc-950" value="self_study">En autonomie</option></select></label>
            <label className="block text-sm font-medium">Ton objectif
              <select value={goalType} onChange={(e) => setGoalType(e.target.value)} className="mt-1 h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm">
                <option className="bg-zinc-950" value="catch_up">Être à niveau dans ma classe</option>
                <option className="bg-zinc-950" value="improve_writing">Mieux écrire</option>
                <option className="bg-zinc-950" value="grammar_spelling">Renforcer grammaire et orthographe</option>
                <option className="bg-zinc-950" value="prepare_delf">Préparer les épreuves écrites du DELF</option>
                <option className="bg-zinc-950" value="literature_class">Réussir en littérature</option>
              </select>
              <span className="mt-1.5 block text-xs font-normal text-muted-foreground">Le diagnostic actuel mesure la lecture et l’écriture. L’oral n’est pas encore évalué.</span>
            </label>
            {usesCefr && <label className="block text-sm font-medium">Niveau CECRL visé<select value={cefrTarget} onChange={(e) => setCefrTarget(e.target.value)} className="mt-1 h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm">{["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => <option className="bg-zinc-950" key={level} value={level}>{level}</option>)}</select></label>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Ton rapport au français
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setBackground(b.key)}
                  className={cn(
                    "rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                    background === b.key
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => { track("onboarding_step_completed", { step: "profile" }); setStep(1); }}>
            Continuer <ArrowRight />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Qu&apos;est-ce qui t&apos;intéresse ?
            </label>
            <p className="mb-3 text-sm text-muted-foreground">
              Choisis au moins 3 sujets. Tes textes partiront de là.
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => {
                const on = interests.includes(i.key);
                return (
                  <button
                    key={i.key}
                    type="button"
                    onClick={() => toggleInterest(i.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      on
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <span>{i.emoji}</span>
                    {i.labelFr}
                    {on && <Check className="size-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>
              Retour
            </Button>
            <Button onClick={finish} disabled={interests.length < 3 || pending}>
              Commencer le diagnostic <ArrowRight />
            </Button>
            {interests.length < 3 && (
              <span className="text-sm text-muted-foreground">
                Encore {3 - interests.length} sujet(s).
              </span>
            )}
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
        </div>
      )}
    </>
  );
}
