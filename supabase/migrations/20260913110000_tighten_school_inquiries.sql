-- Forward-only hardening for the table created by the already-applied
-- 0102_school_inquiries.sql migration. Main must run the documented read-only
-- data preflight before applying this migration because validation covers rows
-- that predate these constraints.

alter table public.school_inquiries
  add constraint school_inquiries_organization_name_length_check
    check (char_length(btrim(organization_name)) between 2 and 160) not valid,
  add constraint school_inquiries_country_length_check
    check (char_length(btrim(country)) between 2 and 100) not valid,
  add constraint school_inquiries_contact_name_length_check
    check (char_length(btrim(contact_name)) between 2 and 120) not valid,
  add constraint school_inquiries_contact_role_length_check
    check (char_length(btrim(contact_role)) between 2 and 120) not valid,
  add constraint school_inquiries_contact_email_shape_check
    check (
      char_length(contact_email) <= 254
      and contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ) not valid,
  add constraint school_inquiries_message_length_check
    check (message is null or char_length(message) <= 2000) not valid;

alter table public.school_inquiries
  validate constraint school_inquiries_organization_name_length_check,
  validate constraint school_inquiries_country_length_check,
  validate constraint school_inquiries_contact_name_length_check,
  validate constraint school_inquiries_contact_role_length_check,
  validate constraint school_inquiries_contact_email_shape_check,
  validate constraint school_inquiries_message_length_check;

grant insert on public.school_inquiries to service_role;
revoke all on public.school_inquiries from anon;
