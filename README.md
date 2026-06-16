# terminal-ads

A developer terminal that pays you back. We ship a genuinely good, free terminal
emulator; the price of "free" is one tasteful sponsor line pinned to the top — and
we share **50% of ad revenue** with the people who use it.

This README captures the **Path B** plan decided during early research. It is a
living strategy doc, not final spec.

---

## TL;DR

- **Model:** Direct-sold ads (we recruit advertisers ourselves — no AdSense/programmatic),
  shown as a **single rotating banner line pinned to the top** of the terminal.
- **Revenue share:** **50% to users**, accounted by verified active usage.
- **Surface:** We **build our own terminal app** (we don't modify Apple's Terminal),
  starting on **macOS (Mac App Store)**, then **Windows**.

## Why Path B (own the terminal) instead of an overlay or shell plugin

We evaluated three ways to get a banner in front of users and chose to **own the terminal**.

| Approach | Verdict |
|---|---|
| **Shell plugin** (DECSTBM scroll-region banner in any terminal) | Rejected as primary. Breaks on full-screen apps (vim/less/htop/tmux), `clear`, and window resize. Fragile, easy to rage-uninstall. |
| **Overlay app** (banner floats over Apple's Terminal / iTerm / Windows Terminal) | Rejected on macOS. Tracking another app's window needs the **Accessibility API**, and Apple forbids sandboxing "an app that controls another app" — so it **cannot ship on the Mac App Store**, only as a notarized direct download. Also fragile (window move/resize/fullscreen/multi-monitor). Viable on Windows later as a secondary surface. |
| **Own terminal app** (banner built in) ✅ | **Chosen.** Bulletproof banner (it's our own UI view, no hacks). App Store eligible. Accounts + payments built in — exactly what the 50% rev-share needs. Proven stack: [SwiftTerm](https://github.com/migueldeicaza/SwiftTerm) already ships in App Store terminals (Secure Shellfish, La Terminal, CodeEdit). |

**Main risk:** switching-terminal friction. Mitigation: make the terminal genuinely
good, fast, and free. Warp proved developers will switch for a better experience.

## MVP scope

A minimal macOS app (SwiftUI/AppKit + SwiftTerm):

1. `SwiftTerm` `TerminalView` filling the window — a working terminal.
2. A fixed **banner bar pinned above it**, rotating sponsors on a timer.
3. Sponsors pulled from a small **ad-server** JSON endpoint; impressions logged back.
4. **Clickable banner** opening the sponsor URL — clean attribution (a real UI click,
   not OSC 8 guesswork).

Goal: demoable to a prospective advertiser within days, and the foundation for the
account/payout system.

## Business model notes

- **Pricing:** Sell **flat weekly/monthly sponsorships** first (the Carbon Ads
  playbook), not CPM/CPC. Per-user revenue is small (premium dev CPM is ~$0.50–$1.10),
  so the model only produces meaningful payouts **at scale** — design for that.
- **Attribution:** Define what an "impression" means for an always-on banner up front;
  prefer real UI clicks for click attribution.
- **Payouts:** 50% pool split by **verified active-hours**, with a low monthly
  threshold and **server-side fraud/anti-farming** checks (paying users for
  self-reported impressions invites abuse).

## Trust principles (non-negotiable)

The 2019 `npm install funding` experiment was banned because ads were **involuntary**.
Ours is opt-in and pays the user — protect that distinction:

- 100% opt-in; the terminal is fully usable, ads are the trade for free + payout.
- **Curate advertisers ruthlessly** (dev-relevant, no creepy retargeting/tracking pixels).
- **Privacy as a feature:** no collection of command content or keystrokes. Say so loudly.

## Competitive landscape

- **Carbon Ads / BuySellAds / EthicalAds** — own the direct-sold dev-audience ad market,
  but **web-only**. None are in the terminal. That's our open lane.
- **Sponsor lines in OSS CLIs** (Vue CLI, Vite, `npm fund`) — precedent that devs
  tolerate a tasteful sponsor mention; nobody has turned it into a cross-tool network
  with rev-share.
- Note: "Ads CLI" tools (Meta Ads CLI, Adscriptly) are the opposite of us — they
  *manage* ad campaigns from the terminal; they don't *show* ads in it.

## Status

Planning. No application code yet — this README is the trace of the Path B decision.

## Roadmap (rough)

- [ ] macOS terminal MVP (SwiftTerm + banner view)
- [ ] Mock ad-server (rotating sponsors JSON + impression logging)
- [ ] Accounts + verified active-hours tracking
- [ ] Payout pipeline (50% pool) + fraud checks
- [ ] First hand-sold sponsorships
- [ ] Windows surface (own terminal and/or overlay)
