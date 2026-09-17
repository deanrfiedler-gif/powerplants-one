---
document_id: PPO-ES06-REPORT
title: Quotation response and negotiation — feature and design report
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed standalone design; native visual acceptance and application integration pending
source_commit: 9921be2439ca479135482c51fbf3ed4b28615f37
---

# Quotation response and negotiation

## 1. Purpose and package

The [ES-06 HTML module](PPO-Quotation-Response-and-Negotiation-r01.html) extends the existing customer quotation r03 into a controlled response and negotiation demonstration. It lets a customer review the issued offer, select permitted options, ask a question, request a change, demonstrate a typed-signature acceptance or decline. A staff workspace retains the exact response, reconciles uncertain outcomes and prepares an owned handover.

The central design decision is to retain the customer experience Dean preferred. The original r03 typography, brand assets, quotation overview, cards, scope and price tables, options, specification, terms, summary sidebar, response form, confirmation dialog and print styling remain the presentation basis. The new staff views surround this document; they do not replace it with a different quotation design.

The deliverable is a self-contained HTML file with embedded fonts, logo, styles, customer document and demonstration code. It requires JavaScript, Web Crypto, local browser storage and native dialog support for its complete interaction. It makes no network requests, sends no messages and creates no orders. It is a design prototype, not the operational customer portal or an implementation of legally effective electronic acceptance.

This report describes what is actually included, its behaviour, the retained source evidence, design choices, handover boundaries and verification limits.

## 2. Scope and design conformance

| Package declaration | ES-06 r01 |
|---|---|
| Existing scope ID | **ES-06 — Quotation response and negotiation** from coverage register r06; the existing ID and scope are retained |
| Primary r20 page type | **Document & evidence workspace** for review of the exact customer quotation |
| Supporting r20 page types | **Record detail** for the issued offer and response history; **Review / comparison** for disposition and handover; **Form / guided workflow** for decisions and confirmation |
| Reused staff components | Local workspace title, context strip, tabs, named state badges, summary metrics, cards, 292 px support column, timeline, labelled fields, native decision dialogs and right-side 448 px inspection panel |
| Reused customer components | Exact r03 customer stylesheet and embedded assets; scope/pricing/options/specification/terms/document references; summary sidebar; typed-signature form, review dialog and print rules |
| Incoming boundary | Exact current issued quotation, frozen customer projection, output bytes and identity, validity, permitted selections and authorised customer access from ES-05 |
| Outgoing boundary | Material change request to ES-05; exact confirmed acceptance and owned prepared handover to ES-07; no conversion or ERP write |
| Retained references | Customer quotation r03, r20 theme board, coverage register r06 and all earlier issued HTML remain unchanged |
| Delivery status | Proposed design under the authorised direction; verification is bounded; native visual and owner acceptance are outstanding |

The coverage register describes ES-06 as an extension of the recent customer quotation r03. Its stated scope is exact revision, selected options, clarification, acceptance, decline, expiry and revised offers without inherited acceptance. ES-05 is its prerequisite. ES-07, One-off item resolution and conversion, receives its output. The new module follows that sequence and does not absorb ES-07’s company/entity mapping, target line review, order creation or reconciliation.

Parent traceability remains with BP-04 and the existing EST requirement family. EST-03, EST-07, EST-08 and OUT-06 are particularly relevant to revisions, separate authority, exact customer quotation and response. This design does not close the broader parent acceptance procedures or implement the wider E3–E6 delivery scope. ES-08 remains the separately scoped Screen Systems workbench.

## 3. Source provenance and retained content

The customer reference is [ppo-quotation-module-r03.html](ppo-quotation-module-r03.html). It is byte-identical to the supplied `ppo-quotation-module-r03(2).html`, SHA-256 `7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a`.

The user’s r20 attachment matches the repository [theme board](../theme-style-board/powerplants-one-theme-style-board-r20.html), SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. The board’s page-layout chapter distinguishes established adaptations from proposed compositions. This package chooses named compositions; it does not silently promote their entire study to a new approved application baseline.

The synthetic customer offer is **SYN-PPO-QUO-000142, quotation R02**. The design revision r03 of the source HTML is a separate identity from quotation R02. The offer is prepared for **SYN Riverbend Produce Pty Ltd**, contact **Alison Reid, Operations Manager**, at **SYN Riverbend — Glasshouse 3**. The fictional preparer is **Daniel Moss**. The source issue date is **11 September 2026**; validity ends **11 October 2026 at 23:59:59 AEST**.

The r03 reference names a superseded R01, but its earlier output and response bytes were not supplied. The staff overview states this explicitly. It does not fabricate a historical signed document. The source estimate approval is also absent from r03; the snapshot labels it as not supplied rather than manufacturing an upstream review.

## 4. Staff workspace and navigation

The staff module begins with a local page title, purpose, **Issue snapshot** and **Open customer quotation** actions. The application shell retains ownership of product-level navigation and branding. There is no second app masthead.

The context strip shows the quotation reference and R02, current lifecycle state, revision-required hold when applicable, customer, site, owner and amount. Before a confirmed response, the amount is explicitly the default selection. After acceptance, it is the exact recorded customer response amount. Currency and GST basis remain visible.

| View | Included content and actions |
|---|---|
| Overview | Current issue, open negotiation count, recorded-response count, owned next action, customer/site/contact/validity details, local view event, prior-reference limitation and recent activity |
| Customer quotation | The r03 customer experience in a labelled isolated viewer, with a clear return to the staff workspace |
| Negotiation | Questions and change requests tied to R02 and its hash; owner and due date; answer/disposition; customer confirmation; ES-05 revision-request export |
| Response evidence | Original response operations, attempts and outcomes; exact signature/selection/amount; evidence timestamps; reconciliation/retry; retained activity; supersession/withdrawal and exact HTML download |
| Handover | Readiness or hold, receiving checks, owner and due date, explicit preparation of an ES-07 handover and export of the complete evidence bundle |

The next action responds to actual state. Unknown response outcomes take priority over routine follow-up. Requested revisions return to the preparer. Open questions need a response. A current recorded acceptance leads to preparation of the conversion handover. Closed offers retain their evidence and direct the user to a new controlled issue where necessary.

The issue snapshot opens as a docked inspection panel, 448 px on desktop and full-width on phone. It shows issue identity, source timestamp, customer template provenance, lifecycle, validity, missing upstream evidence and exact output SHA-256. Decisions remain in centred dialogs with reasons and confirmations.

## 5. Customer quotation content

The customer view retains the original navy masthead, corporate logo, clear quotation title, revision/status, issue and validity context, four overview figures, section navigation, content cards and supporting summary.

The included commercial information comprises:

- Customer entity, contact, site/address, quotation reference and fictional preparing contact.
- Eight frozen base commercial lines covering controller hardware, environmental sensing, fertigation, valve interfaces, installation, commissioning, engineering and delivery.
- Weather station and root-zone options, plus a single-choice pump alternative. Only issued selectable offers can change; base amounts and internal pricing are not editable.
- Discount, selected option deltas, subtotal, total excluding GST, illustrative GST and total including GST.
- Supplied equipment specification, configuration and design-basis observations.
- Price basis and adjustment statement, lead time, payment milestones, warranty description, scope of supply/work, exclusions, customer-supplied items, responsibilities and assumptions.
- Supporting-document references and precedence text as supplied in r03.
- Response summary, identity fields, consent, typed signature, final confirmation, decline and printed sample signature treatment.

The default r03 selection totals **AUD 154,566.67 excluding GST**, **AUD 15,456.67 GST**, and **AUD 170,023.34 including GST**. Calculations sum frozen line amounts and permitted option deltas in integer cents, then apply the source’s illustrative tax basis. This does not invoke or establish an estimating or selling-price formula. Source commercial values are retained as a fictional document fixture, not adopted as company pricing policy.

Three supporting documents are named in the source: Terms and Conditions of Supply v4.2, a controller specification v2.1 and a fertigation datasheet 2026-03. Their actual files were not supplied. The customer document continues to display **File not supplied**. The prototype demonstrates response mechanics with the same explicit fictional consent as r03; operational issue and acceptance must require a complete approved evidence pack under the receiving contract.

## 6. Permitted selections and acceptance

Customers can select only members identified by the issued offer. Optional items may be omitted. The pump alternative requires one permitted choice. Unknown member IDs, duplicated selection identities, missing offers and invalid alternatives are rejected by the response model, even if a caller attempts to bypass the visible controls.

Selection changes recompute the displayed total and clear consent. Customer form edits retain entered information; relevant changes require fresh consent. Draft selections and form entries can be retained locally when moving between staff and customer views. Consent is not restored as pre-agreed after a reload.

Acceptance requires a responding name, position, fictional `.example` email, the unchanged customer entity, exact consent text and a typed signature matching the responding name. The customer first sees the r03 final-review dialog with quotation/revision, selected scope and amount. Confirmation sends a local request to the enclosing ES-06 model; it does not directly mark the document accepted.

The receiving model checks quotation identity, issue hash, R02, lifecycle, validity, current unresolved operations, negotiated changes, open questions, permitted selection IDs, independently computed totals, entity, consent and signature. A valid response becomes one original operation with a stable reference. A confirmed Recorded result retains respondent, exact selections and totals, verbatim consent, typed signature, submission and recording timestamps, issue identity and hash.

Viewing the customer page records a local view observation only. No delivery, receipt, acceptance or work authority is inferred from viewing. Signatures are illustrative typed names, not authenticated identity or a claim of legally effective execution.

## 7. Decline and closed offers

A decline captures a reason against the exact revision. Once its outcome is Recorded, the offer is closed to further responses. It does not create an acceptance or conversion handover.

The prototype uses a clearly labelled demonstration clock beginning on 16 September 2026. **Advance beyond validity** moves it to 12 October and closes an unanswered offer. Submission checks evaluate that clock against the exact r03 validity timestamp. Recorded decisions remain retained when time advances. Actual user actions and evidence timestamps use the browser clock and display AEST.

Staff can record supersession or withdrawal with evidence and a reason. These actions close R02 to new responses. They do not create or approve a replacement quotation. Existing response evidence remains attached to R02; a previously prepared handover is explicitly held. A new issue must start without inherited acceptance, signature or consent.

## 8. Clarification and negotiation

A request can be captured within the customer form or by the coordinator from the fictional conversation. Each request keeps its type, text, R02, output hash, capture time, owner and due date. The demo owner is Daniel Moss and the example due date is 18 September 2026.

An information-only answer leaves the issued scope unchanged. The request becomes Answered and needs customer confirmation with an evidence note before it is Resolved. Acceptance remains held while a question is unresolved.

A material change is routed to ES-05. It is retained as **Routed to ES-05**, with the answer/routing reason. The exported revision request includes original identity/hash, request, owner, due date, receiving scope and an explicit statement that acceptance is not inherited. It does not mint a new issue or reprice the offer. A routed change cannot later be silently relabelled as resolved information.

The complete issuing loop remains a receiving integration: review the changed estimate/scope, create the successor, approve and issue through ES-05, then open ES-06 against that new immutable issue. This standalone package demonstrates the boundary and closure behaviour; it does not synchronise records automatically with the separate ES-05 HTML.

## 9. Original-operation recovery

The demonstration controls can produce Recorded, Failed or Unknown outcomes. These are simulated response-store outcomes, not real service calls.

| Outcome | Behaviour |
|---|---|
| Pending | Original payload and operation identity exist; acceptance is not shown as confirmed |
| Recorded | Exact acceptance or decline is retained; a receipt context is supplied only when local saving succeeds |
| Failed | Original payload and evidence remain; the coordinator may explicitly retry that same operation while the issue remains open |
| Unknown | New response and retry are held until the coordinator reconciles the original operation with evidence |

Reconciliation requires a confirmed Recorded or Failed result and a reason/reference. A confirmed failure permits retry with the original operation ID and captured payload; attempt count increases. Duplicate completion and repeated retry of a recorded response are rejected. A pending operation recovered from saved state becomes Unknown.

Late reconciliation may retain an originally submitted response after the quotation has closed. It does not reopen an expired or superseded offer or automatically release its handover. Evidence remains connected to the exact earlier issue.

## 10. Handover to ES-07

The Handover view requires a confirmed acceptance on the current accepted issue, no unresolved response operation, no required revision and no open negotiation. Preparing a handover requires an owner, due date and receiving checks. Preparation is explicit and duplicate preparation is blocked.

The export includes the exact issued HTML, SHA-256, customer projection, acceptance, selected IDs and amounts, typed signature and consent, timestamps, response operations, negotiation history and owned receiving note. Its status is **Prepared — not received or converted**.

ES-07 remains responsible for accepted-item resolution, company/entity mappings, target commercial line validation, conversion authority, partial/unknown target outcomes and duplicate-order prevention. MYOB remains the intended ERP authority. No ERP API, order number, operational programme, work booking or customer confirmation is invented here.

## 11. Persistence, integrity and isolation

The module calculates SHA-256 from the exact adapted customer HTML using UTF-8 bytes. The r03 source file remains unchanged; the local response adapter is part of this newly hashed issue specimen. Runtime response state is separate from those bytes.

The customer iframe is sandboxed with scripts and modal support but without same-origin permission. The parent validates the actual frame window, exact issue hash and revision before processing response messages. This prevents an unrelated frame from being treated as the active specimen; it is not production authentication. A downloaded exact HTML copy opens read-only without the enclosing response context.

Local storage is isolated under the ES-06 module key. Restored data must match the issue, hash and response evidence; altered totals, mismatched receipt content, duplicate operations and incomplete identities cause a recovery hold. Malformed saved data is retained until an explicit reset. The evidence export preserves the current session for review.

A local write failure holds the session and withholds a confirmed customer receipt context. Another tab changing the record also holds further writes and requests a reload. Browser storage and client time are not durable audit, access control or retention services. The fictional data can be cleared or altered outside the UI. An operational implementation needs authenticated access, server authority, transactional persistence, expected-version checks and service-backed receipts.

## 12. Responsive design and declared departures

The staff workspace uses r20’s navy/green palette, Roboto, restrained headings, white panels, named state tags, local page header and supporting context. Phone rules stack supporting content, wrap actions and allow horizontal tab navigation. The docked snapshot becomes a full-width overlay. The customer uses r03’s own responsive and print rules.

| Scoped extension / departure | Reason and status |
|---|---|
| Five staff views | They reflect ES-06’s tasks. The six-view arrangement in ES-05 is not a universal module template |
| Dedicated customer viewport | Keeps the r03 document’s scrolling and responsive container intact; the staff title/context collapse while it is open and an explicit return remains available |
| Local response bridge and persistence | Replaces r03’s page-memory-only response demonstration with exact-operation retention and recovery. It adds no live service |
| Question/change-request action | Added beside r03 response actions using the same form/dialog vocabulary; original customer content and stylesheet remain intact |
| Explicit decline reason and synthetic email validation | Bounded prototype capture rules; operational requirements need a separate business decision |
| Source content and missing attachments | Preserved as supplied and visibly incomplete. No new legal terms, tax policy, attachments or estimate approval are adopted |

These choices are exposed in this report and the design record before any owner baseline acceptance. They do not update the accepted UI baseline register. Later packages must make equivalent scope, layout, reuse and boundary declarations under the [HTML module conformance standard](../../../standards/html-module-conformance.md).

## 13. Verification and review walkthrough

The [response checks](../../../testing/quotation-response-model-check.cjs) execute the actual generated staff script and customer adapter under Node VM with lightweight DOM shims. **24 groups passed**. They cover source/style preservation, all views, actual output hash, exact totals, invalid selections/identity/signature/consent, unknown and failed outcomes, same-operation retry, negotiation routing, decline, expiry, supersession, retained handover, persistence and tamper detection, read-only commands, iframe identity, storage failures and the r03 confirmation-to-response bridge.

The [verification record](../../../testing/quotation-lifecycle-verification.md) records actual file hashes, repository assurance and limitations. These are model and wiring checks, not browser rendering or full business acceptance. The available browser previously rejected local preview URLs under its security policy. No workaround was used, and no native desktop/phone screenshots, visual approval, keyboard/device acceptance or final printed/PDF pagination are claimed.

For owner review:

1. Open the customer quotation and compare its masthead, scope/price, options, specification, terms, summary and signing layout with r03.
2. Change an option, review the total and complete the fictional typed-signature flow. Inspect the exact resulting evidence in the staff view.
3. Reset, select Unknown under demonstration controls, submit again, then reconcile the original operation. Confirm that a second response is held.
4. Reset and create an information question; answer it and record customer confirmation. Separately route a scope change to ES-05 and inspect the revision-request export.
5. Exercise decline, expiry, withdrawal and supersession. Confirm earlier evidence remains, with no automatic successor acceptance.
6. Prepare and export an ES-07 handover from a current confirmed acceptance. Review its missing-attachment and authority checks.

Operational integration, complete approved terms/files, authenticated signing, real notifications, true server expiry, PDF generation, durable retention and ES-05/ES-07 receiving services remain separately scoped work. ES-07 is the next HTML page in the existing sequence once these designs have been reviewed.
