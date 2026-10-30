---
document_id: PPO-FN05-CASH-OUTLOOK-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; Finance rules, MYOB read adapter, implementation and UI baseline acceptance separate
source_commit: 6e939bf0b937fc05f9e477d1cd14f8838c92fd9a
versioning: git
---

# Cash outlook design — owner decision

Drawing of FN-05 began on 23 October 2026 and stopped at a Figma call limit. On 31 October 2026 Dean asked Claude to "finish the existing 'Cash outlook · FN-05' page in Figma" as a proposal, stating what the page answers: when will cash come in and go out on projects and service work, and how confident are we? He asked for an audit and polish of the finished page, then answered "Yes, draw those" to Claude's question whether to draw recommendations R1 to R4 and R6 to R8. Claude then asked "Do you accept the Cash outlook FN-05 design with the recommended answers?", and Dean answered: "Accept and lock in."

Claude drew the page from these sources:
- the design register page `scope:FN-05` and guide `guide.fn.05`;
- the [project financial performance design](project-financial-performance-figma-design.md) (FN-03);
- the [MYOB book of record direction](ppo-workspace-myob-book-of-record.md);
- the [supply readiness promise rules](supply-readiness-promise-rules.md) (PPO-SUP-DEC-01);
- the Figma proposals Finance handoffs FN-01, Customer accounts FN-02, Claims & obligations FN-04 and Purchasing SC-02, and Returns & claims SC-08.

**Those five were still proposals when FN-05 was accepted.** Accepting FN-05 accepts none of them. If one changes before its own acceptance, FN-05's story and handover wording follow it.

Scope:
- `scope:FN-05` "Cash timing and commercial outlook", at `/finance/outlook`, with `/finance/outlook/weeks/[week]`, `/finance/outlook/projects/[id]` and `/finance/outlook/scenarios` (all proposed).
- Traced to FIN-08, with FIN-06 and FIN-07, in the [master blueprint](../blueprints/BP-01-master-blueprint.md). No parent requirement ID is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, route, read model, migration, capability, grant, MYOB connection, Finance rule or deployment. The date, staleness and GST rules on the page are proposed and synthetic; they are not operating rules.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Finish FN-05 as a proposal | User decision, 31 October 2026 | Dean's request quoted above |
| Actuals stay apart from forecasts; every figure shows source, time and AUD; scenarios never change source records; expected recoveries are not cash; payroll and overheads out of scope | User decisions, 31 October 2026 | Dean's brief |
| Draw R1 to R4 and R6 to R8 after the audit | User decision, 31 October 2026 | "Yes, draw those" |
| Departures D1–D15 | Accepted as recommended, 31 October 2026 | "Accept and lock in." Section 4 |
| Q1–Q8, Q12 and Q13 | Recommended answers adopted, 31 October 2026 | Section 5 |
| Q9–Q11 differences between FN-02 and FN-04 | Recommended handling adopted; **differences stay open** until those pages are accepted | Section 5 |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | **Not yet saved** | Section 8 |
| R5, R9, R10, R11 and R12 | Proposed, not decided | Section 7 |
| Building the page | Not decided | Section 7 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Cash outlook · FN-05" `2097:681762`, under "— Finance —". The page header `2097:681763` holds the conformance declaration; the notes card `2871:5393` is in Flows and notes. File index row `2903:115` |
| Desktop 1440 | Overview `2105:700228`; All expected lines `2890:7206`; By project `2891:15723`; Week detail `2105:727873`; Assumptions and gaps `2105:743049`; Waiting for me `2890:9843`; Scenario comparison `2112:680687`; Project outlook `2112:686138`; Source reads `2891:17059`; Actuals from MYOB `2891:17495`; New scenario `2114:31916`; Change an assumption `2114:32413`; Confirm an expected date `2114:32636` |
| Tablet 1024 | Overview `2863:3689` |
| Phone 390 | Summary `2114:690243`; Week detail `2896:15395`; Gaps `2896:15128`; Line detail `2114:691425` |
| Phone 320 | Summary `2114:690478`; Week detail `2896:15844`; Gaps `2896:15577`; Line detail `2863:4454` |
| States | S1 loading `2865:4028`; S2 no expected items `2865:4490`; S3 could not load `2865:4949`; S4 no Finance access `2865:5414`; S5 MYOB out of date `2867:4322`; S6 assumption stale `2868:5037`; S7 scenario out of date `2867:4796`; S8 customer not mapped `2868:5568`; S9 form validation `2896:8941`; S10 saving `2896:9195`; S11 save not confirmed `2896:9451`; S12 date conflict `2896:9651`; S13 project manager view `2896:9851` |
| Page parts | Section "Page parts (proposal)" `2105:650190`: Outlook / Basis swatch, Basis tag, Line grid header and row, Week grid row, Gap grid header and row. They stay on this page until a build needs them |
| Prototype | Flows "FN-05 — desktop" (from Overview) and "FN-05 — phone" (from the phone 390 Summary) |
| Story | Synthetic, section 3 |
| Retained captures | [Cash outlook design r01](../reference/ui/finance/cash-outlook-design-r01/README.md): 35 icon-free PNGs with hashes, from copies `2903:125`–`2903:12302` on Captures at y = 960,000 to 1,012,700 |

## 3. Story and conformance

Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, MYOB read 06:00, signed in as Dean Fiedler (Finance), AUD including GST unless a figure says otherwise. S7 is as at Wed 14 Oct, S13 is Jamie Rossi's view.

Declared in the page header: `scope:FN-05` · r20 Overview / dashboard, supported by Register / worklist, Work queue + persistent detail, Review / comparison and Form / guided workflow in a side panel · Shell / Top bar `35:138` (linked), Rail · Finance `1580:4235`, Shell / Phone header · compact `1530:70`, Record / Banner `251:2310`, shared grid, Button, Input and Tag parts · read-only incoming handovers from MYOB, FN-01, FN-02, FN-04, SC-02, SC-08 and PJ-03 · outgoing handovers that only open those sources, FN-03, AD-05, My Work and AD-01.

Figures that reconcile:
- **13 weeks:** expected in $303,343.59 − expected out $106,609.25 + actual to date $2,142.80 = net +$198,877.14. Lowest −$17,129.20 at the end of W2. Not placed in a week: $12,025.20 in and $752.40 out. Expected supplier credit $534.60, not counted.
- **Confidence at W13:** certified or invoiced only +$53,285.10; plus scheduled +$192,628.15; plus estimated, which is Base, +$198,877.14. These are not probabilities.
- **GST memo:** $27,576.69 collected − $9,691.75 paid = $17,884.94 net, payable through BAS and not deducted. It assumes 10% on every line.
- **Customer accounts:** FN-02's $123,799.50 open invoices = $20,537.00 W3 + $6,842.00 disputed, no date (Riverbend) + $31,306.00 W4 + $24,365.00 W5 (Northbank) + $18,562.50 W4 (Coastal Herbs) + $14,091.00 W4 (Hillside) + $3,740.00 no date (Isolation Nursery) + $4,356.00 covered by Hillview's unapplied receipt.
- **Glasshouse 4 with FN-03:** contract $248,900.00, billed $224,010.00, received $199,120.00; open $24,890.00 = SYN-INV-000431 $18,670.00 + SYN-INV-000398 $6,220.00, all excluding GST.
- **By project:** seven projects and service sum to the 13-week in and out totals.
- **Scenario:** the stage 2 claim moves from W3 to W7, so W3–W6 are $27,379.00 lower and the end of W3 goes from +$21,940.60 to −$5,438.40. W7 onwards match Base.

To agree with the other pages, FN-05's own lines were corrected before acceptance. Its earlier citations SYN-INV-000418 and SYN-INV-000391 matched no invoice on FN-02, so those lines now cite FN-02's existing invoices. No other page and no issued reference changed. This moved the 13-week net from +$127,350.74 to +$198,877.14; the people, dates, W1–W2 and expected-out total were kept.

## 4. What the design shows

Departures, each with its basis on the notes card:
- **D1 Place.** A Finance rail page with a side menu of Outlook, Review, Scenarios and Sources.
- **D2 Actual apart from forecast.** Actual bars stop at the last complete read; W1 shows actual and expected side by side and never adds them in a bar.
- **D3 Three stated bases.** Certified or invoiced, Scheduled and Estimated, each with a word, a pattern and a tag.
- **D4 Open records only.** No run-rate. Every line names its source, owner, last confirmation and the reason for its date.
- **D5 Stated date rules.** Payment history, contract terms and MYOB supplier terms, labelled proposed and not verified.
- **D6 Overlay scenarios.** Base follows the sources and can't be edited. A scenario keeps who, why and when, and is marked out of date when a source moves.
- **D7 Owned gaps worklist.** Resolving a gap never changes its source record.
- **D8 Not counted.** Expected recoveries until the credit note is in MYOB, payroll, overheads and BAS. The page says the net is not a bank balance.
- **D9 Supplier promises.** Only a Supplier confirmed promise is Scheduled; an Estimated or overdue promise stays Estimated, and no promise means no date. PPO-SUP-DEC-01 is applied here by analogy.
- **D10 GST.** Cash includes GST, with the excluding-GST amount shown where a line ties to FN-03 or FN-04.
- **D11 Phone and tablet.** Phone has the next four weeks, gaps, week and line detail. Tablet collapses the rail and side menu and uses a six-column week summary.
- **D12 Honest figures.** A figure needing a complete MYOB read shows Not complete when the read failed, and nothing appears while loading or after a failed load.
- **D13 Confidence lines**, **D14 GST memo** and **D15 Company filter**, side menu on the overview and phone additions.

## 5. Questions

| Question | Adopted answer |
|---|---|
| Q1 Horizon | 13 weeks, with actuals for the previous four |
| Q2 Payroll and overheads | Stay out, and the page says the net is not a bank balance |
| Q3 Who sees and changes scenarios | `finance.read` sees the page; Finance creates scenarios; project managers see their own projects' cash and propose changes, which Finance adopts. No capability is added by this design |
| Q4 Stale | An owner-entered date not confirmed for more than 14 days |
| Q5 Past due | More than 30 days past due becomes Estimated until its owner confirms a date. A disputed invoice has no expected date until its owner gives one |
| Q6 Payment history | The customer's average over its last six invoices, or fewer, stated on the line. Finance should confirm before any build |
| Q7 Unmapped customer | Assume 30 days, mark Estimated and raise a gap. Never match a similar name automatically |
| Q8 Build order | After the MYOB read adapter |
| Q9 Stage 2, Glasshouse 4 | Keep one $27,379.00 line, as FN-03 and handoff SYN-FH-000062 do. FN-04 phases the same $24,890.00 excluding GST as claim 7 $9,642.50, M8 $2,802.50 net and retention $12,445.00. Split it when FN-04 is accepted |
| Q10 Block C labels | FN-05 follows FN-02 (SYN-INV-000356 $31,306.00, SYN-INV-000437 $24,365.00). FN-04 has claim 3 $28,500.00 Paid and claim 4 $23,750.00, excluding GST. Settle when those pages are accepted |
| Q11 Rainwater and claim 6 | FN-05 follows FN-02 ($18,562.50). FN-04 shows claim 2 at $33,750.00 excluding GST and all of claim 6 as Disputed, where FN-02 disputes only V-02, $6,842.00. Settle with Q10 |
| Q12 GST rate and BAS | Keep the memo at 10% until MYOB tax codes can be read, and leave BAS payments out. Finance should confirm |
| Q13 Date conflict | Keep the first saved and ask the second person to choose. Both stay in the line's history |

## 6. Verification

Audit of 31 October 2026, by script and screenshots: 35 frames, all in their standard sections; Roboto only; no overlap and nothing outside a section; the top bar on every desktop and tablet frame is a linked `35:138` instance, and phones use the compact phone header; phone inputs are 16 px and phone 320 targets are 44 px; none of the old figures or references remain; no prototype link leaves the page.

**The prototype flows were wired and traced in code but not played in Present mode.** 200% zoom and keyboard order were not checked. Rows that truncate in grids do so by design and scroll sideways.

The capture copies hold no Font Awesome instance and no prototype link, checked by script, with one copy inspected by eye. S10 dims its buttons because the shared Button has no disabled variant.

No component binding file is added: no shared component changed. The new Outlook parts stay on the Figma page.

Design acceptance is not functional, business or deployment acceptance.

## 7. What this does not decide or build

- `/finance/outlook`, its read models and adapters are not built, and no capability is added to `src/platform/permissions.ts`.
- Proposed and undecided: R5 hypothetical lines in scenarios, R9 a weekly snapshot and what-changed bridge, R10 customer concentration, R11 forecast accuracy, and R12 ranking gaps by effect on the low point.
- Not drawn: the MYOB documents behind an actuals week; project outlook for projects other than Glasshouse 4; tablet frames other than the overview; phone states. S9–S13 are desktop only.
- Open for the shared Button's next change: a disabled or saving variant.
- SYN-PPO-PRJ-000029 for Propagation on By project is inferred by elimination from FN-03's references. SYN-PO-000209, SYN-PO-000214 and the later project orders aren't among the nine open orders drawn on SC-02.

## 8. Named version

The named Figma version "Cash outlook — accepted" has not been saved. It waits for Dean's save or his instruction. This pull request stays in draft until it is confirmed.
