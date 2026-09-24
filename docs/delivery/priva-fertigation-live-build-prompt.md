---
document_id: PPO-FERT-LIVE-PROMPT
revision: r02
date: 2026-09-24
owner: Dean Fiedler
status: Copy-ready future prompt. Issuing it authorises the build it describes; merge and hosted deployment follow only the issue parameters Dean sets.
source_commit: 7c9978c (PR #313 branch; main observed at 72b27694462a176529dc68343526dfda215cd298)
---

# Live Priva Fertigation Configurator: build and release prompt

Paste the text below the rule into a new Claude Code session on `deanrfiedler-gif/powerplants-one`. Set the four issue parameters first; a blank parameter takes its stated default. The state table reflects 24 September 2026 and must be re-verified; it is not authority.

r02 of this prompt makes the retained design board captures the visual target and board parity a pass/fail gate. It also adds the board items r01 missed: import-screen parity, phone Overview parity, sensitivity and break-even, and the state sheet.

---

Build the **live Priva Fertigation Configurator** in `deanrfiedler-gif/powerplants-one` so that it matches the retained design board, and prepare it for release to the Powerplants One hosted private demo.

- **Target.** The native ES-02 fertigation module on routes `/estimating/fertigation`, `/estimating/fertigation/new` and `/estimating/fertigation/[id]`. It is not a copy of the standalone r02 HTML or of the board's markup.
- **Proof.** The compiled application and CI, and the hosted demo where the issue parameters authorise it.
- Do not stop at a visual scaffold.

## Issue parameters (Dean sets these when issuing)

| Parameter | Options | Default if blank |
|---|---|---|
| Merge | Authorised once every check on the PR head passes · Not authorised | Not authorised |
| Hosted deployment | None · `check` only · `deploy` · `upgrade-and-deploy` | None |
| Calculation edition r02 (F10, F11, sensitivity and break-even, missing phase findings) | Build after its ADR · ADR only | ADR only |
| Required save reason (A9) | Build after its ADR · ADR only | ADR only |

"Live" means the Azure private demo: synthetic data, invited testers and Entra sign-in. It never means production. This prompt authorises no production database, MYOB, SharePoint, customer communication, supplier conclusion or production integration.

## 1. The visual target and what "match the board" means

The visual target is the set of **retained captures** in `docs/reference/ui/estimating/fertigation-design-board-r01/`. Their README gives each artboard's size, SHA-256, native counterpart and the board statements that native rules supersede. The private claude.ai board (https://claude.ai/artifact/GgjSx8kvQcsZPfGbuGn8in, version 8) is the source of those captures. Open it only to inspect interaction. The retained captures govern; if the board has changed since, say so and do not follow the newer version without Dean's instruction.

Matching the board means, for every artboard with a native counterpart:

- **The captures govern:** regions, their order and hierarchy, component types, labels and wording, the actions offered, and the set of states.
- **Native rules govern:** calculated values (the engine only), result states and severities (ADR-0038), import behaviour (ADR-0044), permissions, save and recovery. Where the board disagrees, build the native rule and record a departure. Never reproduce a superseded statement listed in the capture README.
- **Not the criterion:** pixel identity. Real scopes, the shared shell, shared components and font availability make pixels differ. Compare like for like with `boardReferenceScope()` from `tests/helpers/fertigation-board-scope.ts`, which reproduces the board's figures (FN-T117 pins them).

Every difference ends as one of three things: fixed; a departure citing the native rule or record that requires it; or a departure awaiting Dean's decision. Nothing is left unassessed.

## 2. Read first

Read these in full before editing:

- `AGENTS.md`, `README.md`, `docs/STATUS.md` and the ES-02/EST-02/03/06 scope in `docs/blueprints/BP-01-master-blueprint.md`.
- The capture set's `README.md` and every capture in it.
- Decisions:
  - `docs/decisions/ADR-0038-priva-fertigation-native.md`;
  - `docs/decisions/ADR-0044-fertigation-held-import-placement.md`;
  - `docs/decisions/fertigation-workbench-refinement.md`, the governing record for D1–D7, A1–A9 and F1–F12, including its corrections and "If accepted" steps;
  - `docs/decisions/notice-accent-rule-departure.md`;
  - `docs/decisions/ADR-0022-maintained-browser-runtime.md`.
- Delivery and testing: `docs/delivery/priva-fertigation-native-handover.md`, `docs/delivery/priva-fertigation-native-implementation-plan.md` and `docs/testing/priva-fertigation-native-matrix.csv`. Continue its IDs from the highest FN-T number; FN-T117 was the last at issue.
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
- Source, not authority: `reference/ui/priva-fertigation-scoping-workbench-r02.html`, which must match SHA-256 `b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9`. Retained snapshots and captures stay byte-identical.

Current user instructions override historical approval gates embedded in these documents.

## 3. Checkpoint 0: establish the baseline before any edit

1. Verify repository access, worktrees, dirty state and the current remote `main`. Record its full SHA. Preserve every unrelated branch, worktree and uncommitted file.
2. Establish the state of PR #313 ("Fertigation F1: place held r02 fields on import and list the declarations the draft needs"):
   - If merged, start from updated `main`.
   - If open, it is this work's prerequisite: drive it to green under the Merge parameter before building on it.
   - Never rewrite its history.
3. List open PRs touching `src/estimating/fertigation/`, `src/components/fertigation-*`, the migration registry, permissions or the demo scripts. Also record the current highest migration and the `latestMigrationVersion` value in `scripts/demo-upgrade.ts`. The gate read 44 at issue.
4. Verify every capture's SHA-256 against its README, and confirm FN-T117 passes.
5. Create the **board parity register** `docs/testing/priva-fertigation-board-parity.csv` before any UI work. Columns:
   - `board`, `capture`, `region`;
   - `board_element`, `application_element`;
   - `status`: `match`, `fixed`, `departure_native`, `departure_awaiting_decision`, `gated` or `not_built`;
   - `authority`: the ADR, record or parameter behind a departure;
   - `evidence`: the application capture or test ID;
   - `note`.
   Seed one row per region of every board with a native counterpart, from the current application captured with `boardReferenceScope()`. This is the baseline gap list.
6. Verify the state table below against the code, one row at a time, and correct it in your first checkpoint report.
7. Work on one feature branch from updated `main`. Keep PRs reviewable. Where a work package changes a rule, raise its ADR before writing its code.

State at issue (verify):

| Item | Board | State on 24 September 2026 |
|---|---|---|
| D1 grouped menu with severity badges; D7 native severities and responsible roles | K, 01–09 | Built (#295) |
| F2 resolve, F3 trace, F4 capacity, F5 output readiness, F6 next actions, F7 report r02, F9 compare | B, C, 01, E, F, D | Built (#295); parity with the captures not assessed |
| F1 placement (ADR-0044) and declarations D-01–D-12 | 10, 01 | Built in #313 |
| D2 record header and context row | J, 01–09 | Not built; the current header is title, one context line and three buttons |
| D3 chart-only fills (#8896a8 prepare, #5b9bc0 flush, #c4553f conflict share, #c4851a incomplete share) | I, 06 | Not built; not in the UI style specification |
| D4 one treatment per ADR-0038 result state ("Not recorded", "To confirm", "Excluded in scenario", basis tag) | H, 01–09 | Not built |
| D5 unit configurator comparison table | 07 | Not built |
| D6 remaining: head build-up bars, single-cycle timeline, channel-by-channel I/O map, round axis steps, storage chart bands | 03, 05, 06 | Partly built (pump-duty chart; grouped scope review) |
| Import screen parity: step indicator, summary tiles, Accept all proposed placements, Discovery source and "What the import keeps" panels, progress panel, placement report CSV | 10 | Not built; placement table and review tick exist |
| Phone Overview parity: section picker, bottom bar with Save and Report, 44 px targets, 16 px inputs | A | Not built; the shell's phone menu is used |
| F8 site-visit capture (phone) | G | Not built |
| F10/F11 checks, first arrival, stock endurance; sensitivity and 2.58 bar break-even | 04, 09, C | Not built; needs calculation edition r02 |
| F12 device-to-channel allocation | 05 | Not built |
| A9 required save reason | — | Not built; changes three save journeys |
| Twelve states on the state sheet | H | Not assessed |
| Board corrections (review allowed with open findings; injection breach is a candidate failure; missing phase findings) | 09, 04, A, E | Listed in the capture README; the claude.ai board not updated |

## 4. Work packages, in order

Each package lists its acceptance. Each also updates the parity register rows for the boards it touches, with evidence.

**WP-L1 Board and record alignment.**
- In the refinement record, mark each D and F item Built, Built pending acceptance, Deferred or Rejected, with evidence links.
- If the Artifact tool can edit the claude.ai board, apply the three corrections, then retain new captures as a new `fertigation-design-board-r02/` folder by the same method. Never alter r01.
- Dean's direction of 23 September 2026 authorises building D2–D6 and the parity items. It does not accept them as a baseline. Register nothing in `ui-baselines.json` until Dean records a visual review.

**WP-L2 Record workspace parity** (D2–D6; boards 01–09, A, H, I, J, K).
- Build in the native shell with shared tokens and existing components (`FertigationFrame`, `SecondaryMenuFrame`, `FertigationDialog`, fields, tables). No iframe, no copied board markup or inline-style blocks, no new framework.
- D2: match board J. The header shows scope name and reference, saved-revision state, History, Report and one primary action (Save revision). The context row shows Discovery binding and source state, stage, the operating-scenario selector and the synthetic tag.
- D3: add the four fills to the UI style specification as chart-only values, never status tokens. Verify WCAG 1.4.11 contrast (at least 3:1) with a script.
- D4: one treatment per ADR-0038 result state, driven by the engine's `state`, never inferred. Match board H's wording where native has the state; list the rest.
- D5: board 07's comparison matrix, with both of the record's conditions. Per-row project status returns as soon as any family has an exact configuration. The indicative read stays labelled indicative, never a rating.
- D6:
  - board 03's head build-up must sum exactly to the engine's required head;
  - board 06's timeline and single-cycle zoom use the engine's schedule events, and its storage chart uses round 10 m³ steps with capacity and reserve bands;
  - board 05's I/O map uses recorded banks and devices only;
  - chart text is 11–14 px at real container width.
- Phone Overview (board A): section picker, bottom bar with Save and Report, 44 px targets, 16 px inputs. Keep the shell's navigation contract; record any conflict with it as a departure.
- Acceptance: parity register rows for these boards are resolved. Each view passes at 1440 × 960, 1024 × 768, 390 × 844 and 320 px, with:
  - no horizontal page scroll;
  - keyboard order and focus return;
  - 200% zoom;
  - status in words, not colour alone.

**WP-L3 Import screen parity** (board 10).
- A four-step indicator: choose file, place legacy fields, declarations the draft will need, confirm.
- Summary tiles:
  - schema, the original SHA-256 and size;
  - identities remapped;
  - fields without a native mapping;
  - findings the draft opens with, by severity. The server computes these with the engine on the preview scope; any new response field is optional and tested.
- Accept all proposed placements. It sets each family to its proposed placement and never ticks the review box.
- The Discovery source panel and the "What the import keeps" panel.
- A progress panel with fields placed, Confirm and its reason when unavailable, and Download placement report (CSV). The report is generated deterministically from the preview: path, family, shortened value, disposition, target record. Values are labelled unverified.
- The declarations step is a read-only preview: `declarations()` on the preview scope and its calculation, stating that declarations are made on the created draft (departure_native, ADR-0044 and the capture README).
- Acceptance: board 10 regions resolved; FN-T112 still passes; a new browser test covers Accept all, the CSV bytes and the read-only declarations preview.

**WP-L4 F12 device-to-channel allocation** (board 05).
- Reconcile declared bank demand with recorded devices, channel by channel. Reuse the `io_reconcile` resolution register; never invent devices or channels.
- Acceptance: unit and browser tests on a scope where the declared and device-derived demand agree, and on one where they differ.

**WP-L5 A9 required save reason.**
- Raise an ADR: a blank reason is refused by the server and the client in all three save journeys, and existing history keeps its text.
- Build only if the parameter says so. Update every affected test; never weaken an assertion.

**WP-L6 F8 site-visit capture** (board G, phone).
- Plan captures from the weakest inputs in the sizing chain, using evidence status order Measured, Documented, Customer advised, Assumed, Unknown.
- Record captured evidence in the working draft through the existing evidence and PNG path (FN-T38 rules: exact bytes, active content rejected, permission checked).
- A reading's effect is shown only as the engine's recalculated result.
- Make no offline claim.
- Acceptance: board G regions resolved; a phone journey at 390 × 844 capturing one measurement and one photograph, both reopened unchanged after save and reload.

**WP-L7 Calculation edition `PPO-FERT-NATIVE-CALC-r02`** (boards 04, 09, C).
- Raise an ADR covering:
  - F10: scenario timing against a radiation-sum start, a missing acid channel with no water analysis, and excess head at the smallest group;
  - F11: first arrival and stock endurance;
  - the trace's sensitivity and outlet-pressure break-even, as a retained analysis or not at all;
  - phase findings for scenarios, I/O banks and controllers, which r01 gates on without reporting.
- Build only if the parameter says so. Otherwise these regions stay `gated`: shown nowhere, not even as placeholders.
- Retained revisions and outputs keep edition r01 and their bytes. Derive expected values independently in tests; the engine is not its own oracle.
- Map the new codes in the declarations and guidance registers.

**WP-L8 Hosted-demo readiness.**
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

**WP-L9 Board parity gate** (all boards; this is acceptance, not evidence gathering).
- Capture the application with `boardReferenceScope()`:
  - at each board's width: 1440 px, 390 px, and 794 px (A4) for the report;
  - at 1024 × 768 and 320 px as responsive checks.
- Commit the paired application captures, with hashes, under `docs/testing/evidence/fertigation-board-parity/`.
- Pass when:
  - every parity register row is `match`, `fixed`, `departure_native` (with its authority), `gated` (with its parameter) or `departure_awaiting_decision`;
  - no row is unassessed;
  - the twelve states on board H each have a row;
  - the report pages E and F are compared at A4.
- List the rows awaiting Dean's decision in the final report. Visual acceptance remains Dean's; do not record it for him.

## 5. Rules that do not bend

- The engine is the only source of calculated values. Guidance, traces, declarations and charts restate its rules and never recalculate. An offered edit states its basis: from recorded values, your declaration, or needs new input. Nothing is inferred or applied silently.
- Prefer deterministic registries keyed by native codes. Add no model-based logic, generic rules engine, framework, service or dependency without an ADR stating the reason, constraints and alternatives.
- Synthetic or approved redacted fixtures only. Keep credentials and operational data out of the repository, issues, logs and test evidence.
- Keep the customer report allowlist. Retained outputs keep their template edition and bytes.
- Preserve original-operation lock, replay and terminal closure, expected versions, scoped authority and atomicity.
- For any migration or seed, meet every AGENTS obligation: the registry consumer tests, `atVersion` and `>=18` lists, the demo upgrade count, seed order and deferred `identity_target` handling across 0026. Read the live schema, not the file that created an object. Change `latestMigrationVersion` only after reading what it guards and proving an upgrade from the currently deployed version.
- For each page, shell or component change, update the design register, page contracts (including Visual references), guides and component catalogue in the same PR. Run `npm run studio:sync` for new routes and `npm run studio:check` always.
- Use Australian English, metric units and dates as dd Month yyyy in prose. Name new documents to PPO-STD-001 and register them in `docs/standards/document-register.csv` with their versioning method.

## 6. Verification

Run the actual checks and report actual results:

- Locally:
  - `npm run lint`, `npm run typecheck` and `npm run test:unit`, including FN-T117;
  - the fertigation database suites against `ppo_synthetic_test` only;
  - the compiled fertigation browser suite at desktop and phone;
  - `npm run studio:check`;
  - `scripts/check_foundation.py`, `check_prototype.py` and `check_naming.py`.
- Confirm any local failure against unmodified `main` before attributing it; a sandbox without stable Chrome fails the PDF test for reasons unrelated to the change.
- CI: every check on the PR head green. "Flake" is not a root cause.
- Primary proof in the compiled app, matching the WP-L8 recipe: create from Discovery → import r02 → place → declare → calculate → trace a result → resolve a conflict → compare the draft → save with a reason → report → reopen the saved revision unchanged. Include lost-response recovery and a stale-version conflict.
- The board parity gate (WP-L9).

## 7. Release and deployment gates

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

## 8. Stop and ask

Stop and report before continuing if any of these occur:

- the baseline conflicts with this prompt;
- the captures fail their hashes;
- a package needs a migration, capability or grant that this prompt did not foresee;
- an ADR decision is needed that no parameter covers;
- a parity difference would need a native rule changed;
- a check fails outside the change and no fix exists;
- a hosted prerequisite (running demo, tester access, image renderer) is missing.

Never skip, disable or quarantine a test. Never push an empty commit to re-run CI, and never force-push a shared branch.

## 9. Report

Finish with:

1. baseline and final SHAs;
2. for each package: what was built, with its D, F, A, FN-T and UI IDs, files, schema and permission changes;
3. the parity register summary: rows by status, and every row awaiting Dean's decision;
4. checks run with actual results, and the checks not run with the reason;
5. open acceptance items (visual review, owner acceptance, supplier evidence);
6. release and deployment record;
7. the next bounded step.

Keep code completion, CI, parity, visual review, owner acceptance and deployment as separate statements. Update `docs/STATUS.md` and the fertigation handover in the same PR.
