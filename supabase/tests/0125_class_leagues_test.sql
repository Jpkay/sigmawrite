begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(6);
select has_function('public','class_league',array['uuid','date'],'League is computed server-side');
select has_column('public','classes','league_enabled','Teachers can switch a class league off');
select has_column('public','student_motivation_settings','league_visible','Students can hide their name');

insert into public.classes(id,name) values ('12500000-0000-0000-0000-000000000001','Ligue test');
insert into public.students(id,display_name) values ('12500000-0000-0000-0000-000000000011','Ana'),('12500000-0000-0000-0000-000000000012','Bob'),('12500000-0000-0000-0000-000000000013','Cléo');
insert into public.enrollments(student_id,class_id,status) values
  ('12500000-0000-0000-0000-000000000011','12500000-0000-0000-0000-000000000001','active'),
  ('12500000-0000-0000-0000-000000000012','12500000-0000-0000-0000-000000000001','active'),
  ('12500000-0000-0000-0000-000000000013','12500000-0000-0000-0000-000000000001','active');
-- Ana: 30 XP this week, 3-day streak ending yesterday. Bob: 30 XP, 1 day. Cléo: hidden name, 5 XP.
insert into public.student_daily_activity(student_id,activity_date,xp_earned,goal_completed) values
  ('12500000-0000-0000-0000-000000000011',current_date-1,10,true),('12500000-0000-0000-0000-000000000011',current_date-2,10,true),('12500000-0000-0000-0000-000000000011',current_date-3,10,true),
  ('12500000-0000-0000-0000-000000000012',current_date-1,30,true),
  ('12500000-0000-0000-0000-000000000013',current_date-1,5,false);
select public.set_league_visibility('12500000-0000-0000-0000-000000000013',false);
select public.award_student_xp('12500000-0000-0000-0000-000000000011','seed','reading_session','12500000-0000-0000-0000-00000000aaaa',30,0,now()-interval '30 days');

select set_config('request.jwt.claim.role','service_role',true);
select results_eq(
  $$select display_name, streak, rank from public.class_league('12500000-0000-0000-0000-000000000001', date_trunc('week', current_date)::date) order by rank$$,
  $$values ('Ana',3,1),('Bob',1,2),('Un·e camarade',0,3)$$,
  'Ranks by weekly XP, then streak; hidden names are anonymised'
);
select is((select tier from public.class_league('12500000-0000-0000-0000-000000000001', date_trunc('week', current_date)::date) where display_name='Ana'),'bronze','Tier follows cumulative XP');
select public.set_class_league_enabled('12500000-0000-0000-0000-000000000001',false);
select is((select count(*) from public.class_league('12500000-0000-0000-0000-000000000001', date_trunc('week', current_date)::date))::int,0,'A disabled league returns nothing');
select * from finish();
rollback;
