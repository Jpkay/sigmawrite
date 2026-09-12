"use client";
import {REPAIR_COPY as copy,repairProgress,repairCompletion} from "@/lib/diagnostic/granular/repair-display";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Wrench } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChoiceList } from "@/components/choice-list";
import type { MicroLesson, MicroQuestion } from "@/lib/content/micro-lessons";
import { applySkillResults, hasStudentBackend, replaceStudentState } from "@/lib/student-store";
import { submitSkillPractice } from "@/lib/actions/student";
import { track } from "@/lib/analytics";

type Phase = "explain" | "practice" | "return" | "done";

export function RepairPlayer({ skillKey, lesson }: { skillKey: string; lesson: MicroLesson | null }) {

  const [phase, setPhase] = useState<Phase>("explain");
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const [corrects, setCorrects] = useState<boolean[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { track("repair_triggered", { skill_key: skillKey }); }, [skillKey]);

  if (!lesson) {
    return (
      <>
        <PageHeader title={copy.missing} />
        <Link href="/student" className={buttonVariants({ variant: "outline" })}>
          {copy.home}
        </Link>
      </>
    );
  }

  const isReturn = phase === "return";
  const current: MicroQuestion | undefined = isReturn
    ? lesson.returnToText
    : lesson.questions[qIndex];

  function check() {
    if (picked === null || !current || reveal || pending) return;
    setReveal(true);
    setCorrects((c) => [...c, picked === current.correctIndex]);
  }

  async function advance() {
    if (!lesson || pending) return;
    if (!isReturn) {
      setReveal(false);
      setPicked(null);
      if (qIndex + 1 < lesson.questions.length) setQIndex(qIndex + 1);
      else setPhase("return");
    } else {
      setPending(true);
      setError("");
      try {
        if (hasStudentBackend) {
          const response = await submitSkillPractice({ skillKey, corrects });
          replaceStudentState(response.state);
        } else applySkillResults(skillKey, corrects);
        setPhase("done");
      } catch {
        setError(copy.error);
      } finally {
        setPending(false);
      }
    }
  }

  if (phase === "explain") {
    return (
      <>
        <PageHeader title={lesson.title} description={copy.description} />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="size-4 text-primary" /> {copy.remember}
            </p>
            <p className="leading-relaxed">{lesson.explanationFr}</p>
            <div className="flex flex-wrap gap-2">
              {lesson.markers.map((m) => (
                <Badge key={m} variant="secondary">
                  {m}
                </Badge>
              ))}
            </div>
            <Button onClick={() => setPhase("practice")}>
              {copy.practice} <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  if (phase === "done") {
    const score = corrects.filter(Boolean).length;
    const total = corrects.length;
    return (
      <>
        <PageHeader title={copy.done} />
        <Card className="mb-4">
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">
              {score} / {total}
            </p>
            <p className="text-sm text-muted-foreground">
              {repairCompletion(lesson.title)}
            </p>
          </CardContent>
        </Card>
        <Link href="/student" className={buttonVariants()}>
          {copy.next} <ArrowRight />
        </Link>
      </>
    );
  }

  // practice / return
  return (
    <>
      <PageHeader
        title={lesson.title}
        description={isReturn ? copy.return : repairProgress(qIndex,lesson.questions.length)}
      />
      <Card>
        <CardContent className="pt-6">
          <ChoiceList
            prompt={current!.prompt}
            choices={current!.choices}
            value={picked}
            onChange={reveal ? undefined : setPicked}
            reveal={reveal}
            correctIndex={current!.correctIndex}
          />
          {reveal && (
            <p className="mt-3 text-sm text-muted-foreground">{current!.explanationFr}</p>
          )}
          <div className="mt-5">
            {!reveal ? (
              <Button onClick={check} disabled={picked === null}>
                {copy.verify} <Check />
              </Button>
            ) : (
              <Button onClick={advance} disabled={pending}>
                {pending ? copy.saving : isReturn ? copy.finish : copy.following} <ArrowRight />
              </Button>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </>
  );
}
