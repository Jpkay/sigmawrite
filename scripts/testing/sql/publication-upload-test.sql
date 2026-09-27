do $$
declare
 request jsonb:=jsonb_build_object('p_release_key','test','p_bundle',jsonb_build_object('accept',true,'text','été 🐈'),'p_bundle_checksum','proof','p_preflight','{}'::jsonb,'p_publisher','22222222-2222-4222-8222-222222222222');
 bytes bytea; digest text; upload uuid:='33333333-3333-4333-8333-333333333333'; result uuid;
begin
 bytes:=convert_to(request::text,'UTF8'); digest:='sha256:'||encode(sha256(bytes),'hex');
 if has_function_privilege('anon','public.finish_granular_publication_upload(uuid)','execute') or has_function_privilege('authenticated','public.append_granular_publication_chunk(uuid,integer,text)','execute') then raise exception 'Untrusted role can upload'; end if;
 if has_table_privilege('service_role','public.granular_publication_uploads','insert') then raise exception 'Direct metadata writes permitted'; end if;
 perform begin_granular_publication_upload(upload,digest,octet_length(bytes),2);
 perform begin_granular_publication_upload(upload,digest,octet_length(bytes),2);
 begin
  perform begin_granular_publication_upload(upload,digest,octet_length(bytes)+1,2);
  raise exception 'Operation unexpectedly succeeded';
 exception when others then if sqlerrm not like '%identity conflict%' then raise; end if; end;
 perform append_granular_publication_chunk(upload,1,encode(substring(bytes from 8),'base64'));
 begin
  perform finish_granular_publication_upload(upload);raise exception 'Operation unexpectedly succeeded';
 exception when others then if sqlerrm not like '%incomplete%' then raise; end if; end;
 perform append_granular_publication_chunk(upload,0,encode(substring(bytes from 1 for 7),'base64'));
 perform append_granular_publication_chunk(upload,0,encode(substring(bytes from 1 for 7),'base64'));
 begin
  perform append_granular_publication_chunk(upload,0,encode(convert_to('tampered','UTF8'),'base64'));raise exception 'Operation unexpectedly succeeded';
 exception when others then if sqlerrm not like '%chunk conflict%' then raise; end if; end;
 result:=finish_granular_publication_upload(upload);
 if result<>'11111111-1111-4111-8111-111111111111' or (select count(*) from publication_calls)<>1 or (select payload from publication_calls) is distinct from request->'p_bundle' then raise exception 'Original publisher did not receive exact bundle'; end if;
 perform finish_granular_publication_upload(upload);
 if (select count(*) from publication_calls)<>1 then raise exception 'Completed retry republished'; end if;
 -- A correct transfer is not permission to publish invalid content.
 upload:='44444444-4444-4444-8444-444444444444';
 request:=jsonb_set(request,'{p_bundle,accept}','false');bytes:=convert_to(request::text,'UTF8');
 perform begin_granular_publication_upload(upload,'sha256:'||encode(sha256(bytes),'hex'),octet_length(bytes),1);
 perform append_granular_publication_chunk(upload,0,encode(bytes,'base64'));
 begin
  perform finish_granular_publication_upload(upload);raise exception 'Operation unexpectedly succeeded';
 exception when others then if sqlerrm not like '%Existing publisher rejected%' then raise; end if; end;
 if (select published_release_id from granular_publication_uploads where id=upload) is not null then raise exception 'Rejected publication marked complete'; end if;
 -- Corruption with a valid chunk count is rejected before publisher invocation.
 upload:='55555555-5555-4555-8555-555555555555';
 perform begin_granular_publication_upload(upload,'sha256:'||repeat('0',64),octet_length(bytes),1);
 perform append_granular_publication_chunk(upload,0,encode(bytes,'base64'));
 begin
  perform finish_granular_publication_upload(upload);raise exception 'Operation unexpectedly succeeded';
 exception when others then if sqlerrm not like '%checksum%' then raise; end if; end;
 if (select count(*) from publication_calls)<>1 then raise exception 'Corrupt payload reached publisher'; end if;
end $$;
select 'publication upload integrity, retry, permission and rejection checks passed' as result;
