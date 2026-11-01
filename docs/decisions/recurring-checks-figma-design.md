---
document_id: PPO-AI07-RECURRING-CHECKS-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Recurring checks AI-07 design — owner decision

On 24 October 2026 Dean asked for this page: "Your task is to design and build the "Recurring checks and automation review (AI-07)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." A person sets up checks that Carl runs on a schedule and reviews what each run found. Results are suggestions with an owner, and a run never acts on records.

Claude drew the page from these sources:
- the design register page [scope-ai-07](../design/development/pages/scope-ai-07.md);
- the [assistant specification](../blueprints/ppo-assistant-specification.md) sections 6 to 11;
- the decision [PPO-AI-DEC](ppo-assistant-direction.md), amendment A1;
- the [reply-by reminders proposal](conversations-reply-by-reminders.md), for scheduling options A, B and C;
- the [Conversations T1 scope](conversations-t1-scope.md), rules N7, N14 and T1-8;
- the [threads decision](ai-communications-threads-proposal.md), N5 (playbooks, as later work);
- [quote view tracking](quote-view-tracking.md), Q7;
- the accepted [Assistant AI-01 design](assistant-figma-design.md), whose top-bar action and Source chip it reuses;
- [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

On 1 November 2026 Dean accepted the design by choosing the offered answer "Accept, lock in". The question on screen was "Do you accept the AI-07 design?" That adopts D1–D14 and the recommended answers to Q1–Q6, which were presented with it.

Scope:
- `scope:AI-07` "Recurring checks and automation review". No new scope is added.
- BP-01 page row AI-07, P2. The page elaborates NFR-01, NFR-03, NFR-05, NFR-08, NFR-11, NFR-12 and CRM-02. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, scheduler, background service, provider call, email, push, real data or deployment. Every record, run, time and cost shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design AI-07 as a proposal | User decision, 24 October 2026 | Dean's request quoted above |
| Decisions D1–D14 | Accepted, 1 November 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Which check templates come first | Resolved as recommended | Quotations viewed with no response (Q7), Deals without a next action (CR-04) and Agreements expiring within 90 days (MA-05), whose rules are already accepted. Backups out of date (EQ-08) and Materials blocking work (SC-01) follow once those pages are accepted |
| Q2 Own checks later, or reviewed templates only | Resolved as recommended | Reviewed templates only. A person asks for a new template; the assistant owner reviews what it reads, what it finds and who it may suggest to, then publishes it in Assistant settings. Revisit after the evaluation, and never as free text that chooses tools |
| Q3 Who approves team-scope checks | Resolved as recommended | The owner's manager as recorded in Users and access (AD-01); the assistant owner when no manager is recorded; never the owner themself. A new capability, "Approve team checks", is proposed for a build and is not added here |
| Q4 Whether checks run before scheduling is decided | Resolved as recommended, as a design direction | Yes, on the option A pattern: a due check runs the first time its owner opens PPO on or after its due time, as the owner, once per due time, labelled "Ran when you opened PPO at 08:14 (due 07:00)". No background service. A scheduled job (option B) is added only with email delivery. PPO-CONV-REMINDERS-PROP is a separate record and stays undecided; this answer does not decide it. Section 6 |
| Q5 Who receives a quotation follow-up suggestion | Resolved as recommended | The check's owner for "My records", and each record's account owner for team scope. Quote view tracking Q7 says the quotation owner and the Quotation page draws the deal owner. Section 6 |
| Q6 A separate share of the US$30 budget | Resolved as recommended | Not in the pilot. Show each check's spend and estimate; revisit if checks pass US$5 a month |
| Accept the design | User decision, 1 November 2026 | Quoted above |
| Named Figma version | Saved, 1 November 2026 | "Recurring checks — accepted", saved by Dean. Section 8 |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Recurring checks · AI-07" `2403:47777`, under "— My Work —" after Drafting & domain help · AI-04. The page header `2403:47778` holds the conformance declaration; the notes card `2410:884093` in Flows and notes holds D1–D14, Q1–Q6, the flows and what is not drawn. File index: the row "Row / Recurring checks · AI-07" `3090:469971` in the My Work group, after Drafting & domain help · AI-04 |
| Desktop 1440 | Checks list `2404:876339`; Template library `2405:878993`; New check with preview, Mon 12 Oct 16:18 `2406:619`; Run history `2406:879247`; Run detail, Tue 13 Oct 07:00 `2407:1028`; Partial run, Fri 9 Oct 07:00 `2407:879413`; Paused by budget, a later synthetic example as at Thu 29 Oct `2407:879704` |
| Tablet 1024 | Checks list, rail and side menu collapsed `2407:881051` |
| Phone 390 and 320 | My Work with two suggestions from a check: 390 `2408:884233`, 320 `2408:884844`. Run detail: 390 `2408:884408`, 320 `2408:884733` |
| States | Loading `2408:888675`; no checks `2408:889002`; could not load `2408:889224`; scheduling not yet available `2408:889438`; preview failed `2408:889748`; team approval pending `2408:890037`; deleted check history `2408:890391` |
| Parts | Moved at acceptance to the Components page, section "Components · Assistant" `2388:6065`: AI-07 / Check grid row `2404:876748`, Template card `2405:878955`, Form field `2406:612`, Run grid row `2406:879226`, Finding row `2407:1001`, Phone suggestion card `2408:884202` |
| Prototype | Flows "AI-07 — desktop" (list to library to New check, and to Run history, Run detail and Partial run) and "AI-07 — phone" (a suggestion's Why this? to Run detail and back). 23 links |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, signed in as Sasha Clarke, account manager. The check "Quotations viewed, no response after 5 working days" ran at 07:00 and found `SYN-QUO-000171` r1 and `SYN-QUO-000179` r2, so two suggestions sit in My Work. "Agreements expiring within 90 days" waits for Jordan Kim's approval, with `SYN-PPO-AGR-080105` r02 in its preview. New story facts: `SYN-QUO-000162` r2, `SYN-QUO-000166` r1, `SYN-QUO-000171` r1, `SYN-QUO-000179` r2; Jordan Kim as Sales manager; a Sales team of four |
| Retained captures | [Recurring checks design r01](../reference/ui/my-work/recurring-checks-design-r01/README.md): nineteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AI-07`, register destination `/assistant/automations`, not built; this design defines the build. Opened from My Work › Recurring checks (D1). Parent requirements as listed above, unchanged. Two capabilities are proposed for a build, "Own recurring checks" and "Approve team checks"; neither is added |
| Page type (r20) | Register / worklist (Checks list, Run history), Form / guided workflow (Template library, New check), Record detail with evidence (Run detail, Partial run), and a work queue hand-over (the My Work suggestion card on the phone) |
| Reused components | Shell v2 copied from My Work 404:3 (Rail · Estimating & quotation, the My Work side menu), with the detached top bar from Assistant settings AI-06 (the AI-01 Assistant action and the Conversations action with badge 3); Shell / Phone header · compact; Record / View tab, Filter chip and Banner; Tag; Button; Grid / Header cell and Checkbox; Assistant / Source chip (AI-01), which opens Answer evidence AI-03. Budget wording follows AI-06. New: the six parts in section 2 |
| Incoming handovers | Reviewed check templates published by the assistant owner in Assistant settings. Source records read as the check's owner at run time: quotation views and responses (ES-05, ES-06), Deals (CR-04), Service agreements (MA-05), Configuration backups (EQ-08) and Material demand (SC-01). The assistant budget (A1). A manager's approval for team scope |
| Outgoing handovers | My Work suggestions (Plan follow-up, Open record, Dismiss with a reason) and Updates notifications; Answer evidence (AI-03) for each finding; Audit history (AD-07) for every change to a check. It never changes a record, sends email or push, triggers another check or an action, or runs past the budget |
| Source authority | The sources listed above |
| Proposed departures | D1–D14 in section 4, accepted. D1, D4, D12 and D13 are the departures from the register text or the Pipedrive register pattern |
| Status | Owner-accepted design, 1 November 2026 |
| Decision record | This file |
| Named version | "Recurring checks — accepted", saved 1 November 2026 |

## 4. Decisions, accepted

| ID | Decision | Basis |
|---|---|---|
| D1 | The checks list lives in the My Work side menu as "Recurring checks", with a count of checks needing attention. The route `/assistant/automations` is kept. Results land in My Work and every check belongs to one person, while Assistant settings is for administrators | Register `scope:AI-07`; My Work 404:3; AI-06 audience |
| D2 | Reviewed templates only. The template fixes what is read and found; the owner sets scope, schedule, delivery and one bounded parameter, for example 30 to 180 days | Specification section 6; Q2 |
| D3 | Each check runs as its owner. Access is checked at the start of every run and before showing a result. A finding the owner can no longer see is withheld and its open suggestion withdrawn | Specification section 6; AIA-01, AIA-06 |
| D4 | No scheduler is drawn as existing. Main frames show the story's 07:00 runs as if PPO checks were scheduled. The state "Scheduling not yet available" is what a build shows until scheduling is decided: times are when a check is due, and only Run now runs it | PPO-CONV-REMINDERS-PROP; Q4 |
| D5 | A run reserves US$0.18 (the AI1 turn ceiling at reference rates) before it starts and settles to its real cost. Templates, New check and the list show estimates. When the US$30 budget is used up, every check shows "Paused by budget" until 1 November in the example, Run now is unavailable, and other PPO pages keep working | PPO-AI-DEC A1; specification section 8; AIA-17 |
| D6 | Checks suggest and never act. Results are a My Work suggestion and, optionally, an Updates notification. Email and push show as not available yet. One suggestion per record, never repeated after it is dismissed | T1-8, N14 (D-025, SH-03); quote view tracking Q7; N5 is later work |
| D7 | The owner ticks "I own this check". Team scope goes to the manager with the scope, preview and estimated cost; nothing runs until approved, and the owner can withdraw | Dean's brief; Q3 |
| D8 | History lists time, trigger, duration, found, suggestions with their states, cost and a result in words. Run detail lists each finding with why, evidence chips, an optional note from Carl and the suggestion state (Open, Done, or Dismissed with its reason), and counts what was checked and not suggested, with reasons | AI-01; AI-03; specification section 6 |
| D9 | Failures are stated and never filled in. Permission changed: findings withheld. Source unavailable: "Partial run" names the source and suggests nothing from it; three partial runs in a row turn the check to Needs attention. Budget used up: Paused by budget | AIA-16, AIA-17 |
| D10 | Controls: Run now (counts against the budget), Pause and Resume, Edit, and Delete under More. A deleted check never runs again; its history is kept, and a new check can start from the same template | Dean's brief |
| D11 | Working days are Brisbane's: weekdays without Queensland public holidays. Mon 5 Oct 2026 (King's Birthday) is why `SYN-QUO-000179` r2, first viewed Fri 2 Oct, is first found on Tue 13 Oct | PPO-CONV-REMINDERS-PROP section 1 |
| D12 | Phone: suggestions and run detail only. Suggestion cards sit in My Work as a dashed amendment to 404:181, with Why this? opening the run detail. Creating and editing checks is for desktop and tablet in the pilot | Phone header amendment; My Work 404:181 |
| D13 | No checkbox column on the checks grid. Bulk pause or delete is not offered; each is a deliberate single action | D6, D10 |
| D14 | New story facts as in section 2. Existing references are unchanged. `SYN-PPO-QUO-000188` r2 is not found on 13 Oct, because its only view may be automatic; the Wed 21 Oct run would create the Quotation page's alternative suggestion (`2232:2500`) | Quotation page `2221:85`; Service agreements `2089:548670` |

## 5. Corrections made at lock-in

Dean accepted the design as presented on 24 October. Claude made these corrections on 1 November before capturing it, and they are on the page and in the captures where they are visible:

- **Reused components.** The page header named Grid / Cell and an AI-03 evidence drawer pattern. The page uses neither: it has its own two-line cells and the AI-01 Source chip, which opens AI-03. It also uses Record / Banner and Grid / Checkbox, which the header left out. The header now says so.
- **Q5 wording.** The answer said to align the Quotation page "at its lock-in". That page was locked in on 30 October, so it now says "when that page next changes".
- **Status wording.** The page header, notes card, frame names and part names no longer say "proposal" or "proposed".

## 6. Not decided and not drawn

- **Building the page.** No build order is decided. `src/assistant` now has turns, evidence and budget reservations under the US$30 ceiling, which a run could reuse. Nothing stores checks, runs or My Work suggestions yet, and nothing runs on a schedule.
- **Reservation unit.** D5 draws one reservation for a run, at the AI1 turn ceiling. The built code reserves for each model call. A build follows the code and shows the run's total; the figures in the frames are synthetic.
- **Scheduling.** PPO-CONV-REMINDERS-PROP stays Dean's separate decision for reminders. Q4 sets the direction for checks only; a build of it needs its own go-ahead.
- **Story and rule differences, to correct when those pages next change:**
  - Quote view tracking Q7 sends the follow-up suggestion to the quotation owner, while Quotation page `2232:2500` sends it to the deal owner. Q5 settles it for checks; the two records still differ from each other.
  - The Quotation page's alternative suggestion uses a Wed 21 Oct story. This page keeps Tue 13 Oct, as the brief asked, so that suggestion isn't shown here.
- **Not drawn:** the approver's screen (Jordan Kim sees the request in My Work under Reviews & handovers), the Settings and Changes tabs of a check, an Assistant settings summary of all checks for administrators, email or push delivery, playbooks (N5), and 200% zoom.
- **Known limits:** the preview shows one of its four agreements in full, because the other three would need end dates that Service agreements doesn't state. The phone card's buttons are the shared Button resized to 44 px; the target needs checking when the page is built.
- **Data in the frames** is synthetic and sets no operating rule.

## 7. Audit

Before presenting it, on 24 October 2026, Claude screenshotted the main frames inside Figma and fixed what they showed: the grid made full-bleed, collapsed form fields, a clipped Dismiss link, and a tablet top bar that hid the account. A scan found no overlaps, nothing outside its section, and no link to another page.

## 8. Verification

- The nineteen captures were exported from copies made on the "Captures (icon-free)" page at y = 1,400,000. Prototype links were removed and every Font Awesome instance was swapped for `Icon/placeholder`; a scan of each copy found none left.
- **The copies were then deleted.** Figma warned on 1 November that the file is running out of memory, and the Captures page holds 46% of its layers. The PNGs in Git are the evidence; a copy can be remade from the page. This departs from earlier lock-ins, which kept their copies.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/my-work/recurring-checks-design-r01/README.md). Claude viewed images 01, 10 and 16 after export; the others were viewed as their source frames inside Figma.
- Claude did not play the flows in Present mode.
- Dean saved the named Figma version himself on 1 November 2026: "I have saved the named version as Recurring checks — accepted". Claude did not open version history to confirm it. Claude updated the page header and File index row after that save, so those two lines read differently in the saved version, which says the version was still to be saved.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
