## Model allocation

- Use GPT-6 Sol with High reasoning (`gpt-6-sol`, `high`) for execution work, including routine implementation, running established plans and experiments, operational commands, and routine validation.
- Reserve GPT-6 Astra for hard work, bug fixing, or verification of hard bug fixes. Do not use Astra for routine execution merely because it is the parent/default model.
- When model choice or the boundary between execution and hard work is unclear, ask the user before choosing or escalating. Do not silently substitute another model if the requested model is unavailable.
- When delegation is needed to honor this allocation, set the execution subagent explicitly to GPT-6 Sol High and pass a bounded task. Do not claim the parent model has changed unless it actually has.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
