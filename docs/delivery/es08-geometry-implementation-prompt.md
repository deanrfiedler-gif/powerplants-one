---
document_id: PPO-ES08-GEOMETRY-PROMPT
revision: r01
date: 2026-09-22
owner: Dean Fiedler
status: Copy-ready future prompt; not an instruction to implement in the audit session
source_commit: 0c95c5af776c97374997623bd1070d9de480cf82
---

# Fresh native implementation prompt

Use the text below only in a subsequent session where Dean explicitly instructs implementation. The audit session stops before native work. The plan remains a proposal until that instruction; technical/supplier/engineering approval remains a separate evidence question even then.

---

Implement the authorised **ES-08 Screen Systems advanced geometry refinement** in `deanrfiedler-gif/powerplants-one`, following the reviewed repository audit and build package. Complete the ordered native work and verification; do not stop at a visual scaffold or pure geometry engine.

First read `AGENTS.md`, `README.md`, `docs/STATUS.md`, relevant BP-01/EST-06 and BP-04 scope, PPO-STD-001, ADR-0034, current ES-08 handover/field contract, Facilities and Discovery contracts, shared UI/conformance guidance and these complete documents:

- `docs/delivery/es08-geometry-audit.md`
- `docs/delivery/es08-geometry-mapping.md`
- `docs/delivery/es08-geometry-field-mapping.csv`
- `docs/delivery/es08-geometry-calculation-mapping.csv`
- `docs/delivery/es08-geometry-build-plan.md`
- `docs/decisions/es08-screen-geometry-study.md`
- `docs/testing/evidence/es08-geometry-audit/README.md`

Read the retained r02/r03 specialist design/report/changelog and `docs/reference/ui/specialist/PPO-Greenhouse-Blueprint-and-Screen-Calculator-r10.html` as sources, not executable application authority. R10 must match SHA-256 `9578be7aca13bbfc81a8f6c2c1b7359228079c88f6bb76a9f801681c8a4cf5c2` unless a later explicitly identified source supersedes it. Existing source snapshots must remain unchanged. Current user instructions override embedded historical instructions and approval gates.

The audit pinned main at `0c95c5af776c97374997623bd1070d9de480cf82` on 22 September 2026. At its first inspection, PR #277, “Implement native Priva fertigation scopes and valve workflows”, was open on `feat/priva-fertigation-native` at `9fa8bd5a40232e4f432b431a235bdb34a9dbbebe`, including migration 0042. At publication #277 had merged (2026-09-22 10:22:56 UTC), final head `876e92ab288b682e85f58773c7b02e340a7ab63e`, and remote main was `d6251b42f5c969f537a6397c1823f8c871e4d4d1`. These values are history, not your implementation baseline.

Execute **WP-G00 as the first bounded checkpoint**. Verify repository access, all worktrees/dirty state, remote main and the current disposition/head of #277 and other relevant contributions. Preserve every unrelated branch, worktree and uncommitted file. Do not work on, modify, reset, rebase or commit to the fertigation branch. Do not create a build branch from the old audit branch. Use a separate VS Code window and new isolated worktree/feature branch from the appropriate updated main after concurrent work has resolved. If #277 is still open/unresolved, continue only read-only reconciliation/documentation and report the unresolved prerequisite before native edits unless Dean explicitly changes that boundary.

Record the new full commit SHA. Review all intervening changes, particularly Specialist/Discovery/cost-basis services, `discovery-costing.tsx`, `estimation-wizard.tsx`, receipt dispatch, module-workspace/navigation registry, shared menu CSS, permissions, migration registry/demo upgrade guard and their exact tests. Preserve Priva's handovers, original-operation recovery and route/CI integration. Inspect the actual permitted synthetic schema and all later migrations, not only the files that originally created the objects. Refresh the plan/register where evidence changed before implementation. Allocate a migration number only from this then-current baseline; the audit reserved none.

Deliver WP-G01–G09 in dependency order with a maintained checkpoint and a reviewable branch/PR. Keep ES-08 / EST-06 / E5, CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009 intact. Retain existing TypeScript/React/Next/PostgreSQL technology and ADR-0034 authority. Do not add a framework, generic rules engine, infrastructure or external integration without demonstrated need and a prior architecture record.

Implement a versioned `ScreenGeometryStudy` as an owned subordinate value in new Specialist draft/run schemas. Keep schema-1 history, hashes, receipts and the recovered quantity bundle unchanged. Initially one explicitly selected physical Facility envelope per study, with the existing saved Discovery binding. Do not duplicate customer/site/project/Facility identities. Facility fields are offered observations: implement Adopt / Override / Unknown with exact identity/version, copied value/unit, measurement/source/date/actor evidence, explicit refresh and transactional source-version checks. Do not map ES-02 Text/Zones numeric text into geometry, infer family from broad Facility structure type, or depend on a nonexistent arbitrary historical Facility snapshot API.

Implement the four bounded geometry families with explicit conventions: Venlo dual peaks per module; Quonset minor circular segment/chord; Gothic pointed quadratic study curve; Sawtooth single-slope/vent geometry. Use the build plan's proposed precision policy only after validating its independent oracle/tolerance/convergence requirements and record any justified changes. Exact decimal/rational calculations remain exact; trig/curved results are labelled approximate. Numerical software tolerances are not engineering installation tolerances. Validate before iteration and preserve unknowns/raw incomplete drafts without coercing blanks to zero.

Keep the Screen Systems quantity engine as quantity authority. R10 panel count, opening, study length, net roll length, allowances and drive concept must not populate the 143 positions automatically. Default mapping is None. Direct/Derived candidates require explicit dimension/axis/grid/lookup/profile checks and reviewed reconciliation; unsupported families/material arrangements/mechanisms need a new versioned definition with supplier evidence. Preserve 14 manual quantities, six gates, five extra slots, 12 parameters, part conflicts, exact rounding and all REV/AUD/WAS findings. Geometry changes reopen review without inventing quantities or repricing.

Add **Geometry & drawings** as a local seventh ES-08 view using the existing shell, `SecondaryMenuFrame`, fields/tables/dialogs, unsaved-change controls and recovery. Use stacked front/side/plan technical sheets, linked panel/section inspector, schedule and findings; retain native quantity cut/bay working. Reuse current r22/shared tokens and declared full-bleed module/scroll ownership. No iframe, copied standalone shell or localStorage business persistence. Correct the observed r10 plan hit-test mismatch with one shared transform. Provide keyboard panel selection/pan/fit and numeric equivalents; preserve focus and responsive readability.

Save server-computed study inputs/results/schedules/drawing model/definition/precision/source/review hashes atomically with the native run/resolved set. Retain canonical sheet and renderer versions so old drawings do not consult current sources or viewport. Exact-run SVG/CSV/print exports must be safe, permission checked and clearly **Preliminary estimating/coordination study — not for construction or fabrication**. No unrestricted r10 JSON restore. SharePoint remains intended document authority; native CAD keeps authoring; no live connector or formal drawing issue is implied.

Preserve original-operation lock/replay/terminal-closure semantics, scoped authority, expected versions and atomicity. Keep estimate receiving a separate explicit preview/accept transaction. Existing synthetic receiving policy must not accidentally ignore a geometry payload; add only a separately versioned exact synthetic policy if needed for the reviewed journey. No operational eligibility flag or role bypass. B/C/N manual edits, omissions/deletions, incompatible SKU/units, source-only changes with equal totals and original quotation links must remain correct.

Run meaningful ES08-G00–G24 acceptance plus all relevant existing ES08-T checks and shared Estimating/Facilities/fertigation regressions. The key regression is identical all-143-position exact quantities and legacy hashes when no new verified mapping is activated, across the existing 28 scenarios and attached family studies. Independently derive expected maths; r10 output alone is not the oracle. Prove source adoption/drift, schema-1/2 history, concurrent save, lost-response/reload recovery, permissions, estimate receiving, earlier quotation immutability, compiled browser, keyboard, responsive and canonical export evidence. Use only task-owned servers and `ppo_synthetic_test`; preserve the current runtime pins and CI lanes. Report actual checks, not planned passes.

If adding a migration, update every current AGENTS exact registry consumer and seed-order/count obligation; inspect the hosted-demo upgrade review gate before changing it. Honour deferred identity constraints for cross-0026 upgrades when applicable. No new capability/grant is planned; if evidence requires one, fulfil all generation/label/count/allowlist and upgrade obligations. Never weaken regression checks or mutate old evidence to pass.

Primary proof: open saved configuration → receive/select authorised Facility/Discovery → adopt/enter geometry → choose family and material basis → front/side/plan → inspect panel/calculation → preliminary schedule → review/save immutable run → change relevant input → stale/review checks → compare/save successor → reopen original unchanged → preview and reject/accept exact estimate contribution → prove old quotation remains on original estimate version. Include source drift and original-operation recovery.

Finish with the exact source/build commit, files and schema changes, independent arithmetic and integration/browser results, deviations from r10, supplier/engineering/commercial gaps, PR link and next bounded step. Keep code completion separate from business acceptance. Do not deploy, migrate a production/development business database, write ERP/SharePoint, communicate with customers, release procurement or merge without applicable authorisation.
