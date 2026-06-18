# Strip log — Microsoft branding & AI/Copilot removal

Traceability for everything we remove or neutralize from the Code-OSS fork in `app/`, as part
of **MVP Step 0.2** (rebrand & strip). One source of truth so the perpetual **rebase tax**
against upstream has a checklist.

## Why
- **Legal/brand:** ship under our own identity (Onepilot Terminal), zero Microsoft trademarks,
  no MS telemetry/endpoints. (README "What forking obligates us to do".)
- **Product thesis:** the user already runs Claude Code / Codex in the terminal panes — there is
  **no AI-chat block**. Built-in Copilot / AI chat must **disappear** from the UI. The only chat
  we will ever add is a *social* (non-AI) chat, later, re-derived from `vendor/` if needed.

## Guiding principle for the AI strip (non-negotiable)
**Keep chat *services* registered; remove only the *visible UI* and *auto-spawns*.**
Much non-chat code depends on `IChatService` / `IChatSessionsService` / etc. via dependency
injection — removing those service registrations breaks the build at runtime. But nearly every
AI *surface* (markers/search/notebook/SCM-history context providers, AI search model, command
mirror) is **only reachable once a chat widget is open**. Hide the entry points and that code
becomes **unreachable dead code**, which is acceptable. So we gate/hide entry points and
auto-starts; we do **not** delete deeply-wired services.

## Method
- One **compile-gated substep** at a time. After each: `npm run typecheck-client` (src changes)
  and/or `npm run gulp compile-extensions` (extension changes) must pass before moving on.
- Every change is **gated/minimal and reversible** (the pristine original lives in `vendor/`).
- Every concrete edit is recorded in [`changelog.md`](changelog.md) with file:line + lever.

## Files
- [`ai-surface-map.md`](ai-surface-map.md) — full audit: every place Copilot/AI/AI-chat enters,
  with the lever to hide it and the runtime-breakage risk.
- [`changelog.md`](changelog.md) — chronological record of each concrete edit + compile result.

## Status
| Substep | Scope | State |
|---|---|---|
| 0.2.a | Rebrand identity + URLs in `product.json` | ✅ done |
| 0.2.b | Strip Copilot/MS-AI wiring from `product.json` | ✅ done |
| 0.2.c-1 | Hide the Chat panel (auxiliary-bar view container) | ✅ done |
| 0.2.c-2 | Hide the status-bar Copilot/chat entry | ✅ done |
| 0.2.c-3 | Disable inline chat (Cmd+I) | ✅ done |
| — | **Master gate**: force `ChatContextKeys.enabled` false (cascades to ~59 `when`-clauses) | ✅ done (in c-4) |
| 0.2.c-4 | Disable terminal chat (widget, tab sparkle, ctx-menu) | ✅ done |
| 0.2.c-5 | Gate AI code-action lightbulb auto-invoke | ✅ done |
| 0.2.c-6 | Remove SCM "Generate Commit Message" | ✅ done |
| 0.2.c-7 | Gate agent-sessions window + agent host spawn | ✅ done |
| 0.2.c-8 | Hide MCP view, Agents Voice (Image Carousel left — general feature) | ✅ done |
| 0.2.c-9 | Inline completions / ghost text (verify; likely no-op) | ⬜ (verify only) |
| 0.2.d | Build exclusion: copilot ext, mermaid AI bits, `.claude` cleanup | ✅ done |
| 0.2.e | Telemetry-off + headless brand-scan test (`npm run test-onepilot`, 9/9) | ✅ done |
| 0.2.f | Fix boot crashes from `defaultChatAgent` removal (onboarding, defaultAccount) | ✅ done |
| 0.2.g | Remove chat keybindings/commands (Cmd+I etc.) + desktop voice/wake-word | ✅ done |
| Shell | Cockpit blank-canvas defaults: empty sides (activity bar `top` → view-switcher coupled to the side bar, secondary side bar `hidden`, primary side bar first-run `hidden`), top-bar-driven; `cockpit.test.mjs` (18/18) | ✅ done |
