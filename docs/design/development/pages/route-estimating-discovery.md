# Discovery register — page contract

Stable key: `route:/estimating/discovery`. Scope: `scope:ES-02`; parents PPO-010, EST-01–EST-09 (ADR-0035). Owner: Dean Fiedler. Native visual review: **pending**; no reviewer, date or accepted fingerprint recorded. The accepted design and implementation verification are separate.

## Purpose and source

Find a permitted discovery workspace, understand its selected option's saved readiness and cost basis, inspect its read-only snapshot, and open the accepted wizard or exact saved estimate. Incoming: Intake & workload, accepted Sales briefs and eligible opportunities. Outgoing: `/estimating/discovery/new`, `/estimating/discovery/[id]` and `/estimating/estimates/[id]?version_id=…`. Open Intake goes to `/estimating/intake`. This register never edits discovery, costs, prices or issues a quotation.

Authority: [accepted design and D1–D7/Q1–Q4](../../../decisions/discovery-register-figma-design.md), [native implementation](../../../decisions/discovery-register-native.md), [accepted ES-02 wizard](../../../decisions/es02-wizard-figma-design.md). Page type: r20 register/worklist with large snapshot. Legacy CREMS behaviour is not a prerequisite.

Figma **PPO - Design**, named version **Discovery register — Pipedrive pattern, accepted**; use live corrected SYN-PPO-OPP numbers. File index `630:2`, row `1414:357730`; page `1400:345306`; notes `1402:350109`. Retained references: [eight icon-free captures](../../../reference/ui/estimating/discovery-register-figma-design-r01/README.md), unchanged, plus historical [wizard container r03](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html).

## Desktop

- All workspaces `1400:345640`, Northbank snapshot `1400:352346` at 1440 × 900; tablet `1400:355129` at 1024 × 900. Parts `1400:345375`, grid header `1400:345376`, row `1400:345440`.
- Reuse the rail, Conversations top bar and Estimation wizard breadcrumb. Dock the 240 px menu on desktop; collapse it at tablet width. The tablet reference has the shared rail collapsed; its existing owner preference remains available. Compact 60 px toolbar, flush grid, 40 px ruled rows. No extra module card.
- Columns retain the reference's 1709 px content width and horizontal scrolling. Title, customer, readiness and cost basis lead; selected option, opportunity, revision, option count, estimator and changed date follow. Checkbox and settings edges stay fixed. No row grouping is introduced.
- One row per workspace shows the selected option, ordered by saved workspace change. D3 views count the current window of up to 100 permitted rows and may overlap. Archived alternatives count. Filters use saved owner/customer IDs. Q2 is resolved: an owner is recorded; the label is Estimator.
- Snapshot: selected basis and saved cost on the left, alternatives/revisions and labelled activity on the right, Open estimate / Open workspace footer. Exact estimate version handover. Focus enters the snapshot; Escape/Close returns focus; obscured list controls are inert. Previous/next traverse the current filtered rows.
- Complete is scope evidence only. No colour, count or cost label implies approved price, readiness to quote or operational authority.

## Mobile

390 × 844 `1400:354630`; 320 × 844 `1400:354952`. Reuse compact phone header and estimation bottom navigation. Title stays Estimation wizard with ellipsis where necessary; page guide is in the identity menu. List rows show title/date, SYN-PPO-OPP number/customer, selected-option letter at 390 (omit A at 320; retain another selected option), then readiness and cost basis in words. Truncate long context with accessible full link text. Rows open the wizard; there is no phone snapshot. New workspace uses the existing route and is hidden without edit permission.

## States, controls and offline contract

Loading `1400:355914`, no matches `1400:356040`, failed read `1400:356154`; no workspaces `1402:3944`; view only `1402:4539`. All live frames and notes were inspected. Failed/denied reads show no list or counts. Retry rereads; no matches names active filters and clears them; empty offers Intake. Unavailable cost is stated and excluded from costing claims. Detail/history failures never invent missing evidence. No validation or confirmation dialog is needed because the register has no write command.

Shared consumers: application shell, menu, buttons, register table, tabs and dialog (filter panel). Reuse semantic tokens and Font Awesome Kit name mappings; no Pro artwork is retained. Shared focus, menu keyboard handling, tab arrow keys, dialog focus handling and labelled actions apply. Online only under [offline system](../systems/offline.md); no new offline promise.

## Unspecified and deviations awaiting review

Bulk actions, column settings, denied-row composition, 200% zoom, full Revisions tab, desktop loading/error and hover captures are missing. Disabled placeholders preserve the drawn grid without inventing commands. Recent activity uses available selected-option discovery revisions; a combined estimate/alternative activity feed remains an open question. Recorded follow-up/system/facility facts replace unsupported growing-area and systems-to-confirm counts. The existing compact shell may truncate the 320 px title; its global search stays in the phone menu. The unavailable Reviews & approvals destination and example notification counts are not fabricated. Shared date/version formatting and fallback icons can differ from the frames when the owner's Kit is unavailable. These adaptations are implementation proposals, not accepted design changes.

The guide `guide.page.estimating.discovery` describes real controls and recovery in Australian English. [Verification record](../../../testing/evidence/discovery-register-native/README.md) records functional and visual evidence and limits. Owner device review, UI baseline adoption, business acceptance and deployment remain pending.
