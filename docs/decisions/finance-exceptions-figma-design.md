---
document_id: PPO-FN-EXCEPTIONS-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; named Figma version saved; building the page, its data model and any credit rule separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Finance exceptions design — owner decision

Dean asked Claude to "design and build the Finance "Exceptions" page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page on 31 October 2026 and asked "Do you accept the Finance exceptions proposal with the recommended answers?" On 1 November 2026 Dean answered: "Accept and lock in".

The Finance rail had an Exceptions item that was unavailable, with no page or design. This is the one Finance worklist that gathers exceptions from the drawn pages; each row opens its owner page.

Claude drew the page from these sources:
- BP-01 FIN-03 and FIN-06;
- the "Reconciliation & exceptions" view of the [Finance workspace design](finance-workspace-design.md) r02: correction progress, the Reconciler and unknown-outcome lookup;
- [ADR-0016](ADR-0016-p10-finance-handoff.md) and [EI-4 to EI-6](ppo-workspace-myob-book-of-record.md);
- the records on Finance handoffs FN-01 `2091:592837`, Mappings & reconciliation AD-05 `2097:685460`, Measure definitions FN-06 `2105:626649`, Customer accounts FN-02 `2097:606288`, Claims & obligations FN-04 `2097:611315`, Integrations AD-04 `2097:678714`, and Supply & Finance trust RP-05 `2410:885569`.

Scope:
- `scope:FN-01` and `scope:FN-02`. No new scope ID.
- Traced to parent requirements FIN-03 and FIN-06. No parent ID is added or renamed, and none is marked complete.
- Proposed route `/finance/exceptions`. It doesn't exist, and this decision doesn't register it.

This is a design decision. It authorises no application code, route, read model, migration, capability, grant, MYOB endpoint or deployment. The page never posts, never retries a posting blindly, never edits an original result and never lets the evidence supplier verify their own evidence. All records and rules in the frames are synthetic and proposed, not verified operating rules.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Accept the design | User decision, 1 November 2026 | "Accept and lock in", answering the question quoted above. Every recommended answer below is adopted on those words |
| D1–D10 | Claude's proposals, accepted with the design | Section 4 |
| Q1 Who is the Reconciler? | Resolved as recommended | A duty any named Finance person can hold, refused for whoever supplied that evidence. Dean by default, as on AD-05; Avery Lin when Dean supplied it. Finance always needs two people able to act |
| Q2 Credit hold: warn or block? | Resolved as recommended | Warn. A credit hold routes the work to Finance review, and Hold shows on the owner page and warns at booking, without a hard stop. PPO has no credit authority, and urgent work may have to go ahead |
| Q3 Replace the Reconciliation rail item, or sit beside it? | Resolved as recommended | Beside. Reconciliation is the daily runs and ledger comparison (AD-05, FN-06); Exceptions is the worklist across pages |
| Q4 How old before an exception escalates? | Resolved as recommended | No rule is drawn; the page shows only the oldest. Use the owner's due date where the source has one, as AD-05 already does, and agree a working-day limit for the rest after real use. No limit is set by this decision |
| Q5 FN-01 and AD-05 disagree on SYN-FH-000070 | Resolved as recommended | AD-05 is the record: $1,240.00 posted, Mon 16:41, SYN-C-00236, 4 h. FN-01 shows $1,150.00, matching, Tue 08:33, SYN-C-0204, 7.0 h, and is aligned when it is next changed. FN-01 is not edited now |
| Q6 Age of SYN-RCT-000083 | Resolved as recommended | AD-04's 18 h 54 m stands, drawn as 19 h. RP-05's 16 h 58 min follows AD-04 when RP-05 is next changed |
| Q7 Below-minimum price "approved elsewhere" | Resolved as recommended | Keep the row type, raised only once a pricing policy exists. Estimate review ES-04 says the policy is not configured, so SYN-QUO-000091 and its −$312.00 are illustrative |
| Q8 SYN-FH-000069 and "Returned" | Resolved as recommended | Add the sync item on AD-04 when it is next changed, and treat FN-01's source-changed state as Returned. Neither page is edited now |
| Q9 Two Northbank customers | Resolved as recommended | The Block C customer is SYN Northbank Nursery (SYN-C-00233). SYN-DIF-000014 belongs to SYN Northbank Growers. They stay separate |
| Named version | Saved by Dean, 1 November 2026 | "I have saved the named version as Finance exceptions — accepted". Section 2 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053). Named version "Finance exceptions — accepted", saved by Dean on 1 November 2026 |
| Page | "Finance exceptions · FN-01 · FN-02" `2948:1497`, last under "— Finance —". Header `2948:1498`, notes card `2964:8686`. File index row `3090:490441` |
| Desktop 1440 | Section `2948:1543`:<br>• worklist, All open `2953:229`; by owner `2961:3281`<br>• SYN-DIF-000014 line comparison `2957:1171`; evidence supplied, awaiting verification `2957:2089`; verified and resolved `2957:2925`<br>• Needs Finance review, credit hold `2959:2856`; Hold recorded `2959:3517`<br>• unknown outcome lookup `2959:4134` |
| Tablet 1024 | Section `2948:1547`: worklist `2961:4646` |
| Phone 390 and 320 | Section `2948:1551`:<br>• 390: worklist `2962:4092`, exception record `2962:4434`<br>• 320: worklist `2962:4276`, exception record `2962:4614` |
| States | Section `2948:1558`: loading `2962:47925`, nothing open `2962:48835`, could not load `2962:49259`, no Finance access `2962:49683`, MYOB out of date `2962:50107`, verifier is the supplier (refused) `2962:50545`, stale `2962:51206` |
| Flows | "Finance exceptions — desktop" and "Finance exceptions — phone". Set by script, not played in Present mode |
| New parts | Finance / Exception grid header `2950:122` and row `2950:136`, now on Components · Finance parts `1676:12012`. See the [binding](../design/development/component-bindings/2026-11-01-finance-exceptions-design.json) |
| Retained captures | [Finance exceptions design r01](../reference/ui/finance/finance-exceptions-design-r01/README.md): twenty icon-free PNGs with hashes |

## 3. Conformance

| Field | Declaration |
|---|---|
| Scope identity | `scope:FN-01` and `scope:FN-02`, proposed route `/finance/exceptions`, FIN-03 and FIN-06. No new scope ID |
| Page type (r20) | Register / worklist, with Record detail and Review / comparison as supporting types |
| Reused components | Shell / Top bar `35:138` (linked), FN-03 Finance rail `1580:4235`, v2 menu items, Grid cell, header and checkbox cells, My Work group row, Record / Header, Field, Check item, Banner, View tab, Button, Shell / Phone header · compact `1530:110`, Controls / Choice option and Form field (proposed, PR #694), AD-05 Line comparison and Evidence rows, FN-03 phone list row |
| Incoming handover | Read from the owner pages named above, plus work flagged from Work orders SV-03, Service agreements MA-02 and Quotation detail. MYOB credit status is read with its source time |
| Outgoing handover | "Open in [source page]" on every row. Cleared or Hold, with a reason, shown on the owner page. Reversals go to Finance handoffs (EI-4), resends to Integrations. RP-05 reports on these and keeps its numbers |
| Exceptions and recovery | Seven states, plus Look up in MYOB for an unknown outcome. Mismatched evidence leaves a correction open, and every observation stays |
| Departures | Section 4, D2 and D7. Rail item Exceptions shown as available. Needs Finance review is new behaviour, with no owner-page change drawn |
| Verification | Section 6 |

## 4. Decisions in the drawing

| ID | Decision | Basis |
|---|---|---|
| D1 | One worklist, owners keep the records. Each row opens its owner page; this page holds only the correction, its evidence and the review | Dean's brief; EI-5 |
| D2 | Owning scopes FN-01 and FN-02, with `/finance/exceptions` as a proposed route departure | Dean's brief; [conformance standard](../standards/html-module-conformance.md) |
| D3 | Type is the group band, and "Open in [source page]" is the second column, so it shows on every row without scrolling at 1440. Issue, Type, Customer, Raised and Exception scroll. In an owner view, Type replaces Owner | Grid register rule |
| D4 | Amounts keep their source page's basis (excluding GST, or "incl." for FN-02) and are never totalled, so the summary shows counts only | FN-01, AD-05 and FN-04 are excl.; FN-02 is incl. |
| D5 | Correction progress is Requested → Evidence supplied → Verified → Resolved. To review and Look up first are separate words, not correction steps. Mismatched evidence leaves it open; both observations stay | r02 |
| D6 | The Reconciler verifies, never the evidence supplier. On SYN-DIF-000014 Dean supplies and Avery verifies, and Dean's attempt is refused (S6) | r02; FN-06 second-person rule; ES-04 self-review refusal |
| D7 | SYN-AR-004812 stays as posted. The correction runs through new handoffs SYN-FH-000075 and SYN-FH-000076 and new synthetic MYOB documents SYN-AR-CN-000221 and SYN-AR-004829. New reference SYN-EXC-000nnn identifies the exception; source references are unchanged | EI-4 |
| D8 | Unknown outcome offers Look up in MYOB with the same key and no retry on this page | r02; FN-01 S5 wording; EI-5 |
| D9 | Needs Finance review records Cleared or Hold with a reason, requires a check in MYOB, and says that ERP credit status is verified separately | FIN-03 |
| D10 | RP-05 keeps its numbers. Of KPI-12's 4 items only Block C labour (−$1,426.80) is an exception here; the 3 with no published version stay on FN-06. Of KPI-14's 5 operations, the outcome-unknown and failed receipts are here; waiting and sent stay on AD-04 | RP-05 |

## 5. What this does not decide

- Building the page. It needs a read model across the owner pages, a correction and evidence record, a review record, capabilities and a go-ahead.
- Any owner-page change. Work orders, Service agreements and Quotation detail don't yet show a Finance review; the Hold frame holds a preview only.
- A credit rule, escalation limit or pricing policy. Q2, Q4 and Q7 set direction, not rules.
- Any MYOB endpoint, posting, customer communication or production integration. D-017 and operational MYOB evidence stay open.

Tablet record frames are not drawn; a build follows the worklist's collapse rules.

## 6. Verification and limits

Before presenting, Claude scripted a check for overlaps, frames outside their sections and text left from the cloned frames, which found two leftover labels that were then corrected. Screenshots covered the worklists, tablet, phones, the requested, evidence, review, Hold and unknown-outcome frames and S6. S1–S3, S5 and S7 were looked at only in a whole-section view.

At lock-in, the difference record's title was shortened because it clipped the More button, its heading was restored to "Original result · preserved", and two touching column headers on the resolved record were shortened. Icons on the twenty capture copies were swapped by script, and a re-scan found none left. Captures 03, 05 and 17 were opened and checked after export.

The prototype flows have not been played in Present mode. Dean has not been recorded as reviewing individual captures. This acceptance is design delivery, not business approval or production readiness.
