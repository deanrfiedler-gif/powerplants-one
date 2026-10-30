---
document_id: PPO-DK04-KNOWLEDGE-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; native implementation, permissions and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Knowledge search and article detail design — owner decision

On 23 October 2026 Dean asked Claude "to design and build the 'Knowledge search and article detail (DK-04)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/knowledge` is not built, so this design defines the build. Claude presented the page and asked: "Do you accept DK-04 with D1–D12 and the recommended Q1–Q6 answers?" On 30 October 2026 Dean replied: "Accept as recommended". That adopts departures D1–D12 and the recommended answers to Q1–Q6. It is Dean's own answer, not an agent decision under the [standing order](autonomous-agent-operation.md).

Claude drew the page from these sources:
- the [earlier Knowledge design decision](knowledge-search-article-design.md) (r01 decisions 1–6), the issued [HTML r01](../reference/ui/knowledge/PPO-Knowledge-Search-and-Article-Detail-r01.html) and its [report](../reference/ui/knowledge/PPO-Knowledge-Search-and-Article-Detail-Report-r01.md), all kept unchanged, and the [model rules](../design/knowledge/model.js);
- the [DK-04 design register page](../design/development/pages/scope-dk-04.md) and the [DK-05 authoring report r01](../reference/ui/knowledge-authoring/PPO-Knowledge-Authoring-Review-and-Learning-Intake-Report-r01.md), for the boundary only;
- the [Equipment workspace](equipment-workspace-design.md) and [escalations](escalations-figma-design.md) decisions and the [conformance standard](../standards/html-module-conformance.md);
- BP-01 parent IDs DOC-01, DOC-02, DOC-04, DOC-06 and NFR-08;
- `src/shell/navigation.ts`, which has no Knowledge entry;
- the Figma pages Equipment, My jobs, Job pack, Remote diagnosis, Findings, Search and Document library, which were read and not edited.

Scope:
- `scope:DK-04` "Knowledge search and article detail", proposed routes `/knowledge` and `/knowledge/[reference]?rev=rNN`.
- DOC-04, supported by DOC-01, DOC-02, DOC-06 and NFR-08, with ENG-07 and SVC-06 through C04 as in r01. AT-20 and AT-37 stay open. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, offline store or deployment. It validates no technical or safety procedure: every article, step, value and safety note in the frames is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design DK-04 in Figma as a proposal | User decision, 23 October 2026 | Dean's request quoted above |
| Bring r01 onto the current shell and record layout, recorded as a departure | User decision, 23 October 2026 | Dean's brief. D2 |
| Departures D1–D12 | Accepted as recommended, 30 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Who may validate a procedure | Resolved as recommended | A named technical reviewer with a new knowledge review capability, held by senior technicians and engineering reviewers for that product family and never by the author. Validation needs the required sources mapped and current. Publication stays a separate DK-05 step by a knowledge publisher |
| Q2 Unreviewed suspected fixes | Resolved as recommended | Visible to internal service and engineering staff only: labelled Suspected fix with no corrective steps, ranked after validated guidance, never in job packs or the customer portal, and sent to the owner for review in DK-05. The review time (the example given was 10 working days) is set there |
| Q3 Place in the rails | Resolved as recommended | Service rail under Field and inspections, after My inspections; More › Shared records, after Documents; and a phone tab bar slot in place of My inspections, which moves into More. Engineering can add it to its own rail later |
| Q4 Customer-publishable articles (CP-05) | Resolved as recommended | Only Validated procedures and Reviewed references that a reviewer marks for the customer audience, published as a separate customer revision. Never suspected fixes, lessons, internal notes, superseded or withdrawn articles, or anything that changes the grower's controller settings. The portal decision itself stays with DK-05 and CP-05 |
| Q5 When an offline copy is out of date | Resolved as recommended | Whenever the phone is offline, and after 7 days without a check. Saved copies are checked at every sync; a withdrawal removes the copy from offline use at the next check but keeps it in Saved with its reason |
| Q6 Story differences between pages | Resolved as recommended | M-4 is `SYN-AST-000146`, serial `SYN-M40-219102` (the Search page, same date), model SM-40, with no make named, so no synthetic article reads as a manufacturer's procedure. Other pages are aligned as each is accepted. Equipment gains a "Knowledge for this equipment" link there (section 5) |
| Accept the design | User decision, 30 October 2026 | Quoted above |
| Named Figma version | User decision, 31 October 2026; saved by Claude | Asked whether he would save "Knowledge — accepted" himself or have Claude do it, Dean replied "You save it" (section 7) |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Knowledge · DK-04" `2200:833`, under "— Shared records —", after Template management · DK-06 `793:6155`. The page header `2200:834` holds the conformance declaration; the notes card `2217:730115` and navigation placement `2217:730142` are in Flows and notes. File index row "Row / Knowledge · DK-04" `2771:471463` on Start here |
| Desktop 1440 | Search from the job, Set context open `2203:391`; results, mixed applicability `2202:718358`; article SYN-KA-000012 r02, full length `2205:674`; superseded article SYN-KA-000010 r03 with its successor `2207:721754`; suspected fix SYN-KA-000013 r01 `2208:1460` |
| Tablet 1024 | Article, details folded into the context strip, full length `2210:1767` |
| Phone 390 and 320 | Search from the job `2212:723873` / `2215:727240`; article, full length at 390 `2214:2203` and first screen at 320 `2215:727293`; saved on this phone `2215:726042` / `2215:727451`; Set context at 390 `2216:728307` |
| States | Desktop: loading `2217:2899`, no results `2217:3260`, context unknown `2217:3575`, required source unavailable `2217:7443`, review overdue `2217:8034`. Phone 390: article withdrawn `2216:728406`, offline copies out of date `2216:728584` |
| Prototype | Flows "DK-04 — desktop" (from Set context) and "DK-04 — phone" (from search). Desktop: Set context → results → article, superseded, suspected fix and review overdue, and back. Phone: search → article → Save for offline → Saved → withdrawn, and Set context. 28 links, none off the page |
| Parts | Moved to Components › Service, Supply chain and Shared records parts `1095:257413` at acceptance: Knowledge / Result header `2201:106`, Result row `2201:86`, Group heading `2201:111`, Applicability header `2201:113`, Applicability row `2201:118`, Step `2201:126`, Safety note `2201:132`, Source row `2201:138` and Phone result row `2201:150` |
| Rail | Rail · Service `198:3778` gained a hidden item, "Rail / Knowledge (proposed)" (`2771:471449`, `2771:471456`), behind the property Knowledge (proposed), off by default, so no other Service page changes. The frames on this page keep their detached rails as accepted |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST. Casey Ward (field technician) prepares the Glasshouse 4 job with Riley Tran (lead): `SYN-PPO-WO-000040`, appointment `SYN-PPO-APT-000052` moved to Thu 15 Oct, job pack r04. The unit is Shade screen motor M-4, `SYN-AST-000146`, with finding `SYN-DEF-000019` open. Context: SM-40, firmware 2.2.0, ScreenDesk 3.2 on climate controller CC-4, Glasshouse, truss tomatoes in production. A search for "screen motor noise" finds `SYN-KA-000012` (validated procedure that applies), `SYN-KA-000009` (product note, review overdue), `SYN-KA-000013` (suspected fix), `SYN-KA-000011` (lesson from bench return `SYN-RTN-000006`), `SYN-KA-000010` (superseded for firmware 1.x) and the r01 identity `SYN-PPO-KA-000007` (expired, another model). `SYN-KA-000014` was withdrawn on 8 Oct. Sources `SYN-SRC-000009` and `SYN-SRC-000010`. References `SYN-PPO-KA-000001` to `000008` keep their issued form |
| Retained captures | [Knowledge design r01](../reference/ui/knowledge/knowledge-design-r01/README.md): 21 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:DK-04`, proposed `/knowledge` and `/knowledge/[reference]?rev=rNN` (not built). Parents as above, unchanged; all 78 parent IDs preserved. No knowledge capability exists yet (Q1) |
| Page type (r20) | Register / worklist (results, Saved, Saved on this phone). Record detail with a Document & evidence workspace (an article at an exact revision). Form (Set context panel and phone screen) |
| Reused components | Shell v2 (Rail · Service, top bar with the Conversations action, badge 3, side menu), Shell / Phone header · compact (P1–P9), v2 / Tab bar (phone), Button, Tag, Grid / Checkbox, Record / Header, Readiness bar, Check item, Field, View tab, Section heading, Work order record / Blocker row and the Search (SH-04) result list pattern. New: the parts in section 2 |
| Incoming handovers | My jobs (FI-01) and Job pack (SV-05) open Knowledge with the job's equipment, site, facility and crop filled in. Equipment (EQ-01) "Knowledge for this equipment". Suspected fixes come from Findings (SV-07) and lessons from Bench testing (CX-02), both through DK-05. Search (SH-04) will open this page. Remote diagnosis (SV-08) can cite an exact revision |
| Outgoing handovers | Copy reference, with the exact article, revision, statuses and context. Save, and Save for offline on the phone. "Did this help?", recorded against the revision and the job. Suggest a change and Suggest an article open DK-05 with the exact revision and context. Sources open their owning records. Nothing here authorises work, changes a work order or job pack, or reaches a customer |
| Source authority | The sources listed above. r01 is the earlier accepted direction; its bytes are unchanged |
| Exceptions and recovery | Loading, no results, context unknown, article withdrawn, required source unavailable, review overdue and offline copies out of date. An unavailable revision is never swapped for another, and a missing value stays Unknown |
| Proposed departures | D1–D12 in section 4, accepted |
| Status | Owner-accepted design, 30 October 2026 |
| Decision record | This file |
| Named version | "Knowledge — accepted", saved 31 October 2026 (section 7) |

## 4. What the design shows

| ID | Departure or rule | Basis |
|---|---|---|
| D1 | Place: Service rail › Field and inspections after My inspections, with the Light book icon, and More › Shared records after Documents, both opening `/knowledge`. The phone technician tab bar becomes My Work, My jobs, Knowledge, Equipment, More | Dean's brief; Q3. `navigation.ts` has no entry |
| D2 | The current shell and, for an article, the shared record layout, in place of r01's standalone module interior, filter rail and 448 px snapshot | Dean's brief; r01 decision 6 |
| D3 | A context strip names the unit and its five values, each with its source and read time. Set context picks equipment or takes values by hand, and any value can be marked Not known. It never changes the equipment record. Opening from a job or equipment fills it in | r01 decision 2 |
| D4 | Validation (Validated procedure, Reviewed reference, Lesson, Suspected fix, Superseded, Withdrawn), Review (Current, Review overdue, Expired, Not reviewed) and Applies to this unit (Applies, Does not apply, Unknown, with the reason) are shown separately, in words. r01's Troubleshooting, Reviewed lesson, Matches context, Outside scope and Context incomplete are renamed; Product note and Reviewed reference are added | r01 decision 1; Dean's brief |
| D5 | Results are a flush list with a column header. Current guidance comes first, a validated procedure that applies leads, and hypotheses never rank above validated guidance. Superseded and expired articles come last, shown by default | r01 hid superseded articles by default |
| D6 | Only five explicit matches give Applies; one mismatch gives Does not apply; otherwise Unknown. "Any crop stage" counts only when the reviewer recorded the article as not crop-dependent. Required sources are checked against the same context, and a changed or unavailable source holds the article for checking without changing its validation | r01 report §4 and §6 |
| D7 | The article is one page of sections under a record header with the exact revision, date, owner and reviewer, and a "Before you use this" checks bar. The tabs are jump links. At 1024 the details column folds into the context strip | r01 split these into separate views |
| D8 | Safety notes are an amber band with a warning icon and the word SAFETY, in their own section and before the step they protect. They point to the job pack and site isolation rules and never replace them | Proposed composition |
| D9 | A suspected fix shows the observation, the hypothesis and what would confirm or rule it out, with no corrective steps, and links the validated procedure. A lesson is reference material. Nothing a reader does validates either | r01 decision 3 |
| D10 | A superseded article keeps its identity, names its successor with the successor's own statuses and withholds its steps, which open only as history. A withdrawn article shows when, who and why, has no steps and leaves offline use at the next check | r01 decision 3; DK-05 report §8 |
| D11 | Copy reference, deep links and feedback keep the exact revision. r01's Request review and Review watchlist move to DK-05; this page keeps only Suggest a change and Suggest an article | r01 decision 4; Dean's brief |
| D12 | Phone: compact header, search from a job as a record-type screen with back, flush article sections and one full-width 48 px main action, inputs at 16 px, and tags that wrap. Offline copies keep the exact revision, when they were saved and when they were last checked | r01 had no offline copies |

## 5. Not decided and not drawn

- **Building the page.** `/knowledge` is not built and the build order is not decided.
- **Prerequisites for a build:**
  - an article identity with immutable revisions, validation state and structured applicability;
  - source links with immutable versions and hashes, and permission checks before any title or excerpt is returned;
  - a knowledge read capability and the review capability in Q1;
  - permission-filtered search, with counts and previews in the same scope;
  - a revision-bound Saved list and a protected offline store with a last-checked time;
  - the navigation entries in D1.
- **Accepted amendments on other pages, not yet drawn there:**
  - Equipment (EQ-01): a "Knowledge for this equipment" link;
  - My jobs (FI-01) and Job pack (SV-05): an entry that opens Knowledge with the job's context;
  - My jobs: the phone technician tab bar in D1;
  - Search (SH-04): Knowledge stops being "Not yet searchable" once this page is built.
- **Story differences left as drawn (Q6):** Bench testing returns the old motor as `SYN-M40-218845`, My jobs fits an SD-450 or SD-450B where Bench testing fits a new SM-40, and Equipment names a real manufacturer as the make.
- **Not drawn:** the Saved and My suggestions lists on desktop; the Browse by type views; the Suggest a change form (DK-05); the Show history steps view; print; denied access and a restricted article; 200% zoom; the phone More sheet.
- **Data in the frames:** the articles, steps, safety notes, sources, people, units and references are synthetic. They are not operational records or technical guidance. Each article frame carries a purple design annotation saying so.

## 6. Audit and polish

Before presenting on 23 October 2026, Claude screenshotted every UI frame and ran a script over all 20 frames for clipping at the right of a container, fonts other than Roboto, leftover Equipment wording, the selected rail item and the Conversations action. Fixes: shorter checks labels on two frames, the record position hidden where a long title needed the room, and the tablet search narrowed so the bell and account fit. A layout pass found no overlaps and nothing outside a section. The notes card records this.

**Correction at lock-in, 30 October 2026.** Claude had reported that every frame was screenshotted, but the navigation placement frame and the notes card were not. While checking the captures, Claude found that the More › Shared records excerpt in the navigation placement frame had collapsed to an empty box, so Dean accepted the design with that frame in that state. D1 and Q3 described the intended list in words. Claude fixed the box so the list shows, as D1 and Q3 say, and recorded the correction on the notes card. Nothing else in the accepted design was changed.

## 7. Verification

- The 25 October file audit relinked the top bars on this page to `Shell / Top bar`. A results frame and the capture copies were checked by eye afterwards; the Conversations action still shows with its badge.
- The 21 captures are copies of the frames on the "Captures (icon-free)" page, from y = 480,000. Prototype links were removed, hidden menus were left out, and each Font Awesome instance was swapped for `Icon/placeholder` (`67:77`). A scan after the swap found no Font Awesome instance and no visible vector outside a placeholder or the logo, and no prototype link.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/knowledge/knowledge-design-r01/README.md).
- The prototype flows were not played in Present mode.
- On Dean's "You save it", Claude saved the named version "Knowledge — accepted" in the Figma desktop app on 31 October 2026, and the version history lists it. The page header's Named version field was updated just before the save, so the version holds that wording; the captures are frames only and did not change.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline. AT-20 and AT-37 remain open.
