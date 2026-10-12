---
document_id: PPO-FERT-FIGMA-DESIGN-DEC
date: 2026-10-12
owner: Dean Fiedler
status: Owner-accepted design; aligning the built page, the FN-T61 test change, the shell rollout and UI baseline acceptance separate
source_commit: 8d1b93bcc6a24723f62669331e8de2a1f3714bf9
versioning: git
---

# Priva Fertigation Workbench Figma design — owner decision

On 12 October 2026 Dean asked for the Priva Fertigation Workbench record page to be drawn in Figma, in the working file "PPO - Design", as a proposal for his review. The page had already been built in the application from the older Claude Design board ([workbench refinement record](fertigation-workbench-refinement.md), "Built to the board"; pull request 440). The Figma design was needed so that the page's look, style and format align with the pages already designed in Figma.

Dean set the authorities himself:
- **Appearance and layout:** the accepted Figma pages. These are the Shell v2 Pipedrive pattern (flush secondary menu, grid registers, More panel, phone list rows and icon-only tab bar), the shared record layout, and the accepted module pages.
- **Content:** the built page and the board. That means its sections, registers, figures, states, wording and the rules behind them. "Where the two disagree on appearance, follow the Figma conventions and list the difference, so the application can be aligned afterwards."
- **Design freedom:** module-specific elements with no Figma precedent may be designed fresh from the file's tokens, type styles and icons, with honest data, and marked as candidate shared components.

Claude drew the proposal and listed eight questions, each with a recommendation except the last. Dean replied: "Regarding those decisions you need from me, I am happy for you to proceed based on your recommendations." As with the earlier record pages, this accepts the design with its recommended answers. The design reference is the named Figma version "ES-02 Priva Fertigation Workbench — Pipedrive pattern, accepted", which Dean saves himself.

This record retains:
- his decisions, in his words;
- the design reference and its icon-free captures;
- the conformance declaration;
- the display rules;
- the differences from the built page that the application should adopt;
- what remains open.

Scope:
- **Route:** the existing route `/estimating/fertigation/[id]`, register entry `route:/estimating/fertigation/[id]` ("Priva Fertigation Configurator · detail"), workspace scope `ppo-fertigation`.
- **Family:** ES-02 Fertigation ([ADR-0038](ADR-0038-priva-fertigation-native.md)).
- **Parent requirements:** EST-02, EST-03 and EST-06. No parent requirement ID is added or renamed.

This is a design decision. It authorises none of the following:
- application code, including aligning the built page;
- a change to the native calculation, its findings or severities, or the calculation edition;
- a change to the board parity register or to the retained board captures;
- a route, migration, permission or capability;
- deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Draw the record page in Figma as a proposal | User decision, 12 October 2026 | "Draw the Priva Fertigation Workbench record page in Figma … as a proposal for my review." |
| Authorities for appearance and content | User decision, 12 October 2026 | "Treat those Figma pages as the authority for appearance and layout conventions. Treat the built page and the board as the authority for what the page contains." |
| Design freedom for module-specific elements | User decision, 12 October 2026 | The capacity headroom scale, system concept, required duty build-up, injection requirement bars, I/O banks, irrigation timeline and cycle detail, storage gauge, candidate comparison, trace and resolve drawers and the scope readiness block "may [be] design[ed] fresh" |
| Accept the design and its recommendations | User decision, 12 October 2026 | "Regarding those decisions you need from me, I am happy for you to proceed based on your recommendations." Q1–Q7 take the recommended answers. Q8 had no recommendation and stays open |
| Q1 Header secondary action | Resolved by the reply | History. Report, Irrigation valves, Compare draft, the exports and copy, restore and archive move into the record's "…" menu |
| Q2 Breadcrumb | Resolved by the reply | "Scope register / SYN-PPO-FRT-000001". The full module name does not fit the top bar at 1440 px with the expanded rail and the secondary menu |
| Q3 Phone tab bar | Resolved by the reply | More stays the current tab; fertigation gets no tab of its own |
| Q4 Register row actions | Resolved by the reply | Edit and Remove move to the row "…" menu in a fixed right-hand column; selecting the label opens the record |
| Q5 History | Resolved by the reply | A centred dialog, not a side drawer |
| Q6 Channel A's breach | Resolved by the reply | "Candidate failure" everywhere, as the native rule requires; never "Conflict" and never counted as a finding |
| Q7 Menu check badges | Resolved by the reply | As the code does: only Scope review shows a check, and only when the calculation shown has no open findings. Other views without findings show no badge. None applies to the reference scope, so none is drawn |
| Q8 System-concept SVG export and F12 device-to-channel allocation | Open | Both were already awaiting Dean's decision from pull request 440. Claude had given no recommendation before the reply; it now recommends keeping both out of this design (section 7). Nothing is drawn for either |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design" in Dean's Figma team, at the named version "ES-02 Priva Fertigation Workbench — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "ES-02 Priva Fertigation Workbench (accepted)" `408:4`, sample SYN-PPO-FRT-000001 "Northbank Berries · Irrigation expansion", saved revision 2: <ul><li>desktop views at 1440 × 1000: Overview `410:525`, Growing areas & irrigation `413:93899`, Water & hydraulics `414:3807`, Recipes & dosing `415:89832`, Controls & I/O `415:93446`, Operating plan `416:93421`, Unit configurator `417:92044`, Evidence & delivery `415:90652`, Scope review `417:93115`;</li><li>the Overview with an overlay open: Resolve a conflict `419:96216`, Calculation trace `419:97167`, History `419:98118`;</li><li>phone at 390 × 844: Overview `418:94059`, the valve register as list rows `418:94364`, and the Overview with the section sheet open `420:5697`;</li><li>the twelve-state sheet `419:94281`.</li></ul>Its notes card `421:9574` lists the scope, the conventions by source page, the elements designed fresh, the differences and the decisions |
| Components | Page components, all named "Fertigation / …": Token `408:11`, Severity badge `408:30`, Section item `408:298`, Metric tile `408:310`, Section head `408:323`, Next action row `408:329`, Headroom row `408:83328`, Concept node `408:83348`, Scope readiness `408:83651`, Context strip `408:83674` and Section menu `408:83690`. Six icons were added to the Components page from Dean's Kit: map, flask, leaf, code-compare, arrow-up-from-bracket and solid sliders |
| Prototype | Flows "Fertigation — desktop" from the Overview and "Fertigation — phone" from the phone Overview, with 269 click links. Overlays are absolute layers bound to Prototype booleans with a transparent click-catcher, as elsewhere in the file: `fertresolve/open`, `ferttrace/open`, `ferthistory/open`, `fertactions/open` (the record "…" menu) and `fertsections/open` (the phone section sheet), plus the shared `more/open`, `sidemenu/open` and `sidemenu/collapsed` |
| Retained captures | [Priva Fertigation Workbench Figma design r01](../reference/ui/estimating/fertigation-figma-design-r01/README.md): fourteen icon-free PNGs with hashes. The nine views are retained at full length. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing route `/estimating/fertigation/[id]` (`src/app/(business)/estimating/fertigation/[id]/page.tsx`, rendering `src/components/fertigation-workbench.tsx`), register entry `route:/estimating/fertigation/[id]`, workspace scope `ppo-fertigation`, family ES-02, requirements EST-02, EST-03 and EST-06. Capabilities are unchanged |
| Page type (r20) | Record detail, with nine sections in the secondary menu. Supporting types: Review / comparison (Scope review, the candidate comparison, History) and a Document & evidence workspace (Evidence & delivery). The Resolve and Calculation trace drawers and the History dialog keep their roles |
| Reused components | <ul><li>Shell v2: the v2 Rail with "Specialist configurations" current (`src/shell/navigation.ts` maps the route there), v2 Menu heading and Menu item, Menu strip and Menu edge, the More panel, the grid header and cells and the row-actions cell, the phone header and the icon-only v2 Tab bar.</li><li>Shared record layout ([lead record page decision](lead-record-page-design.md)): Record / Header, Record / Field, Record / Banner and Record / Filter chip; Record / View tab from the work order record page for the register tabs.</li><li>The Job pack pattern for a record with sections: grouped secondary menu contents, a menu foot and the record "…" menu.</li><li>The project record page decision (`docs/decisions/project-record-page-design.md`, in review as pull request 436): headings outside cards and the pastel-with-darker-outline Gantt palette (`proposal/gantt-*`) for every chart.</li><li>Tag, Button and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`.</li><li>New: the page components in section 2.</li></ul> |
| Incoming handovers | The scope register and a saved Discovery alternative (the binding shown in the header meta) |
| Outgoing handovers | The scoping handover to Discovery, the retained customer and internal reports, the exact export and the valve CSV. Unchanged |
| Source authority | <ul><li>The built page on pull request 440 and its [board parity register](../testing/priva-fertigation-board-parity.csv) and [captures](../testing/evidence/fertigation-board-parity/README.md).</li><li>The [retained board captures r01](../reference/ui/estimating/fertigation-design-board-r01/README.md), for structure and intent only.</li><li>[ADR-0038](ADR-0038-priva-fertigation-native.md) and the engine `PPO-FERT-NATIVE-CALC-r01` for every value, severity and state.</li><li>`src/components/fertigation-frame.tsx` for the menu badge rule (Q7).</li></ul>Fixture: [`boardReferenceScope`](../../tests/helpers/fertigation-board-scope.ts) (FN-T117), which the engine reports with 2 conflicts, 0 incomplete and 6 review findings plus Channel A's candidate failure |
| Proposed departures | Section 5, to be adopted when the application page is aligned |

## 4. Display rules

- Every figure is an entered value or an engine result for the scope shown. Nothing is recalculated for display. An absent entered value or an Unknown or Not assessable result is a dashed token in words, never zero or a blank.
- Status always carries words. Native severities are Conflict, Incomplete and Review. A candidate failure is labelled as such and is never counted.
- The menu badge shows the most severe open finding for the view and its count, with an icon whose shape differs per severity. It is hidden from the accessible name and announced through `aria-describedby`. The check follows Q7.
- Charts use pastel fills with a darker outline of the same hue: within capacity or in range blue, relying on storage or verification required amber, over capacity or failed red, delivery and spare green. There are no dark navy fills. Brand green appears only as an outline or a thin stripe, never as a fill behind navy text.
- Chart text stays 11–13 px. Axis ticks sit under the track they measure.
- Registers use the shared grid with single-line 40 px rows. Wide registers scroll sideways inside their card, with the row-actions column fixed on the right.
- Items gated on calculation edition r02 are drawn nowhere: first arrival and stock endurance, the three proposed checks, sensitivity and break-even.

## 5. Differences from the built page

The application should adopt these when the page is aligned to this design.

1. **Shell:** the Shell v2 labelled rail and flush secondary menu, and the breadcrumb "Scope register / SYN-PPO-FRT-000001".
2. **Record header:** the shared one-row layout, with the status as a tag beside the title:
   - Saved revision N, success;
   - Unsaved changes, warning;
   - Conflict — proposal retained, danger;
   - Historical revision · read-only and Archived, neutral.

   History is the one secondary action (Q1). FN-T61's Irrigation valves precondition must follow the move into "…".
3. **Header meta and context strip:** the meta line carries the reference, the scope state, the Discovery binding and the saved time. The context row becomes a strip with the site and customer, the operating scenario select and the synthetic flag.
4. **Secondary menu:** readiness and badges use the pastel palette with icon legends (Q7).
5. **Page head and sections:** the page head title is 20 px bold under the 24 px record title, and section headings sit outside cards.
6. **Registers:** the shared grid, with Record / View tabs (a count on the selected tab only), compact filter buttons, Find in register, Add, and the row "…" menu (Q4). Counts move to the grid footer.
7. **Charts:** pastel fills with outlines, replacing the navy I/O "used" cells, the navy required-head bar and the navy allocation source box. Pastel delivery bars with a dark outline replace the 2.41:1 brand-green bars.
8. **Channel A:** reads "Candidate failure" in capacity headroom and in injection requirement (Q6). The built page shows "Conflict" there.
9. **Wording:** the engine text "Channel Channel A · Nutrient …" is drawn once. "1 containers per emitter" becomes "1 container per emitter".
10. **Axis ticks:** on Recipes & dosing and the Unit configurator, the ticks sit under the bar track.
11. **Shortlisted candidate:** a "Shortlisted" success tag replaces the navy filled button, keeping one primary action per page.
12. **Scope review:** the tiles span the width above the two columns. The edition tile reads "r01 edition", with the full name in its footnote. Findings filter with Record / Filter chips and an "All roles · 8" select.
13. **Overview order:** next actions first at full width, then outputs and declarations side by side, 3 × 2 tiles, capacity headroom, system concept, evidence maturity and the project brief.
14. **Overlays:** a transparent click-catcher. History is a centred dialog (Q5).
15. **Phone:**
    - the page name only in the header;
    - a compact record block;
    - a section sheet with groups and badges;
    - the valve register as list rows;
    - 2 × 2 tiles without footnotes;
    - the Report / Save revision bar above the icon-only tab bar, with More current (Q3);
    - short labels ("CSV", "Add valve") that keep their full accessible names.
16. **States:** the edit-conflict example uses revision 3, and the historical example revision 1 at 12 Oct 2026, 08:43 AEST, to match the reference scope rather than the board's dates.

## 6. Not drawn

- Gated on calculation edition r02: first arrival and stock endurance (F11), the three proposed checks (F10), sensitivity and break-even (F3).
- Out of scope for this design: the A4 report pages (boards E and F), the phone site visit (board G, F8) and the import screen (board 10, WP-L3).
- Open (Q8): the system-concept SVG export and F12 device-to-channel allocation.

## 7. What remains open

- **Q8.** Claude's recommendation:
  - keep the SVG export out for now, because the concept schematic is explicitly not a survey, pipe-sizing or topology approval;
  - design and build F12 as its own increment once the engine exposes per-device allocation rows. The built page cannot show them honestly today.

  This is a recommendation, not Dean's decision.
- **Aligning the application page:** to this design, in a follow-up, including the FN-T61 test change.
- **Shell rollout:** the Shell v2 rollout to this route follows the shell decision for the other pages.
- **Named version:** Dean saves the named version. The pull request that adds this record stays a draft until he confirms it.
- **Not yet done:** a Present-mode click-through in Figma desktop and a contrast measurement of the new chart fills. The darker outlines are chosen to carry each mark, and no ratio is claimed.
- **No baseline:** no UI baseline is registered, and no owner visual review of the running page is implied.

## 8. Verification

- Every frame and overlay was checked with screenshots taken inside Figma during drawing. A structural audit found no overlapping top-level frames on the page. It also found no bound colour whose stored value drifted from its variable (5,301 fills checked), and every overlay hidden by default.
- The captures were made from copies on the "Captures (icon-free)" page. 721 icon instances were swapped for `Icon/placeholder`, and none was left. Hashes are in the captures README.
- The board parity register, the retained board captures and the application code are unchanged.

## Related

- [Workbench refinement record](fertigation-workbench-refinement.md), [ADR-0038](ADR-0038-priva-fertigation-native.md), [ADR-0053](ADR-0053-figma-page-design.md), [page contract](../design/development/pages/route-estimating-fertigation-id.md).
- Accepted pages whose conventions this design reuses: [Reviews & approvals](estimate-reviews-design.md), [lead record page](lead-record-page-design.md), and the project record page, Job pack and work order record page decisions in review (pull requests 436, 431 and 432).
