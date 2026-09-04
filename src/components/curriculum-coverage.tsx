import { FRAMEWORK_LABELS, type CurriculumCoverageRow } from "@/lib/curriculum/tags";

/** Attendus du programme covered by the student's evidence, for teachers and parents (roadmap 4.2). */
export function CurriculumCoverage({ rows, language }: { rows: CurriculumCoverageRow[]; language: "fr" | "en" }) {
  const en = language === "en";
  if (rows.length === 0) return null;
  return (
    <section className="mt-9 border-t border-border pt-7">
      <h2 className="text-lg font-semibold">{en ? "Programme coverage" : "Couverture du programme"}</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{en ? "Attendus of the French programmes (cycle 3 and 4) and 6e evaluation domains touched by this student's evidence." : "Attendus des programmes (cycles 3 et 4) et domaines de l’évaluation de 6e couverts par les preuves de l’élève."}</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-[.08em] text-muted-foreground"><tr><th className="p-3">{en ? "Framework" : "Cadre"}</th><th className="p-3">{en ? "Expectation" : "Attendu"}</th><th className="p-3 text-right">{en ? "Secured" : "Sécurisées"}</th><th className="p-3 text-right">{en ? "In progress" : "En cours"}</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={`${row.framework}:${row.code}`} className="border-t border-border"><td className="p-3 font-medium">{FRAMEWORK_LABELS[row.framework]}</td><td className="p-3">{row.labelFr}<span className="ml-2 font-mono text-[11px] text-muted-foreground">{row.code}</span></td><td className="p-3 text-right tabular-nums">{row.mastered}</td><td className="p-3 text-right tabular-nums">{row.inProgress}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
