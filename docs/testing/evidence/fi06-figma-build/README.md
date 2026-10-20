# FI-06 accepted design implementation evidence

Owner visual review: **pending**. Technical inspection by the implementing agent on 21 October 2026 is not owner acceptance, independent review or deployment.

Authority: [accepted design](../../../decisions/incidents-figma-design.md), private Figma file “PPO - Design”, named version “Incidents and corrective actions — accepted”. Page `1348:2972`; notes `1355:2930`.

## Build plan and claim

- Refine the existing register, incident record, triage and report form in `src/incidents/` and `src/app/incidents.css`.
- Reuse the shell, RegisterTable, RegisterChip, Button, Field, LocalDateTimeField, RecordTabs/RecordPanel, WorklistPanel/WorklistMenu and recoverable commands. Add only FI-06 presentation helpers.
- Extend the existing permission-checked incident reads for register columns and view counts; retain all command authority and exact-scope holds. Use synthetic fixtures. No migration, capability, dependency or deployment is planned.
- Add the accepted reporting handover to the existing visit menus with narrow changes. Keep Source reference explicitly decided in the build record.
- Update the four FI-06 page contracts, register and guides, component consumer bindings, generated build sequence and status fragment in this PR.
- Verify filters, state handling, site-time conversion, permissions, submission recovery, handovers, and desktop/tablet/390/320 layouts. Run repository assurance and report environmental limits separately.

Risks: bounded register reads must not imply global counts; existing command recovery must survive presentation changes; the design's synthetic display references may differ from existing stored identities. Undrawn flows retain existing authority and remain documented gaps. Conversations is outside this build.

## Source and implementation

The implementation refines the existing FI-06 routes and commands. It changes no migration, capability, seed, dependency, hold or closure policy. Source reference is retained explicitly in the [implementation decision](../../../decisions/incidents-figma-build.md). Current action-owner names are display data; their stable IDs and assignment checks remain authoritative. The register exposes matching filters/counts over the existing latest-200 permission-checked candidate window.

Live Figma metadata, variables, design context, notes and screenshots were inspected, and cross-checked against the unchanged [retained icon-free reference](../../../reference/ui/quality-site-assurance/incidents-design-r01/README.md). The page contracts contain the full source-node mapping. No private file key, file link or Pro artwork is retained in this evidence.

## Visual comparison

Application captures use deliberately synthetic API fixtures in `tests/helpers/incident-design-fixture.ts`. They show layout and presentation behaviour, **not persisted command authority**. Font Awesome network requests are blocked in these captures; only existing repository fallback icons render. Runtime continues to use the existing Kit mapping. No reference image was modified.

| Application capture | Accepted node / state | Viewport |
|---|---|---|
| `register-1440.png` | `1348:3008` register | 1440 × 900 |
| `register-1024.png` | `1348:3756` tablet, collapsed primary rail | 1024 × 900 |
| `submitted.png` | `1348:3253` submitted and held | 1440 × 900 |
| `triage.png` | `1348:3382` editable triage | 1440 × 900 |
| `accepting-evidence.png` | `1348:3516` exact evidence decision | 1440 × 900 |
| `ready-to-close.png` | `1348:4410` accepted, still held | 1440 × 900 |
| `saved-draft-1440.png` | `1348:3653` saved report draft | 1440 × 900 |
| `saved-draft-390.png` | `1348:3985` phone form | 390 × 1477 |
| `saved-draft-320.png` | `1354:3721` narrow phone form | 320 × 1625 |
| `submit-sheet-390.png` | `1354:3275` confirmation sheet | 390 × 844 |
| `reporter-390.png` | `1348:4149` reporter held view | 390 × 844 |
| `not-connected-390.png` | `1354:3435` not connected | 390 × 844 |
| `uncertain-submit-390.png` | `1354:3571` original operation recovery | 390 × 844 |

Additional empty, denied, loading, failed-read, partial-record and 320 px viewport states are exercised by the browser spec. Accepted images are missing for these states, the phone register, tablet record and full Evidence/History/rebinding/reopening flows; shared patterns are used without asserting new design acceptance.

The comparison corrected register row height, record columns, neutral workspace surface, phone classification wrapping, duplicate phone title, pinned form actions and the submit sheet's extra shared footer. The record has one measured content scroll owner. The phone action bar remains visible and disappears on other mounted tabs. Keyboard Escape restores confirmation/menu focus; offline disables writes without losing entered facts; an uncertain submit retries the exact same payload and operation ID.

Remaining differences are explicit: synthetic content and actual stored identities differ from illustrated examples; Source reference adds a required provenance field; native date controls and separate owner/due controls have browser-specific geometry; existing shell/phone navigation and rail preference are retained; sections remain expanded; files are appended after saving via Evidence; one exact file is selected per action and return affects the incident; the closure preview is an unissued summary, with retained HTML/PDF only after successful closure. Missing customer/crew/job-pack context is not invented. Conversations is omitted as requested. These differences are for owner review, not silently accepted exceptions.

## Verification ledger

Base: unmodified `main` at `4c1097cc`. Windows uses the existing shared dependency installation through a worktree junction: Node 24.22.0 and Next 16.4.0 (the lock expects Next 16.4.2). Results below are local evidence and do not substitute for a locked Linux run.

| Check | Result |
|---|---|
| `npm run lint` | Passed; final changed TypeScript files checked again. |
| `npm run typecheck` / `tsc --noEmit` | Passed; final read-display additions checked again. |
| `npm run studio:check` | Passed. Review status stays pending; no fingerprints copied. |
| `python scripts/check_naming.py` | Passed. |
| `python scripts/check_foundation.py` | Passed: 78 parent requirements, 22 issued sources, no errors. Documentation assurance only. |
| `python scripts/build-ui-sequence.py` | Derived 366 entries: 363 placed, three excluded. Generated output is ignored by the repository workflow. |
| `python scripts/build_status.py` | Generated status and decisions index from the new fragment. |
| `npm run test:unit` | Initial run: 956/966 passed. Catalogue dependency assertion fixed and its focused rerun passed. The two new FI-06 presentation tests pass. See limits below. |
| Focused browser spec | Six tests passed. Final screenshots/checks repeated after layout refinements; no horizontal page overflow at 1440, 1024, 390 or 320 px. |
| Existing FI-06 database suite | Initial run: two passed, four failed (two connection timeouts; two `RenderOrStorageFailure`). Retest results recorded below. |
| `npm run build` | Failed because Turbopack refuses the external `node_modules` junction; reproduced on unmodified base. The `--webpack` fallback was stopped after about 18 minutes without leaving “Creating an optimized production build”; no completed production build claimed. |
| Existing compiled browser journey | Updated for the new controls; no successful final compiled run claimed locally. |

The initial unit failures also included Windows private-store/path checks and CLI/CPQ/launcher time budgets. A focused 32-test base comparison reproduced five failures (CPQ workload timing, both document-store checks, launcher timeout and recovery path); the branch focused rerun passed 28/32 including the repaired catalogue and exact CPQ checks. Timing failures varied across runs. The full unit suite is **not** claimed green and non-reproduced failures remain a validation limit.

Persisted tests use only a task-owned `ppo_synthetic_test` database. Existing migrations and seeds were applied unchanged. The disposable cluster disables crash-durability settings for this local test run; this is no durability or operational-data proof. The full incident journey passed on unmodified base. Final branch retest: pending when this ledger was prepared.

CI on the initial claim commit passed Documentation assurance, Development register integrity, dependency audit and merged-tree checks. Application/browser jobs failed before their proofs at the existing controlled-browser gate: the installer provided Chrome 156 while the repository permits majors 153–155. That run contains no implementation proof. Current-head CI status belongs to the PR, separately from this dated local evidence.

## Remaining review

Owner review of the stated visual adaptations and missing accepted-state images remains open. Physical-device, screen-reader and 200% zoom review were not performed for this change. No independent code review, owner visual review, production approval or deployment is claimed. The historical FI-06 evidence remains unchanged and is not relabelled as proof of this implementation.
