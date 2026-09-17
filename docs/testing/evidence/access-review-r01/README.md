---
document_id: PPO-AD01-VERIFY
title: Users, Roles, Teams and Access Review r01 verification evidence
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Executed local verification on a substitute browser; pinned-runtime CI and owner review pending
source_commit: efd4d4e33f5fc4ef2a4605455ed8d4c66e0ddc39
---

# AD-01 Users, Roles, Teams & Access Review r01 — verification

This record covers the following, which are standalone synthetic design evidence:
- the [interactive HTML](../../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html);
- its [detailed report](../../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-Report-r01.md);
- the [design handover](../../../decisions/users-roles-access-review-design.md).

Owner acceptance, D-020 decisions and application integration are separate.

## Results

| Item | Evidence |
|---|---|
| Checked source | Branch `design/users-roles-access-review-r01`, cut from `main` `efd4d4e33f5fc4ef2a4605455ed8d4c66e0ddc39`; local working tree before commit (`PPO_SOURCE_HEAD=local-pre-commit`). The pull request records the committed head and CI runs |
| HTML SHA-256 | `0478e247aae54bad360f6d4316901e32d83296d4dbf634a375b2b005811320db` |
| Fixture manifest SHA-256 | `13d0e64db11afa36104a55be883c5c605947b84bc3a9471acbeaa36a57ede37d` (canonical JSON of the seed state) |
| Capability source | `src/platform/permissions.ts` SHA-256 `a589022f8fdfaf109a58b3ad97f4856bbad472fa2e2b94803e50ea9b4402bcfc`: 61 capabilities. `scripts/demo-database.ts` SHA-256 `9dc127224dedff3cbf8e11500de2d9df6a50c72a24464ec4a3b5677b1a62dbc1`: 24 hosted tester capabilities |
| Model | **107 groups passed** — [original result](model-results.json) |
| Native interaction | **40 groups passed**, zero page or console errors — [original result](browser-results-substitute.json) |
| Runtime used | **Substitute, not the pinned runtime.** Node 22.22.2 (the repository pins 24.21.0), Playwright 1.63.0, Chromium 141.0.7390.37 through `PPO_BROWSER_PATH` (the repository pins the Chrome channel). The result file records `browser_channel: substitute` |
| Pinned-runtime evidence | **Pending.** Produced by the focused workflow `access-review-design.yml` on the pull request |
| Responsive coverage | All six views at 1440, 1024, 820, 390 and 320 px. No page overflow, and no visible content or toolbar button under 44 px high at 390 or 320 px. The inspection panel fits 390 px |
| Screenshots | 21 PNGs captured in `verification-evidence/access-review/` (not committed; the workflow retains its own for 14 days). Names and SHA-256 are listed in the result file |
| Deterministic build | Rebuilding reproduces the committed HTML and `capabilities.js` byte for byte |
| Documentation | Foundation, prototype and naming checks; conflict-marker scan; `git diff --check`. Results are recorded in the pull request |

## What the native checks cover

- **Rendering and filters:**
  - six views render, with the synthetic banner and authority statement;
  - queue-tile filtering and toggling;
  - capability-key search;
  - empty-result recovery;
  - selection cleared when a filter hides the selected person.
- **Explanation and detail:**
  - site-scoped explanation, showing the failing scope step;
  - grant detail, disclosing contract fields and the absent audit;
  - inactive identity, showing server refusal separately from offline device content;
  - masked, read-only hosted tester.
- **Source states:** partial source (hosted status unknown, not zero); loading, failed and empty states.
- **Catalogue:** 61-capability catalogue; bundle comparison with no adoption; teams with no authority.
- **Change workflow:**
  - duplicate-of-expired refusal, with entries kept;
  - dirty-form cancel confirmation;
  - multi-operation draft with a new `ACR` reference;
  - submission warnings;
  - approver decision with a required reason;
  - simulated apply with confirmation;
  - lost-response recovery with no duplicate;
  - applied grant visible in effective access.
- **Failure handling:** failed save keeps entries; another-session conflict overwrites nothing; cross-tab storage conflict.
- **Role behaviour:**
  - team-lead scope and submission;
  - team-lead read-only completed review;
  - approver review decisions — keep, revoke-to-draft, and unable-to-confirm with an owner;
  - a review recommendation decided only by a different approver (the attester is absent from the reviewer choice, and the approver sees *Awaiting* instead of *Decide*);
  - completion blocked until all items are decided;
  - ordinary-user denial;
  - auditor read-only access.
- **Evidence and history:** JSON and CSV evidence export (synthetic banner, formula-safe, no unmasked identifiers); history and explanation selectors; scripted assistant that cannot act.
- **Keyboard and persistence:**
  - page guide Escape with focus return;
  - arrow and End keys on tabs, and the skip link;
  - reload persistence;
  - tampered backup refused without change;
  - confirmed restore;
  - malformed stored session preserved and reset;
  - five-width responsive sweep;
  - phone inspection panel.

## What the model checks cover

- **Contract fidelity:**
  - the catalogue equals the parsed `Capability` union;
  - the hosted set equals `demoCapabilities`;
  - the scope rule and evaluation SQL are still present in the migrations and `permissions.ts`;
  - no `User` or `PermissionGrant` audit type exists;
  - administrative capabilities appear in no migration;
  - seeded identifiers exist in the seeds;
  - hosted tester grants mirror the setup script.
- **Evaluation and derived views:** 16 named evaluation cases; explanation traces; matrix totals; queues; search; bundle matching and comparison; SoD pairs tied to `src/finance/service.ts`; teams without authority.
- **Visibility and workflow:** role visibility and every workflow guard in the decision record; idempotent apply and changed-content refusal; revocation retaining the row; review guards and completion; attester independence at save, submit, decide and restore (owner decision 5).
- **Honesty assertions:**
  - no fabricated audit;
  - only session events are shown as application audit;
  - no cadence or retention period.
- **Restore and composition:**
  - nine restore refusals;
  - composition (one scope container, scope metadata, byte-identical fonts, matching token core, no remote assets).

## Visual review by the builder

Captures at 1440 px (all views, the explanation panel and the partial state), 390 px and 320 px were inspected. Defects found and fixed before issue are listed in the [change record](../../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01-change-record.md). This review is not owner acceptance.

## Not verified

- The pinned Node 24.21.0 and Chrome channel run (pending CI).
- Native desktop and device review, browser zoom, print and screen-reader behaviour (reserved for Dean).
- Any runtime, database or hosted-demo behaviour; none is changed by this package.

## Reproduction

From the repository root:

```bash
python3 scripts/build-access-review.py
node scripts/check-access-review-model.mjs --write-evidence
node scripts/check-access-review-browser.mjs
# where the Chrome channel is unavailable (records a substitute):
PPO_BROWSER_PATH=/path/to/chrome node scripts/check-access-review-browser.mjs
```
