# Memory and vocabulary evidence display corrections

The memory page labelled a scheduling repetition counter as competency mastery, reaching 100% after an average of five repetitions. That counter resets on a forgotten response and is neither a lifetime review count nor proof of mastery. The page now shows card counts and currently due cards by concept, with a link to the diagnostic skill map. Its introductory copy no longer promises fixed intervals when scheduling adapts to responses.

The vocabulary recall screen displayed the currently requested word in the adjacent personal list. That row is now hidden until correction; other words remain accessible. The list uses recorded encounter counts and alphabetical order instead of an unexplained mastery percentage. The initial client payload still contains words for local checking, and server delivery recording remains conservative. This change does not turn these exercises into certified independent graph evidence.

For backend-connected memory reviews, the card now advances only after a successful server response. Previously the local scheduling update ran first, leaving local progress changed when the request failed. Local-only mode retains its existing update path.

Three rendering checks and TypeScript passed for the display changes. A deployed browser check, including failed-save preservation and post-correction visibility, remains required before rollout. These changes do not change diagnostic probabilities or historical student data.
