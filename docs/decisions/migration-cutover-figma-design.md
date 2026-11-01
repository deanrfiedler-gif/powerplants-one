---
document_id: PPO-AD06-MIGRATION-CUTOVER-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; implementation, any real migration, integration and cutover separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Migration, coexistence and cutover design — owner decision

On 24 October 2026 Dean asked Claude "to design and build the 'Migration, coexistence and cutover workbench (AD-06)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew it and asked "Do you accept this AD-06 proposal, with my recommended answers to Q1–Q6?". On 1 November 2026 Dean answered: "Accept". That answer accepts the design with departures D1–D10 and the recommended answers to Q1–Q6.

Claude drew the page from these sources:
- the register entry `scope:AD-06` and [its design page](../design/development/pages/scope-ad-06.md);
- the [MYOB book-of-record direction](ppo-workspace-myob-book-of-record.md) (EI-1 to EI-10, in particular EI-5, EI-6 and EI-9);
- the [product direction](product-direction-quality.md), which makes CREMS historical background;
- the [conformance standard](../standards/html-module-conformance.md);
- BP-01 for parent IDs, and decisions D-006 (MYOB contracts) and D-012 (SharePoint locations, access and retention);
- the accepted [Settings hub design](settings-hub-figma-design.md) (AD-02) and [Operational health design](operational-health-figma-design.md) (AD-09), whose shell and page patterns the frames were cloned from;
- the Figma pages for Integrations AD-04, Mappings & reconciliation AD-05, Data quality AD-03 and Audit history AD-07, read and not edited.

Accepting AD-06 accepts none of those other pages. Its handovers to AD-03, AD-04, AD-05, AD-07 and AD-10 name the page each hands to, and follow those pages if they change.

Scope:
- `scope:AD-06` "Migration, coexistence and cutover workbench", destination `/admin/migration`, which is not built.
- Parent IDs DAT-01 to DAT-03 and DAT-11, CRM-01 to CRM-03, PAR-01 and PAR-05, MIG-01 to MIG-08. None is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, route, read model, migration, capability, grant, adapter, endpoint, credential, data load, real migration, production integration, customer communication, read-only change in any system or cutover. Every name, number, hash, date and reference on the page is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design AD-06 in Figma | User decision, 24 October 2026 | Dean's request quoted above |
| Departures D1–D10 | Accepted as recommended, 1 November 2026 | "Accept". Section 4 |
| Q1 Which module migrates first | Resolved as recommended, as a planning direction | Customers and people, rehearsed and signed off together with Deals and activities. Deals are the first module staff work in, in PPO |
| Q2 How long PPO and Pipedrive run side by side | Resolved as recommended, as a planning direction | Two weeks, then Pipedrive read-only, with a rollback point before that day that is tested in a rehearsal first |
| Q3 Do closed deals migrate | Resolved as recommended, as a planning direction | All open deals. Closed deals since 1 July 2024 (two financial years) as read-only history; older ones stay in the Pipedrive archive as a reference |
| Q4 Who signs off each module | Resolved as recommended | The department lead who works in the module is its owner. A second person from Finance or Administration signs after them and is never the preparer |
| Q5 Where duplicates are merged | Resolved as recommended | Only in Data quality (AD-03). This page flags and hands over |
| Q6 How long rehearsal spaces and reports are kept | Resolved as recommended, subject to D-012 | The space is discarded after sign-off or 10 days. Reports and sign-offs are kept in Audit history (AD-07) under the retention rules of D-012, which is still open |
| Accept the design | User decision, 1 November 2026 | Quoted above |
| Named Figma version | Not saved yet | Section 7 |
| Building the page | Not decided | Section 5 |

Q1 to Q3 shape the drawn plan. They set no date and start nothing. The page's own label stays "Proposed plan: not a decision", and the calendar dates in the frames belong to the synthetic story.

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Migration & cutover · AD-06" `2438:893312`, under "— Administration —". The page header `2438:893313` holds the conformance declaration; the notes card `2532:905072` is in Flows and notes. File index row `3092:19425` |
| Desktop 1440 | Overview `2455:86`; Rehearsal run 3, full length `2467:537`; Reconciliation detail `2514:900536`; Exceptions `2519:1583`; Coexistence plan `2522:5903`; Cutover readiness `2524:5992`; Sign-off `2526:2394` |
| Tablet 1024 | Overview `2528:3231` |
| Phone 390 | Overview `2528:2664`; Exception, owner fixing an item `2529:3308` |
| Phone 320 | Overview `2528:2949`; Exception, owner fixing an item `2529:3479` |
| States | S1 Loading `2530:3372`; S3 Could not load `2530:3536`; S4 No permission `2530:3686` (phone 390); S2 No rehearsals `2530:903293`; S5 Failed and rolled back `2530:903946`; S6 Counts don't reconcile `2531:4236`; S7 Sign-off blocked `2531:5030`; S8 Snapshot refused `2530:904572` (desktop) |
| Page parts | Not components: rehearsal stage strip, coexistence timeline, readiness matrix, grouped exception register. Reused: Shell v2, Grid / Header cell, Grid / Cell, Tag, Button, Attention row (AD-02), Record / Field, Integrations / Sync list row (phone, an AD-04 proposal part), Shell / Phone header · compact, Tab bar, Quick add |
| Prototype | Flows "AD-06 — desktop" (from the Overview) and "AD-06 — phone" (from the 390 overview); 55 navigation links, none off the page |
| Story | Synthetic, section 3 |
| Retained captures | [Migration and cutover design r01](../reference/ui/migration-cutover-design-r01/README.md): 20 icon-free PNGs with hashes, from copies `3092:19434`–`3094:11845` on Captures at y = 1,430,000 |

## 3. Story and conformance

Synthetic, as at Tue 13 Oct 2026, 09:00 AEST. The third rehearsal of customers and deals, from a synthetic Pipedrive-shaped snapshot (SYN-SNP-000003), loaded into an isolated rehearsal space (SYN-RSP-000003). Rehearsal numbers count per module.

- 412 organisations: 325 matched, 6 matched with an unmapped MYOB customer key (handed to AD-05), 37 new, 38 duplicates in 17 groups (handed to AD-03) and 6 rejected with reasons.
- 538 deals reconcile by count. The total differs by $12,400.00: source $9,284,650.00, loaded $9,272,250.00. Two open deals carry currency text in the value ("A$8,200.00" and "4200 AUD") and loaded as $0.00.
- Four exceptions are open with named owners, so sign-off for Customers and people is blocked. Documents as references is signed off and shows Ready for decision.
- The plan proposes Deals in PPO first from Mon 16 Nov, Pipedrive read-only on Mon 30 Nov and a rollback point on Fri 27 Nov, with MYOB read for customers live before Deals.

New synthetic references include SYN-RHS-000001 and 000003, SYN-SNP-000001 to 000003, SYN-RSP-000001, 000003 and 000004, SYN-EXC-000031 to 000034, SYN-AUD-000412 and SYN-P-0138.

Conformance:

| Item | Declaration |
|---|---|
| Scope identity | `scope:AD-06`; `/admin/migration`, not built |
| Page type (r20) | Overview / dashboard (overview); Review / comparison (rehearsal run, reconciliation); Register / worklist (exceptions); Planning workspace (coexistence plan); Form / guided workflow (sign-off) |
| Incoming handovers | A synthetic or specifically approved redacted snapshot (source name and type, hash, row counts); mapping version and unmapped keys from AD-05; duplicate groups from AD-03; read-only MYOB state from AD-04; training status from AD-10. Nothing is read from a live system |
| Outgoing handovers | Duplicates to AD-03; unmapped keys to AD-05; invalid records to a named fix owner; every run, sign-off and refusal to Audit history AD-07; a Ready for decision result to Dean Fiedler, who decides outside the page |

## 4. What the design shows

| ID | Departure or rule | Basis |
|---|---|---|
| D1 | "Migration & cutover" sits under Support in the Settings side menu, with Overview, Rehearsal runs, Exceptions, Coexistence plan and Cutover readiness as children | AD-02 pattern; AD-09 under Support. A departure from the accepted menu |
| D2 | Rehearsal only: every run loads into an isolated rehearsal space, and no control writes a live PPO record or a source system | AGENTS.md; EI-9 |
| D3 | Sources are named by type only: Pipedrive, Smartsheet registers, Excel workbooks, SharePoint documents and MYOB Acumatica. CREMS appears only as an optional historical source. No endpoint, field list or credential | AGENTS.md; EI-7; the product direction |
| D4 | A snapshot must be synthetic or specifically approved as redacted. Anything else is refused before any row is read, with no override (S8) | AGENTS.md |
| D5 | Module status words are Not started, Rehearsing, Exceptions open and Signed off, always in words | The brief |
| D6 | Sign-off needs the module owner and a second person who isn't the preparer. It is blocked while an exception is open or a difference is unexplained, with no override (S7) | The brief; EI-6 |
| D7 | Each exception keeps one owner. Duplicates go to AD-03, unmapped keys to AD-05 and invalid records to a fix owner at the source. Handing over doesn't close an exception | EI-5, EI-6 |
| D8 | The coexistence plan is labelled "Proposed plan: not a decision". It shows who works where by week, read-only dates, rollback points and dependencies | EI-9 |
| D9 | The result words are "Ready for decision" and "Not ready". No screen says "Cut over" or records one | The brief; AGENTS.md |
| D10 | Four new parts stay on the page, not on Components: stage strip, timeline, readiness matrix and grouped register, whose group bands span the checkbox and settings columns | ADR-0053; the grid band rule |

## 5. What this does not decide or build

- `/admin/migration`, its read models, capabilities and rehearsal space aren't built, and no capability is added to `src/platform/permissions.ts`. A build needs its own go-ahead and architecture decisions.
- No real snapshot is taken, nothing is connected and no system is set read-only. A real migration or cutover needs its own authority.
- The 10-day space limit, the 1 July 2024 boundary and every calendar date are drawn proposals, not operating policy.
- Not drawn: the Prepare rehearsal form beyond its refused state, a rehearsal history register, the Rollback test, and tablet frames other than the overview.

## 6. Verification

Layout audit by script: no frame overlaps and nothing sits outside its section; sections are 80 px apart. Capture copies: 20 frames, no Font Awesome instance and no navigation link left, dimensions match their frames. Screenshots of the frames were inspected at reduced scale while drawing; three captures (overview, coexistence plan, phone 320 exception) were inspected at full size, and the other seventeen were not re-inspected after the last small text edits.

The prototype flows were **not** played in Present mode; their links were traced in code only. Links cloned from AD-09 that pointed off this page were removed, and component hover states were restored from their main components. Design acceptance is not functional, business or deployment acceptance.

Open for the next change to the page, not changed here:
- Cutover readiness shows Documents as references with coexistence "Agreed", meaning the links-only arrangement, while the plan labels its dates proposed and says no schedule is agreed.
- The shell was cloned from AD-09 as drawn on 24 October. AD-09's later audit additions changed its own children, which this page shows collapsed.

## 7. Named version

Named Figma version "Migration & cutover — accepted": not saved yet. It waits for Dean, or for his explicit instruction to Claude.
