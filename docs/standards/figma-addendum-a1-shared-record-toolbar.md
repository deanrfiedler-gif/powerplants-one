---
document_id: PPO-FIGMA-ADDENDUM-A1
date: 2026-11-09
owner: Dean Fiedler
status: Living companion to the Figma build prompts; the record header toolbar it describes was accepted by Dean on 9 November 2026 (shell rules R116 to R125)
versioning: git
---

# Addendum A1 · Shared record toolbar

**In the repository.** Added on 14 November 2026 as a living master, so that every design, audit and build session can read the same text. Most alignment audits of 12 and 13 November 2026 recorded that they had not been given it. The module Figma build prompts it amends are working files kept outside the repository; where it says "the prompt", it means the module's build prompt, and where it names a prompt's section or question, that is the prompt's numbering. The private file it calls "PPO - Shell (accepted)" is now named "PPO - Shell". Later owner decisions in `docs/decisions/` take precedence over this text. No Figma link or file key is recorded here (ADR-0050, ADR-0053), and every person, record and value is synthetic.

Applies to: the Estimating module prompt (version 4), the Projects module prompt (version 2) and the Supply module prompt. Paste this addendum after the prompt. It also defines a Sales follow-up batch. Dated 9 November 2026; **status: accepted by Dean on 9 November 2026 ("Accept the record header toolbar as drawn")**. The rules below are R116 to R125 of the shell rules register (`docs/design/development/systems/shell-refined-concept-rules.md`) and section 10 of the Shell record. **Named version: "Shell refined concept — accepted · record header toolbar", saved by Dean on 10 November 2026** (Shell record section 11). Cite it for the shell and the toolbar in every build and record from now on; the 8 November version "Shell refined concept — accepted" does not carry the toolbar.

## A1.1 What it is

A shared record header for every record page in every module, proposed from Dean's screenshot of a quotation record header on 9 November 2026. It has four rows: breadcrumb; one-row title with the state chip and a favourite star; one-line sub-line; a toolbar with previous and next in the current view, a labelled **Actions** menu, an **Outputs** menu and one state-driven primary action; then a hairline rule. It is drawn in the Shell file as a proposal and is adopted by copying, never redrawing.

## A1.2 Where it is drawn

**PPO - Shell (accepted)**. On acceptance the component set `170:10178` and the phone component `170:10215` moved into the accepted Components section (`7:2767`) on the first page `0:1`, with labels, keeping their node IDs; copy them from there. The page `Record header toolbar (accepted 9 November 2026)` (`170:9926`) keeps the navigation-states strip, the in-context sheet and the rules card as the design record.

| Node | What |
|---|---|
| `170:9927` | Page header card: purpose, what was and was not adopted from the screenshot |
| `170:10178` | Component set **Shell / Record header · toolbar** (1312 wide), variants `State=Draft` `170:9933`, `Awaiting approval · approver` `170:9973`, `Awaiting approval · preparer` `170:10015`, `Approved · not issued` `170:10056`, `Issued` `170:10099`, `Closed` `170:10139` |
| `170:10179` | Navigation states strip: first in view, middle, last in view, opened by link (arrows hidden) |
| `170:10215` | Component **Shell / Record header · toolbar · phone** (390): back arrow, truncated title, favourite, more menu, status row, sticky action bar |
| `170:10244` | Sheet RH01, the header in context on a quotation record at Approved · not issued inside the accepted shell (1440 × 900) |
| `170:10581` | Rules card R1 to R10 |

On acceptance the component set moves into the Shell file's accepted Components section and the Sales kit copies it; the module files then swap their copies for the library component.

## A1.3 Rules (binding once accepted; draw to them now)

1. The header is identical on every record page in every module: breadcrumb, title row, sub-line, toolbar, rule. Record pages keep their checks bar or key-dates strip below it.
2. **The primary action is state-driven and singular.** For a quotation: Draft → Submit for approval; Awaiting approval → Approve… for the approver, or disabled with the reason for the preparer, owner or author ("You prepared this revision, so you cannot approve it. Jordan Blake can."); Approved · not issued → Issue & send for the issuer, which runs the issue recheck and then the send composer; Issued → Record response; Closed → none, with "Read only · closed [date]". Every other record follows the same pattern with its own decisions (section A1.4).
3. **Actions** is a labelled menu, not an ellipsis. It holds the record's secondary decisions and Duplicate (Prepare successor revision, Copy to another deal, Copy to new project). Nothing in Actions commits a decision without its dialog.
4. **Outputs** holds Download PDF, Print, Issued document and Customer page where the record has outputs (DK-03). It is absent on records without outputs. It is named Outputs, not Reports.
5. **Previous and next** follow the order and filters of the register view the record was opened from, with "n of N in view". Disabled at the ends. Hidden when the record was opened by link or search. No first or last.
6. **The favourite star** adds the record to the docked menu's Favourites group and to My Work's favourites. Personal, never shared.
7. **No record-level Undo.** Draft editors may undo before save; a saved decision is reversed only by its own successor or reopen decision, recorded in History.
8. **No New (+) in the header**; quick create stays in the workspace flyout and the top bar. **No desktop back arrow**; the breadcrumb returns. The phone header keeps its back arrow.
9. **Phone:** the toolbar becomes a sticky action bar with Actions and the primary; a desktop-only decision (issue, close project) shows disabled with where it can be done.
10. Every icon-only control has a tooltip and an accessible name; focus order is breadcrumb, title controls, toolbar left to right; Escape closes an open menu and returns focus to its button.

## A1.4 Primary action per record (state → primary; the issuer, approver and reviewer rules of each module apply)

| Module | Record | States → primary |
|---|---|---|
| Estimating | Estimate | Draft → Submit for review; Submitted → (reviewer) Record review decision; Returned → Resubmit; Reviewed → Prepare quotation; Withdrawn → none |
| Estimating | Quotation | As rule 2 |
| Estimating | Sales brief (receiver side) | Submitted → Accept against fingerprint (Clarify and Return in Actions); Clarification → Resolve; Source changed → Return for corrected successor; Accepted → Open workspace |
| Estimating | Rule set | Draft with findings → none, "Resolve findings to submit"; Draft clean → Submit for review; In review → (reviewer) Publish (Return in Actions); Published → New draft |
| Estimating | Workbench run | Inputs incomplete → none; Proposal → Use in estimate (Compare & save in Actions); Stale → Update proposal |
| Projects | Handover (PJ-01) | Receiving review → Create project (then Link); Linked → Mark Started (blocked while a source difference is open) |
| Projects | Project | Active → Record baseline when none, else Add task; Closing → Review project closeout; Closed → none, "Read only" (Reopen in Actions) |
| Projects | Variation | Requested → Assess; Assessed → Submit; Submitted → (reviewer) Decide…; Approved → Record signed adjustment; Disputed → Resolve dispute |
| Projects | Package brief | Draft → Submit (disabled without an approved basis, with the reason); Submitted → (receiver) Accept; Accepted → Review work evidence |
| Projects | ITP | Open → Record check attempt; Hold point open → none, "Stopped at hold point n"; Checks complete → Release with exclusions |
| Projects | Update | To prepare → Prepare to send; With approver → (approver) Approve and send (Return in Actions); Sent → Correct this update |
| Projects | Stage | Open → Issue stage pack when none, else Record acceptance decision; Ready → Review stage closeout; Closed → none (Reopen in Actions) |
| Sales (follow-up) | Deal, Lead, Quotation, Organisation, Person | Per the Sales record's existing decisions; the Deal's primary is its stage action (Change stage, Record Won, Record Lost) |

## A1.5 Where it must appear in each prompt

- **Estimating (v4):** add the header to T01, B02, Q03, Q04 to Q09, R02, R12, CS01, CF01, CA01, CC01, W04, O02; show the navigation states on ST01; the Awaiting approval · preparer variant on V08; the phone variant on PH Q03 and V07. Section 6.1 "Records" now reads: breadcrumb, title row with state chip and favourite, sub-line, record toolbar, then the checks bar and signals strip.
- **Projects (v2):** add the header to RC01, IN02, CM02 to CM06, CM10, RK03, SP02, SA03, SU02, AC02; the key-dates strip sits below the toolbar; navigation states on ST01; phone variant on PH RC01 and AC06.
- **Sales (follow-up batch, not now):** replace the record header on R01, L02, C01, O01, P01 and the quotation sheets with the component; rename the "…" menu Actions; add Outputs on the quotation and handover records; add previous/next to records opened from D01, L01, T01.

## A1.6 Correction to both prompts, section 6.4

The Shell file already carries an accepted collapsed docked menu: sheet K `29:3122` "Docked menu collapsed to a strip" and the component set `Shell / Workspace menu · collapsed strip` `29:3119`, 80 px wide. Use it. Do not derive a 56 px strip, and do not record a shell departure for it. The content width with the strip is 1232 px (1312 − 80), not 1256.

## A1.7 Repository

Done. The Shell record (`docs/decisions/shell-refined-concept-design.md`) holds the toolbar in section 10 (node IDs, rules R116 to R125) and the named version in section 11, recorded on 10 November 2026 through a pull request awaiting Dean's merge. Each module record cites sections 10 and 11 in its "Sources" and "Rules applied"; a record written before 10 November keeps its citation of the 8 November version and moves to the new one when next changed. The Sales follow-up batch is recorded in the Sales record as a further section. No Figma link or file key is written anywhere.
