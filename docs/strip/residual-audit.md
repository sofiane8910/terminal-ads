# Residual VS Code / Microsoft surface audit (Haiku swarm, 10 facets)

Read-only audit of `app/` for residual user-facing VS Code/Microsoft branding, onboarding, walkthroughs,
release notes, help links, surveys, and MS URLs. **293 findings, 239 user-visible.** Raw output was a
workflow result (transcript: `wf_2b2a276c-a8e`). This file is the synthesis + action plan for review.

## Findings by category
| category | count |
|---|---|
| branding-string ("VS Code"/"Visual Studio Code" in UI) | 100 |
| ms-url (code.visualstudio.com, aka.ms, microsoft.com, github.com/microsoft) | 79 |
| onboarding-walkthrough | 78 |
| release-notes | 9 |
| telemetry | 8 |
| help-menu-link | 5 |
| feedback-survey | 5 |
| copyright-header (defer — internal, MIT) | 7 |

## Hotspot files (where the findings concentrate)
| file | hits | nature |
|---|---|---|
| `welcomeGettingStarted/common/gettingStartedContent.ts` | 60 | walkthrough copy ("Get started with VS Code", web setup, etc.) |
| `welcomeWalkthrough/browser/editor/vs_code_editor_walkthrough.ts` | 29 | the entire "VS Code editor playground" tutorial |
| `update/browser/releaseNotesEditor.ts` | 14 | code.visualstudio.com release-notes feed + CSP |
| `welcomeOnboarding/browser/onboardingVariationA.ts` | 13 | "Welcome to VS Code" (already neutered: `show()` gated) |
| `update/common/update.config.contribution.ts` | 7 | "fetched from a Microsoft online service" |
| `build/win32/code.iss` | 6 | **Windows installer — not macOS (defer)** |
| `resources/linux/*` (appdata/desktop/rpm/debian) | ~17 | **Linux packaging — not macOS (defer)** |
| `helpActions.ts` | 4 | "VS Code Newsletter", "Ask @vscode" |
| `telemetry/1dsAppender.ts`, `telemetryService.ts` | ~6 | MS OneCollector endpoint + aka.ms link (telemetry already OFF) |
| `assignment/*` | ~4 | A/B experiment service (TAS / "VSCode ExP") |
| `extensions.contribution.ts`, `extensionsActions.ts`, `issueReporter*` | ~8 | "Please reload Visual Studio Code" / issue source fallback |

## The reframe (per fork-trimming policy: hide-by-default, don't gold-plate)
**Do NOT hand-rebrand 239 strings.** ~120+ of them live in onboarding/walkthrough/survey/experiment
subsystems a terminal-native founder cockpit doesn't want at all. Disabling those subsystems removes the
bulk in a handful of contribution-gates, and is on-thesis (we'll build our own cockpit welcome later).

### A. Disable subsystems wholesale (gate imports in `workbench.common.main.ts`) → kills ~120+ findings
- `welcomeGettingStarted` (getting-started + all walkthroughs) — 60+ findings
- `welcomeWalkthrough` (VS Code editor playground tutorial) — 29 findings
- `surveys/nps` + `surveys/languageSurveys` (NPS/feedback cruft) — 5
- `welcomeOnboarding` (already inert; disable fully) — 13
- assignment/experiments service (TAS "VSCode ExP" — privacy + not ours) — investigate-then-disable
- (check welcomeViews/welcomeBanner/welcomeDialog too)

### B. Rebrand the SMALL set in surfaces we KEEP → use `product.nameLong`, ~15 edits
- `extensions.contribution.ts` / `extensionsActions.ts`: "Please reload Visual Studio Code" → `product.nameLong`
- `issueReporterOverlay.ts` / `baseIssueReporterService.ts`: "Visual Studio Code" issue-source fallback
- `helpActions.ts`: "VS Code Newsletter", "Ask @vscode" → rebrand or remove
- `loopbackServer.ts`: OAuth UI app-name check `=== 'Visual Studio Code'`
- `product.json`: onboarding keymap label "VS Code" → "Default" (or keep — it's a keymap *style*)

### C. Neuter MS network endpoints (privacy / no silent MS calls)
- **Auto-update**: likely DISABLE entirely (a fork shouldn't pull MS's update feed) → also kills the
  `releaseNotesEditor.ts` (14) + `update.config.contribution.ts` (7) + `updateUtils.ts` findings.
- `telemetry/1dsAppender.ts` MS OneCollector endpoint — dormant (telemetry OFF, no appender configured);
  low priority, but repoint/blank for cleanliness.
- `aka.ms/vscode-telemetry` settings help link → repoint or drop.

### D. Defer (out of scope now)
- **Windows installer** (`build/win32/code.iss`) + **Linux packaging** (`resources/linux/*`) — macOS-only
  for now; handle at the Windows/Linux CI flip.
- `.build/electron/.../Info.plist` — **generated** from product.json at electron setup; regenerates, not source.
- `copyright-header` (Microsoft copyright in source) — keep (MIT-licensed; legal attribution, not user-facing).

## Decisions needed before editing
1. **Approve "disable subsystems wholesale"** (A) vs rebrand-in-place? (Recommend disable.)
2. **Disable auto-update entirely?** (Recommend yes for now — removes the whole update/release-notes MS surface.)
3. Keep or rename the `product.json` "VS Code" **keymap** label? (It denotes the keybinding *style*, like Vim/Sublime.)
</content>
