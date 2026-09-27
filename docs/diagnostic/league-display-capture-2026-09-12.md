# Class league display capture

The class league now shares its display projection with the home response journal: class name, French week date, tier, remaining XP, personal ranking, the ten displayed names, and the message for a student outside the top ten. Both visibility-button labels and accessible descriptions are included. The home journal omits this projection when the motivation section is absent, matching the UI.

Rendering checks compare the actual component's text with the journal projection. Cases cover first place, the highest tier, a personal rank below tenth, no personal row, and no league. TypeScript passes. Full suite: 423 files and 1,831 tests pass. The tests preserve the full typed league-row shape, including visibility.

Not deployed during the active R41 timed diagnostic. The unrelated auto-approved reading-version change remains excluded. This closes the specifically identified class-league display gap, not the whole application's material-history audit. Student routes, older clients and unsupported delivery paths still need a consolidated verification before complete-history activation.
