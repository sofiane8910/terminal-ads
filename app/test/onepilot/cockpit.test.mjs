/*---------------------------------------------------------------------------------------------
 *  Onepilot Terminal fork — headless acceptance test for the cockpit shell (Step 0 ground-prep).
 *  Hermetic: reads source from disk, never launches the app. Run with:
 *      node --test test/onepilot/
 *  Asserts the blank-canvas defaults (sides empty, top-bar-driven) AND pins the top-bar
 *  invariants so an upstream merge can't silently re-introduce IDE chrome.
 *  See docs/strip/ for the rationale.
 *--------------------------------------------------------------------------------------------*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => readFileSync(join(APP_ROOT, rel), 'utf8');

// Pull the body of a single configuration property block so we assert the property's OWN default,
// not a sibling (e.g. the `agentsWindow` override that carries its own `default`).
function propertyBlock(src, propKey) {
	const start = src.indexOf(propKey);
	assert.ok(start !== -1, `config property "${propKey}" not found`);
	// Grab a bounded window after the key — large enough to include the default + enum (and any
	// multi-line cockpit comment) ahead of the default. Per-test regexes are specific values
	// (e.g. 'top', 'hidden', 'both'), and each test additionally guards against the agentsWindow
	// sibling, so a slightly wide window can't false-match a neighbouring property.
	return src.slice(start, start + 1100);
}

test("cockpit: activity bar is 'top' so the navigator is coupled to the side bar", () => {
	// 'top' renders the view-switcher inside the side bar (shows/hides with it) — empty left edge when
	// collapsed, navigation strip returns when toggled open. NOT 'default' (always-on strip) or 'hidden'
	// (no switcher at all).
	const src = read('src/vs/workbench/browser/workbench.contribution.ts');
	const block = propertyBlock(src, 'LayoutSettings.ACTIVITY_BAR_LOCATION');
	const topIdx = block.search(/'default':\s*'top'/);
	assert.ok(topIdx !== -1, "activity bar location default is not 'top'");
	const agentsIdx = block.indexOf('agentsWindow');
	assert.ok(agentsIdx === -1 || topIdx < agentsIdx, 'matched the agentsWindow sibling, not the top-level default');
});

test('cockpit: secondary side bar is hidden by default', () => {
	const src = read('src/vs/workbench/browser/workbench.contribution.ts');
	const block = propertyBlock(src, 'workbench.secondarySideBar.defaultVisibility');
	assert.match(block, /'default':\s*'hidden'/, "secondary side bar defaultVisibility is not 'hidden'");
});

test('cockpit: primary side bar is hidden on first run', () => {
	const src = read('src/vs/workbench/browser/layout.ts');
	assert.match(src, /SIDEBAR_HIDDEN\.defaultValue\s*=\s*true\s*;/, 'SIDEBAR_HIDDEN.defaultValue is not set to true');
});

test('cockpit: panel stays hidden by default (unchanged upstream default)', () => {
	const src = read('src/vs/workbench/browser/layout.ts');
	// PANEL_HIDDEN RuntimeStateKey ships with defaultValue `true`.
	assert.match(src, /PANEL_HIDDEN:\s*new RuntimeStateKey<boolean>\([^)]*,\s*true\)/, 'panel is no longer hidden by default');
});

test('cockpit: Outline & Timeline are removed from the Explorer', () => {
	assert.match(read('src/vs/base/common/onepilot.ts'), /export const ONEPILOT_HIDE_EXPLORER_EXTRAS\s*=\s*true/, 'ONEPILOT_HIDE_EXPLORER_EXTRAS is not true');
	// Each view registration must sit behind the gate, not run unconditionally.
	for (const rel of [
		'src/vs/workbench/contrib/outline/browser/outline.contribution.ts',
		'src/vs/workbench/contrib/timeline/browser/timeline.contribution.ts',
	]) {
		const src = read(rel);
		assert.match(src, /if\s*\(\s*!ONEPILOT_HIDE_EXPLORER_EXTRAS\s*\)\s*\{[\s\S]*registerViews/, `${rel}: registerViews is not gated by ONEPILOT_HIDE_EXPLORER_EXTRAS`);
	}
});

test('cockpit: Workspace Trust (Restricted Mode) is off by default', () => {
	const src = read('src/vs/workbench/contrib/workspace/browser/workspace.contribution.ts');
	const block = propertyBlock(src, '[WORKSPACE_TRUST_ENABLED]:');
	assert.match(block, /default:\s*false/, 'security.workspace.trust.enabled default is not false');
});

test('cockpit: clean workspace — minimap, breadcrumbs, empty-editor hint off by default', () => {
	const wb = read('src/vs/workbench/browser/workbench.contribution.ts');
	assert.match(propertyBlock(wb, "'workbench.editor.empty.hint':"), /'default':\s*'hidden'/, 'empty-editor hint is not hidden');
	const bc = read('src/vs/workbench/browser/parts/editor/breadcrumbs.ts');
	assert.match(propertyBlock(bc, "'breadcrumbs.enabled':"), /default:\s*false/, 'breadcrumbs default is not false');
	const eo = read('src/vs/editor/common/config/editorOptions.ts');
	assert.match(propertyBlock(eo, 'const defaults: EditorMinimapOptions'), /enabled:\s*false/, 'minimap default is not false');
});

// --- Top-bar regression guards: the blank canvas is only usable if the title bar keeps hosting
// the Command Center + the layout toggle icons. Pin these so a merge can't flip them. ---

test('cockpit: layout control toggles render in the title bar', () => {
	const src = read('src/vs/workbench/browser/workbench.contribution.ts');
	assert.match(propertyBlock(src, 'workbench.layoutControl.type'), /'default':\s*'both'/, "layoutControl.type default is not 'both'");
	// LAYOUT_ACTIONS (workbench.layoutControl.enabled) must stay on.
	assert.match(propertyBlock(src, 'LayoutSettings.LAYOUT_ACTIONS'), /'default':\s*true/, 'layoutControl.enabled default is not true');
});

test('cockpit: command center (search box) is on by default', () => {
	const src = read('src/vs/workbench/browser/workbench.contribution.ts');
	assert.match(propertyBlock(src, 'LayoutSettings.COMMAND_CENTER'), /default:\s*true/, 'window.commandCenter default is not true');
});

test('cockpit: custom title bar hosts the top bar on macOS', () => {
	const src = read('src/vs/workbench/electron-browser/desktop.contribution.ts');
	assert.match(propertyBlock(src, 'window.titleBarStyle'), /'default':\s*'custom'/, "window.titleBarStyle default is not 'custom'");
});

// --- Keybindings are the secondary (shortcut) path the user migrates toward. Assert they survive. ---

test('cockpit: side-part toggle keybindings are present', () => {
	assert.match(read('src/vs/workbench/browser/actions/layoutActions.ts'), /KeyMod\.CtrlCmd\s*\|\s*KeyCode\.KeyB/, 'toggleSidebarVisibility lost Cmd+B');
	assert.match(read('src/vs/workbench/browser/parts/panel/panelActions.ts'), /KeyMod\.CtrlCmd\s*\|\s*KeyCode\.KeyJ/, 'togglePanel lost Cmd+J');
	assert.match(read('src/vs/workbench/browser/parts/auxiliarybar/auxiliaryBarActions.ts'), /KeyMod\.CtrlCmd\s*\|\s*KeyMod\.Alt\s*\|\s*KeyCode\.KeyB/, 'toggleAuxiliaryBar lost Cmd+Alt+B');
});
