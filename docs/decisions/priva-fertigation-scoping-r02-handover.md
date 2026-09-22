# Priva fertigation scoping r02 — audit candidate and publication handover

**22 September 2026 · Proposed candidate · Draft contribution**

## Publication status

This branch records the audit and handover only. The complete r02 HTML, readable correction source, deterministic builder, tests, detailed audit and generated examples are delivered to Dean in the conversation review package. A connector attempt to publish the readable source was blocked before execution. No alternate encoding or route was used to bypass that block. The complete implementation is therefore **not yet published in this repository**. This draft is not merge-ready.

This replacement corrects the earlier provisional candidate identity, test totals and browser version. The figures below come from actual files and executed runs. Do not reuse the superseded 315255-byte/140-check/Chromium-131 figures.

No merge, deployment, external-system change, application dependency, database migration or live controller connection is included. The issued r01 artifact and original evidence remain unchanged.

## Exact baseline and delivered candidate

Repository baseline: `89c6c10d14c6096d9e894102fc1d790ea75a035e`, merged PR #275; main was rechecked at the same head. Supplied r01 matches repository blob `c2f37b86e472ab0e23f5d5a4122e0afe21651f12`.

| Artifact | Bytes / SHA-256 |
|---|---|
| Original r01 HTML | 265640; `f3b18fa6bdc59e64224075d9a8b3517b28485813207a6ca4e4bd77a5efa4807f` |
| Delivered r02 HTML | 309903; `ae122ac8dd075530aa56ade8bad201e7c41155d10a5c2feb0dae42af95d16ec7` |
| Build plan r01 | `7eb6a7174ca4a4cc222dea73bb0c54bf4853dbab68b9abbe94b5d64ef1391a41` |
| Theme r22 | `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0` |

Candidate: `powerplants-one-priva-fertigation-scoping-workbench-r02.html`. App 1.1.0; standalone schema 2; calculation edition `PPO-FERT-CALC-r02`; recovery key `ppo-priva-fertigation-r02`.

Scope remains Fertigation under ES-02, not ES-08 Screen Systems. The inspected native `PPO-ES02-CONFIG-r01` has Text/Zones fact fields, not a complete typed fertigation-flow contract. Do not map m³/h into Zones, invent endpoints or call local schema 2 a native migration.

## Findings and delivered corrections

The full audit contains 28 stable findings (PF-01–PF-28), coverage of F01–F20, CALC-01–CALC-11, UI-01–UI-33 and AT-01–AT-56, and a prioritised integration/acceptance roadmap.

Most consequential reproduction: original demo, only G1 selected, 25 cycles and 20-minute spacing. Planned application is 35 m³ versus 33 m³ total entered crop demand, but A2's 4000 containers receive no irrigation. The candidate checks individual valve-served crop allocations; surplus elsewhere cannot cancel omitted or under-served areas. It does not assert agronomic sufficiency.

Other implemented corrections in the delivered package:

- Phase/unknown propagation through crop block, valve, master and source; explicit scenario supply/storage reconciliation.
- Mixed-cohort density requires represented area; actual counts remain authoritative.
- Position-preserving optional pump-curve cells, finite/range validation and bounded interpolation; measured points included in chart extent.
- Physical-valve intervals, repeated group membership, crop-directed flush and register-order scheduling.
- Known channel/flow/pressure failures remain failures even where exact supplier evidence is unconfirmed.
- GroScales wired/wireless, intended controller, gateway/equipment scope and exact confirmation; Compass exclusion labelled a Powerplants scoping rule.
- Typed physical I/O allocation and manual-versus-derived demand reconciliation; strategy sensor/reset requirements.
- Strict CSV duplicate/quote handling, synthetic provenance, atomic mutation/import, decoded attachment limits, stale preview/upload protection and preserved review history.
- Discovery/Technical disclosure, register search/50-row paging, unsaved feedback, grouped labels and full-width drawing layout.
- Customer/internal report audiences, fresh report downloads, phase-aware concept SVGs and working/synthetic/non-construction labels.

Missing or partial planned functionality is not represented as implemented: remapped block clone/split/bulk creation, full inline spreadsheet editing, isolated physical scenario graphs, global unit-entry helpers, measured drain/applied ratio, arbitrary phase hydraulic topology, parallel/overnight scheduling and cancellation.

## Verification actually executed

**120 focused checks passed; zero final failures:**

- 110 calculation, integrity, transaction and generated-output assertions.
- 10 actual form-reader/save/event/export-handler checks over modelled controls.

Runtime: **Node v22.16.0** on Linux. Actual inline HTML executes in a VM with minimal DOM/dialog/storage stubs. These are **not native-browser or JSDOM tests**. An actual JSON export restores identical embedded synthetic PNG bytes in a separate clean VM; this is not a cross-browser test.

Additional evidence: 36 actual generated fragments structurally parsed with zero duplicate IDs or missing label/help targets; eight declared text contrast pairs above 4.5:1; actual CSV and customer/internal report HTML downloads; three generated SVGs independently rasterised and visually inspected. Rasterised SVGs are not HTML screenshots. No PDF was generated.

100-block/1000-valve fixture: 100 cohorts, 100 groups, three cycles, 300 events; five in-process runs. Median **1184.533 ms**, maximum **1247.899 ms**, for separate derive + validate + actual Farm HTML-string generation. This excludes DOM insertion/layout/paint/input latency. Synchronous responsiveness remains a risk, not an acceptance pass.

The Node-built-ins-only deterministic builder reproduces the exact 309903-byte candidate and rejects the wrong original source hash. Readable source and tests are in the package, not yet on this branch.

Historical r01 evidence remains separate: 51 cases, Node 24.21.0/JSDOM 30.1.0. Its ESM harness was inspected and preserved, not rerun. Its six-group timing fixture reused physical valves; the new suite tests distinct valves (24-minute cycle/21-minute dry interval) separately from repeated same-valve membership (1-minute gap). Do not weaken original assertions without documenting that fixture/semantics correction.

### Native/browser and CI limitations

Chromium **144.0.7559.96** launched through Playwright, but navigation to the supplied local file returned `Page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR`. No supported cloud-browser connector/skill was available. No policy bypass or public deployment was attempted.

Native 1440/1280/1024/768/390 px, 200% zoom, keyboard/focus/assistive technology, real file pickers/downloads, actual quota/private-mode/multi-tab recovery, cross-browser portability and print pagination remain unverified. Repository-wide/pinned-runtime checks were not executed here; Git clone failed DNS resolution although connector reads worked. Documentation CI on this handover is not module implementation CI.

## Migration and reproduction

Preserve the original r01 HTML and project JSON. Open a valid schema-1 JSON in r02, inspect its preview and explicitly confirm replacement. IDs, input quantities, relationships and evidence are retained; new optional facts remain unknown. The working revision advances, current local acknowledgement becomes superseded history, and nested historical snapshots stay unchanged. Save a new r02 JSON. r01 rejects schema 2; no automatic downgrade exists. Separate browser recovery keys avoid silent overwrite.

From the extracted conversation package root:

```sh
node source/build-r02.mjs powerplants-one-priva-fertigation-scoping-workbench-r01.html powerplants-one-priva-fertigation-scoping-workbench-r02.html
node tests/check-r02.mjs powerplants-one-priva-fertigation-scoping-workbench-r02.html evidence powerplants-one-priva-fertigation-scoping-workbench-r01.html
node tests/check-interactions.mjs powerplants-one-priva-fertigation-scoping-workbench-r02.html evidence
node tests/benchmark.mjs powerplants-one-priva-fertigation-scoping-workbench-r02.html evidence
```

These package paths do not assert matching repository files exist.

## Next bounded gates

1. Transfer the complete candidate/source/tests/audit/evidence from the delivered package, reproduce the exact hash, and update the module decision/index/status proportionately without promoting acceptance.
2. Run pinned runtime and applicable foundation/prototype/naming/required CI; keep original r01 evidence separate.
3. Optimise the measured synchronous calculation/render work and complete authorised native browser/device/print verification with actual screenshots and exported files.
4. Obtain named Priva and irrigation-design confirmation of exact hardware/software/licences, GroScales wireless equipment, source/phase paths, pump data and injector conditions.

The candidate is materially improved for synthetic demonstration and supervised draft capture. It is not sole authority for final agronomic sufficiency, equipment sizing or commissioning. Local review is an editable acknowledgement, not an authenticated approval. Native CRM/ES-02/SharePoint/ERP handovers are proposed only; no working integration is implied.
