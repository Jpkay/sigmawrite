-- Evidence attached to an approved packet is part of the reviewed snapshot.
-- Editors must retire the packet and create a new version to change sources.

create or replace function public.guard_knowledge_packet_source_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op in ('UPDATE','DELETE') and not exists (
    select 1 from public.knowledge_concept_packets
    where id = old.packet_id and status = 'draft'
  ) then
    raise exception 'only_draft_packet_sources_are_mutable';
  end if;
  if tg_op in ('INSERT','UPDATE') and not exists (
    select 1 from public.knowledge_concept_packets
    where id = new.packet_id and status = 'draft'
  ) then
    raise exception 'only_draft_packet_sources_are_mutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger guard_knowledge_packet_source_mutation
  before insert or update or delete on public.knowledge_packet_sources
  for each row execute function public.guard_knowledge_packet_source_mutation();

comment on function public.guard_knowledge_packet_source_mutation() is
  'Preserves the exact source snapshot reviewed with an approved knowledge packet.';
