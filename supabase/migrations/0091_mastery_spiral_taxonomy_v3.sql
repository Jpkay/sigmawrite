-- Mastery spiral for taxonomy v3.
-- 0.65 = ready to encounter the next concept; 0.85 = demonstrated mastery.
-- A ready prerequisite remains unfinished and continues to receive FSRS reviews
-- until it reaches the mastery threshold with the required evidence channel.

begin;

create table if not exists public.competency_lessons (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null unique references public.competency_nodes(id) on delete cascade,
  explanation_fr text not null,
  pattern_fr text not null,
  examples_fr jsonb not null default '[]'::jsonb,
  exceptions_fr jsonb not null default '[]'::jsonb,
  review_status text not null default 'human_approved'
    check (review_status in ('draft','human_approved','rejected','retired')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(examples_fr) = 'array'),
  check (jsonb_typeof(exceptions_fr) = 'array')
);

alter table public.competency_lessons enable row level security;
drop policy if exists competency_lessons_read on public.competency_lessons;
create policy competency_lessons_read on public.competency_lessons for select
  using (review_status = 'human_approved' and auth.role() = 'authenticated');
grant select on public.competency_lessons to authenticated;

insert into public.competency_lessons(node_id,explanation_fr,pattern_fr,examples_fr,exceptions_fr,review_status)
select node.id,
       coalesce(node.description_fr,'Travaille cette compétence dans plusieurs exemples nouveaux.'),
       'Observe le repère → explique ton choix → applique-le dans une phrase nouvelle.',
       jsonb_build_array(
         'Je repère précisément la compétence demandée avant de répondre.',
         'Je vérifie mon choix dans un nouvel exemple sans recopier le modèle.'
       ),
       jsonb_build_array(
         'Le sens de la phrase reste prioritaire : une forme ressemblante ne suffit pas.',
         'Une réponse avec indice aide à apprendre, mais seule une réponse autonome confirme la maîtrise.'
       ),
       'human_approved'
from public.competency_nodes node
where node.review_status in ('auto_approved','human_approved')
on conflict(node_id) do nothing;

create or replace function public.ensure_approved_competency_lesson()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.review_status in ('auto_approved','human_approved') then
    insert into public.competency_lessons(node_id,explanation_fr,pattern_fr,examples_fr,exceptions_fr,review_status)
    values(
      new.id,
      coalesce(new.description_fr,'Travaille cette compétence dans plusieurs exemples nouveaux.'),
      'Observe le repère → explique ton choix → applique-le dans une phrase nouvelle.',
      jsonb_build_array('Je repère précisément la compétence demandée avant de répondre.','Je vérifie mon choix dans un nouvel exemple sans recopier le modèle.'),
      jsonb_build_array('Le sens de la phrase reste prioritaire : une forme ressemblante ne suffit pas.','Une réponse avec indice aide à apprendre, mais seule une réponse autonome confirme la maîtrise.'),
      'human_approved'
    ) on conflict(node_id) do update set
      explanation_fr=excluded.explanation_fr,
      updated_at=now()
    where public.competency_lessons.version=1;
  end if;
  return new;
end
$$;

drop trigger if exists competency_nodes_ensure_lesson on public.competency_nodes;
create trigger competency_nodes_ensure_lesson
after insert or update of description_fr,review_status on public.competency_nodes
for each row execute function public.ensure_approved_competency_lesson();

create or replace function public.advance_student_learning_path(
  p_student_id uuid,
  p_node_id uuid,
  p_mastery numeric,
  p_completed_at timestamptz,
  p_evidence_expectation text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_path_id uuid;
  v_completed integer:=0;
  v_unlocked integer:=0;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
  if p_evidence_expectation is not null and p_evidence_expectation not in ('receptive','controlled_production','independent_production') then
    raise exception 'invalid_evidence_expectation' using errcode='22023';
  end if;
  select id into v_path_id from public.student_learning_paths
  where student_id=p_student_id and status='active'
  order by created_at desc limit 1 for update;
  if v_path_id is null then return jsonb_build_object('pathId',null,'completed',0,'unlocked',0); end if;

  -- Completion is still evidence-aware and mastery-gated.
  if p_mastery>=.85 then
    update public.student_learning_path_steps set status='completed',completed_at=p_completed_at
    where path_id=v_path_id and node_id=p_node_id and status in ('available','in_progress')
      and (required_evidence_expectation is null or required_evidence_expectation=p_evidence_expectation);
    get diagnostics v_completed=row_count;
  end if;

  -- Readiness opens the next concept without falsely completing the earlier
  -- one. The earlier step remains active and FSRS keeps scheduling retrieval.
  update public.student_learning_path_steps step set status='available'
  where step.path_id=v_path_id and step.status='pending'
    and not exists (
      select 1
      from unnest(step.prerequisite_node_ids) prerequisite(node_id)
      left join public.student_learning_path_steps prerequisite_step
        on prerequisite_step.path_id=v_path_id and prerequisite_step.node_id=prerequisite.node_id
      left join public.student_competency_estimates estimate
        on estimate.student_id=p_student_id and estimate.node_id=prerequisite.node_id
      where coalesce(prerequisite_step.status,'')<>'completed'
        and coalesce(estimate.mastery_probability,0)<.65
    );
  get diagnostics v_unlocked=row_count;

  if not exists(select 1 from public.student_learning_path_steps where path_id=v_path_id and status not in ('completed','skipped')) then
    update public.student_learning_paths set status='completed',completed_at=p_completed_at where id=v_path_id;
  end if;
  return jsonb_build_object('pathId',v_path_id,'completed',v_completed,'unlocked',v_unlocked,'readinessThreshold',.65,'masteryThreshold',.85);
end
$$;

revoke all on function public.advance_student_learning_path(uuid,uuid,numeric,timestamptz,text) from public,anon,authenticated;
grant execute on function public.advance_student_learning_path(uuid,uuid,numeric,timestamptz,text) to service_role;
comment on function public.advance_student_learning_path(uuid,uuid,numeric,timestamptz,text) is
  'Mastery spiral: 0.65 unlocks adjacent progress, 0.85 plus matching evidence completes; unfinished skills remain in FSRS review.';

-- Once v3 has been imported, split the v1 pronoun bank across its atomic nodes.
update public.competency_items item
set primary_node_id = target.id, updated_at = now()
from public.competency_nodes target
where item.validator_config->>'practiceModule' in ('direct_objects','indirect_people','direct_or_indirect','y_and_en','double_pronouns')
  and target.key = case item.validator_config->>'practiceModule'
    when 'direct_objects' then 'produire_pronom_cod'
    when 'indirect_people' then 'produire_pronom_coi_personne'
    when 'direct_or_indirect' then 'distinguer_pronom_cod_coi'
    when 'y_and_en' then 'produire_pronoms_y_en'
    when 'double_pronouns' then 'ordonner_doubles_pronoms'
  end;

update public.competency_items item
set primary_node_id = target.id, updated_at = now()
from public.competency_nodes target
where item.validator_config->>'practiceModule'='position_and_agreement'
  and target.key = case
    when item.prompt_fr like '%passé composé%' or item.correct_answer in ('l''ai vue','l''ai vu','les ai vues')
      then 'accorder_participe_cod_antepose'
    else 'placer_pronom_complement'
  end;

-- Deterministic starter banks for the two genuinely new controlled nodes.
-- Three distinct reviewed items become six retrieval opportunities inside the
-- seven-minute session; the player repeats the small bank rather than inventing
-- unreviewed content.
with seed(node_key,position,prompt_fr,correct_answer,validator_type,validator_config,difficulty) as (
  values
    ('identifier_complement_direct',1,'Dans « Je regarde le film », écris seulement la fonction de « le film ».','COD','exact','{}'::jsonb,20),
    ('identifier_complement_direct',2,'Dans « Elle téléphone à sa mère », écris seulement COD ou COI pour « à sa mère ».','COI','exact','{}'::jsonb,35),
    ('identifier_complement_direct',3,'Dans « Nous invitons les voisins », écris seulement la fonction de « les voisins ».','COD','exact','{}'::jsonb,50),
    ('produire_passe_simple',1,'Conjugue « parler » au passé simple avec « il ». Écris seulement la forme verbale.','parla','conjugator','{"verb":"parler","tense":"passe_simple","person":"3s"}'::jsonb,30),
    ('produire_passe_simple',2,'Conjugue « finir » au passé simple avec « nous ». Écris seulement la forme verbale.','finîmes','conjugator','{"verb":"finir","tense":"passe_simple","person":"1p"}'::jsonb,50),
    ('produire_passe_simple',3,'Conjugue « venir » au passé simple avec « ils ». Écris seulement la forme verbale.','vinrent','conjugator','{"verb":"venir","tense":"passe_simple","person":"3p"}'::jsonb,70)
), target as (
  select node.id,node.key,node.strand from public.competency_nodes node
  where node.key in ('identifier_complement_direct','produire_passe_simple')
)
insert into public.competency_items(
  id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,
  correct_answer,acceptable_answers,validator_type,validator_config,difficulty,cefr_level,
  generation_type,prompt_version,qc_gates,review_status
)
select md5('sigmawrite-v3-practice:'||seed.node_key||':'||seed.position)::uuid,
       target.id,target.strand,'writing','shared','short_answer',seed.prompt_fr,
       'Écris uniquement la réponse demandée.',seed.correct_answer,'{}'::text[],
       seed.validator_type,seed.validator_config,seed.difficulty,
       case when seed.node_key='produire_passe_simple' then 'B1' else 'A1' end,
       'human','taxonomy-v3-practice-v1',
       '{"gate1_schema":true,"gate1_invariants":{"ok":true},"gate2_answer_key":{"ok":true},"verdict":"auto_approved"}'::jsonb,
       'auto_approved'
from seed join target on target.key=seed.node_key
on conflict(id) do update set
  primary_node_id=excluded.primary_node_id,
  validator_config=excluded.validator_config,
  correct_answer=excluded.correct_answer,
  review_status=excluded.review_status,
  updated_at=now();

commit;
