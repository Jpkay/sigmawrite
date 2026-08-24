-- "Cas 1/2/3" identified internal authoring variants, not pedagogical cases.
-- Remove it from the existing diagnostic bank so learner and reviewer prompts
-- match the clean output produced by the local authoring generators.
update public.competency_items
set prompt_fr = regexp_replace(prompt_fr, '^Cas [1-3] [—–-] ', '')
where prompt_version = 'diagnostic-bank-v2'
  and prompt_fr ~ '^Cas [1-3] [—–-] ';
