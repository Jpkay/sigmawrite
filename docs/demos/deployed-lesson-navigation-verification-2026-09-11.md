# Deployed lesson navigation verification

Commit `fb54420`, production deployment `dpl_7PX2tnmZn5ZKAovjixUByhTaqJZF`.

The app proxy forwards requests with `x-forwarded-host: sigmawrite.vercel.app` and `origin: https://app.trouvetaplume.com`. Production logs confirmed Next.js rejected student Server Actions because those origins differed. Student-state hydration swallowed that error and showed an empty profile. The production configuration now explicitly allows the public app origin.

Added `/student/lessons` and a visible “Mes leçons” navigation entry. The page uses the authenticated student's saved pathway and excludes pending steps. Completed students opening onboarding are redirected to lessons. A recently completed assessment no longer shows the home-page reentry prompt solely because unassessed skills remain uncertain.

Verified using an isolated headless Chrome session authenticated as the synthetic `doves.demo` account on `https://app.trouvetaplume.com`:

- Home retains the completed student state.
- Opening `/student/onboarding` redirects to `/student/lessons`.
- Eleven startable lesson links appear.
- The first lesson opens and its exercise session starts.
- Submitting a reviewed correct answer returns “Bonne réponse.” without a browser error.

Type checking and lint passed before deployment. This verification covers the navigation repair and one live exercise submission, not completion of every lesson or activation of the new granular diagnostic.
