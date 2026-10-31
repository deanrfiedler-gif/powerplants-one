# Estimating intake and workload — design reference

Stable entry: `route:/estimating`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating`.

## Purpose and task

ES-01 is a register/worklist for permitted Opportunity briefs, native Discovery ownership/readiness and exact saved estimates. Find work, inspect its scope and next step, and continue in the owning record. Intake allocation, acceptance/return commands and priority policy remain Not configured; Required response remains Unknown. Sales ownership, action dates and post-Won handover obligations do not supply those missing policies.

## Accepted design and provenance

The [11 October decision](../../../decisions/intake-workload-design.md) adopts the named version “Intake & workload — Pipedrive pattern, accepted”. Live source inspected: accepted page 128:8845, desktop 128:8846, selection 128:9024, Saved estimates 172:1535 and phone 128:9231. Retained [icon-free captures 01–07](../../../reference/ui/estimating/intake-workload-design-r01/README.md) remain unchanged. Later accepted compact-header and menu amendments in that decision take precedence over the original captures. The earlier [ES-01 board](../../../decisions/es01-design-board.md) and [September build evidence](../../../testing/evidence/estimating-workload-design-adoption/README.md) are historical: their docked panel, drawer, segmented views and phone cards are replaced.

Source presence is separate from application comparison, owner acceptance and deployment. No new accepted review fingerprint is recorded.

## Desktop

Use the current application shell, a flush 240 px collapsible secondary menu, 60 px toolbar and full-width register. All workload, My estimating work, four Scope readiness views and Saved estimates share the menu. Its foot names the unconfigured intake rules. Search is literal; supported sorts are Recently changed and Customer. Owner and readiness controls also remain available in Search and filters.

The register has 40 px rows with opportunity/source version, title, customer, readiness, changed date, both owners, Discovery, site and Sales context. Its checkbox and action columns remain fixed while wider fields scroll. Title takes the extra width when menus collapse. Opening a record never changes register width. A right-aligned modal snapshot overlaps it, capped at the width with both menus open (960 px at 1440). Close, previous and next sit at its left edge. At tablet width the snapshot fits the viewport and keeps its own scroll, with no fixed 1360 px docked-panel threshold.

The snapshot shows brief, next step, readiness reasons, both owners, exact Discovery alternatives and saved cost revisions. Sales brief state, receiving owner, source drift and exact acceptance context are explicitly attributed. Open Sales opportunity and Open/Start discovery remain native handovers.

Selecting rows opens a 360 px overlapping panel. Open in sequence follows most recently changed order with an ID tie-break, independent of displayed Customer sort. Export list re-reads current permissions and compares selected record facts before downloading an allowlisted CSV; changed or inaccessible rows clear selection and require a fresh selection. Filtering, changing view/identity or changed source facts clears selection. No selection command accepts or assigns anything.

Saved estimates remains `/estimating?tab=estimates`, with a separate search, newest saved first, exact version links and AUD sell excluding tax. Null sell reads Not estimated. Existing workload search/owner/readiness/sort remain in the URL when switching tabs. The design's decorative saved-row checkboxes are adapted to record icons and open links: no saved-estimate bulk command has an adopted contract.

## Bounded read and counts

`readEstimatingWorkload` remains a repeatable-read, read-only join under current CRM, estimating and underlying source authority. Search and owner predicates precede each 100-opportunity candidate limit; readiness filters apply afterwards. Closed opportunities appear only with existing estimating workspaces. The selected sort defines each window.

All workload and My estimating work have separately bounded windows sharing search and sort. My means the estimating workspace owner equals the current actor, never the Sales owner. Menu owner counts report permitted rows in each of those windows. Readiness counts use the selected owner window and are calculated before the readiness view; selecting a readiness state does not change those counts. Counts never claim a global total. Coverage copy states the window and advises narrowing search for older work. Underlying denied candidates can reduce the permitted result below 100; they do not become hidden counts.

## Mobile

At 390 and 320 px use the adopted compact shell header: menu/view picker, conversations and filters, with no duplicate page toolbar. Filters expose search, owner, readiness, sort, refresh and selection. Flush rows are about 80 px: title/change date, reference/readiness, customer/estimating owner and chevron. Long titles remain available in the snapshot. Input text is 16 px on phones.

The full-screen snapshot has reference in its header and a wrapping full title in the body; its primary handovers stay at the bottom. At 320 px previous/next move into Snapshot actions so the header fits. Tablet keeps the desktop register horizontally contained. At 200% enlargement the same available-width rules apply.

Use native buttons, links, checkboxes, table semantics and dialogs. The labelled register scroll region accepts keyboard focus and arrow-key scrolling. Enter/Space opens a row; Escape closes the top dialog and restores the opener. Tabs use arrows/Home/End. Browser Back/Forward and reload restore workload filters, Saved estimates and the record query. Selection is transient and is not restored as business state. The page is online only.

## States and recovery

Initial loading shows no current counts. During a refresh, earlier results are explicitly unconfirmed and record/selection actions are disabled; counts are withheld, with visible refresh feedback on the compact phone page. Polling does not supersede an in-flight read. A failed read removes obsolete rows, counts, selection and snapshot, with Try loading again. Denied access has a distinct message. No matches, no permitted workload and no readable saved estimates are distinct states. A readable row without edit authority retains context but offers no Start discovery action.

Discovery creation rechecks the existing edit, receiving and linking rules in the native flow. Starting does not accept a Sales brief. Exact accepted-brief selection may be reviewed and atomically bound by the adopted LC-13 creation flow; an existing workspace uses its separate reviewed linking command. A changed accepted source disables Start here and must be reconciled in the owning workflow. Alternatives retain their option IDs; saved estimates retain exact version IDs and their original costed Discovery revision.

## Shared components and verification

Reuse SecondaryMenuFrame, RegisterTable/Chip/SortHeader, WorklistChoice/Menu/Panel, Button, ShellIcon, ErrorNotice and useResource. Consumer states and limits are in the [component binding](../component-bindings/2026-10-31-intake-workload.md). Scoped snapshot geometry supplies the accepted overlap while native dialog focus behaviour supplies modal interaction; no shared shell or receiving command is replaced.

The [ES-01 scope](scope-es-01.md), [programme handover](../../../delivery/estimating-programme-handover.md) and [implementation evidence](../../../testing/evidence/intake-workload-accepted/README.md) record coverage and limits. The draft guides `guide.page.estimating` and `guide.es.01` remain unapproved. Device/assistive-technology review, owner visual acceptance, merge and deployment are separate.
