# Project register — design reference

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/projects`; PJ01 / PPO-012 / BP-06. Owner: Dean Fiedler. Application `/projects`. User-requested implementation; owner/device review pending. Preserve PRJ-01, PRJ-02, PRJ-07 and PRJ-08. Register / worklist is the r20 page type, with a project inspection window.

## Source and provenance

The current source is Dean's supplied Figma Projects page `209:46`, inspected 13 October 2026: desktop `209:47`, selection `209:238` (toolbar `209:260`, panel `209:301`), snapshot `209:118`, phone `209:457`, phone snapshot `209:617`, notes `209:478`. See the [decision](../../../decisions/projects-register-native.md) and [measured geometry](../../projects-register/figma-measurements.json). The notes' intended named version is **Projects register — Pipedrive pattern, accepted**; that saved version was not independently confirmed. The desktop snapshot render returned a hidden/black frame; its high-fidelity structure and the visible phone snapshot provide the source for the record layout. No exact public icon-free captures are available for this register yet. The private file link and licensed artwork remain outside Git.

**Design record, 17 October 2026.** The [Projects register design decision](../../../decisions/projects-register-design.md) locks in the accepted page: Dean confirmed it "Yes, accept as drawn (Recommended)". It retains five exact [icon-free captures](../../../reference/ui/projects/projects-register-design-r01/README.md) with hashes: desktop register, record window, two-row selection with the small panel, phone list and phone record view (copies `1110:124118`–`1110:126388`). Dean saved the named version **Projects register — Pipedrive pattern, accepted** on 17 October after the capture commit ("It's saved."). The comparison of the built page with these captures (ADR-0053 rule 7) has not been made, so the visual status stays Needs review. The 13 October statements above describe that date and are retained.

**Design comparison, 17 October 2026.** The [built-page comparison](../../../testing/evidence/projects-register/design-comparison.md) (ADR-0053 rule 7) captured `/projects` at 1440 × 900 and 390 × 844 with the design's synthetic projects and compared it with these captures. Layout, columns, views, toolbar, selection panel, phone rows and tab bar match. It lists 18 differences, C01–C18. Eight are proposed fixes awaiting Dean's go-ahead: the grid header colour, the At risk header alignment, the toolbar count size, 24-hour times under the adopted S6 rule, the opportunity reference in Sales source, "finishes" in At risk rows, the History heading and markers, and the phone record header. Five are adaptations already recorded in the implementation decision, and five are questions for Dean. The derived columns follow the design rules; two questions remain, an At risk milestone and overdue on a closed project. The visual status stays Needs review; the comparison is not a visual review.

**Design fixes, 17 October 2026.** The eight fixes are made and marked in the [comparison record](../../../testing/evidence/projects-register/design-comparison.md#fixes-made), with five fresh captures at the same viewports. Desktop: grid header labels in `--ink`, the At risk header right-aligned, the toolbar count in the frame's 14/20 body style in `--text-secondary`, and 24-hour S6 times from `src/shell/date-format.ts` in the toolbar ("updated 13:42 AEST") and History ("17 Oct 2026, 14:39 AEDT"). Record window: Sales source reads "opportunity reference · title" from a new `opportunity_reference` field on the `sales-handovers` read; At risk rows say "finishes"; the History chevron follows the label and the markers are hollow rings. Phone record: the header shows the reference and short creation date only and no longer covers the header rule. The questions (C08, C09, C12, C17, C18, Q-D1, Q-D2) are unchanged. Source presence and these captures are not a visual review: the visual status stays Needs review and no fingerprint is copied.

Retain the [earlier register image](../../../blueprints/projects-visuals/projects-register-desktop.png) and [Gantt r10 HTML](../../../reference/ui/projects/ppo-projects-gantt-content-r10.html) as historical and receiving-schedule references. They are not substitutes for this Figma register. The separately accepted `/projects/[id]` record-page design remains its own increment.

## Purpose and handovers

Find authorised projects by lifecycle, coordinator, customer, milestone date or explicit task risk; inspect saved context; open the exact schedule or Acceptance & closeout. Incoming records come from native creation or controlled Sales receiving. Customer/site permissions and independent Sales access govern reads. The register cannot close projects, change task dates or assign bulk work.

Views are Active (default), My projects, Closed, All, Overdue milestones, Tasks at risk and No target date. My projects means active records coordinated by the current actor; attention views include active records. Counts include all authorised matches; the primary rail badge includes all authorised active projects independently of filters. URL parameters preserve view/filter/sort, while page tokens, column visibility and selection are transient. Selection and CSV cover the displayed page only.

Next milestone is the earliest incomplete milestone, undated last with stable ID ties. Overdue means its finish date is before the site's observed local date. At risk counts non-milestone tasks explicitly marked AtRisk. Missing target, unscheduled milestone and no remaining milestones remain distinct. Project lifecycle remains Active/Closed; phase summaries do not create another lifecycle.

## Desktop

At 1440 × 900, use 240 px expanded navy primary rail, 64 px header, 240 px secondary menu and 960 px content. Honour the shared persisted rail preference. Secondary views are 40 px rows; content toolbar is 60 px with 16 px horizontal padding and 40 px controls. Use existing Roboto, semantic tokens, the original Brand logo and named Font Awesome Kit icons. Unconfigured/offline glyphs retain ADR-0050 fallbacks.

The shared `RegisterTable` adopts this scoped variant: white 40 px header and rows; column widths 44/240/200/120/110/80/180/190/140/90/170/44; thin rules; title medium 14/20; 12/16 secondary text. Checkbox and action columns pin to opposite edges. Table scrolling stays inside its bounded container, with a sticky header. Unknown dates sort last; sort direction is accessible. Column controls retain the title. The generic shared table keeps its existing dimensions elsewhere.

Selection changes the toolbar and opens a 360 px panel over the grid, with factual selected cards and Open in sequence/Export list actions. Hide panel retains selection; cancel clears it. Record inspection uses a native modal at the content top, width capped at 960 px, with 440 px fact column, 24 px padding, a fixed footer and separate activity/history scrolling. Prev/Next follow the selection or visible page. Escape and close return to the register. No document-level horizontal scroll is permitted.

## Mobile

At 390 × 844 and down to 320 CSS px, keep the existing 780/781 px boundary and shared header; view/filter toolbar is 61 px. Flush rows are at least 80 px with 16 px horizontal padding, a title, customer/target line, explicit risk count, milestone/date line and trailing affordance. Full values are readable in the snapshot. The 56 px add action remains above the 64 px navigation bar. The Projects phone bar exposes Work, Projects, Programme, Acceptance and More when permitted; icons keep accessible names.

Tap opens a snapshot. Press and hold selects; pointer movement cancels the hold, and Shift+Space is a keyboard alternative. Selection exposes labelled bottom actions. This behaviour is adopted in Figma notes but undrawn. The full-screen snapshot stacks facts, fact tabs and attributed history, with a fixed 64 px action footer. At intermediate widths use the shared secondary-menu overlay below 1200 px rather than shrinking the menu. Check 1024/768, 390/844, 320/740 and enlarged layouts.

## Components, states and accessibility

Reuse `SecondaryMenuFrame`, `RegisterTable`, `RegisterSortHeader`, `RegisterEmpty`, `RegisterFooter`, Button/ButtonLink, WorklistChoice/WorklistMenu, `ReadState`, shell header slots and FontAwesomeGlyph. Keep scope `#ppo-projects` and declared dependencies. Native table semantics, labelled checkboxes, `aria-sort`, visible focus, modal Escape/focus return and keyboard fact tabs are required. Sort/filter changes discard selection and restart paging.

Loading, failed/denied reads, empty/filtered-empty, long titles, unknown dates, unavailable Sales source, earlier history, phone selection and column controls are explicit adaptations beyond the drawn happy state. Failed refreshes cannot export retained rows; denial clears protected results. Each snapshot reads its own current schedule, history and separately scoped Sales handovers. Refresh and retry are read-only. New project and schedule commands retain their own native validation and recovery.

## Verification and review

The native fixture is `tests/browser/projects-register.spec.ts`; server authority and full-match/paging rules are in `tests/database/projects-register.test.ts`; CSV safety is in `tests/unit/projects-register.test.ts`. The [execution record](../../../testing/evidence/projects-register/README.md) lists actual results, viewport captures and limitations. `guide.page.projects` is maintained as Draft with stable sections. Owner acceptance, physical device/screen reader testing, CI, merge and hosted deployment are separate; no review fingerprint is promoted by this edit.

## PJ-01/PJ-02 backend continuation — 13 October 2026

The [backend contract](../../../decisions/project-overview-backend.md) joins exact native Sales receiving attribution, saved dates/baselines, phase counts, team, scoped RAID/actions and explained portfolio attention. Existing page types, shared Button/Field/dialog/Gantt controls, routes and scope IDs stay in place. Incoming handovers remain explicit accepted Sales events; outgoing actions remain native schedule, baseline, Activity, RAID and acceptance workflows. The backend contribution itself adds no component; the native register above uses its separately scoped register read.

Desktop and phone consumers must show the selected versus latest baseline, site timezone, unknown forecast when tasks are undated, historical versus current Sales evidence, named receiving owner, restricted coverage and preview continuation. Counts describe all authorised matches for the displayed filters; page tokens are transient. No current flags is not a health score or completion approval. Keep missing/stale/loading/denied and uncertain native-save states accessible through the existing controls.

The [accepted Project record design](../../../decisions/project-record-page-design.md) and its exact icon-free captures remain the reference for the later page. Exact new API-state desktop/phone captures are missing. [Backend evidence](../../../testing/evidence/project-overview/README.md) does not grant visual, device, guide or owner acceptance. Review fingerprints stay unchanged.
