import { FRAMEWORK_LABELS, type CurriculumTag } from "@/lib/curriculum/tags";

/** Compact programme alignment chips (roadmap 4.2). */
export function CurriculumTags({ tags, compact = false }: { tags: CurriculumTag[]; compact?: boolean }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Alignement programme">
      {tags.map((tag) => (
        <li key={`${tag.framework}:${tag.code}`} title={tag.labelFr} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] leading-5">
          <span className="font-semibold text-primary">{FRAMEWORK_LABELS[tag.framework]}</span>
          {!compact && <span className="text-muted-foreground">· {tag.labelFr.length > 60 ? `${tag.labelFr.slice(0, 60)}…` : tag.labelFr}</span>}
        </li>
      ))}
    </ul>
  );
}
