---
document_id: PPO-DK03-OUTPUTS-FIGMA-DEC
date: 2026-10-15
owner: Dean Fiedler
status: Owner-accepted design; native implementation, the read additions (Q4, G2) and UI baseline acceptance separate
source_commit: fae5b0e2480500fac8f90f3cce8dd35b2a7b889f
versioning: git
---

# Output, issue and distribution design — owner decision

On 15 October 2026 Dean asked for the next Figma page and expected DK-03. Claude confirmed it: the output register backend ([PR #468](https://github.com/deanrfiedler-gif/powerplants-one/pull/468), [decision](output-issue-register-backend.md)) and the controlled output actions ([PR #469](https://github.com/deanrfiedler-gif/powerplants-one/pull/469), [decision](output-actions-backend.md)) had merged, there was no page at `/documents/issues`, and no Figma page, File index row, branch, open pull request or running session covered it. DK-06 and PJ-05 were less blocked on design. The 17 September standalone design ([PPO-DK03-DES](output-issue-distribution-design.md)) had never been accepted. Claude drew the page from the accepted Document library and Job pack patterns, using PPO-DK03-DES for its rules and vocabulary only. Dean accepted it the same day: "Proceed with your recommendations." The design reference is the named Figma version "Output, issue and distribution — accepted".

Scope: `scope:DK-03` "Output, issue and distribution centre", parents DOC-01 to DOC-06, outputs OUT-09 (Job pack) and OUT-10 (Service report), tracing AT-07, AT-13, AT-20 and AT-36. No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Accept the design and its recommendations | User decision, 15 October 2026 | "Proceed with your recommendations." Every recommendation on the notes card is adopted and each open question takes its recommended answer |
| R1 Routes and label: the register at `/documents/issues`, the record at `/documents/issues/job-packs/{id}` and `/documents/issues/service-reports/{id}`, an earlier issue by `?issue={id}`; app label "Outputs" | Claude's recommendation, adopted | The register key's route is `/documents/issues`. The exact detail read needs the family (`kind`), and output IDs stay unique across families. The scope title stays "Output, issue and distribution centre" |
| R2 Outputs is a second Documents page under More › Shared records, with an "Other document pages" group in the side menu | Claude's recommendation, adopted | `src/shell/navigation.ts` files `documents` under "Shared records" in More. The accepted [Document library design](document-library-figma-design.md) needs the same group added when it is built. The rail keeps the current department with nothing selected |
| R3 Views and filters map one-to-one to the read | Claude's recommendation, adopted | Views All outputs, Issued, Not issued, Preparing and Exceptions (`view`); Family (`kind`), Customer, Site and Service owner filters; reference search (`q`). No menu counts and no column sort. A total shows only when every selected family is Complete (`total_matching`); otherwise the window count and coverage |
| R4 Record view tabs follow the reads | Claude's recommendation, adopted | Issue (exact bytes and issue facts), Issue history, Distribution (recipients, acknowledgements or report responses, synthetic attempts) and Preparation (internal only). Crew see the Issue tab and their own recipient row |
| R5 One short centred dialog per native command | Claude's recommendation, adopted | Request issue, Recover issue, Withdraw pack and Prepare, Record and Reconcile distribution. Each names what it binds to (issue, hash, record or attempt version) and the refusal it may meet. No bulk actions |
| R6 Distribution words: Prepared, Simulated sent, Simulated not sent, Outcome unknown | Claude's recommendation, adopted | The ledger's channel is Synthetic and refuses Sent and Delivered (422). Outcome unknown blocks another attempt for that recipient and issue until reconciled; reconciling adds an event and keeps the unknown one |
| Q1 Record route | Resolved by "Proceed" | The family in the path (R1), not `?kind=` |
| Q2 App label | Resolved by "Proceed" | "Outputs". "Issues and distribution" pushed the account menu out of the record's top bar at 1440 |
| Q3 Prepare for every recipient at once | Resolved by "Proceed" | Not now. The backend takes one recipient per command with one unresolved attempt each; a bulk action would hide per-recipient refusals |
| Q4 Revision numbers and acknowledgement progress in the register | Resolved by "Proceed" | Add them to the read before the build (gap G3). Until then rows show issue times only |
| Q5 Withdraw pack on this page | Resolved by "Proceed" | Yes, in the record's More menu only, with the native wording. Service reports keep their native amendment process |
| Q6 Crew use of the page | Resolved by "Proceed" | No. Crew keep My jobs and the job pack page; Outputs is for issuers and Service owners. Crew reads stay as the backend allows |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Output, issue and distribution — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Output, issue and distribution · DK-03" `770:42`, under the divider "— Shared records —" `744:2608`, after Document library. Its header `770:43` holds the conformance declaration and its notes card `786:6154` lists the scope, story, recommendations, answers, backend gaps, what is not drawn and the inherited shell finding. File index row `787:42` |
| Accepted frames | Desktop: register `771:185612`, register with snapshot `772:187879`, Job pack record Issue `775:1723`, Issue history `777:2049`, Distribution `777:2475`, Preparation `778:2575`, Service report record Distribution `778:3003`. Flows: 1a prepare distribution `779:3120`, 1b record simulated outcome `779:3279`, 1c outcome unknown `779:3731`, 2a reconcile `779:4846`, 2b Simulated sent `779:5008`, 3a request issue `780:4991`, 3b recover original job `781:5110`, 3c r01 issued `781:5514`. Tablet: record `783:5397`. Phone: register `783:5907`, record `784:5924`, 320 px exact output unavailable `784:6085`. States section `770:103` (28 cards) |
| Page components | Output grid row `771:75` (Default, Hover, Selected) and header `771:130`, Output list row (phone) `771:148`, Distribution attempt card `776:2153` (Prepared, Outcome unknown, Simulated sent, Simulated not sent) |
| Cloned and shared parts | Document library register `746:173857`, snapshot `747:4261`, record `748:1898`, tablet `758:8317`, phones `759:5834`, `759:6377`, `760:6116`, review dialog `758:5383`, states cards and notes card `761:6220`. Rail · Service (proposal), Shell / Top bar, v2 menu items and headings, Grid cells, Checkbox and Row actions cells, Tag, Button, Record / Header, Field, Section heading, Banner, History item, Readiness bar and Check item, View tab `312:16`, Job pack / Form field and the dialog scrim |
| Retained captures | [Output, issue and distribution design r01](../reference/ui/output-distribution/output-issue-figma-r01/README.md): twenty icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:DK-03` (primary), parents DOC-01 to DOC-06, outputs OUT-09 and OUT-10. Routes `/documents/issues` and `/documents/issues/{family}/{id}` (R1, Q1). Capabilities unchanged: `pack.read`, `pack.prepare`, `pack.check`, `pack.issue`, `report.read`, `report.issue` and `service.work_order.edit`; no new grant |
| Page type (r20) | Register / worklist (the output register); record detail with a Document & evidence workspace in view tabs (the exact issue); short decision dialogs for the six commands |
| Reused components | Section 2. New page components: the Output grid row and header, the phone list row and the Distribution attempt card |
| Source authority | The [register decision](output-issue-register-backend.md) and [contract](../contracts/output-register.md), the [actions decision](output-actions-backend.md) and [contract](../contracts/output-actions.md), `src/outputs/model.ts`, `reads.ts`, `actions.ts` and `distribution.ts`, migration 0091; PPO-DK03-DES for rules and vocabulary; the register entry `scope:DK-03`. Fixture: synthetic outputs, issues, recipients, people, customers and sites |
| Incoming handover | Native Job Pack and Service Report records and their exact issues, through `GET /api/v1/document-outputs` (permission-filtered, at most 200 visible outputs per family), its exact detail and the action context. Preparation, check, review and responses stay on `/service/packs/{id}` and `/service/reports/{id}`. Customer, site, people and recipient names come from the existing customer, site and people reads, because the output reads return IDs |
| Outgoing handover | Commands forwarded unchanged to the native services through `POST /api/v1/document-outputs/{id}/actions`. Exact PDF, HTML and manifest links enforce their own permission. The page never sends anything to anyone, never records Delivered, never copies an acknowledgement or response to a successor issue, never amends a report and never authorises work |
| States shown | Register; snapshot; Job pack record Issue, Issue history, Distribution and Preparation; Service report Distribution; the three flows; tablet; phone register and record; exact output unavailable at 320 px. The board covers loading, nothing in this view, no matches, bounded result, partial coverage, denied, access changed during the read, read failed, crew view, exact output unavailable, earlier issue selected, withdrawn pack and every refusal the commands return: PackNotReady, StaleSource, ReportNotReviewed, TemplateChanged, TemplateUnavailable, RenderAlreadyRequested, WorkerLeaseChanged, StoredOutputConflict, ExactDocumentUnavailable, withdraw refused, IssueNotCurrent, IssueNotApplicable, ExactOutputUnavailable, DistributionRecoveryRequired, DistributionTransitionRefused, VersionConflict, OperationConflict, an uncertain result and an unsupported Sent or Delivered outcome |
| Departures | Section 4 |

## 4. Display rules and departures

- **Separate facts.** Preparation (the native render job), issue (a retained current-issue pointer), exact bytes (checked when the record is read), applicability (Job packs only), synthetic distribution, acknowledgements and report responses are separate columns, checks and sections. "Issued" is a retained pointer, not approval for use, so a withdrawn pack still appears under Issued.
- **Issue facts strip.** The record shows current issue, current revision, exact bytes available and, for Job packs, applicable to crew and schedule, labelled "Issue facts, not permission to send". Commands revalidate everything themselves. Reports show no applicability claim.
- **Coverage.** Each family keeps at most 200 visible outputs, newest update first. The footer states the count and whether each family is Complete; a bounded family shows the window count and never a complete total. A family the user cannot read gives no count or identifier. Paging is live.
- **Exact bytes.** The register never opens files. The record's PDF, HTML and manifest rows show bytes and SHA-256 from the retained manifest; reading them records no Opened or Downloaded event. Missing bytes keep the issue's identity and metadata, are never regenerated and are restored by the storage owner.
- **Distribution.** Every attempt is Synthetic and its real sent and delivered times read "Not recorded". Each attempt card lists its immutable events by version with actor, time, reason and evidence. Prepared, Outcome unknown and Simulated sent block another attempt for the same recipient and issue; Simulated not sent permits one. Native task, open, download and acknowledgement events stay native history.
- **Earlier issues** are viewed explicitly from Issue history, keep their own bytes, recipients, acknowledgements and responses, and are never current again. Crew see only the selected issue.
- **Service reports** show the frozen issued recipient, "Not recorded by source" for distribution and only Report content responses bound to the exact issued presentation. Attendance acceptance is a separate record.
- **Synthetic story.** SYN-PPO-PACK-000066 for SYN Northbank Nursery, SYN Northbank Block C, work order SYN-PPO-WO-000045, appointment SYN-PPO-APT-000231, Service owner Jordan Hale: r01 issued 9 October, r02 issued 14 October at 16:05 and current, recipients Riley Tran (acknowledged r02) and Casey Ward. Service report SYN-PPO-RPT-000162 on the same work order, issued 13 October to Avery Brooks and Accepted with reservations. The 15 October flows: Morgan Lee prepares an attempt for Casey Ward and records Outcome unknown, then reconciles it as Simulated sent; requests issue for SYN-PPO-PACK-000059, recovers its failed original job and r01 is issued at 10:51. Register rows reuse the accepted Job pack page's numbers and states where they exist.

| ID | Departure | Reference or today's page |
|---|---|---|
| V1 | The accepted register and shared record layout replace PPO-DK03-DES's six views, 448 px dock and 292 px context column | PPO-DK03-DES r01 (standalone HTML) |
| V2 | Register order is the backend's newest-update order: no column sort and no menu counts; a total only when every selected family is Complete | Other accepted registers sort and some show counts |
| V3 | No Sent or Delivered state: distribution is Synthetic and real times read "Not recorded" | PPO-DK03-DES modelled channels with delivered evidence |
| V4 | The app label is "Outputs", and both Documents pages get an "Other document pages" side-menu group; the accepted Document library needs the group at build | The Document library side menu has no page group |
| V5 | The rail keeps the current department with nothing selected; the Service operations rail is drawn | As in the Document library design |

## 5. Not decided

- **Building the page.** Before or with the build: revision numbers, recipient counts and acknowledgement progress in the register read (Q4, G3); names for customer, site, Service owner, recipients and actors from the existing reads (G2); and the Documents side-menu group on both pages (R2).
- **Backend gaps.** G1, a defect candidate: `src/outputs/distribution.ts` accepts appointment states Confirmed and "Started", but appointments use InProgress, so preparing distribution for an in-progress visit is refused (IssueNotApplicable) while the detail's `pack_applicable` reports the issue applicable. A separate fix was proposed; it is not part of this decision. G2: the reads return IDs for people and places, issue history and jobs return revision IDs rather than numbers, and issue events carry no actor. G3: no revision number or acknowledgement progress in the register. G4: no sort beyond newest update, no read of attempts across outputs (an "unknown outcomes" queue), and no manifest size in the detail. G5: reports have no review flag and no applicability claim.
- **Not drawn yet:** the withdraw-pack dialog, the Simulated not sent and Prepare again path (its card state is drawn), the Exceptions and crew views as frames, issue comparison, an HTML viewer and prototype links; other output families, live delivery providers, SharePoint, customer communication and DK-06 template administration.
- **Inherited shell finding.** At 1024 px the shared Shell / Top bar is wider than the frame (its search is fixed at 403 px), so the account menu falls about 66 px outside, as it does on the accepted Document library tablet. The fix belongs to the Shell page.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes; all 78 parent IDs remain.
- The `scope:DK-03` register entry links this design and its captures. Its visual status stays "Needs review".
- PPO-DK03-DES and its retained r01 HTML, report and evidence stay unchanged as history. Its rules stay authoritative where they agree with the backend contracts; its layout is superseded.
- A later change receives a new named version and a new capture revision folder.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma while drawing and fixed what was found: a breadcrumb that pushed the account menu out of the top bar (now "Outputs"), clipped outcome options and attempt tags, a search placeholder written into the top bar, and a column too narrow for its button. An audit of 2,492 text fills on the page found none whose stored colour differed from its bound variable. The only text below 3:1 contrast is the shell's breadcrumb separator, as on the accepted pages, and the only cut text is the partly visible column at the edge of the scrolling register grid. Claude cannot run Present mode through the connector, so no click-through was exercised.
- The twenty captures are copies of the accepted frames with all 717 Font Awesome icon instances swapped for `Icon/placeholder`. A scan after the swap found none left, and a second scan of 2,325 texts found no stored-colour mismatch and no text matching its background. They were exported at scale 1 with the Figma connector and inspected. The hashes are in the [captures README](../reference/ui/output-distribution/output-issue-figma-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs`, `npm run studio:check` and `python3 scripts/build-ui-sequence.py --check` were run on this change; results are in its pull request.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
