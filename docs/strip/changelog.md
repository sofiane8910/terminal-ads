# Strip changelog

Chronological record of every concrete edit. Each entry: substep · files · what changed · the
lever · compile result. Paths relative to `app/`.

---

## 0.2.a — Rebrand identity + URLs (`product.json`)
- `product.json`: `nameShort`/`nameLong` → "Onepilot Terminal"; `applicationName` → `onepilot-terminal`;
  data folders → `.onepilot-terminal*`; server/tunnel names → `onepilot-terminal-*`; win32 names/IDs
  regenerated (fresh GUIDs, `Onepilot.Terminal`); `darwinBundleIdentifier` → `com.onepilot.terminal`;
  `urlProtocol` → `onepilot-terminal`; `linuxIconName` → `onepilot-terminal`; `licenseUrl`/
  `serverLicenseUrl`/`reportIssueUrl` → onepilot repo URLs.
- Lever: direct value replacement. Verify: JSON parses; no `code-oss`/`Code - OSS`/`vscode-oss` left.
- Compile: N/A (runtime config). Baseline `typecheck-client` after = **PASS**.
- Deferred: `webviewContentExternalBaseUrlTemplate` (vscode-cdn.net infra) → revisit at 0.4 packaging.

## 0.2.b — Strip Copilot/MS-AI wiring (`product.json`)
- Removed keys: `defaultChatAgent`, `trustedExtensionAuthAccess`, `builtInExtensionsEnabledWithAutoUpdates`
  (`GitHub.copilot-chat`), `voiceWsUrl` (wss://…microsoft.com). Kept `sessionsWindowAllowedExtensions: []`.
- Lever: delete keys via node script; re-emit tab-indented JSON.
- Compile: N/A (config). Effect is runtime (Copilot setup/onboarding unavailable).

## 0.2.c-1 — Hide the Chat panel
- `src/vs/workbench/contrib/chat/browser/chatParticipant.contribution.ts`: added flag
  `ONEPILOT_HIDE_AI_CHAT_UI = true`; wrapped the `registerViews([chatViewDescriptor], chatViewContainer)`
  call in `if (!ONEPILOT_HIDE_AI_CHAT_UI)`.
- Effect: the chat view never registers → no activity-bar entry, no open command, no `Cmd+Ctrl+I`
  keybinding. The view *container* still registers but `hideIfEmpty: true` keeps it invisible
  (no views). Chat services untouched (no DI breakage).
- Lever: gated registration (reversible). Compile: `typecheck-client` = **PASS**.

## Shared flag (introduced during c-2)
- New `src/vs/base/common/onepilot.ts` exporting `ONEPILOT_HIDE_AI = true` — the single switch for
  the whole AI strip. Lives in `base/common` so editor/workbench/electron-main can all import it.
  Flip to `false` to restore upstream AI UI. c-1 refactored to use it (replaced its local const).

## 0.2.c-2 — Hide the status-bar chat entry
- `src/vs/workbench/contrib/chat/browser/chat.shared.contribution.ts`: gated
  `registerWorkbenchContribution2(ChatStatusBarEntry...)` behind `if (!ONEPILOT_HIDE_AI)`; added import.
- Effect: no "Copilot"/chat indicator in the status bar.
- Compile: `typecheck-client` = **PASS**.

## 0.2.c-3 — Disable inline chat (Cmd+I)
- `src/vs/workbench/contrib/inlineChat/browser/inlineChat.contribution.ts`: kept
  `registerSingleton(IInlineChatSessionService, ...)` (other features depend on it via DI); wrapped
  ALL visible registrations behind `if (!ONEPILOT_HIDE_AI)` — `InlineChatController` editor contrib,
  all `registerAction2` (Start/Ask/Focus/FixDiagnostics/Dismiss/Keep/Undo/Cancel/Continue/Rephrase →
  removes Cmd+I), notebook inline-chat, default model, enabler, escape tool, accessibility help.
- Loose end: empty-editor hint may still advertise inline chat (it reads the kept service) — revisit.
- Compile: `typecheck-client` = **PASS**.

## MASTER GATE (discovered & landed during c-4) — highest leverage
- `src/vs/workbench/contrib/chat/common/participants/chatAgents.ts`: gated the two spots that set
  `ChatContextKeys.enabled` (`chatIsEnabled`) true — `registerAgentImplementation` (line ~392) and its
  disposal path (line ~403) — behind `!ONEPILOT_HIDE_AI`. Added import.
- Why it matters: `chatIsEnabled` is referenced by **~59 `when`/precondition clauses** across the
  workbench (menus, commands, keybindings, SCM, terminal "Add Selection to Chat", etc.). Forcing it
  false makes all of those disappear via their *existing* gates — no per-site edits needed — and is
  future-proof (a later non-AI/social chat participant can't accidentally light up the AI UI).
  Default of `chatIsEnabled` is already `false`; this makes it deterministic.
- Compile: included in c-4 typecheck = **PASS**.

## 0.2.c-4 — Disable terminal chat
- `terminalContrib/chat/browser/terminal.chat.contribution.ts`: gated `registerTerminalContribution`
  (TerminalChatController), the two `AccessibleViewRegistry.register` calls, and the `TerminalChatEnabler`
  contribution behind `!ONEPILOT_HIDE_AI`. **Kept** `registerSingleton(ITerminalChatService, ...)` —
  consumed widely (terminal.ts, terminalTabbedView, agentHostTerminalService, chat widgets). Left the
  `terminalChatActions` side-effect import (its actions are `when`-gated → dead via the master gate).
- `terminal/browser/terminalTabbedView.ts`: gated the `TerminalTabsChatEntry` instantiation (the tab-bar
  sparkle). All `_chatEntry` uses are optional-chained, so undefined is safe.
- "Add Terminal Selection to Chat" menu is `ChatContextKeys.enabled`-gated → already hidden by master gate.
- Compile: `typecheck-client` = **PASS**.

## 0.2.c-5 — Gate AI code-action lightbulb auto-invoke
- `src/vs/editor/contrib/codeAction/browser/codeActionController.ts`: added `!ONEPILOT_HIDE_AI &&`
  to the `showCodeActionsFromLightbulb` `allAIFixes` branch so an "AI fix" is never auto-applied
  (would launch inline chat); falls through to the normal code-action list. Added import.
- Dormant in practice (no AI provider ⇒ `allAIFixes` never true) — this makes it deterministic.
- Compile: `typecheck-client` = **PASS**.

## 0.2.c-6 — Remove SCM "Generate Commit Message"
- `src/vs/workbench/contrib/scm/browser/scmInput.ts`: wrapped the `SetupAction` (sparkle "Generate
  Commit Message") `registerAction2` in `if (!ONEPILOT_HIDE_AI)`. Added import.
- Was already neutered (its `run()` reads removed `product.defaultChatAgent` ⇒ no-op); button is also
  `ChatContextKeys.Setup.*`-gated. Now deterministically not registered.
- Compile: `typecheck-client` = **PASS**.

## 0.2.c-7 — Gate agent-sessions window + agent host
- `src/vs/code/electron-main/app.ts`: added `!ONEPILOT_HIDE_AI &&` to (a) the `isAgentHostEnabled(...)`
  guard that instantiates `AgentHostProcessManager` (this is why the boot log showed the agent host
  starting — `chat.agentHost.enabled` defaults on), and (b) the `args['agents']` route that opens the
  agent-sessions window. Added import.
- Effect: the AI agent-host process is never spawned at boot; `--agents` is a no-op. The whole
  `src/vs/sessions/` provider layer (copilot/local/remote chat sessions) becomes unreachable dead code.
- Compile: `typecheck-client` = **PASS**.

## 0.2.c-8 — Hide MCP view + Agents Voice
- `src/vs/workbench/contrib/mcp/browser/mcp.view.contribution.ts`: gated the `McpServersViewsContribution`
  registration (MCP = AI tool-server infra). MCP services (mcp.contribution) kept.
- `src/vs/workbench/contrib/agentsVoice/browser/agentsVoice.contribution.ts`: gated the three
  `registerAction2` (toggleWindow / resetOnboarding / pushToTalk) behind `!ONEPILOT_HIDE_AI`, so AI Voice
  Mode can't be enabled even via settings.json. Voice services + context-key/telemetry contributions
  kept (harmless; telemetry covered by 0.2.e). Added imports.
- Image Carousel: **left as-is** — it's a general image-preview editor; its only AI tie (a chat-output
  renderer) is reachable only via chat (already dead). Not a feature to strip.
- Compile: `typecheck-client` = **PASS**.

## 0.2.d-1 — Remove the Copilot built-in extension from the build
- Correction to audit: copilot was NOT merely "excluded" — it was built via dedicated paths.
- `package.json`: removed `compile-copilot`/`watch-copilot`/`watch-copilotd`/`kill-watch-copilotd`/
  `copilot:setup`/`copilot:get_token` scripts and dropped `compile-copilot`/`watch-copilot` from the
  aggregate `compile`/`transpile`/`watch`/`watch-transpile` scripts.
- `build/gulpfile.vscode.ts` + `build/gulpfile.reh.ts`: removed `compileCopilotExtensionBuildTask` from
  the packaging task series, removed the `prepareCopilotRipgrepShim*` task + call, and dropped the now-
  unused imports (`compileCopilotExtensionBuildTask`, `prepareBuiltInCopilotRipgrepShim`). Kept the
  node_modules ripgrep dependency filters (harmless).
- Deleted `extensions/copilot/` (2.3G incl. node_modules; recoverable from `vendor/`). Also removes the
  Copilot `.claude/skills` that were polluting the agent context.
- Left dead (unused) `compileCopilotExtensionBuildTask` def in `gulpfile.extensions.ts` — registered but
  never invoked; would only fail if run explicitly.
- `@github/copilot*` / `@vscode/copilot-api` deps left in `package.json` (unused; removing forces a
  reinstall — defer).
- Verify: build `typecheck` = **PASS**; dev `npm run compile` = **PASS** (0 errors, `out/` present).
- NOTE: the signed **package build** (the gulpfile packaging tasks) is only exercised in Step 0.4 — its
  runtime correctness is verified there, not now.

## 0.2.d-2 — Strip AI bits from mermaid-markdown-features
- `extensions/mermaid-markdown-features/package.json`: removed `contributes.chatOutputRenderers` and
  `contributes.languageModelTools` (`renderMermaidDiagram`). Markdown/notebook features kept.
- `extensions/mermaid-markdown-features/src/extension.ts`: removed the `registerChatSupport` import +
  call. `src/chatOutputRenderer.ts` left as dead (unimported) source.
- Compile: `npm run compile` = **PASS**.

## 0.2.d-3 — Remove stray upstream agent/AI-assistant configs
- Deleted `app/.claude` (symlinked to `.github/copilot-instructions.md` — the upstream "VS Code Copilot
  Instructions" that were being injected into the agent context) and `app/.agents` (agent skills).
- Deleted `app/.github/copilot-instructions.md` and `app/.github/{agents,prompts,instructions,skills,
  commands,commands.json,classifier.json}`.
- Kept standard repo meta (`.github/workflows`, CODEOWNERS, ISSUE_TEMPLATE, dependabot.yml, etc.) — inert
  in our nested layout; revisit when we set up our own repo/CI.
- No compile impact (meta only); verified by the d-2 compile.

## 0.2.e — Telemetry off + headless brand-scan test
- `src/vs/platform/telemetry/common/telemetryService.ts`: default `telemetry.telemetryLevel` changed
  `ON` → `OFF`. (product.json also has no telemetry endpoints, so no sender is initialized regardless.)
- New `test/onepilot/strip.test.mjs` (hermetic, `node --test`, no app launch) + `test-onepilot` npm
  script. 9 assertions: identity has no MS/Code-OSS trademarks; identity == Onepilot Terminal; AI product
  keys absent; no MS marketplace gallery; no MS telemetry endpoints; telemetry default OFF; master flag
  `ONEPILOT_HIDE_AI === true`; `extensions/copilot` removed; no compile-copilot in npm scripts.
- Scope note: the identity scan covers product.json identity/URL fields — NOT builtInExtensions publisher
  metadata (js-debug is legitimately MS-published MIT) nor the webview CDN template (infra, deferred to
  0.4). A full shipped-asset scan belongs to Step 0.4 packaging.
- Verify: `npm run test-onepilot` = **9/9 PASS**; `typecheck-client` = **PASS**.

## 0.2.f — Fix boot crashes from `defaultChatAgent` removal (found via GUI launch)
The first launch surfaced two uncaught exceptions because some core code reads `product.defaultChatAgent`
**eagerly** (at module load / boot-time service init) without guarding — removing the key (0.2.b) broke them.
- `welcomeOnboarding/browser/onboardingVariationA.ts`: a top-level `assertDefined(product.defaultChatAgent, …)`
  threw at module import. Replaced with a safe fallback (`?? {}`) and gated `show()` to a no-op under
  `ONEPILOT_HIDE_AI`; dropped the now-unused `assertDefined` import. (`startupPage.ts` already declines to
  show onboarding when AI is hidden.)
- `services/accounts/browser/defaultAccount.ts`: `toDefaultAccountConfig(productService.defaultChatAgent)`
  ran at `BlockStartup` and dereferenced `undefined` (`.chatExtensionId`). Made `toDefaultAccountConfig`
  accept `undefined` and return an inert config (empty provider ids ⇒ account stays "unavailable", no
  network/sign-in). `IDefaultAccountService` is consumed by non-AI core (update, policy, assignment,
  gallery), so it MUST stay registered — keeping it inert (not gated) is correct.
- Verified safe (no fix needed): `chatEntitlementService.ts` already guards (`product.defaultChatAgent?.x ?? ''`,
  `if (!productService.defaultChatAgent)`); other non-optional `defaultChatAgent.` reads are inside chat-flow
  methods that don't run at boot (dead while AI hidden).
- Verify: `npm run compile` = **PASS**; relaunch = **clean boot, zero uncaught exceptions**.

## 0.2.g — Remove chat keybindings/commands (not just make them inert)
The master gate makes chat keybindings *inert* (their `when` is false) but they still appeared in the
Keyboard Shortcuts editor. To remove them at registration:
- `chat/browser/chat.shared.contribution.ts`: gated `registerChatActions()` behind `!ONEPILOT_HIDE_AI`
  — removes the chat global actions + their keybindings (`Cmd+Ctrl+I`, `Cmd+Alt+I` Open Chat;
  `Cmd+Shift+I` Open Chat mode) and palette entries.
- `chat/electron-browser/chat.contribution.ts`: gated the whole desktop registration block — agent-window
  actions, voice-chat actions (`Cmd+I` ×3), the `KeywordActivationContribution` voice **wake-word listener**
  (privacy), chat CLI/lifecycle handlers, and agent-host contributions.
- Already gone from earlier substeps: the chat view open command (`Cmd+Ctrl+I`, via c-1's gated
  `registerViews`) and inline chat `Cmd+I` (via c-3's gated action registrations).
- Verify: `npm run compile` = **PASS**; relaunch = **clean boot**. 🧑‍💻 GUI: confirm no chat shortcuts
  remain in the Keyboard Shortcuts editor.
- Workflow note: macOS BSD `pkill -f "a\|b"` does NOT alternate — kill stale dev instances with a single
  pattern (`pkill -9 -f "Onepilot Terminal.app"`) or by PID, else a relaunch attaches to the stale instance.

## 0.2.h — Correction: keep `builtInExtensionsEnabledWithAutoUpdates` as `[]` (not removed)
Boot error: `TypeError: productService.builtInExtensionsEnabledWithAutoUpdates is not iterable` from
`extensionsScannerService.ts:112` (a guard-less `for…of`). 0.2.b removed the key, but it's typed
**non-optional** (`readonly string[]` in `base/common/product.ts`) and iterated unguarded — so it must stay
present. Restored it as `[]` in `product.json` (intent was only to drop the `GitHub.copilot-chat` entry).
- Audited the other two removed keys: `trustedExtensionAuthAccess` (optional; all consumers `Array.isArray`/
  `?.`-guard) and `voiceWsUrl` (optional; `|| ''`) — both safe to stay removed.
- Updated `test/onepilot/strip.test.mjs`: assert the auto-update list is an array with no Copilot entry
  (instead of asserting the key is absent). Now **10/10**.
- product.json is read at runtime ⇒ relaunch only (no recompile). Verified: clean boot, error gone.
- Lesson (per fork-trimming policy): before removing a `product.json` key, check its type in
  `base/common/product.ts` — **non-optional keys must be emptied, not deleted**.

## 0.3.a — Guard gallery/extension-management `defaultChatAgent` reads (found after wiring Open VSX)
Opening the Extensions panel crashed: `Cannot read properties of undefined (reading 'extensionId')` at
`extensionGalleryService.ts:1160` (in `runQuery`). My surface-map note was WRONG to call these "chat-flow,
not boot" — they run on **any gallery query / extension install/uninstall**, which 0.3 made reachable.
- `extensionGalleryService.ts`: guarded line ~1160 (`this.productService.defaultChatAgent && areSameExtensions(...)`)
  and wrapped the `deprecated[…copilot…]` block (~1992) in `if (this.productService.defaultChatAgent)`.
- `abstractExtensionManagementService.ts:987` (uninstall pack resolution): same `&&` guard.
- Verified already-safe (no change): `chatGettingStarted.ts` (early-returns if `!defaultChatAgent`),
  `languageModelToolsContribution.ts` + `mainThreadLanguageModelTools.ts` (`defaultChatAgent?.chatExtensionId ? …`).
- Still acceptable dead code: `chatWidget.ts`, `agentSessionsWelcome.ts` (chat-UI/sessions only).
- Verify: `npm run compile` = **PASS**; relaunch = clean boot. 🧑‍💻 Confirm the Extensions panel queries OK.

## Step 0.3 — Wire Open VSX as the extension gallery
- `product.json`: added `extensionsGallery` → `open-vsx.org` (`serviceUrl`/`itemUrl`/`resourceUrlTemplate`,
  the canonical VSCodium-style config). Previously there was NO gallery (Extensions panel couldn't install
  anything); now it resolves from the vendor-neutral Open VSX registry (MS marketplace is forbidden to forks).
- `test/onepilot/strip.test.mjs`: the marketplace test now asserts gallery host == `open-vsx.org` and rejects
  `marketplace.visualstudio.com` / `vscode-cdn`. Suite now **10/10**.
- Did NOT add a live Open-VSX API resolution test (would be flaky/non-hermetic — against our test rules).
  🧑‍💻 Installing an extension from the UI is the user-owned GUI check.
- Known gap (per README): Open VSX lacks MS-proprietary extensions (Pylance, C/C++, .NET debugger,
  Remote-SSH/Dev-Containers/WSL) — can't ship in a fork regardless; Remote-SSH replacement is a later concern.

## Step 0.2.i — Residual VS Code de-branding (from the Haiku-swarm audit)
Audit (`residual-audit.md`): 293 findings, 239 user-visible. Reframed per fork-trimming policy — disable
subsystems wholesale rather than rebrand ~239 strings. User approved: disable wholesale + disable auto-update.
- **i-1 (commented imports in `workbench.common.main.ts`):** dropped `update.contribution` (auto-update +
  release-notes MS feed), `surveys/nps`, `surveys/languageSurveys`, `welcomeWalkthrough` (VS Code editor
  playground). Kept the update *service* (inert — no `updateUrl` in product.json). ~70 findings gone.
- **i-2 (getting-started, keep the service):** new flag `ONEPILOT_HIDE_ONBOARDING` in `base/common/onepilot.ts`;
  `gettingStartedService.registerWalkthroughs()` early-returns (built-in VS Code walkthroughs not registered —
  `gettingStartedContent.ts`'s ~60 strings now dead); `workbench.startupEditor` default `welcomePage` → `none`
  (no welcome page on startup; `'terminal'` is the candidate default once the cockpit lands). `IWalkthroughsService`
  kept for `remote.ts`/extensions.
- **i-3 (rebrand kept surfaces):** extension reload toasts ("Please reload Visual Studio Code" → `product.nameLong`)
  in `extensions.contribution.ts` + `extensionsActions.ts`. Help-menu MS items (newsletter, Ask @vscode) were
  already inert — gated on product URLs we don't ship.
- **Deferred (documented in residual-audit.md):** Windows/Linux packaging strings (macOS-only now), generated
  `.build` Info.plist, MS copyright headers (MIT), issue-reporter fallback (already uses `product.nameLong`),
  loopback OAuth bg app-name check, `aka.ms/vscode-telemetry` link (telemetry OFF), assignment/experiments
  service (dormant — no ExP endpoint). The AI agent-sessions welcome is dead (won't auto-show; window gated).
- Verify: `npm run compile` = PASS (0 errors); `npm run test-onepilot` = 10/10; relaunch = clean boot, no
  welcome page. 🧑‍💻 GUI: confirm no VS Code welcome/walkthrough and rebranded reload toasts.

## Step 0.2 — COMPLETE
All substeps landed and compile clean. Built-in AI/Copilot is hidden behind `ONEPILOT_HIDE_AI` (chat
services kept registered; UI/auto-spawns gated), the Copilot extension is removed from source + build,
branding is Onepilot Terminal, telemetry is off, and a headless test guards it. 🧑‍💻 GUI confirmation
(launch the app, confirm no chat panel / no Copilot affordances) is user-owned.

## Cockpit shell — blank-canvas base (Step 0 ground-prep)
Rearrange the base so it stops reading as "VS Code + our stuff": **nothing on the sides by
default**, everything driven from the top bar (Command Center search box + the existing layout
toggle icons). Defaults only — **user-overridable**, no hard gate — so a beginner can still toggle
parts on (button layer primary; the toggle keybindings are the secondary/shortcut path the user
migrates toward). Product decision (user-approved): activity bar **fully hidden** (no view-switcher
strip, no Accounts/Settings gear in chrome; Settings via `Cmd+,` / menu).
- **Activity bar coupled to the side bar** — `src/vs/workbench/browser/workbench.contribution.ts`
  (`ACTIVITY_BAR_LOCATION` default `'default'` → `'top'`; `agentsWindow` sibling untouched). `'top'` makes
  `sidebarPart.getCompositeBarPosition()` return `CompositeBarPosition.TOP`, rendering the view-switcher
  INSIDE the side bar so it shows/hides *with* it: empty left edge when collapsed, navigation strip returns
  when the side bar is toggled open. The global Accounts/Manage gear relocates to the title bar.
  (First tried `'hidden'` — rejected: it strips the view-switcher permanently, leaving an opened side bar
  with no way to switch Explorer/Search/SCM.)
- **Secondary side bar hidden** — same file (`workbench.secondarySideBar.defaultVisibility` default
  `'visibleInWorkspace'` → `'hidden'`). Both the empty-workspace and "new users" branches in `layout.ts`
  fall through to hidden; independent of `chat.disableAIFeatures`.
- **Primary side bar hidden on first run** — `src/vs/workbench/browser/layout.ts` (`SIDEBAR_HIDDEN.defaultValue`
  → `true`). WORKSPACE-scoped, so it only seeds fresh installs / newly-opened folders; later toggles persist.
  Panel already hidden by default (`PANEL_HIDDEN` defaultValue `true`) — no edit.
- **Clean workspace — minimap / breadcrumbs / empty-editor hint off by default** — three default flips:
  `editor.minimap.enabled` (`src/vs/editor/common/config/editorOptions.ts`, `EditorMinimapOptions.defaults.enabled`
  `true` → `false`), `breadcrumbs.enabled` (`src/vs/workbench/browser/parts/editor/breadcrumbs.ts` `true` → `false`),
  and `workbench.editor.empty.hint` (`src/vs/workbench/browser/workbench.contribution.ts` `'text'` → `'hidden'`,
  removing the "Show All Commands / Open Recent…" watermark). All user-overridable.
- **Workspace Trust (Restricted Mode) off by default** — `contrib/workspace/browser/workspace.contribution.ts`
  (`security.workspace.trust.enabled` default `true` → `false`). The trust service then reports every
  workspace trusted, so opening any folder is natively editable with no safe-browsing banner. Default change,
  user-overridable; trust UI/service stay registered (re-enable by flipping the setting).
- **Outline & Timeline removed from the Explorer** — new flag `ONEPILOT_HIDE_EXPLORER_EXTRAS` in
  `base/common/onepilot.ts`; the `registerViews([...], VIEW_CONTAINER)` calls in
  `contrib/outline/browser/outline.contribution.ts` and `contrib/timeline/browser/timeline.contribution.ts`
  are gated behind `!ONEPILOT_HIDE_EXPLORER_EXTRAS`. Only the *view* registrations are gated — the
  Outline/Timeline services, configuration, commands and menus stay registered (DI unaffected). The two
  collapsible IDE sections no longer appear at the bottom of the file Explorer.
- **Top bar — no edit (verified defaults intact):** `window.commandCenter` `true`,
  `workbench.layoutControl.enabled` `true`, `workbench.layoutControl.type` `'both'`,
  `window.titleBarStyle` `'custom'` on macOS. A new headless test pins all four as regression guards.
- **Test:** `test/onepilot/cockpit.test.mjs` (8 tests) asserts the three defaults + the four top-bar
  invariants + the three toggle keybindings (`Cmd+B` / `Cmd+J` / `Cmd+Alt+B`).
- **Deferred (not this step):** mosaic grid / cockpit part, re-homing Explorer/SCM/Output as blocks,
  editor chrome (minimap/breadcrumbs/tabs), command-palette curation, menubar trimming, a top-bar
  Settings/gear button (add via `registerAction2` only if GUI testing shows beginners can't find Settings).
- Verify: `npm run typecheck-client` = PASS (0 errors); `npm run test-onepilot` = 18/18. 🧑‍💻 GUI:
  on a fresh profile, window opens with empty sides + top bar showing Command Center + toggle icons;
  each toggle reveals/hides its part; `Cmd+B` / `Cmd+J` / `Cmd+Alt+B` work.
