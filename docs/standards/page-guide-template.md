---
document_id: PPO-HELP-TPL
title: PPO Page Guide Authoring Template
revision: r01
date: 2026-09-13
status: Template prepared for review
owner: Dean Fiedler - personal prototype owner
source_commit: 1cc882e53020bdfb22f7e9192365d90b1d8282ab
---

# PPO Page Guide Authoring Template

Use with [Contextual Help Design](../blueprints/contextual-help-design.md). Copy the section structure into a stable working file; replace placeholders, remove author instructions from the user article, and retain the author evidence separately. No section may imply functionality from a mockup is working in the application.

## Author metadata — do not render as the business article

| Metadata | Required author entry |
|---|---|
| `document_id`, `guide_key` | Registered document ID and stable task/page key; do not use a page title as the key. |
| `title`, `revision`, `status` | User-facing title, rNN revision, Draft/InReview/Published/Superseded/Withdrawn. |
| `route_patterns`, `entry_sections` | Explicit routes and stable section anchors; exact routes before dynamic patterns. |
| `audience` | Permitted audience and any restricted section rules. Public source must remain publishable. |
| `owner_role`, `reviewer`, `reviewed_at` | Actual accountability and evidence; use “Not yet nominated/reviewed” when absent. |
| `review_due_at` | Actual agreed due date, or null; never invent an approval-expiry rule. |
| `source_commit`, `workflow_basis` | Exact application source and relevant contract/capability baseline. |
| `runtime_evidence` | Build/environment/date/scenarios actually executed, or explicitly Not run. |
| `resource_ids` | Verified SOP/template/reference identities; none is acceptable. |
| `supersedes`, `section_aliases` | Prior issued revision and retired-anchor mapping when applicable. |
| `change_summary` | What users need to relearn and why. |

The rendered article begins below the `USER GUIDE START` marker and ends before `USER GUIDE END`. Markers support this design package's review renderer; the application renderer remains to be implemented.

<!-- USER GUIDE START -->

# [Page title] — Page guide

**Guide status:** [Draft for review / Published] · **Last reviewed:** [date or not yet reviewed] · **Applies to:** [plain-language workflow/version description].

## Purpose and outcome

[When to use this page, what it helps achieve, and the observable condition showing this task is finished.]

## Before you start

[Required role/access, existing records, information, prerequisites and known boundaries. State what to do when information is missing.]

## Quick start

1. [Open the exact page/control.]
2. [Supply or review the minimum necessary information.]
3. [Perform the named action.]
4. [Check confirmation and identify the next owner/action.]

## Understand the page

| Control or area | Purpose | What happens when you use it |
|---|---|---|
| [Exact visible label] | [User objective] | [Result; navigation/save/submit distinction] |

## Information you need

| Information | Required when | How to enter it | Unknown or exception handling |
|---|---|---|---|
| [Field label] | [At creation / at submission / conditional / optional] | [Format, units, allowed choice] | [Permitted next step or explicit block] |

## Complete the main tasks

### [Task name]

**Before:** [precondition].

1. [Exact control and action.]
2. [Information, reasoning/evidence and action.]
3. [What confirmation to check.]

**Finished when:** [observable saved/submitted/accepted outcome]. **Next:** [actor/task].

[Repeat for meaningful tasks and alternatives. Link to related guides when the user leaves this page.]

## Statuses and warnings

| What you see | What it means | What to do |
|---|---|---|
| [Exact status or message] | [Underlying business meaning] | [Permitted next action; do not invent authority] |

## Responsibilities and handover

[Distinguish record owner, activity owner, recipient and approver. Define when responsibility transfers, what is sent and what remains with the sender. If the app has no handover, state that clearly.]

## Worked examples

### [Normal synthetic case]

**Starting point:** [fictional record/context]. **Actions:** [concise sequence]. **Expected result:** [saved information and accountable next step].

### [Incomplete information, changed brief or failed-save case]

**Starting point:** [unknown/change/failure]. **Actions:** [safe response]. **Expected result:** [what is retained, blocked or awaiting confirmation].

## Troubleshooting

| Symptom | Check and recovery | If unresolved |
|---|---|---|
| [Recognisable issue] | [Safe ordered response] | [Configured support role/channel or explicit absence] |

## Related SOPs and resources

[List verified resources with title/reference, applicable revision/status, source and link behaviour. If none exists, say “No approved SOP linked yet”. Never manufacture an operational URL.]

## Guide review and feedback

[Owner role, review status and actual feedback mechanism. Do not advertise a working feedback button if none exists. Opening help is not training completion or SOP acknowledgement.]

<!-- USER GUIDE END -->

## Author evidence and review checklist

Map each material instruction to current UI/domain validation or an approved process source. Record source path and baseline, what was checked and limitations. Use primary documentation for technical/accessibility decisions.

- Exact controls, statuses, permissions and conditional fields checked against current code and intended running build.
- Quick start and normal/exception tasks executed, or marked Not run with reason.
- SOP identity, applicability, status and access reviewed; no restricted content in public files.
- Links/section anchors, mobile, keyboard, reflow and save-state preservation checked.
- No mixed old/new workflow, approval invented from a draft, or false saved/sent/accepted claim.
- Owner/reviewer and maintenance trigger recorded; outcome of feedback reflected in revision history.

Review completion is evidence for this guide; it does not approve an underlying SOP or close a parent application acceptance case.
