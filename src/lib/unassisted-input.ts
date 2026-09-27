/** Keep students' spelling, punctuation, and capitalization their own work. */
export const unassistedInputProps = {
  spellCheck: false,
  autoCorrect: "off",
  autoCapitalize: "none",
  autoComplete: "off",
  // Best-effort opt-outs for writing-assistant browser extensions.
  "data-gramm": "false",
  "data-gramm_editor": "false",
  "data-enable-grammarly": "false",
  "data-lt-active": "false",
} as const;
