-- Allow operational Elo updates without changing published scored content.
-- 0076 added two operational Elo columns after the 0059 immutability whitelist.
-- Keep the scored prompt, validators, answers, review state and memberships frozen.
create or replace function public.guard_published_diagnostic_item_content()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists(
    select 1
    from public.diagnostic_item_bank_memberships membership
    join public.diagnostic_item_bank_releases bank on bank.id=membership.bank_release_id
    where membership.item_id=old.id and bank.status in ('published','withdrawn')
  ) then
    if tg_op='UPDATE' and
      to_jsonb(new)-array[
        'p_value','discrimination','attempts_count','psychometric_flags',
        'difficulty','difficulty_rating','rating_attempts','updated_at'
      ] =
      to_jsonb(old)-array[
        'p_value','discrimination','attempts_count','psychometric_flags',
        'difficulty','difficulty_rating','rating_attempts','updated_at'
      ]
    then return new;
    end if;
    raise exception 'published diagnostic item content is immutable';
  end if;
  return coalesce(new,old);
end
$$;
