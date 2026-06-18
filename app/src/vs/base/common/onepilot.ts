/*---------------------------------------------------------------------------------------------
 *  Onepilot Terminal fork — feature flags for stripping built-in AI / Copilot surfaces.
 *  Lives in base/common so every layer (editor, workbench, electron-main) can import it.
 *  See docs/strip/ for the rationale and the full AI surface map.
 *--------------------------------------------------------------------------------------------*/

/**
 * When `true`, the built-in AI / Copilot experience is hidden across the product: the chat
 * panel, the status-bar chat entry, inline chat, terminal chat, the AI code-action auto-fix,
 * the SCM "Generate Commit Message" action, the agent-sessions window/host, and the
 * MCP / Agents-Voice / Image-Carousel UI.
 *
 * Only *visible UI* and *auto-spawns* are gated — chat *services* stay registered so dependency
 * injection is unaffected (the gated UI becomes unreachable dead code). Flip to `false` to
 * restore upstream behaviour. The product user already runs AI agents in the terminal panes,
 * so there is no built-in AI-chat block (see README / docs/strip).
 */
export const ONEPILOT_HIDE_AI = true;

/**
 * When `true`, VS Code's built-in onboarding cruft is suppressed: the getting-started/welcome page does
 * not auto-open and the built-in VS Code walkthroughs ("Get started with VS Code", editor playground,
 * etc.) are not registered. The `IWalkthroughsService` itself stays registered (extensions / remote
 * still use it). Separable from {@link ONEPILOT_HIDE_AI} — a founder cockpit gets its own welcome later.
 * See docs/strip/residual-audit.md.
 */
export const ONEPILOT_HIDE_ONBOARDING = true;

/**
 * When `true`, the Explorer's secondary "IDE" views — **Outline** and **Timeline** — are not
 * registered into the file Explorer container, so they stop appearing as collapsible sections at
 * the bottom of the Explorer. Only the *view registrations* are gated; the Outline/Timeline
 * services, configuration, commands and menus stay registered (DI + any extension that opens them
 * are unaffected). Part of the cockpit blank-canvas shell (see docs/strip/). Flip to `false` to
 * restore the upstream Explorer.
 */
export const ONEPILOT_HIDE_EXPLORER_EXTRAS = true;
