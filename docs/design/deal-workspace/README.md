---
document_id: PPO-DEAL-WORKSPACE-SOURCES
title: Deal Workspace design sources and build
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Maintained source; standalone design only
---

# Deal Workspace source package

CR-01 extends the existing opportunity detail scope within Sales. The generated [r01 HTML](../../reference/ui/crm/PPO-Deal-Workspace-r01.html) and [detailed companion](../../reference/ui/crm/PPO-Deal-Workspace-Report-r01.md) are the review deliverables.

Run from the repository root:

    python3 scripts/build-deal-workspace.py
    node scripts/check-deal-workspace-model.mjs
    node scripts/check-deal-workspace-browser.mjs

The browser check uses the repository's existing Playwright/Chromium pins after npm ci and npm run browser:install. The dedicated workflow retains native captures and a SHA-256 manifest.

The source deliberately separates synthetic fixtures, copied-state commands, presentation, styles and retained shared assets. The compact Board/List and detail use one model. No network or persistent browser storage is used by the HTML.

Source checkpoint: main aa94dcdcb1dd08798be240325857c3d32d04af02. The user's Deals r36 and build report supply the detailed direction; the r20 record layout, Customer 360 font/icon assets and current CRM outcome/transfer contracts supply the reuse boundary. Exact source hashes are embedded by the deterministic builder.

[Design and receiving handover](../../decisions/deal-workspace-design.md) · [Verification](../../testing/evidence/deal-workspace-r01/README.md)
