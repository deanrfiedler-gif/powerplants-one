---
document_id: PPO-DK03-REPORT
title: DK-03 — Output, Issue & Distribution Centre — detailed design report
revision: r01
date: 2026-09-17
owner: Dean Fiedler
project: Powerplants One
status: Standalone design and its executed verification; owner acceptance and application integration remain separate
scope_id: DK-03
language: en-AU
---

# DK-03 — Output, Issue & Distribution Centre

This report describes what the r01 HTML actually does. It is written after the build and its verification, so every count, rule and limitation below was read from the delivered artifact rather than from the build plan. Where the plan proposed something that the build did not deliver, this report says so.

The delivered file is [`PPO-Output-Issue-and-Distribution-Centre-r01.html`](PPO-Output-Issue-and-Distribution-Centre-r01.html), 247,871 bytes, SHA-256 `91252dd5b550d465478ac9eb41aa8d93a1efa9c3e573cfc393d8480d0ad1af7b`. It is self-contained: it makes no font, image, analytics or provider request, and a browser check asserts that.

**Contents**

1. [What the package answers](#1-what-the-package-answers)
2. [Scope and design conformance](#2-scope-and-design-conformance)
3. [Verified source baseline](#3-verified-source-baseline)
4. [Preview profiles and the capability model as built](#4-preview-profiles-and-the-capability-model-as-built)
5. [The six views](#5-the-six-views)
6. [Synthetic fixture catalogue](#6-synthetic-fixture-catalogue)
7. [Fact model as implemented](#7-fact-model-as-implemented)
8. [Content identity, bytes and the PDF boundary](#8-content-identity-bytes-and-the-pdf-boundary)
9. [Readiness and domain review](#9-readiness-and-domain-review)
10. [Release, original operations and recovery](#10-release-original-operations-and-recovery)
11. [Distribution, responses and how every summary count is calculated](#11-distribution-responses-and-how-every-summary-count-is-calculated)
12. [Exceptions and recovery as built](#12-exceptions-and-recovery-as-built)
13. [Revision, supersession and withdrawal](#13-revision-supersession-and-withdrawal)
14. [Interaction, accessibility and persistence](#14-interaction-accessibility-and-persistence)
15. [Verification actually executed](#15-verification-actually-executed)
16. [Limitations and what is not claimed](#16-limitations-and-what-is-not-claimed)
17. [Module handovers](#17-module-handovers)
18. [Local verification case index](#18-local-verification-case-index)
19. [Source register](#19-source-register)

## 1. What the package answers

The workspace answers four questions about any output in scope: **what exact document was produced, what authorised it for its stated purpose, who received that exact revision, and what action is still outstanding.**

It does that by keeping generation, domain review, issue currency, distribution and recipient response as separate facts rather than one status field. The principal demonstration follows a revised irrigation drawing through an affected job pack: a reviewed drawing r03 exists, the issued pack r04 still references drawing r02 and does not update by itself, a successor pack r05 is drafted, checked by the owning domain, prepared, interrupted at finalisation, recovered against its original operation, released once, distributed per recipient with one delivered and one unknown outcome, reconciled, and finally acknowledged by one technician — while pack r04 keeps its own bytes, recipients and two original acknowledgements.

## 2. Scope and design conformance

| Field | Content |
|---|---|
| Scope identity | DK-03 — Output, issue and distribution centre, an existing P1 page in the [HTML Page Coverage Register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) with DK-01 as its recorded dependency. Parents DOC-01–DOC-06; outputs OUT-02, OUT-06, OUT-08–OUT-14 from BP-01 §16. No new module, domain or requirement identity is created. |
| Page type | r20 **Document & evidence workspace**, supported by Work queue + persistent detail (output queue and docked snapshot), Register / worklist (queue table), Review / comparison (readiness table and revision comparison) and short Form / guided workflow interactions (eleven dialog forms). |
| Reused components | r20 tokens, typography, controls, tabs, tables, pills, callouts, metrics, dialog and snapshot primitives through `docs/design/supplier-pricing/fonts.css` and `docs/design/supplier-pricing/workspace.css`, both hash-pinned. The DK-01/DK-02 document workspace supplied the docked-snapshot, record-toolbar, document-paper and timeline patterns, which this module re-implements in its own module stylesheet rather than importing from an unmerged branch. |
| Source authority | SharePoint remains the intended business-document authority; native CAD tools retain authoring and file dependencies; MYOB Acumatica remains the intended ERP authority. Every provider identity, contact, document and hash source in the file is fictional. |
| Incoming handover | A permitted business record, its exact source and template identities, the selected scope, the review evidence, the intended issue purpose, the approved audience and the source availability. |
| Outgoing handover | The exact output and issue manifest with real byte counts and content identities, the domain-owned release result, per-recipient distribution evidence, exact response references and owned follow-up that stays **Prepared locally**. |
| Declared new composition | Six coordinated views, separate operation/issue/recipient facts, an output bundle manifest with computed content identity, and an owned recovery workspace. These are proposed DK-03 arrangements, not an accepted UI baseline change. |
| Exceptions and recovery | Missing exact item, source changed after preparation, domain release policy not configured, finalisation outcome unknown, distribution outcome unknown, distribution failed, unsupported delivery evidence, failed local save, cross-tab conflict and malformed local state are all implemented and demonstrated. |
| Departures | Three, listed in [§16](#16-limitations-and-what-is-not-claimed): a self-contained SHA-256 in the model, an optional browser executable override in the native check, and no committed binary screenshots in this contribution. |
| Verification | 38 model groups and 36 native browser groups passed with no page or console errors; 41 captures produced at five widths plus a short viewport. Recorded in [§15](#15-verification-actually-executed). Owner acceptance, device and screen-reader testing, provider evidence and application integration remain separate. |

## 3. Verified source baseline

| Source | Position used |
|---|---|
| Repository and branch | `deanrfiedler-gif/powerplants-one`; `main` inspected at `a5406a81c02d37c4a23e75c1b71c7653fcec0d80` (merge of #224, Application Shell r17), 17 September 2026. #221 (ES-10) merged during the build, so the shared index, register and STATUS edits were re-applied onto `81b0d401edc1c2ea31e5440c3416befe335219e3` and every pinned source was re-checked against it, unchanged. |
| Open contributions at inspection | #212, #215–#217, #220, #221, #223, #225–#228 were open. DK-01/DK-02 (#226, head `eba0f3842639c2bbdf86e3af8f12d319c9f37071`) is a design reference for this package, not a file dependency: this branch is cut from `main` so the two contributions can be reviewed and merged independently. |
| STATUS | Read. It retains a 14 September aggregate baseline and does not yet record #222 or #224. Live commit evidence takes precedence for publication facts; the historical status text is not rewritten by this contribution. |
| Document controls | [Document, issue and distribution contract r07](../../../contracts/document-issue-distribution.md) supplies the retained semantics: reserved output-preparation time against actual issue time, immutable issue events, storage-success/finalisation-failure reconciliation, per-recipient distribution facts, explicit response evidence and the rule that a missing source version is never replaced by the latest file. |
| Output catalogue | [BP-01 §16](../../../blueprints/BP-01-master-blueprint.md#16-documents-knowledge-and-communications), DOC-01–DOC-06 and OUT-01–OUT-18. Only existing OUT identifiers are used. |
| Visual reference | [Theme & Style Board r20](../theme-style-board/powerplants-one-theme-style-board-r20.html), SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. |
| Package discipline | [HTML module conformance standard](../../../standards/html-module-conformance.md) r01. |
| Naming | [PPO-STD-001 r04](../../../standards/naming-conventions.md) and ADR-0005. |

The full pinned source set with hashes is in [`source-manifest.json`](../../../design/output-distribution/source-manifest.json); the builder refuses to assemble if any pinned source has changed.

## 4. Preview profiles and the capability model as built

The profile switcher exists only in the demonstration controls. These profiles illustrate behaviour. They appoint nobody and confer no operational authority, and they are not authentication — every fixture in the file is readable by anyone holding the file.

| Preview profile | Permitted classifications | Permitted actions | Outputs visible at reset |
|---|---|---|---|
| Output coordinator · Alex Morgan | Internal technical, Service, Commercial, Project, Internal cost | Prepare follow-up, create successor, prepare output, recover preparation | 9 |
| Domain reviewer / issuer · Sam Taylor | Internal technical, Service, Commercial, Project | Review draft, release issue, withdraw issue | 8 |
| Distribution coordinator · Jordan Lee | Internal technical, Service, Commercial, Project, Internal cost | Prepare distribution, simulate attempt, reconcile outcome, record response | 9 |
| Service technician · Riley Chen | Service, restricted to North Site and to the job pack record | Record response, for its own assignment only | 1 |
| Finance reviewer · Morgan Ellis | Restricted finance, Service | None | 3 |
| Read-only viewer · Casey Brook | Internal technical, Service, Project | None | 7 |

The model distinguishes reading metadata, reading content, preparing, reviewing, issuing, distributing, recording a response and recovering an operation. Opening DK-03 grants none of them by itself: the coordinator cannot release, the issuer cannot prepare, the distributor cannot review, and the technician can record only its own assignment response. Where an action is unavailable the control is disabled and the surrounding text says which profile owns it.

Self-review is prevented structurally rather than by policy guesswork: the domain decision is refused when the reviewer is the actor who created the draft. Where a fictional release rule does not exist, the readiness check reads **Not configured** and the affected action is unavailable.

## 5. The six views

### 5.1 Output queue

Defaults to **Needs attention**, which is the set of permitted outputs that have an open exception, a recipient without a response, or a preparation position other than a settled issued record. The other views are All permitted outputs, My outputs, Awaiting domain review, Ready for preparation or release, Awaiting response and Exceptions. They are filters over the same permitted records, not separate copies.

Search covers title, readable reference, customer, site, location, linked work/project/deal record, output type, type name, domain and owner. Advanced filters cover originating domain, output type, owner, customer, site, classification and issue state. The issue-state filter matches an output that holds an issue in that state, so Superseded finds the drawing transmittal and Withdrawn finds the commissioning record rather than returning nothing. The summary line always states both numbers — *"8 matching outputs · 9 permitted in this preview"* — so a filtered count is never mistaken for the population.

Columns are Output (title, reference, OUT type and location), Customer / site, Revision and purpose, Preparation position, Distribution and response, and Owner with the next action. Less frequently used identifiers live in the snapshot rather than the table. Selecting a title opens a 448 px docked snapshot; **Open full detail** moves to the record view and preserves the queue scroll position on return.

While a read is loading, empty or failed, the metrics and the table are removed entirely rather than displaying zero, and an explicit recovery control is offered. A browser check asserts that no metric is rendered in those states.

### 5.2 Output and issue detail

The output reference, OUT type, content revision, issue reference, issue purpose, owning domain and classification appear above the preview. **Current**, **Superseded** and **Withdrawn** are shown outside the document bytes, with an explanation that the retained bytes, recipients and responses of that issue are unchanged and that current-use authority does not transfer.

The evidence panel separates the business revision, issue purpose, authorising decision, issuer, **output preparation time**, **actual issue time**, reserved issue identity, classification and template version. The selected source basis is a separate panel, and linked records a third.

The bundle manifest is a table close to the preview: each item carries its own identity, title, revision, purpose, availability, format, real byte count, content identity and per-item Preview and Download controls. A missing item shows **Missing exact item**, no byte count and **No content identity**, with both controls disabled. One row always states that no controlled PDF rendition is included and that browser print is not an approved controlled PDF renderer.

### 5.3 Readiness and domain review

Readiness is an explanation, not a score. Each row shows the check, its status, the reason, the evidence reference, the owner and the action. Statuses are **Met**, **Needs action** and **Unknown**; an unknown source or an unconfigured rule is never counted as passed, and no completion percentage appears anywhere in the view. A browser check asserts that.

For the job pack the view renders eleven rows: source availability; exact source and review basis; template identity and version; applicable domain policy; intended issue purpose; three required-evidence rows drawn from the output's own evidence set; audience and classification; unresolved blocking changes; and the domain review decision.

Below the evidence, the successor and release sequence exposes exactly the steps that apply — create successor draft, open domain review, prepare exact output, recover original operation and record domain issue — each disabled until its own preconditions hold and each labelled with what it will do. A **Returned** decision is retained and closes its own draft: the sequence then offers a fresh successor draft, and the returned draft and its decision both stay in the record. **Open domain review preview** shows a labelled, domain-specific panel: the Estimating panel states the approved commercial basis and the ES-06 response boundary; the Engineering panel states that issued for review, issued for construction and issued for procurement are separate authorisations; the Service panel states appointment, readiness and the rule that acknowledgement is not work authority; the Projects panel states the reporting cutoff and that a stakeholder receipt is not project acceptance; the Finance panel states the quantity basis and that OUT-14 has no customer route. No universal approval threshold is invented.

### 5.4 Distribution and responses

One card per exact issue and recipient context, showing contact identity, organisation, role or assignment, approved destination, channel, current attempt outcome, the supported evidence for that outcome, the open and download position, and the recorded response. Expanding a card exposes every original attempt with its own evidence, and a reconciliation appears as an additional record beneath the attempt it explains rather than overwriting it.

The controls offered are Prepare distribution, Simulate attempt, Reconcile outcome, Record response and Prepare follow-up, and each appears only where it applies. There is no bulk send and no Approve all. Where an output has no distribution route the control is replaced by the reason.

### 5.5 Exceptions and recovery

Each exception card states its reference, the affected output, issue and recipient, the category, what is known, what is unknown, the owner, the due position, the time it has been recorded and a **safe next action** written for that cause. The recovery control differs by category: reconcile the original attempt, prepare a new authorised attempt, inspect the affected issue manifest, open readiness and refresh the basis, open readiness and domain review, or continue the original operation. No generic retry button is offered for every exception.

### 5.6 History and change impact

The timeline merges retained issue events, withdrawals, distribution attempts, responses and local actions, with a filter for issue events, distribution and responses, preparation and review, or owned follow-up. Filtering narrows the view and never changes the retained history; a browser check asserts that a withdrawal disappears from a filtered view and returns when the filter is cleared.

The revision comparison places the current issue against its predecessor across each basis element and the manifest item list, marking what changed. The impact panel lists the affected recipients with their outstanding responses and the linked business record, and offers an owned follow-up that stays **Prepared locally**.

## 6. Synthetic fixture catalogue

Ten deliberately different output records, all fictional.

| # | Output | Type | What it demonstrates |
|---|---|---|---|
| 1 | Irrigation upgrade — customer quotation | OUT-06 | Approved commercial basis and a named audience; one receipt acknowledgement that is explicitly not acceptance; one attempt with an unknown outcome awaiting reconciliation. |
| 2 | Irrigation upgrade — drawing transmittal | OUT-08 | Two issues with different purposes (issued for review, issued for construction), a three-item manifest, a missing historical item, and a successor set in which only one drawing changes. |
| 3 | Irrigation installation — technician job pack | OUT-09 | The principal journey: appointment and crew context, three assignments, two retained acknowledgements on r04, and a full successor cycle to r05. |
| 4 | Fertigation controller visit — customer service report | OUT-10 | Customer-safe presentation, a channel that supplies no delivery evidence, and a manually captured response whose identity assurance is stated honestly. |
| 5 | Irrigation upgrade — project progress update | OUT-11 | Reporting cutoff, an approved stakeholder group, one permanently failed attempt, and a source that changed after preparation and blocks the successor. |
| 6 | Compartment B commissioning record | OUT-12 | A withdrawn r01 retained with its reason, and an r02 with failed-and-retested evidence and partial scope that does not imply acceptance. |
| 7 | Irrigation upgrade — stage 1 handover pack | OUT-13 | A four-item mixed bundle with one missing exact as-built item and outstanding obligations. |
| 8 | Northbank visit — Finance supporting evidence | OUT-14 | Finance-only access, separated quantity basis, and no customer distribution route at all. |
| 9 | Irrigation upgrade — internal cost estimate | OUT-02 | Internal cost confidentiality, and refusal — not redaction — of a proposed external copy. |
| 10 | Bayview expansion — progress update | OUT-11 | No configured release rule: inspection and preparation work, release does not. |

Two customers and two sites are used, with several facilities at one site and equipment serving more than one growing area. Location containment is never treated as document applicability or audience permission: the job pack and the commissioning record share Greenhouse 01 but have different audiences, classifications and release rules.

All source excerpts, technical statements, contacts and identifiers are fictional. The package invents no Priva instruction, CREMS formula, company approval threshold, legal clause, retention period, tax or price, and no customer acknowledgement wording beyond neutral synthetic labels.

## 7. Fact model as implemented

| Fact | Evidence the file requires | What the file refuses to imply |
|---|---|---|
| Successor drafted | A recorded draft with its change reason, basis, template and audience fingerprint | Reviewed or approved content |
| Checked / Returned | An independent domain decision bound to that exact fingerprint, with a stated purpose | Issue, or suitability for a different purpose |
| Preparing output | A recorded original preparation operation with a reserved issue identity and reserved time | Generated or issued content |
| Generated | Verified retained bytes with a byte count and content identity for every available item | Authorised release |
| Issued | An immutable issue event with its own actual issue time, committed against a verified bundle | Message sent or document received |
| Current / Superseded / Withdrawn | A projection over retained issues and withdrawal records | Permission to overwrite or delete historical bytes |
| Prepared (distribution) | A recorded authorised intent with a reason | Sent |
| Sent | A recorded simulated channel action | Delivered |
| Delivered | Supported channel evidence for that recipient and attempt | Opened or acknowledged |
| Opened / downloaded | Not supported by any simulated channel in this build, and stated as such | That anything was read, understood or accepted |
| Acknowledged | An explicit response bound to the current issue in force and to a SHA-256 over its whole presented set | Quotation acceptance, project completion, work authority or Finance approval. A superseded or withdrawn issue keeps only the responses it already had |
| Outcome unknown | An original operation whose effect cannot yet be established | Failed, successful, or safe to repeat |
| Not configured / Not supported | An explicit absent rule or channel capability | That a required step has been completed |

Reserved output-preparation timestamps stay distinct from actual issue timestamps throughout, and a model check asserts that every retained issue has `preparedAt ≠ issuedAt`. No issued content is modified after release to add a time, signature or response mark.

## 8. Content identity, bytes and the PDF boundary

Every manifest item's content is produced by one deterministic function from the output identity, the content revision, the item's own sections and the issue's reserved identity and preparation time. The byte count is the UTF-8 length of that content, and the content identity is a SHA-256 of the same bytes, computed by a self-contained implementation inside the model.

This matters because the plan required that hashes be computed from real encoded bytes rather than displayed as fixture literals. A browser check downloads the first manifest item, compares the downloaded file's length against the displayed byte count and its SHA-256 against the displayed identity, and a model check compares the model's own digest against Node's `crypto` for seven inputs including empty, block-boundary and multi-byte cases.

The file prints its reserved issue identity and output-preparation time, and says in its own footer that these are effective only on release. The manifest export is a structured JSON record of the same identities. No controlled PDF is produced: the manifest states **PDF not included in this preview** with no byte count and no content identity, and states that browser print is not an approved controlled PDF renderer.

A content identity proves byte identity only. The workspace says so in the manifest legend: it does not prove approval, retention or authenticity.

## 9. Readiness and domain review

Release requires every readiness row to be **Met**. The three fixture blockers behave differently and deliberately:

- **Bayview expansion** has no configured release rule. Inspection, successor drafting and readiness all work; the domain decision is refused with the unresolved check named in the message, and release stays unavailable.
- **Irrigation upgrade progress update** has a source snapshot that advanced after the output was last prepared. The successor can be drafted, but the blocking-change row is **Needs action**, preparation is disabled, and the same condition appears as an owned exception with a refresh action.
- **Stage 1 handover pack** and **Compartment B commissioning record** each carry a **Needs action** required-evidence row — a missing exact as-built item and a missing instrument calibration reference — which is visible in readiness without pretending the issued record is invalid.

The issue purpose that is released is the one the owning domain stated in its decision, not the draft's proposal: it is bound into the preparation, printed into the generated bytes as the issue purpose, and carried onto the issue. Where a manifest item states a different document purpose, both appear. Every preparation and release action rechecks the basis fingerprint, which covers the output identity, successor revision, purpose, basis rows, template, audience and the reviewed source. A changed fingerprint retains the original attempt and refuses the action with an explicit message rather than silently re-deriving it.

## 10. Release, original operations and recovery

`prepareOutput` reserves an issue identity and preparation time, generates the bundle, verifies that every available item has a positive byte count and a well-formed content identity, and records one original operation. In the delivered fixtures the first preparation is deliberately interrupted: its state becomes **Finalisation outcome unknown**, and the file says the document must not be generated again and another issue must not be created blindly.

Recovery locates the retained bundle by its operation identity, recomputes each item identity from the same source and the same reserved identity, and refuses if any identity has drifted. The bundle is not regenerated: a browser check captures the bundle identities before recovery and asserts they are byte-identical afterwards.

Release then commits one immutable issue with its own actual issue time and the retained preparation time, refusing an issue time that is not later than the reserved preparation time, and marks the predecessor superseded. Repeating the same original operation is refused with *"This original operation is already released. A retry returns the same issue result and never creates a second release event."* A model check asserts that the released manifest identities equal the prepared bundle identities, so the issued bytes are the generated bytes.

## 11. Distribution, responses and how every summary count is calculated

Every number the workspace displays is derived, and each derivation states its population.

| Displayed figure | How it is calculated |
|---|---|
| Outputs in this preview scope | Output records the selected profile is permitted to see, after classification, site and record scoping. |
| Awaiting domain review | Permitted outputs whose preparation position is *Awaiting domain review*, meaning a successor draft exists with no retained decision. |
| Open exceptions | Length of the derived exception list for the selected profile: fixture conditions plus live unresolved operations. |
| Recipients without a response | Across the **current** issue of every permitted output, recipients with no retained response. Outputs whose response kind is *Not applicable* contribute nothing. |
| *N* matching outputs · *M* permitted in this preview | Filtered count and permitted population, always shown together. |
| *N* of *M* recipients have delivery evidence | *M* is the recipients of that exact issue; *N* is those with at least one attempt whose **current** outcome — after any reconciliation — is Delivered. The workspace adds that the remainder are not implied to have received it. |
| *N* of *M* explicit responses | *M* is the recipients of that exact issue; *N* is the retained responses for it. Responses never carry across to a successor. |
| *N* unknown outcome | Attempts on that issue whose current outcome is unknown. |

Recipients come from fictional contact and assignment records, never from free text. The distribution form shows the person's identity, organisation, role or assignment, approved destination and channel before anything is recorded, and requires a stated reason for that recipient and that exact issue.

A channel declares whether it can evidence delivery. The customer portal channel cannot, so **Delivered** is offered neither when simulating an attempt nor when reconciling an unknown one, and its evidence line reads *"Delivery evidence is not supported by this channel."* After a reconciliation the evidence line states what the lookup established and what the original attempt returned, rather than leaving the original text beneath a changed outcome. Open and download tracking is unsupported by every simulated channel in this build and says so.

An unknown outcome blocks another distribution intent for that recipient until it is reconciled. Reconciliation is additive: it records the finding, the original provider or operation reference, the note, the actor and the time as a separate record, and a check asserts the original attempt object is byte-identical afterwards.

A response is recorded only from an explicit action bound to the exact issue and to a SHA-256 over the whole presented set — every available manifest item, not the first one — and only once per recipient and issue. Each retained fixture response carries that binding as a recorded value; nothing recomputes a binding at render time. A technician profile may record only its own assignment; a distribution coordinator capturing manually has its capture recorded as *"Manually captured; identity is not independently verified."* Accepted with reservations, Declined and Unavailable require supporting detail. Nothing infers a response from delivery, download, open tracking or a coordinator completing a task.

## 12. Exceptions and recovery as built

| Condition | User-visible treatment | Recovery actually implemented |
|---|---|---|
| Missing exact item in a manifest | **Missing exact item**, no byte count, **No content identity**, disabled preview and download | Inspect the affected issue manifest and request a permitted retained snapshot. No latest-version fallback exists in the model. |
| Source changed after preparation | **Needs action** blocking-change row; preparation disabled | Open readiness and refresh the basis; the original attempt and its evidence are retained. |
| Domain release policy not configured | **Not configured** readiness row; decision and release refused with the unresolved check named | Open readiness and domain review; the missing rule is owned work, not a passed check. |
| Finalisation outcome unknown | Owned exception naming the retained bundle and its operation | Continue the original operation; the bundle is revalidated, never regenerated. |
| Distribution outcome unknown | **Outcome unknown** with no supported evidence; further intents blocked | Reconcile against the original provider or operation reference first. |
| Distribution failed | **Failed** with its retained evidence | Prepare a new authorised intent, preserving the failed evidence. |
| Delivery evidence unsupported | Stated per channel; **Delivered** not offered | None required; the limitation is displayed rather than hidden. |
| Withdrawn issue | **Withdrawn** with reason, actor and time, outside the document bytes | Permitted historical access is retained; the bytes are never regenerated. |
| Failed local save | Inline error, entries retained, no success message | Save again. A browser check asserts the retry creates exactly one preparation. |
| Another tab changed the saved work | Writes paused, notice with reload and raw export | Reload saved work; the open form keeps its entries. |
| Malformed local state | Recovery notice, writes paused | The original malformed data is preserved for recovery and can be downloaded; only a scoped reset clears it. |

Error messages state the business effect and the next action. No stack trace, token or provider secret appears in any user-visible message or export.

## 13. Revision, supersession and withdrawal

An issued original is immutable. Supersession and withdrawal are shown in the surrounding interface with reason, actor and time, never by editing the retained content. Only the issue in force can be withdrawn, and the control acts on the issue selected in the record toolbar rather than on a different one, so a superseded set cannot have its supersession masked by a withdrawal. The drawing transmittal demonstrates the bundle rule directly: the successor set reissues three items, only one of which changed, and a model check asserts the earlier set's item identities are unchanged while the successor's differ, and that the earlier set's missing item still has no content identity.

A successor inherits no approval and no response. Pack r04 keeps its two acknowledgements; r05 starts with none, and the outstanding list correctly names the two remaining crew members. Recording a response against r05 does not alter r04, and a check asserts both.

## 14. Interaction, accessibility and persistence

Every visible action either performs its documented local behaviour or is disabled with the reason stated nearby. Search, filters, snapshots, exact issue selection, revision comparison, forms, recovery, response capture and export all work through ordinary controls rather than only through the demonstration switcher.

The workspace uses semantic tables, labelled fields, visible focus, error text associated with the form through `role="alert"`, keyboard tab-list navigation with Home, End and arrow keys, Escape to close overlays and focus return to the invoking control. The phone snapshot is a modal sheet whose focus is trapped; a browser check presses Tab eight times, asserts focus never leaves it, presses Escape and asserts focus returns to the control that opened it.

All six views were exercised at 1440, 1024, 820, 390 and 320 px and at a 1024×420 short viewport, with an assertion that the document scroll width never exceeds the client width. Wide tables reflow to labelled cards below 760 px, and the revision comparison becomes paired sections rather than a squeezed three-column grid.

Local state uses the versioned namespace `ppo.output-distribution.r01` with a separate `.view` preferences key. The footer reports **Local work saved in this browser**, **Saved in this browser** with a time, or **Changes paused · original data retained**. Browser storage is an application convention, not a secure audit store or a transactional multi-user database: every embedded fixture is readable by anyone holding the file, and the preview profiles demonstrate intended scope rather than enforcing it.

Reset affects only this module's two keys after a scoped confirmation, and re-arms the scripted finalisation interruption so the principal journey is repeatable. The review export contains the permitted selected context and states that it is a review copy, not a production backup or an import format.

## 15. Verification actually executed

**Model checks — 38 groups passed.** Fixture identities and exception population; profile scope and permitted actions; technician and viewer exclusions; content identity against Node `crypto`; missing-item handling; preparation-against-issue times on every retained issue; follow-up uniqueness and fixture immutability; read-only refusals; successor preconditions; independent review; unconfigured policy; stale source; Checked preconditions; reserved identity and interruption; refusal to release an unverified bundle; recovery without regeneration; single release with separate times; duplicate-operation refusal; predecessor immutability; successor manifests; approved-recipient and current-issue requirements; restricted Finance and internal-cost refusals; unsupported delivery evidence; independent per-recipient results; additive reconciliation; presentation-bound acknowledgement; withdrawal; stale version refusal; malformed-state rejection; and scoped export.

**Native browser checks — 36 groups passed, no page or console errors, 41 captures.** The full principal journey ran through ordinary controls, including the failed-save retry, the interrupted finalisation, the recovery, the single release, two independent recipient outcomes, the reconciliation and the acknowledgement. Layout was asserted at five widths plus a short viewport. The last check asserts that the page issued no request other than to the local test server — no font, image, analytics or provider call.

The authoring run used Chromium **141.0.7390.37** through the repository-pinned Playwright 1.63.0 on Node **22.22.2**, launched with the documented `PPO_CHROME_PATH` override; the executed runtime is recorded verbatim in `results.json`. The repository's pinned Node 24.21.0 and Chrome channel have since run the same suite: the focused workflow passed on head `940316bd` in [run 35192211499](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35192211499).

Seven captures were opened and read during review: the 1440 px queue, the readiness view, the distribution view, the exceptions view, the detail view, the released state and the 390 px queue. Four defects found this way were fixed before the final build — an unclosed `article` element that nested the recipient cards, a duplicated destination and channel line, a follow-up control that targeted the wrong output from the exceptions view, and a warning tone on a routine preparation position. Visual review is not claimed for all 41 captures.

### Post-build adversarial review

After the package was first assembled and both suites were green, an independent adversarial review was run against the code with the contract and this report as the specification. It found **eight defects, every one of them a real gap between what this report claimed and what the code did**, and all eight were fixed before the delivered build:

1. Retained fixture responses displayed a presentation binding that was recomputed at render time rather than recorded, and the binding covered only the first manifest item. Responses now carry a recorded binding over the whole presented set.
2. A reconciliation could establish **Delivered** on a channel declared incapable of delivery evidence, and the resulting evidence line still denied any provider result. Both the model and the form now refuse it, and reconciled evidence states what the lookup found.
3. The owning domain's stated issue purpose was captured and then discarded at release, so the one control that sets purpose had no effect on the issue or its bytes.
4. `releaseIssue` could produce an issue whose actual time equalled its reserved preparation time — a state the workspace's own validation rejects on reload. The write side now enforces it.
5. A **Returned** domain decision was a permanent dead end: the queue told the user to prepare a fresh successor and no command allowed one.
6. `recordResponse` had no issue-state guard, so an acknowledgement could be captured against a withdrawn or superseded issue through the model.
7. The advanced **Current issue state** filter was inert for Superseded and Withdrawn.
8. The Withdraw control was enabled from the current issue but acted on the issue selected in the toolbar, and exception recovery controls were rendered without a capability gate.

Eight model groups and two browser groups were added to hold these fixed, which is why the counts above are 38 and 36 rather than the 30 and 34 of the first assembly. The review found no escaping or injection defect and no path that mutates a retained fixture.

Repository assurance — `check_foundation.py`, `check_prototype.py` and `check_naming.py` — passed with the new files present, as did focused ESLint over the module sources and both check scripts, and a deterministic rebuild.

## 16. Limitations and what is not claimed

**Declared departures.**

1. The model contains a self-contained SHA-256 implementation. The alternative, `crypto.subtle`, is asynchronous and would have forced the whole render path to be asynchronous for a value that must be displayed synchronously beside every manifest row. It is verified against Node's `crypto` for seven inputs. It is a content-identity utility, not a security control.
2. The native check accepts a `PPO_CHROME_PATH` override so the journeys can be executed outside CI. The committed default is still the pinned Chrome channel, and the executable actually used is recorded in the returned results.
3. No binary screenshot file is committed in this contribution. The transfer path available to this session applies newline translation to binary content — detected by hashing the written files rather than assumed — so the 41 captures are retained by the focused workflow as a run artifact, with a SHA-256 for every image committed in the verification record.

**Not built, and not claimed.** Live source retrieval, email or SMS sending, customer portal access, signatures, template publication, CAD authoring, ERP transactions, production retention and offline issue or distribution are all outside this build. DK-06 owns template management, DK-05 knowledge publication and ES-06 quotation response and negotiation; DK-03 displays references to those outcomes without implementing their authority.

No accessibility conformance claim is made: the package has had no screen-reader, assistive-technology or physical-device testing. No server permission, concurrency or retention behaviour is proven — client-side profile scoping demonstrates intent only. No owner design acceptance, no application integration, no accepted UI baseline change, no migration, no provider connection and no deployment is included or implied. The proposed role names, issue policies and response deadlines in the fixtures are not approved company policy.

## 17. Module handovers

| Counterpart | What DK-03 shows | What stays with that module |
|---|---|---|
| DK-01 / DK-02 | The exact reviewed source reference and decision behind a readiness row | Technical source review and document relationship maintenance |
| Estimating / ES-05 | The exact quotation revision, approved basis and issue and distribution evidence | Commercial approval and quotation release; ES-06 retains customer response and negotiation |
| Engineering | Published drawing references, the exact issue set and the distinct issue purposes | Approval for review, construction or procurement; these purposes are not interchangeable |
| Service — job packs | Work order, appointment, pack revision, crew assignments and per-assignment responses | Pack checking, issue, withdrawal and dispatch authority; acknowledgement is not work authority |
| Service — reports | Reviewed visit evidence, the exact customer presentation and the response reference | Review of findings, report release and customer response capture |
| Projects / Quality | Progress updates, commissioning evidence and staged handover manifests with outstanding obligations | Project release, technical acceptance, customer handover and completion |
| Finance | Restricted supporting evidence and its handoff context | Finance review and processing; OUT-14 has no customer distribution route |
| SH-06 approvals inbox | The exact pending decision and its domain destination | The receiving approval, which happens in the domain screen |
| My Work / notifications | Owned follow-up with its owner, due position and originating issue or recipient | Completion of the underlying action; reading a notice cannot complete it |
| Customer 360 / Deal Workspace | Permitted issued documents and distribution summaries | Customer, sales outcome and delivery-responsibility decisions |

Every cross-module destination in the file is labelled a preview and changes nothing. Later runtime integration must call the established domain services with current permissions and concurrency checks; the receiving plan is in the [decision record](../../../decisions/output-issue-distribution-design.md).

## 18. Local verification case index

These are **local DK-03 labels**, not new parent requirements. Each maps to the executed checks above.

| Case | Covered by | Result |
|---|---|---|
| DK03-T01 Search, filter and return preserve context | Browser: queue population; search and filters | Passed |
| DK03-T02 Missing exact versions never substitute the latest | Model: missing-item handling · Browser: multi-item transmittal | Passed |
| DK03-T03 Preview and download bytes match the manifest | Browser: downloaded bytes and content identity | Passed |
| DK03-T04 Domain review binds the exact basis; unconfigured cannot issue | Model and browser: unconfigured rule; fingerprint binding | Passed |
| DK03-T05 A changed basis retains the stale attempt and prevents release | Model: stale source; fingerprint refusal | Passed |
| DK03-T06 One issue result from a repeated operation | Model and browser: duplicate operation | Passed |
| DK03-T07 Storage success with unknown finalisation reconciles without regenerating | Model and browser: recovery without regeneration | Passed |
| DK03-T08 Generated, reviewed, issued, sent, delivered, opened and acknowledged stay distinct | Model: fact model · Browser: evidence lines | Passed |
| DK03-T09 Partial recipient results are independent | Model and browser: per-recipient outcomes | Passed |
| DK03-T10 Unknown results cannot be blindly retried | Model and browser: unknown-outcome block | Passed |
| DK03-T11 Acknowledgement binds the exact presentation and creates no other authority | Model and browser: presentation-bound response | Passed |
| DK03-T12 A successor inherits no approval or response | Model and browser: predecessor immutability | Passed |
| DK03-T13 A changed bundle item produces a successor manifest | Model: successor set | Passed |
| DK03-T14 OUT-14 has no customer distribution; internal cost disclosure refused | Model and browser: Finance and internal cost | Passed |
| DK03-T15 A restricted profile sees and exports no forbidden records | Model and browser: scoped export | Passed |
| DK03-T16 Missing, unavailable and partial reads are honest | Browser: loading, empty, failed and recipient-directory states | Passed |
| DK03-T17 Withdrawal retains history and prepares follow-up | Model and browser: withdrawal | Passed |
| DK03-T18 Failed local save preserves input; scoped reset | Browser: failed-save retry; malformed state | Passed |
| DK03-T19 Stale cross-tab edit refused with draft recovery | Browser: cross-tab conflict | Passed |
| DK03-T20 Keyboard journey with correct focus and labelled errors | Browser: tab-list keys; phone focus trap; form errors | Partly covered — no screen-reader testing |
| DK03-T21 All six views at 1440, 1024, 820, 390 and 320 px plus short viewport | Browser: responsive assertions | Passed |
| DK03-T22 No provider calls; local exports visibly synthetic | Browser: request assertion; export contents | Passed |
| DK03-T23 Multi-site and served-area fixtures preserve exact applicability | Model: profile scope · fixture catalogue | Passed |
| DK03-T24 Deterministic assembly; report matches what the browser demonstrates | Deterministic rebuild; this report | Passed |

## 19. Source register

| Ref | Source | Use |
|---|---|---|
| S01 | [Repository guidance](../../../../AGENTS.md) | Scope, evidence, branch and verification discipline |
| S02 | [STATUS](../../../STATUS.md) | Dated baseline and its stated limits |
| S03 | [Document, issue and distribution contract r07](../../../contracts/document-issue-distribution.md) | Outputs, issue protocol, recovery, recipients, responses and retention |
| S04 | [BP-01 §16](../../../blueprints/BP-01-master-blueprint.md#16-documents-knowledge-and-communications) | DOC-01–DOC-06 and the OUT catalogue |
| S05 | [Theme & Style Board r20](../theme-style-board/powerplants-one-theme-style-board-r20.html) | Tokens, typography, page types and responsive reference |
| S06 | [HTML module conformance standard](../../../standards/html-module-conformance.md) | Required declaration, shell boundary and reuse rules |
| S07 | [PPO-STD-001 r04](../../../standards/naming-conventions.md) | Stable names, revisions and synthetic references |
| S08 | [ES-05 quotation approval, issue and distribution design](../../../decisions/quotation-approval-issue-distribution-design.md) | Commercial ownership and the ES-06 response boundary |
| S09 | [ADR-0003](../../../decisions/ADR-0003-prototype-architecture.md) | Modular monolith, domain services, outbox and adapters |
| S10 | [HTML Page Coverage Register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | DK-03 identity, P1 priority and DK-01 dependency |
| S11 | [DK-03 build plan](../../../delivery/output-issue-distribution-build-plan.md) | The authorised plan this package implements |
