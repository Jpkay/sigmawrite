begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(6);

select function_privs_are('public','recompute_word_mastery_from_typed_history',array['uuid'],'authenticated',array[]::text[],'Students cannot recompute mastery');

insert into students(id) values ('b1000000-0000-4000-8000-000000000001');
insert into vocabulary_items(id,lemma,display_word,definition_fr) values
 ('b2000000-0000-4000-8000-000000000001','rivage','rivage','Bord de la mer.'),
 ('b2000000-0000-4000-8000-000000000002','falaise','falaise','Côte haute et abrupte.'),
 ('b2000000-0000-4000-8000-000000000003','écume','écume','Mousse blanche sur les vagues.');
-- Legacy rows: mastery came from exposures / 5.
insert into student_word_mastery(student_id,vocabulary_item_id,mastery,exposures) values
 ('b1000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000001',1,5),
 ('b1000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000002',1,5),
 ('b1000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000003',1,5);
-- falaise: typed successes on three days, last one 7+ days later (spaced).
insert into vocabulary_review_attempts(student_id,vocabulary_item_id,result,previous_mastery,next_mastery,reviewed_at)
select 'b1000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000002','good',0,0,d
from unnest(array['2026-09-01 10:00+02','2026-09-01 11:00+02','2026-09-01 12:00+02','2026-09-01 13:00+02','2026-09-01 14:00+02',
 '2026-09-04 10:00+02','2026-09-04 11:00+02','2026-09-04 12:00+02','2026-09-15 10:00+02','2026-09-15 11:00+02']::timestamptz[]) d;
-- écume: many typed successes, all on one day (not spaced).
insert into vocabulary_review_attempts(student_id,vocabulary_item_id,result,previous_mastery,next_mastery,reviewed_at)
select 'b1000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000003','easy',0,0,'2026-09-01 10:00+02'::timestamptz + make_interval(mins=>g)
from generate_series(1,10) g;

select ok(public.recompute_word_mastery_from_typed_history('b1000000-0000-4000-8000-000000000001') = 2, 'Inflated legacy rows are lowered');
select results_eq(
 $$select mastery::numeric, status_note from student_word_mastery where vocabulary_item_id='b2000000-0000-4000-8000-000000000001'$$,
 $$values (0::numeric, 'a_confirmer'::text)$$,
 'A row backed only by exposures ends at 0 and is shown as "à confirmer"');
select is((select mastery::numeric from student_word_mastery where vocabulary_item_id='b2000000-0000-4000-8000-000000000002'), 1::numeric, 'Spaced typed recall keeps its mastery');
select is((select mastery::numeric from student_word_mastery where vocabulary_item_id='b2000000-0000-4000-8000-000000000003'), 0.84::numeric, 'Unspaced typed recall stays below the mastery gate');
select is((select word_status from student_word_mastery where vocabulary_item_id='b2000000-0000-4000-8000-000000000003'), 'en_route', 'Typed history moves a word to En route, no further');

select * from finish();
rollback;
