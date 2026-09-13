import { Badge } from "@/components/ui/badge";
import type { StudentSnapshot } from "@/lib/reports";
import type { GranularTeacherReportInput, TeacherSkillEvidence } from "@/lib/teacher-supervision-report";
import { teacherSupervisionReport } from "@/lib/teacher-supervision-report";

type Language = "fr" | "en";

const STATUS_LABELS: Record<TeacherSkillEvidence["status"], Record<Language, string>> = {
  mastered: { fr: "Acquis confirmé", en: "Confirmed" },
  missing: { fr: "À travailler", en: "Needs work" },
  fragile: { fr: "À consolider", en: "Fragile" },
  uncertain: { fr: "À confirmer", en: "Unresolved" },
  unknown: { fr: "Pas encore vérifié", en: "Not yet verified" },
};

const MODE_LABELS: Record<TeacherSkillEvidence["mode"], Record<Language, string>> = {
  recognition: { fr: "Reconnaissance", en: "Recognition" },
  production: { fr: "Production guidée", en: "Guided production" },
  interpretation: { fr: "Compréhension", en: "Interpretation" },
  independent_production: { fr: "Production autonome", en: "Independent production" },
};

export function TeacherStudentReport({ snap, granular, nowMs, language }: {
  snap: StudentSnapshot;
  granular: GranularTeacherReportInput | null;
  nowMs: number;
  language: Language;
}) {
  const report = teacherSupervisionReport(snap, nowMs, granular);
  const english = language === "en";
  const thisWeek = report.activity.thisWeek;

  return (
    <div className="space-y-10">
      <section aria-labelledby="diagnostic-summary" className="border-t border-border pt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="diagnostic-summary" className="text-lg font-semibold">{english ? "Current diagnostic" : "Diagnostic actuel"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {english ? "Granular results reflect only eligible evidence in the student’s current release scope." : "Les résultats granulaires reflètent uniquement les preuves admissibles dans le périmètre actuel de l’élève."}
            </p>
          </div>
          <Badge variant={report.granular?.provisional ? "secondary" : report.granular ? "success" : "outline"}>
            {report.granular
              ? report.granular.provisional ? (english ? "Provisional" : "Provisoire") : (english ? "Complete" : "Terminé")
              : (english ? "No granular session" : "Aucune session granulaire")}
          </Badge>
        </div>

        {report.granular ? (
          <>
            <dl className="mt-5 grid grid-cols-2 border-y border-border lg:grid-cols-4">
              {[
                [english ? "Recorded answers" : "Réponses enregistrées", String(report.granular.answeredCount)],
                [english ? "Skipped" : "Passées", String(report.granular.skippedCount)],
                [english ? "Active minutes" : "Minutes actives", String(report.granular.activeMinutes)],
                [english ? "Supported scope" : "Périmètre couvert", String(report.granular.supportedSkillCount)],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-r border-border px-4 py-4 last:border-r-0 lg:border-b-0">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            {report.granular.unsupportedSkillCount > 0 && (
              <p role="note" className="mt-4 border-l-2 border-border pl-3 text-sm text-muted-foreground">
                {english
                  ? `${report.granular.unsupportedSkillCount} additional skill(s) are unsupported by this release and remain unassessed.`
                  : `${report.granular.unsupportedSkillCount} compétence(s) supplémentaire(s) ne sont pas couvertes par cette version et restent non évaluées.`}
                {report.granular.limitationFr ? ` ${report.granular.limitationFr}` : ""}
              </p>
            )}
          </>
        ) : report.legacyBaseline ? (
          <div className="mt-5 border-y border-border py-4 text-sm">
            <p className="font-medium">{english ? "Legacy baseline only" : "Repère historique uniquement"}</p>
            <p className="mt-1 text-muted-foreground">
              {english ? "This is not a granular mastery result." : "Ce repère ne constitue pas un résultat de maîtrise granulaire."} {report.legacyBaseline.band} · {report.legacyBaseline.confidence} · {report.legacyBaseline.recommendedStartingLevel}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{english ? "No diagnostic result is available." : "Aucun résultat diagnostique n’est disponible."}</p>
        )}
      </section>

      <section aria-labelledby="skill-evidence" className="border-t border-border pt-7">
        <h2 id="skill-evidence" className="text-lg font-semibold">{english ? "Evidence by skill" : "Preuves par compétence"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {english ? "Resolved, unresolved, and unsupported states come directly from the evidence engine." : "Les états résolu, non résolu et non couvert proviennent directement du moteur de preuves."}
        </p>
        {report.granular?.groups.length ? (
          <div className="mt-5 space-y-6">
            {report.granular.groups.map((group) => (
              <div key={group.id}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group.labelFr}</h3>
                <div className="mt-2 divide-y divide-border border-y border-border">
                  {group.skills.map((skill) => (
                    <details key={skill.skillId} className="py-3">
                      <summary className="grid cursor-pointer gap-2 marker:text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                        <span>
                          <span className="font-medium">{skill.labelFr}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{MODE_LABELS[skill.mode][language]}</span>
                        </span>
                        <Badge variant={skill.resolution === "unsupported" ? "outline" : skill.status === "mastered" ? "success" : "secondary"}>
                          {skill.resolution === "unsupported" ? (english ? "Unsupported" : "Non couvert") : STATUS_LABELS[skill.status][language]}
                        </Badge>
                        <span className="text-right text-sm tabular-nums text-muted-foreground">{skill.eligibleEvidenceCount} {english ? "eligible" : "admissible(s)"}</span>
                      </summary>
                      <ul className="mt-3 space-y-1 border-l border-border pl-3 text-xs text-muted-foreground">
                        {skill.modes.map((mode) => (
                          <li key={mode.mode}>
                            {MODE_LABELS[mode.mode][language]} · {mode.distinctItems} {english ? "item(s)" : "item(s)"} · {mode.distinctContexts} {english ? "context(s)" : "contexte(s)"} · {mode.distinctOccasions} {english ? "occasion(s)" : "occasion(s)"}
                            {mode.accuracy === null ? "" : ` · ${Math.round(mode.accuracy * 100)}%`}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{english ? "No current granular skill evidence." : "Aucune preuve granulaire actuelle par compétence."}</p>
        )}
      </section>

      <section aria-labelledby="activity-progress" className="border-t border-border pt-7">
        <h2 id="activity-progress" className="text-lg font-semibold">{english ? "Activity progress" : "Progression de l’activité"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {report.activity.latestSessionAt
            ? `${english ? "Latest reading activity" : "Dernière activité de lecture"} : ${new Intl.DateTimeFormat(english ? "en" : "fr", { dateStyle: "medium" }).format(new Date(report.activity.latestSessionAt))}`
            : (english ? "No reading activity recorded." : "Aucune activité de lecture enregistrée.")}
        </p>
        {report.granular && (
          <div className="mt-5 border-y border-border py-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">{english ? "Guided lessons completed" : "Leçons guidées terminées"}</p><p className="mt-1 text-xl font-semibold tabular-nums">{report.granular.learningProgress.completedGuidedLessons}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">{english ? "Independent checks" : "Vérifications indépendantes"}</p><p className="mt-1 text-xl font-semibold tabular-nums">{report.granular.learningProgress.independentChecks}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">{english ? "Successful check outcomes" : "Résultats de vérification réussis"}</p><p className="mt-1 text-xl font-semibold tabular-nums">{report.granular.learningProgress.successfulIndependentChecks}</p></div>
            </div>
            {report.granular.learningProgress.currentGuided && (
              <p className="mt-3 text-sm text-muted-foreground">
                {english ? "In progress" : "En cours"} : {report.granular.learningProgress.currentGuided.titleFr} · {report.granular.learningProgress.currentGuided.phase === "lesson" ? (english ? "lesson" : "leçon") : (english ? "guided practice" : "entraînement guidé")} · {report.granular.learningProgress.currentGuided.exerciseIndex}/{report.granular.learningProgress.currentGuided.totalExercises}
              </p>
            )}
            <p role="note" className="mt-3 text-xs text-muted-foreground">{english ? "Completing guided work is activity progress, not independent mastery evidence." : "Terminer une activité guidée indique une progression d’activité, pas une preuve de maîtrise autonome."}</p>
          </div>
        )}
        <dl className="mt-5 grid grid-cols-2 border-y border-border lg:grid-cols-5">
          {[
            [english ? "Sessions this week" : "Sessions cette semaine", String(thisWeek.textsCompleted)],
            [english ? "Previous week" : "Semaine précédente", String(report.activity.previousWeekSessions)],
            [english ? "Reading minutes" : "Minutes de lecture", String(thisWeek.minutes)],
            [english ? "Average success" : "Réussite moyenne", thisWeek.avgSuccess === null ? "—" : `${Math.round(thisWeek.avgSuccess * 100)}%`],
            [english ? "Retrieval reviewed" : "Rappels révisés", String(thisWeek.retrievalReviewed)],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-border px-4 py-4 last:border-r-0 lg:border-b-0">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
