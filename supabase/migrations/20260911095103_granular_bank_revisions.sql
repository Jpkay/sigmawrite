-- New content and review revisions use new immutable bank IDs.
-- Exact canonical verification, approved taxonomy and per-bundle permissions remain mandatory.
begin;
create or replace function public.guard_granular_publication_permission() returns trigger
language plpgsql set search_path=public as $$
begin
 if tg_op<>'INSERT' then raise exception 'Granular publication permissions are immutable'; end if;
 if not exists (
  select 1 from diagnostic_item_bank_releases bank
  join taxonomy_releases taxonomy on taxonomy.id=bank.taxonomy_release_id
  where bank.id=new.bank_release_id and bank.bank_key ~ '^french-diagnostic-bank-v3(-r[1-9][0-9]*)?$'
    and bank.status<>'withdrawn' and bank.manifest_checksum=new.bank_checksum
    and taxonomy.status='published' and taxonomy.release_key='french-taxonomy-v3'
    and taxonomy.manifest_checksum=new.taxonomy_checksum
 ) then raise exception 'Granular permission parent version mismatch'; end if;
 return new;
end $$;

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
    if new.bank_key ~ '^french-diagnostic-bank-v3(-r[1-9][0-9]*)?$' and exists (
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

create or replace function public.publish_granular_parallel_release(
 p_release_key text,p_bundle jsonb,p_bundle_checksum text,p_preflight jsonb,p_publisher uuid
) returns uuid language plpgsql security definer set search_path=public as $$
declare
 bank_row diagnostic_item_bank_releases%rowtype;
 taxonomy_row taxonomy_releases%rowtype;
 existing granular_assessment_releases%rowtype;
 result_id uuid; saved_proof jsonb;
begin
 if nullif(btrim(p_release_key),'') is null or jsonb_typeof(p_bundle) is distinct from 'object'
  or p_bundle_checksum !~ '^sha256:[a-f0-9]{64}$' or p_bundle_checksum is null
  or p_preflight->>'bundleChecksum' is distinct from p_bundle_checksum
  or p_bundle #>> '{assessment,reviewPolicy,mode}' is distinct from 'parallel_review'
 then raise exception 'Invalid granular publication request'; end if;
 if not exists(select 1 from profiles where id=p_publisher and role='platform_admin') then
  raise exception 'Granular publisher must be a platform administrator'; end if;
 select * into strict bank_row from diagnostic_item_bank_releases where id=(p_bundle->>'bankId')::uuid for update;
 select * into strict taxonomy_row from taxonomy_releases where id=(p_bundle->>'taxonomyId')::uuid for share;
 if bank_row.bank_key !~ '^french-diagnostic-bank-v3(-r[1-9][0-9]*)?$' or bank_row.status='withdrawn'
  or bank_row.taxonomy_release_id<>taxonomy_row.id or taxonomy_row.status<>'published'
  or bank_row.manifest_checksum is distinct from p_bundle #>> '{assessment,bankChecksum}'
  or taxonomy_row.manifest_checksum is distinct from p_bundle #>> '{assessment,taxonomyChecksum}'
 then raise exception 'Granular publication parent mismatch'; end if;
 perform public.verify_granular_bank_snapshot(bank_row.id,taxonomy_row.id,p_bundle->'bank');
 insert into granular_bank_publication_permissions(bank_release_id,bundle_checksum,bank_checksum,taxonomy_checksum,preflight)
 values(bank_row.id,p_bundle_checksum,bank_row.manifest_checksum,taxonomy_row.manifest_checksum,p_preflight)
 on conflict(bank_release_id,bundle_checksum) do nothing;
 select preflight into strict saved_proof from granular_bank_publication_permissions where bank_release_id=bank_row.id and bundle_checksum=p_bundle_checksum;
 if saved_proof is distinct from p_preflight then raise exception 'Granular publication proof conflict'; end if;
 if bank_row.status<>'published' then
  update diagnostic_item_bank_releases set status='published',published_by=p_publisher,published_at=now(),
   validation_report=jsonb_build_object('valid',true,'mode','parallel_review','canonicalApprovedReadiness',bank_row.validation_report,'bundleChecksum',p_bundle_checksum)
  where id=bank_row.id;
 end if;
 select * into existing from granular_assessment_releases where release_key=p_release_key for update;
 if found then
  if existing.status<>'published' or existing.content_checksum<>p_bundle_checksum or existing.bundle is distinct from p_bundle then
   raise exception 'Granular release key already has different content'; end if;
  return existing.id;
 end if;
 insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
 values(p_release_key,taxonomy_row.id,bank_row.id,'published',p_bundle_checksum,p_bundle) returning id into result_id;
 return result_id;
end $$;
commit;
