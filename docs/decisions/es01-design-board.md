---
document_id: PPO-ES01-DESIGN-BOARD-DEC
date: 2026-09-24
owner: Dean Fiedler
status: Design decisions recorded under the owner's delegation (25 September 2026) and implemented in the native page; owner visual and device review pending
source_commit: 2173cc64eed54b1e3fb8334495f7cd924206d13f
versioning: git
---

# ES-01 Estimating intake and workload design board — record, proposals and build findings

On 24 September 2026 Dean asked for a professional UI design for the estimating page (`/estimating`, as served by the hosted demo). The first canvas was drawn in the separate PHYTO design system; Dean corrected this the same day: the page was to use the Powerplants One design system. The canvas was rebuilt on that system and the repository's own stylesheets. Dean then left the approach to Claude ("Proceed however you believe is the most professional"). The board was extended to the 1024 px and 320 px review viewports, made static so that it captures exactly, audited for accessibility and retained here.

This record keeps what was decided apart from what is only proposed. It holds one user decision, nine proposals, two open questions and five findings against the running build. On 25 September 2026 Dean delegated the decisions on P1–P9 and O1–O2 ("I am happy for you to decide and proceed however you believe is the most professional"). Section 4 records each decision and its adjustments, section 5 the answers, and section 7 the native implementation that followed. Scope stays `scope:ES-01`, route `/estimating` (including `?tab=estimates`). The [programme handover](../delivery/estimating-programme-handover.md) traces ES-01 to PPO-010, EST-01–EST-04, ADR-0027 and ADR-0035. No parent requirement ID is added or renamed, and all 78 remain. The decisions authorise the ES-01 page implementation and its additive read-model field only: no migration, capability, UI baseline entry or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence and scope |
|---|---|---|
| ES-01 design uses the Powerplants One design system (section 2) | **User decision**, 24 September 2026 | "It was meant to be created using the powerplants-one design system, not the PHYTO design system." PHYTO is a separate brand's website system and is not a Powerplants One source |
| Extend, capture and record the board; choice of method | Delegated by the user, 24 September 2026 | Delegation of approach. It is not acceptance of any proposal below |
| Board composition and proposals P1–P9 (section 4) | **Decided under delegation**, 25 September 2026: P1–P8 adopted, P9 adopted in part, with the adjustments in section 4 | Dean: "Regarding decisions on P1–P9 and O1–O2, I am happy for you to decide and proceed however you believe is the most professional." Decisions scope `/estimating` at every width. Owner visual and device review of the running page remains separate and is not implied |
| O1, O2 (section 5) | **Decided under delegation**, 25 September 2026 | O1: 1360 CSS px. O2: success tone, with the policy statement retained |
| Build findings B1–B5 (section 6) | Observed on `main` `2173cc6` by source inspection and the retained native captures | Fixed in the native implementation (section 7), except where section 6 states otherwise |
| W1: PHYTO version of the canvas | Withdrawn | Replaced in place on the same artifact; not retained |

## 2. Design reference

| Reference | Identity |
|---|---|
| Board | Private Design artifact in Dean's claude.ai account, <https://claude.ai/artifact/Hejx79sE5yqo3RByaJwrCi>, version 7 (`1790282094-c8b8`), 14 artboards. Only the owner can open it |
| Retained captures | [Design board r01](../reference/ui/estimating/workload-design-board-r01/README.md): 14 PNG captures at exact board size, with the SHA-256 of every capture and source file and the axe-core results. These are the repository reference for this record |
| Design system | Powerplants One Design System artifact <https://claude.ai/artifact/WwJiq36rg1KDdv1yS486SP>, version `1790235408-c668`, synced from `main@5499df4`. Its Deals profile is not used; ES-01 follows the root tokens |
| Tokens and shell | `src/app/globals.css`, `src/app/shared-layout.css`, `src/app/desktop-shell.css`, `src/app/mobile-layout.css`, `src/components/ui/controls.css` |
| Behaviour contract | [ES-01 scope entry](../design/development/pages/scope-es-01.md) native workload contract of 24 September 2026, unchanged |
| Current build | `src/components/estimating-workload.tsx`, `estimating-workload.css`, `src/estimating/workload.ts`, `workload-query.ts`; [native workload evidence](../testing/evidence/estimating-native-workload/README.md) captured from parent `f929312` |
| Fixture | Seven synthetic opportunities covering all four readiness states, a Won opportunity with a Sales handover due, a record without estimating edit permission and a record whose Sales action is unreadable. Five synthetic saved estimates, one not estimated |

## 3. Conformance declaration

Declared under [HTML module scope and design conformance](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-01` Estimating intake and workload; `route:/estimating`. Source edition `main` `2173cc6`. Parent IDs PPO-010, EST-01–EST-04 via the programme handover. Increment: design proposal, then native implementation of the decisions (section 7) |
| Page type | r20 **Register / worklist**, with **Work queue + persistent detail** as the supporting type at 1360 CSS px and wider, and a drawer variant below that (P1, P7) |
| Reused components | Application Shell r17 (`desktop-shell.css`: rail, header, breadcrumb, centred search and quick add, utilities; phone header and navigation at 780 px and below); module navigation (`shared-layout.css`); `PageHeader` register variant, `Status`, `ErrorNotice` (`business-ui.tsx`); `Button`/`ButtonLink` (`ui/button.tsx`, `controls.css`); segmented control (`.view-switch`, `globals.css`); section-tab treatment (`.record-tablist`, `mobile-layout.css`); `WorklistPanel` dialog behaviour (`crm-worklist-tools.tsx`) for the drawer; empty-state icon disc (`.ppo-empty-icon`, `desktop-shell.css`); navigation and product icons |
| Source authority | User decision: section 1. Current source: section 2. Design-system reference: the Powerplants One artifact, itself derived from the repository. Proposed composition: the board. Fictional fixture: synthetic `SYN` data. Unavailable evidence: exact ES-01 imagery, owner review, a running-build capture at `2173cc6` |
| Incoming handover | Unchanged: canonical Opportunity id, company and version with need summary; the current estimating workspace and selected option; a post-Won Sales handover-due reference shown as an obligation only. No intake acceptance is inferred |
| Outgoing handover | Links only: Sales opportunity, discovery workspace (Open discovery) or the existing guarded Start discovery, and saved estimates. Workspace, opportunity, option and estimate identity are retained. Ordinary navigation and filtering write nothing |
| Exceptions and recovery | Loading (X1), no matches (X2), no permitted workload (X3), failed read with rows cleared (X4), no access or revoked access (X5), no edit permission (V2), Sales action unreadable (V2), legacy manual basis (D1), latest discovery newer than the saved cost basis (V3). Stale writes and uncertain outcomes stay with the destination workflows, since this page has no command |
| Departures | P1–P9 below, decided under delegation on 25 September 2026 with the section 4 adjustments. Page-scoped right-hand drawer geometry for `WorklistPanel` (the CRM drawer is a top sheet), recorded as a component gap |
| Verification | Board captures and axe-core results in the [retained README](../reference/ui/estimating/workload-design-board-r01/README.md). The implementation's unit, database, HTTP and browser proofs and its running-build captures are in the [adoption evidence](../testing/evidence/estimating-workload-design-adoption/README.md). No paired owner review, device test or owner acceptance |

## 4. Proposals and decisions

The proposals are retained as drawn. The decisions follow the table.

| ID | Proposal | Current source | Reason | Boards |
|---|---|---|---|---|
| P1 | Register rows (opportunity, readiness, ownership) with a persistent 448 px detail panel at 1360 CSS px and wider | Stacked three-column cards, one per opportunity | Scanning seven or more opportunities; the next step and its action stay visible for the selected record. 448 px matches the approved Deals side panel | D1, V1–V3 |
| P2 | Readiness as the shared segmented control with a count per state | Readiness is a select inside the disclosure; no counts | Readiness is the main triage dimension. Needs `readEstimatingWorkload` to return per-state counts for the same search- and owner-matched 100-candidate window. The state is already computed per candidate before the view filter is applied (`workload.ts`), so this is a read-model addition, not a new query | D1, R1 |
| P3 | Readiness tones: Scope clarification uses warning, Discovery complete uses success, Discovery not started and Legacy manual basis stay neutral with distinct icons | All four render neutral (B1) | Uses the design system's meaning for attention and positive states. Risk: success could be read as "ready to price"; see O2 | D1, V1–V3, R2 |
| P4 | Workload and Saved estimates as section tabs (bold, green rule); Specialist configurations leaves the page tabs and stays in the rail | Three underlined links, one of them a different route (B5) | The two tabs are views of one route; the third link is navigation | D1, D2, R2–R4 |
| P5 | Owner and sort inline on desktop; on phones the disclosure stays, with a line naming the retained selections | All three behind the disclosure at every width | Desktop has room; the summary line makes retained selections visible when collapsed | D1, R2–R4 |
| P6 | Required response (always Unknown) shown once per record, in the panel or phone card, and in the policy summary | Shown in every card | Keeps the unknown visible without a column of identical values | D1, V1–V3, R2 |
| P7 | Below 1360 CSS px the panel opens as a right-hand modal drawer, 448 px wide, with `WorklistPanel` behaviour (dialog, Escape, focus return) | No drawer | A persistent panel leaves too little width for the register below about 1360 px | R1 |
| P8 | Saved estimates as a table with right-aligned tabular amounts in AUD ex GST; an estimate without lines reads Not estimated | Card list | Amounts compare in a column; unpriced scope is never shown as zero | D2 |
| P9 | State treatments: placeholder rows while loading; dashed empty states with an icon disc; failed read as a danger notice with a secondary Try loading again | Plain text states | Loading is not empty; a failed read is not an empty queue. Placeholder rows are not an existing design-system pattern | X1–X5 |

Decisions of 25 September 2026, under delegation:

| ID | Decision | Adjustment from the proposal and reason |
|---|---|---|
| P1 | **Adopted** | Rows carry opportunity, readiness and ownership; the title is the row's selection button (pressed state, controls the panel). The panel is 448 px, sticky, and shows the first row until another is chosen. The docking rule is measured on the register's own width (1244 CSS px, which the standard shell reaches at a 1360 CSS px viewport), so browser and CSS zoom follow the same rule |
| P2 | **Adopted** | `readEstimatingWorkload` returns `counts` for the four readiness states: permitted candidates only, matched by search and owner, counted before the readiness view in the same bounded window and read snapshot. A count always equals the rows that view lists. The page text says the counts share the window |
| P3 | **Adopted** | Clarification uses the attention tone and Discovery complete the success tone; Discovery not started and Legacy manual basis stay neutral. Words carry the state; per-state icons are **not** added, because `Status` has no icon slot and the words already distinguish the states. `Status` gains an optional `tone` override; every other caller keeps its value mapping |
| P4 | **Adopted** | Workload and Saved estimates are links styled as section tabs, with `aria-current`. Specialist configurations leaves the page and stays in module navigation (`/estimating/configurations`), so no route loses its entry |
| P5 | **Adopted** | Owner and sort sit beside search above the register. In the stacked layout a disclosure button (not `<details>`) holds readiness, owner and sort, and its label names the retained selections |
| P6 | **Adopted** | Required response (Unknown) appears once per record in the panel, drawer or phone card, and in the policy summary |
| P7 | **Adopted, narrowed** | The drawer is used between the stacked layout and the panel width. At 760 CSS px of register width and below (phones, tablet portrait, 200% zoom) each card carries the full detail inline, as boards R2–R4 draw, so no drawer is needed. The drawer reuses `WorklistPanel` (modal dialog, Escape, focus return) with page-scoped right-hand geometry |
| P8 | **Adopted, wording corrected** | Amounts read "Saved sell, AUD, excluding tax", the saved record's own basis. "ex GST" is not claimed, because tax is not calculated. An estimate without lines (null sell total) reads Not estimated. At phone widths the rows become labelled blocks |
| P9 | **Adopted in part** | Distinct loading, no matches, no permitted workload, failed read and no access states are implemented. Empty states use the dashed frame and the shared icon disc. A failed read clears rows and shows `ErrorNotice` with a secondary Try loading again. Placeholder rows are **declined**: they are not a shared pattern, and loading uses the existing read-state status text |

## 5. Open questions — decided

- **O1. Persistent panel breakpoint.** The board proposed 1360 CSS px. At 1440 px the opportunity column is about 426 px; at 1360 px about 346 px. Alternative: drawer at every width. **Decided, 25 September 2026: 1360 CSS px.** On the running build the register is 1244 CSS px wide at a 1360 px viewport and 1243 at 1359, and the rule changes exactly between them.
- **O2. Success tone for Discovery complete.** The tone signals scope completeness only; it does not approve a price or issue a quotation, as the policy summary states. Alternative: keep Discovery complete neutral with a check icon. **Decided, 25 September 2026: success tone, with the policy statement retained** in the policy summary and the next-step text.

## 6. Findings against the running build

Observed on `main` `2173cc6` by reading the source and the retained native captures. The outcome column records the native implementation of section 7.

| ID | Finding | Source |
|---|---|---|
| B1 | All four readiness labels render with the neutral tone, because `Status` maps only listed values and the workload labels are not among them. States differ by words only | `src/components/business-ui.tsx:232` |
| B2 | `.est-screen button:not(.secondary)` outranks the shared control classes. On the workload page a shared secondary `Button`, such as Try loading again, renders navy-filled; `.est-screen button:hover` draws a 2 px green outline at 2 px offset that resembles a focus ring | `src/components/estimating.css:1`; `estimating-workload.tsx:129`; the page loads the file through `estimating-screens.tsx` |
| B3 | The disclosure summary's focus ring is 2 px navy at 2 px offset, not the shared 3 px `--focus` at 3 px offset | `src/components/estimating-workload.css:36`; `src/components/ui/controls.css` |
| B4 | Clear filters sits at the bottom edge of the filter row rather than centred with the 44 px Apply filters button | `estimating-workload.css:18` (`align-items: end` with an inline link); [desktop capture](../testing/evidence/estimating-native-workload/desktop-workload.png) |
| B5 | The page navigation styles two views of `/estimating` and a link to `/estimating/configurations` identically | `src/components/estimating-workload.tsx:45` |

Outcomes:
- **B1:** fixed by P3's tone mapping.
- **B2:** fixed on this page. The workload no longer sits inside `.est-screen`, so shared `Button`s keep their own variants. The rule itself stays in `estimating.css` for the discovery, cost-source and estimate screens, where migration remains a separate change.
- **B3:** fixed. Focus on this page uses the shared 3 px `--focus` ring at 3 px offset.
- **B4:** fixed. Apply filters and Clear filters share a centred 44 px action row.
- **B5:** fixed by P4.
- **B6 (found during implementation, shared):** `button:hover:not(:disabled)` in `src/app/shared-layout.css` has the same specificity as the shared `.view-switch button:hover` in `globals.css` and loads after it. A hovered segment therefore fills navy with white text instead of the segmented control's light hover. The planner (`planner-screens.client.tsx`) is the other consumer. ES-01 restores the control's own hover in its page stylesheet. The shared correction is left to a separate change, because it alters another consumer.

The shell's Ctrl K hint contrast, which axe-core reports on D1 and D2, is the existing shared-shell finding B5 of the [ES-02 record](es02-design-board.md), not an ES-01 finding.

## 7. Native implementation

Implemented after the decisions, on the integration head that carries this record (`7fb30f5`):

- **Read model:** `src/estimating/workload.ts` adds `counts` to the workload response. It is additive and read-only: no migration, capability or write.
- **Page:** `src/components/estimating-workload.tsx` and `estimating-workload.css` provide the register, panel, drawer, phone cards, readiness segments, section tabs, saved-estimates table and states.
- **Shared component:** `Status` in `src/components/business-ui.tsx` gains the optional `tone` override.
- **Removed:** `EstimateList`, which had no other consumer.
- **Page guidance:** the in-app page guide, the draft `guide.es.01` article, the ES-01 page entries and the component bindings (`status`, `drawer`, `read-state`) are updated in the same change.

Verification is recorded in the [programme handover](../delivery/estimating-programme-handover.md#es-01-design-adoption) and the [adoption evidence](../testing/evidence/estimating-workload-design-adoption/README.md).

## 8. Verification and limits

The board's 15 source files were read back at version 7 and matched the local sources byte for byte. The 14 captures and axe-core results are in the [retained README](../reference/ui/estimating/workload-design-board-r01/README.md): 0 violations on 12 boards, and the one inherited shell contrast node on D1 and D2. The board captures are design references, not application captures. The running implementation's captures are separate evidence. No device was used and no owner review has taken place; visual review of the ES-01 page entries stays Needs review. A decision taken under delegation is not visual acceptance of the running page.
