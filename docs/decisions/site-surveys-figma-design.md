---
document_id: PPO-CS08-SITE-SURVEYS-FIGMA-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: fe0dd1c33e99ba85879cdd3125447851205b2bc3
versioning: git
---

# Site surveys design — owner decision

On 18 October 2026 Dean asked which UI page to design next in Figma. Claude recommended the site survey and as-found brief, scope CS-08. It is the second step of the build sequence's synthetic job walk, and the first step of that walk with no Figma design: the customer, contact and site records before it were all accepted on 18 October. Dean agreed: "Yes, draw the Site survey and as-found brief CS-08 page in Figma next, following the Sites, People and Organisations pattern." The page covers two routes:
- the register at `/surveys` (More › Shared records › Site surveys & as-found);
- the survey record at `/surveys/[id]`, with its review and handover forms and New survey.

Claude drew the page from these sources:
- the CS-08 design register pages ([scope-cs-08](../design/development/pages/scope-cs-08.md), [route-surveys](../design/development/pages/route-surveys.md), [route-surveys-id](../design/development/pages/route-surveys-id.md));
- the built survey workspace: the register and record views in `src/components/cs-workspace.tsx`; the survey content, the five observation kinds and the Draft, Submitted, Returned and Reviewed states in `src/shared/cs/model.ts`; the submit, return, review, handover and successor-draft commands in `src/shared/cs/service.ts`; and the photo rules in `src/shared/cs/photos.ts`;
- the historical [Site Survey & As-Found HTML r01](site-survey-workspace-design.md), for the scope, evidence and handover rules;
- copies of three accepted designs: the Organisations CS-01 page (cloned whole), the Access & readiness CS-06 review card, and the Sites, Facilities and People stories.

Before deciding, Dean asked for an audit: "Give the Site surveys CS-08 page an audit and polish before I decide." He then accepted the design: "I accept the Site surveys CS-08 design with your recommendations, including D1–D7 and Q1–Q4." That adopts D1–D7 and the recommended answers to Q1–Q4. The named Figma version waits for Dean's explicit yes (section 7).

Scope:
- `scope:CS-08` "Site survey and as-found brief", with `route:/surveys` and `route:/surveys/[id]`.
- CS-08 is page-register coverage under CRM-01, CRM-04, CRM-06, SVC-06, DOC-01, DOC-02 and DAT-01–DAT-03, as the r01 HTML record traces. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, document-storage connection or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design CS-08 next, on the Sites, People and Organisations pattern | User decision, 18 October 2026 | Dean's request quoted above |
| Audit and polish before acceptance | User decision, 19 October 2026 | Quoted above. Section 6 |
| Departures D1–D7 | Accepted as recommended, 19 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Survey reference | Resolved as recommended | Surveys take a reference `SYN-PPO-SRV-000nnn`, like every other record. The accepted Access & readiness design shows "SYN-SRV-000031"; that text is corrected at its next amendment, and this decision does not change it |
| Q2 Visit and contact | Resolved as recommended | Planned visit (date and time) and one contact on site, chosen from the site's people, become recorded survey fields. They are not in the built survey model; adding them is a build prerequisite (section 5) |
| Q3 Who may review | Resolved as recommended | The survey owner and the person who recorded the visit cannot review it, as on CS-06 evidence review. Review with open follow-ups is allowed, and records them as acknowledged known gaps |
| Q4 Changed sources | Resolved as recommended | When an area or equipment record changes after submission ("recheck required"), the reviewer is shown the change and may review as submitted or return the survey; review is not blocked |
| Accept the design | User decision, 19 October 2026 | Quoted above |
| Named Figma version | Waiting for Dean's explicit yes | Proposed title "Site surveys — accepted". Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Site surveys · CS-08" `1464:2918`, under "— Shared records —", after Access & readiness · CS-06 `1400:346423` and before Document library. The page header `1464:2919` holds the conformance declaration; the notes card `1464:4164` is in Flows and notes. File index row "Row / Site surveys · CS-08" `1484:190088`, after the Access & readiness row |
| Desktop 1440 | Register, All surveys `1464:2955`; Bay 3–4 irrigation, Survey scope, submitted for review, full length (1440 × 1234) `1464:3055`; Observations, full length (1440 × 1336) `1468:3554`; Photos & evidence with a caption corrected `1470:2833`; Missing information & follow-up `1471:2847`; Review & handover with the review submission form `1472:3102`; reviewed, record handover to Estimating `1473:3371`; New survey at SYN Glasshouse 4 (1440 × 1100) `1464:3366` |
| Tablet 1024 | Register with the side menu collapsed `1464:3695` |
| Phone 390 and 320 | All surveys list `1464:3779`; Survey scope at 390 `1464:3821` and 320 `1464:3890`; Record observation in successor draft revision 3 `1478:3552` |
| States | Phone 390: loading `1464:3958`; no reviewed surveys at the chosen site `1464:4016`; could not load `1464:4059`; Bay 4 changed since submission, recheck shown to the reviewer `1464:4095` |
| Page parts | Section "Page components (proposed)": Survey grid header `1465:2977`, Survey grid row `1464:4188` (variant set) and Survey photo tile `1470:3265`. They stay on the page, as the Sites, People and Organisations parts do |
| Prototype | Flows "CS-08 — desktop" (from the register) and "CS-08 — phone" (from the list): register row to the survey, New survey and Cancel back, the record tabs, breadcrumb back, Review submission to the review form, and Mark reviewed to the handover frame; on phone, list to record, Back, and Back from recording an observation |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00, signed in as Sasha Cole (reviewer). Eight surveys `SYN-PPO-SRV-…` across the seven accepted sites. `SYN-PPO-SRV-000031` "Bay 3–4 irrigation as-found" is at SYN Glasshouse 4 (Hillview Growers). Sam Patel owns it; Casey Ward recorded the visit on Mon 12 Oct with Priya Shah on site. Revision 1 was returned at 16:40 because flow at VB-4 was entered as 0; revision 2 was submitted Tue 13 Oct, 08:20. The scope is Glasshouse 4, Bay 3, Bay 4, Pump shed and irrigation valve bank VB-4, installed in Pump shed and serving Glasshouse 4, Bay 3 and Bay 4, as on Facilities CS-05. It has eight observations, three photos and three owned follow-ups. The handover frame follows Sasha's review at 10:05 and hands over to Estimating, with Dean Fiedler as receiving owner. The phone capture is Fri 16 Oct, when Casey records the flow in revision 3 |
| Retained captures | [Site surveys design r01](../reference/ui/customers/site-surveys-design-r01/README.md): fourteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CS-08`, `route:/surveys` and `route:/surveys/[id]` (More › Shared records › Site surveys & as-found). Page-register coverage under CRM-01, CRM-04, CRM-06, SVC-06, DOC-01, DOC-02 and DAT-01–DAT-03, unchanged. Capabilities unchanged |
| Page type (r20) | Register or worklist for the survey register. Document and evidence workspace for the survey record, with six tabs. Form for New survey, the review and the handover |
| Reused components | Shell v2 (Rail · Service with More selected, the top bar with the proposed Conversations action, side menu), Grid header and cells, Record / Header, Record / Readiness bar and Check item, Record / Field, Section heading, View tab and Filter chip, Work order record / Blocker row, Planner / Input (proposed), Tag, Button, the phone list row, tab bar and quick add. The review card copies the accepted CS-06 evidence review; the create form copies the accepted Organisations form. New, proposed: Survey grid header and row, and Survey photo tile |
| Incoming handovers | Sites CS-04 and Facilities CS-05 (the exact site, its areas, and equipment installed in versus serving each area), People CS-02 (contact on site), Access & readiness CS-06 (standing access rules), Equipment EQ-01 and global search |
| Outgoing handovers | A reviewed handover to Estimating (ES-01, ES-02 discovery) or Engineering (EN-02 design basis) with an accountable receiving owner; owned follow-ups as activities in My Work (SH-02); sites, areas and equipment opened read-only |
| Source authority | The CS-08 design register pages; `src/components/cs-workspace.tsx`; `src/shared/cs/model.ts`; `src/shared/cs/service.ts`; `src/shared/cs/photos.ts`; the r01 HTML record as history |
| Proposed departures | D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 19 October 2026 |
| Decision record | This file |
| Named version | Waiting for Dean's explicit yes |

## 4. What the design shows

### Register

- **Grid:** one row per survey (D1). Survey title, Status, Site, Visit, Open gaps and Handover are visible at 1440; Revision, Owner, Observations and Reference follow by scrolling sideways, with fixed checkbox and settings columns. The status tag reads Draft, Submitted, Returned or Reviewed. Handover shows "—" before review, Estimating or Engineering once recorded, and "None" for a reviewed survey without one.
- **Toolbar:** Site and Owner filters, the count with its read time ("8 surveys · as at Tue 13 Oct, 09:00"), Refresh, "…" and New survey.
- **Side menu:** Sites and Facilities & growing areas, then a Site surveys group with All surveys (default), Drafts, Awaiting review, Returned and Reviewed, then Related: Access & readiness and Equipment (D2).

### Survey record

- **Layout:** the accepted shared record layout (D3). The header shows the title and state, the reference with site and organisation, the owner, and the revision with who submitted or reviewed it. The actions follow the state: Return with clarification and Review submission when submitted; Start successor draft and Record handover when reviewed.
- **Checks bar:** "Submission checks" while submitted (scope recorded, 8 observations, 3 original photos, 3 of 3 gaps owned, locked while submitted, handover after review); "Handover checks" once reviewed.
- **Details column:** Survey (site, organisation, contact on site, visit, recorded by, prepared for), with the statement that review records the as-found brief and certifies no design suitability, capacity, site safety or work authority; Revisions, each with its state and decision; People (contact on site, the recorder and the reviewer).
- **Tabs:** Survey scope, Observations, Photos, Follow-up, Review & handover and History (the built tab names, shortened).
- **Survey scope:** each area and the equipment with its own counts. Pump shed is in scope because VB-4 is installed there. Survey notes never change the shared area or equipment records.
- **Observations:** one table with kind chips (All, Measured, Observed, Customer statement, Unknown, Assumption), the value, the target and whether a follow-up is owned, and a card for the selected entry with its kind, target, value, recording, method and source, whether it affects the handover, and its owned follow-up (D4). A measurement needs a number and a unit; an Unknown is never stored as zero.
- **Photos:** tiles that show each original by its file facts: name, size, SHA-256 and the original format retained (D5). Designs use a neutral placeholder, never an invented photograph. Caption corrections are listed separately and never touch the file.
- **Follow-up:** Unknowns and Assumptions that affect the handover, each with an owned activity in My Work, and those that do not, each with its recorded reason.
- **Review & handover:** the review submission form and, once reviewed, the handover form (D6), with a dated list of decisions on the survey underneath.

### Review and handover

- **Review submission:** the exact snapshot, who prepared and recorded it, its contents and open follow-ups, and the earlier decision. Decision chips Mark reviewed and Return with clarification, a required note, and wording that says marking it reviewed keeps exactly that revision and acknowledges the open follow-ups as known gaps.
- **Record reviewed handover:** the reviewed snapshot and its known gaps, the receiving workflow (Estimating or Engineering), the accountable receiving owner and a required reason. The receiving owner decides whether to adopt the exact reviewed source; nothing is sent, and no estimate or engineering basis is changed.

### New survey

- Site, survey title, owner, planned visit and contact on site; scope chips for areas and equipment; and purpose (D7). Choosing equipment adds the area it is installed in, and serving an area never adds that area to the scope.
- The right panel lists surveys already recorded at the chosen site, and that site's Access & readiness. A reviewed survey is brought up to date by a successor draft, not a new survey.

### Phone

- **List:** rows with the title and state, the site and owner, and one status line (revision, open gaps, visit or handover).
- **Record:** a compact header with the state, Scope, Observations, Photos and Follow-up tabs, the survey card with the contact on site and Access & readiness, and the exact scope. Review submission is the sticky action.
- **Record observation:** recording the flow in successor draft revision 3, with the kind chips, title, target, value and unit, method and source, who recorded it and when, and whether it affects the handover. It names the revision 2 Unknown it answers, which stays unchanged.
- **States:** loading; no reviewed surveys at the chosen site; could not load, with no list or counts; and Bay 4 changed since submission, where the snapshot sources are listed with "recheck required" on Bay 4 (Q4).

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | The register is a grid with the survey title first, then status, site, visit, open gaps, handover, revision, owner, observations and reference; status views in the side menu; Site and Owner filters; New survey in the toolbar asks for the site first | Cards (name, state, revision, owner) under a Site select; "New survey at selected Site" only after choosing a site |
| D2 | Site surveys is a shared record opened from More. The side menu lists Sites and Facilities & growing areas, then the survey views, then Access & readiness and Equipment | The shared records list with saved views |
| D3 | The accepted record layout with a checks bar, Survey, Revisions and People on the left, and six short tabs; Survey scope lists each area and equipment with counts | A page header, a section per view and one action form |
| D4 | Observations are one table with kind chips and a detail card for the selected entry; Unknown and Assumption are amber, Measured is green | One entry block per observation |
| D5 | Photos are tiles shown by their file facts, with a neutral placeholder in designs; caption corrections are listed separately | A photo list with captions |
| D6 | A Review submission form (decision chips, required note, acknowledgement wording) and a Record reviewed handover form (workflow, receiving owner, reason) in the Review & handover tab, with a dated decisions list | One WorkflowActions form with an action select |
| D7 | New survey with site, title, owner, planned visit, contact on site, scope chips and purpose, and a panel of surveys at that site; phone list, record and observation capture in a successor draft | The shared create form; no phone capture drawn |

## 5. Not decided and not drawn

- **Building the page.** The built `/surveys` and `/surveys/[id]` routes keep the card register and the existing survey workspace. The build order is not decided.
- **Prerequisites for a build:**
  - a register read that returns visit, open gaps, handover destination, observation count and reference;
  - the survey reference `SYN-PPO-SRV-000nnn`, planned visit and contact on site (Q1, Q2);
  - the rule that the survey owner and the recorder cannot review (Q3);
  - showing a changed scope source to the reviewer without blocking review (Q4);
  - the Return with clarification path in the same form.
- **The Conversations action** is part of the proposed top-bar shell amendment. As on Sites, People and Organisations, the phone record header has no Conversations action.
- **Not drawn:**
  - the History tab at full size;
  - the Return with clarification form (the review form with the other decision chosen);
  - desktop draft editing of scope and observations (the phone capture shows the pattern);
  - a Returned record and a view-only state;
  - the photo upload dialog with its file checks (JPG, PNG or WebP, up to 1 MiB each and 8 per survey);
  - a tablet record;
  - 200% zoom, which the spec reviews separately.
- **Open item:** the accepted Access & readiness design shows the survey reference as "SYN-SRV-000031" (Q1).
- **Data in the frames:** the surveys, sites, people, readings, file names and hashes are synthetic. They are not operational records, and the readings are not measurements of any real site.

## 6. Audit and polish

At Dean's request Claude measured every visible text in every frame for truncation and clipping, checked card insets, and rechecked the story and counts across all frames.

- **Corrected:** the Observations table columns (Follow-up was clipped by 30 px); the register and tablet column widths, so site names fit and a column ends at the visible edge; the Handover column, now "—" before review and "None" for a reviewed survey without one; the reviewer's line after review; the New survey unsaved count (8); and the earlier survey's review date (Wed 30 Sep).
- **Polished:** the selected-observation facts align with the card title, and the customer statement reads "Said by Priya Shah" and is styled like the other entries.
- **Left as designed:** the phone 320 title truncates with an ellipsis, as on the other record pages, and grid columns beyond the visible width scroll sideways.

The audit is recorded on the notes card `1464:4164`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and the audit, and measured every visible single-line text against its rendered width. After the audit no text is truncated or clipped, except the phone 320 title and columns that scroll sideways.
- The fourteen captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 256,000. Image 14 is a frame holding copies of the four phone state frames. Prototype links were removed and each of the 505 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 1,311 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link, and no flow starting point was added to the Captures page.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/customers/site-surveys-design-r01/README.md).
- The named Figma version "Site surveys — accepted" is not saved yet; it needs Dean's explicit yes. This pull request stays in draft until then.
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
