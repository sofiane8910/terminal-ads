#!/usr/bin/env bash
#
# dev.sh — launch the dev build of our Code-OSS fork.
#
# THE canonical "launch the app" entry point. When asked to launch the app, use this.
# Keep it in sync with the build toolchain (Node version pin, fnm activation, code.sh).
#
# What it does:
#   1. Resolves the app root (this script lives in app/scripts/).
#   2. Activates the pinned Node (app/.nvmrc -> 24.15.0) via fnm, without touching system Node.
#   3. Delegates to scripts/code.sh, which compiles-if-needed and launches Electron.
#
# Any extra args are forwarded to code.sh (e.g. a folder to open).

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

echo "Launching dev build with node $(node -v)…"
exec ./scripts/code.sh "$@"
