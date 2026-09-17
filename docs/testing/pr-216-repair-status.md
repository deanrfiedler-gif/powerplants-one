# PR #216 recovery update — 17 September 2026

**Original package restored; maintained source corrected; fresh CI required before merge.** Dean supplied the original Git bundle, ZIP, HTML and report. All recovered ZIP files match bundle commit `9dfbb27f4594351a6993e132a763639c5d60937e`; the separately uploaded HTML/report match the ZIP. Main `86802e9cbaa7f0f72a5108018802a3d95e0a4285` is retained as a merge parent.

| Original | SHA-256 |
|---|---|
| ZIP | `c39f201ab2e33c06f27d324cb615e4586e69dbfc650f0f55d9b383aed4ed28d3` |
| Git bundle | `db89bf71fab1ebaab7a7943efec7c1fcb5b96c20f4f87c801b63c72ccf5c5c2e` |
| HTML | `ad331e08d6b2bb1fb5a43b3237fe7dcbd6c948a8b631d5569f350d48f5e2dfd7` |
| Report | `a5acef84922d4b2670ad88aabc47559f013d3a59557be50536b7c5d288954289` |

The deterministic builder reproduces the uploaded HTML exactly. All **40 original model groups** pass on Node 24.19.0. Foundation, prototype and naming assurance pass. Original model/browser scripts, focused workflow and historical evidence are restored. Historical browser results remain historical.

Local Chrome cannot start because the execution environment denies its socket creation. The restored workflow installs the repository-pinned runtime and browser, and must pass with all required checks before merge. Read fresh results and the authoritative merge outcome on [PR #216](https://github.com/deanrfiedler-gif/powerplants-one/pull/216).

No application, database, dependency pin or deployment changes. Owner acceptance and runtime integration remain separate.

## Fresh CI finding and bounded correction

The exact recovered package passed native design workflow [35219217534](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35219217534). Wider checks found five unused-variable lint errors: four dead bindings in the interaction layer and one unused caught exception in the browser harness. These are removed without changing the model or user workflow. The builder now writes the maintained [versionless HTML](../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace.html); the supplied r01 HTML and report remain byte-for-byte intact. Browser/model checks now target the working HTML, and focused CI explicitly includes lint. New CI must pass on the corrected head.

The earlier inventory below is retained as history; its missing-file blocker is now resolved.

---

# PR #216 repair status — Order Fulfilment & Customer Delivery

Date: 16 September 2026. Status: **incomplete source upload; blocked**.

The current repair integrates main `d565a9d` without conflicts and preserves all supplied files. It does not substitute a newly invented implementation for the absent original package.

## Missing material

The checked-in builder cannot run. These required source and test files are absent:

- `docs/design/order-fulfilment/fonts.css`
- `docs/design/order-fulfilment/workspace.css`
- `docs/design/order-fulfilment/model.js`
- `docs/design/order-fulfilment/workspace.js`
- `scripts/check-order-fulfilment-model.mjs`
- `scripts/check-order-fulfilment-browser.mjs`

The HTML and companion report referenced by the decision and source guide are also absent. The original claimed verification cannot be reproduced from this branch. The existing descriptions/results remain historical source claims, not verification of a complete committed package.

## Checks performed during repair

- Inspected the PR and all fetched remote branches and history for the missing files; no recoverable copy was found.
- Checked available saved artefacts by exact filename and module name; no matching package was found.
- Ran the checked-in builder: fails at the missing `fonts.css`; CSS, model and controller are missing as well.
- Ran foundation assurance against current main plus the contribution: fails with the missing local references below. These checks remain enabled.
- No application source, database, dependency pin, access control or deployment was changed.

- `docs/decisions/order-fulfilment-delivery-design.md: broken local link: ../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html`
- `docs/decisions/order-fulfilment-delivery-design.md: broken local link: ../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-Report-r01.md`
- `docs/decisions/order-fulfilment-delivery-design.md: broken local link: ../testing/evidence/order-fulfilment-r01/README.md`
- `docs/decisions/order-fulfilment-delivery-design.md: broken local link: ../testing/evidence/order-fulfilment-r01/README.md`
- `docs/design/order-fulfilment/README.md: broken local link: ../../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html`
- `docs/design/order-fulfilment/README.md: broken local link: ../../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-Report-r01.md`
- `docs/design/order-fulfilment/README.md: broken local link: ../../testing/evidence/order-fulfilment-r01/README.md`
- `docs/contracts/order-fulfilment-integration.md: broken local link: ../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-Report-r01.md`

## Required recovery

Upload the original complete package, including source CSS/JavaScript, generated HTML, companion report, model/browser scripts and their evidence. Confirm the generated HTML matches the original recorded hash, then rerun model, native-browser and repository assurance. Until that evidence is available, this PR must remain a draft; a documentation-only green check would not repair the missing implementation.
