---
document_id: PPO-PROJECTS-REFINED-FIGMA-PROP
date: 2026-11-09
owner: Dean Fiedler
status: Proposal in progress (draft pull request claim, 9 November 2026); design acceptance is Dean's and has not been given; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed or deployment; every record shown is synthetic
source_commit: 0d1959f7363ef3434fefa4434904724b9e4af78a
versioning: git
---

# Projects module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 9 November 2026 · **Status:** Proposal in progress. Sections 1 to 8 are the proposal record; later sections will record Dean's acceptance, the audit and the named versions exactly as the [Sales record](sales-module-refined-ui-proposal.md) does.

On 9 November 2026 Dean asked for the complete, refined UI page set of the Powerplants One Projects module to be drawn in Figma, in the new empty file "PPO - Projects module (proposal)", composed inside the accepted shell chrome, organised with the page template adopted for the Sales file, and recorded here with a dated status fragment and a draft pull request. His standing instruction applies: where a decision would otherwise be his, proceed with the most professional and advanced approach, state the assumption on the sheet and in this record, and keep going. The shell is the source of truth; register cells hold one line; no second search box in the content area.

This record is a **proposal**. It changes no code, test, migration, seed, permission or route. Acceptance of the design, when Dean gives it, does not make the drawn pages an implementation baseline: source presence, visual review of built pages, functional proof and deployment stay separate.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", pages "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked (accepted 8 November 2026)" | Chrome and geometry: 48 px top bar, 80 px collapsed rail, 48 px right strip, content x 80 to 1392, 280 px docked workspace menu, 432 px drawers and panels at x 960, tablet 1024 bar zones 332 / 360 / 332. The accepted Projects flyout and docked menus (Quick create New project and New activity; groups Delivery, Commercial & risk, Insights; docked Pinned group) are drawn as accepted, with no item invented |
| Private Figma file "PPO - Sales module (accepted)", named versions "PPO - Sales module (accepted)", "… · batch 2" and "… · batch 2 · N13", live file read on 9 November 2026 | Page template, Read me cards, the local copies of the shell components, the kit (Status chip, Button, Avatar, Checkbox, Filter chip, Tab, KPI tile), the 101 Lucide icon stand-ins and the derived tablet and phone chrome. The Plugin API cannot copy nodes between files, so each was serialised from the Sales file and rebuilt in the new file by script under the same component names, bound to a recreated "PPO colour" collection with the same 66 variable names and values. Exemplars studied: D01, D04, R01, X07, X23, X24, AD05, AD06, X25, AD07, AD08, ST01 and the Handovers page (W01, W02, AC01, AC02) |
| Private Figma file "PPO - Design", "— Projects —" pages | Frozen reference for content, accepted rules and stories: Projects register, Project record, Project initiation, Baseline, forecast and dependency review, Risks & issues (proposal), Contract obligations, notices and variations, Subcontractor packages (proposal), Delivery readiness (proposal), Stakeholder updates, Site assurance, Acceptance & closeout (proposal), Delivery performance, Project financial performance. Its shell is not the one copied |
| [Sales module refined UI proposal](sales-module-refined-ui-proposal.md) and its status fragment | The record this one mirrors |
| [Project initiation](project-initiation-figma-design.md) (PPO-PJ01-INITIATION-FIGMA-DEC), [Project record page](project-record-page-design.md) (PPO-PJ-RECORD-DESIGN-DEC), [Projects register](projects-register-design.md), [Baseline, forecast and dependency review](baseline-forecast-figma-design.md) (PPO-PJ03-BASELINE-FORECAST-FIGMA-DEC), [RAID backend](project-raid-backend.md), [Contract obligations, notices and variations](project-commercial-figma-design.md) (PPO-PJ05-COMMERCIAL-FIGMA-DEC), [Project field work and milestone billing](project-delivery-billing.md), [Delivery readiness](project-delivery-readiness-design.md) (PPO-012-READINESS-DES), [Site assurance](site-assurance-figma-design.md) (PPO-PJ09-SITE-ASSURANCE-FIGMA-DEC), [Stakeholder updates](stakeholder-updates-figma-design.md) (PPO-PJ08-STAKEHOLDER-UPDATES-FIGMA-DEC), [ADR-0033 staged acceptance](ADR-0033-staged-acceptance.md), [specialist packages](project-specialist-packages.md), [specialist handover](project-specialist-handover.md), [work evidence](project-specialist-work-evidence.md), [Delivery performance](delivery-performance-figma-design.md), [Project financial performance](project-financial-performance-figma-design.md), [Sales-to-Delivery handover](sales-delivery-handover-design.md), [Won delivery continuity](won-delivery-continuity.md), [Sales aftercare](sales-aftercare-figma-design.md), [Estimate–actual review](estimate-actual-review-figma-design.md), [Material changes](material-changes-figma-design.md), [Commissioning & as-built](engineering-commissioning-as-built-design.md), [customer communications D-025](customer-communications-d025.md) | Page content, lifecycles, rules and vocabulary carried into the refined pages |
| `src/shell/navigation.ts`, `src/components/product-navigation.tsx`, `src/projects/model.ts`, `src/platform/permissions.ts`, `docs/testing/evidence/permissions-matrix/role-grants.json` | The Projects rail and phone bar, phases and task statuses, capabilities and observed role profiles |
| [BP-06](../blueprints/BP-06-projects-commercial-delivery.md), [PPO-STD-001](../standards/naming-conventions.md), [Readable reference namespaces](readable-reference-namespaces.md) (PPO-REFERENCE-NAMESPACES-DEC), [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [Build from the named Figma version](figma-named-version-build-handoff.md), [ADR-0053](ADR-0053-figma-page-design.md), [ADR-0050](ADR-0050-font-awesome-light-icons.md), [product direction](product-direction-quality.md) | Naming, reference form, tokens, the separation of acceptance from shipped values, and what may be recorded here |

The new file's link and key are not recorded in this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

Seeded from the interface matrix of the brief; one row group per scope area follows as the sheets are drawn. Ownership: PJ-01 prepares only; PJ-05 is the commercial authority; PJ-07 and PJ-09 stay independent; Site assurance owns the ITP and EN-08 owns the test basis; PJ-09 owns the acceptance decisions; Service owns bookings; Supply owns receiving; Finance owns claims.

| Field | Declaration |
|---|---|
| Scope identity | The Projects workspace: `route:/projects` and the register views (scope PJ-02), `route:/projects/new` and the proposed `/projects/initiation` (PJ-01), `route:/projects/[id]` and its views (PJ-02, PJ-03), `route:/projects/programme` (PJ-03), `/projects/readiness` (PJ-07, proposed), `route:/projects/commercial` and `/projects/[id]/commercial/[entry]` (PJ-05), `/projects/risks` (PJ-04, proposed), `/projects/subcontracts` (PJ-06, proposed), `/projects/assurance` (PJ-09/site-assurance, proposed), `/projects/updates` (PJ-08, proposed), `route:/projects/acceptance` and its six routes (PJ-09), the Projects view of field work, the two Projects insight pages (RP-03, FN-03) and the Projects settings pages. No parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist; Record detail; Overview / dashboard; Planning workspace (Schedule, Programme, readiness Programme); Review / comparison (Baselines, work evidence, update approval, stage closeout); Work queue + persistent detail (Changes); Document & evidence (stage pack, update preview); Form / guided workflow and centred dialogs; states. Each sheet's type is in section 3 |
| Reused components | Local copies of the accepted shell under the Sales file's names: Shell / Top bar, Shell / Rail · collapsed (with Projects as the current workspace), Shell / Right rail · collapsed, Shell / Workspace menu · docked, Shell / Top bar · 1024, Phone / Header · compact, Phone / Status bar, Phone / Tab bar; the kit Sales / Status chip (nine tones), Sales / Button (six kinds), Sales / Avatar, Sales / Checkbox, Sales / Filter chip, Sales / Tab, Sales / KPI tile; 101 Icon/* components and Brand/Logo mark; the "PPO colour" collection (66 variables). Component names are kept identical to the Sales file so the module files converge on one library |
| Source authority | The decisions in section 1 and Dean's 9 November direction. The fixture is synthetic: as at Thursday 5 November 2026, 09:00 AEDT (Melbourne), signed in as project manager Morgan Lee; site facts in site time with the zone named when it differs |
| Incoming handover | The exact accepted Won event and handover r01 from CR-03 (frozen text, fingerprint); the exact quotation revision from ES-07 for the source check; customer, contacts, witnesses and sites from CS-01 to CS-04; design basis, change events and the test, release and configuration basis from EN-02, EN-07 and EN-08; demand from SC-01 and withdrawals from SC-09; bookings, field hours, inspections and incidents from Service; the Project update template from DK-06. Arriving creates no business record |
| Outgoing handover | Questions to Sales and Estimating; the receiving decision and Started; prepared requests to EN-02, PJ-03, SC-01, PJ-06, PJ-08 and PJ-04; the accepted subcontract brief as an EN-06 version-2 handover; `ProjectClaim` to Finance on each milestone claim; approved updates as M4 messages through EC-04; stage pack OUT-13 issue through DK-03; a CR-05 aftercare item and an ES-09 outcome review when a project closes; Waiting on customer, Waiting on others, reviews, ageing escalations, owned follow-ups and review deadlines to My Work. Nothing drawn awards, purchases, books, invoices or posts to MYOB |
| Exceptions and recovery | Loading permitted evidence; true-empty with counts 0; filtered-empty with filters restated; could not load (counts dash); denied or not found (no leak); stale (newer save by someone else, reload keeps the unsaved reason); partial source (Supply, Engineering, Service or Finance unavailable, counts dash, "may be incomplete"); outcome unknown with recovery; read only (closed project, frozen baseline, approved basis, observer, owned by another); bulk action partial failure. Section 3 lists the sheets that draw them |
| Departures | Section 5 |
| Verification | Section 6 |

## 3. Sheet inventory

Desktop sheets are 1440 × 900 frames unless marked full length. Node IDs are those of the sheet frames in the new file; each scope page carries the sections Desktop 1440, Dialogs and panels, States, Tablet 1024, Phone 390 and 320, and Flows and notes.

| Code | Sheet | Page | Route or scope | Type | Node |
|---|---|---|---|---|---|
| — | Read me: header card, Sheet index and notes card, audit card, Page template card | Read me | — | — | drawn in this change |
| — | Shell components, kit, icons, tablet and phone chrome, hidden helper nodes | Shell and kit | — | — | shell `12:87`, kit `12:88`, icons `12:89`, chrome `12:90` |

The per-sheet rows are added batch by batch as the sheets are drawn (section 11.1 of the brief: PJ, IN, RC, PG, RD, CM, RK, SP, SA, SU, AC, FS and IS, then X, PS, ST01, TB, PH and AD).

## 4. Rules applied

- **Reference form.** Every new PPO record reads `<NAMESPACE>-<TYPE>-<NUMBER>`: `SYN-PRJ-000027`, `SYN-QUO-000174 r02`, `SYN-OPP-000326`, `SYN-ITP-000014 r02`, per [PPO-REFERENCE-NAMESPACES-DEC](readable-reference-namespaces.md). Revision labels are two-digit (`r01`, `r02`). The longer `SYN-PPO-…` form on the accepted Design pages is legacy and is listed in section 5.
- **Role words.** "Project manager", never "Coordinator"; the portfolio owner is the "Projects lead"; field capture is by the "Site supervisor".
- **No score, percentage or index** of health, readiness or risk anywhere. Attention is a rule in words. The CR-03 chain is nine cells. Margin on FN-03 and the on-time measures on RP-03 are accepted facts.
- **Lifecycle.** Active or Closed; phases Planning, Procurement, Delivery, Handover; task statuses Planned, In progress, At risk, Complete; Started is the project manager's own fact; stages close and reopen under guard. Overdue means not complete and dated before today in site time.
- **Schedule.** Baselines are immutable revisions that keep their calendar; the forecast is a reasoned task save; FS and SS dependencies warn and never move dates; variance names its calendar ("+6 calendar days · +4 working days, Block C calendar"); only the project manager edits the calendar; a RAID Dependency is not a Gantt predecessor.
- **Money.** Requested, priced and approved amounts are never added together; Unknown is never A$0.00; totals read Held when a source drifts; the reviewer differs from the author; approved variations freeze and a signed adjustment is its own record; margin uses only the PJ-05 adjusted value and is visible to `finance.read` or `shared.finance.read` holders; milestone claims total exactly; no retentions; field hours and parts are cost evidence only.
- **Register standard.** One line per cell with ellipsis and sideways scroll; view tiles under the title; toolbar with segmented views, filter chips, Filters and Columns; frozen first column and row menu; footer with the count, as-at time and pager; no second search box.
- **Shell geometry and tokens.** Every sheet instances the copied top bar, rail, right strip and, where shown, the docked menu; content runs from x 80 to 1392 with 24 px gutters; Roboto 11 to 20 px; colours bound to the "PPO colour" variables; scrims are plain navy paints at 32 %.
- **Counts state their rule** and read a dash when a source cannot be read; unavailable or restricted sources are never zero. Who did what and when sits on every record; frozen revisions carry fingerprints; derived values carry a "why this" trace.

## 5. Assumptions and proposed departures

Each item is for Dean's decision; the sheet that shows it carries the A-number in its notes card.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | Project references use the short namespace form (`SYN-PRJ-000027`); the `SYN-PPO-QUO-000174 r02` and `SYN-PPO-PRJ-000027` references on the accepted PJ-03 and PJ-05 Design pages are legacy examples whose numbers carry over unchanged | Keep; no rewrite of the Design pages |
| A2 | The three project classes are drawn as "Class 1 · Class 2 · Class 3 · illustrative" on the settings sheet (PJ-01 Q11) | Dean names them |
| A3 | A critical path or what-if resequencing appears only on one proposal sheet, never moving dates (PJ-03 Q5) | Keep as proposal |
| A4 | The Projects Pulse is a new page under Delivery, proposed, with My Work remaining the cross-module queue | Keep |
| A5 | Acceptance & closeout is recomposed inside the shell's 1312 px content region; the Design file's fixed 220 / 464 layout is the departure | Keep |
| A6 | The phone bar is My Work, Projects, Programme, Acceptance & closeout, More, as the code carries it; Updates sits under More (PJ-08 proposal recorded) | Keep |
| A7 | A Health view is drawn once as a proposal with every threshold marked "Policy not configured" (PJ-02 Q, NAD-04, D-017) | Keep as proposal |
| A8 | Display numbers V-01…, O-01…, N-01… for variations, obligations and notices are drawn and marked proposed (PJ-05 G3); the allocation rule is left to the build | Keep as proposal |
| A9 | The collapsed docked workspace menu is a 56 px icon strip with per-user persistence, derived here because the Shell file has none; a proposed shell departure | Keep as proposal |
| A10 | The rebuilt shell copy "Shell / Rail · collapsed" shows Projects as the current workspace; everything else matches the Sales copy byte for byte except node IDs | Keep |
| A11 | Capabilities marked † in the brief (updates prepare and approve, site assurance plan, check, review and release, RAID read and edit) do not exist in `src/platform/permissions.ts`; the sheets draw them as design assumptions. The observed `coordinator` profile holds no `project.commercial.*` or `project.specialist.*` grant and no `acceptance.technical`, `.commercial`, `.receive` or `.response.validate`; `acceptance.commercial` sits with `finance-reviewer` | Record; a build needs its own capability decision |
| A12 | Code, the role profile `coordinator` and the earlier Design pages still say Coordinator; renaming them is a separate change | Record |
| A13 | `docs/design/development/pages/scope-pj-09-site-assurance.md` still reads "Draft for visual review" although the design was accepted on 1 November 2026 | Record as stale; fix in its own change |

## 6. Verification

To be completed as batches land: renders inspected per sheet; structural pass (children inside their frame, no wrapped register cell, Roboto the only family, every sheet labelled); position audit per page (sheets inside sections, no overlap at any level, nothing loose, separator pages empty); contrast computed from the variables on ST01; story scan of every SYN- reference, name, date and value against section 9 of the brief; capability scan against the persona matrix. Repository checks run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

## 7. Not drawn and open questions

Open questions carried from the repository's own records, not re-asked here: PJ-01 Q7 (return after acceptance needs a contract change), Q9 (how a real source conflict settles), Q11 (class names); PJ-02 Health thresholds (NAD-04, D-017); PJ-05 D-010, D-017 and gaps G1 to G8; PJ-06 competence and insurance evidence; Site assurance "does Powerplants run ITPs this way"; PJ-04 escalation rule and whether RAID becomes a closeout gate; CR-03 OQ-02 and OQ-03.

## 8. Boundary and next steps

This record authorises nothing in the application: no code, route, migration, permission, capability, grant or seed. The design register (`docs/design/development/register.json`) and the `pages/route-projects-*.md` and `scope-pj-*.md` guidance are not edited here; every Projects route stays "Needs review" and their update follows in its own reviewed change once the design is accepted. Sales file follow-ups: the two-digit revision labels (`r01`, `r02`) in a polish batch; the collapsed docked menu and the register standard once adopted. Named versions are Dean's to save; any later design change needs a new one.
