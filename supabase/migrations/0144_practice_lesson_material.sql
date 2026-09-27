-- Optional source annotations. NULL means unknown coverage, never zero exposure.
-- This does not approve annotations or establish historical completeness.
alter table public.competency_lessons
  add column material_exposure jsonb
  check (material_exposure is null or jsonb_typeof(material_exposure) = 'object');

create function public.invalidate_lesson_material_annotations()
returns trigger language plpgsql set search_path=public as $$
begin
  if row(new.node_id,new.explanation_fr,new.pattern_fr,new.examples_fr,new.exceptions_fr)
     is distinct from
     row(old.node_id,old.explanation_fr,old.pattern_fr,old.examples_fr,old.exceptions_fr) then
    -- Re-annotate the resulting source in a subsequent write. Even an attempted
    -- simultaneous annotation replacement cannot silently retain old coverage.
    new.material_exposure := null;
  end if;
  return new;
end
$$;
create trigger invalidate_lesson_material_annotations
before update on public.competency_lessons
for each row execute function public.invalidate_lesson_material_annotations();
