# Onboarding and recovery workstream

Status: application changes implemented on 2026-09-13; database contract and hosted verification remain integration gates.

## Bounded flows

### Class invitations

- Teachers and school administrators use the same class invitation action. The server validates a 1–90 day lifetime and a 1–500 student limit; the UI offers 7, 14, 30, 60, or 90 days and defaults to 14 days / 40 students.
- Replacing a still-usable code requires an explicit second click. The UI states that the former code becomes unusable immediately.
- Student code validation distinguishes a temporarily unavailable validator from a code that is invalid, expired, revoked, or full. Both outcomes provide a next action.
- Student signup revalidates the code immediately before account creation. Database signup remains the authority that consumes a use and creates the enrollment/authorization atomically.
- New database-generated codes retain 128 random bits as `SW-` plus 32 hexadecimal characters (35 characters total). The no-email server path accepts codes up to 64 characters, matching the public form, so existing and replacement codes use the same secure path.
- E-mail student signup now returns through `/auth/callback?next=/student`. No-email signup continues to create an internal auth address and uses the chosen username for login.

### Teacher onboarding

- A teacher must explicitly verify the current school code, and the exact code is checked again at submit. Stale responses cannot mark a newly edited code as valid.
- The active school code is reusable by multiple teachers. Rotating it invalidates the previous value; it is not consumed per signup.
- If an immediate session is issued, the client verifies that the resulting profile is actually a teacher and signs out on a mismatch.
- Required database hardening: a requested teacher with an invalid or rotated code must fail with `teacher_code_invalid`. It must not be silently provisioned as a parent. This is especially important when e-mail confirmation delays the first profile read.

### Recovery

- Login displays actionable states for failed/expired callbacks, missing profiles, newly created no-email accounts, and deactivated reviewer access.
- Password recovery is available from login. It explains that username recovery only sends mail when that account has a real recovery address; otherwise a teacher or school administrator must issue a temporary password through the account console.
- No password is reset by these changes, and recovery responses remain non-enumerating.

## Database integration contract

The application action calls:

```sql
rotate_class_join_code(
  p_class_id uuid,
  p_expires_in_days integer,
  p_max_uses integer
)
returns table (
  id uuid,
  code text,
  class_id uuid,
  expires_at timestamptz,
  max_uses integer,
  uses integer,
  school_consent_enabled boolean
)
```

The function must:

1. Accept only an authenticated, non-deactivated teacher assigned to the class, or a non-deactivated school administrator scoped to the class school. Platform-admin access should be explicit rather than inherited from a broad staff helper.
2. Validate days in `1..90` and uses in `1..500` inside the function.
3. Lock the class row, revoke every unrevoked code for that class, and create the replacement in one transaction.
4. Generate a 128-bit `SW-` code as 32 hexadecimal characters (35 characters total, within the shared 64-character input bound), set `school_consent_enabled = true`, and record `created_by_profile_id = current_profile_id()`.
5. Grant execution to `authenticated` and `service_role`, never `anon`.

`class_join_codes` also needs a SELECT policy using the same active role/class-school predicate because `getActiveJoinCode()` reads the row directly. Before creating the partial unique index on `class_id WHERE revoked_at IS NULL`, the migration performs a fail-closed duplicate preflight: any duplicate unrevoked rows stop the migration for owner review, with no automatic cleanup or revocation. The index then provides defense in depth for concurrent multi-teacher rotations. Anonymous users retain only the narrow `validate_class_join_code(text)` lookup.

## CAPTCHA and consent invariants

- Student signup, adult signup, password login, magic-link request, password recovery, and no-email class join retain their managed Turnstile token requirement when the public site key is configured.
- `loginWithPassword`, `requestPasswordRecovery`, and `joinClassWithoutEmail` retain independent server verification when `TURNSTILE_SECRET_KEY` is configured. A failed submit resets the client widget so a single-use token is never retried.
- When Supabase native CAPTCHA is deliberately enabled, `SUPABASE_CAPTCHA_ENABLED=true` delegates token consumption to Supabase to avoid consuming one token twice. Hosted verification must use the real automatic widget; it must not disable the site key, fake a token, or set a skip flag just for the check.
- Class enrollment continues to create school authorization through the database. These forms do not bypass or replace consent records.

## Integration and pilot checks

After the database migration and application revision are deployed to a candidate:

1. In a clean browser, use the actual automatic Turnstile widget on login. Submit one intentionally wrong synthetic credential, confirm the widget resets, then submit the valid synthetic credential with the new token. Do not use a real student or staff account.
2. As a synthetic assigned teacher, create a bounded class code and confirm an assigned second teacher can replace it. Confirm the first code is rejected and the replacement remains the only unrevoked code.
3. As a synthetic school administrator, view and replace a code only for a class in the administrator’s school. Confirm another school’s class is unreadable and unmodifiable.
4. Join once with a synthetic student plus e-mail and once without e-mail using a legacy 35-character code. Confirm both enrollments consume one use and land in the intended class.
5. Rotate the class code between validation and submit; confirm signup fails with the revoked/expired guidance and creates no profile, student, enrollment, or consent row.
6. Validate one school teacher code from two separate synthetic teacher signups. Rotate the code and confirm the former code creates no account and returns the teacher-code guidance.
7. Request recovery for a synthetic e-mail account and for a no-email username. Confirm the first follows the secure callback and the second shows the same non-enumerating response without sending mail.

No real invitations or e-mails should be sent during these checks, and no real credential should be changed.
