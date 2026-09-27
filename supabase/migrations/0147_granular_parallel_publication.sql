-- Exact-version permission for the separate granular French v3 publication.
-- Human review provenance stays on the original questions and is never rewritten.
begin;
create table public.granular_bank_publication_permissions (
 bank_release_id uuid not null references public.diagnostic_item_bank_releases(id) on delete restrict,
 bundle_checksum text not null check(bundle_checksum ~ '^sha256:[a-f0-9]{64}$'),
 bank_checksum text not null check(bank_checksum ~ '^sha256:[a-f0-9]{64}$'),
 taxonomy_checksum text not null check(taxonomy_checksum='sha256:ef2b63974c580b3070c879125b23567cdf6be703c344d0365b998d1f0f14e880'),
 preflight jsonb not null,
 created_at timestamptz not null default now(),
 primary key(bank_release_id,bundle_checksum),
 check ((preflight->>'version'='french-granular-parallel-publication-v1'
   and preflight->>'authorization'='product-owner-request-2026-09-11'
   and preflight->>'reviewOwner'='product_owner'
   and preflight->'ready'='true'::jsonb
   and (preflight->>'bankItemCount')::integer>0
   and preflight->>'bundleChecksum'=bundle_checksum
   and preflight->>'bankChecksum'=bank_checksum
   and preflight->>'taxonomyChecksum'=taxonomy_checksum
   and preflight->'instructionGapSkillIds'='[]'::jsonb
   and preflight->'freshCheckGapSkillIds'='[]'::jsonb) is true)
);
alter table public.granular_bank_publication_permissions enable row level security;
revoke all on public.granular_bank_publication_permissions from public,anon,authenticated,service_role;
grant select,insert on public.granular_bank_publication_permissions to service_role;

create function public.guard_granular_publication_permission() returns trigger
language plpgsql set search_path=public as $$
begin
 if tg_op<>'INSERT' then raise exception 'Granular publication permissions are immutable'; end if;
 if not exists (
  select 1 from diagnostic_item_bank_releases bank
  join taxonomy_releases taxonomy on taxonomy.id=bank.taxonomy_release_id
  where bank.id=new.bank_release_id and bank.bank_key='french-diagnostic-bank-v3'
    and bank.status<>'withdrawn' and bank.manifest_checksum=new.bank_checksum
    and taxonomy.status='published' and taxonomy.release_key='french-taxonomy-v3'
    and taxonomy.manifest_checksum=new.taxonomy_checksum
 ) then raise exception 'Granular permission parent version mismatch'; end if;
 return new;
end $$;
create trigger granular_permission_guard before insert or update or delete
on public.granular_bank_publication_permissions for each row
execute function public.guard_granular_publication_permission();

create or replace function public.guard_diagnostic_bank_publication()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_readiness jsonb;
begin
  -- Memberships cannot exist until their release row exists, so an insert
  -- cannot possibly prove bank readiness. Force every publication through a
  -- mutable draft/validating row and the fully guarded UPDATE transition.
  if tg_op='INSERT' then
    if new.status='published' then
      raise exception 'diagnostic_bank_must_publish_from_mutable_release';
    end if;
    return new;
  end if;

  -- Existing published/withdrawn rows remain governed by the original
  -- immutability trigger, including the one permitted withdrawal transition.
  if old.status not in ('published','withdrawn')
    and new.status='published'
  then
    if jsonb_typeof(new.manifest) is distinct from 'object'
      or new.manifest='{}'::jsonb
      or nullif(btrim(new.manifest_checksum),'') is null
      or nullif(btrim(new.manifest->>'checksum'),'') is null
      or new.manifest->>'checksum' is distinct from new.manifest_checksum
      or new.published_by is null
      or new.published_at is null
    then
      raise exception 'diagnostic_bank_publication_metadata_incomplete';
    end if;

    if jsonb_typeof(new.validation_report) is distinct from 'object'
      or not coalesce(
        new.validation_report @> '{"valid":true}'::jsonb,
        false
      )
    then
      raise exception 'diagnostic_bank_validation_failed';
    end if;

    if not exists(
      select 1 from public.taxonomy_releases taxonomy
      where taxonomy.id=new.taxonomy_release_id
        and taxonomy.status='published'
    ) then
      raise exception 'diagnostic_bank_taxonomy_not_published';
    end if;

    -- Partial publication (2026-09-05): items still awaiting human review may
    -- stay in the release; the live selectors never serve them. Rejected
    -- items and ungradable approved production items still block.
    if exists(
      select 1
      from public.diagnostic_item_bank_memberships membership
      join public.competency_items item on item.id=membership.item_id
      where membership.bank_release_id=old.id
        and (
          (item.review_status<>'needs_human_review'
            and not public.diagnostic_item_is_release_approved(membership.item_id))
          or (
            public.diagnostic_item_is_release_approved(membership.item_id)
            and membership.evidence_expectation='controlled_production'
            and item.response_type not in (
              'short_answer','cloze','transform'
            )
          )
        )
    ) then
      raise exception 'diagnostic_bank_contains_unapproved_items';
    end if;

    -- Product-owner release-while-reviewing decision. The separate granular
    -- publisher must validate and pin an exact bundle; this is not human approval.
    if new.bank_key='french-diagnostic-bank-v3' and exists (
      select 1 from public.granular_bank_publication_permissions permission
      join public.taxonomy_releases taxonomy on taxonomy.id=new.taxonomy_release_id
      where permission.bank_release_id=new.id
        and permission.bank_checksum=new.manifest_checksum
        and permission.taxonomy_checksum=taxonomy.manifest_checksum
        and taxonomy.release_key='french-taxonomy-v3'
        and (permission.preflight->>'bankItemCount')::integer=(select count(*) from diagnostic_item_bank_memberships membership where membership.bank_release_id=new.id)
    ) then return new; end if;

    v_readiness:=public.diagnostic_bank_readiness(
      new.taxonomy_release_id,old.id
    );
    if not coalesce((v_readiness->>'ready')::boolean,false) then
      raise exception 'diagnostic_bank_not_ready';
    end if;
  end if;

  return new;
end
$$;

create or replace function public.guard_granular_assessment_release() returns trigger
language plpgsql set search_path=public as $$
begin
  if TG_OP='UPDATE' and old.status in ('published','withdrawn') and
    (new.bundle is distinct from old.bundle or new.content_checksum is distinct from old.content_checksum
     or new.taxonomy_release_id is distinct from old.taxonomy_release_id or new.bank_release_id is distinct from old.bank_release_id
     or new.release_key is distinct from old.release_key or (old.status='withdrawn' and new.status<>'withdrawn')
     or new.status='draft') then
    raise exception 'Published assessment releases are immutable';
  end if;
  if new.status='published' and (
    not exists(select 1 from taxonomy_releases where id=new.taxonomy_release_id and status='published')
    or not exists(select 1 from diagnostic_item_bank_releases where id=new.bank_release_id and status='published' and taxonomy_release_id=new.taxonomy_release_id)
  ) then raise exception 'Published taxonomy and bank required'; end if;
  if new.status='published' and (
    nullif(new.bundle #>> '{assessment,taxonomyChecksum}', '') is null
    or nullif(new.bundle #>> '{assessment,bankChecksum}', '') is null
    or not exists (
      select 1 from taxonomy_releases taxonomy
      join diagnostic_item_bank_releases bank on bank.taxonomy_release_id=taxonomy.id
      where taxonomy.id=new.taxonomy_release_id and bank.id=new.bank_release_id
        and taxonomy.manifest_checksum=new.bundle #>> '{assessment,taxonomyChecksum}'
        and bank.manifest_checksum=new.bundle #>> '{assessment,bankChecksum}'
    )
  ) then raise exception 'Granular assessment parent content version mismatch'; end if;
  if new.status='published' and new.bundle #>> '{assessment,reviewPolicy,mode}'='parallel_review'
    and not exists (
      select 1 from granular_bank_publication_permissions permission
      where permission.bank_release_id=new.bank_release_id
        and permission.bundle_checksum=new.content_checksum
        and permission.bank_checksum=new.bundle #>> '{assessment,bankChecksum}'
        and permission.taxonomy_checksum=new.bundle #>> '{assessment,taxonomyChecksum}'
    ) then raise exception 'Exact granular publication permission required'; end if;
  return new;
end $$;

commit;
