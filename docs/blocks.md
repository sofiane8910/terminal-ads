# Workspace Blocks & Integrations

The cockpit is a full-screen, Wave-style **mosaic grid**. Terminals are one block type;
this doc defines the others. Guiding rule from research: **a solo founder's constraint is
attention, not information** — so the grid is sparse by default, every block earns its slot
by serving one of three jobs (**Ship / Grow / Know**), and density is opt-in. We don't ship
60 widgets; we ship a tight core plus connect-once integrations, and make blocks extensible
(Code-OSS extension/webview model) so the catalog can grow without us building every one.

> No AI-chat block: the target user already runs Claude Code / Codex in the panes — the
> agents *are* the AI layer.

---

## Core blocks (MVP) — 6

Each is justified by a real, cited developer/founder struggle.

- **Terminal + agent runner** *(Ship)* — the core surface. Running several AI agents at once
  is genuinely chaotic; the literal HN thread is *"Is anyone else drowning in terminal tabs
  running AI coding agents?"* ([HN](https://news.ycombinator.com/item?id=47268777))
- **Agent status & "who needs me first"** *(Ship)* — no glanceable way to tell a *running*
  command from a *finished* one or one *waiting for input*, so people miss completions; even
  Warp has this as an open request. ([Warp #6668](https://github.com/warpdotdev/warp/issues/6668))
- **Project-relevant intelligence feed** *(Know)* — distribution is solo founders' **#1
  cited weakness** (beat money and skills in a 20k-post analysis), yet generic feeds drown
  them (80% of workers report information overload). Relevance, not a firehose.
  ([Indie Hackers](https://www.indiehackers.com/post/i-analyzed-over-20k-posts-from-solo-founders-the-1-complaint-wasnt-money-or-skills-36bee8bff4),
  [HN newsletter fatigue](https://news.ycombinator.com/item?id=45003126))
- **File / diff preview** *(Ship)* — leaving the terminal to open a file or output is a
  micro-switch, and it takes ~23 min to refocus after an interruption; inline preview keeps
  flow. ([context-switching](https://dev.to/akshaykurve/how-context-switching-destroys-developer-productivity-394f))
- **Logs / process monitor** *(Ship)* — devs spin up "a dozen terminal instances" for
  background services and lose track of which runs on which port.
  ([dev-server/port management](https://uxdev.org/blog/demystifying-local-dev-servers-how-to-run-in-the-background-and-master-port-management))
- **Tasks / priorities** *(Grow)* — solo founders drown in to-dos and don't know where to
  start; *"a long list of priorities brings dread."*
  ([Indie Hackers](https://www.indiehackers.com/post/as-a-solo-founder-how-do-you-manage-where-to-focus-your-time-83a731a2f2))

---

## Business integration pack — connect-once, what solo founders actually run

Read-only, scoped panels — surfaced during agent dead-time so the founder manages the
business *without leaving the build*. Indie-default is primary; the heavier-but-popular
mainstream alternative is noted. We support 1–3 tools per slot since founders are split
across them; the user connects whichever they already have.

| Slot (Job) | Tools (auth) | Panel shows | Why / source |
|---|---|---|---|
| **Payments / revenue** *(Grow)* | **Stripe** (API key) · Lemon Squeezy / Polar for MoR sellers | MRR, churn, payouts → runway | Cash-blindness is the top fear; Stripe dominates US-focused indies. ([Stripe vs LS vs Paddle](https://devtoolpicks.com/blog/lemon-squeezy-vs-stripe-vs-paddle-solo-devs)) |
| **Web analytics** *(Grow)* | **Plausible / Fathom** (API key) · **GA4** (OAuth, heavier) | visitors, top sources, conversions, launch spikes | Distribution is the #1 weakness; Plausible is the indie favorite. ([IH: Plausible](https://www.indiehackers.com/post/from-400-to-22k-mrr-in-one-year-with-plausible-a-google-analytics-alternative-ama-776a4803b7)) |
| **Deploy / hosting** *(Ship)* | **Vercel** (API token) · Railway / Netlify | last deploy status, build pass/fail, prod health | Ship safely while heads-down; Vercel is the indie default. ([indie stack 2026](https://www.tldl.io/resources/indie-hacker-saas-stack-2026)) |
| **Email / audience** *(Grow)* | **Loops** (API key) · Resend (transactional health) · ConvertKit/Kit, Beehiiv (newsletter) | subscriber growth, last campaign open/click | The email list is a solo founder's owned distribution engine. ([indie email stack](https://driplane.app/blog/indie-hacker-email-stack-2026)) |
| **Customer support** *(Grow)* | **Crisp** (API, free tier) · Chatwoot (open-source) · Plain (technical, API-first) | unread conversations, response time, feedback themes | Support quality drives retention; Crisp is the indie go-to. ([solopreneur support tools](https://f3fundit.com/ai-customer-support-for-solopreneurs-intercom-vs-crisp-vs-plain-vs-chatwoot-2026/)) |
| **Product / dev** *(Ship)* | **GitHub** (OAuth — already sign-in) | stars trend, open issues/PRs, CI status, latest release | Product pulse in one glance + never push past a red CI. ([indie stack 2026](https://www.tldl.io/resources/indie-hacker-saas-stack-2026)) |

**Coverage:** money (Stripe) · traffic (Plausible) · shipping (Vercel) · audience (Loops) ·
customers (Crisp) · product (GitHub) — the exact loop a solo founder runs.

**Auth notes:** most are **API key** (Stripe, Plausible, Loops, Crisp, Vercel) — paste once;
**GitHub is OAuth but free** (reuses sign-in); **GA4 is OAuth + heavier setup**, which is why
Plausible/Fathom is the default and GA4 the alternative. All keys stored per-user (Supabase),
**read-only/scoped**, consistent with the privacy stance.

---

## Later blocks (need network density, deeper integration, or build on the above)

- **The Advisor** *(Grow)* — AI that turns *your* metrics + market radar + project into
  "do this next," targeting the business-acumen gap. Builds on the integration panels above.
- **Market / competitive radar** *(Know)* — founders check competitors once at launch and
  miss later pricing/feature/hiring shifts; alert-based.
  ([competitor monitoring](https://www.contify.com/resources/blog/best-competitive-intelligence-tools/))
- **Peer / cohort + benchmarking + chat** *(Know)* — isolation is the #2 founder pain and
  founders lack the benchmarks VCs have; **last**, because it needs network density
  (cold-start). ([building alone is killing your startup](https://www.indiehackers.com/post/bad-news-for-solo-indie-hackers-building-alone-is-killing-your-startup-2901fb8332))

## Cross-cutting patterns (from Bloomberg / command-center research)

- **Modes (saved layouts)** — one keystroke reconfigures the grid: **Build Mode** (terminals
  + agents + logs + editor), **Morning Briefing** (runway + traffic + support + tasks),
  **Fundraising Mode**, **Crisis Mode**. Cheap to build (saved layouts), and it's what makes
  the cockpit *feel* like mission control.
- **Glanceable & status-gated** — color-coded health (green/yellow/red), drill-down on
  demand; Grow/Know panels animate during agent dead-time and yield the instant an agent
  needs you. Sparse default, power on demand.
- **Extensible** — business panels can be third-party/community blocks via the Code-OSS
  extension/webview model (Wave-custom-widget style), so the catalog scales without us
  building every integration.
