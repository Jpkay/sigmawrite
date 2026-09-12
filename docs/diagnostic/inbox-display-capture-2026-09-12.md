# Inbox display and read acknowledgement

The server page records the fixed inbox copy and keys its client to the authenticated student. Notification delivery records shared kind labels, dates and the unread counts reachable by marking the loaded messages read. Dates now use explicit UTC on both server and browser. Loading and action failures display controlled messages, not arbitrary server exception text.

A single message is now marked read locally only after the server acknowledges the request. Previously a rejected request still changed the local display. The account key resets message/error state across account changes.

Local Chrome with the real component verifies a date near midnight under Pacific/Auckland, pending and rejected read requests, successful acknowledgement, generic error display and account remount. This uses controlled responses and does not claim a production database write. Route and action tests cover authenticated ownership and withholding material after failed capture. TypeScript passes; 427 files and 1,837 tests pass.

Not deployed during the active R41 diagnostic. No production notification or demo account was changed. Cross-cutting old-client/global-error coverage remains unresolved, and no full-history contract is enabled. The unrelated local auto-approved reading-version change is excluded.
