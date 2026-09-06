-- These three draft exercises assess subject/verb/complement order, not
-- punctuation. Keep their full-sentence answer keys and add only the exact
-- alternative without a terminal period; never strip punctuation globally.
update public.competency_items item
set acceptable_answers = array(
      select distinct answer
      from unnest(coalesce(item.acceptable_answers, array[]::text[]) || array[left(item.correct_answer, length(item.correct_answer)-1)]) answer
      order by answer
    ),
    instructions_fr = 'Remets les groupes de mots dans l’ordre sujet-verbe-complément. Le point final est facultatif pour cet exercice.',
    updated_at = now()
from (values
  ('1459a187-ada7-5c0c-800b-3c71ac45cedf'::uuid, 'Lina prépare le repas.'),
  ('839a6525-c4d3-5b9b-a299-97502ff693c3'::uuid, 'Les enfants observent les oiseaux.'),
  ('c6ac1ee6-c54f-547c-b28b-269c3bf0c9a8'::uuid, 'La chercheuse propose une solution.')
) as correction(id, expected_answer)
where item.id = correction.id
  and item.correct_answer = correction.expected_answer
  and item.prompt_version = 'diagnostic-bank-v2'
  and item.validator_type = 'exact'
  and item.review_status = 'needs_human_review'
  and item.instructions_fr = 'Écris une phrase complète avec la ponctuation demandée.'
  and not exists (
    select 1 from public.diagnostic_item_bank_memberships membership
    join public.diagnostic_item_bank_releases bank on bank.id = membership.bank_release_id
    where membership.item_id = item.id and bank.status in ('published','withdrawn')
  );
