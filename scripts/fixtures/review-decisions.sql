-- Local-only browser fixture. Never apply to a hosted database.
insert into public.competency_nodes(id,key,strand,label_fr,review_status)
values('57000000-0000-4000-8000-000000000001','review-decision-browser-test','grammaire_syntaxe','Relecture automatique','human_approved')
on conflict(id) do nothing;
insert into public.competency_items(id,primary_node_id,strand,modality,response_type,prompt_fr,correct_answer,validator_type,review_status,prompt_version,updated_at)
select ('58000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  '57000000-0000-4000-8000-000000000001','grammaire_syntaxe','writing','short_answer',
  case when n>25 then 'Exercice en double : écris le mot bonjour.' else 'Exercice ' || n || ' : écris le mot bonjour.' end,
  'bonjour','exact','needs_human_review','diagnostic-bank-v2', '2020-01-01'::timestamptz + (28-n)*interval '1 minute'
from generate_series(1,27) n
on conflict(id) do update set review_status='needs_human_review',reviewed_at=null,reviewer_profile_id=null,review_note=null;
