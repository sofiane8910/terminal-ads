# Onepilot Terminal

*(repo: `terminal-ads`; product name: **Onepilot Terminal** — the desktop cockpit in the [Onepilot](https://onepilotapp.com) family)*

**Bloomberg for developers.** A terminal-native cockpit for solo technical founders:
it orchestrates the AI agents you run, guarantees you **never miss a task finishing**,
and turns the dead-time while agents work into leverage — **project-relevant
intelligence now, an opt-in peer network later.** Free to use; monetized by ads with
**50% revenue shared back to users** (added *only after* the in-app feed is genuinely
useful), growing into media partnerships and a privacy-gated founder-benchmark data
product.

> Detailed MVP build breakdown (steps, substeps, purpose, and tests) lives in
> [`docs/mvp.md`](docs/mvp.md).

This README is the living strategy + architecture doc. It records *why* each major
decision was made, so the trace survives.

---

## Target user

A **solo technical founder**, deep in the terminal, running one or more AI agents,
strong at building but **weak at distribution / business acumen**, and working in a
**silo** with no sounding board. (Pains validated by research across Indie Hackers, HN,
and founder blogs — see [`docs/mvp.md`](docs/mvp.md).)

## The thesis

The terminal/cockpit is the **daily utility** that gets founders in the door. The
**intelligence + peer network** is what they can't leave.

This is structurally the Bloomberg Terminal: nobody pays ~$32k/year for the *data*; they
stay because of the closed network and the workflow lock-in, and leaving means cutting
yourself off. The cockpit can be copied in a quarter. A relevance-tuned intelligence
engine and a populated, confidential founder network cannot.

**The core mechanic — status-gated dead-time.** The cockpit knows precisely when each
agent is *running / waiting-for-input / done / failed*. While you wait, it surfaces
project-relevant intelligence; the instant an agent needs you, the surface **yields and
pulls you back**. Guarantee: **you never miss a completion.** That guarantee is what makes
feeding you content *non-distracting* — and it's impossible without the terminal
integration we're building.

**Status alone is not the moat.** The agent-monitoring space is already crowding (cmux,
Superset, Pane, aTerm, Termdock — mostly macOS-only wrappers). Live status is *table
stakes*. Our defensible ground is what we do with the dead-time it exposes:
**(a) actionable business/distribution intelligence** (the founder's #1 weakness) and
**(b) an opt-in, confidential peer network** (the founder's #2 pain, isolation). No one
occupies that intersection.

**Why most developer networks die — and why this one shouldn't:** the cold-start problem
(empty room → users leave → stays empty). Our defense is structural: **the single-player
experience is genuinely useful with zero other users online** (the cockpit + a
project-relevant feed). Nail single-player first; layer the network on top.

## What we're building (the bundle)

Three layers, built in this order:

1. **Agent Cockpit** *(the vehicle — table-stakes parity):* a multi-agent terminal grid
   with glanceable status, never-miss-completion alerts, and "who needs me first" ranking.
   Cross-platform (most rivals are macOS-only).
2. **Intelligence Rail** *(moat A):* curated + AI-summarized, **actionable**, distribution/
   business-oriented nuggets keyed to your **local, private** project context (stack / repo
   topic). A few "act on this" cards — never an infinite scroll. *This is what we nail
   before introducing ads.*
3. **Peer Network** *(moat B — later):* opt-in, abstracted presence → confidential cohort
   connection + **anonymized operational benchmarking** (the data VCs have and founders
   don't). Non-social, productivity-framed.

**Endgame:** a full dev environment that replaces VS Code/Cursor *and* your terminal —
the one app a founder keeps open all day. **On-ramp:** the cockpit + feed, worth using on
its own.

## Workspace & blocks

The cockpit is a full-screen mosaic grid. Terminals are one block type; the others serve
**Ship / Grow / Know**. The MVP ships 6 core blocks (terminal+agent, status, intelligence
feed, file/diff preview, logs/process, tasks) plus a connect-once **business integration
pack** using the tools solo founders actually run (Stripe, Plausible/GA4, Vercel, Loops,
Crisp, GitHub). No AI-chat block — the user already runs Claude Code / Codex in the panes.

> Full catalog with use cases, sources, auth methods, and the later blocks (the Advisor,
> market radar, peer network, saved-layout "modes") is in [`docs/blocks.md`](docs/blocks.md).

## Locked architecture decision: fork Code-OSS

We fork **Code - OSS** (the MIT-licensed VS Code base), not a terminal library, because
the endgame is an IDE. The key insight: with a fork, **we don't *build* the IDE later —
we *unhide* it.** The editor, file tree, git, debugging, and extension host already ship
in Code-OSS. Phase 1 promotes the terminal to the hero and dials the IDE chrome down;
later phases progressively reveal what was in the box all along. That de-risks the
roadmap enormously.

**What forking obligates us to do:**
- Strip Microsoft branding, trademarks, and telemetry; ship under our own identity.
- Use the **Open VSX** registry, not the Microsoft Marketplace (forks may not use it).
- Accept that Microsoft's proprietary extensions **cannot be shipped** — notably
  Pylance, the C/C++ extension, the .NET debugger, and the **Remote Development pack
  (Remote-SSH, Dev Containers, WSL)**. We plan open replacements where it matters
  (Remote-SSH is the painful one for "replace Cursor").
- Pay the perpetual **rebase tax** against fast-moving upstream; budget ongoing
  engineering for it.

**Distribution:** **macOS only for now** — direct download + notarization. The **stack stays
cross-platform** (we keep all platform abstractions; Windows/Linux are a later CI flip, not a
rewrite). A process-spawning IDE fork is not Mac App Store eligible — this is how every serious
terminal/IDE ships (Tabby, Hyper, Cursor, VSCodium). Detailed step-by-step build, tests, and
success conditions are in [`docs/mvp.md`](docs/mvp.md).

### Why not the alternatives
- **Build on Wave Terminal:** Wave (Electron + Go + React + xterm.js) is a great UX
  reference and proves the status feature, but it's architecturally incompatible with a
  VS Code fork and is terminal-only — a dead end for the IDE endgame. We borrow Wave's
  *design*, not its code.
- **Shell plugin / overlay app:** fragile (scroll-region hacks, window tracking) and
  can't grow into an IDE or host a rich feed/community panel.

## Tech stack

Principle: **mainstream, widely-adopted defaults; staged to the roadmap; don't
over-engineer before there are users.** Scale the hot paths only when load demands it.

### Client (the workspace)
- **Code-OSS fork** — TypeScript + Electron. Cross-platform (macOS, Windows, Linux)
  from one codebase.
- **Terminal:** `xterm.js` (frontend) + `node-pty` (PTY backend; ConPTY on Windows) —
  already in Code-OSS.
- **Status engine:** built on the **OSC 633 / OSC 133 shell integration** Code-OSS
  already emits (command start / end / exit code). This is our differentiator — a
  glanceable per-pane state machine (running / succeeded / failed+code / idle / stale).
- **Feed rail & rich panels:** VS Code **webview** panels hosting **React** for the
  news/ads/presence feed; native workbench contributions for status indicators on
  terminal tabs.

### Backend (the network)
One backend language (**Go**) and one managed data/auth/realtime layer (**Supabase**) —
kept deliberately simple.

- **Custom services:** **Go** — a single backend language for everything custom: ads
  serving, the rev-share ledger, fraud checks, and news/feed ingestion.
- **Data + auth + realtime + storage:** **Supabase** — collapses several pieces into one
  managed layer:
  - **Postgres** — system of record (accounts, messages, ledger).
  - **Auth** — GitHub OAuth (perfect for developers).
  - **Realtime** — Presence (opt-in "who's working") and Broadcast (live chat).
  - **Storage** — files/assets.
- **Realtime chat:** **Supabase Realtime** to start — **Broadcast** for live delivery +
  a Postgres `messages` table for history + **Presence** for online status. No separate
  chat vendor until chat is proven the moat. Escalate only at scale: **Stream** (managed,
  buy) or **Centrifugo** (Go, self-host).
- **Payments / payouts:** **Stripe Connect** — the standard for marketplace rev-share
  (handles KYC, tax forms, global payouts).
- **Trust & safety:** managed moderation API + human review for chat; spam/abuse handling.
- **Infra:** Docker; managed PaaS (Fly.io / Railway) for the Go services; Kubernetes on
  AWS/GCP only if scale demands it.

**Net stack:** Code-OSS fork (client) + Go + Supabase + Stripe, plus a moderation API
and a host. One client language, one backend language, one managed data layer.

## Roadmap — single-player first, feed before ads, network last

Each phase has a **move-on criterion**; we don't advance until the prior phase is great.
The **MVP is Phases 0–2** (foundation + cockpit + project-relevant feed). Ads
(Phase 3) are introduced **only after** the feed is genuinely useful.

### Phase 0 — Foundation
- Fork Code-OSS; branded dev build; strip MS branding/telemetry; wire Open VSX.
- CI + signed/notarized build for **macOS only** (stack stays cross-platform; Windows/Linux later).
- **Done when:** a renamed, branded build runs on all targets from CI.

### Phase 1 — Agent Cockpit *(single-player wedge — must be excellent)*
- Promote the terminal to hero; multi-pane **mosaic grid** (Wave as UX reference,
  VS Code split-panes as base), each pane independently focusable / full-screen.
- **Status engine** on OSC 133/633: running / waiting-for-input / done / failed / idle / stale.
- **Never-miss-completion** notifications (reliable, incl. tmux/SSH) + "who needs me first."
- **Done when:** people use it as their daily-driver agent workspace with **zero** network
  features — measured by solo retention / DAU.

### Phase 2 — Project-relevant Intelligence Feed *(no ads yet — nail relevance first)*
- Local, private **project-context extraction** (stack / repo topic — on-device).
- **Content ingestion** (Go) + **relevance ranking** to the user's project.
- **AI-summarized, actionable** nuggets (distribution/business-oriented), not a scroll feed.
- **Status-gated** Feed Rail: shows during dead-time, yields on agent events.
- **Done when:** the feed is *relevant and useful* (low dismiss rate, positive feedback) —
  this is the bar we must clear **before** monetizing.

### Phase 3 — Ads + rev-share *(monetization, after the feed is nailed)*
- Native ad units in the proven feed; ad server + impression/click + attribution + fraud.
- Rev-share ledger + **Stripe Connect** payouts; first hand-sold flat-rate sponsorships.
- **Done when:** payouts work end-to-end and ads don't degrade feed quality / retention.

### Phase 4 — Presence *(opt-in, abstracted)*
- **Opt-in, off by default.** "Founders building now / like you," abstracted activity
  ("Rust / web project") — **never** repo names, file paths, or code.
- Granular privacy controls; enterprise-safe by design. **Supabase Realtime Presence**.
- **Done when:** healthy opt-in rate, value at low density, zero privacy backlash.

### Phase 5 — Peer Network *(the moat)*
- Confidential **cohorts** of similar-stage founders + **anonymized benchmarking**
  (CAC/retention/ARR percentiles). Optional live exchange (Supabase Realtime Broadcast +
  Postgres history) with trust & safety (moderation, spam, abuse).
- **Done when:** network density measurably lifts retention (network effect kicks in).

### Phase 6 — IDE expansion + media partnerships + data product
- Progressively unhide the IDE (editor, git, debug, extensions) already in the fork.
- **Media partnerships:** publisher syndication, sponsored/native content in the feed.
- **Aggregate data product** (high-margin): anonymized founder/tooling trends. **Only** with
  an airtight privacy model.

## Monetization

**Sequencing matters: we nail the project-relevant feed first, then monetize it.** Ads
are introduced only once the feed is demonstrably useful, so we never poison relevance
for revenue.

1. **Ads with 50% rev-share** *(after the feed is nailed)* — native units in the proven
   feed. Flat sponsorships first (per-user CPMs are small; scale matters), CPM/CPC later.
2. **Media partnerships** — tech publishers syndicate content; sponsored native placements.
3. **Aggregate data product** — privacy-gated founder/tooling-trend data (Bloomberg-style),
   sellable to tooling companies and investors.

## Trust principles (non-negotiable)

The product lives or dies on developer trust. The 2019 `npm install funding` ads were
banned because they were *involuntary*; ours are opt-in and pay the user. Protect that.

- **Presence is opt-in and off by default**, and always **abstracted** — never code,
  repo names, or file paths. Get this wrong once and we're branded spyware and
  enterprise-banned.
- **Curate advertisers ruthlessly** — dev-relevant, no creepy retargeting or tracking
  pixels.
- **Privacy as a feature** — no collection of command content or keystrokes. Say so
  loudly. This is also the precondition for the data product.
- **Tasteful, dismissible feed** — ads are the price of free + payout, never a dark
  pattern.

## Competitive landscape

- **Bloomberg Terminal** — the model: utility + closed network = lock-in.
- **Agent cockpits** (cmux, Superset, Pane, aTerm, Yaw, Termdock, Claude Squad) — already
  do live agent status; mostly **macOS-only wrappers**. They expose dead-time; **none turn
  it into intelligence or a network.** Status is table stakes; this is our parity layer.
- **Info feeds** (Hacker News, daily.dev, TLDR) — popularity ≠ relevance, doomscroll,
  non-actionable. We rank to *your project* and summarize into action.
- **Founder intelligence** (OpenBB, FounderNest) — market/competitive data in isolation;
  no link to the founder's own workflow, no confidential peer benchmarking.
- **Builder communities** (Indie Hackers, WIP, build-in-public) — community ≠ collaboration;
  performative; isolation persists. We do confidential, productivity-framed connection.
- **Cursor / Windsurf** — VS Code forks (Cursor ~$2B ARR proves the playbook), but solo
  tools with no intelligence or network layer.
- Note: "Ads CLI" tools (Meta Ads CLI, Adscriptly) are unrelated — they *manage* ad
  campaigns from the terminal; they don't *show* ads in it.

## Key risks (eyes open)

- **Status commoditization** — agent monitoring is crowding fast; we differentiate on
  intelligence + network, not monitoring.
- **Feed relevance** — if the rail is noise, the whole thesis fails; relevance *is* the
  product, which is why we nail it before ads.
- **Presence/benchmarking privacy** — the make-or-break trust landmine (mitigated: opt-in
  + abstracted + confidential).
- **Cold start** — mitigated by single-player-first value (cockpit + feed).
- **Marketplace gap** — can't ship MS-proprietary extensions; need open replacements.
- **Fork maintenance** — perpetual rebase tax against upstream.

## Status

Planning. No application code yet — this README is the trace of the vision and
architecture decisions to date.
