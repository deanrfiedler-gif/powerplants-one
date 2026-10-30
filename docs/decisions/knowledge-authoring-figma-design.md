---
document_id: PPO-DK05-KNOWLEDGE-AUTHORING-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; implementation, capabilities, publication policy and customer publication separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Knowledge authoring, review and learning intake design — owner decision

On 23 October 2026 Dean asked Claude to design and build "the 'Knowledge authoring, review and learning intake (DK-05)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/knowledge/review` is not built, so this design defines the build.

On 30 October 2026, asked "Do you accept the DK-05 design with the recommended answers to Q1–Q7?", Dean answered: "Accept and lock in". That adopts departures D1–D12 and the recommended answers to Q1–Q7.

Claude drew the page from these sources:
- the issued [HTML r01](../reference/ui/knowledge-authoring/PPO-Knowledge-Authoring-Review-and-Learning-Intake-r01.html) and [report r01](../reference/ui/knowledge-authoring/PPO-Knowledge-Authoring-Review-and-Learning-Intake-Report-r01.md), both unchanged;
- the [knowledge search and article design](knowledge-search-article-design.md) (DK-04 decisions 1–6);
- the Figma page Knowledge · DK-04 (2200:833), whose states, labels, applicability model, parts and placement this page reuses;
- the accepted designs for [Findings](findings-figma-design.md), [Incidents](incidents-figma-design.md), [Remote diagnosis and escalation](escalations-figma-design.md) and [Workshop builds](workshop-builds-figma-design.md), and the [Template management](template-management-figma-design.md) publication pattern;
- the Figma pages Bench testing (2083:82), Change review EN-07 (2097:583371) and Technical queries EN-04 (2091:586789), read only;
- [HTML module conformance](../standards/html-module-conformance.md) and the [readable reference namespaces](readable-reference-namespaces.md) decision.

Scope:
- `scope:DK-05` "Knowledge authoring, review and learning intake", registered destination `/knowledge/review`.
- Parents DOC-04 (principal), DOC-01, DOC-02 and DOC-06, with C04 and the DK-04 links to ENG-07 and SVC-06 as in r01. AT-20 and AT-37 stay open. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, grant, publication, customer communication or deployment. No step, value or safety note on the page is a real or validated technical or safety procedure.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design DK-05 in Figma as a proposal | User decision, 23 October 2026 | Dean's request quoted above |
| Departures D1–D12 and the recommended answers to Q1–Q7 | Accepted user decision, 30 October 2026 | "Accept and lock in", quoted above. Sections 3 and 4 |
| Exact-revision publication, successor editing and withdrawal keeping history | Proposed design carried from DK-04 and r01 §8, now accepted as design | No application behaviour exists |
| Review intervals, safety review and customer audience approval | Recommended answers, accepted as design direction | Not a verified operating rule or a competent-person register |
| The story, references and bench values | Synthetic | Section 5 |

## 2. Conformance declaration

| Required declaration | Treatment |
|---|---|
| Existing scope identity | DK-05, retained |
| r20 page types | Work queue + persistent detail (worklist, triage); Form / guided workflow (editor); Document & evidence workspace (sources, applicability); Review / comparison (review, validation); Record detail (publication, withdrawal, history) |
| Reused components | Shell v2 with Rail · Service as drawn on DK-04, Shell / Top bar with the Conversations action, Shell / Phone header · compact, Grid cells, Tag, Button, Record / Header, Readiness bar, Check item, Field, Section heading, History item and Banner, Toolbar search, and the DK-04 Knowledge parts for applicability, step, safety note and source rows |
| New components | Authoring / Learning grid header and row, Article grid header and row, Group band, Review comment and Evidence check, moved to Components › Service, Supply chain and Shared records parts at this acceptance |
| Incoming handovers | Learning items with their exact source from Findings SV-07, Incidents FI-06, Remote diagnosis SV-08, Bench testing CX-02, Workshop builds CX-02, Change review EN-07, Technical queries EN-04 and the phone capture from a job; Suggest a change, Suggest an article, observations and feedback from DK-04 |
| Outgoing handovers | An exact published revision that DK-04 reads; a Customer-publishable revision for CP-05 only after its own audience approval; withdrawal and supersession events; owned follow-ups in My Work; the triage outcome shown back on the source record. Nothing here authorises work or changes a job pack, service record, setting or document |
| Exceptions drawn | Loading, nothing to do, could not load, read-only, reviewer is the author, source changed since review, publication not confirmed, review overdue |

## 3. Accepted departures

- **D1 · Place.** Authoring lives in Knowledge, placed as DK-04 D1 sets (Service rail › Field and inspections › Knowledge, and More › Shared records). The Knowledge side menu gains an Authoring group after Search knowledge (All work, Learning to triage, My drafts, To review, Returned, Ready to publish, Review overdue), shown only to people with a knowledge author, reviewer or publisher capability. Route `/knowledge/review` as registered. Departure: r01 was a standalone module with its own masthead.
- **D2 · Shell and layout.** r01's six-view module interior, 328 px persistent detail and 448/780 px inspection panels give way to the current shell and, for an article, the shared record layout used on DK-04. Triage and validation open as 560 and 640 px side panels over a scrim; publish and withdraw are dialogs.
- **D3 · One worklist.** A Learning to triage grid and an Articles grid grouped by state, with bands spanning the whole row (Draft, In review, Returned, Ready to publish, Published, Review overdue or expired, Withdrawn and superseded). Views By state, By owner and By product family; filters Owner, Product family and Source. Columns past 960 px scroll into view.
- **D4 · Learning items and triage.** Each hand-in is a learning item with its exact source record, never an article. Four outcomes: make a new article, add it to an existing article as a suggested change, keep it as a lesson (short, still reviewed), or dismiss it with a reason. A duplicate check runs first and the source link is always kept. Departure: r01's New, Assigned, Needs information and Linked to draft become To triage and these outcomes.
- **D5 · Editor.** One page: title, type (Procedure, Fault-finding guide, Product note, Lesson learned) and summary; safety notes as their own block, each confirmed by the reviewer; steps mapped to exact sources; exact sources, required or context; the applicability table; audience; related articles; a change summary. A draft can be saved incomplete, and submitting freezes the revision.
- **D6 · Applicability.** Five independent dimensions with exact values. "Any · not dependent" needs a reason and the reviewer's confirmation. Unknown is allowed, and readers then see Unknown. Required sources are checked against the same dimensions.
- **D7 · Audience.** Staff only or Customer-publishable (CP-05), chosen by the author and checked by the reviewer as its own item. Customer-publishable is offered only for grower-owned settings or information, never hardware work, and needs a separate audience approval after technical acceptance. Departure: r01 refused every customer audience.
- **D8 · Technical review.** The reviewer is never the author. Comments are anchored to a section, step, source, applicability value or the audience, and are Blocking or Advisory. Accept stays unavailable while a blocking comment is open, and every decision needs a reason. Outcomes: Accept, Return with comments, Decline.
- **D9 · Validating a hypothesis.** A suspected fix becomes a procedure only through Validate as a procedure: the reviewer answers the hypothesis's own "what would confirm it" questions, ticks each piece of evidence with what it shows, confirms the scope and each safety note, and records what stays open. Keeping it a hypothesis is an equal choice, and validation publishes nothing.
- **D10 · Publish and later changes.** Publishing acts on an accepted exact revision, rechecks the sources, the reviewer's independence, the policy and any newer draft, and creates the exact revision. Editing a published article always makes a successor, and publishing the successor supersedes its predecessor, which stays as history. An interrupted publication shows Publication not confirmed with Check and retry, which looks up the same publication first and never publishes twice.
- **D11 · Withdrawal and overdue review.** Withdraw needs a reason, can point readers to another article, and keeps the revision readable as history. Offline copies leave use at their next check, and anything that cited the revision keeps its exact citation. An overdue article stays readable, marked Review overdue, until it is confirmed or replaced.
- **D12 · Phone.** Compact record header (P1–P9); as P3 sets for records, Conversations sits in the record's More menu. A technician captures learning from a visit: a summary, photos, a suggested type and a safety question that sends real risks to Incidents. A reviewer can accept or return a short article with the same checks. Editing, validation and publishing stay on desktop and tablet. Departure: r01 had no phone design.

## 4. Accepted answers

| Question | Accepted answer |
|---|---|
| Q1 · Who may author articles? | Anyone in service, workshop or engineering can capture learning and suggest a change. Only engineers, senior technicians and the workshop lead write and submit articles, with a new knowledge author capability per product family, added at build with the AD-01 access review |
| Q2 · Who reviews safety notes? | The technical reviewer confirms each note separately. A new or changed note in a procedure also needs a second confirmation from a holder of a knowledge safety review capability (the service manager or safety lead), never the author. Notes point to the job pack and site rules and never replace them |
| Q3 · Review interval? | 6 months for procedures and fault-finding guides with safety notes; 12 months for other procedures, guides, product notes and Customer-publishable articles; 24 months for lessons; an immediate hold for recheck whenever a required source changes |
| Q4 · Who approves Customer-publishable articles? | Technical acceptance first, then a separate audience approval by the service manager, who confirms it covers only grower-owned settings or information, with no hardware steps, internal menus, prices or names. It is published as its own customer revision. Suspected fixes, lessons, and withdrawn or superseded articles are never customer-publishable |
| Q5 · Who publishes? | A knowledge publish capability held by the service manager and the engineering lead. The publisher cannot change content or override a source hold, so every publication carries the reviewer's and the publisher's names |
| Q6 · Learning item references and duplicates? | `SYN-LRN-000nnn` under the readable references rule (a new type needs a PPO-STD-001 amendment), and a duplicate check on the same source record and exact title, with no fuzzy merging |
| Q7 · Story differences between pages | Align as each page is accepted. Bench testing is drawn as at Fri 16 Oct, so the validation rests on the September return `SYN-RTN-000006`, and M-4's own motor (`SYN-RTN-000016`) becomes evidence for r03. SV-08's E-17 reply arrives Wed 14 Oct, so it is not a learning item here |

## 5. Synthetic story

As at Tue 13 Oct 2026, 09:00 AEST, with other moments labelled on their frames. The suspected fix `SYN-KA-000013` r01 (from finding `SYN-DEF-000019`) gets a successor r02, which Jordan Kim validates on bench evidence from `SYN-RTN-000006`. Kim Taylor's learning from CP-4 rework RW-1 becomes lesson `SYN-KA-000015`, accepted by Alex Morgan and published by Sasha Cole. `SYN-KA-000016` "Checking screen position settings" is Customer-publishable and is returned with two blocking comments. `SYN-PPO-KA-000007` r03 is withdrawn.

New references: `SYN-LRN-000019` to `000031`, `SYN-KA-000015` and `000016`, `SYN-SRC-000011` and `000012`. Existing references are unchanged, and the r01 fixtures stay as issued.

## 6. Checks and evidence

The [retained captures](../reference/ui/knowledge-authoring/knowledge-authoring-design-r01/README.md) hold 21 icon-free images. A script confirmed that the capture copies contain no Font Awesome instance, stray vector or prototype link. On the source frames it found Roboto only, one selected rail item and the Conversations action on every desktop and tablet top bar, and a layout pass found no overlaps. The page holds 36 prototype links in the flows "DK-05 — desktop" and "DK-05 — phone".

Three corrections were made after acceptance and before capture, with no change of design: `SYN-KA-000011` now shows Drew Collins as owner, so its owner and reviewer differ; the review overdue header actions were shortened so they fit; and the details column gained spacing.

Not run: the flows in Present mode, a real device, keyboard and assistive-technology checks, and 200% zoom.

## 7. Open and receiving items

- The named Figma version "Knowledge authoring — accepted" waits for Dean.
- Knowledge · DK-04 was accepted on 30 October 2026 in its own lock-in, recorded at `docs/decisions/knowledge-figma-design.md` on its own pull request. D1 and the reused Knowledge parts rest on it, and that path is cited as text until it reaches main.
- The build needs a PPO-STD-001 amendment for the `SYN-LRN-` type, knowledge capabilities in `src/platform/permissions.ts` with the AD-01 access review, transactional publication with a real receipt, and the CP-05 receiving page.
- Not drawn: the By owner and By product family views in full, the Add to an existing article and Dismiss outcomes as their own frames, the full r01 → r02 comparison, dispositions for DK-04 feedback, owned follow-ups in My Work, publication history, denied access, 200% zoom and print.
