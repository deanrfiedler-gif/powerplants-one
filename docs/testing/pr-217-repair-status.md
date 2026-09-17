# PR #217 recovery update — 17 September 2026

**Original HTML/report restored and source recovered exactly; fresh CI required before merge.** Dean supplied the HTML and companion report. The existing template and the shared My Work font source match the supplied HTML. Extracting its embedded CSS, model and interaction script, then running the existing builder, reproduces that HTML byte-for-byte. The recovered model hash also matches the original historical model result.

| Original | SHA-256 |
|---|---|
| HTML | `403a0a182bdc353333a1e387b2f3fa3b32d6c8c3245085acb31919ff79435f48` |
| Report | `b1bdb511b81bdb554d681205779356288d59565fe3771c0d1cd52a484381f4da` |
| Recovered model | `9c3939f987401edb78464b97af1243e1306c1b586f3cd4d7211680c9553b595c` |

## New verification and retained history

The original executable test scripts were not supplied. New recovery suites are explicitly labelled as new work and do not claim to reproduce the historical 29-model/21-browser result. The 26 new model groups pass on Node 24.19.0. They cover customer scope, eleven separate outcomes, date provenance, permissions, review completion, append-only corrections, referral states, training stages, document requests, agreement ownership, duplicate CRM prevention, unknown outcomes, stale writes, replay and malformed sessions. Both scripts pass syntax checks. Foundation, prototype and naming assurance pass.

The new 15-group browser suite exercises visible controls, saved records after reload, role scope, failed and lost saves, source uncertainty, export/restore, keyboard focus, five views at desktop/phone widths, and damaged-session retention. Local Chrome cannot start because this environment denies socket creation. The focused workflow installs the repository-pinned runtime/browser and must pass alongside repository-required checks before merge. It retains fresh evidence under `verification-evidence/sales-aftercare-recovery/`; the existing `docs/testing/evidence/sales-aftercare-r01/` records remain historical and unchanged. [PR #217](https://github.com/deanrfiedler-gif/powerplants-one/pull/217) carries authoritative fresh CI and merge results.

No application, database, dependency pin or deployment changes are included. Owner acceptance and runtime integration remain separate. Main `86802e9cbaa7f0f72a5108018802a3d95e0a4285` is reconciled while retaining the original PR history.

## Fresh CI source cleanup

[Run 35220962231](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35220962231) identified five unused bindings in the recovered source: the always-true first-step predicate parameter, the unused degraded-source predicate, two unused record-chip projections and an unused customer-select projection. These bindings are removed without changing business behavior. The maintained [versionless HTML](../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist.html) is generated and tested from the corrected source. The uploaded r01 HTML/report stay unchanged; the model hash above identifies the exact original recovery before this cleanup. Fresh model and browser artifacts identify the actual maintained hashes.

The first native recovery run reached the provenance refusal check and correctly refused a missing rule revision: the seed already carried a source reference. The check now explicitly clears both provenance fields before asserting the missing-source refusal, so it tests the intended condition rather than assuming blank seed values. Business code and the original snapshots are unchanged by this harness correction.

The earlier missing-file inventory below is retained as history; its source and deliverable blockers are now resolved and the missing tests have been replaced with the separately identified recovery suites.

---

# PR #217 repair status — Sales Aftercare & Renewal

Date: 16 September 2026. Status: **incomplete source upload; blocked**.

The current repair integrates main `d565a9d` without conflicts and preserves all supplied files. It does not substitute a newly invented implementation for the absent original package.

## Missing material

The checked-in builder cannot run. These required source and test files are absent:

- `docs/design/sales-aftercare/fonts.css`
- `docs/design/sales-aftercare/workspace.css`
- `docs/design/sales-aftercare/model.js`
- `docs/design/sales-aftercare/workspace.js`
- `scripts/check-sales-aftercare-model.mjs`
- `scripts/check-sales-aftercare-browser.mjs`

The HTML and companion report referenced by the decision and source guide are also absent. The original claimed verification cannot be reproduced from this branch. The existing descriptions/results remain historical source claims, not verification of a complete committed package.

## Checks performed during repair

- Inspected the PR and all fetched remote branches and history for the missing files; no recoverable copy was found.
- Checked available saved artefacts by exact filename and module name; no matching package was found.
- Ran the checked-in builder: fails at the missing `fonts.css`; CSS, model and controller are missing as well.
- Ran foundation assurance against current main plus the contribution: fails with the missing local references below. These checks remain enabled.
- No application source, database, dependency pin, access control or deployment was changed.

- `docs/testing/evidence/sales-aftercare-r01/README.md: broken local link: ../../../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html`
- `docs/testing/evidence/sales-aftercare-r01/README.md: broken local link: ../../../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-Report-r01.md`
- `docs/decisions/sales-aftercare-renewal-design.md: broken local link: ../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html`
- `docs/decisions/sales-aftercare-renewal-design.md: broken local link: ../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-Report-r01.md`
- `docs/contracts/sales-aftercare-receiving.md: broken local link: ../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html`
- `docs/contracts/sales-aftercare-receiving.md: broken local link: ../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-Report-r01.md`
- `docs/design/sales-aftercare/README.md: broken local link: ../../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html`
- `docs/design/sales-aftercare/README.md: broken local link: ../../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-Report-r01.md`

## Required recovery

Upload the original complete package, including source CSS/JavaScript, generated HTML, companion report, model/browser scripts and their evidence. Confirm the generated HTML matches the original recorded hash, then rerun model, native-browser and repository assurance. Until that evidence is available, this PR must remain a draft; a documentation-only green check would not repair the missing implementation.
