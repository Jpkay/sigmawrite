"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INTERESTS } from "@/lib/content/interests";
import { hasStudentBackend, replaceStudentState, saveOnboarding, useStudentState } from "@/lib/student-store";
import { selectInterests } from "@/lib/actions/student";
import { track } from "@/lib/analytics";

const EXPOSURES = [
  { key: "home", label: "À la maison" },
  { key: "school", label: "À l’école, dans plusieurs matières" },
  { key: "class_only", label: "Pendant les cours de français" },
  { key: "immersion", label: "Avec des personnes qui parlent français autour de moi" },
  { key: "self_study", label: "Par moi-même : livres, vidéos, applis…" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const studentState = useStudentState();
  const [step, setStep] = useState(0);
  const [gradeOverride, setGradeOverride] = useState<number | null>(null);
  const [studentType, setStudentType] = useState("french_first_language");
  const [exposures, setExposures] = useState<string[]>(["home"]);
  const [interests, setInterests] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const authoritativeGrade = hasStudentBackend && studentState.grade != null;
  const background = studentType === "french_first_language" ? "native"
    : studentType === "bilingual" ? "bilingual"
    : studentType === "heritage" ? "not_sure" : "french_second_language";
  const grade = gradeOverride ?? studentState.grade ?? 7;

  const completed = studentState.hydrated && !!studentState.diagnostic && !studentState.diagnosticProvisional;
  useEffect(() => {
    if (completed) router.replace("/student/lessons");
  }, [completed, router]);

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
          exposures,
        });
        replaceStudentState(state);
      } else saveOnboarding({ grade, frenchBackground: background, interests, exposures });
      track("onboarding_completed", { student_type: studentType, goal_type: "catch_up" });
      router.push("/student/diagnostic");
    } catch {
      setError("Ton profil n'a pas pu être enregistré. Réessaie.");
      setPending(false);
    }
  }

  if (completed) return <p>Ton diagnostic est terminé. Ouverture de tes leçons…</p>;

  return (
    <>
      <PageHeader
        title="Bienvenue 👋"
        description="Quelques questions pour te connaître. Le diagnostic nous aidera ensuite à trouver ton point de départ et à t’aider à progresser en classe."
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
              <option value={5}>CM2 · 5e année (BE) · 5e année (QC)</option>
              <option value={6}>6e · 6e année (BE) · 6e année (QC)</option>
              <option value={7}>5e · 1re secondaire (BE) · 1re secondaire (QC)</option>
              <option value={8}>4e · 2e secondaire (BE) · 2e secondaire (QC)</option>
              <option value={9}>3e · 3e secondaire (BE) · 3e secondaire (QC)</option>
              <option value={10}>2de · 4e secondaire (BE) · 4e secondaire (QC)</option>
              <option value={11}>1re · 5e secondaire (BE) · 5e secondaire (QC)</option>
              <option value={12}>Terminale · 6e secondaire (BE) · Cégep 1 (QC)</option>
            </select>
            {authoritativeGrade && <p className="mt-2 text-xs text-muted-foreground">Niveau transmis par ta classe. Ton établissement peut le corriger si nécessaire.</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Ton parcours en français
              <select value={studentType} onChange={(e) => setStudentType(e.target.value)} aria-describedby="student-type-help" className="mt-1 h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm">
                <option className="bg-zinc-950" value="french_first_language">J’ai grandi en parlant surtout français</option>
                <option className="bg-zinc-950" value="heritage">Le français vient de ma famille</option>
                <option className="bg-zinc-950" value="immersion">J’apprends des matières en français pour apprendre la langue</option>
                <option className="bg-zinc-950" value="allophone">À la maison, je parle une autre langue</option>
                <option className="bg-zinc-950" value="french_second_language">J’apprends le français comme une nouvelle langue</option>
                <option className="bg-zinc-950" value="bilingual">Je parle français et une autre langue au quotidien</option>
              </select>
              <span id="student-type-help" className="mt-1.5 block text-xs font-normal text-muted-foreground">Choisis la situation qui te ressemble le plus.</span>
            </label>
            <fieldset aria-describedby="exposures-help">
              <legend className="text-sm font-medium">Où utilises-tu le français ?</legend>
              <p id="exposures-help" className="mt-1 text-xs text-muted-foreground">Tu peux cocher plusieurs réponses.</p>
              <div className="mt-2 grid gap-2">
                {EXPOSURES.map(({ key, label }) => (
                  <label key={key} className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm",
                    exposures.includes(key) ? "border-primary bg-primary/10" : "border-input"
                  )}>
                    <input
                      type="checkbox"
                      name="exposures"
                      value={key}
                      checked={exposures.includes(key)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setExposures((current) => checked ? [...current, key] : current.filter((value) => value !== key));
                      }}
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <p className="text-xs text-muted-foreground">Le diagnostic porte sur la lecture et l’écriture. Il n’évalue pas encore l’oral.</p>

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
