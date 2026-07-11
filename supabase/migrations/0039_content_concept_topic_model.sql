-- G11: background-knowledge concepts and topics remain separate from language competencies.
alter table public.knowledge_concepts
  add column concept_key text,
  add column typical_familiarity numeric not null default .5 check (typical_familiarity between 0 and 1),
  add column risk_class text not null default 'low' check (risk_class in ('low','medium','high')),
  add column source_requirement text not null default 'none' check (source_requirement in ('none','trusted_evergreen','current_primary_sources')),
  add column review_status text not null default 'draft' check (review_status in ('draft','human_approved','rejected','retired')),
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

update public.knowledge_concepts set concept_key='legacy_'||replace(id::text,'-','') where concept_key is null;
alter table public.knowledge_concepts alter column concept_key set not null;
alter table public.knowledge_concepts add constraint knowledge_concepts_key_unique unique(concept_key);
alter table public.knowledge_concepts add constraint high_risk_requires_current_sources check(risk_class<>'high' or source_requirement='current_primary_sources');

create table public.content_concept_edges(
  id uuid primary key default gen_random_uuid(),
  source_concept_id uuid not null references public.knowledge_concepts(id) on delete cascade,
  target_concept_id uuid not null references public.knowledge_concepts(id) on delete cascade,
  edge_type text not null check(edge_type in ('prerequisite','related','contrasts_with')),
  rationale text not null,
  created_at timestamptz not null default now(),
  constraint content_concept_no_self_loop check(source_concept_id<>target_concept_id),
  unique(source_concept_id,target_concept_id,edge_type)
);

create table public.topic_aliases(
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  normalized_alias text not null,
  concept_id uuid not null references public.knowledge_concepts(id) on delete cascade,
  locale text not null default 'fr',
  confidence numeric not null default 1 check(confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique(normalized_alias,concept_id,locale)
);
create index topic_aliases_normalized on public.topic_aliases(normalized_alias);

create table public.interest_concepts(
  interest_key text not null,
  concept_id uuid not null references public.knowledge_concepts(id) on delete cascade,
  relevance numeric not null default 1 check(relevance between 0 and 1),
  created_at timestamptz not null default now(),
  primary key(interest_key,concept_id)
);

create table public.content_concept_sources(
  concept_id uuid not null references public.knowledge_concepts(id) on delete cascade,
  source_version_id uuid not null references public.taxonomy_source_versions(id) on delete restrict,
  relationship text not null check(relationship in ('authored_from','validated_by','grounded_by')),
  source_locator text,
  created_at timestamptz not null default now(),
  primary key(concept_id,source_version_id,relationship)
);

-- Preserve legacy prerequisite arrays as relational edges where referenced ids exist.
insert into public.content_concept_edges(source_concept_id,target_concept_id,edge_type,rationale)
select prerequisite_id,target.id,'prerequisite','Legacy prerequisite preserved during G11 migration.'
from public.knowledge_concepts target
cross join lateral unnest(coalesce(target.prerequisite_concept_ids,'{}'::uuid[])) prerequisite_id
join public.knowledge_concepts source on source.id=prerequisite_id
on conflict do nothing;

insert into public.knowledge_domains(key,label_fr) values
('geography','Géographie'),('media_literacy','Éducation aux médias'),('science','Sciences'),
('biology','Biologie'),('economics','Économie'),('health','Santé'),('society','Société')
on conflict(key) do nothing;

insert into public.knowledge_concepts(concept_key,domain_id,label_fr,description_fr,typical_familiarity,risk_class,source_requirement,review_status)
select v.key,d.id,v.label,v.description,v.familiarity,v.risk,v.source_requirement,'human_approved'
from (values
('migration_humaine','geography','Migration humaine','Déplacement durable ou temporaire de personnes entre lieux.',.45,'medium','trusted_evergreen'),
('lieu_et_territoire','geography','Lieu et territoire','Espace géographique nommé, habité, organisé ou parcouru.',.75,'low','none'),
('attention_numerique','media_literacy','Attention numérique','Mécanismes par lesquels une interface sollicite et retient l''attention.',.60,'low','none'),
('information_et_source','media_literacy','Information et source','Distinction entre une affirmation, son origine et les éléments qui la soutiennent.',.55,'low','none'),
('cycle_eau','science','Cycle de l''eau','Circulation de l''eau entre atmosphère, sols, cours d''eau et océans.',.60,'low','trusted_evergreen'),
('changement_et_cycle','science','Changement et cycle','Transformation répétée dont certaines étapes ramènent à un état comparable.',.65,'low','none'),
('ecosysteme','biology','Écosystème','Ensemble d''êtres vivants et de conditions physiques en interaction.',.50,'low','trusted_evergreen'),
('interaction_cause_effet','science','Interaction et causalité','Relation limitée par laquelle un facteur contribue à un changement observable.',.60,'low','none'),
('budget_personnel','economics','Budget personnel','Organisation de ressources limitées entre dépenses, épargne et priorités.',.45,'medium','trusted_evergreen'),
('sante_prevention','health','Santé et prévention','Mesures générales visant à réduire un risque sans diagnostic individuel.',.45,'high','current_primary_sources'),
('election_democratique','society','Élection démocratique','Processus institutionnel par lequel des électeurs choisissent des représentants ou une option.',.45,'high','current_primary_sources'),
('institution_publique','society','Institution publique','Organisation établie par des règles publiques pour exercer une fonction collective.',.50,'medium','trusted_evergreen')
) v(key,domain_key,label,description,familiarity,risk,source_requirement)
join public.knowledge_domains d on d.key=v.domain_key
on conflict(concept_key) do update set label_fr=excluded.label_fr,description_fr=excluded.description_fr,
typical_familiarity=excluded.typical_familiarity,risk_class=excluded.risk_class,source_requirement=excluded.source_requirement;

insert into public.content_concept_edges(source_concept_id,target_concept_id,edge_type,rationale)
select source.id,target.id,'prerequisite','Background concept prerequisite authored for the v1 topic model.'
from (values
('lieu_et_territoire','migration_humaine'),('information_et_source','attention_numerique'),
('changement_et_cycle','cycle_eau'),('interaction_cause_effet','ecosysteme'),
('information_et_source','sante_prevention'),('institution_publique','election_democratique')
) e(source_key,target_key)
join public.knowledge_concepts source on source.concept_key=e.source_key
join public.knowledge_concepts target on target.concept_key=e.target_key
on conflict do nothing;

insert into public.topic_aliases(alias,normalized_alias,concept_id)
select a.alias,lower(a.alias),c.id
from (values
('migration','migration_humaine'),('immigration','migration_humaine'),('région','lieu_et_territoire'),
('réseaux sociaux','attention_numerique'),('algorithme','attention_numerique'),('source','information_et_source'),
('cycle de l''eau','cycle_eau'),('pluie','cycle_eau'),('écosystème','ecosysteme'),('biodiversité','ecosysteme'),
('budget','budget_personnel'),('épargne','budget_personnel'),('santé','sante_prevention'),('médecine','sante_prevention'),
('élection','election_democratique'),('vote','election_democratique'),('gouvernement','institution_publique')
) a(alias,concept_key)
join public.knowledge_concepts c on c.concept_key=a.concept_key
on conflict do nothing;

insert into public.interest_concepts(interest_key,concept_id,relevance)
select i.interest,c.id,i.relevance
from (values
('football','migration_humaine',.7),('travel','lieu_et_territoire',1.0),('social_media','attention_numerique',1.0),
('technology','attention_numerique',.8),('environment','cycle_eau',.8),('animals','ecosysteme',1.0),
('money','budget_personnel',1.0),('medicine','sante_prevention',1.0),('politics','election_democratique',1.0)
) i(interest,concept_key,relevance)
join public.knowledge_concepts c on c.concept_key=i.concept_key
on conflict do nothing;

do $$ declare t text; begin foreach t in array array['content_concept_edges','topic_aliases','interest_concepts','content_concept_sources'] loop
execute format('alter table public.%I enable row level security',t);
execute format('create policy %I on public.%I for all using(public.is_staff()) with check(public.is_staff())',t||'_staff_write',t);
execute format('create policy %I on public.%I for select using(auth.uid() is not null)',t||'_authenticated_read',t);
end loop; end $$;

comment on table public.knowledge_concepts is 'Background-knowledge concepts, never language competency nodes.';
comment on table public.topic_aliases is 'Data-only topic matching aliases; aliases are never inserted into system instructions.';

