-- Runs inside the full-graph synthetic fixture transaction. No production data.
do $$
declare bank uuid; item uuid; choice uuid; changed integer; state text; statement text;
begin
 select b.id,i.id,c.id into strict bank,item,choice
 from diagnostic_item_bank_releases b
 join diagnostic_item_bank_memberships m on m.bank_release_id=b.id
 join competency_items i on i.id=m.item_id
 join competency_item_choices c on c.item_id=i.id
 where b.bank_key='synthetic-integration-only' and b.status='published'
 limit 1;
 foreach state in array array['published','withdrawn'] loop
  if state='withdrawn' then
   update diagnostic_item_bank_releases set status='withdrawn',withdrawn_at=now() where id=bank;
  end if;
  update competency_items set difficulty_rating=0.25,rating_attempts=rating_attempts+1 where id=item;
  get diagnostics changed=row_count;
  if changed<>1 or not exists(select 1 from competency_items where id=item and difficulty_rating=0.25 and rating_attempts>0) then
   raise exception 'Operational Elo update did not persist for % bank',state;
  end if;
  foreach statement in array array[
   format('update competency_items set correct_answer=%L where id=%L','changed answer',item),
   format('update competency_items set prompt_fr=%L where id=%L','changed prompt',item),
   format('update competency_items set validator_config=%L::jsonb where id=%L','{"changed":true}',item),
   format('update competency_items set difficulty_rating=0.8,correct_answer=%L where id=%L','mixed content edit',item),
   format('delete from competency_items where id=%L',item)
  ] loop
   begin
    execute statement;
    raise exception 'Expected content immutability rejection';
   exception when raise_exception then
    if sqlerrm<>'published diagnostic item content is immutable' then raise; end if;
   end;
  end loop;
  foreach statement in array array[
   format('update competency_item_choices set choice_text=%L where id=%L','changed choice',choice),
   format('update competency_item_choices set is_correct=not is_correct where id=%L',choice),
   format('delete from competency_item_choices where id=%L',choice)
  ] loop
   begin
    execute statement;
    raise exception 'Expected choice immutability rejection';
   exception when raise_exception then
    if sqlerrm<>'published diagnostic item choices are immutable' then raise; end if;
   end;
  end loop;
 end loop;
 raise notice 'Published and withdrawn item Elo updates pass; answer, prompt, validator, mixed, deletion and choice mutations remain rejected.';
end $$;
