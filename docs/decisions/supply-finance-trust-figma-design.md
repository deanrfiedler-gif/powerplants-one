---
document_id: PPO-RP05-SUPPLY-FINANCE-TRUST-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; native implementation, measure definitions and UI baseline acceptance separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Supply and Finance trust and exceptions RP-05 design — owner decision

On 24 October 2026 Dean asked for the design of the Supply chain and Finance management report: "Your task is to design and build the "Supply and Finance trust and exceptions (RP-05)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma, audited it and presented it with twelve decisions and eight questions. It covers:
- the report at `/reports/reconciliation`, one page with a section for each of REP-09, REP-10, REP-11 (with KPI-10 and KPI-12), the withheld KPI-13 and KPI-14;
- the report header, a chart and a table in each section, and a drill to source records;
- "About this measure", "Definition pending", "Restricted" and export;
- desktop 1440, tablet 1024, phone 390 and 320, and eight states.

Claude drew the page from these sources:
- [BP-01](../blueprints/BP-01-master-blueprint.md) §22.1 to §22.3 (REP-09 to REP-11, KPI-10, KPI-12 to KPI-14) and FD-05 to FD-09;
- the [supply readiness contract](../contracts/supply-chain-readiness.md) and [supply readiness promise rules](supply-readiness-promise-rules.md) (PPO-SUP-DEC-01);
- [PPO as the daily workspace, MYOB as the book of record](ppo-workspace-myob-book-of-record.md) (EI-5, EI-6) and [Service and Finance download access](report-finance-download-access.md);
- the [conformance standard](../standards/html-module-conformance.md);
- the drawn pages Reports overview RP-01 and Sales performance RP-02, Material demand, Purchasing, Inbound shipments, Receiving, Inventory, Returns & claims, Finance handoffs, Customer accounts, Project financial performance, Cash outlook, Measure definitions, Integrations and Mappings & reconciliation.

On 1 November 2026 Dean answered "Do you accept the RP-05 design, with my recommended answers to Q1–Q8?": "Accept". The button he chose was offered as accepting the design with its recommendations, so this record reads his answer as adopting D1–D12 and the recommended answers to Q1–Q8. The named Figma version is recorded in section 8.

Scope:
- `scope:RP-05` "Supply and Finance trust/exceptions", at `/reports/reconciliation`. No new scope is added.
- No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, export, integration or deployment. It publishes no measure definition, adopts no margin definition (D-017 stays open) and sets no target, baseline or threshold. Every record, figure and date shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page RP-05 | User decision, 24 October 2026 | Dean's request quoted above |
| Decisions D1–D12 | Accepted as drawn, 1 November 2026 | Dean's answer, quoted above. Section 4 |
| Q1 Material readiness cutoff | Resolved as recommended; design direction only | The start of the working day, 3 working days before the planned start, to allow for courier time. The report labels it "proposed" until REP-09 v2 records it in Measure definitions |
| Q2 Who owns RP-05 | Resolved as recommended | The Finance lead (Avery Lin) owns the page and its weekly review. Robin Hale keeps REP-09 and shares REP-10. Each section shows its own owner. These are synthetic-story roles until real people are assigned |
| Q3 Decide D-017 margin | Resolved as recommended | Finance should decide the revenue basis excluding GST, the committed-cost overlap (FD-06), tolerances and the approver. Until D-017 closes KPI-13 stays withheld. This record decides none of it |
| Q4 Supplier performance | Resolved as recommended | A later sixth section once REP-09 has two months of recorded promises (kept, not back-filled): promises kept and broken per supplier, with no ranking or target. Not drawn |
| Q5 August comparison | Resolved as recommended | No back-fill. A measure with no August history says "not recorded" |
| Q6 KPI-14 definition | Resolved as recommended | Add KPI-14 to Measure definitions (FN-06), owned by Systems (Taylor Quinn), before a build. Until then it shows Definition pending |
| Q7 Claim and credit amounts | Resolved as recommended | Expected and differing credit amounts appear, labelled "not cash" and apart from every count |
| Q8 Sent with no reply | Resolved as recommended | A document sent with no reply counts in the backlog from the first minute, with its age shown |
| Accept the design | User decision, 1 November 2026 | Quoted above |
| Named Figma version | Saved by Dean, 1 November 2026 | "Supply & Finance trust · RP-05 — accepted". Section 8 |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Supply & Finance trust · RP-05" `2410:885569`, under "— Reporting —", after Sales performance · RP-02. The page header `2410:885570` holds the conformance declaration; the notes card in "Flows and notes" holds D1–D12, Q1–Q8, the numbers that reconcile, the differences from the drawn pages and the audit. File index: the row "Row / Supply & Finance trust · RP-05" in the Reporting group |
| Desktop 1440 | Full report `2412:86`, with sections REP-09 `2412:890159`, REP-10 `2415:655`, REP-11 `2420:640`, KPI-13 `2420:962` and KPI-14 `2420:1111`; REP-09 drilled to the blocked cable kit `2434:4666`; REP-10 three-way ageing `2434:12619`; REP-11 trust panel with exceptions `2434:6707`; KPI-13 withheld with About this measure `2434:8692`; export side form `2434:10645` |
| Tablet 1024 | Full report, rail collapsed `2438:2591` |
| Phone 390 and 320 | Summaries `2438:4852` and `2438:5130`; drill list of Blocked and At risk lines `2438:5408` and `2438:5688` |
| States | S1 loading `2445:3357`; S2 no data for these filters `2445:5411`; S3 could not load `2445:7353`; S4 partial completeness `2445:9281`; S5 MYOB out of date `2445:11188`; S6 definition pending `2445:13095`; S7 restricted Finance `2445:15054`; S8 stale source `2445:16995` |
| Components | Moved at acceptance to the Components page, section "Components · Reporting parts" `2781:344446`, keeping their node IDs and instances: Trust report / Tile `2412:889726`, Cell `2412:889733`, Header cell `2412:889737`, Legend item `2412:889740`, Section header `2412:889744` |
| Prototype | Flows "RP-05 — desktop" and "RP-05 — phone" |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, September beside August where history exists, signed in as Dean Fiedler. Existing references are unchanged; no new reference is introduced |
| Retained captures | [Supply and Finance trust design r01](../reference/ui/reporting/supply-finance-trust-design-r01/README.md): twenty-one icon-free PNGs of nineteen frames, with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:RP-05` Supply and Finance trust/exceptions, `/reports/reconciliation`. BP-01 §22.3 REP-09 to REP-11 and §22.1 KPI-10, KPI-12 to KPI-14. Parent IDs unchanged. Capabilities `supply.read`, `finance.read`, `integration.read` and report export stay proposed, as on RP-01 and RP-02 |
| Page type (r20) | Record detail (report page shared by RP-02 to RP-05). Supporting: Review / comparison (reconciliation exceptions) and a right-side inspection panel for source records, About this measure and Export |
| Reused components | The RP-01 and RP-02 report shell: Rail · Reports (proposal), the top bar with the Conversations action, v2 / Menu item and Menu heading, toolbar and report header facts, Record / Banner, Button and Tag; FN-05 Outlook / Basis swatch for patterns; RP-01's Export, About and Source-record side panels; the compact phone header and action bar. New: the five parts in section 2 |
| Incoming handovers | Read-only reads of Material demand, Purchasing, Inbound shipments, Receiving, Inventory, Returns & claims, Warranty cases, Finance handoffs, Customer accounts, Project financial performance, Claims & obligations, Cash outlook, Measure definitions, Integrations and Mappings & reconciliation. MYOB Acumatica reads carry their own read time |
| Outgoing handovers | Every figure drills to its records on their own pages, where the owner acts. About this measure opens Measure definitions, or shows Definition pending. Export produces a CSV with a PDF manifest and an audit event. The page changes no record, sends nothing to MYOB and approves nothing |
| Source authority | The records listed above. RP-01 and RP-02 are accepted or proposed pages; section 6 records that dependency |
| Proposed departures | Accepted: section 4 |
| Status | Owner-accepted design, 1 November 2026 |
| Decision record | This file |
| Named version | "Supply & Finance trust · RP-05 — accepted", saved by Dean on 1 November 2026: section 8 |

## 4. What the design shows

### The page (D1–D3)

- **Place (D1):** the Reports rail item Supply & Finance trust opens one page. The side menu follows RP-02 (This report, Working views, Saved views) and jumps to each section.
- **Five sections, each with a chart, a table and a drill (D2):** Materials (REP-09, KPI-10), Returns and recoveries (REP-10), Financial trust (REP-11, KPI-12), Margin (KPI-13) and Integration backlog (KPI-14). The header gives owner, definitions, grain, timeframe and time zone, filters (period, project, supplier, company), sources as at for PPO and MYOB separately, completeness and permission.
- **Counts beside every rate (D3):** KPI-10 is 38%, 3 of 8 assessed packages; the 3 demands not assessed are left out and named, never read as zero or ready. KPI-12 is 36%, 4 of 11 items. There are no targets or baselines.

### The sections (D4–D8)

- **Materials (D4):** Blocked and At risk lines by cause and age, with the promise basis shown. The cable kit's Estimated promise stays Blocked; only a SupplierConfirmed promise dated before the need makes a line At risk; a promise that passed is Blocked ([PPO-SUP-DEC-01](supply-readiness-promise-rules.md)).
- **Returns and recoveries (D5):** goods, supplier claims and credits are three separate ageing tables, never added. The expected credit ($395.00) and the one that differs from MYOB ($268.00) are never counted as cash. DP-25 is in quarantine with its claim not started, so no credit is expected yet.
- **Financial trust (D6):** definition status, source freshness and reconciliation result for each of 11 measures. No figure carries a verified badge while three measures have no published version. KPI-12 counts them with the one owned difference (Block C labour, −$1,426.80, Avery Lin). There is no August comparison: v1 took effect on 1 September and September is the first month reconciled.
- **Margin (D7):** KPI-13 is withheld while D-017 is open, with the missing inputs named: revenue basis, tax and currency treatment, tolerances and approver, and the overlap with open committed cost (FD-06). The indicative margin on Project financial performance is not carried into this report.
- **Integration backlog (D8):** unresolved operations by state and age, including a document sent with no reply: queue acceptance is not completion. Five operations, the oldest 17 h 29 min. The daily reconciliation of Monday 12 October is shown with its MYOB read time.

### Sources, access, phone and honesty (D9–D12)

- **Source times (D9):** PPO 09:00; MYOB ledger and credit notes 06:00, stock 08:58 and reconciliation 06:15, each with a completeness word. MYOB stays the book of record; the page sends nothing.
- **Restricted (D10):** a section the reader may not see shows the word Restricted and no figures, not even counts. Export holds only rows the reader may read, and a Finance download rechecks access when the file is read.
- **Phone (D11):** summaries first and one drill list of Blocked and At risk lines, with no tables; 16 px inputs, 44 px link targets and 48 px buttons. At 320 px the content stacks.
- **No targets, baselines or thresholds (D12):** status always has words; charts print their values and use patterns as well as colour.

### Departures, accepted

| ID | Departure | Pattern it changes |
|---|---|---|
| Place | `/reports/reconciliation` is not built; this page defines the build | RP-01's catalogue lists REP-09 to REP-11 as report rows of the overview |
| KPI-14 | Carries Definition pending, with counts labelled Not verified | KPI-14 has no published definition |
| KPI-10 | Counts the 8 assessed packages only | RP-01's overview counts demands blocked of 8 assessed |
| Menu | The side menu follows RP-02 | RP-01's catalogue menu |
| Parts | Five new parts duplicate the shape of the Report parts on the Components page | Consolidation is an open item (section 6) |

## 5. Earlier records this relates to

| Record | Relationship |
|---|---|
| [Supply readiness promise rules](supply-readiness-promise-rules.md) | Applied, not amended: Estimated is not cover; a passed promise is Blocked |
| [PPO as the daily workspace](ppo-workspace-myob-book-of-record.md) | Applied: EI-5 (nothing lost silently) and EI-6 (reconcile every day) shape the backlog and the reconciliation note |
| [Service and Finance download access](report-finance-download-access.md) | Applied: the Finance export rule in D10 |

No earlier record is amended.

## 6. Not decided and not drawn

- **Building the page.** No route exists. The build order is not decided.
- **Publishing definitions.** This acceptance publishes nothing. KPI-13 and KPI-14 have no published definition. REP-09 to REP-11 v1 appear as published in the synthetic story only.
- **D-017.** Stays open. KPI-13 shows no figure until Finance adopts a margin definition.
- **Part consolidation.** The five Trust report parts duplicate the shape of the Report parts from RP-02 on the Components page. A later change should merge them (the Tile gains a count line); it is not part of this acceptance.
- **RP-01 and RP-02.** If either changes the shared report shell, this design follows it through a recorded amendment.
- **Prerequisites for a build:**
  - the `/reports/reconciliation` route in the Reports workspace;
  - the definitions in the Measure definitions model, including KPI-14;
  - a read of integration state and age for KPI-14;
  - receipt, purchase order, return, claim and credit reads with source completeness;
  - MYOB ledger, credit note and stock reads with their read times;
  - export with a manifest and an audit event, with the Finance access recheck;
  - any new capability, with the access-review chain.
- **Not drawn:** tablet and 320 px states, hover and focus, the Filters popover and Save view dialog (RP-02 pattern), About this measure panels for REP-10 and REP-11, keyboard order, 200% zoom and dark mode.
- **Data in the frames:** synthetic, and it sets no operating rule. Ages, return dates, supplier names beyond the drawn pages, the credit values for TS-2 and the EC and pH pair, and the times of the five integration operations were invented for this page.
- **Differences from the drawn pages:** the RP-01 overview counts one expected credit (the EC and pH pair), so DP-25's credit is shown as not yet expected. RP-01 counts 3 demands blocked of 8 assessed; this page's KPI-10 is the complement, 3 of 8 packages ready.

## 7. Audit and polish

Before presenting the page Claude screenshotted the frames inside Figma, checked overflow, fonts, overlaps, colour bindings and links by script, and checked the story against the drawn pages.

- **Corrected:**
  - the tablet frame, which had a fixed height that clipped its content (now 1024 × 7489);
  - the export panel, whose buttons were clipped;
  - tablet chart totals and one state's filter bar, which clipped;
  - stray "Action" buttons on banners;
  - an axis tick that overlapped its unit label, and a menu label that truncated.
- **Left as drawn:** rail and search labels clip by design as on RP-01; the status tag sits at the right of a wrapped section question; side panels cover the right half of the report, as on RP-01.
- **Checked at a coarse scale only:** the REP-10 three-way ageing frame and the eight states, at about 30%. Not checked: hover and focus, 200% zoom, keyboard order.

## 8. Verification

- Claude checked the frames with screenshots taken inside Figma and did not play the flows in Present mode. The scripted pass found no overlapping frames, no frame outside its section, no text outside Roboto, no text fill unbound from a colour variable and no off-page navigation link.
- The nineteen captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 1,570,000 (`3093:640918` to `3098:543229`). Prototype reactions were removed and each Font Awesome icon instance was swapped for `Icon/placeholder`: 1,124 swaps across the copies. A scan then found no Font Awesome instance left, no copy with a prototype link, and none of 6,162 visible texts with a stored colour that differs from its bound variable.
- The captures were exported at scale 1 with the Figma connector. The export is capped at 4,096 px, so the full-length desktop report (7,390 px) and tablet report (7,489 px) were each split into two clipped frames at section boundaries, giving twenty-one images. The hashes are in the [captures README](../reference/ui/reporting/supply-finance-trust-design-r01/README.md).
- **The named version.** Dean saved "Supply & Finance trust · RP-05 — accepted" in the Figma version history on 1 November 2026 and told Claude so; Claude did not see the version history itself.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
