# Staging service evidence — 2026-08-06

Target: isolated Supabase `sigmawrite-staging` (`pwztnrirtrnicywvdbpz`) and Vercel `jpkays-projects/sigmawrite`.

## Completed

- Supabase migrations `0001`–`0086` requested for this rollout are recorded remotely. Corrective migration `0087` is also applied; it restores the documented platform-admin-only AI/catalog write boundary after the `0077` rollout. Migration `0077` was made idempotent for the catalog policy created by `0026` before it was applied.
- The 46-file pgTAP directory was executed against linked staging. Contracts through `0067` were observed directly; staging-safe fixture corrections were then made for post-`0077` trusted role assignment and pre-existing release keys. Final all-directory re-verification is pending because the Supabase remote test runner is currently stalling after opening the pooler connection. A fresh local run is also unavailable while Docker Desktop is unresponsive.
- Hosted Auth password minimum is 12 and leaked-password protection is enabled.
- Email confirmation is enforced (`mailer_autoconfirm=false`).
- Native Auth rate limits are explicitly set: OTP 10/hour, verify 10 per five minutes, anonymous sign-ins 10/hour, refresh 120 per five minutes. The built-in email quota remains provider-controlled until custom SMTP is configured.
- Site URL is `https://sigmawrite.vercel.app`. Redirects are restricted to the exact application variants for `/auth/callback`, the consent callback, `/set-password`, and password recovery.
- The application now supplies a native Supabase CAPTCHA token from Cloudflare Turnstile on adult/student signup, password sign-in, magic link, and recovery whenever `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is configured.
- A managed Cloudflare Turnstile widget exists for `sigmawrite.vercel.app`, and its public site key is stored as a protected Vercel Preview and Production environment variable. A fresh Supabase Auth dashboard load confirms native CAPTCHA is enabled, Cloudflare Turnstile is selected, the matching secret is persisted and there are no unsaved changes. Production-target deployment `dpl_8sBhba2xPPzd2MehVannC6aK6wLR` reached Ready and was aliased to `https://sigmawrite.vercel.app`; a clean browser then obtained managed Turnstile tokens and Supabase accepted both the adult signup and password-recovery requests without CAPTCHA errors.
- A dedicated EU PostHog project is configured on the free plan. Autocapture, heatmaps and session replay are disabled; the client/server project keys, EU host and a dedicated analytics pseudonym salt are stored as protected Vercel Preview and Production variables.
- Sentry project `sigmawrite-staging` is connected to the GitHub `sigmawrite` repository. Its browser origin is restricted to `https://sigmawrite.vercel.app`, spike protection, TLS verification and SCM source context are enabled, and a narrow `org:ci` token is used for source-map/release uploads. DSN, organization, project, token and 10% trace-sampling variables are protected in Vercel Preview and Production. Runtime event delivery still requires a new deployment and a controlled test error.
- A restricted Resend sending key is stored as a protected Vercel Preview and Production variable. Staging uses Resend's onboarding sender temporarily because no SigmaWrite-owned sending domain has been verified.
- Vercel Preview and Production now contain protected PostHog, Turnstile and Resend configuration in addition to the existing Supabase and AI settings. Values are intentionally omitted from this evidence file.
- Lexique 4.00 release `sigma-french-lexique4@4.00.1` is published with 2,005 lemmas, 19,374 forms, 98.08% held-out coverage, full licence text, immutable checksums, attribution and CC BY-SA redistribution obligations. This is a documented engineering rights approval under the source's public licence, not a representation that outside counsel reviewed the source.

## Remaining external blockers

- Google Cloud project `scale-inc-chatbot` (`88705275272`) was verified and scheduled for deletion at the owner's explicit request. Google retains it in a recoverable shutdown state for 30 days and still reports the project quota as exhausted, so a new SigmaWrite OAuth project cannot yet be created without a quota increase or final deletion.
- Resend has no verified SigmaWrite-owned sender domain. The onboarding sender is suitable only for limited staging delivery to the account owner, not a pilot launch.
- LanguageTool has a pinned local container and health contract, but no private hosted service target or credential is defined for staging.
- Google OAuth and LanguageTool environment values are not present in Vercel because their upstream setup is incomplete. There is still no separate `sigmawrite-production` Vercel project; the current Production environment belongs to the staging target.
- GitHub CLI authentication is expired, so protected `staging`/`production` environment secrets cannot be inspected or updated.

Native CAPTCHA configuration and the deployed signup/recovery challenge are verified. Do not copy staging Supabase credentials into a future production Vercel target.
