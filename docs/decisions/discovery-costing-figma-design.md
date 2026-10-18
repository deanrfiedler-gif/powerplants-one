---
document_id: PPO-ES02-DISCOVERY-COSTING-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 4296429bb96b70c982d5e87201e83ed8f9e5fb22
versioning: git
---

# Discovery costing design — owner decision

On 18 October 2026 Dean accepted the Discovery register design (`discovery-register-figma-design.md`, PR #590) with its recommendations, including Q4: draw Create discovery workspace next, then Discovery costing (`/estimating/discovery/[id]/costing`). After Create discovery workspace was accepted, Claude recommended Discovery costing as the next page, and Dean agreed: "Yes, draw the Discovery costing ES-02 page in Figma next, following the Discovery register and Create discovery workspace pattern."

The built page (`DiscoveryCosting` in `src/components/discovery-costing.tsx`) is a plain page titled "Cost a saved discovery option". It works in four steps:
- it reviews the selected option's saved revision;
- it shows the full scope and the source hashes;
- it opens one fieldset per manual cost line with the proposal totals beside them;
- it saves with a reason and a checkbox.

The commands are `previewDiscoveryCosting` and `adoptDiscoveryCosting` in `src/estimating/cost-basis-service.ts`, with line rules in `src/estimating/validation.ts` and the synthetic arithmetic policy SYN-EST-ARITHMETIC-01.

Claude drew the page from these sources:
- the [ES-02 Estimation Wizard design](es02-wizard-figma-design.md), accepted 12 October 2026, whose Pricing step offers "Review scope for manual costing" and supplies the lines grid, totals tiles and cost-basis callout;
- the accepted Discovery register, whose Shade screen and Northbank rows the story follows;
- the accepted Create discovery workspace design (`create-discovery-workspace-figma-design.md`, PR #591), whose wizard shell, summary panel, bottom bar, review dialog, tablet, phone and state frames it reuses;
- [ADR-0035](ADR-0035-es02-structured-discovery.md) structured discovery, and the built costing commands and line validation named above.

No accepted frame or main component was edited, except the layout change to the wizard's Pricing totals that Dean asked for (section 6).

Before deciding, Dean asked: "Give the Discovery costing ES-02 page an audit and polish before I decide, and make the totals cards on the accepted wizard Pricing step the same height too." He then accepted the design: "I accept the Discovery costing ES-02 design with your recommendations, including D1–D7 and Q1–Q4." That adopts D1–D7 as drawn and the recommended answers to Q1–Q4.

Scope:
- `route:/estimating/discovery/[id]/costing` "Discovery costing", under `scope:ES-02` "Estimation Wizard · discovery, alternatives & revisions".
- Parent requirements PPO-010 and EST-01–EST-09 under ADR-0035. No parent requirement ID is added or renamed; all 78 remain.
- Capabilities are unchanged: adopting a cost basis needs `estimating.edit`.

This is a design decision. It authorises none of the following:
- application code, including restyling the built costing page;
- a change to the costing commands, the line validation, the arithmetic policy, a migration or a data model change;
- a route, permission or capability;
- an amendment to ADR-0035, the ES-02 wizard decision, the Discovery register or Create discovery workspace decisions;
- pricing approval, which stays with Estimate review (ES-04);
- deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Draw Discovery costing next | User decision, 18 October 2026 | Dean's request quoted above, following Q4 of the Discovery register |
| Equal-height totals cards | User decision, 18 October 2026 | "Ensure all the cards in the screenshot that is attached are all the same height." The screenshot showed this page's four totals tiles. Then the audit request quoted above, which extended it to the wizard's Pricing step (section 6) |
| Audit and polish before acceptance | User decision, 18 October 2026 | Quoted above. Section 6 |
| Departures D1–D7 | Accepted as drawn, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 First costing | Resolved as recommended | When an option has no estimate yet, the same page shows an empty grid with Add manual line, and the primary action is "Save option estimate", as built |
| Q2 Prefill | Resolved as recommended | The grid is prefilled from the current cost version, and lines that differ from it carry a pen marker. Discovery never changes a line by itself |
| Q3 Sources | Resolved as recommended | Every line keeps its source and source date, as the policy requires. A line links to Cost sources (ES-03) when its source is a reviewed cost source. There is no automatic pricing |
| Q4 Phone | Resolved as recommended | Review and adoption are allowed on phone. Each line is edited in a full-screen line editor, which is not drawn |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Named Figma version | Not yet saved | "Discovery costing — accepted" waits for Dean's explicit yes |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053). The named version is pending (section 1) |
| Page | "Discovery costing · ES-02" `1431:809`, after Estimation Wizard `383:2` and before the Priva Fertigation Workbench. The page header `1431:810` holds the conformance declaration; the notes card `1431:2195` is in Flows and notes. File index row "Row / Discovery costing · ES-02" `1436:185911`, after the Estimation Wizard row |
| Desktop 1440 | Cost lines for estimate v3 from discovery r02, full length (1440 × 2027) `1431:846`; review and adopt dialog `1432:375662`; discovery changed while costing, proposal kept `1432:376321`; not ready to cost, Northbank r03 Incomplete `1432:377502` (each 1440 × 1000) |
| Tablet 1024 | Cost lines with the summary behind its button `1431:1610` (1024 × 768) |
| Phone 390 and 320 | Cost lines at 390 `1433:2403`, at full length `1431:1921` (390 × 1694), and at 320 `1433:2492` |
| States | Dialog states: adopting `1433:376501`; outcome not confirmed `1431:2114`; original estimate kept `1431:2129`; not permitted `1431:2143`. Phone 390: loading the saved scope `1431:2157` |
| Page parts | None. The page reuses existing components only |
| Story | Synthetic, Tue 13 Oct 2026, 09:30, signed in as Dean Fiedler. SYN-PPO-OPP-000334 Shade screen replacement, Block B for SYN Systems, matching the Discovery register. Option B — Motorised screens is selected. Discovery r02 was saved Wed 7 Oct by estimator Alex Nguyen and is Complete; estimate v2 is still on r01. r02 adds Bays 5–6 (six motors, 3,600 m² of cloth) and a rain sensor. The v3 proposal has six lines, four of them different from v2, with cost AUD 34,084.00 and sell AUD 46,210.00; v2's sell is AUD 31,210.00. The not-ready frame uses Northbank (SYN-PPO-OPP-000326): r03 is Incomplete with two systems to confirm, and estimate v04 (AUD 58,400.00) stays on r02, as on the register and the accepted wizard |
| Retained captures | [Discovery costing design r01](../reference/ui/estimating/discovery-costing-figma-design-r01/README.md): ten icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md), as on the page header.

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-02` Estimation Wizard; route `/estimating/discovery/[id]/costing` (register entry `route:/estimating/discovery/[id]/costing` "Discovery costing"); parents PPO-010, EST-01–EST-09 (ADR-0035); capabilities unchanged: `estimating.edit` to adopt |
| Page type (r20) | Form or guided workflow inside the workspace: the wizard's Pricing step for one saved revision, then a review-and-adopt dialog. One scroll owner; the summary scrolls on its own |
| Reused components | Shell v2 rail (Estimation wizard current), the top bar with the Conversations action (proposed amendment), Wizard / Context header, View tabs, Step, Summary panel and Working-copy bar, the Pricing lines grid and totals tiles, Work order record / Blocker row, Record / Banner, Job pack / Disclosure, Planner / Input (proposed), Excel confirmation row, Tag and Button. No new components |
| Incoming handovers | The wizard's Pricing step ("Review scope for manual costing") and the Discovery register snapshot. The page reads the selected option's current saved revision and the current cost version |
| Outgoing handovers | Saves a new cost version on the adopted revision, or the option's first estimate, and opens the estimate. It never edits discovery, approves a price or issues a quotation; Estimate review (ES-04) keeps approval |
| Source authority | ADR-0035; [es02-wizard-figma-design.md](es02-wizard-figma-design.md) (the accepted Pricing step); the accepted Discovery register and Create discovery workspace designs; `src/components/discovery-costing.tsx`, `src/estimating/cost-basis-service.ts` and `src/estimating/validation.ts` |
| Proposed departures | D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | Pending Dean's explicit yes |

## 4. What the design shows

### Cost lines (desktop)

- **Place:** the page is the wizard's Pricing step, with step 4 current ("Costing r02") and steps 1–3 Complete, in the same workspace shell (D1). The shell keeps the header (title, number, customer, estimator and save state), the Discovery tab, the viewed option, the steps, the Costing summary and the bottom bar. The breadcrumb reads "Estimation wizard / Costing".
- **Basis:** a callout names the option and discovery revision being costed (D2). It also names the saved estimate and the revision it stays on until adoption, and says "Discovery does not generate prices." It links to the saved estimate.
- **Scope being costed:** what changed since the revision the current estimate used (r01 → r02), and what is unchanged (D3). The exact saved source (scope and answer snapshots and the content hash) sits in a disclosure.
- **Cost lines:** the accepted Pricing grid, prefilled from the current cost version (D4, Q2). Its columns are description, category, quantity, unit, unit cost, cost total, unit sell, sell total, source and date, and allowance. A pen marker shows each line that differs from v2, and the footer explains the marker. Add manual line sits in the toolbar.
- **Totals:** four equal-height tiles for cost, sell, margin and allowances, each with the saved version's value beside it. A note gives the arithmetic policy and says approval belongs to ES-04.
- **Customer wording:** estimate title, included scope, excluded scope and assumptions, all required, as built.
- **Costing summary:** the panel shows the following (D5):
  - the revision viewed;
  - the saved estimate and its basis, and how the basis changes on adoption;
  - the proposal's change in sell;
  - items to check before adopting: an allowance and a new line.
- **Bottom bar:** "Proposal for estimate v3 · 4 lines changed · not saved", with "Review and adopt r02".

### Review and adopt

The dialog follows the accepted Save discovery revision pattern (D6). It lists:
- what will be saved: the basis r01 → r02, the cost lines, the totals and the customer wording;
- the checks before adopting;
- a required reason;
- a confirmation that the exact basis, scope and costs were reviewed.

The primary action is "Adopt r02 in cost version v3". Version v2 keeps its own lines and basis, and drafts and quotations made from it keep their originals.

### States (D7)

- **Discovery changed while costing:** a warning banner says a newer revision (r03, 09:41) was saved, so r02 can no longer be adopted. The proposal is kept, and the primary action becomes "Review r03 and keep proposal".
- **Not ready to cost:** when the selected revision is Incomplete, the page shows what is not ready, with links, and the unchanged saved estimate (Northbank r03 and estimate v04). Nothing can be costed.
- **Dialog outcomes:**
  - adopting, with the dialog frozen;
  - outcome not confirmed, which keeps the proposal and checks the same request rather than repeating it;
  - original estimate kept, for an option whose estimate predates discovery, with "Branch a discovery option";
  - not permitted.
- **Phone loading:** loading the saved scope and the saved estimate.

### Tablet and phone

- **Tablet:** the same content in one column, with the summary behind its button.
- **Phone 390:** a banner names the basis, then the viewed option, the step navigation, the scope changes, the cost lines as rows with Edit, a totals card and the customer wording. Summary and "Review and adopt" are in the footer.
- **Phone 320:** line details are shortened to quantity and sell. The title and viewed option end in an ellipsis, as on the Discovery register (its Q3).

### Departures, accepted

| ID | Departure | Built page |
|---|---|---|
| D1 | Costing opens as the wizard's Pricing step in the same workspace shell | A separate plain page, "Cost a saved discovery option" |
| D2 | A basis callout names the option and revision being costed, and the saved estimate and the revision it stays on | A line of text with the option, revision and readiness |
| D3 | Scope being costed lists the changes since the estimate's revision, plus what is unchanged, with the exact saved source in a disclosure | The full scope view and the hashes |
| D4 | Cost lines in the accepted Pricing grid, prefilled and marked where they differ from the current version; equal-height totals tiles with saved values; customer wording after the lines | One fieldset per line and a totals aside |
| D5 | A Costing summary panel with the revision, the saved estimate and basis, the proposal's change and items to check | None |
| D6 | Adopt through a review dialog with what will be saved, checks, a required reason and a confirmation | Reason, checkbox and submit inline |
| D7 | States: discovery changed keeps the proposal and blocks adoption; not ready shows what is missing and the unchanged estimate; four dialog outcomes; phone loading. Phone lines as rows with Edit and a sticky Review and adopt | Inline alerts on the same page |

## 5. Not decided and not drawn

- **Building the page.** The built `/estimating/discovery/[id]/costing` keeps the "Cost a saved discovery option" page. The build order is not decided.
- **Build needs.**
  - The summary's change in sell and the per-line pen marker need a comparison of the proposal with the current cost version. Today that comparison happens only in the page.
  - "Scope being costed" needs a list of changes between two saved revisions; the wizard's saved-revision comparison may supply it.
  - The Cost sources link in Q3 needs a source reference on the line.
  - These are proposals for a build, not confirmed reads.
- **The Conversations action** is part of the proposed top-bar shell amendment. As on the accepted wizard phone frames, the phone record header has no Conversations action.
- **Not drawn:**
  - first costing with no saved estimate (Q1);
  - the phone line editor (Q4);
  - the Revisions and Alternatives tabs and the cost-types view;
  - the reviewed source comparison (ES-03);
  - 200% zoom.
- **Data in the frames:** the workspaces, opportunities, customers, estimates, suppliers and people are synthetic. They are not operational records.

## 6. Audit and polish

At Dean's request Claude checked every frame for these:
- measured truncation;
- fonts (Roboto only);
- text left over from the cloned Create frames;
- prototype links;
- one story with the Discovery register and the accepted wizard.

Changed:
- **Totals:** the totals tiles share one height (112 px) on this page.
- **Wizard Pricing step:** at Dean's request the four totals tiles in frame `390:1759` now also share 112 px, with content top-aligned. No text, value or rule changed. This is recorded on the wizard's notes card `401:8286`. The wizard's r01 captures and its named version predate this layout change, and are not refreshed here.
- **Inputs:** the customer wording inputs have 10 px vertical padding.
- **Icons:** scope, line and totals icons are neutral; only the not-ready rows stay amber.
- **Grid:** the footer explains the pen marker. The Source column is 220 px, so no source is cut off, and the allowance cell reads "Yes".
- **Leftovers from Create:** the plus icon was removed from the bottom-bar buttons, and stale links were removed.

Remaining by design: at 320 the title and the viewed option end in an ellipsis, as on the Discovery register.

The audit and the acceptance are recorded on the notes card `1431:2195`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and the audit.
- The ten captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 244,000. Image 09 is a frame holding copies of the four dialog states. Prototype links were removed, and each of the 273 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 1,110 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link or a flow starting point.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/estimating/discovery-costing-figma-design-r01/README.md).
- Before the captures were made, the notes card's Accepted paragraph and the page header's Status field were updated. The frames themselves were not changed.
- The page has no prototype flow. The review dialog's Close and Cancel return to the cost lines frame; Claude did not play them in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
