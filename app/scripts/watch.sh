#!/usr/bin/env bash
#
# watch.sh — keep the fork's sources compiling live, so code changes are picked up
# without a manual rebuild.
#
# THE canonical "develop with live changes" entry point. Start this once in its own
# terminal and leave it running; it recompiles changed TypeScript to out/ on every save
# (~1s incremental). Then launch the app with dev.sh in a second terminal.
#
# The loop:
#   1. Terminal A:  ./scripts/watch.sh      # leave running — recompiles on save
#   2. Terminal B:  ./scripts/dev.sh        # launch the app
#   3. Edit code → save → press Cmd+R in the app (Reload Window) to see UI changes.
#      (Main-process / Electron-entry changes need a full restart of dev.sh.)
#
# Keep this in sync with the build toolchain (Node pin, fnm activation) — same prelude
# as dev.sh. It must always be the one correct way to start the watchers.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$APP_ROOT"

# --- Activate the pinned Node via fnm (build requires the major version in .nvmrc) ---
FNM_BIN="$(command -v fnm || true)"
if [ -z "$FNM_BIN" ] && [ -x /opt/homebrew/bin/fnm ]; then
	FNM_BIN=/opt/homebrew/bin/fnm
fi

if [ -n "$FNM_BIN" ]; then
	export FNM_DIR="${FNM_DIR:-$HOME/.fnm}"
	eval "$("$FNM_BIN" env --shell bash)"
	# Installs the .nvmrc version on first run, then switches to it.
	"$FNM_BIN" install >/dev/null 2>&1 || true
	"$FNM_BIN" use >/dev/null 2>&1 || true
else
	echo "warning: fnm not found; falling back to system node ($(node -v 2>/dev/null || echo 'none'))." >&2
	echo "         the build pins Node $(cat .nvmrc 2>/dev/null). Install fnm: brew install fnm" >&2
fi

echo "Watching sources with node $(node -v)… (first build takes ~1 min; leave this running)"
echo "Edit code → save → press Cmd+R in the app to see UI changes."
# npm run watch = transpile + client + extensions watchers, in parallel, with prefixed logs.
exec npm run watch
