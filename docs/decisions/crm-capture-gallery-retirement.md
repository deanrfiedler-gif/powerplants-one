---
document_id: PPO-009-CAPTURE-RETIREMENT
revision: r01
---
# Retirement of the CRM screen capture gallery

**Date:** 15 September 2026 (Brisbane) · **Owner:** Dean Fiedler · **Scope:** [PR #196](https://github.com/deanrfiedler-gif/powerplants-one/pull/196). Related design: BP-03 / PPO-009 screen specification. No requirement, acceptance or runtime status changes.

## Decision and authority

Dean opened #196 to remove visuals that are no longer accurate, and authorised the repair of the resulting documentation failure. This records the specific 20-file removal below and nothing wider. It is the same treatment already applied to the CRM UI mockups in [PPO-009-MOCKUP-RETIREMENT](crm-mockup-retirement.md).

Remove `docs/blueprints/crm-visuals/` from the working tree. Its original bytes remain in reachable Git history at `3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65`, an ancestor of the deletion merge and of current `main` when inspected. Do not rewrite that history. The seven-screen wireframe, the CRM design workflow, the retained Board/Grid preview, application code and all issued sources in `docs/reference/` are unchanged.

## Current references and checks

- Three prose references previously resolved to the working-tree gallery: one in the [screen specification](../blueprints/crm-screen-specification.md) and two in the [discovery handover](../delivery/crm-discovery-handover.md). Each now resolves to the fixed commit above. The surrounding claims are unchanged; a historical link is not current design or runtime acceptance.
- No script, workflow, manifest or register referenced this directory, so no integrity check, path filter or baseline entry changes. `crm-design-check.mjs` and the 147 wireframe screen/state/viewport combinations are untouched.
- The original failure was three broken local links reported by `scripts/check_foundation.py`. Re-running the deletion alone could not repair them.

## Historical file inventory and recovery

These 20 originals total 2,367,629 bytes. Every link is fixed to the verified source commit; Git blob IDs identify the original content.

| Historical file | Bytes | Git blob |
|---|---:|---|
| [README.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/README.md) | 3,874 | `67d9c883563d916495052bcc72f9352fe73e786b` |
| [manifest.json](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/manifest.json) | 6,040 | `6cd55cc68b8a3c66f8d328478498e489532aa945` |
| [desktop-activity-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/desktop-activity-ready.png) | 126,183 | `8660941c3c5b3c7ae28c13a3faa74e37180ad3f7` |
| [desktop-create-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/desktop-create-ready.png) | 122,566 | `a8db75ed06ed1dd0bcb90e45e7d99805e60c6c3b` |
| [desktop-detail-conflict.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/desktop-detail-conflict.png) | 169,860 | `eb628f0d4cc7679fc7f92463654190850ba0da7f` |
| [desktop-detail-denied.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/desktop-detail-denied.png) | 75,067 | `66746a5bf3c974024ce01809ecacf6722b91e1a3` |
| [desktop-detail-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/desktop-detail-ready.png) | 157,318 | `65d55022081697647e5247052c437d9710361b64` |
| [desktop-history-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/desktop-history-ready.png) | 151,516 | `b1c30e414e12dc282d17bd6e5d24c59e4ac6dacd` |
| [desktop-pipeline-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/desktop-pipeline-ready.png) | 119,995 | `ed2bd19a4b40d547e847c43006b0896bf52d381e` |
| [desktop-relationships-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/desktop-relationships-ready.png) | 151,214 | `6ffa015a90966eb58843491353f85f0c6bee9904` |
| [desktop-work-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/desktop-work-ready.png) | 134,260 | `d14b14aae71f123d35024a5b59c17f1e83c79180` |
| [phone-activity-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/phone-activity-ready.png) | 118,418 | `eeabf21b72a90d516d47f717bfab5b328ec2971a` |
| [phone-create-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/phone-create-ready.png) | 121,020 | `f4ab3c8a15a7c47bd1134f78427e7e0422b3c9aa` |
| [phone-detail-conflict.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/phone-detail-conflict.png) | 165,088 | `75c35dc48e312a04556051e0416e0d3320adedff` |
| [phone-detail-denied.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/phone-detail-denied.png) | 66,400 | `8ef507df02c53c89169f9c7f46b6fa043bcfe970` |
| [phone-detail-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/phone-detail-ready.png) | 151,906 | `62daffbaa4124bf089989a37771551c7d4732b6f` |
| [phone-history-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/phone-history-ready.png) | 138,240 | `cf154727f48a9bd7a8969b772b29521eac1eeb7b` |
| [phone-pipeline-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/phone-pipeline-ready.png) | 124,459 | `0e54e979bc84876b090555e2fe304b72162fc73c` |
| [phone-relationships-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/phone-relationships-ready.png) | 139,574 | `87c4283a1ae1b28f7fbd57a74ee21bc0cb13e8e1` |
| [phone-work-ready.png](https://github.com/deanrfiedler-gif/powerplants-one/blob/3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65/docs/blueprints/crm-visuals/phone-work-ready.png) | 124,631 | `d0d57bdb8a579e6470cc67535f161fa741677e7b` |

To recover the gallery on a dedicated branch, use `git restore --source=3f347fa5ffabb4bda4c684c7f2edb1c5fe5f5d65 -- docs/blueprints/crm-visuals/`. Reverting the deletion restores the directory and its three links together; restoration should remain a reviewed change.

## Verification and handover

Local checks passed with Python 3.12.3 on the repaired merge of `main` and the deletion branch: foundation (78 requirements, 2,159 resolved local links, 0 errors), prototype (78 parent dispositions, 0 errors) and naming (0 errors). No script, workflow, application file or issued source changed. Published-head CI results are recorded in PR #196. This housekeeping decision grants no new visual or business acceptance.

The document register entry for this record is added in PR #200, where `docs/standards/document-register.csv` is already being revised; until that lands the record is unregistered.
