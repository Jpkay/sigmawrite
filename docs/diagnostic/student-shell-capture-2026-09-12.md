# Student shell delivery capture

The server layout now journals its navigation labels, mobile tab labels, area label and displayed user name/role before returning the dashboard shell. Ownership is resolved through the existing authenticated student journal helper. Authentication and journal failures propagate; they do not silently grant exposure coverage.

Next.js caches layouts during navigation. The recorded payload therefore covers the server-rendered shell that is reused, not a claimed new delivery on every route change. Child pages, access-pending messages, static text inside DashboardShell and browser-only states remain separate capture boundaries. This change does not enable the material-history contract or backfill any earlier student exposure.

Three focused tests passed: exact payload correspondence, failure propagation and no journaling after failed authorization. TypeScript compilation is checked separately. Production browser verification remains pending.
