# Progress uses current granular evidence

The progress route now selects the authenticated student's existing granular session and renders the same skill projection as the frontier. This replaces the legacy grade-band and broad-score presentation for granular students, including those whose initial diagnostic is still in progress. Recent reading sessions remain visible through the extracted existing component. Accounts without a granular session retain legacy progress.

The server records the projected payload under student:granular-progress before rendering. Access, load and capture failures do not silently substitute older scores. No session start, resume or answer command is issued by this route.

Validation: TypeScript passed; 382 test files / 1,694 tests passed. Focused route tests cover current-owner selection, disabled/no-session fallback and failure behavior. Deployed browser verification remains pending for completed and paused accounts. No public activation is claimed.

The completed revision-34 account passed candidate browser checks with 542 targets, five activity links, search, filtering, prerequisite navigation, reload, mobile layout and unchanged session state. Before paused-account verification, source inspection identified that the shared client gate still redirected incomplete students. Read-only frontier/progress routes now remain available after onboarding; memory and vocabulary remain blocked. All 11 focused gate/progress tests and TypeScript passed after that change. Paused browser verification requires the rebuilt candidate.
