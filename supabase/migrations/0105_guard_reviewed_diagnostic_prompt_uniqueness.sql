-- Human edits must not collapse distinct diagnostic slots into the same prompt.
-- Existing review evidence is preserved for editorial correction, while every
-- future approval/import is checked at the database boundary.

begin;

create or replace function public.guard_reviewed_diagnostic_prompt_uniqueness()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if new.prompt_version='diagnostic-bank-v2'
    and new.review_status in('auto_approved','human_approved')
    and exists(
      select 1
      from public.competency_items other
      where other.id<>new.id
        and other.primary_node_id=new.primary_node_id
        and other.prompt_version=new.prompt_version
        and other.review_status not in('rejected','retired')
        and lower(regexp_replace(btrim(other.prompt_fr),'\s+',' ','g'))
          =lower(regexp_replace(btrim(new.prompt_fr),'\s+',' ','g'))
    )
  then
    raise exception 'duplicate_diagnostic_prompt';
  end if;
  return new;
end
$$;

drop trigger if exists reviewed_diagnostic_prompt_uniqueness on public.competency_items;
create trigger reviewed_diagnostic_prompt_uniqueness
before insert or update of primary_node_id,prompt_version,prompt_fr,review_status
on public.competency_items
for each row execute function public.guard_reviewed_diagnostic_prompt_uniqueness();

revoke all on function public.guard_reviewed_diagnostic_prompt_uniqueness() from public,anon,authenticated;

comment on function public.guard_reviewed_diagnostic_prompt_uniqueness() is
  'Rejects auto- or human-approved diagnostic-v2 prompts that duplicate another live candidate for the same competency node.';

commit;
