-- Service-only transport for large release payloads. The existing locked
-- publication function remains the sole authority that activates a release.
begin;
create table public.granular_publication_uploads (
 id uuid primary key,
 payload_checksum text not null check(payload_checksum ~ '^sha256:[a-f0-9]{64}$'),
 byte_length integer not null check(byte_length between 1 and 67108864),
 chunk_count integer not null check(chunk_count between 1 and 512),
 created_at timestamptz not null default now(),
 published_release_id uuid references public.granular_assessment_releases(id)
);
create table public.granular_publication_upload_chunks (
 upload_id uuid not null references public.granular_publication_uploads(id) on delete cascade,
 position integer not null check(position between 0 and 511),
 payload bytea not null check(octet_length(payload) between 1 and 262144),
 primary key(upload_id,position)
);
alter table public.granular_publication_uploads enable row level security;
alter table public.granular_publication_upload_chunks enable row level security;
revoke all on public.granular_publication_uploads,public.granular_publication_upload_chunks from public,anon,authenticated,service_role;

create function public.begin_granular_publication_upload(p_id uuid,p_checksum text,p_bytes integer,p_chunks integer)
returns void language plpgsql security definer set search_path=public as $$
declare saved granular_publication_uploads%rowtype;
begin
 insert into granular_publication_uploads(id,payload_checksum,byte_length,chunk_count)
 values(p_id,p_checksum,p_bytes,p_chunks) on conflict(id) do nothing;
 select * into strict saved from granular_publication_uploads where id=p_id for update;
 if saved.payload_checksum is distinct from p_checksum or saved.byte_length is distinct from p_bytes or saved.chunk_count is distinct from p_chunks then
  raise exception 'Publication upload identity conflict';
 end if;
end $$;

create function public.append_granular_publication_chunk(p_id uuid,p_position integer,p_base64 text)
returns void language plpgsql security definer set search_path=public as $$
declare saved granular_publication_uploads%rowtype; bytes bytea; previous bytea;
begin
 select * into strict saved from granular_publication_uploads where id=p_id for update;
 if p_position is null or p_position<0 or p_position>=saved.chunk_count then raise exception 'Invalid publication chunk position'; end if;
 bytes:=decode(p_base64,'base64');
 if bytes is null or octet_length(bytes) not between 1 and 262144 then raise exception 'Invalid publication chunk size'; end if;
 select payload into previous from granular_publication_upload_chunks where upload_id=p_id and position=p_position;
 if found then
  if previous is distinct from bytes then raise exception 'Publication chunk conflict'; end if;
  return;
 end if;
 if saved.published_release_id is not null then raise exception 'Publication upload already completed'; end if;
 insert into granular_publication_upload_chunks(upload_id,position,payload) values(p_id,p_position,bytes);
end $$;

create function public.finish_granular_publication_upload(p_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare saved granular_publication_uploads%rowtype; bytes bytea; actual_count integer; request jsonb; result_id uuid;
begin
 select * into strict saved from granular_publication_uploads where id=p_id for update;
 -- A retry returns the already-published immutable release without redoing work.
 if saved.published_release_id is not null then return saved.published_release_id; end if;
 select count(*),string_agg(payload,''::bytea order by position) into actual_count,bytes
 from granular_publication_upload_chunks where upload_id=p_id;
 if actual_count<>saved.chunk_count or octet_length(bytes) is distinct from saved.byte_length
  or ('sha256:'||encode(sha256(bytes),'hex')) is distinct from saved.payload_checksum then
  raise exception 'Publication upload is incomplete or differs from its checksum';
 end if;
 request:=convert_from(bytes,'UTF8')::jsonb;
 if jsonb_typeof(request) is distinct from 'object' then raise exception 'Invalid publication envelope'; end if;
 result_id:=public.publish_granular_parallel_release(request->>'p_release_key',request->'p_bundle',request->>'p_bundle_checksum',request->'p_preflight',(request->>'p_publisher')::uuid);
 update granular_publication_uploads set published_release_id=result_id where id=p_id;
 return result_id;
end $$;
revoke all on function public.begin_granular_publication_upload(uuid,text,integer,integer),public.append_granular_publication_chunk(uuid,integer,text),public.finish_granular_publication_upload(uuid) from public,anon,authenticated;
grant execute on function public.begin_granular_publication_upload(uuid,text,integer,integer),public.append_granular_publication_chunk(uuid,integer,text),public.finish_granular_publication_upload(uuid) to service_role;
commit;
