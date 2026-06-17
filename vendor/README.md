# vendor/ — decoupled source copies

These are **plain source copies**, not forks/submodules. Their `.git` directories were
removed, so there is **no remote, no submodule, and no upstream linkage** of any kind. We own
these trees and modify them freely.

| Dir | Source | Pinned commit | License | Role |
|---|---|---|---|---|
| `code-oss/` | github.com/microsoft/vscode | `5bdc01c016ec24a81cc9859ce30cb0457995a721` | MIT (`code-oss/LICENSE.txt`) | **Fork base** — the app we build on (rebrand, strip MS bits, wire Open VSX). |
| `waveterm/` | github.com/wavetermdev/waveterm | `22197d49443b98e4214d07f4519a04f257ff26dc` | Apache-2.0 (`waveterm/LICENSE`) | **UX/design reference** — block mosaic + running/stale status. Reference, not a dependency. |

Both clones were shallow (`--depth 1`) at the commits above, captured on 2026-06-17.

**License compliance:** keep each upstream `LICENSE` file in place. MIT and Apache-2.0 both
permit commercial use and modification with attribution; do not delete the license/notice files.
