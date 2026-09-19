---
document_id: PPO-SC06-PLAN
title: SC-06 — Job Pack r03 application integration — build plan
revision: r01
date: 2026-09-20
owner: Dean Fiedler
status: Authorised by Dean Fiedler on 20 September 2026 with the recommended answer to each of D1–D5 adopted; I1–I5 not yet delivered
scope_id: SC-06
source_commit: 540b2b7e463ad68d5f552d006ea7cae6d75fbff8
---

# SC-06 — Job Pack r03 application integration — build plan

## 0. What this plan is

This plan applies the accepted [Job Pack design r03](../reference/ui/job-pack/powerplants-one-job-pack-r03.html) to the running application. It is **not** a plan for a new module. P06 already delivers job packs end to end; the [design decision](../decisions/job-pack-design.md) requires the accepted presentation to be applied to that existing workbench through its permitted reads and commands, and forbids treating the HTML's in-memory simulation as application code.

Every binding below is tagged as exactly one of:

- **Contract** — exists on `main` in a merged migration or server module and is enforced by the running application.
- **Seed** — a synthetic fixture only.
- **Proposed** — needs the owner's decision; never rendered as adopted until decided.

Base commit `540b2b7e` (`main`, PR #254 merged). Read in session: the r03 HTML in full and its [change record](../reference/ui/job-pack/powerplants-one-job-pack-r03-change-record.md); `src/documents/packs.ts`, `context.ts`, `validation.ts`, `render.ts`, `http.ts`; `src/components/pack-screens.tsx`, `field-technicians-screen.tsx`, `business-ui.tsx`; `src/service/work-orders.ts` (readiness); `db/migrations/0006-job-packs.sql` and `0004-work-scope.sql`; `src/shell/navigation.ts`; `src/app/module-workspaces.css`, `shared-layout.css`, `field-technicians.css`; `tests/browser/packs.spec.ts`, `quality-states.spec.ts`, `field-technicians.spec.ts`; [ADR-0011](../decisions/ADR-0011-p06-controlled-job-packs.md), [ADR-0029](../decisions/ADR-0029-hosted-pack-reviewer-profile.md), the [P06 handover](p06-handover.md), [BP-07](../blueprints/BP-07-service-operations.md), [HTML module conformance](../standards/html-module-conformance.md), the [UI style specification](../standards/ui-style-specification.md), `docs/standards/ui-baselines.json` and [PPO-STD-002](../standards/PPO-STD-002-repository-structure.md).

This contribution changes documentation only. It adds no application, API, database, permission or deployment change.

## 1. Purpose and position

### 1.1 Outcome

`/service/packs/<id>` and `/service/packs/new` present the r03 page — compact job header, three views (Job pack, Preparation, Revision history), contents rail, nine-section pack, readiness and record rail, guided preparation with a recorded change reason, source-aware notices and controlled print choices — while every figure, state and action on the page comes from the existing P06 server model. Nothing the page shows is computed by a client-side checklist.

### 1.2 Requirement traceability

| Reference | Relationship | Tag |
|---|---|---|
| SC-06 · SVC-03 · SVC-06 | The full Job Pack page; this plan changes its presentation only | Contract |
| SC-14 · OUT-09 | Exact issued document screen and the OUT-09 template; **unchanged** by this plan | Contract |
| API-C08–C11 · TR-04–TR-07 · EVT-04/05 | Check/return, issue, amend/withdraw, acknowledge; reused as they stand | Contract |
| BP-07 §8 | Nine sections; outcomes Unknown, Pass, Blocked, PermittedException, NotApplicable; policy version, blocking stage and exception flag per criterion | Contract (`ppo.policy_criteria`, `readiness()`) |
| ADR-0011 | Every revision is material; issue is queued, never implied; per-recipient acknowledgement | Contract |
| ADR-0029 | Hosted Pack Reviewer holds `pack.read`, `pack.prepare`, `pack.check` and **not** `pack.issue`; lands on `/service/packs` | Contract |
| PT-29 screen-family matrix | SC-06 and SC-14 rows in `tests/browser/quality-states.spec.ts` must keep passing | Contract |
| `job-pack-r03` in `ui-baselines.json` | Registered, `app_route: null`, "not implemented" | Contract — this plan discharges it |

### 1.3 What exists today

| Area | Fact |
|---|---|
| Routes | `/service/packs` (list), `/service/packs/new?appointment_id=`, `/service/packs/[id]`, `/documents/[id]`; each page file is a two-line shim |
| Screens | `src/components/pack-screens.tsx` (853 lines): `PackListScreen`, `NewPackScreen`, `PackScreen`, `DocumentScreen`, `PreparationForm` |
| Server | `src/documents/packs.ts`: `createPack`, `revisePack`, `checkPack`, `requestIssue`, `withdrawPack`, `acknowledgePack`, `recordDistribution`, `readPack`, `listPacks`, `preparationOptions`, `dispatchReadiness` |
| Pack states | `Draft`, `Returned`, `Checked`, `Issued`, `Withdrawn`, plus `needs_review` |
| Pack input | Nine required notes (1–6000 characters each), `source_ids` (at least one, at most 20), `history_ids` (at most 30) |
| Styles | One minified line, `src/app/globals.css:1962`, hard-coded hex, no scope container |
| Entry links | Planner → `/service/packs/new?appointment_id=`; My Jobs → `/service/packs/<id>`; Field Technicians drawer → `/service/packs` (the list, **not** the pack) |
| Local runtime | `ppo_synthetic`, 26 migrations applied (0001–0027, 0016 reserved) — current |

## 2. Conformance declaration

| Item | Declaration |
|---|---|
| Scope identity | SC-06, existing page; no new module or parent requirement |
| Page type | Record detail with guided form and history views |
| Reused components | Application Shell (navigation, viewport); `useResource`, `useCommand`, `ErrorNotice`, `ReadState`, `ValidationFields` from `src/components/business-ui.tsx`; `useUnsavedChanges` from `src/components/record-ui.tsx`; native `<dialog>` as in `field-technicians-screen.tsx` |
| Source authority | r03 HTML SHA-256 `5b41481460984bdeb09f683b76a5ba30cdd805eb19f90735e725d01fedc6b825`; theme style board r22 SHA-256 `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0` |
| Incoming handover | Authenticated principal; `GET packs/:id`; `GET appointments/:id/pack-options`; canonical pack identity from the planner, My Jobs and the Field Technicians drawer |
| Outgoing handover | Existing versioned commands and operation receipts; `/documents/<issue>` for the exact issued output; `/service/appointments/<id>` for readiness assessment |
| Exceptions and recovery | Loading, denied (same 404), failed read with retained data, command refusal, `StaleSource`, uncertain save with byte-identical replay, failed or stale render job recovery |
| Departures | §6 |
| Verification | §9; component proof, application proof in the compiled required job, one negative control |

Application integration gate values, to be written to `ui-baselines.json` in I5: route `/service/packs`; scope `#ppo-job-pack`; layout `full-bleed` with the container owning the accepted 24 px desktop / 16 px mobile padding; **scroll owner: the module container** (the shell's `main` is `overflow:auto` today and becomes `overflow:hidden` under `data-module-layout`, so the r03 `window` scroll handling cannot be carried over).

## 3. Constraints that must hold in every increment

1. **The snapshot does not change.** `checkPack` and `requestIssue` recompute `snapshot()` and compare its digest with the stored `content_hash`. Any change to the composition or shape of `PackSnapshot` turns every existing Draft into `StaleSource`. All new display data comes from read-model additions outside the snapshot.
2. **OUT-09 does not change.** `packHtml`, `templateDefinition`, `sectionKeys` and `sectionLabels` feed a hash-controlled template version. The exact HTML keeps nine `<h2>` headings.
3. **Commands keep their contracts and their replay behaviour.** `useCommand` re-sends a byte-identical body after an uncertain response and refuses a different action meanwhile; the acknowledgement `captured_at` is fixed per issue/assignment/actor. Dialogs must not rebuild a pending body.
4. **Permission filtering stays on the server.** Technicians receive only the current applicable issue and its revision; denied and missing are the same 404.
5. **No migration under the default decisions**, so none of the migration-registry assertions named in `AGENTS.md` move.
6. **Issued reference bytes are untouched**: r02, r03, both audits and the change record.
7. **SC-14 (`DocumentScreen`) and the pack list are outside r03.** They keep working and keep their current presentation.
8. **STD-002 applies to every new file**: components in the owning domain, one stylesheet named for what it styles.

## 4. Design to application mapping

### 4.1 Frame and header

| r03 element | Application binding | Tag |
|---|---|---|
| `#ppo-job-pack` container, 41 tokens, local reset | `src/app/styles/job-pack.css`, every rule under the scope id, tokens on the container with r03 values verbatim, `Roboto,Verdana,sans-serif` from the existing `/brand` face (the embedded WOFF is not carried over) | Contract (pattern: `field-technicians.css`) |
| Breadcrumb Service › Field technicians › Job pack | In-module links: Service operations → Job packs → pack reference. The shell keeps navigation; `pageForPath` already resolves `/service/packs/*` to the Job packs destination | Contract |
| Reference line: reference · state · revision · kind | `display_number` · `status` · `r<revision>`; **work kind is not in the pack read** — omitted | Contract |
| Title, customer · site | `snapshot.customer.name`, `snapshot.site.name`; title is the appointment reference (the read carries no job title) | Contract |
| Status badge | Derived from `status`, `needs_review`, `current_issue_id` (§4.6) | Contract |
| Unsaved badge, tab-trailing indicator | Form dirty state; "Design preview" text is not carried over | Contract |
| Prepared by | `created_by` of the current revision → display name (§5) | Contract after I1 |
| Footer: simulate change, reset example | Not carried over. The synthetic-environment label stays | — |

### 4.2 Job pack view — nine sections

The view renders **the frozen snapshot of the current revision** — exactly what will be checked and issued — not live source records.

| # | Section key | Structured part | Text part |
|---|---|---|---|
| 01 | `identification` | Info grid from `snapshot.customer`, `site`, `work`, `appointment` (references with versions, visit window in `appointment.timezone` with zone label and UTC offset), crew from `snapshot.recipients` | Notes |
| 02 | `customer_arrangements` | — | `text`, then notes as "Visit arrangements" |
| 03 | `scope` | — | `text`, then notes as "Technician briefing" |
| 04 | `equipment` | — | `text`, then notes |
| 05 | `history` | Selected history joined to the staff `history` list for kind and summary | `text` for technicians; notes |
| 06 | `technical_information` | Document rows from `snapshot.sources`: title, `version_id`, short hash. **No link** — no source viewer endpoint exists | `text`, notes |
| 07 | `readiness` | — | `text` (the frozen control text), notes as "Collection and preparation instructions" |
| 08 | `site_controls` | — | `text`, notes as "Work arrangements" |
| 09 | `completion` | — | `text`, notes as "Escalation and remaining work" |

Source tag on each section: `From work order v<n> + appointment v<n> · as at <revision.created_at>`. The revision's creation time is the honest as-at for the whole snapshot. A section whose source has drifted (§5) takes the r03 `changed` treatment.

Contents rail, mobile jump select and scroll-spy are carried over. Scroll-spy listens on the module container, keeps the r03 "last section at scroll limit" rule and the 600 ms jump lock (audit U1).

### 4.3 Right rail

| Card | Binding | Tag |
|---|---|---|
| Pack readiness | Rows from the server readiness registry (§5 `criteria`): label, outcome, reason, blocking stage, "exception permitted / no exception permitted", policy key and version. Count line derived from the rows. Context rows: prepared-against versions and drift. Beneath: the existing dispatch result — **"Dispatch held"** with `readiness.reasons`, or **"Pack dispatch checks complete"** | Contract |
| Primary action | State- and permission-dependent (§4.6) | Contract |
| Crew acknowledgement | Before issue: `snapshot.recipients`, "Not yet requested". After issue: `readiness.recipients` with acknowledged time, and the existing acknowledge action for the viewing recipient | Contract |
| Pack record | Revision, scope version, appointment version, current issue (link to `/documents/<id>`), readiness count, dispatch Held / Clear | Contract |
| Output and distribution | Render jobs with recovery, retained attempt links, distribution facts, follow-up Activities, simulated sending. r03 leaves these outside the preview; the workbench keeps them (§6 DP-7) | Contract |

### 4.4 Preparation view

The nine r03 preparation sections keep their layout. Entry fields bind to the nine existing notes; ids stay `section-<key>`.

| # | Field label | Binds to | Note |
|---|---|---|---|
| 01 | Visit identification notes | `identification` | r03 has no entry here; the server requires a note (DP-1) |
| 02 | Arrival and customer arrangements | `customer_arrangements` | |
| 03 | Technician briefing | `scope` | |
| 04 | Equipment verification notes | `equipment` | |
| 05 | History review notes + history checkboxes | `history`, `history_ids` | No server concept of a required originating entry (DP-4) |
| 06 | Technical reference notes + exact-version checkboxes | `technical_information`, `source_ids` | Unavailable sources disabled with "unavailable for selection"; at least one source required; no per-document "Required" flag (DP-4) |
| 07 | Tools and collection instructions | `readiness` | Tool status and exception are readiness assessments, not pack input (D4) |
| 08 | Visit-specific work arrangements | `site_controls` | Access status and confirmation record likewise (D4) |
| 09 | Escalation and remaining-work instructions | `completion` | Evidence requirements come from scope items and are read-only (DP-5) |

Linked context beside each field comes from the latest saved snapshot. **A new pack has no snapshot until its first save**; the first-save view shows selections and fields with a note that context is composed from current records on save. A best-effort context preview on `pack-options` is a Proposed extension, not part of the default build.

Limits follow the server (6000 characters), not the r03 value. Client validation mirrors the server rules only; server `field_errors` populate the r03 error summary through `ErrorNotice`, which keeps its `.business-error` class.

### 4.5 Saving — "Record preparation change"

Save opens the r03 dialog: changed fields before → after (selections as added/removed), one required reason, then `POST packs` or `POST packs/:id/amend` with that `reason`. The diff is computed from `PackInput` and needs no server change.

Two truths the dialog states that r03 does not: every save creates a **new revision** (`r02`, `r03`, …), and saving on a pack with a current issue raises an amendment — dispatch is held at once and fresh check, issue and acknowledgements are required. A refusal (`PackNotReady`, `ScopeReviewRequired`, `StaleSource`, version conflict) renders inside the dialog, which stays open with its body retained for replay.

### 4.6 Review, check, issue and withdrawal

r03 shows one handover, "Submit for review → Review requested". The application has check/return, queued issue and withdrawal, each with a reason. Under the default for D1 no "Review requested" state is drawn.

| Pack state | Badge | Primary action by permission |
|---|---|---|
| Draft, no issue | Draft · not issued | `pack.check`: **Check this revision**, **Return preparation**. Otherwise an information notice: awaiting check |
| Returned | Returned for preparation | `pack.prepare`: Prepare pack |
| Checked | Checked · not issued | `pack.issue`: **Queue exact output for issue**. Otherwise: awaiting issue (the ADR-0029 reviewer stops here) |
| Job queued, running, failed, stale | Output in preparation / recovery needed | `pack.issue`: **Process or recover original output** |
| Issued, not under review | Issued | `pack.issue`: **Withdraw current issue**; all: **Open exact issued document** |
| Any, `needs_review` with an issue | Review required | `pack.prepare`: Prepare successor revision |
| Withdrawn | Withdrawn | `pack.prepare`: Prepare successor revision |

Each decision opens an r03 confirmation dialog whose reason field is labelled **Decision / change reason**. The persistent reason textarea is removed, as audit finding M1 requires. Accessible names in bold are retained so the P06 journey test changes in ordering only.

### 4.7 Source change

The "Source changed since this draft was prepared" notice appears when the advisory drift (§5) is non-empty, when `needs_review` is set on an issued pack, or when the latest job is `StaleSource`. Its action is **Prepare successor revision**; saving re-snapshots against current sources and records the reason. The server digest check at Check and Issue remains the authority. Under the default for D2 there is no material / not-material choice.

### 4.8 Revision history

One timeline, newest first, built from the existing read: revisions (reason and field delta against the predecessor's input), checks, render jobs, issues (linking to `/documents/<id>`), issue events, distribution events and acknowledgements. One stamp format throughout — `dd Mon yyyy · HH:mm ZONE · actor` — with the zone derived from `snapshot.appointment.timezone` through `Intl` (audit M6). Technicians see only what the server already permits.

### 4.9 Print

Under the default for D3, **Print preview** opens the server preview of the saved revision (`/api/v1/packs/:id/preview?revision_id=`), which is the controlled OUT-09 output and already states "Preparation preview — not issued". With unsaved entries the r03 dialog offers **Save and print…** or **Print saved draft**. After issue the action is **Open exact issued document**. The r03 print stylesheet is ported last, and must reset the shell's clipped scroll containers or the page prints one sheet.

### 4.10 Who sees what

| Identity | Views | Actions |
|---|---|---|
| Coordinator (prepare, check, issue) | All three | All |
| Hosted Pack Reviewer (ADR-0029) | All three | Prepare, check, return; no issue |
| Assigned technician | Job pack (current issue only); history limited by the server | Open issued document; acknowledge own assignment |
| Observer / unassigned | Same 404 | — |

## 5. Read-model extensions — no migration

| Addition | Where | Visible to | Purpose |
|---|---|---|---|
| `revisions[].created_by_name`, `checks[].actor_name`, `jobs[].actor_name`, `issues[].issued_by_name`, `events[].actor_name` | `readPack` | Staff | Actor on every event; "Prepared by" |
| `criteria[]`: criterion code, label, blocking stage, `exception_allowed`, `not_applicable_allowed`, outcome, recorded outcome, stale, expired, reason, assessor name, assessed at, valid until, evidence title; plus `policy { key, version }` | `readPack`, from the existing `scopeDetail` and `readiness()`; a denied dependency yields `criteria: null`, never an empty list | Staff | Readiness card (M2) from the real registry |
| `basis`, `current_basis`, `basis_drift[]` over every versioned field the snapshot records (appointment version, schedule version, assignment version, booking hash; work version, scope version, scope hash; site version; customer version; template and policy version) | `readPack` | Staff | Source tags and the source-change notice (M3). Advisory; the digest check stays authoritative. **Once the current revision is the current issue, only schedule and assignment version are compared**: issue finalisation and acknowledgement themselves advance the appointment record version, so a full comparison would report a source change on every issued pack (found in I1) |
| `existing_pack_id` | `preparationOptions` | `pack.prepare` | `/service/packs/new` redirects instead of failing `UNIQUE(workspace_id, appointment_id)` |
| `GET /api/v1/appointments/:id/pack` → `{ pack: { id, display_number, status, needs_review } \| null, can_prepare }`. `pack` is `null` both when none exists and when it is outside scope; an appointment outside scope is the same 404 | New route beside `pack-options`, served from `src/documents/` through `packContext` | `pack.read` in scope, or current assignment | Canonical pack identity for the Field Technicians drawer, which must tell "no pack yet" from a failure in order to offer preparation (refined in I1; it discloses nothing the appointment's own `pack_requirement` does not). Kept in the documents domain so `scheduling` gains no import of `documents` |

Pure presentation logic — input diff, timeline assembly, readiness summary, status presentation, stamp and zone formatting — lives in `src/documents/pack-view.ts`, free of server imports and unit-tested.

## 6. Deliberate differences from the standalone design

| # | r03 | Application treatment | Why |
|---|---|---|---|
| DP-1 | No entry field in sections 01, 05, 06 | A notes field in each | The server requires all nine notes; an empty history selection must be explained |
| DP-2 | Saving updates draft r01 in place | Each save is a new immutable revision | `pack_revisions` is immutable evidence (ADR-0011) |
| DP-3 | Draft ↔ Review requested | The five server states and `needs_review` | D1; the decision record calls the preview wording a handover intention to be mapped |
| DP-4 | Required documents; required originating history entry (M5) | Not enforced; at least one source | No server concept exists. Proposed for a later increment |
| DP-5 | Selectable evidence requirements | Read-only, from scope items in the snapshot | Completion requirements belong to the authorised scope |
| DP-6 | Tool status, permitted exception, access status and confirmation entered on the page | Shown from recorded readiness assessments; assessed at `/service/appointments/<id>` | D4; "no six-item client checklist can replace server readiness" |
| DP-7 | Issue, acknowledgement, distribution and recovery outside the preview | Kept, as a fourth rail card and within the acknowledgement card | Existing P06 function must survive |
| DP-8 | Material / not-material assessment | Successor revision with a reason | D2; ADR-0011 treats every revision as material |
| DP-9 | Review and Dispatch stages; "PP-01 synthetic policy r01" | Server stage names (Authorisation, Booking, Dispatch, Completion) and the real policy key and version | The registry supplies real references, as the acceptance anticipated |
| DP-10 | `SYN-PPO-DOC-nnnnnn` document references | Title, `version_id` and hash from `pack_sources` | The open PPO-STD-001 type-code question is not forced by this build |
| DP-11 | `window` scroll, embedded font, demonstration footer controls | Module-owned scroll, shared Roboto face, no demonstration controls | Host contract |

## 7. Decisions

**Decided 20 September 2026.** Asked to choose on D1–D5, Dean answered: "Proceed based on your professional recommendations." The recommended answer in each row below is therefore the adopted one. The alternatives are retained as the record of what was not chosen and what reopening each would cost; none is scheduled. This is a user decision about the integration build. It does not amend ADR-0011, the API contract or the accepted r03 presentation.

| # | Question | Adopted answer | Alternative not chosen, and its cost |
|---|---|---|---|
| D1 | Is there a persisted "Review requested" handover? | **No.** Present the existing states; a saved Draft is already awaiting check | Additive migration (review-request marker), a new command and outbox kind, a `service-api.md` amendment and every migration-registry test update listed in `AGENTS.md` |
| D2 | Can a source change be assessed as not material? | **No.** A source change is resolved by a successor revision with a reason | Amend ADR-0011 and the digest rule; a change-category column needs a migration |
| D3 | What does Print preview print? | **The server preview** of the saved revision; browser print CSS is secondary | Browser print of the workbench as the primary route produces an uncontrolled document that resembles a job pack |
| D4 | Are tool and access readiness recorded on the pack page? | **No, link out** to the appointment readiness assessment in this build | Embed the existing `service.readiness.assess` command in a dialog as a later increment; no schema change |
| D5 | Which section titles appear on screen? | **r03 titles** ("Job and visit details", "Completion and escalation") on screen; OUT-09 keeps "Identification and visit" and "Completion evidence and escalation" until its next template version | Use `sectionLabels` on screen so workbench and issued document match today, departing from the accepted titles |

Token placement needs no decision here: tokens stay on the scope container with r03 values, including the three divergences already recorded in `ui-baselines.json`. Promotion to `:root` remains the separate question the style specification leaves open.

## 8. Build sequence

One pull request per increment; the application works and every suite passes after each.

### I1 — Read model and view logic (no visible change)

- `src/documents/packs.ts`: the `readPack` and `preparationOptions` additions in §5. `src/documents/http.ts` and `src/app/api/v1/appointments/[id]/pack/route.ts`: the pack-identity route.
- `src/documents/pack-view.ts`: pure functions.
- Tests: `tests/unit/pack-view.test.ts`; additions to `tests/database/packs.test.ts` (criteria for staff and absent for a technician, actor names, drift after a schedule move, **an existing revision still checks after this change**) and `tests/http/packs.test.ts` (shapes, same 404).
- Exit: no snapshot hash moved; no migration; existing browser suite untouched and green.

### I2 — Scope container, Job pack view, rail and decisions

- `src/app/styles/job-pack.css` (new folder, per STD-002 §3 and §8), imported in `src/app/layout.tsx` before `module-workspaces.css`.
- `src/documents/components/client/`: `job-pack-screen.tsx` (frame, tabs with arrow-key handling, state), `job-pack-sections.tsx`, `job-pack-rail.tsx`, `job-pack-dialog.tsx` (focus rules from audit U2: primary action or reason field for confirmations, heading for information).
- `src/app/(business)/service/packs/[id]/page.tsx` points at the new screen. `PackScreen` leaves `pack-screens.tsx`; the Preparation tab hosts the existing `PreparationForm` until I3.
- Tests: `packs.spec.ts` decision steps become click → fill **Decision / change reason** → confirm; first geometry assertions in `tests/browser/job-pack-design-conformance.spec.ts` (24/16 px padding, 220 / fluid / 258 px columns at 1440, token equality with r03).
- Exit: PT-29 SC-06 row passes (a `Loading …` status inside `main`, `.business-error` on failure); no horizontal overflow at 1440, 1024, 820 and 390.

### I3 — Preparation view, change record and first save

- `job-pack-preparation.tsx`: nine sections, selections, dirty state, `useUnsavedChanges`, error summary, sticky action bar clear of the phone navigation bar.
- "Record preparation change" dialog; amendment warning when an issue exists.
- `/service/packs/new` uses the same screen with the Preparation view only, and redirects on `existing_pack_id`. `NewPackScreen` and `PreparationForm` leave `pack-screens.tsx`.
- Tests: `packs.spec.ts` creation steps (the heading "Prepare nine-section job pack" and the label "Preparation / change reason" are replaced; `#section-<key>`, the source checkbox name and **Save preparation** are kept); lost-response replay of a save from inside the dialog.
- Exit: create, amend and replay pass on desktop and phone projects.

### I4 — Revision history, source change and print choices

- `job-pack-history.tsx` and the "Current version" card; source-change notice; print choices and unsaved guard.
- Tests: history shows two saves with two reasons and their deltas; a schedule move raises the notice and a successor clears it; print choice dialog.
- Exit: D2 and D3 behaviour as decided.

### I5 — Entry points, conformance proof and records

- Field Technicians drawer reads `appointments/:id/pack` and links to `/service/packs/<id>`, or to `/service/packs/new?appointment_id=` with `pack.prepare`; `tests/browser/field-technicians.spec.ts:46-49` changes with it.
- `tests/ui/job-pack-design-conformance.spec.ts` (component proof against the issued HTML, run by `playwright.crm-ui.config.ts`), completion of the application proof, shared assertions in `tests/helpers/job-pack-design.ts`, and a **negative control** for audit U1 (last section unreachable by scroll-spy).
- Port the r03 print stylesheet; prune the `.pack-*` rules in `globals.css` that no screen uses any longer.
- Records: `ui-baselines.json` (`app_route`, `app_scope_selector`, `status`, a `module_integrations` entry modelled on Deals r38); `docs/reference/ui/README.md` lines 138 and 239, which file r02 as current and r03 as an earlier revision; `docs/decisions/job-pack-r03-integration.md` with the conformance table and §6; a pointer in `job-pack-design.md`; `docs/delivery/job-pack-integration-handover.md`; the Service Operations row in `docs/STATUS.md`; register rows.
- Exit: `node scripts/design-baseline-check.mjs --app http://127.0.0.1:3000` passes; paired captures at the four declared viewports inspected.

## 9. Test ledger

Strings and selectors other suites rely on. **Keep** unless the row says otherwise.

| Lookup | Used by | Plan |
|---|---|---|
| `Check this revision`, `Queue exact output for issue`, `Process or recover original output`, `Withdraw current issue`, `Open exact issued document`, `/Acknowledge this exact issue/` | `packs.spec.ts` | Keep |
| `Dispatch held`, `Pack dispatch checks complete` (exact) | `packs.spec.ts` | Keep, in the readiness card |
| `Decision / change reason` | `packs.spec.ts` | Keep as the dialog field label; ordering changes (I2) |
| `#section-<key>` ×9, checkbox `/SYN visual inspection/`, `Save preparation` | `packs.spec.ts`, `tests/helpers/quality-prepare.ts` | Keep |
| `Prepare nine-section job pack`, `Preparation / change reason`, `Prepare successor revision` | `packs.spec.ts`; **`tests/helpers/quality-prepare.ts`**, which drives pack creation and a successor revision through the screen for `quality-journey.spec.ts`, `finance.spec.ts` and `crm-refinements.spec.ts` | Replaced in I3; the spec and the helper are updated in the same pull request |
| `.business-error`; `Loading …` status inside `main` | `packs.spec.ts`, `quality-states.spec.ts` | Keep |
| `Draft · Not issued`, `No job packs are available` | `quality-states.spec.ts` | Untouched — list screen |
| `Exact issued job pack`, `Current applicable issue`, `Not currently applicable` | `packs.spec.ts` | Untouched — SC-14 |
| Link `Open job packs` → `/service/packs` | `field-technicians.spec.ts` | Changes in I5 |
| Nine `<h2>` in the exact HTML | `packs.spec.ts` | Untouched — OUT-09 |

`tests/demo/ui.spec.ts` uses no pack-screen selector. The compiled suite runs all of `tests/browser` unfiltered, so the application proof joins an existing required job without workflow changes.

## 10. Verification for every increment

```sh
npm run lint && npm run typecheck && npm run test:unit
npm run test:db      # refuses any database but ppo_synthetic_test; the local .env.local names ppo_synthetic
npm run test:http    # with npm run dev running
npx playwright test tests/browser/packs.spec.ts tests/browser/quality-states.spec.ts
python3 scripts/check_foundation.py && python3 scripts/check_naming.py
```

A local machine without the document renderer reports `RenderOrStorageFailure` in report-producing tests; confirm any failure against unmodified `main` before attributing it. Record what was executed and what was only authored, as the Field Technicians handover does.

Measured on the owner's Windows machine during I1, 20 September 2026, so that later increments do not rediscover them:

- `ppo_synthetic_test` does not exist and the local role has no `CREATEDB`, so the database suites cannot run there. CI is their first execution until that database is created by a privileged role.
- The dev database held no pack, so a pack page has nothing to show until one is prepared through the planner.
- `tsconfig.json` includes every `.ts` under the root. A git-ignored `tmp/` holding 641 of them exhausts the default heap; the type check passes on the tracked tree with `tmp/` excluded. CI's clean checkout is unaffected.
- Four unit tests fail there and fail identically on unmodified `main`, because they assume POSIX paths and file modes: `document-store` (2), `recovery` (1) and `warm-routes` (1).

## 11. Risks

| Risk | Mitigation |
|---|---|
| A well-meant edit to `snapshot()`, `sectionLabels` or `packHtml` invalidates saved revisions or the template version | Constraint 1 and 2; the I1 database test that checks a pre-existing revision |
| A dialog rebuilds the command body and defeats lost-response replay | One `useCommand` per action family; the reason is captured before `send`; replay test in I3 |
| Scroll-spy and sticky rails break because the shell, not `window`, scrolls | Module-owned scroll declared in §2; negative control in I5 |
| Printing clips to one page inside nested scroll containers | D3 default; print reset in I5 |
| The phone navigation bar covers the sticky save bar | Bottom inset as in `field-technicians.css` |
| A first save fails on authority blockers the new-pack view never showed | Refusals render in the dialog with the server's blocker list |
| Drift is read as authoritative | Labelled advisory; Check and Issue still decide |
| `globals.css:1962` is one minified line shared with the list and SC-14 | Prune only in I5, selector by selector |

## 12. Immediate next step

Branch `feat/job-pack-read-model` from `main` and deliver I1. With D1–D5 decided (§7), no increment waits on an open question.
