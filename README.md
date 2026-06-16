# terminal-ads (working name)

**Bloomberg for developers.** A developer workspace you live in — terminal first,
IDE later — wrapped around a live community layer (presence, chat, a news + ads
feed) that becomes the real moat. Free to use, monetized by ads with **50% revenue
shared back to users**, growing into media partnerships.

This README is the living strategy + architecture doc. It records *why* each major
decision was made, so the trace survives.

---

## The thesis

The terminal/IDE is the **daily utility** that gets people in the door. The
**network** — knowing who's working and on what, talking live to other developers,
a feed of tech news and relevant ads — is what they can't leave.

This is structurally the Bloomberg Terminal: nobody pays ~$32k/year for the *data*;
they stay because **everyone who matters is on the chat network**, and leaving means
cutting yourself off. Terminal UX can be copied in a quarter. A populated developer
network cannot be copied at all. The network is the defensible business.

**Why most developer social networks die — and why this one shouldn't:** they fail
the cold-start problem (empty room → users leave → stays empty). Our defense is
structural: **the single-player experience is genuinely useful with zero other users
online.** A great terminal + status engine + free IDE has standalone value, so early
adopters stay and get value *before* the network exists. Nail single-player first,
layer multiplayer on top. That sequencing is the whole survival strategy.

## What we're building (and what it replaces)

- **Endgame:** a full dev environment that replaces VS Code/Cursor *and* your terminal —
  the one app a developer keeps open all day.
- **On-ramp:** a best-in-class terminal / command center that's worth using on its own.
- **Moat:** an opt-in developer network (presence + live chat) on top.

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

**Distribution:** direct download + notarization (macOS), Microsoft Store / direct
(Windows). A process-spawning IDE fork is not Mac App Store eligible — this is how
every serious terminal/IDE ships (Tabby, Hyper, Cursor, VSCodium).

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

### Backend (the network) — the larger build over time
- **Primary services:** **TypeScript / Node.js (NestJS)** — shares language and types
  with the client, largest talent pool, fast product velocity.
- **Performance-critical services:** **Go** for the real-time gateway, ads/fraud, and
  feed ingestion as they grow hot.
- **Database:** **PostgreSQL** (system of record) + **Redis** (presence/ephemeral state,
  pub/sub, rate limiting).
- **Real-time (presence + chat):** start with a **managed service (Ably or Pusher)** to
  validate fast; migrate to self-hosted **Centrifugo** (Go) — or **Phoenix Channels**
  (Elixir) if we want best-in-class presence — when scale/economics demand. WebSockets
  throughout.
- **Auth/identity:** **GitHub OAuth** (perfect for developers) via a managed provider
  (Clerk / WorkOS / Auth0) early; self-host (Ory) later if needed.
- **Ads server:** own service — serves sponsor inventory, logs impressions/clicks,
  handles attribution and fraud checks, and feeds the rev-share ledger.
- **Payments / payouts:** **Stripe Connect** — the standard for marketplace rev-share
  (handles KYC, tax forms, global payouts).
- **Feed/news:** ingestion service (RSS/APIs: Hacker News, etc. + editorial / media-
  partner content), ranked and served via API.
- **Trust & safety:** moderation pipeline (managed moderation API + human review) for
  chat; spam/abuse handling; reporting.
- **Infra:** Docker; managed platform early (Fly.io / Railway / Render), Kubernetes on
  AWS/GCP at scale; CDN for assets. Privacy-respecting, opt-in analytics (PostHog).

## Roadmap — single-player first, then the network ladder

Each phase has a **move-on criterion**; we don't advance until the prior phase is great.

### Phase 0 — Foundation
- Fork Code-OSS; branded dev build; strip MS branding/telemetry; wire Open VSX.
- CI + signed/notarized builds for macOS + Windows (+ Linux).
- **Done when:** a renamed, branded build runs on all targets from CI.

### Phase 1 — Single-player core *(the wedge — must be excellent)*
- Promote the terminal to hero; multi-pane **mosaic grid** (Wave as UX reference,
  VS Code split-panes as base), each pane independently focusable / full-screen.
- **Status engine** on OSC 633: glanceable running / ok / failed+code / idle / stale.
- Completion & failure notifications ("build finished", "agent 3 needs input").
- Relentless polish on speed and feel.
- **Done when:** people use it as their daily-driver terminal with **zero** network
  features — measured by solo retention / DAU.

### Phase 2 — Feed rail *(one-way monetization, still no social)*
- Feed panel: curated tech news + tasteful native ads.
- Ads server + impression/click + attribution + basic fraud detection.
- Accounts (GitHub OAuth) + rev-share ledger + Stripe Connect payouts.
- First hand-sold flat-rate sponsorships.
- **Done when:** payout pipeline works end-to-end and users *like* the feed
  (not just tolerate it); positive revenue per active user.

### Phase 3 — Presence *(opt-in, abstracted)*
- **Opt-in, off by default.** "N developers building now," abstracted activity
  ("Rust / web project") — **never** repo names, file paths, or code.
- Granular privacy controls; enterprise-safe by design.
- Real-time infra goes live (managed → self-hosted).
- **Done when:** healthy opt-in rate, presence adds value even at low density,
  and zero privacy backlash.

### Phase 4 — Live exchange *(the moat)*
- Live chat: global / topical / rooms; quick exchange with people working live.
- Trust & safety at scale: moderation, spam, abuse, reporting.
- **Done when:** chat density measurably lifts retention (network effect kicks in).

### Phase 5 — IDE expansion + media partnerships + data product
- Progressively unhide the IDE (editor, git, debug, extensions) already in the fork.
- **Media partnerships:** publisher syndication, sponsored/native content in the feed.
- **Aggregate data product** (high-margin, long-term): anonymized trends — what
  languages/tools/frameworks developers are adopting in real time. **Only** with an
  airtight privacy model.

## Monetization

1. **Ads with 50% rev-share** — the feed; launch revenue. Flat sponsorships first
   (per-user CPMs are small; scale matters), CPM/CPC later.
2. **Media partnerships** — tech publishers syndicate content; sponsored native
   placements.
3. **Aggregate data product** — privacy-gated developer-trend data (Bloomberg-style),
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
- **Replit** — closest "social coding" analog (community + multiplayer), but browser-
  first, not the terminal/IDE you live in, and not ad/media monetized.
- **Cursor / Windsurf** — VS Code forks (Cursor ~$2B ARR proves the playbook), but
  solo tools with no community layer.
- **Warp / Wave / Tabby / Zellij** — strong terminal UX references; none combine a
  workspace with a developer network + ad/media monetization.
- Note: "Ads CLI" tools (Meta Ads CLI, Adscriptly) are unrelated — they *manage* ad
  campaigns from the terminal; they don't *show* ads in it.

## Key risks (eyes open)

- **Presence privacy** — the make-or-break trust landmine (mitigated: opt-in + abstracted).
- **Cold start** — mitigated by single-player-first value.
- **Marketplace gap** — can't ship MS-proprietary extensions; need open replacements.
- **Platform scope** — we're building a network backend + trust & safety, not just a
  client (the fork is ~30% of the work).
- **Fork maintenance** — perpetual rebase tax against upstream.

## Status

Planning. No application code yet — this README is the trace of the vision and
architecture decisions to date.
