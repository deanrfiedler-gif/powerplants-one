---
document_id: PPO-WAR-WORKSPACE-RPT
revision: r01
date: 2026-09-15
owner: Dean Fiedler
status: Proposed HTML design and detailed companion report; owner acceptance and application integration separate
source_commit: d041de7c40e7ba73acdef3252d5f18f1bf8ccb2f
---

# Warranty & Customer Resolution — workspace report

**Module:** MA-06 Warranty case and customer resolution, with integrated MA-07 Supplier recovery coordination  
**Companion:** [PPO-Warranty-and-Customer-Resolution-Workspace-r01.html](PPO-Warranty-and-Customer-Resolution-Workspace-r01.html)  
**Design baseline:** Powerplants One Theme & Style Board r20; module-only composition within the separate application-shell concept  
**Review status:** Interactive proposed design using fictional records. Verification is recorded in Section 13; business acceptance remains separate.

## 1. Purpose and scope

The workspace answers: **“Is the failure covered, what are we doing for the customer, and what recovery remains outstanding?”** It connects a failure discovered during maintenance to reviewed evidence, an explicit coverage assessment, an authorised remedy, an exact customer update and independently tracked supplier recovery.

Its central design principle is that resolving the customer's problem does not, by itself, decide warranty liability, establish a supplier claim, confirm a booking or create a financial credit. The workspace makes those decisions visible together while retaining their separate evidence, ownership and history.

The deliverable is a self-contained, interactive HTML design. Embedded fonts, icons, styles, fictional records and JavaScript allow it to open directly in a current browser. No web server or runtime installation is required to explore it. Accepted demonstration changes are saved locally in that browser. Opening the same file in another browser, copying it or sharing the file does not carry those local changes; explicit exports are provided for review.

The design covers six connected views, the default Willowbank journey and selected alternative outcomes. It does not implement production warranty adjudication, inventory movement, supplier communication, ERP transactions or shared application persistence. The companion report documents what the HTML actually contains, rather than treating later receiving workflows as delivered functionality.

## 2. Document and source basis

| Source | Use in this design |
|---|---|
| [BP-01 master blueprint](../../../blueprints/BP-01-master-blueprint.md), warranty journey, SVC-12.3, SVC-12.5, BR-24 and IF-16 | Warranty/customer/supplier separation, asset-history retention, future maintenance review and independent return/claim/credit outcomes. |
| [BP-07 Service Operations](../../../blueprints/BP-07-service-operations.md) | Distinguishes existing manual coverage and service authority from the wider lifecycle work still under PPO-015. |
| [Coverage audit r04](../module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md) | MA-06 and MA-07 page briefs, with SC-08 as the future returns/claims/credit receiving workflow. The supplied audit is retained unchanged. |
| [Service data dictionary](../../../contracts/service-data-dictionary.md) | Separate asset installation, commissioning and warranty dates; retained predecessor context. |
| [Finance handoff contract](../../../contracts/finance-handoff.md) | Warranty and goodwill review do not constitute billing release. |
| [Supply Chain readiness contract](../../../contracts/supply-chain-readiness.md) | Source-owned return evidence, quantities and receiving responsibility. |
| [PPO-015 / issue #15](https://github.com/deanrfiedler-gif/powerplants-one/issues/15) | Wider lifecycle delivery and acceptance remain open. This HTML contributes a design reference. |
| Maintenance r01, Work Orders r01, Service Review r02, Equipment r02 and Finance r02 | Existing design references for the surrounding service and receiving responsibilities. |

The repository baseline inspected for this contribution is `d041de7c40e7ba73acdef3252d5f18f1bf8ccb2f`. At that baseline, Maintenance PR #204 and Service Review PR #203 are merged. The new warranty contribution does not amend those issued source files or imply that their independent business acceptance is complete.

The supplied Theme r20 file has SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`; supplied Shell r14 has SHA-256 `9f4ab001225f7e538277870b9dcce4f467b158415c05a759af0870e45e8441d3`. Both were inspected locally and retained unchanged. The finished HTML's exact hash and verification source are maintained in the [verification record](../../../testing/evidence/warranty-r01/README.md).

## 3. Workspace composition and navigation

The page begins with the module title and central question, followed by a synthetic-data indicator, current preview role and local save status. Six view buttons provide persistent navigation. A selected-case context panel appears on detail views and displays case reference, derived journey position, customer, site, equipment, coverage, customer outcome, case owner and next review date.

| View | Primary question | Main information and controls |
|---|---|---|
| Warranty register | Which case needs attention? | Search, owner/status filters, ordering, Snapshot counts, next action and case opening. |
| Failure & evidence | What failed and what can we substantiate? | Symptoms, serial identity, location/served areas, source availability, evidence inspection, recovered source and review. |
| Coverage assessment | What do the exact terms and evidence support? | Terms, independent dates, coverage/causation, unresolved review ownership, goodwill and retained assessments. |
| Resolution plan | What remedy is proposed and authorised? | Versioned scope, access review, authority gates, owned request, reviewed replacement result and maintenance effects. |
| Customer outcome | What remedy and content has the customer acknowledged? | Exact update revisions, presentation evidence, response, reservations, follow-up and customer resolution. |
| Supplier recovery | What remains unresolved with the supplier and Finance? | Exact claim package, submission evidence, responses, physical returns, credit links, unrecovered disposition and claim worklist. |

Detail views repeat a five-part decision strip: **Warranty, Goodwill, Work authority, Supplier and Finance credit**. These values are derived from their own records. A change to one does not silently advance the others.

The URL fragment retains selected view, case, search, status filter, owner filter and ordering. Browser Back restores prior navigation. Preview role, read simulation and next-save simulation are session presentation options; reloading returns to the Service owner preview while retaining accepted records. The in-page demonstration guide explains the default sequence and role changes.

## 4. Detailed feature inventory

### 4.1 Warranty register

The initial register contains three fictional cases. Each row identifies the case/equipment/customer, current coverage, customer outcome, supplier recovery state and unresolved amount, case owner, next review date and suggested next action. **Open case** selects the case and moves to Failure & evidence.

The contiguous Snapshot provides four clickable filters: Cases, Coverage to review, Customer resolved and Recovery outstanding. Counts describe the permitted preview dataset, not the currently narrowed search result. Coverage to review includes absent, Unknown or Disputed assessments. Customer resolved can coexist with recovery outstanding.

Search matches case reference, title, customer, equipment name/serial, owner and the next-action explanation. Additional controls filter by case owner or identity unresolved and order by next review date, customer name or case reference. The result count states how many matching cases are visible. No-match feedback offers a clear-filters action. Narrow layouts convert register rows into labelled cards.

This revision is a seeded case register. It does not include arbitrary case creation, deletion, assignment lookup against a live directory or bulk actions.

### 4.2 Failure & evidence

The reported-failure card separates observed symptoms from causation. It displays reported date, equipment, serial, identity status, physical location and served areas. For Willowbank, the pump is physically in **Irrigation Shed 01** and serves **Greenhouse 01, Tunnel 01 and Propagation House 01**. Shared service scope is not treated as equipment being physically located in every served area.

Each evidence record has a title, exact reference, type, source date where known, availability, internal visibility and retained content. Inspect opens these details without altering the source. The seeded evidence types include a maintenance finding, an image reference, purchase/identity context and an unavailable warranty-commencement record.

The image reference opens a clearly labelled SVG illustration of the pump housing, reported seal location and serial plate. It is an explanatory illustration, not a field photograph, measurement or diagnosis. Other case references do not claim to contain that pump illustration. The HTML contains no photograph upload, image authenticity review or document-storage service.

**Add evidence reference** accepts a selected type, title, exact source reference, source date and observed facts. It records metadata and text only. Exact duplicate reference text, ignoring letter case, is rejected. An accepted addition increments the evidence-set revision and requires renewed evidence and coverage review.

**Load missing demonstration evidence** is available once for Willowbank. It adds a retained successor handover reference and a new source-context revision with explicit warranty start/end dates. The original missing reference remains visible. Purchase, installation and commissioning dates are unchanged.

**Review evidence** records reviewer, current evidence revision, current source-context revision, available evidence identities and review basis. Missing facts remain missing. The side panel shows whether the current set has been reviewed, provides linked-workspace context and allows the next case review to be assigned with an owner, due date and reason. The case timeline records accepted changes and their actors.

### 4.3 Coverage assessment

The exact-terms card displays the retained source reference, availability, terms and date basis. A source-history dialog retains every context revision. The fictional policy covers manufacturing defects for 24 months from evidenced customer handover; it excludes wear, dry running, installation damage and unauthorised alterations. It supplies no response-time promise. These are demonstration terms, not an adopted commercial policy or real warranty determination.

The independent-date card presents purchase, installation, commissioning, warranty start, warranty end, failure date, agreement start and agreement expiry. Missing dates display **Not established**. None is inferred from record creation or from another date category.

**Record assessment** accepts:

| Field | Available values or purpose |
|---|---|
| Warranty coverage | Unknown, Disputed, Covered, Not covered, Not applicable. |
| Cause assessment | Unconfirmed, Manufacturing defect, Installation damage, Wear, No fault found. |
| Assessment/source basis | Reviewer explanation against retained evidence and exact terms. |
| Review owner and due date | Explicit responsibility for unresolved matters. |
| Confirmation | Reviewer acknowledgement of the source and separate decisions. |

An assessment requires a current evidence review. In this bounded fictional policy, **Covered** additionally requires available terms, verified equipment identity, sourced start/end dates, a reported failure within that period and a manufacturing-defect cause assessment. A date within the period alone is insufficient. This remains a manual design decision; the HTML does not authenticate a technician's diagnosis or decide real contractual entitlement.

Every assessment retains source/evidence revisions, reviewer, reason, ownership and **Finance review required**. Assessment history remains inspectable after a successor is recorded. New evidence or source context makes earlier assessments historical rather than current.

**Commercial goodwill** is a separate decision against an exact current resolution plan. The Commercial owner records Approved or Declined, an authority reference and a reason before work authorisation. Goodwill does not change warranty entitlement, supplier responsibility or Finance credit. Revising the proposed plan requires a new decision for the new plan.

### 4.4 Resolution plan

**Prepare resolution plan** supports Investigate, Repair, Return, Replace and Loan as proposed remedy types. It records exact scope, resolution owner, requested target date, access/shutdown review and rationale. Each plan retains a distinct identity, revision and basis identifying case, asset, serial, source revision, evidence revision and assessment.

The default replacement scope is deliberately bounded: replace the identified pump, retain the removed unit for investigation, commission the successor and record both serials. Pipework changes and automatic maintenance transfer are excluded. The access review identifies affected served areas and requires receiving review of the crop window and isolation conditions; it does not declare the site safe or confirm access.

**Review work authority** requires current reviewed evidence, a current matching plan and assessment, verified equipment/serial identity and available terms. A remedy other than Investigate needs either a Covered assessment or separately Approved goodwill for that exact plan. The Service owner records an authority reference and authorisation basis. This records local demonstration authority only. Crew booking, shutdown confirmation, dispatch and billing are separate receiving decisions.

**Prepare owned work request** creates one request for an authorised exact plan. It retains receiving owner, context note, exact scope/access/target and source identities, together with the authorisation identity and a SHA-256 digest of the retained request bytes. Preparing it does not create a Work Order or booking. Duplicate requests for the same plan are rejected; a successor plan has distinct review and authority requirements.

**Review replacement result** is an embedded later-step evidence example limited to Willowbank's default replacement scope and 19 September target. A changed scope or target cannot reuse this result as proof. The result records the original asset snapshot, original request/hash, separate replacement identity and serial, installation/commissioning date, original pump quarantined at site, and a named future-maintenance review owner and due date.

The original asset remains unchanged. The replacement has its own identifier and a predecessor link. Its warranty start and end remain unknown. The original maintenance occurrence `plan-1@2026-09-15` and its original due date are retained; nothing is automatically cancelled, moved or transferred.

**Record maintenance review** offers Hold future generation, Prepare successor plan review or No transfer — further evidence required. It records an owner, due date and reason. These are reviewed local dispositions for a receiving owner, not changes to the Maintenance workspace's actual plans or generation process. Remaining actions can be assigned as Customer, Technical, Supplier or Finance follow-ups. Completion records outcome, actor and completion time while retaining the original action.

### 4.5 Customer outcome

The customer view separates remedy completion, communication, response and reviewed resolution. A completed replacement initially shows **Remedy completed**; it does not automatically show **Resolved**.

**Prepare customer update** requires the reviewed remedy result. It displays the intended recipient and accepts manually reviewed customer-facing text. Each immutable revision retains case/customer/equipment context, remedy, result reference, recipient, body, exact JSON bytes and SHA-256 digest. The update is labelled **Prepared locally — not sent**. Internal claim figures and correspondence are not automatically copied into it. The reviewer remains responsible for the wording they type.

The HTML previews the latest body and recipient, allows inspection of earlier exact revisions and exports the latest retained JSON bytes. This is not a generated PDF, issued Service Report or delivery channel.

**Record response** ties the response to the current update identity and hash. It records the named recipient, presentation-evidence reference, response date, response evidence and one of Accepted, Reservations, Disagreed or Unavailable. The response cannot predate the reviewed remedy in this demonstration. A non-accepted response also requires a follow-up owner/due date and creates an owned Customer action.

**Record customer resolution** requires the reviewed remedy, Accepted response to the exact current update and completion of all open Customer follow-ups. It records the closure basis and actor. Supplier recovery and maintenance review can remain open. A successor update requires its own response and resolution. A later reservation or new open Customer follow-up reopens the displayed customer review while retaining the earlier closure. A subsequent Accepted response can support a new retained resolution record.

Customer acceptance is acknowledgement of the presented remedy update. It does not approve billing, concede warranty entitlement, release supplier liability or establish full project acceptance.

### 4.6 Supplier recovery

The Supplier recovery view combines the selected case's claim with a worklist of claims on permitted cases. Selecting a worklist item changes the case while retaining this view. Customer position and receiving responsibilities remain visible alongside the recovery record.

**Prepare supplier claim** requires reviewed evidence, a current coverage assessment, available terms and verified equipment identity. It records supplier, exact claim scope, claimed amount, recovery owner and due date. The retained package includes source terms/context, evidence identities and snapshots, review identity, case/asset/serial identity, coverage basis, amount, AUD currency and excluding-tax basis. Exact bytes and hash are inspectable. This bounded revision supports one supplier claim per case.

**Record submission evidence** records an external reference and date, without sending anything. **Record supplier response** supports Reviewing, More information, Approved, Partially approved or Rejected. It records exact evidence reference, date, reason, approved amount and next recovery owner/due date. Prior responses remain in history. Submission cannot precede the reported failure, and later responses cannot precede the retained submission/response evidence.

The recovery position shows four amounts: claimed, supplier approved, credit linked and unresolved. Full approval must equal the claim. Partial approval must be positive and less than the claim. Pending/rejected responses cannot declare an approved amount. Supplier approval is not a financial credit or recovered cash.

**Record return evidence** retains Authorised, Received, Disposed or Not required as separate physical-return evidence. Receipt requires prior authorisation; disposition requires prior receipt. Dates must follow the failure/prior event. The bounded example tracks one original pump, its serial and quantity one each. A physical-return history cannot be overwritten by Not required, and a retained no-return decision cannot silently reverse. A future controlled successor flow is required for such changes.

**Link credit evidence** is available to the Finance preview role. It requires current supplier approval and records ERP company, unique credit reference, exact claim/approval identities, source date, amount, AUD/excluding-tax basis and matching reason. Multiple distinct partial credit links are supported within the approved total. Case-insensitive duplicate credit references across the preview and amounts exceeding the remaining approval are rejected. The source credit cannot predate its approval. No MYOB transaction, customer credit or receipt is created.

**Review unrecovered closure** is a separate Finance decision following a final supplier response. It retains the entire remaining unresolved amount as unrecovered, with a reference, explanation and actor. It does not increase credited recovery or cash. For example, a $1,250 claim with a $750 linked credit can retain $500 as unresolved or explicitly dispose that $500 as unrecovered.

## 5. Fictional data and demonstration sequence

### 5.1 Seeded cases

| Case | Starting condition | Purpose |
|---|---|---|
| SYN-PPO-WAR-090101 — Willowbank pump seal failure | Verified pump identity; missing warranty commencement; observed moisture/pressure instability; no established cause. | Full customer-resolution journey with disputed coverage and supplier recovery still open. |
| SYN-PPO-WAR-090102 — Willowbank controller identity clarification | Serial unknown and exact source unavailable. | Demonstrates unresolved identity/source gates; the design cannot manufacture authority from goodwill. |
| SYN-PPO-WAR-090103 — Riverbend bearing-noise rejection | Fictional historical $850 claim and rejected supplier response; original full package unavailable. | Shows an owned rejected recovery while customer/technical matters remain unresolved. Historical text is not presented as a hashed original package. |

All names, serials, terms, amounts, source references, responses and outcomes are fictional. The Willowbank site and original pump reuse existing supplied design identities: site `33000000-0000-4000-8000-000000000301` and pump `33000000-0000-4000-8000-000000000501`. This is continuity of design context, not a live record lookup.

The scenario starts as at **16 September 2026**. Embedded later steps use 19–23 September and are explicitly fictional future stages, not claims of actions already performed on the report date. The historical Riverbend case begins on 12 September, before its submission and rejection evidence.

### 5.2 Recommended review walkthrough

1. Open the Willowbank pump case. Inspect symptoms, original serial, location and evidence availability. Load the missing handover successor, then review the current evidence set.
2. Record **Disputed / Unconfirmed** coverage. Inspect the independent dates: purchase 1 March 2024, installation 8 March, commissioning 12 March, sourced warranty 26 September 2024–25 September 2026 and maintenance agreement 1 July 2026–30 June 2027.
3. Prepare the default **Replace** plan. Inspect the authority gate before goodwill is recorded. In Preview options, switch to Commercial and record Approved goodwill against that exact plan.
4. Return to Service. Authorise the exact scope, prepare the request owned by Robin Ellis, and review the embedded 19 September replacement result. Confirm that the original pump remains in history and the successor warranty dates remain unknown. Record the future maintenance review owned by Alex Morgan.
5. Switch to Supplier recovery. Prepare the fictional $1,250 excluding-tax parts claim, record external submission evidence and a Reviewing response with zero approved amount.
6. Return to Service and prepare the customer update. Record Accepted against its exact revision and record customer resolution. The customer can now be resolved while the supplier claim remains unresolved.
7. Optional exception path: record Reservations, complete the generated owned Customer action, then record Accepted and a new reviewed resolution. Optional recovery path: retain return evidence, partial approval of $750, switch to Finance and link a $750 fictional credit. The remaining $500 stays unresolved until a separate Finance disposition is recorded.

The **Page guide** is available in the HTML. **Preview options → Reset demonstration** returns to the initial fixtures after an explicit confirmation. Export a local backup first if accepted review work is to be retained.

## 6. Decision boundaries and preservation rules

| Decision or record | What advances it | What it does not imply |
|---|---|---|
| Warranty entitlement | Current evidence/terms/identity/date/cause assessment. | Goodwill, work authorisation, supplier approval or billing approval. |
| Commercial goodwill | Explicit decision for the exact current plan. | A changed warranty decision or ERP credit. |
| Work authority | Service review of exact scope and required prerequisites. | Confirmed booking, dispatch, site access or Finance release. |
| Customer resolution | Reviewed remedy, exact Accepted update and resolved Customer follow-ups. | Supplier recovery complete or maintenance automatically transferred. |
| Supplier approval | Retained supplier response and explicit amount. | Physical return receipt, ERP credit or recovered cash. |
| Financial credit link | Finance-reviewed authoritative reference within current approval. | A new ERP transaction or customer billing approval. |
| Physical return | Ordered evidence for authorisation, receipt and disposition. | Supplier liability or financial settlement. |
| Replacement lifecycle | Reviewed result with original/successor identities. | Warranty restart, historical asset rewrite or automatic future-plan changes. |

Source additions and successor decisions preserve earlier records. A new source/evidence revision invalidates current review/assessment eligibility, and a changed assessment makes an earlier plan basis stale. Historical requests, results and claims retain their original context. The UI does not silently rewrite completed history to match a later conclusion.

Claimed and approved recovery are presented as evidence amounts only. Money is stored as integer AUD cents with a maximum of two decimal input places; calculations do not use floating-point business quantities. The unresolved amount is claim less linked credits less explicitly unrecovered dispositions. There is no exchange-rate conversion, tax calculation, interest, accounting allocation or recognition policy in this revision.

## 7. Preview roles and responsibility

| Role | Demonstrated responsibilities |
|---|---|
| Service owner — Alex Morgan | Evidence review, coverage, plan and authority, receiving request, embedded result, maintenance impact, customer response/resolution, follow-ups and case ownership. |
| Service coordinator — Robin Ellis | Add evidence references, prepare an already authorised request, prepare customer updates, retain responses and coordinate follow-ups/ownership. |
| Commercial owner — Jordan Lee | Decide exact-plan goodwill; customer update/response and owned follow-up. |
| Supplier recovery owner — Sam Patel | Prepare/submit claim evidence, supplier responses, physical-return evidence and follow-up. |
| Finance reviewer — Taylor Reed | Link authoritative credit evidence, dispose unrecovered balances and complete owned follow-up. |
| Read-only staff | Inspect permitted preview records without mutation controls. |
| No record access | Demonstrate an access-denied surface with selected-case context removed. |

Actions are hidden according to role and checked again by the model when submitted. Follow-up completion requires the assigned preview owner or Service owner. These are client-side responsibility demonstrations. All data and code are in the local file; role switching, read simulations and local backup controls are review tools, not authentication, record security or server-enforced access control.

## 8. Receiving workspaces and exports

The linked-workspaces dialog shows warranty reference, customer, site identity, original equipment identity, latest request and claim reference. It links to pinned GitHub references at the inspected repository baseline:

| Receiving reference | Intended relationship |
|---|---|
| Service Agreements & Maintenance r01 | Original finding/obligation and explicitly owned future-plan review. |
| Work Orders r01 | Exact authorised intervention and receiving coordination. |
| Service Review & Reports r02 | Technician evidence, reviewed result and customer report responsibilities. |
| Equipment & Installed Base r02 | Original/successor identity, location lineage and independent dates. |
| Finance r02 | Authoritative credit matching and independently reviewed financial treatment. |
| Supply Chain readiness contract | Future SC-08 authorisation, receipt/disposition, claim and credit coordination. |

The links open design/contract references. They are not live deep links to the fictional case and do not synchronise state between standalone HTML files. SC-08 is labelled as future work; no unavailable returns workspace is implied.

Three exports are provided: the exact latest customer-update JSON, a receiving-context JSON containing case/asset/assessment/request/result/maintenance/claim/follow-up context, and a full local backup envelope. The receiving export is explicitly a synthetic preview; it is not an implemented API payload or import contract. No import UI, send, upload or external write is provided.

## 9. Local state, failures and recovery

Accepted commands save a versioned state envelope in `localStorage` under `ppo-warranty-customer-resolution-r01`. State includes an operation receipt so a recovered save can return its original result without duplicating the effect.

| Situation | Demonstrated behaviour |
|---|---|
| Validation failure | Form stays open with the entered values and explanatory error; original data remains unchanged. |
| Fail before saving | The next simulated save fails before storage. The form and original records are retained; retry can save the same reviewed intent. |
| Save then lose confirmation | The accepted state and original pending operation are retained. Another change is blocked until original-result recovery. |
| Recovery under another role | Refused until the original preview role is restored. |
| Reuse of operation identity with different content | Refused; an existing receipt does not authorise another payload. |
| Stale form or another-tab storage change | Refused rather than overwriting newer accepted data. Reload/reopen against current state is required. |
| Unsupported or malformed saved envelope | Original bytes remain retained for backup; new saves are blocked until an explicit reset. |
| Partial, loading, failed, empty or denied read | Each has distinct presentation; partial counts describe only the visible subset, and failure does not masquerade as an empty complete result. |
| Unsaved dialog changes | Dismissal requests confirmation; a native modal retains keyboard focus and returns it to the opener where available. |

This is local demonstration resilience, not offline synchronisation, cross-device storage, durable business audit or a production recovery service. Browser storage can be cleared externally. Hashes bind retained bytes for review; they are not digital signatures or protection against a person editing the entire local file/state.

## 10. Visual system, responsiveness and accessibility

The workspace uses r20 navy `#242a37`, green `#62bb46`, background `#f5f6f8`, embedded Roboto 400/500/700, restrained borders and line icons. Controls use the shared 6 px radius, cards 7 px and dialogs 10 px. Snapshot cells remain square and contiguous. Navy anchors primary actions and green marks the active view and selected context; state pills and written labels distinguish review, uncertainty and completed outcomes without relying only on colour.

The layout is module-only: no copied application masthead, global sidebar or alternate application shell. Large screens use a main column with contextual side cards; narrower layouts stack content. Navigation can scroll within its own strip. Long identities/hashes wrap, evidence cards and actions reflow, and narrow register rows become labelled cards.

Keyboard support includes a focus-visible skip link, native buttons/forms/dialogs, labels, visible focus, Escape dismissal with dirty-form protection and arrow/Home/End movement among view buttons. Save/toast feedback uses live status, form errors use an alert, and the illustration has an accessible description. The script includes a non-JavaScript explanation.

Automated viewport and keyboard checks are bounded evidence, not a complete accessibility audit. Screen-reader review, contrast evaluation across all states, zoom/device testing and independent user acceptance remain separate.

## 11. Traceability and receiving implications

| Requirement / brief | Demonstrated contribution | Remaining acceptance |
|---|---|---|
| MA-06 | Failure evidence, coverage/responsibility, exact remedy authority, customer outcome and preserved replacement/maintenance context. | Accepted policy, real evidence workflow and shared application implementation. |
| MA-07 | Exact claim, responses, remaining recovery, return evidence and Finance links. | Supplier/ERP contracts, scoped access, real source versions and operational reconciliation. |
| SVC-12.3 / BR-24 | Warranty, goodwill, supplier recovery and Finance credit retain separate decisions. | Business-owner adoption and live policy enforcement. |
| SVC-12.5 | Original asset/successor linkage, independent dates and owned future-maintenance review. | Equipment lifecycle commands and receiving plan reconciliation. |
| IF-16 / SCM-07 / future SC-08 | Separate return authorisation, receipt/disposition, supplier claim and credit references. | Verified source company/entity/line/quantity contracts and supported integration mode. |
| FIN-03 and Finance handoff | Review of credit evidence; no assumed billing release or financial posting. | Real Finance definitions, credit policy, source matching and ERP authority. |
| CRM-07 | Owned customer follow-up with retained source context. | Live CRM Activity preparation/acceptance and cross-module links. |
| AT-19 / AT-33 | Bounded disputed-warranty and replacement-history demonstrations. | Full parent acceptance, including recurrence and lifecycle behaviours outside this HTML. |

The design introduces no new parent requirements, closes no parent issue and makes no claim that full AT-19 or AT-33 has passed. PPO-015 remains the delivery umbrella. Existing manual coverage capability in BP-07 is not described as an already implemented warranty application.

## 12. Explicit limits and next implementation decisions

The following limits describe the delivered revision and should guide review:

- Three seeded cases; no arbitrary case CRUD, live customer/equipment picker or multi-company search.
- One claim per case and one original-unit physical return. Multiple claims, split lines/quantities, alternative currencies, supplier credit reversal and controlled re-opening require further contracts.
- The only completed-remedy fixture is the default Willowbank replacement. Investigate, Repair, Return and Loan can be proposed and reviewed but have no embedded completion shortcut.
- Evidence is retained text/reference metadata plus a labelled illustration. Actual document upload, photo capture, restricted attachments and authoritative source verification are not implemented.
- Coverage is a human review against fictional terms. There is no legal-policy engine, real warranty entitlement advice, automated root-cause diagnosis or adopted goodwill delegation threshold.
- No automatic warranty restart, maintenance transfer, future occurrence migration, asset decommission, booking, stock movement or replacement procurement.
- Customer content is an exact local update, not a sent message, issued PDF, electronic signature or existing Service Report revision.
- Claim submission, supplier responses, physical returns and ERP credits are manually entered fictional evidence. The HTML does not perform the external action or authenticate the supplied reference.
- No backend, database migration, API, external adapter, authentication, production audit or cross-file/shared state. Existing application and dependency/runtime pins are unchanged.

Before application implementation, owners should settle policy/authority matrices, exact source and asset/claim identities, document access and versioning, multi-line quantity handling, customer wording/delivery evidence, credit/reversal semantics and the receiving contracts for Work Orders, Service Review, Equipment, Maintenance, SC-08 and Finance. These are implementation decisions, not reasons to withhold the requested reviewable design.

## 13. Verification and delivery record

The verification package distinguishes pure-model assertions, local non-rendered DOM interactions and native browser evidence. The model exercises meaningful refusal and preservation paths as well as the successful journey.

| Verification layer | Recorded result |
|---|---|
| Pure model | 25 groups passed locally: evidence invalidation; coverage/authority gates; preserved assets/dates; independent customer/recovery outcomes; reservations; return ordering; partial approval/credits; stale/replayed commands; malformed state and scope-mismatch refusal. |
| Non-rendered DOM smoke | Six groups passed locally through the actual forms and six views. Dialog, scrolling and download APIs were stubbed; this is not visual proof. |
| Native browser | Pending the dedicated published workflow at initial preparation. Results and any corrected source are recorded in the verification record before final delivery. |
| Repository assurance | Foundation, naming, generated-file consistency and lint results are recorded with the final contribution. |
| Independent business/device acceptance | Not claimed by these checks. |

See [original verification evidence and hashes](../../../testing/evidence/warranty-r01/README.md) and [draft PR #206](https://github.com/deanrfiedler-gif/powerplants-one/pull/206) for final source identity, actual results and remaining limits. The native suite covers the full role-driven journey, reservations, exports, partial recovery, save failure/recovery, read states, keyboard behaviour and all six views at 1440, 1024, 820, 390 and 320 px. Screenshots are retained for visual review.

## 14. Files and maintenance

| File / directory | Responsibility |
|---|---|
| [Standalone HTML](PPO-Warranty-and-Customer-Resolution-Workspace-r01.html) | User-facing interactive design with all runtime assets embedded. |
| This Markdown report | Professional feature, information, rules, walkthrough, traceability and limits inventory for that HTML. |
| [Design handover](../../../decisions/warranty-customer-resolution-design.md) | Authorisation/source decision, receiving boundaries and publication pointers. |
| `docs/design/warranty/` | Maintainable template, style, embedded-font source, icon definitions, domain model and view/controller code. |
| `scripts/build-warranty-design.py` | Deterministically assembles the standalone HTML. |
| `scripts/check-warranty-model.mjs` | Domain transitions, role/refusal and preservation checks. |
| `scripts/check-warranty-browser.mjs` | Native interactions, downloads, failure recovery, responsive assertions and screenshot evidence. |
| `.github/workflows/warranty-design.yml` | Dedicated review workflow using existing repository runtime/browser pins and read-only repository permission. |

After changing maintainable sources, rebuild the HTML and rerun the relevant model/browser checks. This report must be updated when the user-facing feature inventory or limitations change. Draft evolution is preserved by Git; once accepted as an issued baseline, substantive successor design changes should receive a new reviewed revision while retaining the original.
