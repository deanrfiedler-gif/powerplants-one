# Priva fertigation scoping r02 — candidate audit and publication handover

**22 September 2026 · Proposed design · Draft contribution**

## Repository delivery status

This commit records the audit and verification handover. **It does not yet publish the r02 HTML, authoring fragments or new test runners into the repository.** The complete candidate, readable source, deterministic builder, tests, detailed audit and generated examples are delivered to Dean in the accompanying conversation review package. This draft is not merge-ready. Do not infer that a repository path mentioned below exists on this branch until the package is transferred and verified.

No merge, deployment, live controller connection, external-system write, application dependency change or database migration is included. Original issued r01 and its historical evidence remain unchanged.

## Exact basis and candidate

Repository baseline: `89c6c10d14c6096d9e894102fc1d790ea75a035e`, merged PR #275. The supplied r01 matches repository blob `c2f37b86e472ab0e23f5d5a4122e0afe21651f12`.

| Artifact | SHA-256 |
|---|---|
| Original r01 HTML, 267142 bytes | `f3b18fa6bdc59e64224075d9a8b3517b28485813207a6ca4e4bd77a5efa4807f` |
| Revised r02 HTML, 315255 bytes | `1990e56149a08c65e68680981334b8781be8b545c0b530e2729c02e3b8b12edc` |
| Supplied build plan r01 | `7eb6a7174ca4a4cc222dea73bb0c54bf4853dbab68b9abbe94b5d64ef1391a41` |
| Supplied/repository theme r22 | `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0` |

Candidate download: `powerplants-one-priva-fertigation-scoping-workbench-r02.html`. App 1.1.0; standalone schema 2; calculation edition `PPO-FERT-CALC-r02`; recovery key `ppo-priva-fertigation-r02`.

Scope remains the existing **Fertigation** family under ES-02. ES-08 remains Screen Systems. The actual inspected `PPO-ES02-CONFIG-r01` native contract has limited Text/Zones fact fields; do not invent native fertigation numeric fields or map m³/h into Zones. This local schema 2 is not a native contract/database migration.

## Consequential findings and implemented candidate changes

The most serious reproduced defect is crop coverage. In the original synthetic farm, selecting G1 only with 25 cycles and 20-minute spacing produces 35 m³ planned versus 33 m³ total crop demand, while A2's 4000 containers receive no irrigation. The original total-volume check does not identify this omission. The candidate checks cohort and individual service-allocation coverage and delivered volume, so surplus in another crop cannot cancel missing irrigation.

Additional implemented corrections in the delivered candidate:

- Excluded/unknown phase propagates through block, cohort, valve, master and source flow instead of leaving misleading known operating figures.
- Mixed-cohort density requires an explicit cohort area or actual count rather than reusing the whole block area.
- Curve parsing preserves empty optional cells (`10,20,,3` means power 3, not efficiency 3), validates optional imported point fields and caps curve size. Measured duties expand the axes; no operating-point prediction is asserted.
- Selected groups use register order; actual physical-valve intervals include repeated membership and crop-directed flush. Conflicts feed timing panels/badges as well as findings.
- Scenario source/storage links and declared filter paths expose unbound or contradictory supply assumptions. This is not an arbitrary hydraulic graph.
- Known injector/flow/pressure failures remain failures even when entered limits lack supplier confirmation. Exact controller, source revision and shared stock-limit binding are explicit.
- CSV duplicate IDs and malformed quote endings reject atomically; synthetic provenance is retained. Attachment limits use decoded bytes, not trusted size metadata.
- Whole-candidate transactions, rollback, review invalidation/history, undo/snapshot recovery and simulated cross-tab/storage failure handling are strengthened.
- Explicit GroScales wired/wireless and intended-controller requirements, supporting wireless equipment/evidence fields, typed I/O reconciliation and strategy sensor/reset capture are added. The Compass restriction is labelled a Powerplants scoping requirement, not a universal version/licence claim from Priva.
- Discovery/technical disclosure, searchable/paged registers, grouped labels/help, unsaved feedback, full-width concept drawings and customer/internal report audiences improve capture and handover.

The full downloadable audit covers F01–F20, CALC-01–11, UI-01–33 and AT-01–56, with 24 prioritised findings, source and integration boundaries, deferred planned functionality and acceptance checks. Missing planned features include bulk/split/duplicate record workflows, fully isolated physical scenarios, global unit-entry helpers, measured drainage ratio, phase-specific arbitrary routing, overnight/parallel scheduling and asynchronous cancellation. These are not represented as implemented.

## Verification actually executed

**140 checks passed on the exact candidate:**

- 132 calculation, integrity, transaction and generated-output checks.
- 8 actual form-reader/event-handler/export checks over modelled controls.

Runtime: **Node v22.16.0**. The actual inline HTML script executes in a VM with minimal DOM, dialog and storage stubs. These are **not native-browser or JSDOM tests**. Independent expected outcomes cover the required base arithmetic and adverse cases. A separate clean VM restores the exported JSON with identical embedded synthetic PNG bytes; it is not a cross-browser test.

Additional structural parsing found zero duplicate IDs or missing label targets across 34 generated fragments. Eight declared contrast pairs were calculated. A 100-block/1000-valve, 100-group, 300-event fixture was measured over five in-process model/HTML-string-generation runs. DOM insertion, layout, paint, input latency and device behaviour are excluded.

The portable builder uses Node built-ins only, checks the exact r01 source hash, refuses an incompatible existing output and reproduces the exact 315255-byte candidate hash. No framework/npm application dependency is needed. Actual export functions produced synthetic project JSON, populated CSVs, system/block SVG and customer/internal report HTML. SVGs were independently rasterised and inspected; the images are not HTML browser screenshots.

Historical r01 verification remains separate: 51 cases, Node 24.21.0/JSDOM 30.1.0. Its ESM harness was inspected and preserved, not rerun in this environment. No repository-wide or pinned-runtime r02 CI pass is claimed.

### Native browser block

Chromium 131.0.6778.204 launched via Playwright, but navigating to the supplied file returned `Page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR`. No supported cloud-browser connector/skill was available. No policy bypass or public deployment was used.

Native desktop/mobile layout at 1440/1280/1024/768/390 px, 200% zoom, keyboard/focus/assistive technology, native file handling, actual quota/private-mode/multi-tab recovery, cross-browser portability and print/PDF pagination remain unverified. No PDF or native UI screenshots are claimed.

## One-way migration

Keep the original r01 HTML and exported JSON. Open the JSON in r02, inspect the import preview and explicitly confirm replacement. Valid schema-1 data upgrades to schema 2 while retaining IDs, inputs, references and evidence; the working revision advances and current review moves to superseded history. Omitted new fields mean unknown. Nested historical snapshots remain unchanged; restoring one creates a new current-schema working revision.

Save a new r02 JSON file. The r01 HTML refuses schema 2, preventing silent legacy recalculation. There is no automatic downgrade. r02 has a separate browser recovery key and does not silently overwrite r01 recovery.

## Publication and acceptance gates

1. Transfer the delivered package's r02 HTML, readable source fragments, builder, model runtime, new focused test runners, full audit and exact evidence into their corresponding repository paths. Preserve the issued r01 artifact and old evidence.
2. Reproduce the build hash and run the new model/export checks from the repository root. Update the existing module decision, latest-family/document indexes and current status proportionately. Do not promote owner acceptance.
3. Run pinned-runtime and repository-required CI against the complete candidate. This handover-only branch is not evidence of implementation CI.
4. Execute authorised native browser/device/keyboard/print verification. Compare the actual theme and standalone candidate; generated SVG images are not a substitute.
5. Obtain named irrigation-design and Priva review of actual source/phase paths, pump curve, injector conditions, controller/version/licences and GroScales hardware. Resolve unsupported arrangements before final sizing reliance.

Expected package commands, after source transfer:

```sh
node scripts/build-priva-fertigation-scoping-r02.mjs
node scripts/check-priva-fertigation-scoping-r02.mjs
node scripts/check-priva-fertigation-scoping-r02-exports.mjs
```

## Readiness

The delivered candidate is materially improved for demonstration and controlled draft capture/specialist review. It is not a sole authority for agronomic sufficiency, final equipment sizing or commissioning. The planner is one shared sequential circuit with simplified phase water and continuous refill. Exact supplier capabilities are unconfirmed unless entered with applicable evidence. Local review is an editable acknowledgement, not an authenticated approval.

Native integration remains proposed. Begin with canonical Customers/Sites/Facilities, Site Survey/Installed Base and a typed ES-02 Fertigation handover, with source revisions, access checks, explicit receipts and conflict handling. No local export is described as a working live integration.
