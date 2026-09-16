---
document_id: PPO-CS01-SOURCES
title: Customer 360 design sources and build
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Maintained sources for the CS-01 Customer 360 design; the issued HTML is generated from them
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# CS-01 Customer 360 — design sources

The issued design at [`docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html`](../../reference/ui/customers/PPO-Customer-360-Workspace-r01.html) is **generated** from the files in this folder. Edit the sources, rebuild, and re-run both checks. Do not hand-edit the generated HTML.

## Files

| File | Bytes | Contents |
|---|---:|---|
| `template.html` | 4,360 | The page shell: head, workspace heading, context row, tab container, content region, three dialogs, toast, and the seven build markers |
| `fonts.css` | 63,656 | Three embedded Roboto `@font-face` blocks, extracted byte-for-byte from the Customers, Sites & Growing Areas r03 workspace. SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef` |
| `workspace.css` | 28,013 | The r20 token block, base elements, the shared choice-card geometry, the workspace shell, and the components this workspace adds |
| `icons.json` | 5,294 | The 57-icon set carried across from r03 |
| `choice.js` | 9,887 | The shared r18/r20 choice card, carried across from r03 unchanged |
| `model.js` | 58,588 | The synthetic data model and its pure helpers. No rendering |
| `workspace.js` | 111,457 | State, scoping, filtering, rendering, snapshots, boundaries, persistence and events |

## Build

```sh
python3 scripts/build-customer-360-design.py
```

The script substitutes seven markers — `FONTS`, `CSS`, `METADATA`, `ICONS`, `CHOICE`, `MODEL`, `APP` — each of which must appear exactly once in the template, and escapes `</script` inside every embedded script. It prints the output path, byte count and SHA-256.

The `design-metadata` block is generated, not written by hand. Its token set is read back out of `workspace.css`'s `:root` block, so the recorded tokens cannot drift from the stylesheet they describe, and the theme hash is computed from the [r20 board](../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r20.html) in the repository at build time.

## Checks

```sh
PPO_DESIGN_JSDOM_MODULE=/absolute/path/to/jsdom/lib/api.js \
  node scripts/check-customer-360-design.mjs --write-evidence

PPO_DESIGN_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.js \
  PPO_DESIGN_CHROMIUM=/absolute/path/to/chrome \
  node scripts/check-customer-360-browser.mjs --write-evidence
```

jsdom and Playwright are optional local tools. Neither is an application dependency, and neither is added to `package.json`. Both scripts accept the module path through an environment variable for that reason. Playwright is published as CommonJS, so the browser script reads its `chromium` export from either the namespace or `default`.

## Rules the sources hold

- The output is one self-contained file. No script, stylesheet, font or image is fetched at runtime, and the checks assert it.
- `null` means unknown throughout `model.js`. It is rendered as *Not supplied* or *Unknown* and never as zero.
- Amounts carry their currency. `totalByCurrency` never merges currencies, and no helper adds different measures together.
- Every string that reaches the DOM passes through `esc()`.
- Every synthetic identity uses a reserved `SYN-` reference.
- The demonstration role switch changes presentation only. It is not a security boundary, and the sources say so where it is offered.
