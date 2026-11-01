---
document_id: PPO-AD02-SETTINGS-AMENDMENTS-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Settings amendments AD-02 design — owner decision

The [Settings hub design](settings-hub-figma-design.md), accepted on 22 October 2026, left frames to be drawn. Its Q6 reads: "The History and Affected work tabs, the field readiness record and the phone propose and publish sheets are drawn after this page as AD-02 amendments." Its Q3 says field readiness and working hours move onto the same propose, review and publish path one family at a time, and until then "are read-only and say "Seed only, no editor"".

On 31 October 2026 Dean asked for those frames: "Your task is to design and build the AD-02 amendments that my accepted Settings design still owes, as a proposal for my review. Draw the frames; do not stop at a written brief." Claude drew them on a new Figma page, without changing any accepted frame. It covers:
- the History tab on a policy record, comparison between two versions and links to Audit history;
- the Affected work tab, and one booking handed to Changes and follow-up;
- the field readiness policy record;
- phone 390 and 320 frames of the policy record, the History and Affected work lists, comparison, the Propose change, Review and Publish sheets, and the "Review out of date" refusal;
- states for no history beyond version 1, no affected work, still being calculated, a seed-only family and a reviewer who is the proposer.

Claude drew the page from these sources:
- the [Settings hub design](settings-hub-figma-design.md) and the [AD-02 register page](../design/development/pages/scope-ad-02.md);
- the decisions [scheduling-policy publication](scheduling-policy-publication.md), [scheduling-policy impact review](scheduling-policy-impact-review.md), [field readiness gate](field-readiness-gate-proposal.md), [field readiness over CS-06](field-readiness-native.md), [Changes and follow-up design](changes-follow-up-figma-design.md) and [phone header amendment](phone-header-amendment.md);
- the seeds `db/seed-p04.sql`, `db/seed-field-readiness.sql` and `db/seed-site-readiness.sql`;
- read-only copies of accepted Settings and Changes and follow-up frames.

Claude asked: "Do you accept the AD-02 amendments with D1–D9 and the recommended Q1–Q7?" Dean replied: "Accept all". That adopts D1–D9 and the recommended answers to Q1–Q7.

Scope:
- `scope:AD-02` "Business configuration and policy publication", at the proposed route `/admin/policies/[id]`. No new scope is added.
- No parent requirement ID is added or renamed. The scheduling-policy traceability (SVC-04/05, DAT-06, NFR-08, D-015/D-020, TR-03/08, API-R04/API-C26, EVT-12, PT-08/09/28, AT-35) is unchanged.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, operational policy value or deployment, and it changes no hosted authority. Every policy value shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Draw the amendments Q6 owed | User decision, 31 October 2026 | Dean's request, quoted above |
| Departures D1–D9 | Accepted as recommended, 1 November 2026 | "Accept all". Section 4 |
| Q1 Next family | Resolved as recommended | Field readiness moves to the editor after scheduling. It blocks dispatch, its rules are the ones Service will tune under D-015, and a change there most needs an affected-work review. Working hours follows, once its seeded 07:00–18:00 calendars and the technician rule of 08:00–17:00 standard are settled |
| Q2 Field readiness version numbers | Resolved as recommended | Version 2 in force, version 1 viewable and version 3 proposed. Dean's brief asked for version 1 read-only with a proposed version 2, but the accepted register row and `db/seed-field-readiness.sql` already have version 2 in force since Fri 16 Oct. Section 4, D6 |
| Q3 Field readiness duties | Resolved as recommended | Separate review and publish duties rather than reusing `schedule.policy.*`, decided when the family is built. A new capability carries the AD-01 access-review work |
| Q4 Owner of field readiness affected work | Resolved as recommended | The work order's service owner, as the gate already does for its tasks |
| Q5 Version 3 on main | Resolved as recommended | Main has seeded `SYN-PPO-P04` version 3 since 24 October (PR #690), after this story's date. The frames keep the 22 October story, and a built page shows main's version 3 as seeded |
| Q6 Audit history link | Resolved as recommended | AD-07's record route needs a readable reference, but AD-02 Q5 gives policies none. The link opens Audit history filtered by policy name and version. AD-07 is still a proposal, so the link is by name only |
| Q7 Review tasks before publication | Resolved as recommended | None. PL-04 shows the exact visit read-only and raises nothing until publication |
| Accept the design | User decision, 1 November 2026 | Quoted above |
| Named Figma version | Not saved | "Settings amendments — accepted" waits for Dean's yes |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Settings amendments · AD-02" `2997:1271`, under "— Administration —", directly after Settings · AD-02 `2049:11645`. The page header `2997:1272` holds the conformance declaration; the notes card `3006:8917` is in Flows and notes. File index: the row "Row / Settings amendments · AD-02" `3093:599307`, after Settings · AD-02 |
| Desktop 1440 | History `2998:1156`; compare version 1 and version 2, full length `3001:800`; Affected work `3001:1554`; SYN-APT-000061 handed to Changes and follow-up `3002:8653`; field readiness version 2 in force `3002:3573`; version 1 `3002:4344`; proposed version 3 `3002:5025` |
| Phone 390 | Policy record `3005:6720`; History `3005:6880`; Affected work `3005:6957`; compare `3006:8795`; Propose change `3004:9326`; Review `3004:9469`; Publish `3004:9548`; publish refused `3004:9635` |
| Phone 320 | Policy record `3005:7063`; History `3005:7221`; Affected work `3005:7298`; compare `3006:8856`; Propose change `3004:9681`; Review `3004:9824`; Publish `3004:9903`; publish refused `3004:9990` |
| States | Desktop 1440: no history beyond version 1 `3006:6943`; no affected work `3006:7591`; still being calculated `3006:8183`. Phone 390: no history beyond version 1 `3005:7401`; no affected work `3005:7449`; still being calculated `3005:7474`; seed-only family `3005:7502`; reviewer is the proposer, refused `3005:7558` |
| Page parts | Section "Page components (proposed)": Policy history row `2998:1131` and Affected work row `3001:1529`. They stay on the page until a build is requested |
| Prototype | Flows "AD-02 amendments — desktop" (from History) and "AD-02 amendments — phone" (from the phone record). Links cover the tabs, compare and back, Hand-off to PL-04 and back, field readiness version 2 to version 1, proposed version 3 and no affected work, and on phone the More sheet, Publish to refused, Save proposal to Review and each close control |
| Story | Synthetic, as at Thu 22 Oct 2026, 10:00 Brisbane time, signed in as Dean Fiedler, who holds `schedule.policy.publish`; Jordan Kim holds `schedule.policy.review`. SYN P05 conservative planning policy version 1 (maximum visit 480 minutes, from Sat 5 Sep 2026) is in force. Version 2 (420 minutes from Mon 2 Nov 2026, 00:00) was saved by Dean on Tue 20 Oct, 16:05 and reviewed by Jordan on Wed 21 Oct, 15:10: 14 bookings checked, 11 fit, 3 need review (SYN-APT-000061, SYN-APT-000064, SYN-APT-000067), 6 left out, Sam Patel as impact owner. In the refusal frames Dean saved revision 2 at 10:02 and the frames read 10:03. The Review sheet is Jordan's view, read Wed 21 Oct, 15:05. All of this is kept from the accepted Settings frames |
| Retained captures | [Settings amendments design r01](../reference/ui/settings/settings-amendments-design-r01/README.md): thirteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AD-02` at the proposed route `/admin/policies/[id]`. No new scope or route. Parent requirement IDs unchanged. Capabilities unchanged; no field readiness duty is added |
| Page type (r20) | Record detail with a Review / comparison view for the tabs. Form for the phone sheets |
| Reused components | Rail with More selected, the linked `Shell / Top bar` 35:138, Record / Header, Record / Readiness bar, Record / Field, Record / View tab, Grid / Header cell, Grid / Checkbox cell, Grid / Row actions cell, Grid / Group band and Grid / List row (phone) from the file audit, Controls / Form field, Tag, Button, Term list header and Term row, and Shell / Phone header · compact. New, on this page: Policy history row and Affected work row |
| Incoming handovers | The policy record on Settings · AD-02, its record menu (Open history, View affected work) and the phone record's More sheet |
| Outgoing handovers | Each affected booking to Changes and follow-up (PL-04); each version to Audit history (AD-07) by name. Settings never reschedules, flags or changes work, and never changes a seed-only family |
| Source authority | The decisions and seeds listed above; the AD-02 design register page |
| Proposed departures | D1–D9 in section 4, accepted |
| Status | Owner-accepted design, 1 November 2026 |
| Decision record | This file |
| Named version | Not saved; "Settings amendments — accepted" waits for Dean's yes |

## 4. What the design shows

### History and comparison (D1, D2)

- **History:** a grid on the policy record with one row for each version, newest first: version and status, effective from, summary, proposed by, reviewed by and published by, each person's cell carrying the time. Version 1 says "No proposal, installed by seed" rather than inventing people.
- **Audit history:** each row's last column and a Recorded events list open Audit history (AD-07), filtered to this policy and version (Q6). The tab only reads it.
- **Comparison:** tick any two versions or proposal revisions. The accepted term table shows each term with Changed or Same in words, then who and when. A comparison reads two saved records and changes neither.

### Affected work (D3, D4)

- **Grid:** bands for Will need review (3), Fit version 2 (11) and Left out (6), spanning the checkbox and settings columns in each group's colour. Every row has its booking, visit, how far it exceeds 420 minutes, owner, state and a hand-off to PL-04.
- **State:** before publication it reads "No review yet · Raised on publication", because publishing is what raises the review (Q7).
- **Handover:** a copy of the accepted exact-appointment frame, with the banner "Opened from Business policies: SYN-APT-000061". It adds no command. Dean's publish duty gives no booking authority, so no move control shows; Sam Patel decides in the appointment controls (SV-04).
- **Never:** Settings never moves a booking. Each booking, its pinned version and any issued job pack stay exactly as they are.

### Field readiness record (D5, D6)

- **Read-only:** no Propose or Publish button, "Seed only, no editor" in the state bar and callout, and "Nobody yet" for each duty.
- **Version 2 in force:** the nine rules with the stage each blocks at and its exceptions, then how the gate uses them. Parts stays derived from Supply Chain and is never a recorded pass.
- **Version 1:** the eight rules, reached from "View version 1". Scopes that bound it keep it.
- **Proposed version 3:** marked "Proposed, not saved". It adds customer site readiness, the confirmation window and the job pack issue time, with the path once the family has an editor marked "Not available today". Nobody can save, review or publish it.

### Phone (D7, D8)

- **Sheets:** Propose change, Review and Publish are full-height sheets with the accepted dialog wording. Inputs use 16 px text and buttons are 44 px high.
- **Record:** a copy of the accepted phone record; its More sheet gains View affected work.
- **Review:** Jordan Kim's view, the one frame not signed in as Dean, because Dean holds no review duty. It says so in the frame.
- **Refusals:** "Review out of date" uses the accepted refusal wording, names the failed check and offers no Publish button. A proposer's review is refused with "You saved this proposal", which is the build prerequisite recorded by Settings Q1.

### Departures, accepted

| ID | Departure | Basis or earlier pattern |
|---|---|---|
| D1 | History tab as a grid; tick any two versions to compare; each person's cell carries the time | Settings Q6 and D4; tab count History 2 |
| D2 | Comparison inside the tab, reusing the term table, plus who and when | Settings D5 |
| D3 | Affected work as a grouped grid, with owner, state and hand-off on every row | The impact review and publication decisions |
| D4 | PL-04 handover as a copy of the exact-appointment frame; no new command; no move control for a publisher | The PL-04 register and publication decision |
| D5 | Field readiness as a read-only record with no change action | Settings Q3 and Q4 |
| D6 | Field readiness version 2 in force, version 1 viewable and version 3 proposed, instead of the brief's version 1 and proposed version 2 | The accepted register row and the seeds. Q2 |
| D7 | Phone Propose, Review and Publish as full-height sheets; More gains View affected work; compare and Affected work lists added | Settings D8 and Q6 |
| D8 | The Review sheet is Jordan Kim's view, not Dean's | Dean holds no review duty |
| D9 | Amendments drawn on a separate page. Settings · AD-02 is unchanged; new frames use the linked `Shell / Top bar` 35:138 instead of the older detached bar | Dean's brief |

## 5. Not decided and not drawn

- **Building the page.** This record starts no build. Draft PR #802 is building the accepted Settings hub and Business policies separately; it does not implement these frames unless it is extended to.
- **Prerequisites for a build:**
  - a read of every version of a policy with its proposer, reviewer, publisher and times;
  - a comparison read of any two versions or revisions;
  - the Affected work read from the frozen review, and its owned reviews after publication;
  - refusing a review by the proposer (Settings Q1);
  - an Audit history filter by policy name and version (Q6);
  - read-only field readiness records, with duties and an editor when that family moves (Q1, Q3).
- **Not drawn:**
  - the working-hours record beyond its history state;
  - the Waiting to publish view;
  - publish success and receipt recovery;
  - tablet;
  - 200% zoom, which the spec reviews separately.
- **Data in the frames:** the policies, terms, proposals, reviews and bookings are synthetic. They are not adopted operating rules and grant no authority.

## 6. Audit and polish

Before presenting the page Claude checked every frame: section bounds and overlaps, truncated text measured against its rendered width, fonts, text left from copied frames, and links leading off the page.

- **Corrected before presenting:** a hidden second column on term rows, a truncated PL-04 row and two truncated 320 inputs, breadcrumb truncation on the field readiness frames, misplaced labels and the position of the phone More sheet.
- **Corrected after acceptance, in layout only:** the cells of the two page parts now hold their column width, so grid rows line up with the header. No wording or decision changed.
- **Left as designed:** the position text in the 320 header truncates, as on the accepted frame. On the 320 Propose sheet the Reason text runs past its text area, which scrolls.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma. The desktop and States sections were reviewed section by section. The phone frames were reviewed at overview scale, and Affected work 390, Publish 390 and Review 390 more closely.
- The hidden phone More sheets were positioned by script and not opened afterwards.
- The captures were temporary copies on a page named "Capture · in progress", which was deleted after export, because "PPO - Design" is short of memory. This follows the capture rule in the design-to-build standard proposed in PR #818. The copies had every Font Awesome icon swapped for `Icon/placeholder` and all prototype links removed. A scan of the copies found no remaining Font Awesome instance and no link. Hashes are in the [captures README](../reference/ui/settings/settings-amendments-design-r01/README.md).
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
