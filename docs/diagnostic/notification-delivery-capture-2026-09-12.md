# Inbox material capture

Teacher messages may include corrections and examples that a student later encounters in a diagnostic or exercise. loadStudentNotifications now journals the complete returned notification list under legacy:notifications before delivery. Ownership comes from the authenticated server context and the existing student-filtered query. Read status is unchanged: recording delivery is not a claim of attention or mastery. A journal failure withholds the response and leaves messages retryable.

Six focused tests passed: owner-scoped payload capture (including nested example text), failed-write retry, failed read, role/access refusal and rejection of client-supplied ownership. TypeScript passed. This is local action validation; deployed inbox delivery remains to be verified.

Route audit observations: the recueil already journals its text through legacy:recueil; the offline page contains connection instructions and does not fetch new educational material. These observations do not establish coverage of all static text, client bundles, offline caches, audio or alternate response paths. No capture contract or student baseline was enabled.
