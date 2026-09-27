import { type CurriculumTag } from "@/lib/curriculum/tags";
import {CURRICULUM_TAG_LABEL,curriculumTagDisplay} from '@/lib/curriculum/tag-display';

/** Compact programme alignment chips (roadmap 4.2). */
export function CurriculumTags({ tags, compact = false }: { tags: CurriculumTag[]; compact?: boolean }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={CURRICULUM_TAG_LABEL}>
      {tags.map((tag) => (
        <li key={`${tag.framework}:${tag.code}`} title={tag.labelFr} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] leading-5">
          <span className="font-semibold text-primary">{curriculumTagDisplay(tag,compact).framework}</span>
          {!compact && <span className="text-muted-foreground">· {curriculumTagDisplay(tag,compact).label}</span>}
        </li>
      ))}
    </ul>
  );
}
