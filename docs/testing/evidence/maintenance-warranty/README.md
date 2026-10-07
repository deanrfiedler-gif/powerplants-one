# Maintenance and Warranty verification evidence

<!-- versioning: git; committed history is authoritative -->

Current combined-tree verification is recorded separately in the [integration ledger](integration/README.md). The evidence below retains its original source and environment.

Owner: Dean Fiedler. Review: local implementation inspection complete; owner/business/device acceptance pending. Branch: `feat/maintenance-warranty-native`. Initial base: `0f10b7fb46a8ab512e9b019573ece272cf5920b9`; incorporated main: `2173cc64eed54b1e3fb8334495f7cd924206d13f`; tested implementation: `60e2da3ea56f599faf24ca9b6a54dd5792c37715`. Subsequent delivery commits retain evidence and documentation without changing that application implementation.

Environment: Windows, Node 24.21.0, PostgreSQL 16 disposable `ppo_synthetic_test` on isolated loopback port 55499, compiled application on port 3099. Browser: stable Chrome 154.0.8037.58 / Playwright 1.63.0. Synthetic data only. The [handover](../../../delivery/maintenance-warranty-handover.md) carries commands, outcomes and failed-run disposition. No deployment or business acceptance is claimed.

Functional traces: SVC-12.1 agreement/entitlement, SVC-12.2 plan/occurrence, SVC-12.3 warranty/recovery, SVC-12.4 renewal, SVC-12.5 canonical replacement; AT-19, AT-33 and relevant AT-25. Tests use synthetic fixtures and the current shared operation/authority model.

## Captures and comparison

The [capture manifest](capture-manifest.json) retains SHA-256 hashes for 66 original PNG captures and the three unchanged HTML references. The implementation agent visually inspected 56; ten repeated mobile tab/reflow captures have automated assertions only and are explicitly labelled. None grants owner acceptance or changes a live-register review fingerprint.

| Scope | Original source | Native desktop | Native phone |
|---|---|---|---|
| MA-01 agreement | [Maintenance r01](desktop/maintenance-reference-1440.png) | [Register](desktop/maintenance-agreements-register-1440.png), [record](desktop/maintenance-agreements-1440.png) | [Record](mobile/maintenance-agreements-390.png), [cards](layout/maintenance-agreements-cards-390.png) |
| MA-02 entitlement | Maintenance r01 above | [Register](desktop/maintenance-coverage-register-1440.png), [record](desktop/maintenance-coverage-1440.png) | [Record](mobile/maintenance-coverage-390.png), [cards](layout/maintenance-coverage-cards-390.png) |
| MA-03 plan | Maintenance r01 above | [Register](desktop/maintenance-plans-register-1440.png), [record](desktop/maintenance-plans-1440.png) | [Record](mobile/maintenance-plans-390.png), [cards](layout/maintenance-plans-cards-390.png) |
| MA-04 occurrence | Maintenance r01 above | [Register](desktop/maintenance-due-register-1440.png), [record](desktop/maintenance-due-1440.png) | [Record](mobile/maintenance-due-390.png), [cards](layout/maintenance-due-cards-390.png) |
| MA-05 renewal | Maintenance r01 above | [Register](desktop/maintenance-renewals-register-1440.png), [record](desktop/maintenance-renewals-1440.png) | [Record](mobile/maintenance-renewals-390.png), [cards](layout/maintenance-renewals-cards-390.png) |
| MA-06 case | [Warranty r01](desktop/warranty-reference-1440.png) | [Register](desktop/warranty-cases-register-1440.png), [record](desktop/warranty-cases-1440.png) | [Record](mobile/warranty-cases-390.png), [cards](layout/warranty-cases-cards-390.png) |
| MA-07 recovery | Warranty r01 above | [Register](desktop/warranty-supplier-recovery-register-1440.png), [record](desktop/warranty-supplier-recovery-1440.png) | [Record](mobile/warranty-supplier-recovery-390.png), [cards](layout/warranty-supplier-recovery-cards-390.png) |

Also inspected: the [theme r22 source](desktop/theme-style-board-reference-1440.png), all three sources at 390 px, the six desktop Warranty views, and the focused form at [1440](layout/warranty-form-1440.png), [1024](layout/warranty-form-1024.png), [390](layout/warranty-form-390.png), [320](layout/warranty-form-320.png) and [720](layout/warranty-form-720.png) px. Source captures block external HTTP requests, so external-font fallbacks are part of this comparison. Sources remain exact issued bytes.

Native adaptations are proposed in the living contracts: the current full Service shell; separate persisted register/detail routes; two-column desktop cards and stacked phone cards; wrapping workspace navigation and tabs; facts first with retained identity/source disclosures; current permission-scoped actions and route guides. The original compact tables, prototype KPI counts and browser-local editing are not reproduced as production behaviours. On phones the wrapped seven-workspace navigation and filters use substantial vertical space; scrolling reaches the cards and forms without horizontal clipping. This remains an explicit owner design-review point.

## Functional and accessibility evidence

The [eight passing browser cases](logs/ma-browser-release.txt) exercise every register/detail route and its exact guide key, guide Escape/focus restoration, keyboard tab selection, retained drafts, lost accepted responses recovered using the original operation, one resulting event, read-only/empty/missing/error states and Retry. Browser overflow checks cover the document, main scroll pane and workspace; a deliberately injected 5000 px element makes the check fail before removal makes it pass.

[Measured controls](layout-measurements.json) and the [read-only capture script](layout-proof.mjs) record Enter/Space disclosure operation, Tab/Shift+Tab focus, visible focus, phone input fonts of at least 16 px and control heights of at least 44 px. Button labels retain the shared 14 px style. The 720 by 480 CSS viewport is the reflow equivalent of 200% at 1440 by 960; it is not a claim of physical browser zoom, hardware-phone or screen-reader testing. Those acceptance checks remain pending.

The script runs from the repository root after the durability script's write phase, against its synthetic case and local port 3099. It creates only unsaved drafts and temporary images. It does not send the action form.

## Durable originals

[Restart proof](restart-proof.json) records application PID 12644 changing to 14408 and a changed PostgreSQL postmaster start. The comparison covers twelve typed table snapshots across all seven record families plus the original operation receipt, audit rows and outbox rows. Both phases retain digest `7509ca6dbc73fcd6db9f749d52d772e4b27c9474a348fa523b9a2ddff7f07826`. Receipt GET and identical POST retry return the original result; deep comparison finds no changed originals or additional effects. Configuration and the full temporary synthetic snapshots remain outside the committed evidence.

## Limits

Local functional proof is passing. The full Windows unit run has four failures reproduced on untouched current main; [baseline log](logs/unit-current-main-baseline.txt) and the handover explain them. Broader Ubuntu CI must run on the PR head. SC-08 return custody and live ERP credit reconciliation remain unavailable external receiving dependencies. Source presence, agent inspection, functional proof, owner acceptance and deployment remain separate.
