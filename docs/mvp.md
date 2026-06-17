# MVP — Detailed Build Breakdown

This document breaks the MVP into **core steps → substeps**, each with its **purpose**
and the **tests** that prove it works. It is the execution companion to the vision in
[`../README.md`](../README.md).

## What the MVP is (and isn't)

**Scope = README Phases 0–2:** a branded Code-OSS fork that is (1) an excellent
**Agent Cockpit** and (2) a **project-relevant Intelligence Feed**. The MVP has **no
ads, no payments, and no social/network features** — those come only after the feed is
proven useful.

**The MVP is "done" when:** a solo founder uses it daily as their agent workspace
**and** the feed clears a relevance bar (low dismiss rate, positive feedback) — both with
zero other users online.

**Tech (from README):** Code-OSS fork (TypeScript/Electron) · `xterm.js` + `node-pty` ·
Go services · Supabase (Postgres + Auth + Storage) · React in webview for the rail.

**Why this user, these problems:** validated by research — solo founders' #1 pain is
distribution/business acumen, #2 is isolation; the most acute workflow pain is *missing
agent completions / lost awareness* across tabs; every existing feed is doomscroll and
every community is performative. (See README "Competitive landscape".)

---

## Step 0 — Foundation: a branded, buildable Code-OSS fork
**Purpose:** a legal, distributable base app to build everything else on, without
Microsoft branding/telemetry or marketplace-terms violations.

### 0.1 Clone & build Code-OSS locally
- **Purpose:** confirm we can produce a running app from source on all targets.
- **Tests:** `yarn && yarn watch` (or equivalent) builds with no errors; the app launches
  and opens a working terminal on **macOS, Windows, and Linux**.

### 0.2 Rebrand & strip Microsoft bits
- **Purpose:** ship under our own identity; remove proprietary marks and telemetry (legal
  requirement of the fork).
- **Tests:** product name/icons/about-box show our brand; grep finds no Microsoft
  trademarks in shipped assets; all telemetry/reporting endpoints are disabled (network
  capture shows zero calls to Microsoft endpoints on launch and use).

### 0.3 Wire Open VSX (not the MS Marketplace)
- **Purpose:** allow extensions without violating Microsoft Marketplace terms.
- **Tests:** extension panel queries Open VSX; installing a known extension (e.g., a
  theme) from Open VSX succeeds; no requests hit `marketplace.visualstudio.com`.

### 0.4 CI: signed/notarized builds
- **Purpose:** a repeatable path to installable artifacts.
- **Tests:** CI pipeline produces a signed/notarized macOS artifact and a Windows
  installer from a clean checkout; a fresh machine can install and launch each.

---

## Step 1 — Agent Cockpit
**Purpose:** the single-player wedge — run many agents at once and *never lose track of
them*. This is the most acute, current pain and the vehicle for the dead-time mechanic.

### 1.1 Multi-pane mosaic grid
- **Purpose:** run several agents side-by-side, each independently usable.
- **Tests:** open N terminal panes in a grid; each is independently focusable, resizable,
  and full-screen-toggle-able; layout survives window resize without corruption.

### 1.2 Shell-integration capture (OSC 133 / 633)
- **Purpose:** the raw signal — detect command start, end, and exit code per pane.
- **Tests:** run a known sequence (`true`, `false`, a long `sleep`); captured events show
  correct command-start, command-end, and exit codes (0 vs non-zero) for each.

### 1.3 Agent state machine
- **Purpose:** classify each pane as *running / waiting-for-input / done / failed / idle /
  stale* — including the hard case of "waiting for input" vs "still working" (a known
  failure mode in existing tools).
- **Tests:** scripted scenarios drive each state; classifier output matches expected state
  for every case; a process that prompts for input is detected as **waiting-for-input**,
  not "running"; a dead PTY becomes **stale**.

### 1.4 Glanceable status UI
- **Purpose:** see the state of every agent at a glance, without clicking in.
- **Tests:** each state renders a distinct, color-blind-safe indicator on its pane/tab;
  indicators update within ~1s of a state change; states are distinguishable at a glance in
  a 6-pane layout (usability check).

### 1.5 Never-miss-completion notifications
- **Purpose:** guarantee the user is alerted when an agent finishes or needs input — even
  in a background pane, over tmux or SSH (where existing tools silently drop alerts).
- **Tests:** a background agent completing fires a notification; the same works when the
  session runs **inside tmux** and **over SSH**; failure (non-zero exit) and
  waiting-for-input also notify; no duplicate/storm notifications.

### 1.6 "Who needs me first" aggregation
- **Purpose:** when many agents need attention, rank what to attend to.
- **Tests:** with multiple panes in mixed states, the attention list shows only panes
  needing action (waiting-for-input, failed, done), correctly ordered (e.g., blocked >
  failed > done); clicking an entry focuses that pane.

---

## Step 2 — Project-relevant Intelligence Feed
**Purpose:** the moat — turn dead-time into leverage with **relevant, actionable**
intelligence (the founder's #1 weakness), explicitly **not** a doomscroll feed. This is
what we must nail *before* introducing ads.

### 2.1 Local project-context extraction (on-device, private)
- **Purpose:** know what the user is building (stack, languages, topic) to key relevance —
  without anything leaving the device unless the user consents.
- **Tests:** on sample repos, detected stack/topic matches expectation; with telemetry
  inspection, **no repo names, file paths, or code** leave the device; works offline.

### 2.2 Content ingestion service (Go)
- **Purpose:** gather source material (RSS / HN / APIs + editorial) to draw from.
- **Tests:** service pulls configured sources on schedule, **deduplicates** repeats, and
  stores normalized items; malformed/stale sources are skipped without crashing.

### 2.3 Relevance ranking
- **Purpose:** surface only what matters to *this* project — the anti-doomscroll core.
- **Tests:** on a labeled eval set (relevant vs irrelevant per project profile),
  **precision@5 ≥ target** (e.g., 0.8); clearly off-topic items never appear in the top
  cards; changing the project profile changes the ranking sensibly.

### 2.4 AI summarization into actionable nuggets
- **Purpose:** deliver "here's what to act on," not links to scroll.
- **Tests:** summaries are concise and action-oriented; **faithfulness check** on an eval
  set shows no hallucinated facts vs source; each nugget links back to its source.

### 2.5 Feed Rail UI (React webview)
- **Purpose:** an ambient, low-distraction surface — a few cards, never infinite scroll.
- **Tests:** rail shows a bounded number of cards (no endless scroll); renders within
  performance budget; dismiss/expand interactions work; does not steal focus from the
  terminal.

### 2.6 Status-gated dead-time logic (the core mechanic)
- **Purpose:** show the feed only while agents are working; **yield and pull the user back**
  the moment an agent finishes or needs input.
- **Tests:** with an agent running, the rail is active; on completion or waiting-for-input,
  the rail visibly yields and the attention alert (1.5/1.6) fires; the user is never shown
  feed content *instead of* a needed completion alert.

### 2.7 Relevance feedback loop
- **Purpose:** let the user tune relevance (thumbs up/down, dismiss) so the feed improves.
- **Tests:** feedback is recorded and measurably shifts subsequent ranking; dismissed
  topics appear less; feedback persists across restarts.

---

## Step 3 — Minimal accounts (support layer, not a feature)
**Purpose:** lightweight identity so personalization/feedback persist and sync — **no
payments** (those arrive with ads, post-MVP).

### 3.1 GitHub OAuth sign-in (Supabase Auth)
- **Purpose:** frictionless identity for a developer audience.
- **Tests:** sign-in and sign-out work; session persists across restarts; revoking access
  logs the user out cleanly.

### 3.2 Sync preferences & feedback (Supabase)
- **Purpose:** remember relevance tuning and settings across devices/reinstalls.
- **Tests:** preferences/feedback set on one install reappear after reinstall / on a second
  device; sync is resilient to offline use (queues and reconciles).

---

## Step 4 — Success instrumentation (privacy-respecting, opt-in)
**Purpose:** measure whether the MVP actually works — the data that gates moving to ads
(Phase 3).

### 4.1 Solo retention / DAU
- **Purpose:** validate the cockpit has standalone daily value.
- **Tests:** retention/DAU events fire correctly; a dashboard reports D1/D7/D30 retention;
  all analytics are opt-in and contain no command content.

### 4.2 Feed relevance metrics
- **Purpose:** quantify whether the feed is "nailed" before monetizing.
- **Tests:** nugget engagement, **dismiss rate**, and thumbs are captured; a dashboard
  shows the relevance bar (e.g., dismiss rate below threshold) used as the Phase-3 gate.

### 4.3 Core-mechanic metrics
- **Purpose:** prove the never-miss guarantee and dead-time capture.
- **Tests:** "completions caught vs missed" is tracked and trends to ~100% caught;
  dead-time engagement is measured without degrading time-to-attention on completions.

---

## MVP exit criteria (gate to Phase 3 — ads)
- **Cockpit:** used daily as a primary agent workspace (retention bar met); never-miss
  notifications reliable across tmux/SSH.
- **Feed:** relevance bar met (low dismiss rate + positive feedback) — proven useful
  **before** any ad is shown.
- **Trust:** verified that no command content, repo names, or file paths leave the device
  without explicit consent.

Only when these hold do we introduce ads + rev-share (README Phase 3).
