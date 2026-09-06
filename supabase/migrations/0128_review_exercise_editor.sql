begin;

-- Preserve choice identities and update the entire pending exercise atomically.
create or replace function public.save_review_exercise_content(
  p_item_id uuid, p_prompt_fr text, p_correct_answer text, p_choices jsonb
) returns void
language plpgsql security definer set search_path=public
as $$
declare
  v_item public.competency_items;
  v_choice jsonb;
  v_count integer;
begin
  if not public.is_platform_admin() then
    if not public.is_active_content_reviewer() then raise exception 'reviewer_access_denied'; end if;
    perform 1 from public.competency_item_review_assignments
      where item_id=p_item_id and reviewer_profile_id=public.current_profile_id() and status='assigned'
      for update;
    if not found then raise exception 'item_assignment_not_found'; end if;
  end if;
  select * into v_item from public.competency_items where id=p_item_id for update;
  if not found or v_item.review_status<>'needs_human_review'
    or coalesce(v_item.prompt_version,'') not in ('diagnostic-bank-v2','taxonomy-v3-practice-v1') then
    raise exception 'item_not_reviewable';
  end if;
  if p_prompt_fr is null or char_length(btrim(p_prompt_fr)) not between 5 and 4000
    or char_length(coalesce(p_correct_answer,''))>1000
    or p_choices is null or jsonb_typeof(p_choices)<>'array' then raise exception 'invalid_review_content'; end if;
  select count(*) into v_count from public.competency_item_choices where item_id=p_item_id;
  if jsonb_array_length(p_choices)<>v_count or v_count>20 then raise exception 'invalid_review_choices'; end if;
  if (select count(distinct value->>'id') from jsonb_array_elements(p_choices))<>v_count then raise exception 'invalid_review_choices'; end if;
  if v_count>0 and (select count(*) from jsonb_array_elements(p_choices) where value->'correct'='true'::jsonb)<>1 then raise exception 'invalid_answer_key'; end if;
  if (select count(distinct lower(btrim(value->>'text'))) from jsonb_array_elements(p_choices))<>v_count then raise exception 'duplicate_choices'; end if;
  for v_choice in select value from jsonb_array_elements(p_choices) loop
    if v_choice->>'text' is null or char_length(btrim(v_choice->>'text')) not between 1 and 2000
      or char_length(coalesce(v_choice->>'feedbackFr',''))>2000
      or jsonb_typeof(v_choice->'correct') is distinct from 'boolean' then raise exception 'invalid_review_choice'; end if;
    update public.competency_item_choices set choice_text=btrim(v_choice->>'text'),
      is_correct=(v_choice->>'correct')::boolean, feedback_fr=nullif(btrim(v_choice->>'feedbackFr'),'')
      where id=(v_choice->>'id')::uuid and item_id=p_item_id;
    if not found then raise exception 'invalid_review_choice'; end if;
  end loop;
  update public.competency_items set prompt_fr=btrim(p_prompt_fr),
    correct_answer=case when v_count>0 then (select btrim(value->>'text') from jsonb_array_elements(p_choices) where value->'correct'='true'::jsonb) else nullif(btrim(p_correct_answer),'') end,
    updated_at=now()
    where id=p_item_id;
  insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata)
    values(public.current_profile_id(),'competency_item.edited','competency_item',p_item_id,'{"reviewEditor":true}'::jsonb);
end
$$;
revoke all on function public.save_review_exercise_content(uuid,text,text,jsonb) from public,anon;
grant execute on function public.save_review_exercise_content(uuid,text,text,jsonb) to authenticated;
commit;
