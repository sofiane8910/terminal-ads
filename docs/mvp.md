# MVP — Detailed Build Breakdown

Execution companion to [`../README.md`](../README.md). For every step/substep:
**Problem → Implementation → Tests → Condition of success.**

## Scope, platform & testing rules

- **Scope = README Phases 0–2** (Foundation + Agent Cockpit + Project-relevant Intelligence
  Feed) plus minimal accounts and instrumentation. **No ads, no payments, no network/social.**
- **Platform: macOS only for now.** The **stack stays cross-platform** — we keep all platform
  abstractions (e.g., `node-pty`/ConPTY paths, OS-agnostic services) and do **not** rip out
  Windows/Linux code. We simply **target only macOS in CI and distribution** for now; enabling
  Windows/Linux later is flipping CI targets, not a rewrite.
- **Testing ownership (important):**
  - ✅ **Assistant-owned = headless automated tests only:** pure logic/state machines, data
    parsers, Go services, API/DB integration, schema/privacy assertions. These run in CI
    without launching the app.
  - 🧑‍💻 **User-owned = anything that renders the app, webview, or needs the emulator:** all
    GUI/visual/interaction/E2E checks. **The assistant will not author or run browser/app
    tests** (launching the emulator is unreliable here). These are listed so the acceptance is
    explicit, but they are yours to run.

**MVP is "done" (gate to Phase 3 / ads):** a solo founder uses it daily as their agent
workspace **and** the feed clears a relevance bar — both with zero other users online.

**Tech:** Code-OSS fork (TS/Electron) · `xterm.js` + `node-pty` · Go services · Supabase
(Postgres + Auth + Storage) · React in webview for the rail.

---

## Step 0 — Foundation: branded, buildable macOS app
**Problem we solve:** we need a legal, distributable base app — no Microsoft branding,
telemetry, or marketplace-terms violations — that builds on macOS.

### 0.1 Clone & build Code-OSS (macOS)
- **Implementation:** fork Code-OSS, pin a stable release tag; build the macOS app
  (`arm64` + `x64`) via the existing gulp pipeline; keep cross-platform build scripts in place.
- **Tests (✅):** CI on a macOS runner completes the build and emits a `.app`; a headless smoke
  step runs the built CLI entry (`--version`) and asserts exit 0 + our version string.
- 🧑‍💻 **User-owned:** launch the `.app`, confirm window + terminal work.
- **Success:** macOS CI produces a launchable `.app`; headless `--version` returns our version.

### 0.2 Rebrand & strip Microsoft bits
- **Implementation:** set `product.json` (names, `dataFolderName`, URLs), replace icons, set
  `telemetry.telemetryLevel = off`, remove MS reporting endpoints and gallery defaults.
- **Tests (✅):** asset/string scan asserts **zero** "Microsoft"/"Visual Studio Code"
  trademarks in shipped files; config test asserts telemetry off and no MS endpoints in
  `product.json`; unit test asserts the telemetry sender is not initialized.
- 🧑‍💻 **User-owned:** visual check of About box / branding.
- **Success:** brand + telemetry scans pass (zero MS marks, telemetry off).

### 0.3 Wire Open VSX
- **Implementation:** point `extensionsGallery` at Open VSX (`serviceUrl`/`itemUrl`).
- **Tests (✅):** config test asserts gallery host = `open-vsx.org` and **not**
  `marketplace.visualstudio.com`; integration test resolves a known extension's metadata from
  the Open VSX API (network, non-GUI).
- 🧑‍💻 **User-owned:** install an extension from the UI.
- **Success:** gallery resolves from Open VSX in the automated check; no MS-marketplace host.

### 0.4 CI: signed & notarized macOS build
- **Implementation:** GitHub Actions macOS runner: codesign → notarize (`notarytool`) → staple;
  output `.dmg`/`.zip`. Keep Windows/Linux jobs defined but skipped.
- **Tests (✅):** CI asserts artifact exists; `codesign --verify --deep --strict` passes;
  `stapler validate` (Gatekeeper) passes.
- **Success:** CI emits a signed + notarized, Gatekeeper-valid `.dmg`.

---

## Step 1 — Agent Cockpit
**Problem we solve:** running several AI agents at once is chaos — people lose track across
tabs and **miss completions / "waiting for input"** ([HN](https://news.ycombinator.com/item?id=47268777),
[Warp #6668](https://github.com/warpdotdev/warp/issues/6668)).

### 1.1 Multi-pane mosaic grid
- **Implementation:** extend the workbench to a mosaic grid managing terminal instances;
  split / resize / focus / full-screen per pane; layout held in a serializable model.
- **Tests (✅):** unit tests on the layout model (add/remove/split/resize → correct tree);
  serialization round-trip.
- 🧑‍💻 **User-owned:** visual/interaction check of the grid.
- **Success:** layout-model unit tests pass for N panes incl. resize + full-screen state.

### 1.2 Shell-integration capture (OSC 133/633)
- **Implementation:** inject shell-integration scripts (bash/zsh/fish) emitting OSC 633; parse
  the terminal byte stream for command-start, command-end, and exit code.
- **Tests (✅):** feed recorded PTY byte-stream fixtures (with OSC sequences) into the parser →
  assert emitted `{start, end, exitCode}`; edge cases: no exit code, Ctrl-C, multiline.
- **Success:** parser passes the fixture suite incl. exit 0 vs non-zero and interrupted commands.

### 1.3 Agent state machine
- **Implementation:** state machine over OSC events + PTY heuristics → *running /
  waiting-for-input / done / failed / idle / stale*; detect input-wait (TTY read / known agent
  prompt) vs working; per-pane state store; fake-clock for idle/stale.
- **Tests (✅):** scripted event sequences assert each transition; **waiting-for-input fixture
  classified as waiting, not running**; dead PTY → stale; timed idle → idle (fake clock).
- **Success:** the full transition matrix passes, including the waiting-for-input case.

### 1.4 Glanceable status UI
- **Implementation:** per-pane/tab badges (color + icon), color-blind-safe palette, subscribed
  to the state store.
- **Tests (✅):** unit test maps `state → badge descriptor` (color/icon/label) correctly and
  from a color-blind-safe set; reactivity test: a state change emits a new descriptor.
- 🧑‍💻 **User-owned:** glanceability check in a 6-pane layout.
- **Success:** state→badge mapping unit tests pass; descriptor updates on state change.

### 1.5 Never-miss-completion notifications (incl. tmux/SSH)
- **Implementation:** on `done/failed/waiting`, emit a native macOS notification + push to an
  in-app attention store; wrap OSC in **DCS passthrough** so sequences survive tmux; dedupe.
- **Tests (✅):** unit test that each transition enqueues exactly one notification (dedup);
  tmux-passthrough encoder unit test vs known-good bytes; headless harness spawns tmux in a PTY,
  writes a sequence, asserts our listener receives the event (non-GUI).
- 🧑‍💻 **User-owned:** confirm the macOS notification actually pops.
- **Success:** dedup + tmux-encoding unit tests pass; headless tmux harness receives the event.

### 1.6 "Who needs me first" aggregation
- **Implementation:** derive a ranked attention list from the state store (waiting-for-input >
  failed > done; tiebreak by time); expose ordering API; click → focus pane.
- **Tests (✅):** given mixed pane states, assert the ranked list contents + order; tie-break by
  timestamp; running/idle excluded.
- 🧑‍💻 **User-owned:** click-to-focus interaction.
- **Success:** ranking unit tests pass for mixed-state sets.

---

## Step 2 — Project-relevant Intelligence Feed
**Problem we solve:** distribution is solo founders' #1 weakness, but generic feeds are
doomscroll/overload ([Indie Hackers](https://www.indiehackers.com/post/i-analyzed-over-20k-posts-from-solo-founders-the-1-complaint-wasnt-money-or-skills-36bee8bff4)).
This must be **relevant** — the bar we clear before monetizing.

### 2.1 Local project-context extraction (on-device, private)
- **Implementation:** scan workspace manifests (`package.json`, `Cargo.toml`, `go.mod`, …) to
  detect langs/frameworks; infer topic via local heuristics; emit a small **non-identifying**
  context profile (`{langs, frameworks, tags}`); never send raw paths/repo names without consent.
- **Tests (✅):** sample-repo fixtures → detected profile matches expected; **privacy test**
  asserts the serialized profile contains no paths/repo names/code (schema allowlist);
  offline run still produces a profile.
- **Success:** detection fixtures pass; privacy-schema test passes (only allowlisted fields leave).

### 2.2 Content ingestion service (Go)
- **Implementation:** Go service pulls RSS/HN/APIs + editorial; normalize; dedupe by URL/hash;
  store in Supabase Postgres; scheduled.
- **Tests (✅):** Go unit tests (parser/normalizer/dedup); integration test vs recorded fixtures
  (`httptest`) asserts deduped storage; malformed feed handled without panic.
- **Success:** ingestion suite green; dedup verified on a duplicate-containing fixture.

### 2.3 Relevance ranking
- **Implementation:** rank items against the context profile (embedding similarity or
  keyword/topic match for v1); inclusion threshold.
- **Tests (✅):** labeled eval set → **precision@5 ≥ 0.8** (tunable bar); regression test that
  off-topic items never enter top-5; profile change changes ranking (seeded/deterministic).
- **Success:** precision@5 ≥ target on the eval set; off-topic-exclusion test passes.

### 2.4 AI summarization into actionable nuggets
- **Implementation:** summarize top items into concise, action-oriented nuggets (server-side
  LLM); enforce format (length cap, action verb, retained source URL).
- **Tests (✅):** **faithfulness** eval on a fixed set (entity-overlap / rule checks vs source →
  no hallucinated entities); format/length lint; valid source URL retained. **Hermetic**:
  record/replay cached LLM responses so CI needs no live model.
- **Success:** faithfulness ≥ target + format lint pass, on recorded fixtures (no live LLM in CI).

### 2.5 Feed Rail (logic) + UI
- **Implementation:** React webview panel rendering a **bounded** card list (no infinite
  scroll), dismiss/expand; reads from the feed API. Keep view-model logic separate from render.
- **Tests (✅):** view-model unit tests — bounded count enforced, dismiss reducer, source-link
  presence — all pure logic, no rendering.
- 🧑‍💻 **User-owned:** webview render, focus behavior, "feels ambient/non-distracting" UX, any
  component/E2E rendering tests.
- **Success:** view-model unit tests pass (bounded list, dismiss, source link present).

### 2.6 Status-gated dead-time logic (the core mechanic)
- **Implementation:** controller subscribing to the agent-state store: feed "active" only when
  ≥1 agent running and none waiting/failed/done-unseen; on completion/waiting → feed yields +
  attention raised. Pure controller (no UI).
- **Tests (✅):** controller unit tests over agent-state timelines assert active/yield
  transitions; **invariant property test: an unacknowledged completion always preempts feed
  display** (feed is never "active" while a completion is unseen).
- **Success:** controller matrix passes incl. the "completion preempts feed" invariant.

### 2.7 Relevance feedback loop
- **Implementation:** thumbs/dismiss → persisted (Supabase) → adjust ranking weights / topic mutes.
- **Tests (✅):** unit test that feedback updates stored weight/mute and that ranking reflects it
  next query; persistence round-trip.
- **Success:** feedback→ranking adjustment passes; persists across restart (data-level).

---

## Step 3 — Minimal accounts (support layer; no payments)
**Problem we solve:** personalization/feedback must persist and sync — without building payments.

### 3.1 GitHub OAuth (Supabase Auth)
- **Implementation:** Supabase Auth GitHub provider; minimal scope (read profile); store session.
- **Tests (✅):** integration test (CI Supabase project) for token exchange + session; session
  persistence (data-level); sign-out clears session.
- 🧑‍💻 **User-owned:** the in-app "Sign in with GitHub" redirect flow.
- **Success:** token/session integration test passes; sign-out clears stored session.

### 3.2 Sync preferences & feedback (Supabase)
- **Implementation:** prefs/feedback tables with **RLS per-user**; client read/write with offline
  queue + reconcile.
- **Tests (✅):** RLS test (user A cannot read B's rows); offline-queue unit test (queue → flush
  on reconnect → reconcile); round-trip persistence.
- **Success:** RLS isolation + offline-queue reconcile tests pass.

---

## Step 4 — Success instrumentation (opt-in, privacy-respecting)
**Problem we solve:** measure whether the MVP works — the data that **gates** moving to ads.

### 4.1 Solo retention / DAU
- **Implementation:** opt-in event pipeline (no command content) → store → retention calc.
- **Tests (✅):** event-schema test asserts **no command content/paths**; retention-calc unit
  test on synthetic events (D1/D7/D30).
- **Success:** schema-privacy + retention-calc tests pass.

### 4.2 Feed relevance metrics
- **Implementation:** capture dismiss rate, thumbs, nugget engagement; aggregate.
- **Tests (✅):** aggregation unit tests on synthetic data; dismiss-rate computation correct.
- **Success:** metric-aggregation tests pass; the gate metric is queryable.

### 4.3 Core-mechanic metrics
- **Implementation:** track completions caught vs missed; dead-time engagement.
- **Tests (✅):** unit tests deriving caught/missed from event timelines.
- **Success:** caught/missed derivation tests pass.

---

## MVP exit criteria (gate to Phase 3 — ads)
- **Cockpit** used daily as a primary agent workspace (retention bar) — measured (4.1).
- **Feed** relevance bar met: low dismiss rate + positive feedback — measured (4.2), proven
  useful **before** any ad is shown.
- **Privacy** verified: no command content / paths / repo names leave the device without
  consent — automated schema tests (2.1, 4.1) + audit.
- **macOS** signed + notarized build shipping from CI (0.4).
- 🧑‍💻 GUI/E2E acceptance passes (grid, badges, notifications popping, rail feel) — user-owned.
