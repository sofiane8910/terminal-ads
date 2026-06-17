# CLAUDE.md

## Intent
A terminal-native **founder cockpit** ("Bloomberg for developers"): orchestrate AI agents,
never miss a completion, turn dead-time into project-relevant intelligence. **Production
quality, not a throwaway MVP** — write code that ships: typed, tested, handled errors, no
stubs/TODOs left behind. Full context in [`README.md`](README.md), [`docs/mvp.md`](docs/mvp.md),
[`docs/blocks.md`](docs/blocks.md).

## Stack
- **Client:** Code-OSS fork (TypeScript/Electron) · `xterm.js` + `node-pty` · React in webviews.
- **Backend:** **Go** (custom services) · **Supabase** (Postgres + Auth + Realtime + Storage).
- **Payments (later):** Stripe Connect.
- **Platform:** **macOS only for now**; keep the stack **cross-platform** (no Windows/Linux
  code removed — later is a CI flip, not a rewrite).

## Reference repos — READ-ONLY, NEVER edit
`vendor/` holds local, decoupled source copies kept **only as working references** — proven,
runnable solutions to study and copy patterns from. **Never edit, build, or run anything inside
`vendor/`.** It is not our product code; adapt patterns into our own code *outside* `vendor/`
(copy a tree out first when we fork). See [`vendor/README.md`](vendor/README.md).
- `vendor/code-oss` — Code-OSS (the VS Code stack): reference for the workbench, terminal
  (`xterm.js`/`node-pty`), shell-integration (OSC 633), and the extension/webview model.
- `vendor/waveterm` — Wave Terminal: reference for the block-mosaic grid and the running/stale
  status UX.

## Test conventions
- **Assistant writes/runs headless tests only:** logic/state machines, parsers, Go services,
  API/DB integration, schema & privacy assertions. Must pass in CI without launching the app.
- 🧑‍💻 **User owns all GUI/webview/emulator/browser/E2E tests.** Do **not** author or run them.
- Prod bar: meaningful coverage on core logic, deterministic/hermetic tests (record-replay any
  LLM/network), no flaky or browser-dependent tests in the assistant suite.
