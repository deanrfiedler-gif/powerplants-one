---
document_id: PPO-FERT-LIVE-PROMPT
revision: r01
date: 2026-09-24
owner: Dean Fiedler
status: Copy-ready future prompt. Issuing it authorises the build it describes; merge and hosted deployment follow only the issue parameters Dean sets.
source_commit: 7faeb96b13ee400a6d92b3c7d450a8ac66077d33 (PR #313 head; main observed at 72b27694462a176529dc68343526dfda215cd298)
---

# Live Priva Fertigation Configurator: build and release prompt

Paste the text below the rule into a new Claude Code session on `deanrfiedler-gif/powerplants-one`. Set the four issue parameters first; a blank parameter takes its stated default. The state table reflects 24 September 2026 and must be re-verified; it is not authority.

---

Build the **live Priva Fertigation Configurator** in `deanrfiedler-gif/powerplants-one` and prepare it for release to the Powerplants One hosted private demo. The target is the native ES-02 fertigation module, not a copy of the standalone r02 HTML. It includes routes `/estimating/fertigation`, `/estimating/fertigation/new` and `/estimating/fertigation/[id]`. Bring it to parity with the approved direction of the Priva fertigation workbench refinement board, as far as native rules allow. Then prove it in the compiled application and CI, and on the hosted demo where authorised. Do not stop at a visual scaffold.

## Issue parameters (Dean sets these when issuing)

| Parameter | Options | Default if blank |
|---|---|---|
| Merge | Authorised once every check on the PR head passes · Not authorised | Not authorised |
| Hosted deployment | None · `check` only · `deploy` · `upgrade-and-deploy` | None |
| Calculation edition r02 (F10, F11 and missing phase findings) | Build after its ADR · ADR only | ADR only |
| Required save reason (A9) | Build after its ADR · ADR only | ADR only |

"Live" means the Azure private demo: synthetic data, invited testers and Entra sign-in. It never means production. This prompt authorises no production database, MYOB, SharePoint, customer communication, supplier conclusion or production integration.

## 1. Read first

Read these in full before editing:

- `AGENTS.md`, `README.md`, `docs/STATUS.md` and the ES-02/EST-02/03/06 scope in `docs/blueprints/BP-01-master-blueprint.md`.
- Decisions:
  - `docs/decisions/ADR-0038-priva-fertigation-native.md`;
  - `docs/decisions/ADR-0044-fertigation-held-import-placement.md`;
  - `docs/decisions/fertigation-workbench-refinement.md`, the governing record for D1–D7, A1–A9 and F1–F12, including its corrections and "If accepted" steps;
  - `docs/decisions/notice-accent-rule-departure.md`;
  - `docs/decisions/ADR-0022-maintained-browser-runtime.md`.
- Delivery and testing: `docs/delivery/priva-fertigation-native-handover.md`, `docs/delivery/priva-fertigation-native-implementation-plan.md` and `docs/testing/priva-fertigation-native-matrix.csv`. Continue its IDs from the highest FN-T number; FN-T116 was the last at issue.
- Design register:
  - `docs/design/development/README.md`;
  - `docs/design/development/components/README.md`;
  - the three `docs/design/development/pages/route-estimating-fertigation*.md` contracts and their `guides.json` entries.
- Standards: `docs/standards/html-module-conformance.md`, `docs/standards/ui-style-specification.md`, `docs/standards/ui-baselines.json` and `docs/standards/naming-conventions.md` (PPO-STD-001).
- Release path:
  - `docs/delivery/azure-private-demo.md`;
  - `.github/workflows/azure-demo-deploy.yml`;
  - `scripts/demo-upgrade.ts` and its `latestMigrationVersion` review gate;
  - `scripts/migration-registry.ts`;
  - `src/platform/demo-roles.ts`.
- Source, not authority: `reference/ui/priva-fertigation-scoping-workbench-r02.html`, which must match SHA-256 `b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9`. Retained snapshots stay byte-identical.
- The board: the private claude.ai design canvas "Priva Fertigation Workbench" (version 8, 21 artboards), https://claude.ai/artifact/GgjSx8kvQcsZPfGbuGn8in. Read it with the Artifact tool if this session can. If it cannot, work from the refinement record and say so. The board is proposed design, not an accepted baseline.

Current user instructions override historical approval gates embedded in these documents.

## 2. Checkpoint 0: establish the baseline before any edit

1. Verify repository access, worktrees, dirty state and the current remote `main`. Record its full SHA. Preserve every unrelated branch, worktree and uncommitted file.
2. Establish the state of PR #313 ("Fertigation F1: place held r02 fields on import and list the declarations the draft needs"):
   - If merged, start from updated `main`.
   - If open, it is this work's prerequisite: drive it to green under the Merge parameter before building on it.
   - Never rewrite its history.
3. List open PRs touching `src/estimating/fertigation/`, `src/components/fertigation-*`, the migration registry, permissions or the demo scripts. Also record the current highest migration and the `latestMigrationVersion` value in `scripts/demo-upgrade.ts`. The gate read 44 at issue.
4. Verify the state table below against the code, one row at a time, and correct it in your first checkpoint report.
5. Work on one feature branch from updated `main`. Keep PRs reviewable. Where a work package changes a rule, raise its ADR before writing its code.

State at issue (verify):

| Item | State on 24 September 2026 |
|---|---|
| D1 grouped menu with severity badges; D7 native severities and responsible roles | Built (#295) |
| F2 resolve, F3 trace, F4 capacity, F5 output readiness, F6 next actions, F7 report r02, F9 compare | Built (#295) |
| F1 placement (ADR-0044) and declarations D-01–D-12 | Built in #313 |
| D2 record-workspace header and context row | Not built; the current header is title, one context line and three buttons |
| D3 chart-only fills (#8896a8 prepare, #5b9bc0 flush, #c4553f conflict share, #c4851a incomplete share) | Not built; not in the UI style specification |
| D4 one visual treatment per ADR-0038 result state ("Not recorded", "To confirm", "Excluded in scenario", basis tag) | Not built |
| D5 unit configurator comparison table (family envelope against requirement; indicative read) | Not built |
| D6 remaining: head build-up bars, single-cycle timeline, channel-by-channel I/O map, round axis steps | Partly built (pump-duty chart; grouped scope review) |
| F8 site-visit capture (phone) | Not built |
| F10/F11 new checks, first arrival, stock endurance | Not built; needs calculation edition r02 |
| F12 device-to-channel allocation | Not built |
| A9 required save reason | Not built; changes three save journeys |
| Board corrections (review allowed with open findings; injection breach is a candidate failure; missing phase findings for scenario, bank and controller) | Recorded in the refinement record; board not yet updated |

## 3. Work packages, in order

Each package lists its acceptance.

**WP-L1 Board and record alignment.**
- Update the board with the three corrections if the Artifact tool can edit it; otherwise record why not.
- In the refinement record, mark each D and F item Built, Built pending acceptance, Deferred or Rejected, with evidence links.
- Dean's direction of 23 September 2026 authorises building D2–D6. It does not accept them as a baseline. Register nothing in `ui-baselines.json` until Dean records a visual review.

**WP-L2 Presentation departures D2–D6.**
- Build in the native shell with shared tokens and existing components (`FertigationFrame`, `SecondaryMenuFrame`, `FertigationDialog`, fields, tables). No iframe, no copied standalone shell, no new framework.
- D2: the record header shows scope name and reference, the saved revision, History, Report and one primary action (Save revision). The context row shows Discovery binding, source state, stage, scenario and a synthetic tag.
- D3: add the four fills to the UI style specification as chart-only values, never status tokens. Verify WCAG 1.4.11 contrast (at least 3:1) with a script.
- D4: one treatment per ADR-0038 result state, driven by the engine's `state`, never inferred.
- D5: apply both of the record's conditions. Per-row project status returns as soon as any family has an exact configuration. The indicative read stays labelled indicative, never a rating.
- D6: the head build-up must sum exactly to the engine's required head. The timeline uses the engine's schedule events. The I/O map uses recorded banks and devices only. Axes use round steps with 11–14 px text at real container width.
- Acceptance: each view at 1440 × 960, 1024 × 768, 390 × 844 and 320 px, with:
  - no horizontal page scroll;
  - keyboard order and focus return;
  - 200% zoom;
  - status in words, not colour alone.

**WP-L3 F12 device-to-channel allocation** (Controls & I/O).
- Reconcile declared bank demand with recorded devices, channel by channel. Reuse the `io_reconcile` resolution register; never invent devices or channels.
- Acceptance: unit and browser tests on a scope where the declared and device-derived demand agree, and on one where they differ.

**WP-L4 A9 required save reason.**
- Raise an ADR: a blank reason is refused by the server and the client in all three save journeys, with migration of the existing default text left unchanged in history.
- Build only if the parameter says so. Update every affected test; never weaken an assertion.

**WP-L5 F8 site-visit capture (phone).**
- Plan captures from the weakest inputs in the sizing chain, using evidence status order Measured, Documented, Customer advised, Assumed, Unknown.
- Record captured evidence in the working draft through the existing evidence and PNG path (FN-T38 rules: exact bytes, active content rejected, permission checked).
- Make no offline claim; if offline is wanted, raise it separately.
- Acceptance: a phone journey at 390 × 844 capturing one measurement and one photograph, both reopened unchanged after save and reload.

**WP-L6 Calculation edition `PPO-FERT-NATIVE-CALC-r02`.**
- Raise an ADR covering:
  - F10: scenario timing against a radiation-sum start, a missing acid channel with no water analysis, and excess head at the smallest group;
  - F11: first arrival through the pump path and stock endurance;
  - phase findings for scenarios, I/O banks and controllers, which r01 gates on without reporting.
- Build only if the parameter says so. Retained revisions and outputs keep edition r01 and their bytes. Derive expected values independently in tests; the engine is not its own oracle.
- The declarations register must then map the new codes.

**WP-L7 Hosted-demo readiness.**
- Check that an invited tester can reach the module. Read `src/platform/demo-roles.ts`, the demo seeds and the fertigation capability checks (`estimating.read`, `estimating.edit` at issue). If a grant or capability must change, meet every AGENTS obligation: access-review regeneration on LF bytes, labels, pinned sizes, the reseed allowlist, the Estimating upgrade grant snapshots and the demo user count.
- Check that the container image renders the report PDF (ADR-0022 runtime). A local `RenderOrStorageFailure` is not evidence either way.
- Write a hosted rehearsal recipe in the handover. Use the committed synthetic `tests/fixtures/fertigation-r02-sample-export.json` to follow the journey:
  1. Create from a saved Discovery alternative.
  2. Import the r02 file.
  3. Place held fields.
  4. Work the declarations.
  5. Calculate.
  6. Save a revision with a reason.
  7. Produce the customer report.
  8. Reload.
  9. Restart.
- The initial demo seeds contain no opportunities or estimates, so the recipe creates them through the app.

**WP-L8 Visual review package.**
- Capture paired board and application views for every artboard with a native counterpart, and list each departure. Add the exact references to the page contracts as evidence, not acceptance.
- Record missing images explicitly. Keep source presence, visual review, functional proof and deployment separate.

## 4. Rules that do not bend

- The engine is the only source of calculated values. Guidance, traces and declarations restate its rules and never recalculate. An offered edit states its basis: from recorded values, your declaration, or needs new input. Nothing is inferred or applied silently.
- Prefer deterministic registries keyed by native codes. Add no model-based logic, generic rules engine, framework, service or dependency without an ADR stating the reason, constraints and alternatives.
- Synthetic or approved redacted fixtures only. Keep credentials and operational data out of the repository, issues, logs and test evidence.
- Keep the customer report allowlist. Retained outputs keep their template edition and bytes.
- Preserve original-operation lock, replay and terminal closure, expected versions, scoped authority and atomicity.
- For any migration or seed, meet every AGENTS obligation: the registry consumer tests, `atVersion` and `>=18` lists, the demo upgrade count, seed order and deferred `identity_target` handling across 0026. Read the live schema, not the file that created an object. Change `latestMigrationVersion` only after reading what it guards and proving an upgrade from the currently deployed version.
- For each page, shell or component change, update the design register, page contracts, guides and component catalogue in the same PR. Run `npm run studio:sync` for new routes and `npm run studio:check` always.
- Use Australian English, metric units and dates as dd Month yyyy in prose. Name new documents to PPO-STD-001 and register them in `docs/standards/document-register.csv` with their versioning method.

## 5. Verification

Run the actual checks and report actual results:

- Locally:
  - `npm run lint`, `npm run typecheck` and `npm run test:unit`;
  - the fertigation database suites against `ppo_synthetic_test` only;
  - the compiled fertigation browser suite at desktop and phone;
  - `npm run studio:check`;
  - `scripts/check_foundation.py`, `check_prototype.py` and `check_naming.py`.
- Confirm any local failure against unmodified `main` before attributing it; a sandbox without stable Chrome fails the PDF test for reasons unrelated to the change.
- CI: every check on the PR head green. "Flake" is not a root cause.
- Primary proof in the compiled app, matching the WP-L7 recipe: create from Discovery → import r02 → place → declare → calculate → trace a result → resolve a conflict → compare the draft → save with a reason → report → reopen the saved revision unchanged. Include lost-response recovery and a stale-version conflict.

## 6. Release and deployment gates

- **R1 merge:** only if the Merge parameter authorises it, every check on the head has passed, the branch is conflict-free and review threads are answered.
- **D1 check:** only if Hosted deployment is `check` or higher. Dispatch "Update Azure private demo" on `main` with `operation: check` and read its result.
- **D2 deploy:** only if the parameter is `deploy` or `upgrade-and-deploy`. Use `upgrade-and-deploy` only when this release adds migrations and the upgrade has been reviewed and proved.
- The `ppo-demo` environment approval, Azure portal steps, Entra assignments and every secret stay with Dean. Never ask for, echo or store a credential.
- **D3 live checks:**
  - an anonymous browser is refused;
  - the invited owner signs in, and a non-allowlisted account is denied;
  - the fertigation rehearsal completes on desktop and phone;
  - the report PDF bytes replay after an app restart;
  - removing a tester ends their session.
- Record the deployed SHA, image digest, time and each outcome in the handover and on the release PR.

## 7. Stop and ask

Stop and report before continuing if any of these occur:

- the baseline conflicts with this prompt;
- a package needs a migration, capability or grant that this prompt did not foresee;
- an ADR decision is needed that no parameter covers;
- a check fails outside the change and no fix exists;
- a hosted prerequisite (running demo, tester access, image renderer) is missing.

Never skip, disable or quarantine a test. Never push an empty commit to re-run CI, and never force-push a shared branch.

## 8. Report

Finish with:

1. baseline and final SHAs;
2. for each package: what was built, with its D, F, A, FN-T and UI IDs, files, schema and permission changes;
3. checks run with actual results, and the checks not run with the reason;
4. departures from the board and from r02;
5. open acceptance items (visual review, owner acceptance, supplier evidence);
6. release and deployment record;
7. the next bounded step.

Keep code completion, CI, visual review, owner acceptance and deployment as separate statements. Update `docs/STATUS.md` and the fertigation handover in the same PR.
