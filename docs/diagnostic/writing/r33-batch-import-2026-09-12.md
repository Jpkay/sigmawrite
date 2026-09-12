# R33 draft-bank import

The original per-question importer was intentionally stopped after its repeated network calls proved slow. The replacement performs insert-only batches of 100 records against the same draft bank, preserves existing rows, and locks the bank record during each batch to prevent publication races. It never edits published bank records or grants approval.

A rollback-only database query verified the SQL shape before application. All 7,554 canonical items, choices and memberships were then compared against the imported relational records. Verification passed with bank checksum `sha256:a4da021c14cb9dc0d74712fb98727ce482ba6251006a6dd31b420d20322c0a44` and bank release `209ad8b5-ea7e-4aba-8ef3-dd083a007bcb`.

The operator tool defaults to producing private SQL files without applying them. `--apply` executes the batches and runs the full relational comparison. Existing mismatches cause final verification to fail; the tool does not silently overwrite them or publish the bank. Other import writers must be stopped before using it.

This report covers the import, not application promotion or classroom review.
