# Adult authentication providers

Magic links use Supabase OTP with `shouldCreateUser=false`, so only existing
adult accounts can request one. Configure the Site URL and callback allow-list
for `/auth/callback` in each Supabase project.

Google OAuth is shown only when `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`. Enable
Google in Supabase with the environment-specific client credentials and disable
unrestricted new-user creation for the pilot. The callback checks the stored
profile and signs out student/unknown roles; students continue using class code
and password only.
