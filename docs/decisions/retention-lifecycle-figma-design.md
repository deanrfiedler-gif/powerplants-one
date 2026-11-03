---
document_id: PPO-AD08-RETENTION-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; application changes, operating rules and legal requirements separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Retention and information lifecycle design — owner decision

On 31 October 2026 Dean asked Claude "to design and build the "Retention and information lifecycle (AD-08)" UI page in Figma as a proposal for my review". Asked on 1 November 2026 "Do you accept AD-08 with the recommended answers to Q1–Q10?", Dean answered: "Accept, recommendations". That answer adopts decisions D1–D14 and the recommended answers to Q1–Q10.

Claude drew the page from these sources:
- the [AD-08 design contract](../design/development/pages/scope-ad-08.md) and parent requirements NFR-10 and DOC-06 in [BP-01](../blueprints/BP-01-master-blueprint.md);
- [quote-view-tracking.md](quote-view-tracking.md) section 4.7, [ADR-0059](ADR-0059-email-sending-from-ppo.md) sections 5 and 7, [emails-figma-design.md](emails-figma-design.md) A1-Q2, [the assistant specification](../blueprints/ppo-assistant-specification.md) section 7 and [calling-and-caller-id-design.md](calling-and-caller-id-design.md) Q5;
- [settings-hub-figma-design.md](settings-hub-figma-design.md) for the place in Settings;
- the Figma pages Settings AD-02, Audit history AD-07, People CS-02, Organisations CS-01, Customer accounts FN-02, Warranty cases, Assistant settings AI-06, Quotation page ES-05, Calling and Document library. None was edited.

**Accepting AD-08 accepts none of those pages.** Where one of them is still a proposal, it stays one. That includes Audit history AD-07, whose export manifest and 90-day period this design follows.

Scope: `scope:AD-08` "Retention and information lifecycle", route `/admin/retention`, not built. Parent requirements NFR-10 and DOC-06 are unchanged, none is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, migration, capability, grant, adapter, endpoint, deletion, export, business transaction, customer communication or deployment. Dean's instruction for this work was "Do not build the app page". **This record gives no legal view.** Every legal basis reads "To be confirmed". D-012, D-020, D-021, D-024 and all legal requirements stay open, and Q1–Q10 are design direction for synthetic rules, not verified operating rules.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page as a proposal | User decision, 31 October 2026 | Dean's request quoted above |
| Retention facts shown, each with its source | Existing decisions, listed in Dean's request | Section 3 |
| Everything else reads "Policy not set"; legal basis reads "To be confirmed" | User decision, 31 October 2026 | Dean's request. Audit export files are the one departure (Q6) |
| PPO deletes nothing from MYOB or SharePoint | User decision, 31 October 2026 | Dean's request |
| D1–D14 | Accepted as recommended, 1 November 2026 | "Accept, recommendations". Section 4 |
| Q1 Who is the privacy contact | Resolved as recommended; design direction | One named administrator with one named deputy, named in the app and not in this public repository. Taylor Quinn only stands in for the story. No real person has been named |
| Q2 Which periods need advice first | Resolved as recommended; order only, no legal view | The accountant first on anything linked to invoices and MYOB copies; then a legal adviser on personal information and request handling; then field photos; then backups. No advice has been sought or received |
| Q3 Field photos for the life of the equipment | Resolved as recommended; design direction | Not all of them. Photos attached to equipment, commissioning, warranty or an issued report follow that record; others take a fixed period after advice. Field photos stay "Policy not set" until a period is approved |
| Q4 Who may place and release holds | Resolved as recommended; design direction | The privacy contact or the Finance lead may place one, and anyone may ask them to. Release needs the other of the two, so one person cannot do both. A review date is required, and an overdue review shows on this page |
| Q5 Assistant periods, Adopted or Proposed | Resolved as recommended | Adopted: chat in page memory, unsubmitted drafts expiring after 15 minutes and removed within 24 hours, and unresolved intents never purged automatically. [Assistant specification](../blueprints/ppo-assistant-specification.md) section 7 is updated in this change. The rest of that paragraph stays as it was |
| Q6 Audit export files shown as Proposed, 90 days | Resolved as recommended | Yes. AD-07 proposes it, and it isn't in force until a second person approves it. It is a departure from "everything else is Policy not set" |
| Q7 A person's name in old audit events after anonymising | Recommended answer adopted as direction; stays open | Leave the events unchanged, because they are append-only, and mask the name on screen for anyone without audit access. The answer itself says it needs advice before any build |
| Q8 Backups and anonymised records | Resolved as recommended | Ask the IT contractor for the actual backup expiry before any period is adopted. Until then the row reads "Policy not set", and the request shows that row as open |
| Q9 Where D-024 touches this page | Resolved as recommended | Only the wording of a reply to the requester. No reply letter is drawn, and D-024 stays open |
| Q10 Export file kept 90 days on a deletion request | Resolved as recommended; frame changed | No. The file is removed once the handover is recorded, and the manifest and hash stay. The export manifest frame was changed to show this before capture (section 5) |
| Accept the design | User decision, 1 November 2026 | Quoted above |
| Named Figma version | Saved by Dean, 1 November 2026 | Section 7 |
| Building `/admin/retention` | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Retention & lifecycle · AD-08" `3017:123`, under Administration after Migration & cutover · AD-06. The page header `3017:124` holds the conformance declaration; the notes card `3034:5728` is in Flows and notes. File index row `3100:5395` |
| Desktop 1440 | Policies register `3019:123`; Policy record, quote view events `3021:1106`; Holds `3023:1376`; Request record with per-system outcomes `3023:2761`; Export manifest `3025:2310`; Run history `3025:3692` |
| Tablet 1024 | Policies register `3028:2572` |
| Phone 390 | Policies list `3028:3587`; Policy summary `3030:3497`; Request record `3030:3902` |
| Phone 320 | Policies list `3028:4050`; Policy summary `3030:3700`; Request record `3030:4095` |
| States | S1 Loading `3032:5937`; S2 No policies `3032:3595`; S3 Could not load `3032:6252`; S4 No permission `3032:6547`; S5 Policy not set `3033:4254`; S6 Hold blocks deletion `3033:5521`; S7 Awaiting verification `3033:6715`; S8 Partial outcome, requests register `3032:4778`; S9 Legal basis to be confirmed `3033:7942` |
| Page parts | No component was added. The record banner (in S6) and the per-system outcome rows are built from Grid / Cell and frames, and stay on this page until a build needs them |
| Reused components | Shell / Top bar `35:138` (linked), compact phone header `1530:110`, Grid / Header cell `74:13`, Grid / Cell `74:40`, Grid / Checkbox cell `74:48`, Grid / Row actions cell `74:50`, Grid / Group band (proposed) `2651:7352`, Grid / List row (phone, proposed) `2651:7385`, Tag `3:13`, Button `3:41`, Toolbar search `130:1232`, Tab bar `107:149` |
| Prototype | Flows "AD-08 — desktop" (from the Policies register) and "AD-08 — phone" (from the phone 390 Policies list) |
| Retained captures | [Retention design r01](../reference/ui/retention-lifecycle-design-r01/README.md): 22 icon-free PNGs with hashes. The capture copies were temporary and were deleted from Figma after export, following the capture rule proposed in the design-to-build standard (PR #818) |

## 3. Retention facts shown

| Information type | Shown as | Source |
|---|---|---|
| Quote view events | Adopted: 12 months after the event, deleted, logged as a count | quote-view-tracking.md 4.7 |
| Email open tracking events | Adopted: 12 months after the event, deleted, logged as a count | ADR-0059 sections 5 and 7; emails-figma-design.md A1-Q2 |
| Assistant side-panel chat | Adopted: page memory only | Assistant specification section 7, with Q5 |
| Assistant drafts | Adopted: expire after 15 minutes, removed within 24 hours | Assistant specification section 7, with Q5 |
| Assistant unresolved intents | Adopted: never purged automatically | Assistant specification section 7, with Q5 |
| Skipped call events | Adopted: deleted after 30 days | calling-and-caller-id-design.md Q5 |
| Audit events | Adopted: append-only | AD-07 |
| Audit export files | Proposed: 90 days, not in force. Removed at handover when the export serves a deletion request (Q10) | AD-07 proposal |
| Field photos; business document references; correspondence send receipts; activities and logged call links; people and organisation records; device caches and offline copies | Policy not set | None yet, or D-012, D-020 and D-021 open |

The lifecycle runs, holds, requests, names and counts on the page are a fictional story as at Tue 13 Oct 2026, 09:00 AEST.

## 4. D1–D14

| ID | Decision | Basis |
|---|---|---|
| D1 | Retention opens from the Settings side menu, with four child items: Policies, Holds, Requests, Run history | Settings hub D1 and D2; AD-07 and AD-06 child-item pattern. The child items depart from the hub |
| D2 | The policies register has eight columns in three status bands. Status always has words. Legal basis reads "To be confirmed" on every row | Dean's request; Pipedrive-style grid and the band rule |
| D3 | Everything without a recorded decision reads "Policy not set", and PPO deletes nothing automatically for those types | Dean's request; NFR-10 applies approved policies. No period is invented |
| D4 | Policy changes, hold releases and exports need a second person. The proposer cannot approve, and every step writes an audit event | Dean's request; AD-07 export approval |
| D5 | One lifecycle run a day at 02:00 AEST, in PPO only, with deletions logged as counts, never content | Counts from existing decisions. The run time is a design choice, not a decided rule |
| D6 | A hold beats any policy and stops deletion in PPO. Held records show "On hold: deletion suspended". Reason, scope, owner and review date are required | Dean's request. Other pages aren't edited; each takes the banner when next changed |
| D7 | A request goes recorded, verified, decided, then outcome per system. The decision stays locked until identity is verified, and a request stays Partial while any system is open | Dean's request; `scope:AD-08` tasks |
| D8 | PPO anonymises its own rows rather than removing them: name, phone and email go, record IDs and audit events stay | Dean's story; AD-07 append-only. The exact fields are design direction (Q7) |
| D9 | PPO deletes nothing from MYOB or SharePoint. It shows the owner, the wording "Not deleted: MYOB is the book of record; Finance to advise", and the actual outcome | Dean's request; MYOB is the intended ERP authority and SharePoint owns business documents; D-012 stays open |
| D10 | The export manifest follows AD-07, adds what is not in the export, and records handover as a person's action. PPO does not send the file | AD-07 manifest `2105:696276` |
| D11 | Audit export files show as Proposed, 90 days | AD-07 (Q6) |
| D12 | Assistant chat, drafts and unresolved intents show as Adopted | Dean's request (Q5) |
| D13 | Phones use the compact header and list rows. Records run full length in flush sections with a 48 px main action. A phone policy list is added so the flow has a start | Phone header amendment P1–P9. The list goes beyond the frames requested |
| D14 | New page parts stay on this page; nothing was added to Components | Dean's request. Components was checked first, and Group band is reused |

S8 also serves as the requests register, and S7 adds a second fictional requester, Casey Doyle. Both were stated to Dean before acceptance. Run history shows five of twelve runs.

## 5. Changes after acceptance, before capture

These apply accepted answers to the frames. Nothing else changed.
- **Q10, Export manifest `3025:2310`:** the status reads "File removed after handover". The "Kept until" row became "File removal". Download CSV was removed, leaving Download manifest PDF. The audit events gained the removal, making five.
- **Q4, Holds `3023:1376`:** the Release row states who may place and release a hold.
- **Q3, State S5 `3033:4254`:** the notice states the direction, and field photos stay "Policy not set".
- The page header and notes card now read accepted. The notes card's text of Q1–Q10 is unchanged.

A separate Claude session on AD-08 audited the page before Dean accepted it and reported these fixes on the original frames: the phone 320 policies list wraps the retention rule rather than truncating it; the Run history filter reads "Last 5 days"; the second open request SYN-PIR-000002 is consistent everywhere (Requests count 2 in the desktop side menus, "1 of 2 open" on the phone request frames, both requests in the S8 register with an Awaiting verification group, and Casey Doyle in the notes story); and the Flows and notes section regained its padding. The captures include them. That session reports it saved no named version, and it stood down from a duplicate lock-in and deleted its capture copies and unpushed branch.

## 6. Not decided, not drawn

- Building `/admin/retention`, including any capability, migration, scheduled run or anonymising command.
- The privacy contact and deputy; the owners of every "Not assigned" policy; every period that reads "Policy not set"; every legal basis.
- The side forms for proposing a policy, placing a hold and recording an outcome; the phone More sheet (follows rule P3); the hold banner on other pages; the privacy notice; replies to requesters.

## 7. Named version and verification

Dean saved the named Figma version on 1 November 2026, in his words: "I have saved the named version as - Retention & lifecycle — accepted". Claude did not inspect the version history.

Checked:
- Each frame by screenshot inside Figma. A script found no overlaps, nothing outside its section, no off-page links and no stray nodes before the post-acceptance changes, and the layout pass was re-run after them.
- Every visible Font Awesome instance in the capture copies was swapped to `Icon/placeholder`, with none left. This session briefly set the side-menu Requests count back to 1 before seeing that report, then restored 2 and exported the twelve desktop frames again. The capture copies and their temporary pages were then deleted.

Not checked:
- The prototype flows weren't played in Figma Present mode. Devices, keyboard and screen reader weren't checked.
