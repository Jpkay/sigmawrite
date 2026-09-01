-- One transaction owns the diagnostic evidence write. App-side grading passes a
-- trusted score; the database validates the issued occurrence and applies it once.

create or replace function public.diagnostic_bkt_update(
  p_prior numeric,p_correct boolean,p_guess numeric default .2,
  p_transit numeric default .15,p_slip numeric default .1
) returns numeric language sql immutable parallel safe as $$
  select greatest(0,least(1,
    (case when p_correct then
      (greatest(0,least(1,p_prior))*(1-p_slip)) /
      greatest(1e-9,greatest(0,least(1,p_prior))*(1-p_slip)+(1-greatest(0,least(1,p_prior)))*p_guess)
    else
      (greatest(0,least(1,p_prior))*p_slip) /
      greatest(1e-9,greatest(0,least(1,p_prior))*p_slip+(1-greatest(0,least(1,p_prior)))*(1-p_guess))
    end) + (1-(case when p_correct then
      (greatest(0,least(1,p_prior))*(1-p_slip)) /
      greatest(1e-9,greatest(0,least(1,p_prior))*(1-p_slip)+(1-greatest(0,least(1,p_prior)))*p_guess)
    else
      (greatest(0,least(1,p_prior))*p_slip) /
      greatest(1e-9,greatest(0,least(1,p_prior))*p_slip+(1-greatest(0,least(1,p_prior)))*(1-p_guess))
    end))*p_transit
  ))
$$;

create or replace function public.diagnostic_mastery_uncertainty(
  p_mastery numeric,p_evidence_count integer
) returns numeric language sql immutable parallel safe as $$
  select greatest(0,least(1,
    .6/(1+greatest(0,p_evidence_count))
    + .4*(1-abs(greatest(0,least(1,p_mastery))-.5)*2)
  ))
$$;

create or replace function public.submit_section_diagnostic_response(
  p_student_id uuid,
  p_run_id uuid,
  p_run_item_id uuid,
  p_item_id uuid,
  p_idempotency_key uuid,
  p_selected_choice_id uuid,
  p_answer_text text,
  p_is_correct boolean,
  p_latency_ms integer,
  p_dimensions text[],
  p_mastery_evidence_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_run public.diagnostic_runs%rowtype;
  v_assignment public.diagnostic_run_items%rowtype;
  v_item public.competency_items%rowtype;
  v_existing public.diagnostic_responses%rowtype;
  v_response_id uuid;
  v_previous public.student_competency_estimates%rowtype;
  v_prior numeric;
  v_mastery numeric;
  v_uncertainty numeric;
  v_evidence_count integer;
  v_probe_count integer;
  v_guess numeric;
  v_dimension text;
  v_dim_mastery numeric;
  v_dim_uncertainty numeric;
  v_dim_evidence_count integer;
  v_run_dim_count integer;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
  select * into v_run from public.diagnostic_runs
  where id=p_run_id and student_id=p_student_id and status='running' for update;
  if not found then raise exception 'diagnostic_run_not_found'; end if;

  select * into v_assignment from public.diagnostic_run_items
  where id=p_run_item_id and run_id=p_run_id for update;
  if not found or v_assignment.item_id<>p_item_id then raise exception 'diagnostic_assignment_mismatch'; end if;

  select * into v_existing from public.diagnostic_responses
  where student_id=p_student_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.run_id<>p_run_id or v_existing.run_item_id<>p_run_item_id then
      raise exception 'diagnostic_idempotency_key_reused';
    end if;
    return jsonb_build_object(
      'replayed',true,'responseId',v_existing.id,'correct',v_existing.is_correct,
      'probeCount',v_run.probe_count
    );
  end if;

  if v_assignment.answered_at is not null then raise exception 'diagnostic_assignment_already_answered'; end if;
  select * into v_item from public.competency_items where id=p_item_id;
  if not found or v_item.primary_node_id<>v_assignment.node_id then raise exception 'diagnostic_item_mismatch'; end if;

  insert into public.diagnostic_responses(
    run_item_id,run_id,student_id,idempotency_key,selected_choice_id,answer_text,
    score,is_correct,latency_ms,answered_at
  ) values (
    p_run_item_id,p_run_id,p_student_id,p_idempotency_key,p_selected_choice_id,
    p_answer_text,case when p_is_correct then 1 else 0 end,p_is_correct,
    greatest(0,p_latency_ms),now()
  ) returning id into v_response_id;

  insert into public.competency_attempts(
    student_id,item_id,node_id,learner_mode,modality,answer_text,
    selected_choice_id,is_correct,score,latency_ms,context,diagnostic_run_id,
    diagnostic_response_id,attempted_at
  ) values (
    p_student_id,p_item_id,v_item.primary_node_id,v_item.learner_mode,v_item.modality,
    p_answer_text,p_selected_choice_id,p_is_correct,case when p_is_correct then 1 else 0 end,
    greatest(0,p_latency_ms),'diagnostic',p_run_id,v_response_id,now()
  );

  select * into v_previous from public.student_competency_estimates
  where student_id=p_student_id and node_id=v_item.primary_node_id for update;
  v_prior:=case when found and v_previous.estimate_source<>'diagnostic_inference'
    then v_previous.mastery_probability else .5 end;
  v_evidence_count:=coalesce(v_previous.evidence_count,0)+1;
  select count(*) into v_guess from public.competency_item_choices where item_id=p_item_id;
  v_guess:=case when v_guess>=2 then 1/v_guess else .2 end;
  v_mastery:=public.diagnostic_bkt_update(v_prior,p_is_correct,v_guess);
  v_uncertainty:=public.diagnostic_mastery_uncertainty(v_mastery,v_evidence_count);

  insert into public.student_competency_estimates(
    student_id,node_id,mastery_probability,uncertainty,evidence_count,
    estimate_source,inferred_from_node_id,last_diagnostic_run_id,
    last_practiced_at,last_evidence_at,updated_at
  ) values (
    p_student_id,v_item.primary_node_id,v_mastery,v_uncertainty,v_evidence_count,
    'direct',null,p_run_id,now(),now(),now()
  ) on conflict (student_id,node_id) do update set
    mastery_probability=excluded.mastery_probability,uncertainty=excluded.uncertainty,
    evidence_count=excluded.evidence_count,estimate_source='direct',inferred_from_node_id=null,
    last_diagnostic_run_id=p_run_id,last_practiced_at=now(),last_evidence_at=now(),updated_at=now();

  foreach v_dimension in array coalesce(p_dimensions,'{}'::text[]) loop
    if v_dimension not in ('receptive','productive','written','oral') then
      raise exception 'invalid_diagnostic_dimension';
    end if;
    select mastery_probability,evidence_count into v_dim_mastery,v_dim_evidence_count
    from public.student_competency_dimension_estimates
    where student_id=p_student_id and node_id=v_item.primary_node_id and dimension=v_dimension
    for update;
    v_dim_evidence_count:=coalesce(v_dim_evidence_count,0)+1;
    v_dim_mastery:=public.diagnostic_bkt_update(coalesce(v_dim_mastery,.5),p_is_correct,v_guess);
    v_dim_uncertainty:=public.diagnostic_mastery_uncertainty(v_dim_mastery,v_dim_evidence_count);
    insert into public.student_competency_dimension_estimates(
      student_id,node_id,dimension,mastery_probability,uncertainty,evidence_count,last_evidence_at,updated_at
    ) values (
      p_student_id,v_item.primary_node_id,v_dimension,v_dim_mastery,v_dim_uncertainty,
      v_dim_evidence_count,now(),now()
    ) on conflict (student_id,node_id,dimension) do update set
      mastery_probability=excluded.mastery_probability,uncertainty=excluded.uncertainty,
      evidence_count=excluded.evidence_count,last_evidence_at=now(),updated_at=now();

    select direct_evidence_count into v_run_dim_count
    from public.diagnostic_node_dimension_results
    where run_id=p_run_id and node_id=v_item.primary_node_id and dimension=v_dimension;
    v_run_dim_count:=coalesce(v_run_dim_count,0)+1;
    insert into public.diagnostic_node_dimension_results(
      run_id,student_id,node_id,dimension,mastery_evidence_id,mastery_probability,
      uncertainty,direct_evidence_count,classification,updated_at
    ) values (
      p_run_id,p_student_id,v_item.primary_node_id,v_dimension,p_mastery_evidence_id,
      v_dim_mastery,v_dim_uncertainty,v_run_dim_count,
      case when v_run_dim_count>=2 and v_dim_mastery>=.85 then 'mastered'
        when v_dim_mastery>=.5 then 'fragile' else 'missing' end,now()
    ) on conflict (run_id,node_id,dimension) do update set
      mastery_evidence_id=excluded.mastery_evidence_id,
      mastery_probability=excluded.mastery_probability,uncertainty=excluded.uncertainty,
      direct_evidence_count=excluded.direct_evidence_count,
      classification=excluded.classification,updated_at=now();
  end loop;

  perform public.apply_diagnostic_graph_inference(
    p_student_id,p_run_id,v_item.primary_node_id,v_assignment.section_key,
    v_mastery,v_uncertainty,p_is_correct
  );
  update public.diagnostic_run_items set answered_at=now() where id=p_run_item_id;
  select count(*)::int into v_probe_count from public.diagnostic_responses where run_id=p_run_id;
  update public.diagnostic_runs set probe_count=v_probe_count where id=p_run_id;
  return jsonb_build_object(
    'replayed',false,'responseId',v_response_id,'correct',p_is_correct,
    'probeCount',v_probe_count,'mastery',v_mastery,'uncertainty',v_uncertainty
  );
end
$$;

revoke all on function public.submit_section_diagnostic_response(
  uuid,uuid,uuid,uuid,uuid,uuid,text,boolean,integer,text[],uuid
) from public;
grant execute on function public.submit_section_diagnostic_response(
  uuid,uuid,uuid,uuid,uuid,uuid,text,boolean,integer,text[],uuid
) to service_role;

comment on function public.submit_section_diagnostic_response(
  uuid,uuid,uuid,uuid,uuid,uuid,text,boolean,integer,text[],uuid
) is 'Atomically records one issued diagnostic occurrence and all graph/dimension evidence exactly once.';
