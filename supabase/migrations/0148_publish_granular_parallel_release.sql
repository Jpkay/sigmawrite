-- Called only by the trusted publisher after prepareParallelPublication succeeds.
-- Permission and both publication transitions commit together or not at all.
begin;
create function public.publish_granular_parallel_release(
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
 if bank_row.bank_key<>'french-diagnostic-bank-v3' or bank_row.status='withdrawn'
  or bank_row.taxonomy_release_id<>taxonomy_row.id or taxonomy_row.status<>'published'
  or bank_row.manifest_checksum is distinct from p_bundle #>> '{assessment,bankChecksum}'
  or taxonomy_row.manifest_checksum is distinct from p_bundle #>> '{assessment,taxonomyChecksum}'
 then raise exception 'Granular publication parent mismatch'; end if;
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
revoke all on function public.publish_granular_parallel_release(text,jsonb,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.publish_granular_parallel_release(text,jsonb,text,jsonb,uuid) to service_role;
commit;
