/*---------------------------------------------------------------------------------------------
 *  Onepilot Terminal fork — headless acceptance test for MVP Step 0.2 (rebrand & AI strip).
 *  Hermetic: reads source/config from disk, never launches the app. Run with:
 *      node --test test/onepilot/
 *  See docs/strip/ for the rationale and the full surface map.
 *--------------------------------------------------------------------------------------------*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => readFileSync(join(APP_ROOT, rel), 'utf8');
const product = JSON.parse(read('product.json'));

// Substrings that must never appear in our product identity (case-insensitive).
const FORBIDDEN = ['microsoft', 'visual studio code', 'code - oss', 'vscode-oss', 'code-oss', 'com.visualstudio'];

// Identity / URL fields that define our brand. (Deliberately NOT the whole file: builtInExtensions
// legitimately names "Microsoft" as the publisher of bundled MIT extensions like js-debug, and the
// webview CDN template is infra deferred to Step 0.4 — both are out of scope for the identity scan.)
const IDENTITY_FIELDS = [
	'nameShort', 'nameLong', 'applicationName', 'dataFolderName', 'sharedDataFolderName',
	'win32MutexName', 'serverApplicationName', 'serverDataFolderName', 'tunnelApplicationName',
	'win32DirName', 'win32NameVersion', 'win32RegValueName', 'win32AppUserModelId',
	'win32ShellNameShort', 'win32TunnelServiceMutex', 'win32TunnelMutex', 'darwinBundleIdentifier',
	'linuxIconName', 'urlProtocol', 'reportIssueUrl', 'licenseUrl', 'serverLicenseUrl',
];

test('brand: identity fields carry no Microsoft / Code-OSS trademarks', () => {
	for (const field of IDENTITY_FIELDS) {
		const value = String(product[field] ?? '').toLowerCase();
		for (const bad of FORBIDDEN) {
			assert.ok(!value.includes(bad), `product.json "${field}" ("${product[field]}") contains forbidden brand substring "${bad}"`);
		}
	}
});

test('brand: identity reflects Onepilot Terminal', () => {
	assert.equal(product.nameLong, 'Onepilot Terminal');
	assert.equal(product.applicationName, 'onepilot-terminal');
	assert.equal(product.darwinBundleIdentifier, 'com.onepilot.terminal');
});

test('ai-strip: Copilot / AI chat product wiring is absent', () => {
	for (const key of ['defaultChatAgent', 'trustedExtensionAuthAccess', 'voiceWsUrl']) {
		assert.equal(product[key], undefined, `product.json still defines AI key "${key}"`);
	}
});

test('ai-strip: built-in auto-update list has no Copilot/chat (kept as [] — core iterates it)', () => {
	// NOTE: this key is typed non-optional and is iterated without a guard in the extensions scanner,
	// so it must stay present. We keep it EMPTY rather than remove it. See docs/strip (0.2.b correction).
	const list = product.builtInExtensionsEnabledWithAutoUpdates ?? [];
	assert.ok(Array.isArray(list), 'builtInExtensionsEnabledWithAutoUpdates must be an array');
	assert.ok(!JSON.stringify(list).toLowerCase().includes('copilot'), 'auto-update list still references Copilot');
});

test('marketplace: extension gallery is Open VSX, not the Microsoft marketplace', () => {
	const gallery = product.extensionsGallery;
	assert.ok(gallery && gallery.serviceUrl, 'no extensionsGallery configured');
	const host = new URL(gallery.serviceUrl).host;
	assert.equal(host, 'open-vsx.org', `gallery serviceUrl host is "${host}", expected open-vsx.org`);
	const blob = JSON.stringify(gallery).toLowerCase();
	assert.ok(!blob.includes('marketplace.visualstudio.com'), 'extensionsGallery still references the Microsoft marketplace');
	assert.ok(!blob.includes('vscode-cdn'), 'extensionsGallery references Microsoft CDN');
});

test('telemetry: no Microsoft telemetry endpoints ship in product.json', () => {
	for (const key of ['aiConfig', 'aiKey', 'applicationInsightsId', 'msftInternalDomains']) {
		assert.equal(product[key], undefined, `product.json defines telemetry endpoint key "${key}"`);
	}
});

test('telemetry: default level is OFF', () => {
	const src = read('src/vs/platform/telemetry/common/telemetryService.ts');
	assert.match(src, /'default':\s*TelemetryConfiguration\.OFF/, 'telemetry default level is not OFF');
});

test('ai-strip: master flag ONEPILOT_HIDE_AI is enabled', () => {
	const src = read('src/vs/base/common/onepilot.ts');
	assert.match(src, /export const ONEPILOT_HIDE_AI\s*=\s*true/, 'ONEPILOT_HIDE_AI is not true');
});

test('build: the Copilot extension is removed from the tree', () => {
	assert.ok(!existsSync(join(APP_ROOT, 'extensions', 'copilot')), 'extensions/copilot still exists');
});

test('build: no compile-copilot wiring remains in npm scripts', () => {
	const pkg = JSON.parse(read('package.json'));
	const scripts = JSON.stringify(pkg.scripts ?? {});
	assert.ok(!scripts.includes('compile-copilot'), 'package.json still references compile-copilot');
	assert.ok(!scripts.includes('watch-copilot'), 'package.json still references watch-copilot');
});
