-- A generic MCQ stem is not the complete exercise: learners also see its
-- choices. Compare the whole visible surface so distinct word/answer sets are
-- allowed, while shuffled or case/whitespace-altered duplicates remain blocked.

begin;

create or replace function public.normalized_diagnostic_item_surface(
  p_item_id uuid,
  p_response_type text,
  p_prompt_fr text
) returns text
language sql
stable
security definer
set search_path=public
as $$
  select
    case when p_response_type='mcq' then 'mcq:' else 'open:' end
    || lower(regexp_replace(btrim(coalesce(p_prompt_fr,'')),'\s+',' ','g'))
    || case when p_response_type='mcq' then
      ':' || coalesce((
        select string_agg(
          lower(regexp_replace(btrim(choice.choice_text),'\s+',' ','g')),
          chr(31)
          order by lower(regexp_replace(btrim(choice.choice_text),'\s+',' ','g'))
        )
        from public.competency_item_choices choice
        where choice.item_id=p_item_id
      ),'')
    else '' end
$$;

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
        and public.normalized_diagnostic_item_surface(
          other.id,other.response_type,other.prompt_fr
        )=public.normalized_diagnostic_item_surface(
          new.id,new.response_type,new.prompt_fr
        )
    )
  then
    raise exception 'duplicate_diagnostic_prompt';
  end if;
  return new;
end
$$;

create or replace function public.guard_reviewed_diagnostic_choice_uniqueness()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_item_id uuid:=case when tg_op='DELETE' then old.item_id else new.item_id end;
  v_item public.competency_items;
begin
  select * into v_item
  from public.competency_items item
  where item.id=v_item_id;

  if found
    and v_item.prompt_version='diagnostic-bank-v2'
    and v_item.response_type='mcq'
    and v_item.review_status in('auto_approved','human_approved')
    and exists(
      select 1
      from public.competency_items other
      where other.id<>v_item.id
        and other.primary_node_id=v_item.primary_node_id
        and other.prompt_version=v_item.prompt_version
        and other.review_status not in('rejected','retired')
        and public.normalized_diagnostic_item_surface(
          other.id,other.response_type,other.prompt_fr
        )=public.normalized_diagnostic_item_surface(
          v_item.id,v_item.response_type,v_item.prompt_fr
        )
    )
  then
    raise exception 'duplicate_diagnostic_prompt';
  end if;

  return case when tg_op='DELETE' then old else new end;
end
$$;

drop trigger if exists reviewed_diagnostic_choice_uniqueness_insert_delete
  on public.competency_item_choices;
create trigger reviewed_diagnostic_choice_uniqueness_insert_delete
after insert or delete on public.competency_item_choices
for each row execute function public.guard_reviewed_diagnostic_choice_uniqueness();

drop trigger if exists reviewed_diagnostic_choice_uniqueness_update
  on public.competency_item_choices;
create trigger reviewed_diagnostic_choice_uniqueness_update
after update of item_id,choice_text on public.competency_item_choices
for each row execute function public.guard_reviewed_diagnostic_choice_uniqueness();

revoke all on function public.normalized_diagnostic_item_surface(uuid,text,text)
  from public,anon,authenticated;
revoke all on function public.guard_reviewed_diagnostic_choice_uniqueness()
  from public,anon,authenticated;

comment on function public.normalized_diagnostic_item_surface(uuid,text,text) is
  'Normalizes an open prompt or an MCQ prompt plus its order-insensitive visible choices for duplicate detection.';
comment on function public.guard_reviewed_diagnostic_prompt_uniqueness() is
  'Rejects approved same-node diagnostic-v2 items with the same complete learner-visible surface.';

commit;
