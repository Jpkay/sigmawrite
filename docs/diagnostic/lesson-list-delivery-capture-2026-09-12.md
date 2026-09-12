# Lesson-list delivery recording

The Mes leçons server page previously rendered its selected lesson titles and descriptions without recording that route's payload. It now journals both the recommended activities and the separate optional lesson choices under `student:lessons`, after resolving the authenticated student and before returning the page. A journal failure propagates and withholds the response.

This captures the selected activity data and destinations, including legacy catch-up lessons. It does not assert that every static interface label, every other route or all historical exposure has been recorded. The capture-completeness contract remains disabled. TypeScript passed; deployed endpoint and saved-journal verification remain pending.
