begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(5);
select has_table('public','class_goals','Class goals are persisted');
select has_function('public','class_goal_progress',array['uuid','date'],'Progress is aggregated server-side');
select has_function('public','set_class_goal',array['uuid','date','integer'],'Goals are set through a guarded function');
select policies_are('public','class_goals',array['class_goals_read'],'Only the read policy exists');

insert into public.classes(id,name) values ('12000000-0000-0000-0000-000000000001','Classe test');
insert into public.students(id,display_name) values ('12000000-0000-0000-0000-000000000011','A'),('12000000-0000-0000-0000-000000000012','B');
insert into public.enrollments(student_id,class_id,status) values ('12000000-0000-0000-0000-000000000011','12000000-0000-0000-0000-000000000001','active'),('12000000-0000-0000-0000-000000000012','12000000-0000-0000-0000-000000000001','active');
select public.set_class_goal('12000000-0000-0000-0000-000000000001','2026-08-31',500);
insert into public.student_daily_activity(student_id,activity_date,xp_earned) values ('12000000-0000-0000-0000-000000000011','2026-09-01',30),('12000000-0000-0000-0000-000000000012','2026-09-02',45),('12000000-0000-0000-0000-000000000011','2026-09-08',99);
select results_eq(
  $$select target_xp, earned_xp::int, members, active_members from public.class_goal_progress('12000000-0000-0000-0000-000000000001','2026-08-31')$$,
  $$values (500, 75, 2, 2)$$,
  'Progress sums only the goal week for active members'
);
select * from finish();
rollback;
