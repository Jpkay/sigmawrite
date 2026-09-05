begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(17);

select has_table('public','student_motivation_settings','Motivation settings are persisted');
select has_column('public','student_daily_activity','xp_earned','Daily activity accumulates XP');
select has_column('public','student_daily_activity','streak_freeze_used','Freeze days are recorded');
select has_function('public','award_student_xp',array['uuid','text','text','uuid','integer','integer','timestamp with time zone'],'One XP award function');
select has_function('public','apply_streak_freeze',array['uuid','date'],'Freezes are applied server-side');
select has_function('public','grant_streak_freeze_for_milestone',array['uuid','integer'],'Freezes are earned at milestones');
select policies_are('public','student_motivation_settings',array['student_motivation_settings_read'],'Settings are read-only through RLS');

insert into public.students(id,display_name) values ('11200000-0000-0000-0000-000000000001','Motivation student');

select is(
  (select (public.award_student_xp('11200000-0000-0000-0000-000000000001','reading:a','reading_session','11200000-0000-0000-0000-00000000aaaa',6,0,'2026-09-01T10:00:00Z'))->>'goalCompleted')::boolean,
  false,
  'Six XP does not complete the default ten XP goal'
);
select is(
  (select (public.award_student_xp('11200000-0000-0000-0000-000000000001','retrieval:b','retrieval_review','11200000-0000-0000-0000-00000000bbbb',4,0,'2026-09-01T11:00:00Z'))->>'goalCompleted')::boolean,
  true,
  'Ten accumulated XP completes the goal'
);
select is(
  (select (public.award_student_xp('11200000-0000-0000-0000-000000000001','retrieval:b','retrieval_review','11200000-0000-0000-0000-00000000bbbb',4,0,'2026-09-01T11:00:00Z'))->>'awarded')::boolean,
  false,
  'Repeating an event key awards nothing'
);
select is(
  (select xp_earned from public.student_daily_activity where student_id='11200000-0000-0000-0000-000000000001' and activity_date='2026-09-01'),
  10,
  'Daily XP is the sum of distinct awards'
);
select throws_ok(
  $$select public.award_student_xp('11200000-0000-0000-0000-000000000001','big','reading_session','11200000-0000-0000-0000-00000000cccc',40,0)$$,
  'xp_out_of_range',
  'Awards are bounded'
);

select is(public.set_daily_xp_goal('11200000-0000-0000-0000-000000000001',20),20,'Goal can be raised');

-- No freeze available: a gap stays a gap.
select is(public.apply_streak_freeze('11200000-0000-0000-0000-000000000001','2026-09-02'),false,'No freeze without a bank');
select is(public.grant_streak_freeze_for_milestone('11200000-0000-0000-0000-000000000001',7),true,'Seven-day milestone earns a freeze');
select is(public.grant_streak_freeze_for_milestone('11200000-0000-0000-0000-000000000001',7),false,'Same milestone does not earn twice');
select is(public.apply_streak_freeze('11200000-0000-0000-0000-000000000001','2026-09-02'),true,'A banked freeze covers the day after a completed day');

select * from finish();
rollback;
