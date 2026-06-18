# AI / Copilot surface map (as implemented)

Where Copilot/AI/AI-chat enters the fork and how each surface was hidden. This started as a
read-only audit; it has been **reconciled with what was actually done** (exact edits + compile
results are in [`changelog.md`](changelog.md)). Paths are relative to `app/`.

> Principle (see [README](README.md)): keep chat **services** registered; hide **visible UI** and
> **auto-spawns**. Code reachable only via an open chat widget is acceptable dead code.
>
> Everything below is gated behind one flag — `ONEPILOT_HIDE_AI` in
> `src/vs/base/common/onepilot.ts` (set `true`). Flip to `false` to restore upstream behaviour.

## 0. MASTER GATE — `ChatContextKeys.enabled` ✅ (highest leverage)
- `src/vs/workbench/contrib/chat/common/participants/chatAgents.ts` — gated the two spots that set
  `ChatContextKeys.enabled` (`chatIsEnabled`) true (`registerAgentImplementation` + its disposal path)
  behind `!ONEPILOT_HIDE_AI`.
- Effect: `chatIsEnabled` can never become true ⇒ the **~59 `when`/precondition clauses** that gate
  AI menus/commands/keybindings stay hidden automatically (no per-site edits). Future-proof: a later
  non-AI/social chat participant can't light up the AI UI.

## A. product.json wiring ✅ (0.2.b)
- Removed `defaultChatAgent` (gated Copilot setup/onboarding/welcome + the sessions-window welcome),
  `trustedExtensionAuthAccess`, `builtInExtensionsEnabledWithAutoUpdates`, `voiceWsUrl`.

### A.1 Eager `defaultChatAgent` consumers that had to be made null-safe ✅ (0.2.f)
Removing `defaultChatAgent` crashed two code paths that read it **eagerly** (module load / BlockStartup),
found via the GUI launch. Both fixed to be robust to a missing agent (not gated away — they back non-AI
core too):
- `welcomeOnboarding/browser/onboardingVariationA.ts` — top-level `assertDefined` → safe fallback + `show()`
  no-op under `ONEPILOT_HIDE_AI`.
- `services/accounts/browser/defaultAccount.ts` — `toDefaultAccountConfig(undefined)` → inert config
  (account stays "unavailable"; `IDefaultAccountService` is consumed by update/policy/assignment/gallery,
  so it stays registered).
- Safe by design (no change): `services/chat/common/chatEntitlementService.ts` (already `?.`/guarded).
- **Reachable via the Extensions panel (NOT chat-only — corrected after 0.3, fixed in 0.3.a):**
  `extensionGalleryService.ts` (`runQuery` ~1160 + the `deprecated` copilot block ~1992) and
  `abstractExtensionManagementService.ts:987` (uninstall) — now `&&`-guarded.
- Already safe (guarded by `?.`/early-return): `chatGettingStarted.ts`, `languageModelToolsContribution.ts`,
  `mainThreadLanguageModelTools.ts`, `chatEntitlementService.ts`.
- Genuinely chat-UI/sessions only (acceptable dead code): `chatWidget.ts`, `agentSessionsWelcome.ts`.

## B. Visible entry points hidden (each gated by `ONEPILOT_HIDE_AI`)

### 1. Chat panel (auxiliary-bar view) ✅
- `chat/browser/chatParticipant.contribution.ts` — gated the `registerViews([chatViewDescriptor], …)`
  call. The view never registers ⇒ no activity-bar entry, no open command, no `Cmd+Ctrl+I`. The empty
  container stays (its `hideIfEmpty: true` keeps it invisible). Chat services kept.

### 2. Status-bar chat entry ✅
- Gated at the registration site `chat/browser/chat.shared.contribution.ts` (`registerWorkbenchContribution2(ChatStatusBarEntry…)`)
  — not in `chatStatusEntry.ts` itself.

### 3. Inline chat (Cmd+I) ✅
- `inlineChat/browser/inlineChat.contribution.ts` — kept `registerSingleton(IInlineChatSessionService…)`
  (consumed by empty-editor hints, notebook view-models, chat editing); gated controller, all actions
  (removes Cmd+I), notebook integration, default model, enabler, escape tool, accessibility help.
- Loose end: the empty-editor hint may still advertise inline chat (reads the kept service) — revisit.

### 4. Terminal chat ✅
- `terminalContrib/chat/browser/terminal.chat.contribution.ts` — gated `TerminalChatController`
  registration + accessibility views + `TerminalChatEnabler`. Kept `registerSingleton(ITerminalChatService…)`
  (widely consumed). Left the `terminalChatActions` side-effect import (its actions are `when`-gated ⇒
  dead via the master gate).
- `terminal/browser/terminalTabbedView.ts` — gated the `TerminalTabsChatEntry` instantiation (the tab-bar
  sparkle); all `_chatEntry` uses are optional-chained.
- "Add Terminal Selection to Chat" (`chatAgentTools` menu) — `ChatContextKeys.enabled`-gated ⇒ hidden by
  the master gate (not edited).

### 5. AI code-action lightbulb auto-fix ✅
- `editor/contrib/codeAction/browser/codeActionController.ts` — gated the `allAIFixes` auto-invoke branch
  (`!ONEPILOT_HIDE_AI && …`); falls through to the normal code-action list. (Dormant anyway: no AI provider.)

### 6. SCM "Generate Commit Message" ✅
- `scm/browser/scmInput.ts` — gated the `SetupAction` `registerAction2` (sparkle button). Was already
  neutered (its `run()` read the removed `defaultChatAgent`).
- `scm/browser/scmHistoryChatContext.ts` — reachable only via chat; left as dead code.

### 7. Agent-sessions window + agent host ✅
- `code/electron-main/app.ts` — gated (a) the `isAgentHostEnabled(...)` guard that instantiates
  `AgentHostProcessManager` (CONFIRMED: `chat.agentHost.enabled` defaults on — this is why the boot log
  showed the agent host starting), and (b) the `args['agents']` route to `openAgentsWindow`.
- The whole `src/vs/sessions/` provider layer (copilot/local/remote sessions) + the workbench openers
  (`agentSessionsActions`, `agentSessionsBanner`) become unreachable dead code.

### 8. MCP view + Agents Voice ✅
- `mcp/browser/mcp.view.contribution.ts` — gated the MCP servers view registration. MCP services
  (`mcp.contribution`) kept. MCP commands are `ChatContextKeys`-gated ⇒ covered by the master gate.
- `agentsVoice/browser/agentsVoice.contribution.ts` — gated the three actions (toggle / resetOnboarding /
  pushToTalk) so Voice can't be enabled even via settings.json. Voice services + context-key/telemetry
  contributions kept (telemetry covered by 0.2.e).
- **Image Carousel — LEFT as-is**: it's a general image-preview editor; its only AI tie (a chat-output
  renderer) is reachable only via chat (dead). Not a feature to strip.

### 9. Inline completions / ghost text — NOT TOUCHED (verified no-op)
- `editor/contrib/inlineCompletions/…` is the generic framework; with no provider shipped nothing renders.
  Removing it would also kill non-AI completion providers we may want. Left intact.

## C. Build-level ✅ (0.2.d)
- **`extensions/copilot` — DELETED** (2.3G; recoverable from `vendor/`). Correction to the original audit:
  it was NOT "already excluded" — it was built via dedicated paths. Removed `compile-copilot`/`watch-copilot`
  (+ helper scripts) from `package.json` and `compileCopilotExtensionBuildTask` + the `prepareCopilotRipgrepShim*`
  task from `build/gulpfile.vscode.ts` and `build/gulpfile.reh.ts`. (Dead unused `compileCopilotExtensionBuildTask`
  def left in `gulpfile.extensions.ts`; unused `@github/copilot*` npm deps left — defer.)
- `extensions/mermaid-markdown-features` — stripped `chatOutputRenderers` + `languageModelTools` + the
  `registerChatSupport()` call; markdown/notebook features kept. `src/chatOutputRenderer.ts` left as dead source.
- Removed stray upstream agent configs: `app/.claude`, `app/.agents`, `app/.github/copilot-instructions.md`
  + `app/.github/{agents,prompts,instructions,skills,commands,commands.json,classifier.json}`.
- `extensions/github-authentication` — **KEPT** (needed for our own GitHub OAuth later).
- `extensions/microsoft-authentication` — review/candidate to drop later (not needed for our flows).

## D. Telemetry ✅ (0.2.e)
- `platform/telemetry/common/telemetryService.ts` — default `telemetry.telemetryLevel` `ON` → `OFF`.
- No MS telemetry endpoints in `product.json` ⇒ no sender initialized regardless.

## Reachable-only-via-chat (acceptable dead code — intentionally NOT touched)
markers/search/notebook chat-context providers, AI search model, chat terminal command mirror, chat
attachment pickers, the `src/vs/sessions/` providers, the agentHost SDK code (`platform/agentHost/node/copilot`,
`…/claude`). Unreachable while the section-0 master gate + section-B entry points are gated off.

## Deferred to Step 0.4 (packaging) — not forgotten
- `webviewContentExternalBaseUrlTemplate` (`vscode-cdn.net` infra); full shipped-asset brand scan;
  runtime verification of the packaging-gulpfile copilot edits (can't run the signed build until 0.4);
  removal of unused `@github/copilot*` deps.
