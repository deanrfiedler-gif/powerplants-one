---
document_id: PPO-ES05-QUOTATION-RELEASE-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design, 30 October 2026; native implementation and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Quotation release design — owner decision

The release page is built: `QuotationRelease` in `src/components/quotation-release.tsx` at `/estimating/quotes/[id]/release`. Its earlier design is the ES-05 r02 HTML, with six views. It had no Figma design, and its record window is where the accepted Quotations and Quotation detail designs send people to prepare, approve, issue and send.

On 23 October 2026 Dean asked Claude to design the page in Figma as a proposal: "Your task is to design and build the Quotation release page (/estimating/quotes/[id]/release): preparation, approval, issue and distribution, in Figma as a proposal for my review." Claude drew it from these sources:
- the [native release decision](quotation-release-native.md) and the [ES-05 r02 design record](quotation-approval-issue-distribution-design.md), with its HTML and report;
- CM9 of the [estimating model](estimating-configurator-model.md) (appendices bound at preparation);
- the [quote view tracking decision](quote-view-tracking.md), section 4.1, and [ADR-0059](ADR-0059-email-sending-from-ppo.md) (Proposed) for sending and its outcomes;
- the accepted [Quotation detail](quotation-detail-figma-design.md), [Quotations](quotations-design.md) and [Output, issue and distribution](output-issue-figma-design.md) designs.

Dean accepted the design on 30 October 2026 with the words "Accept and lock in", answering "Do you accept the Quotation release design?" That answer adopts departures D1–D12 and the recommended answers to Q1–Q10.

Scope:
- Register entry `route:/estimating/quotes/[id]/release`, under `scope:ES-05`. The route is unchanged.
- Parent requirements EST-03, EST-07, EST-08, DOC-02, DOC-03 and DOC-05, and output OUT-06. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, sending, view tracking, customer page or customer message. Approved operative terms, financial thresholds and a real validity period stay Not configured.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page in Figma as a proposal | User decision, 23 October 2026 | Dean's brief, quoted above |
| Departures D1–D12 | Accepted as recommended, 30 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Date on the customer document | Resolved as recommended | The document carries the preparation date ("Prepared 5 Oct 2026"), because approval binds bytes made at preparation and issue adds no stamp. The issue time lives in the issue register. Quotation detail's document reads "Issued 7 Oct 2026"; that line is corrected when Quotation detail next changes. It is not edited here |
| Q2 Conflicts between the brief and the accepted pages | Resolved as recommended | The brief asked for r2 "prepared from estimate version 2", r1 "shown Returned" and "version 3 replaced version 2". The accepted pages say r2 came from v6, r1 from v4, and r1 was issued, negotiated and replaced. The accepted facts stand. Returned is drawn as an alternative story on r2, and the source change as v7 replacing v6 |
| Q3 Which appendices | Resolved as recommended | The accepted three stay: GA-0214 rev B, which is the layout drawing, and two datasheets. The brief's "Screen system workbench layout drawing" is not used, because the story is a potting machine |
| Q4 Who may approve, and above what value | Resolved as recommended | A named Quotation approver duty, held by someone who is not the quotation owner, preparer, estimate author or that revision's issuer. One approver for every value until financial thresholds are configured (D-010). No threshold is invented |
| Q5 Can the deal owner also issue | Resolved as recommended | Yes, issue and send, when they neither prepared nor approved the revision. Without a deal owner, an estimator with the issue duty issues |
| Q6 Which workbench documents are customer-eligible | Resolved as recommended | Only documents marked CustomerEligible in a workbench run that the estimate version traces to (CM9). Internal costing, supplier quotations and drafts are never offered. Drawing status follows CM9 Q5 |
| Q7 Approval requests in My Work | Resolved as recommended | Yes, through Reviews & handovers: one My Work item for the named approver, cleared when decided or withdrawn. The preparer sees the outcome there |
| Q8 Does every contact change hold issue | Resolved as recommended | Only changes to fields the document prints (name, role, email, address) hold issue and need a successor. Other changes show for information |
| Q9 The Send composer on two pages | Resolved as recommended, with a finding | Whichever page is accepted first sets the composer. The Quotation page & customer views page was accepted the same day. At lock-in its composer content (`2229:471`, `2229:1378`) was compared text by text with this page's copies and is identical, so no frame changed on either page. The tab row around the composer belongs to this page |
| Q10 Issue and send on the phone | Resolved as recommended | Not in this stage. The phone covers approval; issue and send stay on desktop and tablet until a phone composer is designed |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, page "Quotation release · ES-05" `2244:50245` (after Quotation detail `2142:82`), at the named version "Quotation release — shared record layout, accepted", which Claude saved on 30 October 2026 when Dean said "You save it". The file's link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Desktop 1440 | Overview `2245:2760` (flow start "Release — desktop"); preparing r2 with appendices `2245:743935`; exact output preview and Request approval `2245:744414`; approval, approver view `2245:756521`; preparer blocked `2245:757067`; returned with a reason `2245:757521`; issue recheck `2245:768366`; r2 issued, with the issue register `2245:768736`; source changed after approval `2245:769106`; Send composer `2245:784148`; sent `2245:784344`; send outcome unknown `2245:784732`; revisions `2245:785076` |
| Tablet and phone | Tablet 1024 approval, full length `2245:806154`; phone 390 approval `2245:806574` (flow start "Release — phone"), Approve sheet `2245:806755`, Return sheet `2245:806972`; phone 320 approval `2248:770497`, Approve sheet `2248:770678`, Return sheet `2248:770895` |
| States | Loading `2252:767511`, not found or no access `2252:767785`, stale `2252:768007`, Output failed `2252:768376`, tracking off `2252:768749`, recipient contact changed `2252:768943` |
| Notes card | `2253:7907`: story, D1–D12 with their basis, Q1–Q10 with the adopted answers, kept rules, what is not drawn and the flows |
| Shared parts | Record / Header, View tab, Banner and Criterion row; Quotation detail / Lifecycle step; Grid / Header cell, Cell and Checkbox; Tag; Button; Send / Option row and Switch; Shell / Phone header · compact; the Sales and Estimating rails; the top bar with the Conversations action (badge 3), detached as on the other designs. No new component |
| Prototype | Flows "Release — desktop" and "Release — phone", with 26 links |
| Retained captures | [Quotation release design r01](../reference/ui/estimating/quotation-release-design-r01/README.md): 26 icon-free PNGs at exact frame size, with hashes. The capture copies are on the Captures page from y = 569,000; the File index row is `2771:549735` |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-05`, `route:/estimating/quotes/[id]/release`; parent requirements EST-03, EST-07, EST-08, DOC-02, DOC-03 and DOC-05 and output OUT-06, unchanged. No capability is proposed |
| Page type (r20) | Review / comparison, with a Document & evidence workspace and a Register / worklist for the issue register and revisions. Phone: one record page with the compact record header and a sticky action bar |
| Reused components | Section 2, shared parts. The Send composer is copied unchanged from the Quotation page |
| Incoming handover | A saved estimate version and its ES-04 review decisions, CM9 customer-eligible workbench documents, current customer, contact and site versions, template and non-operative terms. Opened from Quotation detail (Open release), the Quotations record window, Reviews & approvals and My Work |
| Outgoing handover | The approval request to Reviews & approvals and My Work; the exact issue (retained HTML and PDF manifest) to Quotation detail and the customer quotation page; the send outcome to Distribution, Quotation detail and the deal; Record response to ES-06. Never acceptance, conversion, or Delivered without evidence |
| States shown | Section 4 |
| Departures | Section 4 |
| Verification | Section 6 |

## 4. What the design shows

The story is synthetic. SYN-PPO-QUO-000188 r2 is Option A of deal SYN-PPO-OPP-000326 "Potting machine and take-off" at SYN Woodhaven Nursery, Potting Shed 2, contact Jamie Ellis, $81,200.00 excluding GST. Alex Lee is the quotation owner and preparer, Morgan Patel the approver, and Sasha Clarke the deal owner, issuer and sender. These facts come exactly from Quotation detail: r2 from SYN-PPO-EST-000214 v6, prepared Mon 5 Oct 11:10, approved Tue 6 Oct 16:30 against output `9c41…7e0b`, issued Wed 7 Oct 16:20, sent Mon 12 Oct 15:02; r1 at $78,900.00 from v4, issued Thu 24 Sep, Negotiation Tue 29 Sep, replaced Wed 7 Oct; appendices A GA-0214 rev B, B potting machine datasheet, C take-off conveyor datasheet. Every frame names its moment, and frames for "today" read as at Tue 13 Oct 09:12, so the 09:12 view matches Quotation detail.

Invented here: the approval request at 11:12, v6 saved Fri 2 Oct 15:40, the ES-04 approval dates, customer, site and contact version numbers, appendix hashes, the site photographs document, r1's fingerprint `3be7…a912`, operation IDs, and every alternative story (Returned, estimate v7, contact v4, Output failed, Not confirmed, request withdrawn). No existing reference is renamed.

### Departures, accepted

| ID | Departure | Basis |
|---|---|---|
| D1 | The r02 standalone six-view workspace moves onto the shell and shared record layout: Record / Header, the four release steps from the Quotation page, and six tabs that keep r02's views (Overview, Source & output, Approval, Issue register, Distribution, Revisions). A 360 px side column replaces r02's 292 px column, with no app masthead | HTML conformance standard (the shell owns navigation); route contract; r02 report §3 |
| D2 | Overview answers four questions on one tab: where r2 stands, what it is bound to, who acts next and what blocks it. The non-operative notice comes first | Route contract: "Put non-operative conditions before decisions" |
| D3 | Preparation is four numbered cards (estimate version and alternative, recipient and site, template and terms, appendices), then Generate exact output and Request approval. The preview shows the exact HTML, with the appendices as chips | Release decision; CM9 |
| D4 | Request approval names one approver and says who is not offered and why: the preparer, quotation owner and estimate author, and the issuer, because an approver cannot issue | Release decision, policy `SYN-ES05-01` |
| D5 | Approval shows the frozen output and fingerprint, a source summary, the ES-04 findings, r02's three confirmations and a decision note. Approve stays unavailable until all three are confirmed. Return needs a reason and keeps r2 unchanged | r02 report §8; release decision |
| D6 | The preparer sees "You prepared this: you cannot approve it", with Withdraw request and Remind. Approve and Return are not shown to them | Dean's brief; release decision |
| D7 | Issue starts with a five-row recheck (sources, approval, customer, site and contact, template and terms, authority). The issue register lists every issue with revision, time, issuer, fingerprint and state, with evidence downloads | Release decision; accepted Outputs DK-03 pattern; r02 report §9 |
| D8 | Distribution reuses the Send composer unchanged. After sending, the send outcome, delivery and customer views are three separate facts. "Not confirmed — checking Sent items" keeps the original operation and blocks sending again | Quote view tracking §4.1; ADR-0059 delivery states; Quotation detail D6 |
| D9 | A source change after approval and a changed printed contact each hold issue, with explicit resolutions. Nothing refreshes silently. The source change offers a review by the approver or a successor revision; the changed contact needs a successor | Release decision; Dean's brief: "The approval is invalid until re-reviewed" |
| D10 | Revisions lists each revision's dated facts, with "No approval carried over · no response carried over" on the successor | Release decision; Quotation detail Revisions tab |
| D11 | Tablet: collapsed rail, cards stacked in one column, side cards in a row. Phone, for the approver on the go: compact record header, release steps list, reflowed document, sticky Return and Approve r2 bar at 48 px, sheets with 16 px inputs and 48 px targets | Route contract, Mobile; phone header amendment P1–P9 |
| D12 | The preview and approval frames show the document dated "Prepared 5 Oct 2026" (Q1) | Release decision; r02 report §7 |

### Rules kept on every frame

The preparer never approves. No send is shown without a real outcome. No approval or response carries to a successor. Operative terms are never shown as configured.

## 5. Not decided and not drawn

- **Building the page.** Today the page records a simulated distribution with no send button, and preparation has no appendix step. Appendices need build step B5 of the estimating model. Real sending needs ADR-0059 accepted and QV-S2. Customer views need QV-S1, and tracking stays off until Dean confirms the privacy notice. Each needs its own authorisation and pull request.
- **Differences from the running rules that a build must settle.** The release decision holds a changed source until a deliberate successor; D9 adds the approver's review as a second way to clear it, and Q8 limits contact holds to printed fields. Both need the [release contract](../contracts/quotation-release.md) amended when they are built. Q4's approver duty is a design answer, not an operational delegation.
- **Not drawn:** the Withdraw request dialog; Compare v6 and v7; issue and send on the phone; the Reviews & approvals and My Work items themselves, because those pages were not edited; keyboard order, focus and 200% zoom.
- **Related records not edited:** Quotation detail's "Issued 7 Oct 2026" line (Q1), and the Quotation page's composer frames, which keep no tab row (Q9).

## 6. Verification

- Every text uses Roboto or Roboto Mono, and every text colour is bound to a PPO colour variable (2,433 texts when checked on 23 October). A scripted check found no overlapping frame and nothing outside its section. Each frame was screenshotted and inspected.
- The prototype has 26 links and two flows. It was not played in Present mode before acceptance, and the Approve button on the phone sheets links nowhere.
- The 26 captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`; a check after the swap found no icon instance left. They were exported at scale 1 with the Figma connector. Hashes are in the [captures README](../reference/ui/estimating/quotation-release-design-r01/README.md).
- Nothing is built to this design, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
