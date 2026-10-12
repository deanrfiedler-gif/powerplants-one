---
document_id: PPO-CPQ-FIGMA-DESIGN-DEC
date: 2026-10-12
owner: Dean Fiedler
status: Owner-accepted design; named version saved; owner decisions DEC-CCE-01, -04, -05, -06 and GAP-11 open; reconciliation with the native CPQ backend, page routes, build and UI baseline acceptance separate
source_commit: 7e4ef3b8ce28e1976fea621f9de33999c26fbe21
versioning: git
---

# CPQ Configure & price and Rules studio Figma design — owner decision

On 12 October 2026 Dean asked for the user interface of a CPQ module to be designed in Figma: "We are building a CPQ module for the Powerplants One app, similar to the likes of https://www.tacton.com/. You task is to build the UI for this module in Figma. Below is what it would include." The text he pasted below it had two parts:
- a delivery plan in packages CPQ-00 to CPQ-11, with stages and mandatory journeys;
- a feature list for two workspaces: a rules and configuration studio for authoring, and a CPQ workbench for configuring and pricing.

The paste itself said its package identifiers are "proposed planning labels, not new official requirements or page-scope IDs". It kept quotation approval, issue, customer response and conversion in their existing destinations.

The design followed the [CCE Figma brief](../delivery/cce-figma-design-prompt.md) and the [CCE technical specification](../architecture/cce-technical-specification.md), inside the UI scope Dean had already confirmed in the [CCE publication record](cce-architecture-proposal.md). That scope is rule, condition and configuration-data authoring, plus CPQ. The existing estimating, quotation and review pages are integration points, not new deliverables.

Claude drew the design in the working file "PPO - Design" and summarised it with ten questions, each with a recommendation. Dean replied: "I accept."

The design reference is the named Figma version "CPQ — Configure & price and Rules studio, accepted". Dean saved it himself and confirmed on 13 October 2026: "I have now saved it as CPQ — Configure & price and Rules studio, accepted".

This record retains:
- his decisions, in his words;
- the design reference and its icon-free captures;
- the conformance declaration;
- the display rules and the design decisions D1–D15;
- what remains open.

Scope:
- **Workspaces:** two new workspaces in Estimating & quotation, drawn as a **proposed extension**. No page route, register entry or page-scope ID exists for them, and this record creates none. The native CPQ backend, merged after the acceptance, adds API routes and duties but no pages (section 7). Package labels CPQ-00 to CPQ-11 stay planning labels.
- **Parent requirements:** EST-02 to EST-07 of [BP-01](../blueprints/BP-01-master-blueprint.md). No parent requirement ID is added or renamed; all 78 remain.
- **Existing destinations, linked and not redrawn:** the Estimation wizard (ES-02), Cost sources (ES-03), estimate review (ES-04), quotation approval and issue (ES-05), customer response (ES-06), conversion (ES-07), Screen Systems (ES-08, not renamed) and Products.
- **Authorities:** MYOB remains the intended ERP authority, SharePoint the document authority, and the native CAD tools keep drawing authoring.

This is a design decision. It authorises none of the following:
- application code, a route, a permission or a capability;
- a migration, a seed or any change to the CCE specification;
- the adoption command;
- any rule, rate, price, margin, limit, FX basis or publication duty;
- deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the CPQ module UI in Figma | User decision, 12 October 2026 | The request quoted above, with the pasted delivery plan and feature list, the CCE brief and specification, and the accepted Figma pages as sources |
| Scope: authoring plus CPQ, with existing pages as destinations | Earlier user decision, recorded in the [CCE publication record](cce-architecture-proposal.md) | The design adds two workspaces and links to the existing destinations (D14) |
| Accept the design | User decision, 12 October 2026 | "I accept." Dean was replying to the summary, which listed D1–D15 and Q1–Q10 with a recommendation each |
| Q1 Rail labels and placement | Adopted as drawn | "Configure & price" after Estimation wizard, and "Rules studio" after Cost sources. Revisit if rule authors turn out to be mainly product-data staff; Rules studio would then sit under Products |
| Q2 Use in estimate with unsaved changes | Adopted as drawn | No automatic save. The explicit Save keeps the exact evaluation named (D3) |
| Q3 Summary on Configure | Adopted as drawn | The summary panel is open on Configure only, leaving a 580 px main column; other views hide it (D4) |
| Q9 Pilot scope | Adopted as drawn | Screen systems only for the first pilot (D15) |
| Q10 Tablet behaviour | Adopted as drawn | Below 1280 px the rail and the solution outline collapse automatically, and the summary opens on demand |
| Q4–Q8 | Still open | They are owner decisions in the CCE register. Accepting the screens does not settle them, and the screens show them as open (section 8) |

The design's Read me page records the acceptance (card `520:3`). The card says what the acceptance covers and what it does not, as listed under Scope above.

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design" in Dean's Figma team, at the named version "CPQ — Configure & price and Rules studio, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted pages | Six pages, each named "CPQ · n … (accepted)": Read me, sources & decisions `464:2`; Foundations & components `464:3`; Rules studio `464:4`; Configure & price `464:5`; Compare, history & overrides `464:6`; Responsive & states `464:7` |
| Accepted frames | All 1440 × 960 unless noted. The synthetic fixture is Northbank Nursery, estimate "Northbank climate & irrigation upgrade" v04, Alternative A, configuration SYN-CPQ-000014: <ul><li>Rules studio: registry `485:301` (flow start), rule editor `486:641` and `488:1029`, test bench `489:1398` and `491:2121`, formula editor `490:1678`, changes vs v7 `491:2594`, create version 8 `492:2572`, release R6 `492:2722`, decision table `493:3027`, fact dictionary `493:3444`, product structure `496:3355`, rule history `496:3786` and the action forms board `497:3789`;</li><li>Configure & price: register `483:3760` (flow start), Configure `476:338`, shared capacity conflict `478:666`, solution overview `478:1174`, Materials & labour `480:1244`, Why this line? `480:1903`, Pricing `481:2485`, compare `481:2966`, Use in estimate `482:3079`, used in estimate v05 `482:3549`, and the annotations `482:4012` (receiving state on the existing estimate page) and `517:17102` (entry points);</li><li>Compare, history & overrides: line actions `499:2` (flow start of J3), adjust quantity `499:724`, reopened `499:1438`, input changed `500:1801`, needs review `500:2288`, review adjustment `501:2917`, restored `501:3053`, history `502:4198` (flow start of J4), saved evaluation 3 `502:4663`, compare with release R5 `503:5004`, equal-priority conflict `503:5532`, blockers resolved `504:5781`, propose successor `504:6182`;</li><li>Responsive & states: tablet at 1024 × 768 `505:2` and `505:627`; phones at 390 × 844 `506:678` and `508:1123` (the two phone flow starts), `506:784`, `507:753`, `507:1041` and `508:1281`, and at 320 × 844 `507:1200`; the fifteen-state board `509:1235`.</li></ul>The Read me page holds the overview, journeys, fixture, sources, D1–D15, Q1–Q10, limitations, accessibility intent, the screen inventory and handover table `514:2` and the acceptance card `520:3` |
| Components | 23 page-local components named "CPQ / …" on page `464:3`: State `466:56`, Fact token `466:88`, Control `466:230`, KV row `466:240`, Condition row `467:207`, Group header `467:272`, Option tile `467:314`, Outline item `467:351`, BOM header `468:97`, BOM row `468:293`, BOM group row `468:301`, Compare header `468:316`, Compare row `468:437`, Waterfall row `469:156`, Test result row `469:234`, Change row `469:334`, Quantity basis `469:414`, Action card header `469:471`, Button (unavailable) `471:133`, Action bar `471:224`, Configuration summary `471:420`, Why this line panel `473:1055` (five views) and Context header `475:120225`. They stay page-local until implemented, then join the shared library and the design register |
| Shared additions | <ul><li>The shared v2 / Rail `84:197` gained two boolean properties, "Configure & price (proposed)" and "Rules studio (proposed)", both off by default. No accepted page changes; the accepted Quotations rail was checked after the change.</li><li>Thirty-two Font Awesome icons from Dean's Kit were added to the Components page, among them Solid cubes and Solid book-section for the selected rail items.</li><li>Two colours were added: `proposal/cpq-info-surface` `#e9f1fa` and `proposal/cpq-info-border` `#c7d8ea`.</li></ul> |
| Prototype | Six flows, with the links on their own pages: "J1 · Author, test and publish a rule", "J2 · Configure and hand back to the estimate", "J3 · Adjust, reload, changed basis, restore", "J4 · History, newer release, blockers, successor", "Phone · Configure and explain" and "Phone · Rule conditions and test". Validation and recalculation are simulated by linked state frames; Figma computes nothing |
| Retained captures | [CPQ Figma design r01](../reference/ui/estimating/cpq-figma-design-r01/README.md): forty-four icon-free PNGs with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | A proposed extension of Estimating & quotation. No existing page-scope ID covers the two workspaces, and none is created. Parents: EST-02 (discovery facts read), EST-03 (options, evaluations and estimate versions), EST-04 (quantities, labour and cost), EST-05 (pricing, margin and markup), EST-06 (Screen Systems configuration) and EST-07 (renewed review on a successor). Planning labels CPQ-02 to CPQ-08 are cited per frame in the handover table `514:2` |
| Page types (r20) | <ul><li>Register / worklist: Configure & price register, Rules registry.</li><li>Form / guided workflow: Configure, conflict, rule editor.</li><li>Overview: solution overview.</li><li>Work queue + persistent detail: Materials & labour with "Why this line?", and the adjustment frames.</li><li>Review / comparison: Pricing, compare, test bench, changes, release, compare with R5.</li><li>Planning workspace and record detail: decision table, fact dictionary, product structure, rule history.</li><li>Document & evidence workspace: History and saved evaluations.</li></ul>One scroll owner per view; the right panel scrolls on its own |
| Reused components | <ul><li>Shell v2: the labelled v2 Rail, the Shell top bar and the flush side menu, which collapses to its strip in the editors.</li><li>The shared register grid: header cells, cells and row actions.</li><li>The shared record layout ([lead record page decision](lead-record-page-design.md)): Record / View tab, Record / Banner and Record / History item. The CPQ Context header is a copy of the accepted Estimation Wizard header with a flexible title.</li><li>The dialog pattern of the accepted ES-02 save dialog, Filter chip, Menu item and heading, Tag, Button and Font Awesome Light icons.</li><li>New: the 23 CPQ components in section 2.</li></ul> |
| Incoming handovers | <ul><li>The estimate's context, and the discovery facts of ES-02 discovery r03, read only.</li><li>Span and area facts from ES-08 Screen Configurator run R01.</li><li>Cost sources (ES-03) and Products, read and linked.</li></ul>No source is edited from CPQ |
| Outgoing handovers | <ul><li>The exact saved evaluation is handed to the existing estimate page, where it creates a new estimate version (v05, or v06 as a successor) and requires ES-04 review. When the design was accepted, no adoption command existed (GAP-01). The native CPQ backend now provides one (section 7), and no page calls it yet.</li><li>Quotation approval and issue (ES-05), customer response (ES-06) and conversion (ES-07) are unchanged.</li><li>Rules studio hands sealed releases to activation, a separate duty for each scope.</li></ul> |
| Source authority | The CCE specification §3–4, §6 and §10.2–10.3 for the rule language, evaluation, overrides and pricing; the CCE brief for screens and journeys; Dean's pasted plan and feature list for the package order and features; `src/shell/navigation.ts` for the Estimating rail order and labels; the accepted Figma pages for appearance |
| Proposed departures | <ul><li>Desktop frames are 1440 × 960, as the brief asks, rather than the accepted pages' 900.</li><li>The two rail entries are hidden by default until routes exist.</li><li>The formula functions ceil, floor, round, min and max go beyond the reference evaluator's four operators, and are drawn as a proposed language profile (Q4, DEC-CCE-01).</li><li>The brief's "Distance greater than 100 m" example is shown on the Support spacing rule's real condition, "greater than 0 m"; the interaction is the same.</li></ul> |

## 4. Display rules

- **Status words:** status always carries words. Every state chip, row and banner pairs an icon with text, and colour never carries meaning alone.
- **Unknown:** Unknown is a value and is never shown as zero. It reads "Unknown" with a cause and a route to fix it. A total shows the known subtotal and the count of unknown items.
- **Price state:** written out as Indicative, Complete, Requires approval or Approved.
- **Three quantities:** every generated line keeps three values. Calculated is the generated base, Yours is the person's intent, and Effective is the result.
- **Adjustments:** an adjustment sets a quantity; it never adds a delta. An exclusion persists while the line's meaning is unchanged. When the calculated basis changes, the person's value is kept and marked for review, never silently re-applied or discarded. Restoring the calculated value keeps the earlier intent in history.
- **Margin and markup:** shown side by side, each with its formula. A change of basis shows its concrete effect before it applies.
- **Illustrative values:** every rate, price, margin, limit and FX value is labelled illustrative. Unassigned duties read "not yet assigned (DEC-CCE-06)" rather than naming an invented policy.
- **Save and Use:** Save configuration records an immutable evaluation. Use in estimate is available only for a saved, current and unblocked evaluation, and names the exact evaluation, release and resulting estimate version before it commits.
- **Rule states:** Draft (saving), Validation, Tests and Published are separate. Editing after a passing run marks the tests stale for that revision.
- **Version, release and activation:** creating a version, composing a release, sealing it and activating it for a scope are separate steps.
- **Primary actions:** one navy primary per view. An action that is not available stays visible as "Button (unavailable)" with its reason.
- **Sizes:** touch targets are 44 px on phones. Desktop icon buttons are 32–40 px with 8 px spacing.
- **Contrast, as measured:** text pairs 4.62–6.39 : 1, control borders 3.32 : 1, white on navy 14.37 : 1.

## 5. Design decisions D1–D15

Recorded on the Read me page (`512:2`) and accepted with the design.

| ID | Decision |
|---|---|
| D1 | Two rail entries, hidden elsewhere: "Configure & price" and "Rules studio" are hidden-by-default properties of the shared rail, as the Reviews & approvals precedent was, so no accepted page changes. The selected icons are Font Awesome Solid cubes and book-section |
| D2 | The workbench uses the accepted record pattern: context header, readiness strip, view tabs, a 380 px right panel and a sticky action bar. The solution outline lives in the flush side menu |
| D3 | Save and Use in estimate are different actions (section 4) |
| D4 | One right panel at a time. The summary is the default on Configure, and "Why this line?" replaces it when opened from a line. Materials, Pricing, Compare and History hide the summary to give tables the width |
| D5 | Calculated, Yours and Effective quantities (section 4) |
| D6 | Unknown is a value, and price state is written out (section 4) |
| D7 | Editors get the width. Rules studio lists use the register grid with the side menu docked. Editors collapse the side menu, so the condition builder has about 800 px beside a 380 px test panel |
| D8 | Four independent rule states (section 4) |
| D9 | A version is not a release, and a release is not an activation (section 4). Duties show as not yet assigned |
| D10 | Decision tables compile to the same rule language. UNIQUE tables report overlaps and gaps, and a gap leaves configurations incomplete rather than defaulting |
| D11 | Restricted formulas: tokens for facts, parameters, functions and operators; units checked while typing; a scenario substitution preview; no conditions, loops or code inside formulas |
| D12 | Phones follow the accepted record-page phone pattern: back and title header, status line, tabs and sticky footer. The outline becomes a picker, "Why this line?" is full screen, adjustments are a bottom sheet, and condition rows stack with 44 px Move up and Move down buttons |
| D13 | Margin and markup side by side (section 4) |
| D14 | Destinations are links, not screens: the estimate page, ES-04 review, ES-05 quotation, Cost sources, Products and the wizard appear as links, plus one handover annotation |
| D15 | The pilot family is Screen systems, as the plan's CPQ-00 suggests. The ES-08 Screen Configurator run supplies span and area facts. ES-08 is not renamed, and Fertigation is outside the pilot |

## 6. Not drawn

- Phone views other than the seven drawn: Configure, Materials & labour at 390 and 320 px, "Why this line?", Adjust quantity, and the rule Conditions and Test tabs. Phone Pricing, Compare, History and the Rules studio registry and release views are not drawn.
- Tablet views other than Configure and the rule editor.
- Equipment families other than Screen systems.
- The existing destinations, which are linked rather than redrawn (D14).
- The shell top bar at 1024 px: the search narrowing it would need is a proposal only.

## 7. Native CPQ backend

Draft pull request #453 was open when Dean accepted the design. It merged on 13 October 2026 (Brisbane time) as the [native CPQ runtime](cpq-native-runtime.md), with an [API and UI handover](../interfaces/cpq-api.md). It is backend only, and its record leaves the UI to this separate workstream. It adds:
- migration 0086 and the CPQ API routes;
- five duties, `cpq.read`, `cpq.author`, `cpq.review`, `cpq.publish` and `cpq.calculate`, which no seed grants;
- an adoption command that, according to its record, writes the native estimate version, the CPQ evidence and the operation receipt in one transaction.

This design was not drawn against that API and has not yet been reconciled with it. The known differences to settle before a page is built are:
- **Release states:** the backend's release moves from Draft to Reviewed or Rejected, then to Published. An independent reviewer approves, and a third person publishes and activates the release for a company. The design shows create version, compose release, seal and activate (D9).
- **Fact types:** the backend has Decimal, Boolean and Choice facts. The design's rule editor changes a field to a text fact (image 03).
- **Formulas:** backend expressions allow `+ - * /` only. The design's formula editor inserts `ceil()`, which remains a proposed language profile (Q4, DEC-CCE-01).
- **Adjustments:** the backend's overrides are Quantity, SellPrice and Suppress. Each is bound to the exact generated basis, and a changed basis blocks adoption. The design's set, exclude and review-on-changed-basis behaviour corresponds to these, but the labels need aligning.
- **Results:** a backend run is permanently Ready or Blocked, and a later edit creates a new run with a parent pointer. The design calls these saved evaluations.
- **Duties:** the backend names the duties, but no one holds them until access management grants them. The design's "not yet assigned (DEC-CCE-06)" display therefore still applies.
- **Receiving limit:** the backend blocks adoption above the native receiving limits rather than truncating, which matches the Q8 recommendation.

## 8. What remains open

- **Q4 Formula functions (DEC-CCE-01):** which functions join the first language profile. Recommendation: ceil, floor and round only, with min and max later.
- **Q5 Who may adjust what (DEC-CCE-05):** quantities, exclusions, manual lines and prices. Recommendation: estimators adjust generated material quantities above engineering minimums, and price changes need the commercial role.
- **Q6 Publication duties (DEC-CCE-06):** author, reviewer, publisher and activator. Recommendation: authors create versions; an independent publisher seals and activates; engineering review evidence is required for engineering scopes.
- **Q7 Pricing basis (DEC-CCE-04):** target margin or markup as the default policy basis. Recommendation: target gross margin, with markup always shown beside it.
- **Q8 Receiving limit (GAP-11):** the native estimate accepts at most 100 manual lines (`src/estimating/validation.ts`), and fitting CPQ output to every native receiving profile is unproven. Recommendation: show the count in the Use in estimate dialog, and block above the limit until the compatibility decision is made.
- **Backend reconciliation:** align this design with the native CPQ API before a page is built, settling the differences in section 7.
- **Page routes:** the two workspaces have no page route or design-register entry. The rail entries stay hidden until pages exist.
- **Build:** no application page exists. Building one needs separate authority, and its page entries in the design register follow then.
- **Named version:** Dean confirmed on 13 October 2026 that the named version is saved, which resolves the draft checkpoint for this record. This records his confirmation, not an independent inspection of Figma version history.
- **Not yet done:** a Present-mode click-through in Figma desktop; keyboard, screen-reader and browser checks; real data volumes; names longer than the samples.
- **No baseline:** no UI baseline is registered, and no visual review fingerprint is implied.

## 9. Verification

- Every frame was rendered and inspected in Figma during drawing for clipping and overflow. Colour pairs were measured as given in section 4.
- The accepted Quotations rail was rechecked after the two hidden rail properties were added.
- The captures were made from copies on the "Captures (icon-free)" page. Every `Icon/*` instance was swapped for `Icon/placeholder`, a second pass was run, and no icon instance was left in any copy. No copy is larger than Figma's 4,096 px export limit. Sizes and SHA-256 hashes are in the captures README.
- The CCE specification, the CCE brief, the CCE publication record, the application code and the parent requirement IDs are unchanged.
