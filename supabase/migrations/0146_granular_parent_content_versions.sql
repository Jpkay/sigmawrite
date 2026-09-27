-- Require exact immutable parent versions, not only published parent identities.
-- Existing published rows are unchanged; new publication must prove provenance.
begin;

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
  return new;
end $$;

commit;
