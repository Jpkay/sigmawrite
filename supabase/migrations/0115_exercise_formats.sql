-- New exercise formats (roadmap 2.1, 2.3, 2.4): click-the-error, justified
-- answer and sentence combining. Ordering already exists in the schema.
-- Configuration lives in validator_config:
--   error_hunt : { "correctionFr": "…" }               correct_answer = the wrong word
--   justified  : { "rules": [{"key","label"}], "ruleKey": "…" }  choices carry the answer
--   combine    : { "sentences": ["…","…"] }            acceptable_answers = accepted merges
alter table public.competency_items drop constraint if exists competency_items_response_type_check;
alter table public.competency_items add constraint competency_items_response_type_check
  check (response_type in ('mcq','short_answer','cloze','transform','written','spoken','ordering','error_hunt','justified','combine'));
