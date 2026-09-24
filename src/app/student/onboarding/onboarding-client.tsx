"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {OnboardingPayload} from "./onboarding-copy";
import { hasStudentBackend, replaceStudentState, saveOnboarding, useStudentState } from "@/lib/student-store";
import { selectInterests } from "@/lib/actions/student";
import { track } from "@/lib/analytics";
import { studentSchoolGradeLabel } from "@/lib/school-grade";



export default function OnboardingPage({payload}:{payload:OnboardingPayload}) {
  const {copy}=payload;
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

  const completed = studentState.hydrated && (studentState.granularDiagnosticReady || (!!studentState.diagnostic && !studentState.diagnosticProvisional));
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
      setError(copy.saveError);
      setPending(false);
    }
  }

  if (completed) return <p>{copy.completed}</p>;

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
      />

      {step === 0 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="onboarding-grade" className="mb-1.5 block text-sm font-medium">{copy.grade}</label>
            <select
              id="onboarding-grade"
              value={grade ?? ""}
              onChange={(e) => setGradeOverride(Number(e.target.value))}
              disabled={(hasStudentBackend && !studentState.hydrated) || authoritativeGrade}
              className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
            >
              {payload.grades.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {authoritativeGrade && <p className="mt-2 text-xs text-muted-foreground">{copy.gradeHelp}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{studentSchoolGradeLabel(grade, studentType)}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">{copy.background}
              <select value={studentType} onChange={(e) => setStudentType(e.target.value)} aria-describedby="student-type-help" className="mt-1 h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm">
                {payload.backgrounds.map(option=><option key={option.value} className="bg-zinc-950" value={option.value}>{option.label}</option>)}
              </select>
              <span id="student-type-help" className="mt-1.5 block text-xs font-normal text-muted-foreground">{copy.backgroundHelp}</span>
            </label>
            <fieldset aria-describedby="exposures-help">
              <legend className="text-sm font-medium">{copy.exposureQuestion}</legend>
              <p id="exposures-help" className="mt-1 text-xs text-muted-foreground">{copy.exposureHelp}</p>
              <div className="mt-2 grid gap-2">
                {payload.exposures.map(({ key, label }) => (
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

          <p className="text-xs text-muted-foreground">{copy.diagnosticScope}</p>

          <Button onClick={() => { track("onboarding_step_completed", { step: "profile" }); setStep(1); }}>
            {copy.continue} <ArrowRight />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {copy.interestsQuestion}
            </label>
            <p className="mb-3 text-sm text-muted-foreground">
              {copy.interestsHelp}
            </p>
            <div className="flex flex-wrap gap-2">
              {payload.interests.map((i) => {
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
              {copy.back}
            </Button>
            <Button onClick={finish} disabled={interests.length < 3 || pending}>
              {copy.start} <ArrowRight />
            </Button>
            {interests.length < 3 && (
              <span className="text-sm text-muted-foreground">
                {payload.remaining[3 - interests.length]}
              </span>
            )}
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
        </div>
      )}
    </>
  );
}
