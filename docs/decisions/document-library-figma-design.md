---
document_id: PPO-DK01-DOCLIB-FIGMA-DEC
date: 2026-10-15
owner: Dean Fiedler
status: Owner-accepted design; native implementation, the register sort read and UI baseline acceptance separate
source_commit: b858b58ba36909326b57b2b8986b9d3438de0d09
versioning: git
---

# Document library design — owner decision

On 15 October 2026 Dean asked for the next Figma page. Claude confirmed the audit's candidate: the DK-01/DK-02 backend had merged ([PR #467](https://github.com/deanrfiedler-gif/powerplants-one/pull/467), [backend decision](document-library-backend.md)), there was no register screen, the only page was the issued job-pack document at `/documents/{id}`, and the 17 September standalone design ([PPO-DOCLIB-DES](document-register-linked-library-design.md)) had never been accepted. No open pull request, other session or File index row covered the page. Claude drew it from the accepted register and record patterns, using PPO-DOCLIB-DES for its rules and vocabulary only. Dean accepted it the same day: "Proceed with your recommendations." The design reference is the named Figma version "Document library — accepted".

Scope: `scope:DK-01` "Document register and linked library" (primary) and `scope:DK-02` "Document viewer, revision and review workspace" (supporting), BC-03, parents DOC-01, DOC-02, DOC-04 and DOC-06. The DOC-03 output and DOC-05 distribution authorities are preserved. No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Accept the design and its recommendations | User decision, 15 October 2026 | "Proceed with your recommendations." Every recommendation on the notes card is adopted and each open question takes its recommended answer |
| R1 Routes: the register at `/documents`, the record at `/documents/library/{id}` | Claude's recommendation, adopted | `/documents/{id}` today serves the issued job-pack document under its own permissions and stays as it is. A job-pack source links to it ("Open issued job pack") |
| R2 Documents stays a More › Shared records page | Claude's recommendation, adopted | `src/shell/navigation.ts` files `documents` under "Shared records" in More and in no department rail. The rail keeps the current department with nothing selected, as the app does for shared pages. In the Figma file the page sits under a new divider "— Shared records —" |
| R3 Register quick views and filters map one-to-one to backend filters | Claude's recommendation, adopted | State (Current, Withdrawn, All), review state, availability, owner, customer, site and search (`q`). No menu counts, totals or column sorting: the register read returns neither totals nor a sort |
| R4 Register and revise in a right-side panel; review in a centred dialog | Claude's recommendation, adopted | Follows the accepted snapshot panel (sticky Cancel and save) and [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md) (centred dialogs for short decisions). A new revision copies the current details and edits them only on request |
| R5 Synthetic text shows read-only in the page; PDF sources download | Claude's recommendation, adopted | The content read is a protected attachment of the exact revision. Showing a PDF inside the page needs a viewer dependency |
| R6 Links are never retargeted | Claude's recommendation, adopted | The contract keeps old evidence: moving a link to a new revision is add new, retire old. A link on an earlier revision shows Needs assessment (`needs_revision_assessment`) until its receiving workflow decides |
| Q1 Record route | Resolved by "Proceed" | `/documents/library/{id}`, so issue IDs and library IDs never share a route |
| Q2 Register sort | Resolved by "Proceed" | Add sort by number and last update as a small backend change before the build. Until then the page creates time-ordered IDs so that registration order holds |
| Q3 A review request or assignee | Resolved by "Proceed" | Not now. Reviewers work from Review › Unreviewed; a My Work item can follow later |
| Q4 Inline PDF viewing | Resolved by "Proceed" | Not now. It needs a viewer dependency and an ADR. Download and the existing issued-pack page cover it |
| Q5 Document types | Resolved by "Proceed" | A short controlled list before the build (Installation notes, Procedure, Schedule, Issued job pack, Issued service report, Commissioning record) so that Type can become a filter. The backend field stays free text until then |
| Q6 Who opens a finding | Resolved by "Proceed" | Opening and responding need `document.register`; accepting a response and recording a review need `document.review`. Keep it and say so in the access guide; reviewers normally hold both |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Document library — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Document library · DK-01 · DK-02" `744:2609`, under a new divider page "— Shared records —" `744:2608` placed after Supply chain and before Evidence. Its header `744:2610` holds the conformance declaration and its notes card `761:6220` lists the scope, story, recommendations, answers, backend gaps and what is not drawn |
| Accepted frames | Desktop: register `746:173857`, register with snapshot `747:4261`, record Overview `748:1898`, Revisions `750:2194`, Links `751:2459`, History `751:176389`. Flows: 1a register panel `754:3053`, 1b registered as r01 `755:3863`, 2a add revision panel `756:4134`, 2b r04 current `756:177949`, 3a reviewer findings `757:4651`, 3b review dialog `758:4943`, 3c reviewed `758:5436`. Tablet: record `758:8317`. Phone: register `759:5834`, record `759:6377`, 320 px exact content unavailable `760:6116`. States section `744:2670` (twelve cards) |
| Page components | Document grid row `746:42` (Default, Hover, Selected) and header `746:85`, Document list row (phone) `746:99`, Document finding card `752:3094` (Open, Awaiting review, Closed) |
| Cloned and shared parts | Projects register `209:47` and its small panel pattern `209:238`, Project record `345:5185`, Lead record phone `228:1060`, Projects phone list `209:457`. Rail · Service (proposal) `198:3778`, Shell / Top bar, v2 menu items and headings, Grid cells, Checkbox and Row actions cells, Tag, Button, Record / Header, Field, Section heading, Readiness bar and Check item, View tab `312:16`, Filter chip, History item and Banner. The Job pack form field, decision dialog and dialog scrim are reused for the panels and the review dialog |
| Retained captures | [Document library design r01](../reference/ui/document-library/document-library-figma-r01/README.md): eighteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:DK-01` (primary) and `scope:DK-02` (supporting), BC-03, parents DOC-01, DOC-02, DOC-04 and DOC-06. Routes `/documents` and `/documents/library/{id}` (Q1); `route:/documents/[id]` stays the issued job-pack page. Capabilities unchanged: `document.read`, `document.register`, `document.review`, default-denied with no seeded grants |
| Page type (r20) | Register / worklist (DK-01); record detail with a Document & evidence workspace in view tabs (DK-02); Review / comparison for the revision panel and the review dialog |
| Reused components | Section 2. New page components: the Document grid row and header, the phone list row and the finding card |
| Source authority | The [backend decision](document-library-backend.md) and [API contract](../contracts/document-library.md) (`/api/v1/document-library/*`: register, detail, content, history, usage, linked, revisions, findings, review, links, withdraw, recover); PPO-DOCLIB-DES for rules and vocabulary; the register entries `scope:DK-01`, `scope:DK-02` and `route:/documents/[id]`. Fixture: synthetic documents, sources, people, customers and sites |
| Incoming handover | Exact Job Pack and Service Report issues the user can already open in their own workflows, for the same company, customer and site; synthetic text typed at registration. Customer, site and people names come from the existing customer, site and people reads, because the library returns IDs |
| Outgoing handover | Declared links from an exact revision to a Project, Work order, Site, Asset, Organisation or Engineering package, and an independent review bound to an exact content hash. The receiving workflow keeps its own authority. The page never issues, distributes or acknowledges a document (DK-03), never changes a job pack, report, schedule, quotation or approval, and never authorises work |
| States shown | Register; snapshot; record Overview, Revisions, Links and History; the three flows; tablet; phone register and record; exact content unavailable at 320 px. The board covers loading, no matches, bounded result, exact content unavailable, denied or hidden, review outdated by a new finding, source superseded, changed since you opened it, independent reviewer required, withdrawn, partial coverage and uncertain save |
| Departures | Section 4 |

## 4. Display rules and departures

- **Three separate facts.** Content availability (Available, Unavailable), source currentness (Current, Superseded) and review (Unreviewed, Reviewed, Returned, Review outdated) are separate columns, checks and states. A missing exact content never falls back to another revision, and a review is never rewritten by availability.
- **Eligible for current use** is shown as a strip of five checks: current revision, source current, exact content available, reviewed, and no unresolved findings. It is labelled "Library evidence, not permission to work" and matches `eligible_for_current_use`.
- **Unresolved findings** counts findings that are Open or Awaiting review, as the backend does. A response never closes a finding; someone other than the responder, holding review duty, accepts it. Reviewed needs every finding closed; Returned does not. A finding opened after a review marks it Review outdated, and another decision needs a new revision.
- **Revisions** keep their own exact content, source and review. A historical revision is read-only and never becomes current again. A new revision starts Unreviewed, and its links stay on the earlier revision with Needs assessment.
- **Customer and site are fixed** at registration. The register order is the backend's stable order; the footer says "End of list" or "Load 25 more" and never claims a total. The Links tab shows its count only when the first page is complete, and Partial coverage gives no identifiers or counts.
- **Synthetic story.** SYN-PPO-DOC-000101 "Block C skid — installation notes" for SYN Northbank Nursery, SYN Northbank Block C: r01 reviewed, r02 returned, r03 reviewed on 9 October by Jordan Hale, linked to Project SYN-PPO-PRJ-000027, Asset SYN-PPO-AST-000311, the site, and Work order SYN-PPO-WO-000045 (still on r02). The flows on 15 October register SYN-PPO-DOC-000111 from job pack SYN-PPO-PACK-000066 r02, add r04 to DOC-000101, and record Jordan Hale's review after two findings close.

| ID | Departure | Reference or today's page |
|---|---|---|
| V1 | The accepted register and shared record layout replace PPO-DOCLIB-DES's six-tab workspace, 448 px dock and 292 px context column | PPO-DOCLIB-DES r01 (standalone HTML) |
| V2 | Register order is the backend's stable order: no column sort, totals or menu counts until Q2 is delivered | Other accepted registers sort and some show counts |
| V3 | No inline PDF viewer: issued job packs and reports download as exact PDFs, with Open issued job pack (Q4) | Not applicable |
| V4 | The rail keeps the current department with nothing selected; the Service operations rail is drawn | Not applicable |
| V5 | A new divider page "— Shared records —" in the Figma file; the File index notes that shared pages follow the departments | ADR-0055 lists department dividers only |

## 5. Not decided

- **Building the page.** Before or with the build: register sort (Q2) and a controlled type list (Q5). The page also needs names for customer, site, owner and linked records from existing reads, an "issues I can register" read (the output register read from PR #468, filtered by customer and site, is the candidate and is not yet confirmed), and the Revisions tab assembled from history unless a revisions read is added. History has no event-type filter and revisions have no comparison.
- **Not drawn yet:** linked documents on Project, Work order, Site and Asset pages (`GET /linked`); the Withdraw, Recover, Open a finding, Respond and Add a link forms (they follow the panel pattern); the Withdrawn view; DK-03 issue and distribution, DK-06 templates, SharePoint, bulk upload and browser editing; prototype links.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes; all 78 parent IDs remain.
- The `scope:DK-01` and `scope:DK-02` register entries link this design and its captures, and `route:/documents/[id]` records that it stays the issued job-pack page. Their visual status stays "Needs review".
- PPO-DOCLIB-DES and its retained r01 HTML and report stay unchanged as history; its rules stay authoritative where they agree with the backend contract, and its layout is superseded.
- A later change receives a new named version and a new capture revision folder.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma while drawing and fixed what was found: a deselected rail and tab icon whose glyph stayed navy and disappeared on the rail, a current-use strip that overflowed, clipped table cells and a collapsed source row. An audit of 2,307 text fills on the page found none whose stored colour differed from its bound variable and none that matched its background. The only cut text is the partly visible column at the edge of the scrolling register grid, as on the accepted Projects and Inventory registers. Claude cannot run Present mode through the connector, so no click-through was exercised.
- The eighteen captures are copies of the accepted frames with every Font Awesome icon instance swapped for `Icon/placeholder`. A scan after the swap found no Font Awesome instance left, and a second scan of 2,077 texts found no stored-colour mismatch and no text matching its background. They were exported at scale 1 with the Figma connector and inspected. The hashes are in the [captures README](../reference/ui/document-library/document-library-figma-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs`, `npm run studio:check` and `python3 scripts/build-ui-sequence.py --check` were run on this change; results are in its pull request.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
