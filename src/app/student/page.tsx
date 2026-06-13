"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { recommendTextId } from "@/lib/content/recommend";
import { useStudentState } from "@/lib/student-store";
import { StudentAssignments } from "@/components/student-assignments";

export default function StudentHome() {
  const state = useStudentState();

  if (!state.hydrated) {
    return <PageHeader title="Bonjour 👋" description="Chargement…" />;
  }

  if (!state.onboarded) {
    return (
      <>
        <PageHeader
          title="Bonjour 👋"
          description="Crée ton profil de lecture en quelques minutes."
        />
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="text-lg font-medium">Commençons par te connaître.</p>
            <Link href="/student/onboarding" className={buttonVariants()}>
              Démarrer <ArrowRight />
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!state.diagnostic) {
    return (
      <>
        <PageHeader title="Bonjour 👋" description="Encore une étape." />
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="text-lg font-medium">
              Fais le diagnostic pour établir ta bande de lecture.
            </p>
            <Link href="/student/diagnostic" className={buttonVariants()}>
              Diagnostic <ArrowRight />
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  const recommended = SEED_TEXT_BY_ID[recommendTextId(state.interests)];
  const completed = state.sessions.length;
  const avg = completed
    ? Math.round(
        (state.sessions.reduce((s, r) => s + r.successRate, 0) / completed) * 100
      )
    : 0;
  const band = state.diagnostic.overallReadingBand;

  const stats = [
    {
      label: "Bande de lecture",
      value: `${band.minGrade.toFixed(1)}–${band.maxGrade.toFixed(1)}`,
    },
    { label: "Textes complétés", value: String(completed) },
    { label: "Réussite moyenne", value: completed ? `${avg}%` : "—" },
    { label: "Zone cible", value: "80–85%" },
  ];

  return (
    <>
      <PageHeader
        title="Bonjour 👋"
        description="Voici ta lecture du jour, choisie selon tes intérêts et ton niveau."
      />

      <StudentAssignments />

      <Card className="mb-6 border-primary/40 bg-accent/40">
        <CardHeader>
          <CardTitle>Lecture du jour</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-medium">« {recommended.title} »</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{recommended.difficultyBand}</Badge>
              {recommended.concepts.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
          <Link href={`/student/read/${recommended.id}`} className={buttonVariants()}>
            Commencer <ArrowRight />
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
