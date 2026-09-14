---
document_id: PPO-009-MOCKUP-RETIREMENT
revision: r01
---
# Retirement of the original CRM capture gallery

**Date:** 15 September 2026 (Brisbane) · **Owner:** Dean Fiedler · **Scope:** [PR #188](https://github.com/deanrfiedler-gif/powerplants-one/pull/188); duplicate [#189](https://github.com/deanrfiedler-gif/powerplants-one/pull/189). Related design: PPO-009 / BP-03 C02. No requirement or acceptance status changes.

## Decision and authority

Dean identified the two failed document-deletion PRs as removal of documents no longer required and asked for their repair. This authorises the specific 11-file cleanup below and supersedes the earlier automated scope hold on these PRs. Both original PR commits have identical trees; #188 carries the complete repair and #189 is to be closed as a duplicate. This grants no wider document-retention, access-control, deployment or integration changes.

Remove `docs/blueprints/crm-ui-mockups/` from the working tree. Its original bytes remain in reachable Git history at `dcabfec1b5cde1c2cf220359e6cf1c63408512d6`, an ancestor of the deletion commits and current `main` when inspected. Do not rewrite that history. Files in `docs/reference/`, the application, brand logo, current Board/Grid HTML, seven-screen wireframe and runtime assurance stay intact.

## Current references and checks

- Current navigation points to [the retained Board/Grid preview](../blueprints/crm-board-grid-mockup.html). Historical capture, state, review and provenance links resolve to the fixed commit above; they do not imply current design or runtime acceptance.
- The [active design manifest](../blueprints/crm-ui-design-manifest.json) carries the unchanged logo and interactive-export hashes plus private brand-PDF provenance from the original manifest. Verification still rejects changed HTML, altered logo bytes or a changed embedded logo. It also records the active manifest hash in each run's evidence.
- Both CRM design scripts remain in the existing workflow. Board/Grid filters, search, sorting, creation, recovery, keyboard, responsive, enlarged-text, no-network and no-storage checks remain. The seven-screen wireframe still checks seven states at three widths (147 combinations).
- Only the integrity checks for deleted gallery assets and the count/capture of its eight static branded examples are retired. The static saving/uncertain-save illustrations are available historically; their removal is not evidence of runtime coverage. Existing application state and permission checks are unchanged.
- The original failures were 16 broken documentation links and an `ENOENT` for the deleted manifest. Rerunning the original deletions could not repair them. No assurance workflow or branch requirement is disabled.

## Historical file inventory and recovery

These 11 originals total 1,860,893 bytes. Every link below is fixed to the verified source commit; Git blob IDs identify the original content.

| Historical file | Bytes | Git blob |
|---|---:|---|
| [README.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/README.md) | 3,052 | `05e5cbcf1c8409d8214a825f1f7078090e063cc7` |
| [board-r02.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/board-r02.png) | 221,265 | `ba9edcb9f07408d7dfed2023f2c7e65d088251a3` |
| [board.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/board.png) | 224,794 | `7eb960921945904a064ce67ded6fae8067c23739` |
| [grid-r02.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/grid-r02.png) | 249,502 | `ecde8e8844b8a420cd80d2ee6775ff336fa7c8db` |
| [grid.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/grid.png) | 285,778 | `1e2de6e06ab4a195ececd87c6bcea2f1a3e75eee` |
| [manifest.json](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/manifest.json) | 3,576 | `6b7fc5d16dc7669479a5d1f6a8c768716c23e97f` |
| [phone-board-r02.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/phone-board-r02.png) | 82,597 | `fec1f81215900483a44dca07cf0fc5404c75c63f` |
| [phone-grid-r02.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/phone-grid-r02.png) | 77,071 | `7327642b71df8d2d967abce7a5f300303284b25c` |
| [revision-review.json](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/revision-review.json) | 5,882 | `6702898387d0f6eeb4b6155c2f59ea9be2c147f8` |
| [states-r02.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/states-r02.png) | 157,015 | `69ede9e59ff0e8f89de48432c902ff66db2cc8cb` |
| [states.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/states.html) | 550,361 | `157c2bc8fe62814d038ccfeaec81f6b2d6350506` |

The [original manifest](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/manifest.json) includes screenshot SHA-256 hashes and brand provenance; the [original review](https://github.com/deanrfiedler-gif/powerplants-one/blob/dcabfec1b5cde1c2cf220359e6cf1c63408512d6/docs/blueprints/crm-ui-mockups/revision-review.json) records the earlier measurements. Historical prose is retained with only link corrections and the explicit housekeeping note in the handover.

To recover the gallery on a dedicated branch, use `git restore --source=dcabfec1b5cde1c2cf220359e6cf1c63408512d6 -- docs/blueprints/crm-ui-mockups/`. Reverting the complete cleanup restores its links, manifest dependency and gallery checks together; restoration should remain a reviewed change.

## Verification and handover

Local checks passed with Python 3.12.14 and Node 24.21.0: foundation (78 requirements and 1,925 resolved local links), prototype (78 parent dispositions), naming (167 records), changed-script syntax and ESLint. Retained export, logo and embedded-logo hashes match their originals; application code, tests, issued source snapshots and both active HTML files are unchanged. Local Chrome is unavailable, so full browser execution is delegated to the existing GitHub workflow; it is not claimed as a local pass. Exact published-head CI results are recorded in PR #188. Publication and merge remain subject to passing applicable checks and completed reviews. This housekeeping decision does not grant new visual or business acceptance.
