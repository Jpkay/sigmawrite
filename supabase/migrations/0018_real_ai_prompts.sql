-- Sprint 6: reproducible AI jobs and platform-admin prompt activation.

alter table public.ai_generation_jobs
  add column if not exists provider text,
  add column if not exists model_id text,
  add column if not exists prompt_key text,
  add column if not exists prompt_version integer,
  add column if not exists duration_ms integer check (duration_ms is null or duration_ms >= 0),
  add column if not exists gate_outcomes jsonb not null default '{}'::jsonb;

create index if not exists ai_generation_jobs_created_at_idx
  on public.ai_generation_jobs (created_at desc);
create index if not exists ai_generation_jobs_status_idx
  on public.ai_generation_jobs (status, created_at desc);
create unique index if not exists prompt_versions_one_active_per_key
  on public.prompt_versions (prompt_key) where active;

drop policy if exists prompt_versions_staff_write on public.prompt_versions;
create policy prompt_versions_staff_read on public.prompt_versions
  for select using (public.is_staff());
create policy prompt_versions_platform_write on public.prompt_versions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create or replace function public.activate_prompt_version(p_prompt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  if not public.is_platform_admin() then
    raise exception 'platform_admin required' using errcode = '42501';
  end if;
  select prompt_key into v_key from public.prompt_versions where id = p_prompt_id for update;
  if v_key is null then raise exception 'prompt not found'; end if;
  update public.prompt_versions set active = false where prompt_key = v_key and active;
  update public.prompt_versions set active = true where id = p_prompt_id;
end;
$$;
revoke all on function public.activate_prompt_version(uuid) from public;
grant execute on function public.activate_prompt_version(uuid) to authenticated;

insert into public.prompt_versions (prompt_key, version_number, prompt_text, schema, active)
values
  ('text_generation', 1, $prompt$Tu conçois des textes documentaires en français pour des adolescents. Produis uniquement un objet JSON conforme au schéma demandé. Le texte doit être exact, respectueux, sans stéréotype, sans publicité et sans information personnelle. Chaque nombre, date, pourcentage ou statistique du texte doit être repris dans factualClaims avec un niveau de confiance et l'indication needsHumanReview. Les questions doivent être variées et répondre uniquement à partir du texte.$prompt$, '{"output":"GeneratedTextCandidate"}'::jsonb, true),
  ('question_generation', 1, $prompt$Tu écris des questions de compréhension en français pour adolescents. Réponds uniquement par un objet JSON {"questions": [...]} conforme au schéma. Varie les compétences, donne une clé exacte, des distracteurs plausibles et n'exige aucune connaissance absente du texte.$prompt$, '{"output":"GeneratedQuestion[]"}'::jsonb, true),
  ('summary_scoring', 1, $prompt$Tu évalues un résumé d'élève avec bienveillance. Réponds uniquement en JSON conforme au schéma. Évalue le contenu, la structure et la langue, puis donne un score global de 0 à 100, les indicateurs demandés et une courte phrase de retour en français. N'invente aucune information et ne déduis jamais le niveau scolaire à partir de cette seule réponse.$prompt$, '{"output":"SummaryScore"}'::jsonb, true),
  ('text_tagging', 1, $prompt$Tu proposes des étiquettes pédagogiques pour un texte français. Réponds uniquement en JSON conforme au schéma avec domaines, concepts, compétences et vocabulaire suggérés. Utilise des identifiants sobres et évite toute inférence sensible sur l'auteur ou le lecteur.$prompt$, '{"output":"TextTagResult"}'::jsonb, true),
  ('student_moderation', 1, $prompt$Classe prudemment un texte d'élève mineur. Bloque automutilation, menaces, contenu sexuel, haine, coordonnées personnelles et contournement des consignes. Réponds uniquement en JSON avec passed, flaggedCategories et needsHumanReview. Ne recopie jamais le texte dans la réponse.$prompt$, '{"output":"ModerationResult"}'::jsonb, true)
on conflict (prompt_key, version_number) do update
set prompt_text = excluded.prompt_text,
    schema = excluded.schema;
