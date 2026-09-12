# Server student header capture

The shared `StudentPageHeader` records the exact title, description, eyebrow and explicit action text before returning the header. It uses the authenticated student journal and fails if capture fails. React action elements and their transport URLs are not serialized. An action without an explicit text label is rejected.

Applied to nine server routes: lessons, dictation catalog, vocabulary, inbox, recueil, legacy frontier, the verb index, individual verb tables and individual rules. This includes dynamically assembled conjugation headings and the not-found reference headings. The settings page already records its fixed copy separately.

This change does not capture entire pages, client-generated states, arbitrary error output, button internals or offline content. It enables no coverage contract and creates no baseline. Current receipts remain conservative.

Validation: 13 focused tests passed across the header and existing route delivery suites; TypeScript passed. Browser verification of this header change remains pending. The previously deployed revision 41 source d27b0fe does not contain this later change.
