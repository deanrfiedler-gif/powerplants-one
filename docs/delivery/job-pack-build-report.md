---
document_id: PPO-SC06-BUILD-REPORT
title: SC-06 Job Pack — build report for completing the live module
date: 2026-09-23
draft: 2
owner: Dean Fiedler
status: Draft 2. Prepared by Claude from a design, source and fixture review. Not reviewed. Items tagged "Proposed — decision" are not adopted until Dean decides them (§9).
review: None recorded. An edit is not a review (PPO-STD-001 §6.4).
scope_id: SC-06 (design register scope:SV-05; routes /service/packs/[id] and /service/packs/new)
companion_to: PPO-SC06-PLAN — docs/delivery/job-pack-integration-build-plan.md
source_commit: 743d58f2e3246eb16da8b0027f868b71d1d7ffd2
design_source: docs/reference/ui/job-pack/powerplants-one-job-pack-r03.html · 481,380 bytes · SHA-256 5b41481460984bdeb09f683b76a5ba30cdd805eb19f90735e725d01fedc6b825
intended_path: docs/delivery/job-pack-build-report.md
versioning: git
---

# SC-06 Job Pack — build report

## Document control

| Field | Value |
|---|---|
| Document | PPO-SC06-BUILD-REPORT · SC-06 Job Pack — build report for completing the live module |
| Status | Draft 2 · not reviewed |
| Owner | Dean Fiedler |
| Scope | Service Operations · SC-06 Job Pack page (design register `scope:SV-05`); routes `/service/packs/[id]` and `/service/packs/new` |
| Authority | Subordinate to `PPO-SC06-PLAN` and decisions D1–D5 in `docs/decisions/job-pack-design.md` (§0.2) |
| Source baseline | `main` at `743d58f` (PR #283 merged, 23 September 2026 12:16 AEST), re-confirmed before Draft 2 |
| Design source | Issued r03 HTML, SHA-256 `5b414814…c6b825` (byte-identical to the uploaded copy) |
| Versioning | Living working document. The filename stays stable under PPO-STD-001 §7 and the living-master decision of 23 September 2026; Git history records committed changes. This unissued copy carries its draft number here, not in its filename |
| Intended path | `docs/delivery/job-pack-build-report.md` |

### Change record

| Draft | Date | Change |
|---|---|---|
| 1 | 23 September 2026 | First issue of the working copy: current state, page specification, 24 refinements, 10 gaps, decisions D6–D10, increments I3–I7, tests, risks and records |
| 2 | 23 September 2026 | **Verified against source.** The test ledger was rebuilt from the actual test files. The D6 re-serialisation proof was prototyped against the retained fixture: all six text sections round-trip, and an adversarial value falls back. New facts recorded: the history-digest date gap (O-01), the phone-breakpoint mismatch (O-05) and response payload growth (O-04).<br>**Added:** document control; contents; user journeys J1–J8; a data-visibility matrix; layout diagrams; a worked D6 example; a visual component reference with a CSS port list; a keyboard map; a stress and edge-case matrix; increment sizing, dependencies and rollback; a traceability matrix; r03 audit-finding carry-forward; a PR checklist mapped to the repository template; open questions.<br>**Corrected:** the Pack Reviewer row in the header matrix; the 3,900 px figure is now stated as a measurement of the reference file; per-stage readiness counts must not use the phrase "criteria satisfied"; structured section parts must not add `.jp-section-head h2` elements |

## Contents

0. Read this first
1. Summary
2. Evidence and method
3. Where the module stands
4. Users, journeys and data visibility
5. Target page specification
6. Visual component reference
7. Refinements
8. Gaps and observations
9. Decisions and open questions
10. Build sequence
11. Tests and acceptance
12. Verification, evidence and pull requests
13. Traceability
14. Risks
15. Records to update
- Appendix A — File map
- Appendix B — Readable labels for stored values
- Appendix C — `section_view` contract
- Appendix D — v1 section-text formats and reader rules
- Appendix E — Reference images and register proposal
- Appendix F — Proposed departures (DP-15 onwards)
- Appendix G — Re-serialisation prototype results

---

## 0. Read this first

### 0.1 What this report is

This report reviews the accepted Job Pack design r03 against the live module on `main` at `743d58f`. It specifies everything that remains to make `/service/packs/<id>` a complete, professional page.

It is a companion to the authorised build plan `PPO-SC06-PLAN`, not a replacement for it. The plan already fixes the architecture, the constraints and decisions D1–D5. This report adds five things:

- an exact picture of what I1 and I2 delivered;
- a page specification detailed enough to build from without judgement calls;
- refinements that move the page from conformant to standout;
- the evidence behind each proposal;
- the tests and records that prove the result.

### 0.2 Order of authority

1. Dean's current instruction.
2. `PPO-SC06-PLAN` and decisions D1–D5.
3. ADR-0011, ADR-0029, `docs/contracts/document-issue-distribution.md` and BP-07 §8.
4. This report.

Where this report differs from the plan, the plan governs unless Dean adopts the difference.

### 0.3 Tags

| Tag | Meaning | May the build session implement it? |
|---|---|---|
| **Plan** | Already in the authorised plan | Yes |
| **Contract** | Exists on `main` in a merged migration or server module | Reuse; do not change |
| **Seed** | Synthetic fixture only | Do not treat as policy |
| **Proposed — within authority** | A reversible presentation refinement that restores r03 intent under the plan's constraints. It adds no state, command, permission, migration or snapshot change | Yes, in the increment named |
| **Proposed — decision** | New server read shape, a departure from accepted r03, or a choice with lasting consequences | Only after Dean adopts the decision in §9 |
| **Observation** | A fact found in source | No change implied |

### 0.4 Constraints that hold in every increment

1. **The snapshot does not change.** `snapshot()` and `PackSnapshot` keep their composition and shape. `checkPack` and `requestIssue` recompute the digest; any change turns every saved Draft into `StaleSource`.
2. **OUT-09 does not change.** This covers `packHtml`, `sectionLabels`, `templateDefinition` and the P11 branded wrapper (`src/documents/p11-render.ts`).
3. **Commands keep their contracts and replay behaviour.**
   - A dialog never rebuilds a pending body.
   - The acknowledgement `captured_at` stays fixed per issue, assignment and actor.
4. **Permission filtering stays on the server.**
   - Denied and missing are the same 404.
   - Every new projection follows `readPack`'s split between staff and recipient technician.
   - `null` means "not provided to this identity"; it is never an empty list.
5. **No migration, seed, grant or capability.**
6. **Issued reference bytes are untouched.** Nothing under `docs/reference/ui/job-pack/` changes.
7. **Out of r03 scope.** SC-14 (`DocumentScreen`) and the pack list keep their current presentation (backlog in §8).
8. **PPO-STD-002 placement.** Components in `src/documents/components/client/`; styles in `src/app/styles/job-pack.css`.
9. **Unique test names.** No new control may use an accessible name that equals, or contains as a substring, a name that a test looks up without `exact: true` (§11.1). Playwright's `name` matching is case-insensitive substring matching unless `exact` is set ([Playwright locator API](https://playwright.dev/docs/api/class-framelocator)).
10. **Section heading count.** Structured section content must not add elements matching `#jp-panel-pack .jp-section-head h2`. `packs.spec.ts` asserts exactly nine. Use `h3` or subheading paragraphs inside sections.

### 0.5 Increment order

**I3 → I4 → I6 → I7 → I5.**

- I1 and I2 are merged.
- I6 (structured section content) and I7 (professional finish) are new and depend on §9 decisions.
- I5 stays last so that its conformance proof, captures and records describe the finished page.

Start each increment from a refreshed `main`. Do not branch from `feature/sh-my-work-platform-completion` (#284), which is unrelated and has failing checks.

### 0.6 Using this report with Claude Code

Give Claude Code **one increment at a time**, citing its §10 entry and the constraints in §0.4.

- Increments I3, I4 and I5 are authorised now.
- I6 and I7 need the §9 decisions adopted first.

Each increment's "Stop and report" line lists the results that mean it must stop rather than improvise.

---

## 1. Summary

**Where the module stands.**

- I1 (#256) merged on 20 September 2026 at 09:33 AEST, and I2 (#257) at 10:50 AEST. `/service/packs/<id>` already renders:
  - the r03 frame, header, three views and the contents rail with a corrected scroll-spy;
  - the nine sections, drawn from the frozen snapshot;
  - a readiness card driven by the real policy registry;
  - the crew, record and output cards;
  - one reason-bearing dialog per controlled decision;
  - a newest-first revision timeline.
- It carries a design-conformance proof against the issued r03 file.

**What is missing.**

- **Preparation (I3).** The Preparation view still hosts the legacy form, whose standing "Preparation / change reason" field is r03 audit finding M1.
- **First preparation (I3).** `/service/packs/new` ignores `existing_pack_id`.
- **Source change and print (I4).** There is no source-change notice and no print choice.
- **Print styling (I5).** The page has no print stylesheet.
- **Entry point (I5).** The Field Technicians drawer opens the pack list, not the pack.

**Why it is not yet a standout page.**

- **Unstructured sections.** Six of nine sections show one block of machine-composed text, for example `Contact: SYN Avery Contact; Not recorded; avery@example.invalid` and `Mandatory isolation: NotApplicable.` r03 shows labelled grids, task lists, tables and checklists.
- **Weak title.** It is two reference numbers.
- **Internal values on screen.** User UUIDs appear as owners, and stored codes appear verbatim.
- **Decisions out of reach.** At 1180 px and below, the decision buttons sit below the whole pack. That is r03 audit finding U4, which r03 fixed and the live page reintroduced.

### 1.1 Principles that make this page a standout

1. **Show exactly what will be issued.** Structured content is shown only when it provably reproduces the frozen text; the exact text is always one click away.
2. **One control per decision.** Notices guide the user to the decision; they never duplicate it.
3. **Words, not codes.** No UUID, enum value or error code is ever primary text.
4. **The next step is always visible.** The state notice names it at every width.
5. **Facts stay distinct.** Prepared, checked, queued, generated, issued, sent, opened, acknowledged and dispatched are separate facts, shown as such.

### 1.2 The ten changes that matter most

| # | Change | Why it matters | Tag | Increment |
|---|---|---|---|---|
| 1 | Replace the legacy preparation form with the r03 guided view and the "Record preparation change" dialog | Removes M1; every save records its own reason and field delta | Plan | I3 |
| 2 | Structured sections, **proved** equal to the frozen text by re-serialisation, with an exact-text disclosure | The largest gap to r03; no snapshot change. Prototyped successfully on the retained fixture (Appendix G) | Proposed — decision (D6) | I6 |
| 3 | Title from the approved scope summary; work kind in the reference line | A job name, not two reference numbers | Proposed — decision (D7) | I6 |
| 4 | A "Go to …" action on each state notice | Restores U4 on tablets and phones | Proposed — within authority | I4 |
| 5 | No raw identifiers or stored codes on screen | Professional language | Proposed — decision (D10) and within authority | I3, I7 |
| 6 | Source-change notice with a derived change category | Makes BP-07 §8's review requirement visible before Check refuses | Plan (+ within authority) | I4 |
| 7 | Print preview per D3 with the unsaved-entries choice; r03 print stylesheet | Controlled output first; workbench print secondary and labelled | Plan | I4, I5 |
| 8 | Readiness grouped by blocking stage, satisfied criteria collapsed | Scannable rail; the decision rises into view | Proposed — decision (D9) | I7 |
| 9 | Per-recipient progress: task created, opened, downloaded, acknowledged | Uses existing facts; "opened" never reads as "acknowledged" | Proposed — within authority | I7 |
| 10 | One canonical pack: the drawer and planner open the actual pack; `/new` redirects | As the design decision requires | Plan | I3, I5 |

---

## 2. Evidence and method

### 2.1 Sources read (at `743d58f`)

| Area | Files |
|---|---|
| Design authority | Uploaded r03 HTML (HTML, CSS and script read in full); the r03 change record; the r02 rendered audit §4–§8; `docs/decisions/job-pack-design.md` |
| Plan and records | `docs/delivery/job-pack-integration-build-plan.md`; `docs/STATUS.md`; `AGENTS.md`; `.github/PULL_REQUEST_TEMPLATE.md`; PR #257 and commits `079d574`, `0ad41c6`, `4eba64c` |
| Live page | `src/documents/components/client/*` (five files); `src/documents/pack-view.ts`; `src/app/styles/job-pack.css` |
| Server | `src/documents/packs.ts` (`readPack`, `preparationOptions`), `context.ts` (`packContext`, `authority`, `snapshot`), `render.ts`, `p11-render.ts`, `p11-template.ts`, `validation.ts`, `http.ts`, `worker.ts`; `src/service/work-orders.ts` (`scopeDetail`, `readiness`); `src/shared/validation.ts`; `src/platform/operations.ts` (`canonical`) |
| Schema and seed | Migrations 0002 (`history_records`), 0004 (scope immutability), 0006 (pack vocabularies), appointment and site columns; `db/seed-p04.sql` (eight readiness criteria) |
| Shell | `src/components/product-navigation.tsx` (breadcrumb, phone bar); `src/app/mobile-layout.css`; `src/components/record-ui.tsx` (`useUnsavedChanges`) |
| Tests | `tests/browser/packs.spec.ts`, `job-pack-design-conformance.spec.ts`, `quality-states.spec.ts`, `field-technicians.spec.ts`; `tests/helpers/quality-prepare.ts`; `tests/fixtures/job-pack-read.json` |
| Registers | `docs/design/development/register.json`, `README.md` and SV-05 route pages; `docs/standards/ui-baselines.json`; `docs/standards/naming-conventions.md` §6, §7, §11.3; `docs/delivery/existing-modules-ui-consistency-handover.md` |

### 2.2 The uploaded files

- **The HTML is the issued r03**, byte for byte.
- **The five PNGs show that same reference, not the application.** They were opened from `file:///…/docs/reference/ui/job-pack/powerplants-one-job-pack-r03.html` in desktop Chrome.
  - The viewport is about 1,900 CSS px wide (inferred); exact width, zoom and device pixel ratio are not recorded.
  - At that width r03's ≥ 1700 px rule applies: 238 / fluid / 290 columns, 24 px gaps.
  - They illustrate the design; they are not paired reference/application captures.

### 2.3 Work done for this report

| Work | Result |
|---|---|
| Rendered r03 in headless Chromium (Playwright for Python) at 1440 × 960, 1024 × 768 and 390 × 844 | Geometry in §5.1; phone composition inspected |
| Prototyped the D6 frozen-text readers and re-serialisation (Python, evidence only, not application code) against `tests/fixtures/job-pack-read.json` | All six text sections round-trip exactly; an adversarial contact value is correctly rejected (Appendix G) |
| Compared r03 CSS classes with `job-pack.css` | CSS port list (§6.3) |
| Rebuilt the test ledger from the test files | §11.1 |
| Checked `canonical()`, `scopeDetail`, the phone navigation, `preparationOptions`, `useUnsavedChanges` and field-error keys | O-01, O-05, O-06; §5.8 bindings |

### 2.4 Limits

- **The live application was not run.** No database or application server was available. Statements about live rendering come from source at `743d58f`, and I5's paired captures must confirm them.
- **Prototype language.** The D6 prototype is Python evidence of feasibility; the application implementation is TypeScript and must pass the tests in §11.2.
- **Not done:** screen-reader, Safari, Firefox or physical-device testing; PT-27 performance measurement.

---

## 3. Where the module stands

### 3.1 Increment status

| Increment | Scope in the plan | Actual state at `743d58f` |
|---|---|---|
| I1 | Read model and view logic | **Merged**, #256. Adds criteria, policy, basis and drift, actor names, `existing_pack_id`, `GET appointments/:id/pack`, and `pack-view.ts` with eight unit tests. Its database and HTTP tests first ran in CI |
| I2 | Scope container, Job pack view, rail, decisions | **Merged**, #257, with the scroll-spy lock fix `0ad41c6`. **Also delivered the revision timeline and "Current version" card** (planned for I4), plus `job-pack-design-conformance.spec.ts` (four cases) and the retained fixture `tests/fixtures/job-pack-read.json` |
| I3 | Preparation view, change record, first save | **Not started.** The Preparation tab hosts the legacy `PreparationForm` |
| I4 | Revision history, source change, print choices | **History delivered by I2.** The source-change notice and print choices are outstanding |
| I5 | Entry points, conformance proof, print CSS, records | **Not started** |

### 3.2 Feature inventory — r03 against the live page

| r03 element | Live today | Status | Next |
|---|---|---|---|
| Scope container, 41 tokens, Roboto/Verdana, 24/16 px padding | `job-pack.css` with the tokens verbatim; shared Roboto; the module owns its scroll; `jp-` prefix | Done (DP-11, DP-14) | — |
| Breadcrumb | In-module "Service operations › Job packs › {reference}", and the shell header also shows "Service / Job packs" | Duplicated, with different root names | D8, R-17 |
| Reference line: reference · state and revision · work kind | Reference · "Job pack · {status} rNN" · "Synthetic prototype" | Partial | D7, R-02 |
| Title (job name) | "{work order ref} · {appointment ref}" | Weak | D7, R-02 |
| Customer · site · status badge | Present (`statusPresentation`) | Done | — |
| "Unsaved changes" badge (U3) | Absent | Missing | I3 |
| Print preview | "Open preparation preview" link to the server preview | Partial | I4 |
| "Prepare pack" | "Prepare successor revision" (DP-13) | Done | — |
| Other header actions | "Appointment" and "Open exact issued document", so up to four buttons | Crowded | R-09 |
| Prepared by | From the current revision | Done | — |
| Tabs, counts, arrow/Home/End | Present | Done | — |
| Tab-trailing save indicator | "Record version {n}" | Implementation detail on screen | R-10 |
| Contents rail, flags, jump select, scroll-spy (U1) | Present and proved | Done | R-12 |
| Source-change notice | Absent | Missing | I4 |
| State notice with action (U4) | No action | Regressed | R-03 |
| Nine sections | 01 is a grid; 05 is kind + summary; 06 is document rows; the other six are one frozen text block each | Partial | D6, R-01 |
| Source tag with versions and as-at | Present | Done | — |
| Readiness from registry | Present; eight criteria, flat, tall (DP-12) | Done, dense | D9, R-11 |
| Decisions in the rail | Check, Return, Queue exact output, Withdraw | Done | — |
| Crew acknowledgement | "x of y acknowledged" per recipient | Done, but opened/downloaded facts not shown | R-13 |
| Pack record | Present | Done | — |
| Output and distribution (DP-7) | Present; raw `recovery_owner_id`, follow-up `owner_id`, raw job states and error codes | Unprofessional | R-04, R-05 |
| Preparation view (three-column, guided) | Legacy single-column form with a standing reason | Missing | I3 |
| "Record preparation change" dialog | Absent | Missing | I3 |
| Revision history | Present | Done, but raw kinds; superseded acknowledgements absent | R-05, R-18, R-20 |
| Print stylesheet and running A4 header | Absent | Missing | I5 |
| Page foot with synthetic statement | Present | Done | — |
| Technician presentation | Current issue only; withdrawn and under-review wording | Done | R-01 applies |
| `/service/packs/new` | Legacy screen; `existing_pack_id` ignored | Missing | I3 |
| Entry from Field Technicians | Link to the list | Missing | I5 |

### 3.3 r03 audit findings — carried forward or not

| Finding | r03 fix | Live status | Action |
|---|---|---|---|
| M1 stale change reason | Per-save reason with field delta | Decisions fixed (I2); **preparation not yet** (legacy form) | I3 |
| M2 binary readiness | Registry outcomes, stage, exception flag | Done from the real registry | D9 for density |
| M3 no source as-at | Versions and as-at on every section; source-change notice | Tags and drift done; notice missing | I4 |
| M4 vacuous checks | Derived counts; context rows not counted | Done | — |
| M5 originating issue droppable | Required history entry | Not enforced (DP-4) | G-02 |
| M6 timestamp format | One formatter, zone from site | Done | — |
| M7 references | SYN-PPO registry | DP-10 (title, version, hash) | — |
| U1 scroll-spy | Last-section rule; jump lock | Done and proved, including the lock-start fix | — |
| U2 dialog focus | Reason field or primary; heading for information | Implemented; `packs.spec.ts` `decide()` asserts the reason field is focused | Extend to the new dialogs in I3/I4 |
| U3 no unsaved signal on phones | Header badge | Missing (no editable form yet) | I3 |
| U4 submit far from status | Notice action | **Regressed** | R-03 |
| U5 print status line | Rebuilt | Not ported | I5 |
| U6 contrast | Token fixes | Tokens verbatim; conformance spec | Keep |
| U7 semantics | Roles and labels | Done | — |
| U8/U9 rail alignment; phone context | `align-items:start`; rail foot | Done | — |
| P1–P4 print | Breaks, running header, provenance | Not ported | I5 |

### 3.4 Records already out of date

| Record | Stale content | Correct in |
|---|---|---|
| `docs/STATUS.md`, Service Operations row | "I2 … is in review" | I3 pull request |
| Plan front matter `status` | "I2 delivered for review" | I3 pull request |
| Plan §8 I4 | Lists the revision history already delivered in I2 | I3 pull request (add a note; do not rewrite history) |
| `ui-baselines.json` `job-pack-r03` | `app_route: null`, "not implemented" | I5 |
| `register.json` `scope:SV-05` and route entries | `image_paths: []` | I5 (Appendix E) |

---

## 4. Users, journeys and data visibility

### 4.1 Identities

| Identity | Capabilities that matter here | Lands on |
|---|---|---|
| Service coordinator (preparer, checker, issuer in the synthetic seed) | `pack.read`, `pack.prepare`, `pack.check`, `pack.issue` | Planner, then the pack |
| Hosted Pack Reviewer (ADR-0029) | `pack.read`, `pack.prepare`, `pack.check`; **not** `pack.issue` | `/service/packs` |
| Assigned technician (current assignment) | `pack.read`, `pack.acknowledge` on the current applicable issue | My Jobs, then the pack |
| Observer or unassigned | none in scope | The same 404 as missing |

### 4.2 Data visibility matrix

This matrix describes what `readPack` returns today, plus the proposals.

| Data | Staff (prepare, check or issue) | Assigned technician | Tag |
|---|---|---|---|
| Nine sections | Current revision | The revision of the current applicable issue only | Contract |
| Revisions and inputs | All; creator names | Permitted revision only; `created_by_name: null` | Contract |
| Checks, render jobs, follow-ups | Yes | `[]` | Contract |
| Criteria, policy, basis, drift | Yes | `null` | Contract (I1) |
| Service-history list, technical source list | Yes | `[]` | Contract |
| Issue events | Full reason | Reason replaced by "Refer to current pack applicability." | Contract |
| Distribution facts (current issue) | Yes | Yes, for all crew on that issue (O-07) | Contract |
| Recipients and acknowledgements (current issue) | Yes | Yes | Contract |
| `section_view.scope` | Full, including `asset_id` | Without `asset_id` | Proposed (D6) |
| `section_view.history` | Full, including author and source | Only the fields the frozen text already carries | Proposed (D6) |
| Owner and recovery names | Yes | n/a | Proposed (D10) |
| Acknowledgements across all issues | Yes | `null` | Proposed (D10) |

### 4.3 Journeys

Each journey is an observable end-to-end path. §11.2 lists the tests that cover each one.

**J1 — Coordinator prepares the first pack.**

1. Opens the planner, then the confirmed appointment, then "Prepare job pack".
2. `/service/packs/new?appointment_id=` opens Preparation-only mode. If a pack already exists, it redirects to that pack with a status message.
3. Completes the nine notes and selects exact sources and history.
4. Chooses **Save preparation…**. The dialog lists every field as added and asks for **Reason for this change**.
5. Chooses **Save preparation** (`POST packs`). On success the page moves to `/service/packs/{id}`: Job pack view, "Draft · not issued", r01, state notice "Draft · awaiting check".

- **Refusals** (`PackNotReady` with its blockers, or `ScopeReviewRequired`) render inside the dialog, which stays open.
- **Uncertain responses** replay byte-identically.

**J2 — Reviewer checks or returns.**

1. The Pack Reviewer opens the pack. The state notice offers "Go to Pack readiness".
2. Reads the sections and criteria.
3. Chooses **Check this revision**, gives a reason, and confirms with **Record check**. The state becomes "Checked · not issued", with the notice "An issuer queues the exact output for this checked revision" (no `can_issue`).
4. Alternatively chooses **Return preparation**, giving the reason. The state becomes Returned, and the notice shows the return reason with "Go to Preparation".

**J3 — Issuer issues.**

1. Chooses **Queue exact output for issue**, gives a reason, and confirms with **Queue output**. The job is Queued.
2. The worker, or **Process or recover original output**, verifies durable bytes and current authority and commits the issue.
3. The state becomes Issued; **Open exact issued document** becomes the header primary; crew tasks are created (distribution "Task created").

**J4 — Technician acknowledges.**

1. Opens the pack from My Jobs. Sees only the current issue's revision. The notice reads "Your acknowledgement is required" with "Go to crew acknowledgement".
2. Opens the exact issued document (recorded as "Opened").
3. Chooses **Acknowledge this exact issue as {name}**. The crew card shows "Acknowledged {stamp}".
4. When every recipient has acknowledged and the other controls are clear, the dispatch block reads "Pack dispatch checks complete".

**J5 — Schedule change after issue.**

1. The planner moves the visit. The issue becomes `needs_review`.
2. Staff see the source-change notice ("Schedule · Appointment schedule version: v3 → v4") and "Review required".
3. Staff go to Preparation and save a successor. The dialog warns about the amendment; dispatch is held.
4. The successor is checked, issued and acknowledged again (J2–J4).
5. Technicians meanwhile read "This issue is under review" (G-06: confirm the wording for an InProgress visit).

**J6 — Output failure and recovery.**

1. The job fails. The notice reads "Output recovery needed" with "Go to Output and distribution".
2. **Process or recover original output** retries the original. The retained attempts stay inspectable.
3. A `StaleSource` result instead directs the user to prepare a successor.

**J7 — Withdrawal.**

1. **Withdraw current issue** requires a reason.
2. Dispatch is held at once and an owned follow-up task appears.
3. Technicians read "This issue has been withdrawn".
4. Staff read "Issue withdrawn" with "Go to Preparation".

**J8 — Print.**

1. **Print preview** opens the server preview of the saved revision in a new tab.
2. With unsaved preparation, a choice dialog first offers "Save and print…" or "Print saved revision".
3. After issue, the controlled document is **Open exact issued document**.
4. Browser print of the workbench prints the pack view with a running header, labelled as a workbench print.

---

## 5. Target page specification

Each binding carries its tag. Where the live page already matches, the row says so, so nothing working is rebuilt by accident.

### 5.1 Frame, geometry and tokens

| Width | Layout (r03; measured where stated) | Live host adaptation |
|---|---|---|
| ≥ 1700 px | Contents 238 / pack fluid / rail 290; gap 24; section padding 26 × 30; paper heading 18 × 30 | Same rule in `job-pack.css` |
| 1181–1699 px | 220 / fluid / 258; gap 18. **Measured at 1440 px:** contents x 24 (width 220), pack x 262 (width 878), rail x 1158 (width 258) | Same; proved by the conformance spec |
| 761–1180 px | 194 / fluid. The rail moves **beneath the pack** as a two-column card grid; Pack record spans both. **Measured at 1024 px in the reference file:** rail starts at y ≈ 3,935 | Same. On the live page the offset depends on content, but it is always below all nine sections, hence R-03 |
| ≤ 760 px | Single column; 16 px padding; body 16 px; h1 24 px; "Jump to a section" select; header buttons as a full-width pair; tabs scroll sideways; 44 px targets | Same |
| height ≤ 850 / ≤ 650 px | Sticky rails static / preparation bar static | Contents rail sticky at 24 px; right rail never sticky (DP-12) |

- **Tokens:** the 41 r03 tokens stay on `#ppo-job-pack` verbatim (Contract).
- **Type:** Roboto 14/1.5; h1 26/600, −0.4 px.
- **Scroll:** the module container owns the scroll; the shell's `main` does not scroll this page.
- **Scroll-spy:** listens on the container; the last section is selected at the scroll limit; the 600 ms jump lock starts in the past.

**Phone navigation (O-05).**

- At ≤ 780 px the shell shows a fixed 64 px navy navigation bar, and `.app-frame` reserves `64px + env(safe-area-inset-bottom)` beneath the content. A bar that is sticky at the bottom of the module container therefore clears it without extra insets.
- The page's own phone breakpoint is 760 px, so between 761 and 780 px the shell is in phone mode while the page uses its tablet layout. Test 770 px explicitly; no change is proposed unless a defect appears.

**Layout — Job pack view, 1181–1699 px:**

```text
┌ Service › Job packs › SYN-PPO-PACK-000185 ──────────────────────────────────────────────────────────┐
│ SYN-PPO-PACK-000185 │ Job pack · Draft r01 │ Inspection            [Print preview] [Prepare successor revision] │
│ Climate controller inspection                                                  Prepared by (AN) Alex Nguyen │
│ Fernridge Demo Growers · Propagation house  [Draft · not issued]                                     │
│ Job pack 9 │ Preparation 2 │ Revision history                        r01 saved 10 Sep 2026 · 14:20 AEST │
├──────────────┬──────────────────────────────────────────────────┬──────────────────────────────────┤
│ PACK CONTENTS│ ⟳ Source changed since this revision was saved   │ Pack readiness                   │
│ 01 Job and…  │   Schedule · Appointment schedule version v3→v4  │ 6 of 8 criteria satisfied · …    │
│ 02 Customer… │   [Go to Preparation]                            │ Prepared against WO v3 · …       │
│ 03 Scope…  ⚠ │ ⚠ 2 readiness criteria need attention            │ ▸ Authorisation  5 of 5          │
│ …            │   [Go to Pack readiness]                         │ ▾ Booking        1 of 2          │
│ 09 Complet…  │ ┌ Technician job pack ──────────── 9 sections ┐  │   ⚠ Assigned crew competency …   │
│ ──────────── │ │ 01 Job and visit details    From WO v3 + …  │  │ ▾ Dispatch       0 of 1          │
│ Prepared     │ │ … nine sections, each ending with            │  │ Dispatch held · reasons         │
│ against …    │ │   ▸ Exact text as it will be issued          │  │ [Check this revision]           │
│ 220 px       │ └─────────────────────────────── fluid ────────┘  │ Crew acknowledgement · Pack      │
│ (sticky)     │                                                  │ record · Output (258 px)         │
└──────────────┴──────────────────────────────────────────────────┴──────────────────────────────────┘
```

**Layout — 761–1180 px and ≤ 760 px:**

```text
761–1180 px                                     ≤ 760 px
┌ contents 194 ┬ pack (fluid) ────────────┐     ┌ header, stacked; buttons as a pair ┐
│ sticky       │ notices + "Go to …"       │     │ tabs (scroll sideways)              │
│              │ nine sections             │     │ Jump to a section [select]          │
│              ├──────────────┬────────────┤     │ notices + "Go to …"                 │
│              │ Readiness    │ Crew       │     │ nine sections                       │
│              ├──────────────┴────────────┤     │ Readiness · Crew · Record · Output  │
│              │ Pack record (spans both)  │     │ page foot                           │
└──────────────┴───────────────────────────┘     └ (shell phone bar reserved beneath) ─┘
```

### 5.2 Header

| Element | Specification | Binding | Tag |
|---|---|---|---|
| Breadcrumb | Per D8. Recommended: keep the r03 in-module breadcrumb, root "Service" (the shell's name), "Job packs" linking to the register, then the reference | Static links | Proposed — decision (D8) |
| Reference line | `{display_number}` │ `Job pack · {status label} {rNN}` │ `{work kind}` | Work kind = distinct `task_kind` values of the verified scope, joined " · "; the segment is omitted when there is no verified view. "Synthetic prototype" leaves this line (the page foot carries it) | Proposed — decision (D7) |
| Title (h1) | Approved scope summary | `section_view.scope.summary` when verified; fallback `{work ref} · {appointment ref}` | Proposed — decision (D7) |
| Subtitle | **Customer** · Site · status badge · "Unsaved changes" badge while Preparation holds edits | Snapshot names; `statusPresentation`; form state | Contract; badge Plan (I3) |
| Actions | At most two buttons (matrix below) | `actions` and state | Proposed — within authority (R-09) |
| Prepared by | Avatar + name of the current revision's creator | `revision.created_by_name` | Contract |

**Header action matrix.** Visible buttons, left to right, with the primary action last:

| Identity and state | Secondary | Primary |
|---|---|---|
| `can_prepare`, current revision not issued (includes the ADR-0029 Pack Reviewer) | Print preview | Prepare successor revision |
| `can_prepare`, current revision is the current issue | Prepare successor revision | Open exact issued document |
| `can_check` or `can_issue` without `can_prepare` | — | Print preview, or Open exact issued document when issued |
| Assigned technician with a current issue | — | Open exact issued document |
| Assigned technician, no current issue | — | none |

"Appointment" leaves the header and becomes "View appointment →" in section 01 (staff).

### 5.3 Tabs

| Tab | Visible to | Count | Accessible name |
|---|---|---|---|
| Job pack | All readers | "9" | "Job pack, 9 sections" (**exact; used by tests**) |
| Preparation | Staff | Blocked criteria + 1 if any drift | "Preparation, {n} outstanding item(s)" |
| Revision history | All readers | none | Visible text |

The trailing slot shows "Unsaved preparation changes" (warning colour) when dirty, otherwise `{rNN} saved {dd Mon yyyy · HH:mm ZONE}` (R-10). The record version moves to the Pack record card only.

### 5.4 Notice slots

There are two slots at the top of the pack column: first the **source-change notice**, then the **state notice**.

- Each notice carries at most one action.
- The action switches view, or moves focus to the card that holds the decision: the card heading gets `tabIndex=-1` and is scrolled into view inside the module container.
- The action **never invokes a command**. Each decision keeps exactly one control.

**State notice.** The copy is the existing `nextStep()` copy; only the action is new.

| State (staff) | Tone | Title | Action |
|---|---|---|---|
| Draft, criteria blocked | warning | "{n} readiness criteria need attention" | Go to Pack readiness |
| Draft, none blocked, `can_check` | info | "Draft · awaiting check" | Go to Pack readiness |
| Returned | warning | "Returned for preparation" + return reason | Go to Preparation (`can_prepare`) |
| Checked, no job | info | "Checked · not issued" | Go to Pack readiness (`can_issue`) |
| Checked, job Queued, Running or Durable | info | "Exact output in preparation" | Go to Output and distribution |
| Checked, job Failed | warning | "Output recovery needed" | Go to Output and distribution |
| Checked, job StaleSource | warning | "The checked source changed" | Go to Preparation |
| Issued, dispatch held | warning | "Issued rNN · dispatch still held" | Go to Pack readiness |
| Issued, all acknowledged, clear | complete | "Issued rNN · every crew member has acknowledged" | none |
| Issued, `needs_review` | warning | "Review required" | Go to Preparation |
| Withdrawn | warning | "Issue withdrawn" | Go to Preparation |

| State (technician) | Title | Action |
|---|---|---|
| No current issue | "No current issue for your assignment" | none |
| Withdrawn | "This issue has been withdrawn" | none |
| Under review | "This issue is under review" | none |
| Own acknowledgement outstanding | "Your acknowledgement is required" | Go to crew acknowledgement |
| Acknowledged | "Issued rNN" | none |

**Source-change notice** (I4).

- **Shown when** `basis_drift` is non-empty, or an issued pack has `needs_review`, or the current revision's latest job is `StaleSource`.
- **Title:** "Source changed since this revision was saved".
- **Body:** one line per drift, as `{Category} · {source} {label}: {from} → {to}`. When `to` is null, write "current record unavailable" instead. The body ends with the sentence below.
- **Action:** "Go to Preparation" (`can_prepare`).

> "Check and issue recompute the exact sources and decide; this notice is advisory."

| Drift field | Category |
|---|---|
| `schedule_version`, `booking_hash`, `appointment_version` | Schedule |
| `assignment_version` | Crew |
| `work_version`, `scope_*` | Scope |
| `site_version` | Site |
| `customer_version` | Customer |
| `template_version`, `policy_version` | Template or policy |

The category is presentation only; it is not persisted (D2).

### 5.5 Job pack view — the nine sections

#### 5.5.1 The principle (D6, recommended option A)

A section shows **structured content only when that structure provably equals the frozen section text**. The proof: re-serialise the structure with the v1 formatter that `snapshot()` uses, and require the result to equal `snapshot.sections[key].text` byte for byte. If the proof fails, the section shows the frozen text verbatim, silently.

Every section ends with a closed disclosure, **"Exact text as it will be issued"**, showing the frozen `text` and `notes` verbatim (`white-space: pre-wrap`).

What this needs:

- no migration, no snapshot change and no OUT-09 change;
- a pure formatter module extracted byte-identically from `context.ts`;
- a scoped `section_view` read (Appendix C) for the immutable approved scope and the selected history.

The approach was prototyped on the retained fixture: all six text sections round-trip, and an adversarial value falls back (Appendix G).

#### 5.5.2 Section contract

| # | Title (D5) | Structured body | Binding | Notes subheading | Fallback |
|---|---|---|---|---|---|
| 01 | Job and visit details | Grid: Customer; Service site; Work order `{ref} · v{n}`; Appointment `{ref} · v{n}`; Visit window (long date + `HH:mm–HH:mm · ZONE (UTC±hh:mm)`, wide); Assigned crew (person + role badge, wide). Staff: "View appointment →" | Snapshot fields (Contract, live) | Visit identification notes | n/a |
| 02 | Customer arrangements | Grid: Location; Site contact; Phone; Email; Access instructions (wide); Customer date agreement, with the note "A customer date agreement is not pack acknowledgement." Staff: a warning note when the current `SiteAccess` criterion is unsatisfied ("Site access is not yet recorded as satisfied for this visit — see Pack readiness.") | Parsed frozen text with round-trip proof; note from `criteria` | Visit arrangements | Verbatim |
| 03 | Authorised scope and limits | Lead "Approved scope rNN" + summary. "Approved tasks": ordered list with task-kind badge + description, then muted "Completion: …" (one item per requirement) and "Shutdown condition: …" when present. "Scope limits" note: Exclusions, then Diagnostic limits | `section_view.scope` (verified) with round-trip proof | Technician briefing | Verbatim |
| 04 | Equipment and configuration | One grid per asset: Equipment (`{display_number} · {description}`); Identity status; Serial; Configuration (wide). Identification-only assets add an info note "Identification only · {method} · limits: {limits}". Staff: "View equipment record →" to `/equipment/{asset_id}` | `section_view.scope.items[].assets` with round-trip proof | Equipment verification notes (note box) | Verbatim |
| 05 | History and unresolved issues | Per record: date (site zone) │ `{kind label}` + confidence badge │ summary. Staff also see `{author} · {source} · {verification label}`. Empty: the frozen "No service-audience history selected…" sentence | `section_view.history` where `matches_snapshot`, plus round-trip of `{kind} ({confidence}): {summary}` | History review notes | Verbatim + warning "A selected record changed after this revision was saved; the saved text is shown." |
| 06 | Technical information | Rows: icon │ title (button, opens "Exact source" dialog) │ `Exact version {short} · {size} · SHA-256 {short}`. Staff: "Now unavailable — a successor cannot reselect it" when applicable | `snapshot.sources[]`; `pack.sources[].available` | Technical reference notes | n/a |
| 07 | Parts, tools and readiness | Controls table: Control │ Outcome (badge, readable label) │ Evidence (title · short hash). Note: "Controls as recorded when this revision was saved. Current readiness is in Pack readiness." **No "Parts" row** | Parsed control blocks with round-trip proof | Collection and preparation instructions | Verbatim |
| 08 | Site controls | Grid: Access instructions; Biosecurity. The same controls in **compact** form (label + outcome; evidence stays in 07). The frozen standing instruction as a warning note. The r03 governance note ("The site's approved procedures and work authorisations govern actual work. Pack readiness does not grant isolation, shutdown or additional work authority.") | Parsed with round-trip proof | Work arrangements | Verbatim |
| 09 | Completion and escalation | "Record the following during the visit in My Jobs." Checklist (square icons, not ticks) of every completion requirement as "Task {n} · {requirement}". The remaining frozen standing instructions as body copy. The r03 note: "These are evidence requirements, not completed checks. Actual findings, time, parts used and photos remain linked to the visit record." | Requirements from the verified scope; standing text = frozen text after the exact requirements prefix | Escalation and remaining work | Verbatim |

- **Source tags** keep the live rule: `From {source versions} · as at {revision created_at}`, with the `changed` treatment when that section's sources drifted.
- **Entry tags** for 05 and 06 stay.
- **Readable labels.** Outcome and kind codes in structured views pass through Appendix B. The exact-text disclosure keeps the raw frozen text, because that is what is issued (O-02).

**Rail flags** (R-12). A section is flagged when its sources drifted, or when a criterion mapped to it is unsatisfied:

| Criterion | Sections |
|---|---|
| `SiteAccess` | 02, 08 |
| `SiteControls`, `MandatoryIsolation`, `ShutdownAuthority`, `DispatchControls` | 08 |
| `ToolPreparation` | 07 |
| `CompetencyPlan`, `CrewCompetency` | 01 |
| Unknown code | 07 |

Screen-reader text: "Needs attention: {criterion label}".

#### 5.5.3 Worked example (retained fixture `tests/fixtures/job-pack-read.json`)

Frozen `customer_arrangements.text`:

```text
Location: Fictional site; booking address unverified
Contact: SYN Avery Contact; Not recorded; avery@example.invalid
Access: SYN access to be confirmed
Date agreement: Confirmed. This is not pack acknowledgement.
```

Rendered structure (the proof succeeds):

| Label | Value |
|---|---|
| Location | Fictional site; booking address unverified |
| Site contact | SYN Avery Contact |
| Phone | *Not recorded* (muted) |
| Email | avery@example.invalid |
| Access instructions | SYN access to be confirmed |
| Customer date agreement | Confirmed · "A customer date agreement is not pack acknowledgement." |

Frozen `readiness.text` rendered as the section 07 controls table (six rows; the proof succeeds):

| Control | Outcome | Evidence |
|---|---|---|
| Required competencies reviewed | Pass | SYN P05 reviewed scope and preparation · 19d8e0f7… |
| Mandatory isolation | Not applicable | same |
| Shutdown authority | Not applicable | same |
| Site access | Pass | same |
| Site and biosecurity controls | Pass | same |
| Tools and preparation | Pass | same |

If the contact name had contained "; " (for example "SYN Avery; Contact"), the contact would split into four parts and the proof would fail. The section would then show the frozen text verbatim; this case was tested (Appendix G).

### 5.6 Right rail

The order is Pack readiness, Crew acknowledgement, Pack record, then Output and distribution (staff). The rail scrolls with the page (DP-12).

#### 5.6.1 Pack readiness

| Part | Specification | Tag |
|---|---|---|
| Heading line | `{n} of {m} criteria satisfied · {x} permitted exception(s) · {y} not applicable`. This is the **only** element on the page using the phrase "criteria satisfied"; `packs.spec.ts` looks it up by `/^\d+ of \d+ criteria satisfied/`. Technicians see "Dispatch status for this visit" | Contract |
| Context | "Prepared against" work order vN · scope vN · appointment vN · site record vN; drift lines in warning colour with their category; "Criteria follow {policy key} v{n}" | Contract + category (within authority) |
| Criteria | **Grouped by stage in the fixed order** Authorisation, Booking, Dispatch, Completion, then any other stage. This is logical order, not the alphabetical order `readiness()` returns (O-06). Group heading `{Stage} · {a} of {b} satisfied` (no "criteria"). Unsatisfied rows first. Satisfied rows collapsed under "{k} satisfied — show" (native `<details>`). Each row: icon │ label + outcome │ reason, or the stale/expired sentence │ `{stage} stage · exception permitted / no exception permitted · {assessor}, {stamp}` │ "Valid until {date}" when set | Proposed — decision (D9) |
| Link | "Assess readiness at the appointment" (`can_prepare`) | Contract |
| Dispatch block | "Dispatch held" / "Pack dispatch checks complete" (**exact; test ledger**) + server reasons | Contract |
| Decisions | Draft or Returned + `can_check`: **Check this revision** (primary), **Return preparation**. Checked + `can_issue`: **Queue exact output for issue**. Issue present, not Withdrawn, `can_issue`: **Withdraw current issue** | Contract |
| Foot | "Readiness is checked before issue. Dispatch remains held until issue, every crew acknowledgement and the other work controls are complete." | Contract |

#### 5.6.2 Crew acknowledgement (R-13)

- **Badge:** "{a} of {n} acknowledged" (green when complete), or "Not yet requested" before issue.
- **Per recipient:** avatar; name; role (from `snapshot.recipients` by assignment); then a progress line in time order: "Task created · {date}", "Opened · {date}", "Downloaded · {date}", then **"Acknowledged {stamp}"** or "Awaiting explicit response".
- **Facts only.** Opened and downloaded are facts, not acknowledgement. There is no "Declined" (G-07).
- **Own acknowledgement:** "Acknowledge this exact issue as {name}" is unchanged. Existing copy is kept.

#### 5.6.3 Pack record

Unchanged: Revision, State (label), Work-order scope, Appointment version, Current issue (link), Readiness, Dispatch (Held/Clear) and Record version.

#### 5.6.4 Output and distribution (staff; DP-7)

- **Job rows:** `Output for {rNN}` │ state label │ `{n} attempt(s)`. An error shows a readable sentence, then "Reference: `{code}`". The recovery owner shows as a **display name** (D10).
- **Kept:** "Process or recover original output" (**exact; test ledger**), "Inspect retained generated attempt", "Download retained attempt", and the StaleSource explanation.
- **Follow-ups:** `{summary}` link │ status label │ "Owner {display name}" (D10).
- **Simulated sending:** under the subheading "Simulated sending — no message is sent", the buttons "Record simulated sending to {name}" (names unchanged); facts list as `{name}: {kind label} · {stamp}`.

### 5.7 Preparation view (I3)

**Layout:**

```text
┌ PREPARATION ┬ Prepare revision r02 ─────────────────────────────┬ Preparation status ─────┐
│ 01 … 09     │ "Every save creates a new immutable revision…"    │ Saved r01 · Draft       │
│ (error      │ 01 Job and visit details   From WO v3 + APT v3    │ Prepared against …      │
│  flags)     │   linked context (compact, from saved snapshot)   │ Readiness: 6 of 8       │
│             │   [Visit identification notes ...............]   │ satisfied               │
│             │ … 02–09 likewise, with selections in 05 and 06    │ Assess readiness …      │
│             ├───────────────────────────────────────────────────┤ Where information       │
│             │ Unsaved changes      [Discard changes] [Save preparation…] │ comes from     │
└─────────────┴──────────────────────── sticky ─────────────────────┴─────────────────────────┘
```

**Form intro.**

- Title: "Prepare revision {rNN+1}", or "Prepare the first revision".
- Text: "Every save creates a new immutable revision with its own reason."
- With a current issue, add: "Saving raises an amendment: dispatch is held at once, and a fresh check, issue and every crew acknowledgement are required."

**Each section p-1 … p-9** has:

- the section head;
- **linked context**: a compact §5.5 body taken from the latest saved snapshot, with a "View source details" disclosure. A new pack shows "Linked context is composed from the current records when you save" instead;
- the field(s).

| # | Field label | Help text | Other controls |
|---|---|---|---|
| 01 | Visit identification notes | "Required. Add anything the crew needs beyond the linked records, or state that nothing further applies." | — |
| 02 | Arrival and customer arrangements | "Meeting point, arrival agreement and visit-specific arrangements. Contact details come from the site record." | — |
| 03 | Technician briefing | "Brief the authorised tasks. Notes cannot extend the approved scope; additional work needs a new scope approval." | — |
| 04 | Equipment verification notes | "How the crew confirms equipment identity on arrival, and what to do on a discrepancy." | — |
| 05 | History review notes | "Why these records were selected, or why none apply." | History checkboxes: kind label · confidence · date, then summary (dates need D10); at most 30 |
| 06 | Technical reference notes | "What each reference is for and any limits on its use." | Exact-version checkboxes (the name must still match `/SYN visual inspection/` for the seeded source); unavailable disabled with "Unavailable — recover the original source"; 1 to 20 |
| 07 | Tools and collection instructions | "Collection and preparation instructions. Tool readiness itself is assessed at the appointment." | Read-only `ToolPreparation` summary + "Assess readiness at the appointment" (D4) |
| 08 | Visit-specific work arrangements | "Reference the site's approved requirements. Do not create permits or work authority here." | Read-only access and controls summary (D4) |
| 09 | Escalation and remaining-work instructions | "Who to contact and what to record when work cannot be completed within the approved scope." | Read-only evidence requirements from scope (DP-5) |

**Field rules.**

- All nine notes are required, 1–6000 characters (`packInput`).
- Ids stay `section-{key}` (**tests use them**).
- A remaining-character counter appears from 5,500 characters.
- Client validation mirrors the server only.
- Server `field_errors` are `{ field, message }`. `narrative()` reports the section key, and `packInput` reports `source_ids` or `history_ids`. Map them to `#section-{key}` and the selection fieldsets.
- The error summary sits above the form: `role="alert"`, focusable, one link per error, keeping `.business-error` through `ErrorNotice`.

**Right rail (preparation).**

- "Preparation status": saved revision and state; the prepared-against versions and drift; the line "Readiness: {n} of {m} satisfied" (**not** "criteria satisfied"; §5.6.1); "Assess readiness at the appointment".
- "Where information comes from": live copy.

**Sticky action bar.**

- Status text: "No unsaved changes", "Unsaved changes", "Saving…" or "Saved as {rNN}", in a `role="status"` region.
- Buttons: **Discard changes** and **Save preparation…**.
- At ≤ 780 px the bar clears the shell phone bar through the frame's reserved space (§5.1). Verify at 390 × 844 and 770 × 900.

**Draft protection.**

- Form state lives in the screen, so switching tabs keeps edits (the panel is hidden, not unmounted).
- `useUnsavedChanges(dirty, pending)` guards link navigation and unload.
- The form remounts only after a successful save.

**New route.**

- `/service/packs/new?appointment_id=` redirects with `router.replace` when `existing_pack_id` is set, with the status "A job pack already exists for this appointment — opening it."
- Otherwise it renders the same screen in Preparation-only mode: header `{work order ref} · {appointment ref}`, badge "Not yet saved", no other tabs until the first save.

### 5.8 Dialogs

All dialogs use `PackDialog` (native `<dialog>`).

- **Focus:** confirmation dialogs focus the reason field when one is required, otherwise the primary action. Information dialogs focus the heading.
- **Closing:** Escape and a backdrop click close the dialog unless a command is busy.
- **Return:** focus returns to the opener, or to the active tab if the opener has gone.

| Dialog | Opener | Body | Field | Confirm | Tag |
|---|---|---|---|---|---|
| Check revision {rNN} | Check this revision | Live | Decision / change reason | Record check | Contract |
| Return preparation {rNN} | Return preparation | Live | Decision / change reason | Record return | Contract |
| Queue exact output for {rNN} | Queue exact output for issue | Live | Decision / change reason | Queue output | Contract |
| Withdraw the current issue {rNN} | Withdraw current issue | Live | Decision / change reason | Withdraw issue | Contract |
| Record simulated sending | Record simulated sending to … | Live | Decision / change reason | Record sending | Contract |
| **Record preparation change** | Save preparation… | "Changed fields are recorded with your reason in the revision history. This save creates {rNN+1}." Amendment warning when issued. `inputDiff` change list. Optional chip "Insert change summary" (R-22) | **Reason for this change** (required, up to 2000) | Save preparation | Plan (I3) |
| Record the first preparation | Save preparation… (new) | Every field listed as added | Reason for this change | Save preparation | Plan (I3) |
| Discard unsaved preparation? | Discard changes | "Only unsaved entries are discarded; the saved revision is unchanged." | — | Discard changes | Plan (I3) |
| Print with unsaved preparation? | Print preview while dirty | "Save them first, recording a reason, or print the last saved revision. Printing does not check, issue or authorise the pack." | — | Save and print… (secondary: Print saved revision) | Plan (I4) |
| Exact source: {title} | Title in section 06 | Version, size, hash; frozen source text (pre-wrap, scrollable) | — | Close | Proposed — within authority (R-15) |

**Refusals** render inside the dialog, which stays open with its body retained for replay. `PackNotReady` blockers render as a list.

**Tests** must scope "Save preparation" and "Discard changes" lookups to the dialog, or use `exact: true` (§11.1).

### 5.9 Revision history

Keep the live newest-first timeline and "Current version" card, with these refinements (R-20):

| Event | Title | Detail |
|---|---|---|
| First revision | "Draft {rNN} prepared" | Reason + field delta |
| Later revision | "Preparation {rNN} saved" | Reason + delta |
| Check | "Revision {rNN} checked" / "Preparation {rNN} returned" | Reason |
| Render job | "Output requested for {rNN}" | `{state label} · {n} attempt(s)` + error sentence |
| Issue | "Issued {rNN}" (link) | "Exact output {filename}" |
| Issue event | Appendix B label | Reason |
| Distribution | "{kind label} · {name}" | "A distribution fact. It is not an acknowledgement and no message is sent." |
| Acknowledgement | "Acknowledged by {name} · {rNN}" | "Explicit acknowledgement of the exact issue." |

Each event carries a small `rNN` badge and one stamp format, `dd Mon yyyy · HH:mm ZONE · actor`. Superseded acknowledgements need D10.

### 5.10 Print (D3)

1. **Print preview** opens `/api/v1/packs/{id}/preview?revision_id={current}` in a new tab: the server rendering of the saved revision, marked "Preparation preview — not issued".
2. **Unsaved choice.** When preparation is dirty, the §5.8 dialog appears first.
3. **After issue,** the header offers **Open exact issued document**.
4. **Workbench print** (browser print; I5) prints the pack view only. It ports the r03 print rules:
   - a status line "SYNTHETIC EXAMPLE — NOT FOR OPERATIONAL USE · {ref} · {rNN} · {STATE} · NOT ISSUED / ISSUED {rNN}";
   - the readiness summary;
   - the source tags and preparer;
   - `@page` margin boxes with the reference, revision and state, and "Page n of N";
   - closed exact-text disclosures;
   - the label "Workbench print — the controlled document is the exact issued output".

   It **must reset the shell's clipped scroll containers** under `@media print`.

### 5.11 States

| State | Presentation |
|---|---|
| Loading | `ReadState` "Loading …" status inside `main` (PT-29 SC-06 row) |
| Denied or missing | The same 404 message; screen-reader h1 "Job pack" |
| Failed read with data retained | Retained page + error with Retry |
| No visible revision (technician before issue) | "No preparation revision is visible to this identity." + "No current issue for your assignment" |
| Command uncertain | Identical-body replay; "Saving controlled decision…" |
| Structured proof fails | Frozen text verbatim, silently (expected behaviour, not an error) |
| `criteria: null` | Readiness card shows the dispatch block only |
| `section_view: null` | All sections verbatim; title falls back |

### 5.12 Accessibility and keyboard

- **Headings:** one h1; h2 for view regions and exactly nine section titles in the pack panel; h3 inside sections.
- **Status:** never colour alone.
- **Targets and zoom:** 44 px targets on coarse pointers and at ≤ 760 px; 200 % zoom without horizontal loss; reduced motion honoured.
- **Error messages** are siblings of labels.

| Where | Keys | Behaviour |
|---|---|---|
| Page | Tab / Shift+Tab | Breadcrumb → header actions → tabs → contents rail → notice actions → sections (disclosures, links) → rail controls → foot |
| Tabs | ← → Home End; Enter/Space | Move and activate; roving tabindex |
| Contents rail | Enter | Jump; focus the section (`tabIndex=-1`); scroll-spy holds for 600 ms |
| Jump select (phone) | Arrows, Enter | Jump to the chosen section |
| Notice action | Enter/Space | Focus the target card heading, or switch to Preparation |
| Disclosures and stage groups | Enter/Space | Toggle |
| Dialog | Esc; Tab | Close unless busy; focus stays inside the modal |

No new keyboard shortcuts are introduced.

### 5.13 Language and presentation

- **Conventions:** Australian English; dates in prose as dd Month yyyy; stamps as `dd Mon yyyy · HH:mm ZONE` in the site zone.
- **No stored values on screen.** No UUID, enum value or error code as primary text. One label map (Appendix B); unknown values split their CamelCase into words; an error code appears only as small "Reference: `Code`" text.
- **Distinct facts.** Keep prepared, checked, queued, generated, issued, sent, opened, acknowledged and dispatched as separate words.
- **Synthetic marking.** "Synthetic prototype — not for operational use" in the page foot and in any workbench print.

---

## 6. Visual component reference

All values are r03's, and all colours are the r03 tokens on `#ppo-job-pack`. New components introduced by this report are built from these values; **no new colour, radius or shadow is introduced**.

### 6.1 Existing r03 components (use as specified)

| Component (`jp-` class) | Specification |
|---|---|
| Button | min-height 38; padding 8 × 13; 1 px `--hairline`; radius 6; white. **Primary:** `--navy`, white text, 500, hover `#343c4c`. **Quiet:** transparent, `--muted`. **Text button:** `--link`, underline on hover. Disabled opacity .55; 44 px on coarse pointers and ≤ 760 px |
| Badge | padding 3 × 8; radius 5; 12/1.5, 500. Tones: neutral (`--neutral-surface`/`--neutral`), warning, green (success), blue (info) |
| Notice | gap 11; 1 px border + 3 px left accent; radius 7; padding 13 × 15; 13/1.55; title 500. Variants: warning (default), `complete` (success), `info` |
| Notice action | margin-top 9; min-height 32; padding 5 × 11; white fill; toned border and text; 500 |
| Paper | white; 1 px `--line-strong`; radius 8. Heading padding 17 × 22 on `--surface-3`, h2 16/600, sub 12 muted |
| Paper section | padding 22 (26 × 30 at ≥ 1700); rule `--line`; scroll-margin 24. Head: h2 16/600 with number 12 muted, min-width 19; margin-bottom 17 |
| Source tag | 12/1.5 `--muted`, icon 13; `changed` → `--warning` |
| Info grid | 2 columns, gap 17 × 24; dt 12 muted, mb 4; dd 14; `wide` spans both; 1 column at ≤ 760 |
| Subheading · body copy | 13/500, margin 18 0 7 · 14/1.65, pre-wrap |
| Note | padding 12 × 14; 1 px `--line`; radius 6; `--surface-2`; 13/1.6 `--text-secondary`; margin-top 16; `warning` variant |
| Work list (ol) | padding-left 19; gap 9; 1.65; muted markers |
| Table | wrapper scrolls with 1 px `--line`, radius 6; fixed layout 13 px; th on `--surface`, 12/500 muted, 10 × 12; td padding 12, rule `--line-soft`; `cell-sub` 12 muted; min-width 460 inside the wrapper at ≤ 760 |
| History item | grid 88 px / 1fr, gap 14; time 12 muted; title 14/500 (h3); text 13 `--text-secondary`; 1 column at ≤ 760 |
| Document row | flex, gap 12; icon box 34 × 39, radius 5, `--surface-2` |
| Check list | gap 10; 14/1.55; square icon 16 muted (never a tick) |
| Side card | white; `--line-strong`; radius 8; heading 15 × 16, h2 14/600; body 15 × 16; p 12 muted |
| Readiness row | 13/1.45, 9 px vertical, rule `--line-soft`; icon 15 (`--success-icon`, warning for blocked, info for exception/NA); outcome 12/500; small 12 muted |
| Key row | 12 px; dt muted; dd 500 right; `held` → warning |
| Field | label 13/500; control border `--control-border`, radius 6, 9 × 11, min-height 39 (44 on phone, 16 px text); textarea min 90; help 12 muted; error 12 `--danger`; invalid border `--danger-accent` |
| Check choice | flex, gap 10, 10 px vertical, 13/1.55; `unavailable` muted |
| Form actions | sticky bottom 12 (8 on phone); 13 × 18; white; `--line-strong`; radius 8; shadow `0 3px 12px #242a3712` |
| Form errors | 13 × 15; `--danger` on `--danger-surface`, `--danger-border`; radius 6; 13 px |
| Dialog | width min(620 px, 100vw − 32); radius 10; shadow `0 18px 60px #1e293b26`. Heading 20 × 22, h2 19/600. Body 22, 14/1.65. Actions 14 × 22 on `--surface-3` |
| Change list | items 9 × 12, 1 px `--line`, radius 6, `--surface-2`, 13/1.5 |
| Timeline | padding 22; event rule `--line-strong`, 0 0 24 21; 7 px dot (source `--info-accent`, review `--success-icon`); title 14/500; text 13; stamp 12 |

### 6.2 New components (derived)

| Component | Derivation |
|---|---|
| "Exact text as it will be issued" disclosure | `<details>` with a summary styled as a text button at 12/500 `--link`; body uses **Note** styling with `white-space: pre-wrap`. Closed in print |
| Stage group (readiness) | Heading 12/500 `--muted`, as the r03 rail title, then `{a} of {b} satisfied`. The "{k} satisfied — show" summary is a text button at 12 px. Rows are unchanged Readiness rows |
| Crew progress line | 12/1.5 `--muted`, facts separated by " · "; the acknowledged fact at 500 in `--success` |
| Controls table (07) and compact list (08) | **Table** component; the outcome cell uses **Badge** tones: Pass green · Blocked warning · Unknown neutral · Permitted exception blue · Not applicable neutral |
| Save status | A `role="status"` text region in the action bar (12 px muted), which replaces r03's floating toast; no overlay |

### 6.3 CSS port list (r03 classes not yet in `job-pack.css`)

| Increment | Port (with the `jp-` prefix) |
|---|---|
| I3 | `bare-fieldset`, `check-choice` (+ `.unavailable`), `form-actions`, `form-errors`, `change-list`, `lead`, `gap-bottom` |
| I4 | `notice-action` |
| I6 | `table-wrap` with `table`, `th`, `td` and `cell-sub`; `work-list`; `check-list` |
| I5 | `print-only` and the `@media print` block |
| **Not ported, by decision** | `radio-row` (D2: no material assessment); `exception-fields` and `exception-help` (D4: no tool exception entry on this page); `toast` (replaced by the save status region) |

Modifier classes (`blocked`, `changed`, `complete`, `info`, `warning`, `green`, `blue`, `na`, `exception`, `held`, `wide`, `source`, `review`, `first`) already exist unprefixed in `job-pack.css` and stay that way.

---

## 7. Refinements

**Priority.** P1: needed for a professional first release. P2: strongly recommended. P3: finish.

| ID | Finding (evidence) | Change | Tag | Inc. | P |
|---|---|---|---|---|---|
| R-01 | Six sections render one frozen text block (`job-pack-sections.tsx`, `Section`) | Structured presentation with re-serialisation proof (§5.5) | Proposed — decision (D6) | I6 | P1 |
| R-02 | h1 is two references; the reference line says "Synthetic prototype" | Scope summary title; work kind | Proposed — decision (D7) | I6 | P1 |
| R-03 | `nextStep()` notices have no action; at ≤ 1180 px the rail sits below the whole pack (U4 regressed) | "Go to …" notice actions (§5.4) | Proposed — within authority | I4 | P1 |
| R-04 | `OutputCard` shows `recovery_owner_id` and follow-up `owner_id` UUIDs | Display names from `readPack` | Proposed — decision (D10) | I7 | P1 |
| R-05 | Stored codes shown verbatim (job state, error code, distribution kind, history kind, frozen outcome codes in structured views) | One label map (Appendix B) | Proposed — within authority | I3, I7 | P1 |
| R-06 | Legacy `PreparationForm` with a standing reason field (M1) | r03 Preparation view and change dialog (§5.7, §5.8) | Plan | I3 | P1 |
| R-07 | `/new` ignores `existing_pack_id` | Redirect | Plan | I3 | P1 |
| R-08 | Drawer and planner link to the list or to `new` | Pack identity route | Plan | I5 | P1 |
| R-09 | Up to four header buttons | Matrix in §5.2 | Proposed — within authority | I4 | P2 |
| R-10 | Tab trailing shows "Record version {n}" | Save state or last-saved stamp | Proposed — within authority | I3 | P2 |
| R-11 | Flat readiness list taller than the viewport | Stage groups; satisfied collapsed | Proposed — decision (D9) | I7 | P2 |
| R-12 | Flags cover only drift and section 07 | Criterion-to-section map | Proposed — within authority | I7 | P2 |
| R-13 | Crew card ignores distribution facts | Per-recipient progress line | Proposed — within authority | I7 | P2 |
| R-14 | History lists return only `id, kind, summary` | Add `occurred_at, confidence, author_label, source_system, source_id, verification_status` | Proposed — decision (D10) | I3 / I6 | P1 |
| R-15 | No source viewer | "Exact source" dialog | Proposed — within authority | I6 | P2 |
| R-16 | Exact frozen text only in section 06 | Disclosure on every section | Proposed — within authority (with R-01) | I6 | P1 |
| R-17 | Two breadcrumbs with different root names | Per D8 | Proposed — decision (D8) | I7 | P3 |
| R-18 | Superseded acknowledgements not on screen | Staff-only `acknowledgements[]` | Proposed — decision (D10) | I7 | P3 |
| R-19 | No print stylesheet | Port with scroll reset (§5.10) | Plan | I5 | P2 |
| R-20 | Raw timeline titles | §5.9 titles | Proposed — within authority | I7 | P2 |
| R-21 | Helper and form use "Save successor and hold dispatch" even when nothing was issued (`quality-prepare.ts:653`) | "Save preparation…" + dialog; amendment warning only when issued | Plan (I3) | I3 | P1 |
| R-22 | BP-07 §8 asks for a change category | Derived category + "Insert change summary" chip; reason stays required and editable | Proposed — within authority | I4 | P2 |
| R-23 | STATUS and the plan status line are stale | Correct in the first pull request | Plan (records) | I3 | P1 |
| R-24 | Register entries have no images | Appendix E | Proposed — within authority | I5 | P3 |
| R-25 | `packs.spec.ts` finds `/^\d+ of \d+ criteria satisfied/`, so a second match breaks it | Stage and preparation summaries avoid that phrase (§5.6.1, §5.7) | Proposed — within authority | I3, I7 | P1 |
| R-26 | r03's floating toast would overlay content | Save status region in the action bar | Proposed — within authority | I3 | P2 |
| R-27 | Shell phone breakpoint 780 vs page 760 (O-05) | Add 770 px to every viewport check | Proposed — within authority | I3, I5 | P2 |
| R-28 | Sections 07 and 08 carry identical controls text (O-02) | Full table in 07, compact list in 08 | Proposed — within authority (with R-01) | I6 | P2 |

---

## 8. Gaps and observations

### 8.1 Gaps against requirements or design intent

These gaps are not closed by r03, the plan or this report. None is fabricated into the build.

| ID | Gap | Source | Why it stays open | Recommended disposition |
|---|---|---|---|---|
| G-01 | Each section present, or carrying an allowed N/A or exception outcome with assessor and evidence | BP-07 §8 | No per-section outcome concept; the server requires nine notes | Backlog; needs a server concept and ADR-0011 review |
| G-02 | Required originating history entry (M5) | r03; DP-4 | No server rule | Backlog; could derive from `work_order_tickets` |
| G-03 | Document resolution states (Unavailable, Superseded, Permission-restricted, Retrieval-failed) | r02 rendered audit §7 | Only `available` exists | Backlog with DK-01/DK-02 |
| G-04 | Workbench titles differ from OUT-09 headings in sections 01 and 09 | D5 | OUT-09 is hash-controlled | Next OUT-09 template version (with O-02) |
| G-05 | "Record the change category" | BP-07 §8 | D2: not persisted | R-22 surfaces it in the reason |
| G-06 | An InProgress visit must not appear stopped by a server flag | BP-07 §8 | No appointment status in the pack read | Check the technician wording in I5 |
| G-07 | "Declined" acknowledgement | r02 audit §7 | No such state | Do not add |
| G-08 | Offline pack use | P08 | This page is online-only; field capture is in My Jobs | State it in the page guide |
| G-09 | Pack register is a plain card list | Register `route:/service/packs` | Outside r03 | Backlog: state, revision, visit, dispatch and acknowledgement progress |
| G-10 | `SYN-PPO-DOC` references | PPO-STD-001 §10.2 | Open naming decision | None: DP-10 stands |

### 8.2 Observations

| ID | Observation (evidence) | Consequence | Action |
|---|---|---|---|
| O-01 | `canonical()` (`src/platform/operations.ts`) serialises any object by its enumerable entries, so a `Date` becomes `{}`. The history rows digested in `snapshot()` carry `occurred_at` as a `Date`, so **the history hash does not cover the date** | A date-only change to a selected history record is not detected by the digest | `section_view` must compute `matches_snapshot` over the **identical row shape** (the same SELECT, a `Date` value), not a re-shaped object. Raise with the P06 owner; any fix moves snapshot hashes and needs its own decision (Q-02) |
| O-02 | The frozen `readiness` and `site_controls` text records raw outcome codes ("Mandatory isolation: NotApplicable."), and both sections carry the same control blocks. The issued output shows them too | Codes and duplication reach the issued document | Structured views use labels and de-duplicate (R-28). Consider readable wording in the next OUT-09 template (Q-03) |
| O-03 | `completion_requirements` is a list; the formatter embeds it with JavaScript's default comma join ("Record observations,Stop before intervention") | A comma inside one requirement is ambiguous in the issued text | Structured views use the list itself; the round-trip reproduces the join exactly |
| O-04 | `readPack` returns every revision with its full snapshot (`SELECT r.*`). The one-revision fixture is 19,325 bytes of JSON, of which the snapshot is 10,152 | Response size grows linearly with revisions and source text size | Watch in PT-27; a later revision-summary projection is possible (Q-04) |
| O-05 | The shell switches to phone layout at ≤ 780 px (`mobile-layout.css`) and reserves 64 px + safe area for its fixed bar; the page's phone rules start at ≤ 760 px | In 761–780 px the page shows its tablet layout inside the phone shell | Test 770 px (R-27); no change unless a defect appears |
| O-06 | `readiness()` orders criteria by `blocking_stage` alphabetically | A Completion stage would sort before Dispatch | Group in the fixed logical order (§5.6.1) |
| O-07 | Technicians receive distribution facts for the whole crew on the current issue | Crew can see colleagues' "Opened" facts, as they already see colleagues' acknowledgements | Confirm acceptable (Q-05) |
| O-08 | Components default the zone to `Australia/Brisbane` when no revision is visible | Harmless today: stamps shown then come from other records | Never use that default for a displayed stamp in new code |

---

## 9. Decisions and open questions

D1–D5 are decided. Replying "adopt D6–D10 as recommended" is enough to authorise I6 and I7; I3, I4 and I5 need nothing new.

### D6 — How do structured sections get their structure?

| Option | Meaning | Cost and risk |
|---|---|---|
| **A (recommended)** | Re-serialisation proof (§5.5.1). The v1 formatter moves from `context.ts` to a pure `src/documents/section-text.ts` with identical output, and `snapshot()` calls it. `readPack` adds scoped `section_view` (Appendix C) | No migration, snapshot or OUT-09 change. The extraction risk is guarded by golden tests captured **before** the move plus the "existing revision still checks" test. Falls back to verbatim text. **Prototyped successfully on the retained fixture (Appendix G)** |
| B | Snapshot schema v2 with structured context | Per-version recompute in Check and Issue; a new ADR; likely OUT-09 work; existing drafts must stay v1. Better long-term shape, much larger now |
| C | Keep flat text | Nothing to build; well short of r03 |

**Without `section_view`.** Option A's client readers alone can prove 02, 07 and 08 from the frozen text. Sections 03, 04, 05 and 09 need `section_view` to give structure without parsing multi-line free text.

### D7 — Title and work kind

**Recommended:** title = the verified approved-scope `summary`; work kind = the distinct `task_kind` values; fallback to references. **Alternative:** keep the references. Depends on D6-A.

### D8 — Breadcrumb

| Option | Effect |
|---|---|
| **A (recommended)** | Keep the r03 in-module breadcrumb, as Field Technicians does under its baseline; root "Service"; "Job packs" links to the register. Record the double breadcrumb as an accepted exception in the UI-consistency handover |
| B | Remove it and rely on the shell, like other record pages. Departs from accepted r03 (a new DP) |
| C | Leave as is: two trails with different root names |

### D9 — Readiness density

**Recommended:** stage groups, unsatisfied first, satisfied collapsed. Nothing that needs action is hidden, and every row stays one activation away. **Alternative:** the flat list (DP-12 already accepts a scrolling rail).

### D10 — Read-model additions (no migration)

**Recommended:** all four, staff-only where stated, following I1's pattern.

1. `jobs[].recovery_owner_name` and `follow_ups[].owner_name`.
2. History fields `occurred_at`, `confidence`, `author_label`, `source_system`, `source_id`, `verification_status` in `readPack.history` and `preparationOptions.history`.
3. Staff-only `acknowledgements[]` across all issues: `issue_id`, `revision`, `display_name`, `acknowledged_at`.
4. `section_view` (D6-A).

**Alternative:** items 1 and 2 only.

### 9.1 Open questions (no decision needed to start)

| ID | Question | Default until answered |
|---|---|---|
| Q-01 | Should technicians get "View equipment record" links? | Staff only |
| Q-02 | Fix the history-digest date gap (O-01)? It would move snapshot hashes | No change; raise with the P06 owner |
| Q-03 | Readable outcome wording and de-duplicated controls in the next OUT-09 template version (O-02, G-04)? | Recorded for that version |
| Q-04 | A lighter revision projection for long-lived packs (O-04)? | Measure first |
| Q-05 | Is crew-wide visibility of distribution facts acceptable (O-07)? | Keep current behaviour |
| Q-06 | Is the pack register (G-09) the next design task after I5? | Backlog |
| Q-07 | Keep the r03 captures in the repository (Appendix E)? | Optional in I5 |

---

## 10. Build sequence

The rules for every increment:

- One pull request per increment, from a refreshed `main`, and every existing suite must still pass.
- Per `AGENTS.md`, each pull request also updates, for what it changed: the design register pages `scope-sv-05.md`, `route-service-packs-id.md` and `route-service-packs-new.md`, plus their `guides.json` articles. Then run `npm run studio:check`.
- On adoption of D6–D10, add Appendix F's departures to plan §6.

### 10.1 Overview

| Increment | Size | Depends on | Decision needed | Rollback |
|---|---|---|---|---|
| I3 Preparation | Large (UI + three test files) | `main` | None | Revert the PR; no data or contract change |
| I4 Source change, print, reach | Medium | I3 (shared dirty state for the print choice) | None | Revert the PR |
| I6 Structured sections | Large (server read + pure formatter extraction + UI) | I3, I4 | D6, D7 (and D10 for history fields) | Revert the PR. The formatter extraction is byte-identical, so no stored hash depends on it |
| I7 Professional finish | Medium | I6 (labels and flags share its parts) | D8, D9, D10 | Revert the PR |
| I5 Entry points, conformance, print, records | Medium | All of the above | None | Revert the PR; the records revert with it |

### 10.2 I3 — Preparation view, change record and first save (Plan)

| Item | Detail |
|---|---|
| Delivers | §5.7 and the preparation dialogs in §5.8; R-05 (preparation labels), R-06, R-07, R-10, R-21, R-23, R-25, R-26, R-27; R-14 selection fields if D10 is adopted |
| New files | `job-pack-preparation.tsx`, `job-pack-change-dialog.tsx` in `src/documents/components/client/` |
| Changed files | `job-pack-screen.tsx` (lifted form state, unsaved badge, tab trailing, `new` mode); `src/app/(business)/service/packs/new/page.tsx`; `src/components/pack-screens.tsx` (remove `NewPackScreen` and `PreparationForm`); `pack-view.ts` (label map, help text); `job-pack.css` (§6.3 I3 row) |
| Tests changed in the same PR | `packs.spec.ts` creation (lines 155–180 at `743d58f`); `tests/helpers/quality-prepare.ts` pack creation (about lines 505–525) and successor (about lines 635–660), which drive `quality-journey`, `finance` and `crm-refinements` |
| Records | STATUS Service Operations row; plan status line and I4 note |
| Exit | Create, amend and replay pass on desktop and phone; PT-29 SC-06 passes; the conformance spec passes; no overflow at 1440, 1024, 820, 770, 390 and 320 |
| Stop and report | Any test outside the pack specs fails in a way not reproduced on unmodified `main`; any server change seems necessary |

### 10.3 I4 — Source change, print choices and decision reach

| Item | Detail |
|---|---|
| Delivers | §5.4 (both notices and their actions), §5.2 matrix, §5.10 steps 1–3; R-03, R-09, R-22 |
| Changed files | `job-pack-screen.tsx`; `pack-view.ts` (category map, notice model with `action`); `job-pack.css` (`notice-action`) |
| Tests | Schedule move → notice with category "Schedule" → successor clears it. "Go to Pack readiness" moves focus to the card heading at 1024 and 390. Print choice with a dirty form. Header matrix for coordinator, ADR-0029 reviewer and technician |
| Exit | D2 and D3 behaviour as decided; §11.1 name rules hold |
| Stop and report | A notice action would need to call a command |

### 10.4 I6 — Structured section content (D6-A, D7; D10 for history fields)

| Item | Detail |
|---|---|
| Delivers | §5.5 in full; §5.2 title and work kind; R-01, R-02, R-14 (section), R-15, R-16, R-28 |
| Order of work | **1.** Write the golden tests against the *current* inline formatter and commit them green. **2.** Move the formatter into `src/documents/section-text.ts`; `context.ts` imports it and changes nothing else; the goldens stay green. **3.** Add `src/documents/section-view.ts` and attach `section_view` in `readPack`. **4.** Add the pure readers and proofs in `pack-view.ts`. **5.** Add the UI in `job-pack-section-parts.tsx` and wire the sections and title |
| Fixture | `tests/fixtures/job-pack-read.json` gains `section_view`; the PR states why (retained synthetic fixture, intentional change) |
| Performance | One scope read and one history read are added to `readPack`. If it is among the PT-27 measured reads, re-run that proof and record the result |
| Exit | Every section proves or falls back; the disclosure equals frozen text byte for byte; no snapshot hash moves; an existing revision still checks |
| Stop and report | Any golden difference after step 2; any `StaleSource` in the existing-revision test; `matches_snapshot` false for an unchanged record (check O-01) |

### 10.5 I7 — Professional finish (D8, D9, D10)

| Item | Detail |
|---|---|
| Delivers | §5.6 in full, §5.9, breadcrumb per D8; R-04, R-05 (rest), R-11, R-12, R-13, R-17, R-18, R-20 |
| Changed files | `job-pack-rail.tsx`, `job-pack-sections.tsx`, `job-pack-screen.tsx`, `pack-view.ts`, `packs.ts` (names and acknowledgements, staff only) |
| Tests | UUID and stored-code guards (§11.2); grouping and keyboard toggling; crew facts in order; acknowledgements visible to staff and not to technicians |
| Stop and report | A guard finds a UUID that comes from a server string rather than the page |

### 10.6 I5 — Entry points, conformance proof, print and records (Plan)

| Item | Detail |
|---|---|
| Delivers | Plan §8 I5; R-08, R-19, R-24 |
| Entry points | Drawer and planner use `GET appointments/:id/pack`: "Open job pack", or "Prepare job pack" with `can_prepare`. Update `field-technicians.spec.ts` in step |
| Conformance | `tests/ui/job-pack-design-conformance.spec.ts` (component proof, `playwright.crm-ui.config.ts`); `tests/helpers/job-pack-design.ts`; complete the application proof |
| Print | Port the print rules with the scroll reset; inspect a multi-page A4 print; prune unused `.pack-*` rules in `globals.css` selector by selector |
| Records | `ui-baselines.json`; `docs/reference/ui/README.md` pointers; `docs/decisions/job-pack-r03-integration.md` (conformance table, DP-1 to DP-21); pointer in `job-pack-design.md`; `docs/delivery/job-pack-integration-handover.md`; STATUS; register images (Appendix E); the UI-consistency exception (D8-A) |
| Exit | `node scripts/design-baseline-check.mjs --app http://127.0.0.1:3000` passes; paired captures inspected at 1440 × 960, 1024 × 768, 820, 770, 390 × 844 and 320; G-06 wording checked |

---

## 11. Tests and acceptance

### 11.1 Test ledger (verified against the test files at `743d58f`)

`exact` shows whether the lookup is whole-string. Non-exact lookups match substrings, so new names must avoid containing them.

| Lookup | Kind | exact | Used in | Plan |
|---|---|---|---|---|
| `Decision / change reason` | label, inside the dialog; focus asserted | yes | `packs.spec.ts` `decide()`, helper `packDecision()` | Keep |
| Triggers `Check this revision`, `Queue exact output for issue`, `Withdraw current issue` | button | yes (`decide`) / no (elsewhere) | packs, helper | Keep; unique |
| Confirms `Record check`, `Queue output`, `Withdraw issue` | button, inside the dialog | yes | packs, helper | Keep |
| `Enter the reason for this decision.` | text, inside the dialog | yes | packs | Keep |
| `Prepare nine-section job pack` | heading | no | packs:164 | **Replace in I3** |
| `/SYN visual inspection/` | checkbox | regex | packs:167 | Keep (source checkbox name contains the title) |
| `#section-{key}` ×9 | locator | — | packs:170, helper:513, :641 | Keep |
| `Preparation / change reason` | label | no (packs) / yes (helper) | packs:175, helper:521, :646 | **Replace in I3** with the dialog field `Reason for this change` |
| `Save preparation` | button | yes | packs:178 | Keep as the **dialog confirm**. The form button becomes "Save preparation…", which an exact lookup does not match, so the test clicks the form button first, then this confirm inside the dialog |
| `Save successor and hold dispatch` | button | yes | helper:653 | **Replace in I3** (form button + dialog) |
| `Prepare successor revision` | button | yes | helper:638 | Keep as the header button name |
| `#jp-panel-pack .jp-section-head h2` count 9 | locator | — | packs | Keep: constraint 10 |
| `Job pack, 9 sections` | tab | yes | packs | Keep |
| `/^\d+ of \d+ criteria satisfied/` | text | regex | packs:194 | Keep; **one match only** (R-25) |
| `Process or recover original output` | button | no / yes | packs, helper | Keep |
| `Open exact issued document` | **link** | no / yes | packs, helper | Keep, and keep it a **link** in the header (§5.2) |
| `/Acknowledge this exact issue/` | button | regex | packs | Keep; unique |
| `Dispatch held`, `Pack dispatch checks complete` | text | yes | packs | Keep; no other element with exactly this text |
| `Exact issued job pack`, `Current applicable issue`, `Not currently applicable` | SC-14 | yes | packs | Untouched |
| Level-2 headings = 9 on `/api/v1/pack-issues/{id}/html` | OUT-09 | — | packs | Untouched |
| `No job packs are available` | text | regex | packs, quality-states | Untouched (list) |
| `Open job packs` | link | — | `field-technicians.spec.ts` | Changes in I5 |

**New names** — `Reason for this change`, `Discard changes`, `Go to Pack readiness`, `Go to Preparation`, `Go to Output and distribution`, `Go to crew acknowledgement`, `Print preview`, `Save and print…`, `Print saved revision`, `Exact text as it will be issued`:

- none contains, or is contained by, a non-exact lookup above;
- scope "Save preparation", "Discard changes" and "Exact text as it will be issued" lookups to their dialog or section.

### 11.2 New tests by increment

| Increment | Tests |
|---|---|
| I3 | Unit: label map, help text, dirty diff. Browser: create and amend via the dialog; replay of a lost save response inside the dialog; discard; tab-switch retention; navigation guard; `/new` redirect; action bar clear of the phone bar at 390 and 770 |
| I4 | Unit: drift-to-category map; notice action model. Browser: notice appears and clears; the action moves focus; print choice; header matrix by identity |
| I6 | **Golden extraction:** captured from the current inline formatter before moving it, for the seeded pack and synthetic inputs with multi-line access text, `null` optional fields, an identification-only asset, several items, and requirements containing commas.<br>**Unit:** each reader round-trips the goldens; adversarial values fall back; an unknown `schema_version` returns `null`.<br>**Database:** scope `verified` true; history `matches_snapshot` true, and false after a synthetic summary change; the recipient projection is limited; an **existing revision still checks**.<br>**HTTP:** shape and the same 404.<br>**Browser:** structured content renders; each disclosure equals `text` + `notes`; a fixture with altered frozen text renders verbatim |
| I7 | **UUID guard:** `innerText` of `#ppo-job-pack` contains no `/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i`.<br>**Code guard:** no Appendix B stored value appears as the whole text of any element except inside "Reference:" elements and exact-text disclosures.<br>Grouping and keyboard toggling; crew facts; staff/technician difference on acknowledgements |
| I5 | Plan tests, entry points, print (page count > 1 for the long-content fixture; running header present) |

### 11.3 Stress and edge cases (each must render without overflow or loss)

| Case | Expected |
|---|---|
| 6,000-character notes in all nine sections | Wraps; counter shown from 5,500; exact-text disclosure scrolls within the page, not horizontally |
| 20 technical sources, 30 history records | Selection lists remain usable; section 06 rows wrap; 05 dates align |
| 2,000-character reason | Dialog body scrolls; the actions stay visible |
| Crew of 1 and of 6 | Section 01 badges wrap; crew card rows are consistent |
| 10 or more revisions | Timeline readable; each event shows its `rNN` badge; payload measured (O-04) |
| All eight criteria unsatisfied; all satisfied | Groups expanded where needed; the collapsed summary is correct; counts are consistent |
| Drift in five sources | One line each with its category; sections flagged per map |
| `section_view.scope` null (403/404) | Title falls back; 03, 04, 09 verbatim |
| Contact with "; " in the name | Section 02 verbatim (proof fails) |
| Non-Brisbane site zone crossing a daylight-saving change (for example `Australia/Sydney` on the first Sunday of October) | Zone abbreviation and offset per timestamp; the visit window uses the start's zone label |
| Visit crossing midnight | Long date of the start; window times with zone |
| Technician on a withdrawn issue | "This issue has been withdrawn"; no acknowledge button |
| Failed output with three attempts | Readable error sentence + Reference; recovery available |
| 320 px width | Tabs scroll; header buttons stack; tables scroll inside their wrapper |
| 770 px width | Phone shell + tablet page: no overlap with the phone bar (O-05) |

### 11.4 Acceptance criteria (observable)

| # | Criterion | Verified by |
|---|---|---|
| A1 | Every figure, state and action comes from the server read; no client checklist decides anything | Review of `pack-view.ts` (pure); unit tests |
| A2 | Every save records a new revision with its own reason and field delta | I3 browser |
| A3 | Save, decisions and acknowledgement replay byte-identical bodies after an uncertain response | I3 + existing I2 cases |
| A4 | Every structured section proves equality with its frozen text or shows that text verbatim; the exact text is always one activation away | I6 |
| A5 | No UUID and no stored code as primary text | I7 guards |
| A6 | At 1024 × 768 and 390 × 844 the state's decision is reachable from the top of the page in one activation | I4 |
| A7 | At 390 × 844 and 770 px the preparation bar is fully above the phone bar; inputs 16 px; targets 44 px | I3 measurement + capture |
| A8 | No horizontal overflow at 1440, 1024, 820, 770, 390 and 320 in any view | Conformance spec, extended |
| A9 | Technicians see only the current applicable issue; staff-only fields are `null` for them | Database and HTTP |
| A10 | Snapshot hashes, OUT-09 bytes and template versions unchanged | I6 goldens + existing-revision check |
| A11 | 41 tokens and r03 geometry still match the issued file | Conformance spec |
| A12 | Workbench print: all pages, running identity header, "Page n of N", labelled as a workbench print | I5 |
| A13 | Keyboard: every action and disclosure is reachable and operable; focus returns after dialogs | I5 keyboard pass (§5.12) |

---

## 12. Verification, evidence and pull requests

### 12.1 Commands for every increment

```sh
npm run lint && npm run typecheck && npm run test:unit
npm run test:db      # only against ppo_synthetic_test
npm run test:http    # with npm run dev running
npx playwright test tests/browser/packs.spec.ts tests/browser/quality-states.spec.ts tests/browser/job-pack-design-conformance.spec.ts
python3 scripts/check_foundation.py && python3 scripts/check_prototype.py && python3 scripts/check_naming.py
npm run studio:check
git --no-pager grep -n -E "^(<<<<<<<|=======$|>>>>>>>)" -- docs src tests
```

The compiled browser suite (required context "Desktop and mobile browser suite against the compiled application") runs all of `tests/browser` unfiltered, so the pack specs join it without workflow changes.

### 12.2 Known local limits (owner's Windows machine; plan §10)

- `ppo_synthetic_test` is absent and the local role cannot create it, so CI is the first run of the database suites.
- Four unit tests fail identically on unmodified `main`: `document-store` (2), `recovery` (1) and `warm-routes` (1).
- Exclude the git-ignored `tmp/` from type checking.
- The dev database retains crew bookings; use free dates.
- `quality-journey.spec.ts` stops at the planner's "Confirm booking" with `SkillOrTravelInvalid` on unmodified `main` too (#257), so helper steps beyond it may run first in CI.

### 12.3 Evidence

- Record what was **executed** and what was only **authored**, with the commit and environment.
- After each edit, confirm the changed text is present in the edited file before reporting it done.
- Never replace a comparison image to make a check pass.

### 12.4 Pull request checklist (maps to `.github/PULL_REQUEST_TEMPLATE.md`)

| Template section | Content for each increment |
|---|---|
| Problem and outcome | The increment's "Delivers" row and the observable change |
| Traceability | Work package `SC-06 {increment}`; the requirement and decision IDs from §13; source `PPO-SC06-PLAN` + this report's section; scope "Synthetic prototype" |
| Validation | §12.1 results as executed/authored; unexecuted tests named |
| Impact and recovery | No migration, snapshot or OUT-09 change; rollback = revert (§10.1); any read-shape additions listed |
| Review checklist | Design register pages, guides and `studio:check` updated; stable document names; no credentials; no production or business approval inferred |

---

## 13. Traceability

| Requirement, decision or finding | Specification here | Increment | Test or acceptance |
|---|---|---|---|
| SC-06, SVC-03, SVC-06 (full Job Pack page) | §5 | I3–I7, I5 | A1–A13 |
| SC-14, OUT-09 (exact issued document; unchanged) | §0.4 (2, 7); §5.10 | — | A10; packs.spec heading count |
| API-C08–C11, TR-04–TR-07, EVT-04/05 (check/return, issue, amend/withdraw, acknowledge) | §5.6.1, §5.8, §4.3 J2–J7 | Contract; I3 (amend) | A2, A3 |
| BP-07 §8 (nine sections; outcomes, stage, exception flag) | §5.5, §5.6.1 | I6, I7 | A4; §11.2 I7 |
| BP-07 §8 (schedule/crew change creates review; change category) | §5.4, R-22, G-05 | I4 | J5; §11.2 I4 |
| BP-07 §8 (dispatch requires issue, acknowledgements, clearance) | §5.6.1 dispatch block | Contract | packs.spec exact strings |
| ADR-0011 (every revision material; per-recipient acknowledgement) | §5.7, §5.8, §5.6.2 | I3, I7 | A2, A3 |
| ADR-0029 (Pack Reviewer without issue) | §4.1, §5.2 | I4 | Header matrix test |
| D1 (no "Review requested") | §5.4 | Contract | — |
| D2 (no material assessment) | §5.4 | I4 | — |
| D3 (server preview first) | §5.10 | I4, I5 | J8; A12 |
| D4 (readiness assessed at the appointment) | §5.7 rows 07 and 08 | I3 | — |
| D5 (r03 titles on screen) | §5.5.2 | Contract | G-04 |
| D6–D10 | §9 | I6, I7 | §11.2 |
| r03 audit M1 | §5.7, §5.8 | I3 | A2 |
| r03 audit M3 | §5.4 | I4 | J5 |
| r03 audit U1 | Contract | — | Conformance negative controls |
| r03 audit U2 | §5.8 | Contract | `decide()` focus assertion |
| r03 audit U3 | §5.2 | I3 | — |
| r03 audit U4 | §5.4 | I4 | A6 |
| r03 audit P1–P4 | §5.10 | I5 | A12 |
| PT-29 SC-06 row | §5.11 | All | `quality-states.spec.ts` |
| `job-pack-r03` baseline | §5.1, §6 | I5 | A11; `design-baseline-check.mjs` |

---

## 14. Risks

| Risk | Consequence | Mitigation |
|---|---|---|
| The formatter extraction changes a byte | Every saved Draft becomes `StaleSource` | Goldens committed **before** the move; the existing-revision test; stop on any difference |
| `matches_snapshot` computed on a re-shaped row | False "changed" warnings on every history record | Use the identical SELECT and row shape (O-01); database test |
| A parser misreads user text | Wrong labels | Re-serialisation proof; verbatim fallback |
| `section_view` discloses more to technicians | Permission leak | Recipient projection limited to frozen-text fields; database test |
| Duplicate or substring names; a second "criteria satisfied" | Strict-mode failures across P06, P11, Finance and CRM journeys | §11.1 rules; R-25 |
| An extra section `h2` | `packs.spec.ts` heading count fails | Constraint 10 |
| Extra reads slow `readPack` | PT-27 regression | Measure; two indexed queries |
| A notice action mistaken for the decision | Two paths to one command | Actions only move focus |
| Print clips to one page | Unusable workbench print | Scroll reset; I5 inspection |
| `globals.css` pruning breaks the list or SC-14 | Regressions outside r03 | I5 only, selector by selector, with the PT-29 matrix |
| Technician wording implies an InProgress visit stopped (G-06) | BP-07 §8 breach | Check in I5; wording only |

---

## 15. Records to update

| Record | When | Change |
|---|---|---|
| `docs/STATUS.md` | I3, then each increment | Replace the Service Operations row |
| `docs/delivery/job-pack-integration-build-plan.md` | I3; on adoption of D6–D10 | Status line; §6 DP-15 to DP-21; §7 D6–D10; §8 order I3 → I4 → I6 → I7 → I5 |
| `docs/decisions/job-pack-design.md` | On adoption of D6–D10 | "Decided {date}" table, as for D1–D5 |
| `docs/design/development/pages/*.md`, `guides.json` | Every increment | Desktop and mobile contracts from §5 with measured geometry; states, tasks, recovery |
| `docs/design/development/register.json` | I5 | `image_paths`; visual review only with real evidence |
| `docs/standards/ui-baselines.json` | I5 | As plan |
| `docs/delivery/existing-modules-ui-consistency-handover.md` | I7 (D8-A) | Breadcrumb exception |
| `docs/decisions/job-pack-r03-integration.md`, `docs/delivery/job-pack-integration-handover.md` | I5 | New, as plan |
| This report | On adoption of decisions, and when an increment lands | Mark decided items; keep the change record current |

---

## Appendix A — File map

| Path | Today | Target |
|---|---|---|
| `src/documents/components/client/job-pack-screen.tsx` | Frame, header, tabs, notices, decision dialog, panels | + preparation state and `new` mode (I3); notice actions, header matrix, print choice (I4); title (I6); breadcrumb (I7) |
| `…/job-pack-sections.tsx` | Nine sections, tags, contents rail | Structured parts (I6); criterion flags (I7) |
| `…/job-pack-rail.tsx` | Readiness, crew, record, output | Stage groups, crew progress, names, labels (I7) |
| `…/job-pack-ui.tsx`, `job-pack-types.ts` | Shared UI; DTO types | + `section_view` and new fields (I6, I7) |
| `…/job-pack-preparation.tsx`, `job-pack-change-dialog.tsx` | — | New (I3) |
| `…/job-pack-section-parts.tsx` | — | New (I6) |
| `src/documents/pack-view.ts` | Titles, labels, stamps, diff, readiness, drift, status, timeline | + label map, help text (I3); category map, notice model (I4); readers and proofs (I6); flag map, timeline titles (I7) |
| `src/documents/section-text.ts` | — | New: the v1 formatter moved byte-identically (I6) |
| `src/documents/section-view.ts` | — | New: the server projection (I6) |
| `src/documents/packs.ts` | `readPack`, `preparationOptions` | + `section_view` (I6); names, history fields, acknowledgements (D10) |
| `src/documents/context.ts` | Inline formatting in `snapshot()` | Imports `section-text.ts`; **no other change** |
| `src/components/pack-screens.tsx` | List, `NewPackScreen`, `PreparationForm`, `DocumentScreen` | List and `DocumentScreen` only (I3) |
| `src/app/(business)/service/packs/new/page.tsx` | Shim to `NewPackScreen` | Shim to the Job Pack screen, `new` mode (I3) |
| `src/app/styles/job-pack.css` | r03 screen rules, no print | Per §6.3 |
| `src/components/field-technicians-screen.tsx`, planner client | List or `new` links | Pack identity route (I5) |
| `tests/browser/packs.spec.ts`, `tests/helpers/quality-prepare.ts` | Legacy form flow | Dialog flow (I3) |
| `tests/unit/section-text.test.ts`, `tests/unit/pack-readers.test.ts` | — | New (I6) |
| `tests/database/packs.test.ts`, `tests/http/packs.test.ts` | I1 cases | + `section_view` and D10 fields (I6, I7) |
| `tests/fixtures/job-pack-read.json` | Retained read | + `section_view` (I6) |

## Appendix B — Readable labels for stored values

Unknown values fall back to CamelCase split into sentence case.

| Vocabulary (source) | Stored → shown |
|---|---|
| Pack status | Draft · Returned → Returned for preparation · Checked · Issued · Withdrawn |
| Check decision | Checked · Returned |
| Render job state (0006) | Queued · Running → Generating · Durable → Output stored · not yet issued · Failed → Failed · recovery needed · StaleSource → Source changed · original attempt retained · Issued |
| Issue event kind (0006) | Issued · ReviewRequired → Review required · Superseded → Issue superseded · Withdrawn → Issue withdrawn |
| Distribution kind (0006) | TaskCreated → Task created · SimulatedSent → Simulated sending recorded · Opened · Downloaded |
| Criterion outcome (badge tone) | Pass (green) · Blocked (warning) · PermittedException → Permitted exception (blue) · NotApplicable → Not applicable (neutral) · Unknown (neutral) |
| Blocking stage (seed-p04) | Authorisation · Booking · Dispatch (· Completion), as "{stage} stage" |
| History kind (0002) | PriorWork → Prior work · KnownIssue → Known issue · AttemptedFix → Attempted fix · TechnicalAdvice → Technical advice |
| History confidence (badge tone) | Reported (neutral) · Suspected (warning) · Verified (green) |
| History verification | Imported · Verified · ReviewRequired → Review required |
| Scope task kind (0004) | Inspection · Identification · Intervention |
| Customer date agreement | Unknown · Proposed · Confirmed · Changed, as "Customer date agreement: {value}" |

**Error codes found in source.** Show the sentence, then "Reference: `Code`".

| Code | Sentence |
|---|---|
| PackNotReady | "Preparation is not ready. Resolve the listed items." |
| ScopeReviewRequired | "The authorised scope needs review before this pack can be saved or checked." |
| StaleSource | "A source changed after this revision was saved. Prepare a successor with current sources." |
| TemplateUnavailable | "The exact supported job pack template is unavailable." |
| RecipientUnavailable | "A crew member no longer has current access to receive this pack." |
| PolicyUnavailable | "The scheduling policy for this visit is unavailable." |
| RenderOrStorageFailure | "The output could not be generated or stored. Recover the original output." |
| Other job `error_code` | "The output attempt did not complete." |

## Appendix C — `section_view` contract (Proposed, D6-A / D10)

```ts
// Added to the readPack item. null = not provided to this identity (never "none").
section_view: null | {
  revision_id: string;              // current revision for staff; the permitted revision for a recipient
  scope: null | {
    verified: boolean;              // scope revision content_hash === snapshot.work.scope_hash
    revision: number;
    summary: string;
    exclusions: string;
    diagnostic_limit: string | null;
    items: {                        // from the approved scope snapshot, as scopeDetail returns it
      sequence: number;
      task_kind: "Inspection" | "Identification" | "Intervention";
      task_description: string;
      completion_requirements: string[];   // a list: the v1 formatter embeds it with a comma join (O-03)
      shutdown_condition: string | null;
      assets: {
        asset_id: string | null;    // null for recipients
        display_number: string;
        description: string;
        identity_status: string;
        serial: string | null;
        configuration_description: string | null;
        method: string | null;
        limits: string | null;
      }[];
    }[];
  };
  history: null | {
    id: string;
    occurred_at: string;
    kind: string;
    confidence: string;
    summary: string;
    matches_snapshot: boolean;      // see the rule below
    author_label?: string;          // staff only
    source?: { system: string; id: string } | null;   // staff only
    verification_status?: string;   // staff only
  }[];
};
```

- **Scope.** `scopeDetail(c, p, w, snapshot.work.scope_id)` returns the approved scope snapshot's items once the scope is approved. Approved scope, items and assets are immutable by trigger (`protect_scope_evidence`, migration 0004).
- **History.** `matches_snapshot` = `digest(canonical(row)) === snapshot.history[i].hash`. Here `row` comes from **exactly** the query `snapshot()` uses (`SELECT id,kind,summary,confidence,occurred_at …`), with `occurred_at` still a `Date` (O-01).
- **Failures.** A 403 or 404 from either read yields `null` for that part.

## Appendix D — v1 section-text formats and reader rules

`text(v)` is `String(v ?? "Not recorded")`. These are the exact templates the I6 extraction preserves and the readers re-serialise (from `snapshot()` at `743d58f`).

```text
customer_arrangements
  Location: {site.location_description}                         (NOT NULL column)
  Contact: {contact.display_name}; {text(phone)}; {text(email)}      or "Contact: Not recorded"
  Access: {text(site.access_instructions)}
  Date agreement: {appointment.customer_commitment}. This is not pack acknowledgement.

scope
  Approved scope r{NN}: {summary}
  Exclusions: {exclusions}
  Diagnostic limits: {text(diagnostic_limit)}
  <blank line>
  {sequence}. {task_kind}: {task_description}
  Completion: {completion_requirements joined by ","}
  Shutdown condition: {text(shutdown_condition)}
  … items joined by a blank line

equipment   (per asset, joined by a blank line)
  {display_number}: {description}
  Identity: {identity_status}; serial: {text(serial)}
  Configuration: {text(configuration_description)}
  Identification only: {method}; limits: {limits}                only when method is set

history     (per record, joined by a blank line)
  {kind} ({confidence}): {summary}
  … or "No service-audience history selected. The preparation notes must explain the review or relevant absence."

technical_information   (per source, joined by a blank line)
  {title}
  Version {version_id}; SHA-256 {hash}
  {source text}

readiness = controlText   (Authorisation-stage criteria and ToolPreparation, joined by a blank line)
  {label}: {outcome}. {reason or ""}
  Evidence: {evidence_title or "Not recorded"}; {evidence_hash or ""}

site_controls
  Access: {text(site.access_instructions)}
  Biosecurity: {text(site.biosecurity_notes)}
  {controlText}
  Stop if site access, isolation, shutdown authority or competency cannot be confirmed. Tool-preparation exceptions do not waive these controls.

completion
  {sequence}. {completion_requirements joined by ","}            one line per item, joined by "\n"
  Record unresolved work and escalate to the preparation owner. This pack does not grant authority outside the approved scope. {template v1 sentence | completionInstructions (v2)}
```

**Reader rules.**

1. Act only when `snapshot.schema_version === 1` and `template.version` is 1 or 2; otherwise return `null`.
2. Outcome tokens are exactly `Unknown`, `Pass`, `Blocked`, `PermittedException` and `NotApplicable`.
3. A line that does not start with a recognised prefix belongs to the preceding field.
4. Show a structure only when re-serialising it reproduces the frozen text exactly.
5. For 03, 04 and 09, build the structure from `section_view.scope`. For 09, the standing text is the frozen text after the exact requirements prefix.

## Appendix E — Reference images and register proposal

The five uploaded PNGs are captures of the **issued r03 reference**, not of the application:

- desktop Chrome, about 1,900 CSS px wide;
- covering the header and section 01, sections 02–03, 04–05, 06–08 and 08–09;
- taken on 23 September 2026 from `file:///…/powerplants-one-job-pack-r03.html`.

Proposed handling (I5, optional; Q-07):

1. **Store them.** Save as `docs/reference/ui/job-pack/powerplants-one-job-pack-r03-desktop-01.png` … `-05.png`, which follows the folder's stem and PPO-STD-001 §11.3's local sequence. Register their hashes in the source manifest that guards `docs/reference/`.
2. **Link them.** Add them to `image_paths` for `scope:SV-05` and `route:/service/packs/[id]`.
3. **Describe them honestly.** In `pages/scope-sv-05.md`: "design-reference captures of r03 at about 1,900 px; viewport, zoom and device pixel ratio not recorded; not implementation evidence".
4. **Keep them separate.** They do not replace the paired declared-viewport captures, which I5 records under `docs/testing/evidence/`.

## Appendix F — Proposed departures to add to plan §6 on adoption

| # | r03 | Application treatment | Why |
|---|---|---|---|
| DP-15 | Sections render live source values | A proved re-presentation of the frozen text, with the exact text always available | The page must show what Check and Issue freeze (D6-A) |
| DP-16 | The notice button performs "Submit for review" | The notice action moves focus to the card holding the decision | One control per decision; unique test names |
| DP-17 | Six flat readiness rows | Registry criteria grouped by stage, satisfied rows collapsed | Eight real criteria across three stages (D9) |
| DP-18 | Two header buttons | At most two by state; "View appointment" moves into section 01 | Header economy |
| DP-19 | "Service › Field technicians › Job pack" | "Service › Job packs › {reference}", beside the shell breadcrumb | D8-A |
| DP-20 | Tools table with "Parts: not applicable" | Recorded controls table in 07 and a compact list in 08; no parts row | No parts criterion exists; identical controls text in both sections (O-02) |
| DP-21 | Section 01 shows coordinator, site address and visit status | Coordinator and live visit status omitted; location in 02 | Not in the pack read; the location is in the frozen arrangements text |

## Appendix G — Re-serialisation prototype results

A Python prototype (evidence only; not application code) implemented the Appendix D readers and re-serialisers. It ran against the current revision in `tests/fixtures/job-pack-read.json` (snapshot `schema_version` 1, template version 2) on 23 September 2026.

| Section | Parsed structure | Round-trip equals frozen text |
|---|---|---|
| 02 Customer arrangements | Location; contact (3 parts: name, "Not recorded", email); access; agreement "Confirmed" | Yes |
| 03 Authorised scope and limits | Revision 01; summary; exclusions; diagnostic limit; 1 item (Inspection) with 2 completion requirements; shutdown condition not recorded | Yes |
| 04 Equipment and configuration | 1 asset: `SYN-PPO-AST-000001`, identity Verified, serial and configuration not recorded | Yes |
| 07 Parts, tools and readiness | 6 controls (Pass ×4, NotApplicable ×2) with evidence title and hash | Yes |
| 08 Site controls | Access; biosecurity; 6 controls; standing instruction | Yes |
| 09 Completion and escalation | Requirements prefix `1. Record observations,Stop before intervention` + standing text | Prefix match: yes |
| Adversarial: contact name "SYN Avery; Contact" | Contact splits into 4 parts | **Rejected**: falls back to verbatim, as designed |

**Limits.**

- One fixture revision only.
- Scope, equipment and completion were recovered from the frozen text for this test. Production reads them from the verified `section_view`.
- The TypeScript implementation must pass the §11.2 goldens and round-trip tests independently.

---

*End of report.*
