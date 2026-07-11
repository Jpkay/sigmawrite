"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Wrench } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChoiceList } from "@/components/choice-list";
import { MICRO_LESSONS, type MicroQuestion } from "@/lib/content/micro-lessons";
import { applySkillResults, hasStudentBackend, replaceStudentState } from "@/lib/student-store";
import { submitSkillPractice } from "@/lib/actions/student";
import { track } from "@/lib/analytics";

type Phase = "explain" | "practice" | "return" | "done";

export default function RepairPage() {
  const { skillKey } = useParams<{ skillKey: string }>();
  const lesson = MICRO_LESSONS[skillKey];

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
        <PageHeader title="Micro-leçon introuvable" />
        <Link href="/student" className={buttonVariants({ variant: "outline" })}>
          Retour à l&apos;accueil
        </Link>
      </>
    );
  }

  const isReturn = phase === "return";
  const current: MicroQuestion | undefined = isReturn
    ? lesson.returnToText
    : lesson.questions[qIndex];

  function check() {
    if (picked === null || !current) return;
    setReveal(true);
    setCorrects((c) => [...c, picked === current.correctIndex]);
  }

  async function advance() {
    setReveal(false);
    setPicked(null);
    if (!isReturn) {
      if (qIndex + 1 < lesson.questions.length) setQIndex(qIndex + 1);
      else setPhase("return");
    } else {
      applySkillResults(skillKey, corrects);
      setPending(true);
      setError("");
      try {
        if (hasStudentBackend) {
          const response = await submitSkillPractice({ skillKey, corrects });
          replaceStudentState(response.state);
        }
        setPhase("done");
      } catch {
        setError("Le résultat n'a pas pu être enregistré. Réessaie.");
      } finally {
        setPending(false);
      }
    }
  }

  if (phase === "explain") {
    return (
      <>
        <PageHeader title={lesson.title} description="Réparation des bases — 2 minutes." />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="size-4 text-primary" /> Ce qu&apos;il faut retenir
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
              Je m&apos;entraîne <ArrowRight />
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
        <PageHeader title="Micro-leçon terminée 👍" />
        <Card className="mb-4">
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">
              {score} / {total}
            </p>
            <p className="text-sm text-muted-foreground">
              Ton estimation de compétence « {lesson.title} » a été mise à jour.
            </p>
          </CardContent>
        </Card>
        <Link href="/student" className={buttonVariants()}>
          Continuer <ArrowRight />
        </Link>
      </>
    );
  }

  // practice / return
  return (
    <>
      <PageHeader
        title={lesson.title}
        description={isReturn ? "Retour au texte" : `Entraînement ${qIndex + 1} / ${lesson.questions.length}`}
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
                Vérifier <Check />
              </Button>
            ) : (
              <Button onClick={advance} disabled={pending}>
                {pending ? "Enregistrement…" : isReturn ? "Terminer" : "Suivant"} <ArrowRight />
              </Button>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </>
  );
}
