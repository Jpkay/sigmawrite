create schema if not exists extensions;

create or replace function extensions._pgtap_lite_next()
returns integer
language plpgsql
as $$
declare
  next_value integer;
begin
  next_value := coalesce(nullif(current_setting('pgtap_lite.count', true), '')::integer, 0) + 1;
  perform set_config('pgtap_lite.count', next_value::text, false);
  return next_value;
end;
$$;

create or replace function extensions.plan(assertion_count integer)
returns text
language plpgsql
as $$
begin
  perform set_config('pgtap_lite.plan', assertion_count::text, false);
  perform set_config('pgtap_lite.count', '0', false);
  return format('1..%s', assertion_count);
end;
$$;

create or replace function extensions.ok(condition boolean, description text)
returns text
language plpgsql
as $$
declare
  assertion_number integer := extensions._pgtap_lite_next();
begin
  if not coalesce(condition, false) then
    raise exception 'assertion % failed: %', assertion_number, description;
  end if;
  return format('ok %s - %s', assertion_number, description);
end;
$$;

create or replace function extensions.is(actual anycompatible, expected anycompatible, description text)
returns text
language plpgsql
as $$
declare
  assertion_number integer := extensions._pgtap_lite_next();
begin
  if actual is distinct from expected then
    raise exception 'assertion % failed: % (expected %, got %)', assertion_number, description, expected, actual;
  end if;
  return format('ok %s - %s', assertion_number, description);
end;
$$;

create or replace function extensions.lives_ok(statement text, description text)
returns text
language plpgsql
as $$
declare
  assertion_number integer := extensions._pgtap_lite_next();
begin
  begin
    execute statement;
  exception
    when others then
      raise exception 'assertion % failed: % (unexpected %: %)', assertion_number, description, sqlstate, sqlerrm;
  end;
  return format('ok %s - %s', assertion_number, description);
end;
$$;

create or replace function extensions.throws_ok(
  statement text,
  expected_state text,
  expected_message text,
  description text
)
returns text
language plpgsql
as $$
declare
  assertion_number integer := extensions._pgtap_lite_next();
begin
  begin
    execute statement;
  exception
    when others then
      if expected_state is not null and sqlstate <> expected_state then
        raise exception 'assertion % failed: % (expected SQLSTATE %, got %)', assertion_number, description, expected_state, sqlstate;
      end if;
      if sqlerrm <> expected_message then
        raise exception 'assertion % failed: % (expected %, got %)', assertion_number, description, expected_message, sqlerrm;
      end if;
      return format('ok %s - %s', assertion_number, description);
  end;

  raise exception 'assertion % failed: % (statement did not raise)', assertion_number, description;
end;
$$;

create or replace function extensions.finish()
returns setof text
language plpgsql
as $$
declare
  planned integer := nullif(current_setting('pgtap_lite.plan', true), '')::integer;
  completed integer := coalesce(nullif(current_setting('pgtap_lite.count', true), '')::integer, 0);
begin
  if planned is null then
    raise exception 'no assertion plan was declared';
  end if;
  if completed <> planned then
    raise exception 'assertion count mismatch: planned %, completed %', planned, completed;
  end if;
  return next format('# %s assertions passed', completed);
end;
$$;
