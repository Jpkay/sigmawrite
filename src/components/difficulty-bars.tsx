import type { TextDifficulty } from "@/lib/scoring/text-difficulty";

const DIMS: { key: keyof TextDifficulty; label: string }[] = [
  { key: "lexical", label: "Lexical" },
  { key: "syntax", label: "Syntaxe" },
  { key: "knowledge", label: "Savoir" },
  { key: "inference", label: "Inférence" },
  { key: "stamina", label: "Endurance" },
];

/** Visualises the six difficulty dimensions of a scored text (PRD §G). */
export function DifficultyBars({ difficulty }: { difficulty: TextDifficulty }) {
  return (
    <div className="space-y-2">
      {DIMS.map((d) => {
        const v = difficulty[d.key] as number;
        return (
          <div key={d.key} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-muted-foreground">{d.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${v}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums">{v}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-3 border-t border-border pt-2">
        <span className="w-20 shrink-0 text-xs font-medium">Global</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-[color:var(--success)]"
            style={{ width: `${difficulty.overall}%` }}
          />
        </div>
        <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums">
          {difficulty.overall}
        </span>
      </div>
    </div>
  );
}
