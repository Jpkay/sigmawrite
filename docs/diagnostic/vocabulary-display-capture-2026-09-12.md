# Vocabulary review display

Vocabulary delivery now records shared controls, correction wrappers, encounter labels and due-count states reachable as the loaded cards are reviewed. The action still returns the same array of words. The page keys the review component to the authenticated owner so an account change clears local review state. Save failures display a controlled message while retaining the answer for retry.

The actual component passed local Chrome checks for hiding the current word before correction, preserving the answer after a rejected save, advancing only after acknowledgement and resetting across accounts. Responses were controlled test fixtures, not production writes. Action tests verify the recorded display and failure handling; page tests verify owner keys and authorization. TypeScript passes; 429 files and 1,841 tests pass.

This does not make the word unknown to the browser: the existing initial payload contains it and remains conservatively recorded. The change is not yet deployed. The public R41 diagnostic continues separately; complete-history and global client-version/error guarantees remain outstanding.
