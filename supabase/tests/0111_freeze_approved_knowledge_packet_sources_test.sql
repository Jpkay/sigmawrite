begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(2);

select has_trigger(
  'public','knowledge_packet_sources','guard_knowledge_packet_source_mutation',
  'Packet sources have a database immutability guard'
);
select throws_ok(
  $$insert into public.knowledge_packet_sources(packet_id,source_uri,title,publisher,relationship,is_primary,accessed_at)
    select p.id,'https://example.test/late-source','Late source','Example','validated_by',false,now()
    from public.knowledge_concept_packets p where p.status='human_approved' limit 1$$,
  null,'only_draft_packet_sources_are_mutable',
  'Sources cannot be attached after packet approval'
);

select * from finish();
rollback;
