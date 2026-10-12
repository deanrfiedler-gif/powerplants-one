---
document_id: PPO-ES02-WIZARD-FIGMA-DESIGN-DEC
date: 2026-10-12
owner: Dean Fiedler
status: Owner-accepted design; aligning the built page, the six-family definition, the timing data model and UI baseline acceptance separate
source_commit: 7fa346bdb02d21dbbbcdcc0c83e7b199276652ff
versioning: git
---

# ES-02 Estimation Wizard Figma design — owner decision

On 12 October 2026 Dean asked for the Estimation Wizard page to be designed in Figma, in the working file "PPO - Design", on the Pipedrive pattern and the shared record layout that the accepted pages use. The page had already been built from the older Claude Design board ([build record](es02-wizard-ui-build.md); pull request 439, not merged). In his words: "This module had already been created in the application before we started refining the UI pages in Figma, so the design may still have to be modified."

Three further instructions shaped the design:
- **Alignment, during the drawing:** "Ensure the theme, layout, and style of the Figma UI page aligns with the other UI pages that we have already created in Figma. You can still modify the design if need though. For example, ensure the left navigation rail aligns with the design that has been used in the other Figma UI pages."
- **Audit and polish, after the first review:** "The UI page in Figma looks good. Now just give it an audit and polish" for gaps, refinements, new features and a more professional finish. He also suggested "the pastel green colour to the cards relating to the 'Equipment families in this estimate', but only for cards that have systems included in them" and asked for Claude's view.
- **Acceptance:** after the polish, Claude listed ten questions, each with a recommendation. Dean replied: "Proceed with your recommendations." As with the earlier pages, this accepts the design and the recommended answers.

The design reference is the named Figma version "Estimation Wizard — Pipedrive pattern, accepted", which Dean saves himself.

This record retains:
- his decisions, in his words;
- the design reference and its icon-free captures;
- the conformance declaration;
- the display rules;
- the differences from the built page that the application should adopt;
- what remains open.

Scope:
- **Route:** the existing route `/estimating/discovery/[id]`, register entry `route:/estimating/discovery/[id]` ("Discovery workspace"), scope `scope:ES-02`.
- **Parent requirements:** PPO-010 and EST-01–EST-09 under [ADR-0035](ADR-0035-es02-structured-discovery.md). No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises none of the following:
- application code, including aligning the built page;
- a change to the configuration definition `PPO-ES02-CONFIG-r01`, a successor definition, a migration or an ADR-0035 amendment;
- a change to [build plan r04](../reference/ui/estimating/PPO-ES-02-Estimation-Wizard-Discovery-Alternatives-and-Revisions-Refinement-Build-Plan-r04.md), the retained board captures or the build record;
- a route, permission or capability;
- deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page in Figma on the accepted conventions | User decision, 12 October 2026 | The request quoted above, with the board, the build record, r04 §4–§6 and §9 and the accepted Figma pages as sources |
| Align the theme, layout, style and rail with the accepted pages | User decision, 12 October 2026 | "Ensure the left navigation rail aligns with the design that has been used in the other Figma UI pages." The desktop frames therefore use the labelled 240 px rail, which gives an 820 px main column at 1440 px (D1, D2) |
| Audit and polish | User request, 12 October 2026 | "Give it an audit and polish": gaps G1–G8, refinements R1–R3 and features F1–F3 were added |
| Pastel green for families with systems | User suggestion, 12 October 2026, resolved as Q9 | Claude advised against green for membership, because green means confirmed in PPO and r04 §4.7 says the same. Both options are drawn (image 22); option B is applied |
| Accept the design and its recommendations | User decision, 12 October 2026 | "Proceed with your recommendations." Q1–Q10 take the recommended answers |
| Q1 Summary side | Resolved by the reply | The live summary stays on the right (r04 §4.4, like the Pipedrive snapshot panel), not on the left like the record pages' details column |
| Q2 Title size | Resolved by the reply | 20 px, as r04 §4.6 sets for record identity; the accepted record pages use 24 px |
| Q3 Record position | Resolved by the reply | No record position or previous/next in the header. Moving to another workspace would need the unsaved-work guard, and the register is one click away in the rail |
| Q4 Family tiles | Resolved by the reply | Filters only on Configuration. Adding by family moves into Add system (family, then category) and the empty-family state; Requirements keeps the fuller cards with Add |
| Q5 Save dialog title | Resolved by the reply | "Save discovery revision", the board's title. The build's "Review discovery revision", which `tests/browser/estimating-wizard.spec.ts` pins, changes when the page is aligned |
| Q6 Timing fields | Resolved by the reply | Requested completion, estimated duration and agreed commitment stay visible, tagged "Proposed fields", until a data model exists. Their build waits for that data change |
| Q7 Technical details | Resolved by the reply | Only the two field identities r04 names are drawn: customer-required zones and verified controller capacity. The W01 field catalogue is confirmed before build |
| Q8 Six families | Resolved by the reply | The successor configuration definition, its migration and the ADR-0035 amendment are the next ES-02 increment, before any build of D5–D7. This record does not itself authorise them |
| Q9 Family colour | Resolved by the reply | Option B: grey when a family has no systems; white with an amber dot and "n to confirm" while systems need confirming; pastel green with a check only when every system in the family is confirmed. Counts are neutral badges |
| Q10 Discard from the unsaved-changes popover | Resolved by the reply | Allowed, with a confirmation. This departs from r04 §3.4, which offers discard only when the editing context changes |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design" in Dean's Figma team, at the named version "Estimation Wizard — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Estimation Wizard (accepted)" `383:2`, the synthetic Northbank workspace (r04 §4.9), Alternative A, working copy of discovery r03: <ul><li>desktop at 1440 × 1000: Configuration `386:68` (flow start), Requirements `388:935`, Scope & delivery `389:1359`, Pricing `390:1759` and Review `391:2226`, with Configuration at full length `387:1164`;</li><li>desktop at 1920 × 1200 `392:2518`, and 1440 with the rail collapsed by the user `395:3638`;</li><li>Alternatives `392:3232`, Revisions `393:3203`, saved revision comparison `393:4023` and compare alternatives `413:87581`;</li><li>overlays and outcomes: evidence panel `396:78976`, Save discovery revision dialog `396:79452`, unsaved discovery dialog `396:79723`, Discovery r04 saved `411:85575`, unsaved-changes popover `411:86233` and Add system menu `411:86591`;</li><li>tablet at 1024 × 768 `397:80747`; phone at 390 × 844: Configuration `397:5424` (flow start), system editor `413:88076`, summary sheet `397:5929` and Review `397:5615`; phone at 320 × 700: Review `397:5774`;</li><li>states section `400:5885`: seven full-size states and the catalogue of the other fourteen;</li><li>the family-colour options `413:88194`.</li></ul>Its notes card `401:8286` lists D1–D17, G1–G8, R1–R3, F1–F3, Q1–Q10 and the geometry |
| Components | Page components, all named "Wizard / …": Step `383:33`, Family tile `383:53` (Empty, Populated, Confirmed, Selected, Shared), Family card `410:84472` (Empty, Populated, Confirmed), Finding link `383:77`, Summary panel `385:13`, Working-copy bar `385:165`, Context header `385:168` and View tabs `395:3916`. Nineteen icons were added to the Components page: eighteen Font Awesome Light glyphs and solid wand-magic-sparkles from Dean's Kit, and a chevron-up. One colour was added, `proposal/attention-dot` `#c47f17`, for graphics only |
| Prototype | Flows "Estimation wizard — desktop" and "Estimation wizard — phone", with 156 click links, all on the page. The rail's More panel uses the shared `more/open` and `more/open-narrow` booleans |
| Retained captures | [ES-02 Estimation Wizard Figma design r01](../reference/ui/estimating/es02-wizard-figma-design-r01/README.md): twenty-two icon-free PNGs with hashes. The five steps are retained at full length. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-02` Estimation Wizard · discovery, alternatives & revisions; route `/estimating/discovery/[id]` (`src/app/(business)/estimating/discovery/[id]/page.tsx`, rendering `src/components/estimation-wizard.tsx`); parents PPO-010 and EST-01–EST-09 (ADR-0035). Capabilities are unchanged |
| Page type (r20) | Form / guided workflow, with Review / comparison for Alternatives, Revisions and the two comparisons. One scroll owner per view; the summary scrolls on its own |
| Reused components | <ul><li>Shell v2: the labelled v2 Rail with Estimation wizard current (collapsing to 76 px), the Shell top bar and the More panel.</li><li>Shared record layout ([lead record page decision](lead-record-page-design.md)): the record header structure, Record / View tab and Record / Banner.</li><li>The shared register grid: header cells, cells and the row-actions cell.</li><li>Tag, Button and Font Awesome Light icons, named as in `src/components/font-awesome-icons.ts`.</li><li>New: the page components in section 2.</li></ul> |
| Incoming handovers | The CR-02 accepted Sales handover (opportunity, customer, one site) and permitted Facility and equipment references. The CS-08 survey is declared but not integrated. Unchanged |
| Outgoing handovers | The immutable discovery revision and the Draft quotation render. The manual estimate receives a saved, Complete basis only by explicit adoption. Sent, accepted and converted belong to ES-05, ES-06 and ES-07. Unchanged |
| Source authority | Build plan r04 §4–§6 and §9 for behaviour and states; the [design board record](es02-design-board.md) for the six-family decision and proposals P1–P9; the [build record](es02-wizard-ui-build.md) for what the running page holds; the accepted Figma pages for appearance |
| Proposed departures | Section 5, to be adopted when the application page is aligned |

## 4. Display rules

- Status always carries words. Colour, dots, checks and change glyphs supplement the words and never replace them. Change markers are a glyph and a word: Added, Changed, Removed, Unchanged, Not comparable (P6).
- Green means confirmed. A family turns pastel green only when every system in it is confirmed. A family with systems still to confirm is white with an amber dot and "n to confirm". A family with no systems is grey. Counts are neutral badges.
- The amber attention dot (`proposal/attention-dot`, 3.3 : 1 on white and 4.4 : 1 on navy) is a graphic beside words, never text.
- Primary actions are navy, one per view. Save discovery revision lives in the working-copy bar; the Review actions card holds no second Save.
- Every amount comes from the exact saved estimate version. An uncosted alternative reads "Not yet costed" or "Not comparable", never zero, and alternatives are never summed.
- Summary counts use the whole viewed working scope, not the current table filter.
- Grids use the shared cells with 48 px rows and 40 px header and footer rows. Cells are single-line and sized to their content. A grid that cannot fit the column scrolls sideways inside a labelled, focusable region (r04 §4.3, B6).
- Controls follow O1: 44 px fields and working-copy actions, 40 px toolbar and in-table controls, 44 px on phones with 16 px field text.
- The record identity is 20 px bold (r04 §4.6).

## 5. Differences from the built page

The application should adopt these when the page is aligned to this design.

1. **Shell:** the labelled Shell v2 rail, 240 px, with Estimation wizard current, replaces the Estimating secondary menu on this record page. The user may collapse the rail to 76 px, and the choice is remembered; this replaces the build's P3 menu collapse. Breadcrumb "Estimating & quotation / Estimation wizard".
2. **Geometry:** rail 240, main 820 and summary 380 at 1440 px; 240, 1300 and 380 at 1920 px; a 1200 px main column in views without the summary.
3. **Context header:** the record-header structure with a 20 px title and the Synthetic preview tag; a meta line with customer, site, owner avatar and the save state, which counts the changes ("3 unsaved changes"); then Summary and "…".
4. **View tabs:** Record / View tabs, left-aligned with count badges. The viewed-alternative select moves to the right of the tab row.
5. **Steps:** five equal 48 px steps with a status line derived from findings, the current step in navy.
6. **Family overview (needs Q8 first):** six tiles as filters in the Empty, Populated and Confirmed states, with neutral badges and a separate Shared infrastructure strip. Add moves into the Add system menu (family, then category: P2) and the empty-family state. The Requirements cards keep Add, in the same states.
7. **System editor:** a Category field (P2, needs Q8); a System actions "…" menu that removes the system from the working copy; Technical details as a labelled section of typed facts.
8. **Grids:** content-fitted columns; the Facility reference (FAC-0031) in Areas; "Requested date" in Scope, the only per-item timing field that exists; "Based on" in Revisions; sideways regions for the Scope grid and the saved estimate lines.
9. **Scope editor:** Source and Confirmation fields; the Timing section tagged "Proposed fields" (Q6).
10. **Review:** tiles two by two; no Save in the Actions card; Continue hidden on the last step.
11. **Alternatives and Revisions:** a row click views and the row "…" holds Select, Archive, Reopen, Copy, Compare and Use as starting point. A 3 px navy bar marks the viewed row. A Compare alternatives view compares A with B, shows an uncosted alternative as Not comparable and keeps Select as a separate, reasoned action.
12. **Saving:** the dialog is titled "Save discovery revision" (Q5). After an accepted save, a banner names the revision, actor, time, readiness and reason, Revisions counts the new revision and Save goes quiet.
13. **Unsaved-changes popover (F1):** opened from the header save state. It lists each change with its step and opens it, and offers Save and Discard with a confirmation (Q10).
14. **Summary:** names the viewed alternative and says it is the selected one (r04 §3.3).
15. **State messages:** the shared Record / Banner (Info, Warning, Neutral). The configuration attention strip stays neutral with an amber dot (B1).
16. **Read-only and loading:** a read-only viewer sees no Add controls, label-and-value pairs and no Save. While loading, step status, tab counts and amounts are not shown.
17. **Phone:** the accepted phone record pattern: back arrow, status row, equal tabs, a Summary and Save footer, and no bottom tab bar. Systems become list rows that open a system editor page. The viewed alternative has its label above the select. The step select keeps previous and next. P8 is resolved by the record header.
18. **Tablet:** the rail collapses to 76 px and the summary becomes a labelled bar that opens the sheet (P4).

## 6. Not drawn

- The phone Alternatives and Revisions views.
- The Pricing Cost types view.
- Focus-visible states.
- The Technical details catalogue beyond the two identities r04 names (Q7).

## 7. What remains open

- **Q8:** the successor configuration definition, its migration and the ADR-0035 amendment come first. Items 6 and 7 of section 5 depend on them.
- **Q6:** a data model for the timing fields.
- **Q7:** the W01 Technical details catalogue.
- **Aligning the application page:** to this design, in a follow-up after pull request 439, including the pinned dialog title and summary copy in the browser tests.
- **Shell rollout:** the Shell v2 rollout to this route follows the shell decision for the other pages.
- **Named version:** Dean saves the named version. The pull request that adds this record stays a draft until he confirms it.
- **Not yet done:** a Present-mode click-through in Figma desktop, keyboard, screen-reader and 200 % zoom passes, and real devices.
- **No baseline:** no UI baseline is registered, and no owner visual review of the running page is implied.

## 8. Verification

- Every frame, overlay and state was checked with screenshots taken inside Figma during drawing. Grid columns were sized from measured text widths. A structural audit found no overlapping top-level frames on the page. All 156 prototype links point to frames on the same page.
- The captures were made from copies on the "Captures (icon-free)" page. 1,463 icon instances were swapped for `Icon/placeholder`, and none was left. Hashes are in the captures README.
- Build plan r04, the retained board captures, the build record and the application code are unchanged.
