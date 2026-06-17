# vendor/ — decoupled source copies

These are **plain source copies**, not forks/submodules. Their `.git` directories were
removed, so there is **no remote, no submodule, and no upstream linkage** of any kind.

> **READ-ONLY — NEVER edit, build, or run anything in `vendor/`.** These exist purely as
> **working references**: proven, runnable solutions to study and copy patterns from. They are
> not our product code. When we fork, copy a tree *out* of `vendor/` into our own working
> directory and modify that — leave `vendor/` pristine.

| Dir | Source | Pinned commit | License | Reference for |
|---|---|---|---|---|
| `code-oss/` | github.com/microsoft/vscode | `5bdc01c016ec24a81cc9859ce30cb0457995a721` | MIT (`code-oss/LICENSE.txt`) | The VS Code stack we fork — workbench, terminal (`xterm.js`/`node-pty`), shell-integration (OSC 633), extension/webview model. |
| `waveterm/` | github.com/wavetermdev/waveterm | `22197d49443b98e4214d07f4519a04f257ff26dc` | Apache-2.0 (`waveterm/LICENSE`) | The block-mosaic grid + running/stale status UX. |

Both clones were shallow (`--depth 1`) at the commits above, captured on 2026-06-17.

**License compliance:** keep each upstream `LICENSE` file in place. MIT and Apache-2.0 both
permit commercial use and modification with attribution; do not delete the license/notice files.
