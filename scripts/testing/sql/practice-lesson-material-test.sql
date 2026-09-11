-- Disposable fixtures; no real content-review decisions.
begin;
do $$
declare ontology uuid; node uuid; lesson uuid; annotation jsonb := '{"sentences":["Les chevaux courent."]}';
begin
 insert into ontology_versions(version,document_path) values('lesson-material-test','test-only') returning id into ontology;
 insert into competency_nodes(key,strand,label_fr,ontology_version_id,node_type,modality_scope,expectation_scope,review_status,generation_type)
 values('lesson_material_fixture','grammaire_syntaxe','Synthetic lesson node',ontology,'linguistic',array['reading'],array['receptive'],'human_approved','human') returning id into node;
 select id into strict lesson from competency_lessons where node_id=node;
 if (select material_exposure from competency_lessons where id=lesson) is not null then raise exception 'Legacy default must be unknown'; end if;
 update competency_lessons set examples_fr='["Les chevaux courent."]',material_exposure=annotation where id=lesson;
 if (select material_exposure from competency_lessons where id=lesson) is not null then raise exception 'Content replacement retained annotations'; end if;
 update competency_lessons set material_exposure=annotation where id=lesson;
 update competency_lessons set updated_at=now(),version=version+1 where id=lesson;
 if (select material_exposure from competency_lessons where id=lesson) is distinct from annotation then raise exception 'Metadata-only change lost annotation'; end if;
 update competency_lessons set explanation_fr='Changed source',material_exposure=annotation where id=lesson;
 if (select material_exposure from competency_lessons where id=lesson) is not null then raise exception 'Stale source annotation survived'; end if;
 begin
  update competency_lessons set material_exposure='[]' where id=lesson;
  raise exception 'Invalid annotation accepted';
 exception when check_violation then null;
 end;
end $$;
rollback;
