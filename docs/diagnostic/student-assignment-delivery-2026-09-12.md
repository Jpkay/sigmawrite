# Student assignment delivery

The home assignment component previously retained its first query result in a module-level browser cache. Remounting the dashboard for another account did not clear that cache. It also read assignments directly from the browser without recording their delivery.

The authenticated home server page now reads assignments using the session database client and its existing row-level permissions, records the payload for the resolved student, and passes the list to the dashboard. The component renders only those props. Shared text formatting covers titles, target descriptions and due dates. Reading or recording failures withhold the page rather than silently displaying an empty list.

Validation: local Chrome with the actual dashboard and assignment component displays account A's assignment, then account B's assignment with A absent. Unit tests check fresh per-owner reads, capture failures and server props. TypeScript passes; full suite passes 421 files and 1,827 tests. The final strengthened page assertion also passes separately. No production assignment data was modified.

This change is committed separately from the live diagnostic run and is not yet deployed. Complete material-history coverage is still unproven; motivation, league and other remaining display paths need their own audit.

The fresh public R41 QA journey uses `doves.granular.r41.qa`, student `17b92fcf-74d5-47b4-9715-81d6abee8ef9`, session `7fc214f3-d057-4f4b-8f4a-4e834775d04c`. It started through the real onboarding with manga, anime and football. The runner uses actual elapsed browser time, mixed answers, and the recommended path (no optional-lesson flag). Its live process must be polled; intermediate progress is not completion evidence. The demo account is untouched.
