# Printable collection display

The collection page records the author, count, numbered entry kinds, formatted dates and notes from the same projection it renders. Fixed copy includes the empty state and print label. Dates use explicit UTC. The original entry content remains recorded by the collection action.

Tests verify the actual header description, author/count, date plus note, empty state and withholding after capture failure. TypeScript passes; 432 files and 1,846 tests pass. No production collection data or print action was changed. This batch is not deployed during the ongoing R41 diagnostic, and does not close the global error/version contract.
