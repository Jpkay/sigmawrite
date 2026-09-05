-- Dictée attempts are a controlled-production evidence source (roadmap 1.4).
alter table public.competency_mastery_evidence_occurrences
  drop constraint if exists competency_mastery_evidence_occurrences_source_type_check;
alter table public.competency_mastery_evidence_occurrences
  add constraint competency_mastery_evidence_occurrences_source_type_check
  check (source_type in ('practice','reading','writing','dictation'));
